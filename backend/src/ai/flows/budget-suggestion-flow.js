// backend/src/ai/flows/budget-suggestion-flow.js
'use server';
import { ai } from '../genkit.js';
import { z } from 'zod';
import { googleAI } from '@genkit-ai/googleai';

// Esquema de entrada com as transações históricas.
export const BudgetSuggestionInputSchema = z.object({
  transactions: z.string().describe('Um JSON stringified de uma lista de transações dos últimos meses para uma categoria específica.'),
  categoryName: z.string().describe('O nome da categoria para a qual a sugestão de orçamento está sendo feita.'),
});

// Esquema de saída com o valor sugerido e uma justificativa.
export const BudgetSuggestionOutputSchema = z.object({
  suggestedAmount: z.number().describe('O valor de orçamento sugerido pela IA.'),
  justification: z.string().describe('Uma breve explicação sobre como a IA chegou a esse valor.'),
});

const prompt = ai.definePrompt({
  name: 'budgetSuggestionPrompt',
  model: googleAI.model('gemini-1.5-flash'),
  input: { schema: BudgetSuggestionInputSchema },
  output: { schema: BudgetSuggestionOutputSchema },
  prompt: `Você é um planejador financeiro e sua tarefa é ajudar um usuário a definir um orçamento realista.

Analise a lista de transações de despesa para a categoria "{{categoryName}}" dos últimos 3 meses:
{{{transactions}}}

Calcule a média de gastos mensais para esta categoria.
Com base na média, sugira um valor de orçamento mensal (suggestedAmount). Arredonde o valor para um número razoável (ex: R$ 483 pode virar R$ 500).
Forneça uma justificativa curta e amigável (justification) explicando o porquê da sugestão.
Se não houver gastos, sugira um valor inicial baixo e explique que é um ponto de partida.`,
});

export const budgetSuggestionFlow = ai.defineFlow(
  {
    name: 'budgetSuggestionFlow',
    inputSchema: BudgetSuggestionInputSchema,
    outputSchema: BudgetSuggestionOutputSchema,
  },
  async (input) => {
    const llmResponse = await prompt(input);
    const output = llmResponse.output;

    if (!output || typeof output.suggestedAmount !== 'number') {
      console.error("IA não retornou um valor de orçamento válido:", output);
      // Fallback em caso de falha da IA
      return { suggestedAmount: 100, justification: 'Como não houve gastos recentes, sugerimos um valor inicial baixo para começar a acompanhar.' };
    }
    return output;
  }
);
