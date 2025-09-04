// src/ai/flows/transaction-search-flow.ts
'use server';
/**
 * @fileOverview Fluxo de IA para pesquisar e filtrar transações com base em linguagem natural.
 *
 * - searchTransactionsFlow - Função que interpreta uma consulta de texto e a converte em filtros estruturados.
 * - SearchTransactionsInput - O tipo de entrada para o fluxo.
 * - SearchTransactionsOutput - O tipo de retorno para o fluxo.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit/zod';

// Esquema de entrada para o fluxo
const SearchTransactionsInputSchema = z.object({
  query: z.string().describe('A consulta de pesquisa em linguagem natural do usuário.'),
});
export type SearchTransactionsInput = z.infer<typeof SearchTransactionsInputSchema>;

// Esquema de saída, que representa os filtros a serem aplicados
const SearchTransactionsOutputSchema = z.object({
  text: z.string().optional().describe('Texto extraído para busca direta na descrição.'),
  categories: z.array(z.string()).optional().describe('Uma lista de nomes de categorias para filtrar.'),
  accounts: z.array(z.string()).optional().describe('Uma lista de IDs de contas para filtrar.'),
  cards: z.array(z.string()).optional().describe('Uma lista de IDs de cartões para filtrar.'),
  methods: z.array(z.string()).optional().describe("Uma lista de métodos de pagamento para filtrar, valores possíveis: ['credito', 'debito', 'pix', 'dinheiro']."),
  type: z.enum(['receita', 'despesa']).optional().describe("O tipo de transação para filtrar."),
});
export type SearchTransactionsOutput = z.infer<typeof SearchTransactionsOutputSchema>;


/**
 * Função pública que invoca o fluxo de busca de transações.
 * @param input A consulta do usuário.
 * @returns Os filtros estruturados.
 */
export async function searchTransactionsFlow(input: SearchTransactionsInput): Promise<SearchTransactionsOutput> {
  return searchTransactionsFlowInternal(input);
}


// Definição do prompt para a IA
const searchPrompt = ai.definePrompt({
  name: 'searchTransactionsPrompt',
  input: { schema: SearchTransactionsInputSchema },
  output: { schema: SearchTransactionsOutputSchema },
  prompt: `Você é um assistente especialista em finanças. Sua tarefa é analisar a consulta de pesquisa de um usuário e extrair filtros estruturados para encontrar transações financeiras.

Consulta do Usuário: "{{query}}"

Analise a consulta e preencha os seguintes campos do JSON de saída:
- text: Qualquer termo de pesquisa geral para a descrição (ex: "iFood", "Uber").
- categories: Uma lista de categorias de despesas ou receitas (ex: ["Alimentacao", "Transporte"]).
- accounts: Se a consulta mencionar um banco ou conta específica, forneça o ID da conta.
- cards: Se a consulta mencionar um cartão específico (ex: "Nubank", "Inter"), forneça o ID do cartão.
- methods: Se a consulta mencionar um método de pagamento, use um dos seguintes: 'credito', 'debito', 'pix', 'dinheiro'.
- type: Se a consulta especificar "gastos", "despesas" ou similar, use 'despesa'. Se especificar "ganhos", "receitas", use 'receita'.

Se um campo não for mencionado na consulta, omita-o do JSON de saída.
`,
});

// Definição do fluxo do Genkit
const searchTransactionsFlowInternal = ai.defineFlow(
  {
    name: 'searchTransactionsFlow',
    inputSchema: SearchTransactionsInputSchema,
    outputSchema: SearchTransactionsOutputSchema,
  },
  async (input) => {
    const llmResponse = await searchPrompt(input);
    const output = llmResponse.output;
    if (!output) {
      throw new Error('A resposta da IA foi inválida.');
    }
    return output;
  }
);
