'use server';

/**
 * @fileOverview A flow for predicting if a user will meet their financial goals.
 *
 * - predictGoalAchievement - A function that analyzes user data to predict goal success.
 * - PredictiveAnalysisInput - The input type for the predictGoalAchievement function.
 * - PredictiveAnalysisOutput - The return type for the predictGoalAchievement function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const TransactionSchema = z.object({
  type: z.enum(['deposit', 'withdrawal']),
  amount: z.number(),
  timestamp: z.string().describe('ISO 8601 date string'),
});

const PredictiveAnalysisInputSchema = z.object({
  income: z.number().describe("The user's monthly income."),
  totalSavings: z.number().describe("The user's current total savings."),
  savingGoal: z.number().describe('The financial goal the user wants to achieve.'),
  goalDeadline: z.string().describe('The deadline for the goal in ISO 8601 date format (e.g., YYYY-MM-DD).'),
  transactions: z.array(TransactionSchema).describe('A list of recent transactions for the user.'),
});
export type PredictiveAnalysisInput = z.infer<typeof PredictiveAnalysisInputSchema>;

const PredictiveAnalysisOutputSchema = z.object({
  willMeetGoal: z.boolean().describe('Whether the user is predicted to meet their savings goal on time.'),
  predictionMessage: z.string().describe('A concise, encouraging, or advisory message explaining the prediction. For example: "You\'re on track to meet your goal!" or "You might need to increase your savings rate to reach your goal on time."'),
});
export type PredictiveAnalysisOutput = z.infer<typeof PredictiveAnalysisOutputSchema>;


export async function predictGoalAchievement(
  input: PredictiveAnalysisInput
): Promise<PredictiveAnalysisOutput> {
  return predictiveGoalAnalysisFlow(input);
}

const prompt = ai.definePrompt({
  name: 'predictiveGoalAnalysisPrompt',
  input: {schema: PredictiveAnalysisInputSchema},
  output: {schema: PredictiveAnalysisOutputSchema},
  prompt: `You are an AI financial analyst. Your task is to predict whether a user will meet their savings goal based on their past behavior and current financial situation.

  User's Financial Data:
  - Monthly Income: {{{income}}}
  - Current Savings: {{{totalSavings}}}
  - Savings Goal: {{{savingGoal}}}
  - Goal Deadline: {{{goalDeadline}}}

  Recent Transactions:
  {{#each transactions}}
  - Type: {{{this.type}}}, Amount: {{{this.amount}}}, Date: {{{this.timestamp}}}
  {{/each}}

  Analyze the data to calculate the required savings rate versus the user's actual savings rate.
  Based on this analysis, determine if they are on track to meet their goal by the deadline.

  Set 'willMeetGoal' to true if they are on track, and false otherwise.
  Provide a concise 'predictionMessage' that is either encouraging if they are on track, or offers gentle advice if they are falling behind.`,
});

const predictiveGoalAnalysisFlow = ai.defineFlow(
  {
    name: 'predictiveGoalAnalysisFlow',
    inputSchema: PredictiveAnalysisInputSchema,
    outputSchema: PredictiveAnalysisOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
