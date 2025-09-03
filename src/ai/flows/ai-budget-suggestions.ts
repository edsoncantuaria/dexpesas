'use server';

/**
 * @fileOverview This file defines a Genkit flow for providing AI-powered budget suggestions based on user's spending habits.
 *
 * - getBudgetSuggestions - A function that takes expense data and returns budget adjustment suggestions.
 * - BudgetSuggestionsInput - The input type for the getBudgetSuggestions function.
 * - BudgetSuggestionsOutput - The return type for the getBudgetSuggestions function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const BudgetSuggestionsInputSchema = z.object({
  income: z.number().describe('The user\u2019s monthly income.'),
  expenses: z.array(
    z.object({
      category: z.string().describe('The category of the expense.'),
      amount: z.number().describe('The amount spent on the expense.'),
    })
  ).describe('A list of expenses with their categories and amounts.'),
});
export type BudgetSuggestionsInput = z.infer<typeof BudgetSuggestionsInputSchema>;

const BudgetSuggestionsOutputSchema = z.object({
  suggestions: z.array(
    z.object({
      category: z.string().describe('The category to adjust.'),
      suggestion: z.string().describe('The suggestion for budget adjustment.'),
      potentialSavings: z.number().optional().describe('The potential savings from the adjustment.'),
    })
  ).describe('A list of budget adjustment suggestions.'),
});
export type BudgetSuggestionsOutput = z.infer<typeof BudgetSuggestionsOutputSchema>;

export async function getBudgetSuggestions(input: BudgetSuggestionsInput): Promise<BudgetSuggestionsOutput> {
  return budgetSuggestionsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'budgetSuggestionsPrompt',
  input: {schema: BudgetSuggestionsInputSchema},
  output: {schema: BudgetSuggestionsOutputSchema},
  prompt: `You are a personal finance advisor. Analyze the user's income and expenses and provide suggestions on how to adjust their budget to save money.

Income: {{income}}
Expenses:
{{#each expenses}}
- Category: {{category}}, Amount: {{amount}}
{{/each}}

Provide specific, actionable suggestions for each category where savings are possible.  Include a potentialSavings estimate if possible.
Format your response as a JSON array of objects, where each object has a category, suggestion, and potentialSavings field.
`,
});

const budgetSuggestionsFlow = ai.defineFlow(
  {
    name: 'budgetSuggestionsFlow',
    inputSchema: BudgetSuggestionsInputSchema,
    outputSchema: BudgetSuggestionsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
