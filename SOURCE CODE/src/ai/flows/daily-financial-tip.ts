'use server';

/**
 * @fileOverview A flow for generating a daily financial tip.
 *
 * - getDailyFinancialTip - A function that retrieves a random, concise financial tip.
 * - DailyFinancialTipOutput - The return type for the getDailyFinancialTip function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const DailyFinancialTipOutputSchema = z.object({
  tip: z.string().describe('A single, concise, and actionable financial tip for the day. Make it unique and interesting. For example: "Automate a small weekly transfer to your savings account. You won\'t miss it, but it adds up!"'),
});
export type DailyFinancialTipOutput = z.infer<typeof DailyFinancialTipOutputSchema>;

export async function getDailyFinancialTip(): Promise<DailyFinancialTipOutput> {
  return dailyFinancialTipFlow();
}

const prompt = ai.definePrompt({
  name: 'dailyFinancialTipPrompt',
  output: {schema: DailyFinancialTipOutputSchema},
  prompt: `You are an AI assistant that provides a unique, actionable, and concise financial tip of the day.`,
});

const dailyFinancialTipFlow = ai.defineFlow(
  {
    name: 'dailyFinancialTipFlow',
    outputSchema: DailyFinancialTipOutputSchema,
  },
  async () => {
    const {output} = await prompt();
    return output!;
  }
);
