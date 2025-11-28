'use server';

/**
 * @fileOverview This file defines the Genkit flow for providing AI financial advice.
 *
 * It includes:
 * - aiFinancialAdvice: The main function to request financial advice.
 * - AIFinancialAdviceInput: The input type for the function.
 * - AIFinancialAdviceOutput: The output type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AIFinancialAdviceInputSchema = z.object({
  query: z.string().describe('The user query for financial advice.'),
  userData: z.object({
    age: z.number().describe('The user\u2019s age.'),
    income: z.number().describe('The user\u2019s income.'),
    savingPlan: z.string().describe('The user\u2019s saving plan type (weekly, monthly, yearly).'),
    totalSavings: z.number().describe('The user\u2019s total savings.'),
  }).describe('User data to tailor the advice.'),
});

export type AIFinancialAdviceInput = z.infer<typeof AIFinancialAdviceInputSchema>;

const AIFinancialAdviceOutputSchema = z.object({
  advice: z.string().describe('The personalized financial advice.'),
});

export type AIFinancialAdviceOutput = z.infer<typeof AIFinancialAdviceOutputSchema>;

export async function aiFinancialAdvice(input: AIFinancialAdviceInput): Promise<AIFinancialAdviceOutput> {
  return aiFinancialAdviceFlow(input);
}

const prompt = ai.definePrompt({
  name: 'aiFinancialAdvicePrompt',
  input: {schema: AIFinancialAdviceInputSchema},
  output: {schema: AIFinancialAdviceOutputSchema},
  prompt: `You are a financial advisor. Provide personalized advice based on the user's query and data.\n\nUser Query: {{{query}}}\nUser Data: Age: {{{userData.age}}}, Income: {{{userData.income}}}, Saving Plan: {{{userData.savingPlan}}}, Total Savings: {{{userData.totalSavings}}}`,
});

const aiFinancialAdviceFlow = ai.defineFlow(
  {
    name: 'aiFinancialAdviceFlow',
    inputSchema: AIFinancialAdviceInputSchema,
    outputSchema: AIFinancialAdviceOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);

    