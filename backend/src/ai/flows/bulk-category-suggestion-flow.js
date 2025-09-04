// backend/src/ai/flows/bulk-category-suggestion-flow.js
'use server';
import { ai } from '../genkit.js';
import { z } from 'zod';
import { googleAI } from '@genkit-ai/googleai';

// Lista de Nomes (labels amigáveis) das categorias de DESPESA válidas. A IA deve escolher uma destas.
const validExpenseCategoryLabels = [
    'Alimentação', 'Assinaturas e Serviços', 'Bares e Restaurantes', 'Casa', 'Compras',
    'Cuidados Pessoais', 'Dívidas e Empréstimos', 'Educação', 'Família e Filhos',
    'Impostos e Taxas', 'Lazer e Hobbies', 'Mercado', 'Outros', 'Pets',
    'Presentes e Doações', 'Roupas', 'Saúde', 'Trabalho', 'Transporte', 'Viagem', 'Vícios'
];

// Mapeamento de Label para Nome Interno (camelCase)
const labelToNameMap = {
    'Alimentação': 'Alimentacao', 'Assinaturas e Serviços': 'AssinaturasEServicos', 'Bares e Restaurantes': 'BaresERestaurantes',
    'Casa': 'Casa', 'Compras': 'Compras', 'Cuidados Pessoais': 'CuidadosPessoais', 'Dívidas e Empréstimos': 'DividasEEmprestimos',
    'Educação': 'Educacao', 'Família e Filhos': 'FamiliaEFilhos', 'Impostos e Taxas': 'ImpostosETaxas', 'Lazer e Hobbies': 'LazerEHobbies',
    'Mercado': 'Mercado', 'Outros': 'Outros', 'Pets': 'Pets', 'Presentes e Doações': 'PresentesEDoacoes',
    'Roupas': 'Roupas', 'Saúde': 'Saude', 'Trabalho': 'Trabalho', 'Transporte': 'Transporte', 'Viagem': 'Viagem', 'Vícios': 'Vicios'
};

// Esquema de entrada: uma lista de transações com ID e descrição.
export const BulkSuggestCategoryInputSchema = z.object({
  transactions: z.string().describe('Um JSON stringified de um array de objetos, cada um com `id` e `description`.'),
});

// Esquema de saída: um mapa de ID da transação para o nome da categoria.
export const BulkSuggestCategoryOutputSchema = z.record(z.string());

const prompt = ai.definePrompt({
  name: 'bulkSuggestCategoryPrompt',
  model: googleAI.model('gemini-1.5-flash'),
  input: { schema: BulkSuggestCategoryInputSchema },
  output: { schema: BulkSuggestCategoryOutputSchema },
  prompt: `Você é um especialista em categorização de despesas.
Analise a lista de transações de despesa em formato JSON abaixo.
Para cada transação, sugira a categoria mais apropriada.

Transações:
{{{transactions}}}

As categorias válidas são: ${validExpenseCategoryLabels.join(', ')}.

Sua resposta DEVE ser um objeto JSON onde cada chave é o 'id' da transação original
e o valor é o NOME AMIGÁVEL da categoria sugerida (ex: "Alimentação", "Transporte").

Exemplo de resposta:
{
  "tx1": "Mercado",
  "tx2": "Transporte",
  "tx3": "Bares e Restaurantes"
}
`,
});

export const bulkSuggestCategoryFlow = ai.defineFlow(
  {
    name: 'bulkSuggestCategoryFlow',
    inputSchema: BulkSuggestCategoryInputSchema,
    outputSchema: BulkSuggestCategoryOutputSchema,
  },
  async (input) => {
    const llmResponse = await prompt(input);
    const output = llmResponse.output;

    if (!output) {
      console.error("A IA não retornou um mapa de categorias válido.");
      return {};
    }
    
    // Converte os labels amigáveis recebidos da IA para os nomes internos (camelCase)
    const convertedOutput = {};
    for (const txId in output) {
        const friendlyLabel = output[txId];
        convertedOutput[txId] = labelToNameMap[friendlyLabel] || 'Outros';
    }

    return convertedOutput;
  }
);
