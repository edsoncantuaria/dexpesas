// backend/src/ai/flows/opportunity-analysis-flow.js
import { ai } from '../genkit.js';
import { z } from 'zod';
import { googleAI } from '@genkit-ai/googleai';

export const OpportunityAnalysisInputSchema = z.object({
  transactions: z.string().describe('Um JSON stringified de uma lista de transações do usuário.'),
  profile: z.string().describe('Um JSON stringified do perfil de gamificação do usuário.'),
  goals: z.string().describe('Um JSON stringified das metas financeiras ativas do usuário.'),
});

export const OpportunityAnalysisOutputSchema = z.object({
  analysis: z.string().describe('Uma análise textual das oportunidades financeiras, destacando pontos fortes e como acelerar o crescimento.'),
  relevantTransactionIds: z.array(z.string()).optional().describe('Uma lista de IDs das 3 a 5 transações mais relevantes que sustentam a análise (ex: aportes em metas, receitas inesperadas).'),
});

const prompt = ai.definePrompt({
  name: 'opportunityAnalysisPrompt',
  model: googleAI.model('gemini-1.5-flash'),
  input: { schema: OpportunityAnalysisInputSchema },
  output: { schema: OpportunityAnalysisOutputSchema },
  prompt: `Você é um coach financeiro otimista e estratégico. Sua missão é analisar os dados de um usuário para identificar seus pontos fortes e encontrar oportunidades claras para ele acelerar seu crescimento financeiro.

Dados do Usuário:
- Perfil (Nível, XP, Atributos): {{{profile}}}
- Metas Financeiras Ativas: {{{goals}}}
- Transações Recentes: {{{transactions}}}

Sua Análise (campo 'analysis'):
1.  **Tom Positivo:** Comece celebrando uma vitória ou um ponto forte claro do usuário. Exemplo: "Parabéns pelo seu controle nos gastos com moradia!" ou "Excelente! Vi que você fez um aporte na sua meta este mês!".
2.  **Identifique o Ponto Forte:** Analise os dados e encontre 1 ou 2 áreas onde o usuário está se saindo bem. Pode ser uma categoria de despesa bem controlada, uma receita inesperada, ou aportes consistentes em metas ou investimentos.
3.  **Sugira a Oportunidade:** Com base no ponto forte, sugira uma oportunidade clara e acionável. A oportunidade deve ser uma forma de "dobrar a aposta" no que já está dando certo. Exemplo: Se ele controlou bem os gastos com 'Lazer', sugira: "Que tal usar parte dessa economia para fazer um aporte extra na sua meta 'Reserva de Emergência'? Isso aceleraria muito seu progresso!".
4.  **Seja Inspirador:** Use uma linguagem que motive e mostre o potencial. Foque no que o usuário pode conquistar.

Transações Relevantes (campo 'relevantTransactionIds'):
- Com base na sua análise, identifique de 3 a 5 transações que melhor ilustram o ponto forte ou a oportunidade que você destacou (ex: a transação de investimento, a receita extra, etc.).
- Retorne apenas os IDs dessas transações no array 'relevantTransactionIds'.

Seja direto, inspirador e focado em dar o próximo passo para o sucesso.`,
});

export const opportunityAnalysisFlow = ai.defineFlow(
  {
    name: 'opportunityAnalysisFlow',
    inputSchema: OpportunityAnalysisInputSchema,
    outputSchema: OpportunityAnalysisOutputSchema,
  },
  async (input) => {
    const llmResponse = await prompt(input);
    if (!llmResponse.output) {
      throw new Error('A IA não conseguiu gerar a análise de oportunidades.');
    }
    return llmResponse.output;
  }
);
