// src/ai/flows/category-suggestion-flow.ts
'use server';
/**
 * @fileOverview Fluxo de IA para sugerir uma categoria para uma transação.
 * 
 * - suggestCategory - Função que recebe uma descrição e sugere uma categoria.
 * - SuggestCategoryInput - O tipo de entrada para o fluxo.
 * - SuggestCategoryOutput - O tipo de retorno para o fluxo.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

// Lista de categorias válidas. A IA deve escolher uma destas.
const validCategories = [
  'Alimentacao',
  'Lazer',
  'Transporte',
  'Investimentos',
  'Vicios',
  'Moradia',
  'Saude',
  'Educacao',
  'Compras',
];

const SuggestCategoryInputSchema = z.object({
  description: z.string().describe('A descrição da transação financeira.'),
});
export type SuggestCategoryInput = z.infer<typeof SuggestCategoryInputSchema>;

const SuggestCategoryOutputSchema = z.object({
  category: z.enum(validCategories as [string, ...string[]]).describe('A categoria sugerida para a transação.'),
});
export type SuggestCategoryOutput = z.infer<typeof SuggestCategoryOutputSchema>;

/**
 * Função pública que invoca o fluxo de sugestão de categoria.
 * @param input A descrição da transação.
 * @returns A categoria sugerida.
 */
export async function suggestCategory(input: SuggestCategoryInput): Promise<SuggestCategoryOutput> {
    return suggestCategoryFlow(input);
}


const prompt = ai.definePrompt({
  name: 'suggestCategoryPrompt',
  input: { schema: SuggestCategoryInputSchema },
  output: { schema: SuggestCategoryOutputSchema },
  prompt: `Analise a seguinte descrição de transação e sugira a categoria mais apropriada.
  
Descrição: "{{description}}"

As categorias válidas são: ${validCategories.join(', ')}.

Responda apenas com o nome da categoria em formato JSON. Por exemplo, se a descrição for "Almoço no restaurante", a categoria apropriada seria "Alimentacao".`,
});


const suggestCategoryFlow = ai.defineFlow(
  {
    name: 'suggestCategoryFlow',
    inputSchema: SuggestCategoryInputSchema,
    outputSchema: SuggestCategoryOutputSchema,
  },
  async (input) => {
    const llmResponse = await prompt(input);
    const output = llmResponse.output;

    if (!output || !validCategories.includes(output.category)) {
      console.error("Categoria inválida ou não retornada pela IA:", output?.category);
      // Fallback para uma categoria genérica ou lança um erro
      return { category: 'Compras' }; 
    }
    return output;
  }
);
