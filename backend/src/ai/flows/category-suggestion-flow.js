
// backend/src/ai/flows/category-suggestion-flow.js
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
    'Alimentação': 'Alimentacao',
    'Assinaturas e Serviços': 'AssinaturasEServicos',
    'Bares e Restaurantes': 'BaresERestaurantes',
    'Casa': 'Casa',
    'Compras': 'Compras',
    'Cuidados Pessoais': 'CuidadosPessoais',
    'Dívidas e Empréstimos': 'DividasEEmprestimos',
    'Educação': 'Educacao',
    'Família e Filhos': 'FamiliaEFilhos',
    'Impostos e Taxas': 'ImpostosETaxas',
    'Lazer e Hobbies': 'LazerEHobbies',
    'Mercado': 'Mercado',
    'Outros': 'Outros',
    'Pets': 'Pets',
    'Presentes e Doações': 'PresentesEDoacoes',
    'Roupas': 'Roupas',
    'Saúde': 'Saude',
    'Trabalho': 'Trabalho',
    'Transporte': 'Transporte',
    'Viagem': 'Viagem',
    'Vícios': 'Vicios'
};


export const SuggestCategoryInputSchema = z.object({
  description: z.string().describe('A descrição da transação de despesa.'),
});

export const SuggestCategoryOutputSchema = z.object({
  category: z.string().describe('O nome interno (camelCase) da categoria de despesa sugerida.'),
});

// Prompt otimizado para que a IA retorne o NOME AMIGÁVEL.
const prompt = ai.definePrompt({
  name: 'suggestCategoryPrompt',
  model: googleAI.model('gemini-1.5-flash'),
  input: { schema: SuggestCategoryInputSchema },
  // A saída da IA será um label amigável
  output: { schema: z.object({ categoryLabel: z.enum(validExpenseCategoryLabels) }) },
  prompt: `Analise a seguinte descrição de transação de despesa e sugira a categoria mais apropriada.
Descrição: "{{description}}"
As categorias de despesa válidas são: ${validExpenseCategoryLabels.join(', ')}.
Responda apenas com o nome da categoria em formato JSON.`,
});

// Fluxo que encapsula a chamada ao prompt e faz a conversão do label para o nome interno.
export const suggestCategoryFlow = ai.defineFlow(
  {
    name: 'suggestCategoryFlow',
    inputSchema: SuggestCategoryInputSchema,
    outputSchema: SuggestCategoryOutputSchema,
  },
  async (input) => {
    const llmResponse = await prompt(input);
    const output = llmResponse.output;

    // Fallback: Se a IA não retornar um label válido, define como 'Outros'
    if (!output || !validExpenseCategoryLabels.includes(output.categoryLabel)) {
      console.error("Label de categoria inválido ou não retornado pela IA:", output?.categoryLabel);
      return { category: 'Outros' }; 
    }
    
    // Converte o label amigável para o nome interno camelCase
    const categoryName = labelToNameMap[output.categoryLabel] || 'Outros';

    return { category: categoryName };
  }
);
