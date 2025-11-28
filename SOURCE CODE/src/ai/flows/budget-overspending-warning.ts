'use server';

/**
 * @fileOverview A flow for generating a warning message if a user is overspending.
 *
 * - getBudgetOverspendingWarning - A function that checks transaction data against income and returns a warning if necessary.
 * - BudgetWarningInput - The input type for the getBudgetOverspendingWarning function.
 * - BudgetWarningOutput - The return type for the getBudgetOverspendingWarning function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const TransactionSchema = z.object({
  type: z.enum(['deposit', 'withdrawal']),
  amount: z.number(),
  timestamp: z.string().describe('ISO 8601 date string'),
});

const BudgetWarningInputSchema = z.object({
  income: z.number().describe('The user\'s monthly income.'),
  transactions: z.array(TransactionSchema).describe('A list of recent transactions for the user.'),
});
export type BudgetWarningInput = z.infer<typeof BudgetWarningInputSchema>;

const BudgetWarningOutputSchema = z.object({
  isOverspending: z.boolean().describe('Whether the user is determined to be overspending.'),
  warningMessage: z.string().describe('A concise and helpful warning message for the user if they are overspending. Empty string if they are not.'),
});
export type BudgetWarningOutput = z.infer<typeof BudgetWarningOutputSchema>;

export async function getBudgetOverspendingWarning(
  input: BudgetWarningInput
): Promise<BudgetWarningOutput> {
  return budgetOverspendingWarningFlow(input);
}

const prompt = ai.definePrompt({
  name: 'budgetOverspendingWarningPrompt',
  input: {schema: BudgetWarningInputSchema},
  output: {schema: BudgetWarningOutputSchema},
  prompt: `You are an AI financial assistant. Analyze the user's recent transactions and monthly income to determine if they are overspending.
  
  User's monthly income: {{{income}}}
  
  Recent Transactions:
  {{#each transactions}}
  - Type: {{{this.type}}}, Amount: {{{this.amount}}}, Date: {{{this.timestamp}}}
  {{/each}}
  
  A user is overspending if their withdrawals in the last 30 days are significantly higher than their deposits, or if their spending is unsustainable given their income.
  
  If they are overspending, set isOverspending to true and provide a short, helpful warningMessage.
  If they are not overspending, set isOverspending to false and warningMessage to an empty string.`,
});

const budgetOverspendingWarningFlow = ai.defineFlow(
  {
    name: 'budgetOverspendingWarningFlow',
    inputSchema: BudgetWarningInputSchema,
    outputSchema: BudgetWarningOutputSchema,
  },
  async input => {
    // Ensure we only look at transactions from the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentTransactions = input.transactions.filter(t => new Date(t.timestamp) > thirtyDaysAgo);

    if (recentTransactions.length === 0) {
        return { isOverspending: false, warningMessage: '' };
    }

    const {output} = await prompt({ ...input, transactions: recentTransactions });
    return output!;
  }
);