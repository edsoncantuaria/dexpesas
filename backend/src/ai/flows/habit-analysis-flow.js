// backend/src/ai/flows/habit-analysis-flow.js
import { ai } from '../genkit.js';
import { z } from 'zod';
import { googleAI } from '@genkit-ai/googleai';

export const HabitAnalysisInputSchema = z.object({
  transactions: z.string().describe('Um JSON stringified de uma lista de transações de despesa do usuário.'),
  profile: z.string().describe('Um JSON stringified do perfil de gamificação do usuário.'),
  goals: z.string().describe('Um JSON stringified das metas financeiras ativas do usuário.'),
});

export const HabitAnalysisOutputSchema = z.object({
  analysis: z.string().describe('Uma análise textual dos hábitos de consumo, destacando pontos negativos e sugestões de melhoria.'),
  relevantTransactionIds: z.array(z.string()).optional().describe('Uma lista de IDs das 3 a 5 transações mais relevantes que sustentam a análise.'),
});

const prompt = ai.definePrompt({
  name: 'habitAnalysisPrompt',
  model: googleAI.model('gemini-1.5-flash'),
  input: { schema: HabitAnalysisInputSchema },
  output: { schema: HabitAnalysisOutputSchema },
  prompt: `Você é um coach financeiro empático e perspicaz. Sua missão é analisar os dados de um usuário para ajudá-lo a entender seus hábitos de consumo e como eles impactam seus objetivos.

Dados do Usuário:
- Perfil (Nível, XP, Atributos de gastos): {{{profile}}}
- Metas Financeiras Ativas: {{{goals}}}
- Transações de Despesa Recentes: {{{transactions}}}

Sua Análise (campo 'analysis'):
1.  **Tom Humanizado:** Comece com uma saudação amigável e um tom encorajador. Reconheça o esforço do usuário em acompanhar suas finanças.
2.  **Identifique o Hábito Principal:** Analise as transações e identifique a categoria ou tipo de gasto que mais está impactando negativamente os "pontos" de atributos do usuário ou o distanciando de suas metas. Foque em UM, no máximo dois, padrões claros.
3.  **Conecte com Metas:** Se possível, conecte diretamente o hábito de consumo a uma das metas do usuário. Exemplo: "Notei que seus gastos com 'Lazer' somaram R$X este mês. Esse valor poderia representar um avanço significativo na sua meta 'Viagem dos Sonhos'!".
4.  **Dê Conselhos Práticos e Positivos:** Ofereça 1 ou 2 dicas práticas e realistas para ajudar o usuário a melhorar. Evite linguagem de culpa. Em vez de "Você gasta demais", prefira "Que tal se desafiar a reduzir os pedidos de comida em 20% na próxima semana?".
5.  **Finalize com Motivação:** Encerre com uma frase motivacional, reforçando que pequenas mudanças criam grandes resultados.

Transações Relevantes (campo 'relevantTransactionIds'):
- Com base na sua análise, identifique de 3 a 5 transações específicas que melhor exemplificam o hábito que você destacou.
- Retorne apenas os IDs dessas transações no array 'relevantTransactionIds'.

Seja conciso, amigável e foque em fornecer valor real e acionável.`,
});

export const habitAnalysisFlow = ai.defineFlow(
  {
    name: 'habitAnalysisFlow',
    inputSchema: HabitAnalysisInputSchema,
    outputSchema: HabitAnalysisOutputSchema,
  },
  async (input) => {
    const llmResponse = await prompt(input);
    if (!llmResponse.output) {
      throw new Error('A IA não conseguiu gerar a análise de hábitos.');
    }
    return llmResponse.output;
  }
);
