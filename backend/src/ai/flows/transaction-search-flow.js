// backend/src/ai/flows/transaction-search-flow.js
import { ai } from '../genkit.js';
import { z } from 'zod';
import { googleAI } from '@genkit-ai/googleai';

export const SearchTransactionsInputSchema = z.object({
  query: z.string().describe('A consulta de pesquisa em linguagem natural do usuário.'),
});

// Lista completa de Nomes Internos (camelCase) para a IA conhecer.
const allCategoryNames = [
    'Alimentacao', 'AssinaturasEServicos', 'BaresERestaurantes', 'Casa', 'Compras',
    'CuidadosPessoais', 'DividasEEmprestimos', 'Educacao', 'FamiliaEFilhos',
    'ImpostosETaxas', 'LazerEHobbies', 'Mercado', 'Outros', 'Pets',
    'PresentesEDoacoes', 'Roupas', 'Saude', 'Trabalho', 'Transporte', 'Viagem', 'Vicios',
    'Emprestimos', 'Investimentos', 'OutrasReceitas', 'Salario', 'Venda'
];

export const SearchTransactionsOutputSchema = z.object({
  text: z.string().optional().describe('Texto extraído para busca direta na descrição.'),
  categories: z.array(z.string()).optional().describe('Uma lista de nomes de categorias para filtrar (deve ser um dos nomes internos).'),
  type: z.enum(['receita', 'despesa']).optional().describe("O tipo de transação para filtrar."),
  value_greater_than: z.number().optional().describe('Filtrar transações com valor maior que o especificado.'),
  value_less_than: z.number().optional().describe('Filtrar transações com valor menor que o especificado.'),
  start_date: z.string().optional().describe('A data de início do período no formato YYYY-MM-DD.'),
  end_date: z.string().optional().describe('A data de fim do período no formato YYYY-MM-DD.'),
});

const prompt = ai.definePrompt({
  name: 'searchTransactionsPrompt',
  model: googleAI.model('gemini-1.5-flash'),
  input: { schema: SearchTransactionsInputSchema },
  output: { schema: SearchTransactionsOutputSchema },
  prompt: `Você é um assistente especialista em finanças. Sua tarefa é analisar a consulta de pesquisa de um usuário e extrair filtros estruturados para encontrar transações.

Consulta: "{{query}}"

Analise a consulta e preencha os campos do JSON de saída. Se um campo não for mencionado, omita-o.
- Extraia termos de busca para o campo 'text' (ex: 'almoço', 'iFood', 'Uber').
- Identifique categorias. As categorias possíveis (nomes internos) são: ${allCategoryNames.join(', ')}. Responda com o nome interno (camelCase).
- Se a consulta mencionar um período (ex: "mês passado", "últimos 7 dias", "em 2023", "em janeiro"), preencha 'start_date' e 'end_date'.
- Se a consulta mencionar valores (ex: "acima de R$100", "gastos menores que 50"), preencha 'value_greater_than' ou 'value_less_than'.
- Se a consulta mencionar "gastos" ou "despesas", defina 'type' como 'despesa'. Se mencionar "ganhos" ou "receitas", defina como 'receita'.
- HOJE É: ${new Date().toISOString().split('T')[0]}`,
});

export const searchTransactionsFlow = ai.defineFlow(
  {
    name: 'searchTransactionsFlow',
    inputSchema: SearchTransactionsInputSchema,
    outputSchema: SearchTransactionsOutputSchema,
  },
  async (input) => {
    const llmResponse = await prompt(input);
    if (!llmResponse.output) {
      throw new Error('A resposta da IA foi inválida.');
    }
    return llmResponse.output;
  }
);
