'use server';

/**
 * @fileOverview A flow for providing personalized investment tips based on user data.
 *
 * - getPersonalizedInvestmentTips - A function that retrieves personalized investment tips.
 * - InvestmentTipsInput - The input type for the getPersonalizedInvestmentTips function.
 * - InvestmentTipsOutput - The return type for the getPersonalizedInvestmentTips function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const InvestmentTipsInputSchema = z.object({
  savingPlan: z
    .enum(['weekly', 'monthly', 'yearly'])
    .describe('The user saving plan type.'),
  age: z.number().describe('The user age.'),
  income: z.number().describe('The user income.'),
});
export type InvestmentTipsInput = z.infer<typeof InvestmentTipsInputSchema>;

const InvestmentTipsOutputSchema = z.object({
  tips: z.string().describe('Personalized investment tips for the user. Provide at least 3 distinct tips in a markdown list format.'),
});
export type InvestmentTipsOutput = z.infer<typeof InvestmentTipsOutputSchema>;

export async function getPersonalizedInvestmentTips(
  input: InvestmentTipsInput
): Promise<InvestmentTipsOutput> {
  return personalizedInvestmentTipsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'personalizedInvestmentTipsPrompt',
  input: {schema: InvestmentTipsInputSchema},
  output: {schema: InvestmentTipsOutputSchema},
  prompt: `You are an AI financial advisor for Pesa Path, a financial app popular in East Africa.

  Based on the user's saving plan ({{{savingPlan}}}), age ({{{age}}}), and income in UGX ({{{income}}}), provide at least 3 personalized investment tips tailored to their financial profile.
  Consider their risk tolerance (younger users with higher income can take more risk).
  Suggest a mix of local (Ugandan/East African) and international investment options where applicable.
  Keep the tips concise, actionable, and easy to understand. Present the tips as a markdown bulleted list.

  Investment Tips: `,
});

const personalizedInvestmentTipsFlow = ai.defineFlow(
  {
    name: 'personalizedInvestmentTipsFlow',
    inputSchema: InvestmentTipsInputSchema,
    outputSchema: InvestmentTipsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
