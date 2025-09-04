// backend/src/ai/flows/goal-projection-flow.js
'use server';
import { ai } from '../genkit.js';
import { z } from 'zod';
import { googleAI } from '@genkit-ai/googleai';
import { differenceInDays, addMonths, format } from 'date-fns';

// Esquema de entrada com os dados da meta e a simulação do usuário.
export const GoalProjectionInputSchema = z.object({
  goal: z.string().describe('Um JSON stringified do objeto da meta, incluindo `currentAmount`, `targetAmount` e `contributions`.'),
  simulationQuery: z.string().describe('A pergunta do usuário sobre a simulação. Ex: "E se eu aportar R$ 200 a mais todo mês?"'),
});

// Esquema de saída com a nova data projetada e uma análise.
export const GoalProjectionOutputSchema = z.object({
  newProjectedDate: z.string().describe('A nova data de conclusão projetada no formato "MMMM de yyyy".'),
  analysis: z.string().describe('Uma breve análise explicando o impacto da simulação e a nova projeção.'),
  monthlyContributionIncrease: z.number().describe('O valor do aumento do aporte mensal identificado na simulação.'),
});

// Função para calcular a projeção base
function calculateBaseProjection(goal) {
    if (goal.status === 'COMPLETED' || goal.currentAmount >= goal.targetAmount) return null;
    if (goal.contributions.length < 1) return { averagePerMonth: 0, monthsToComplete: Infinity };

    goal.contributions.sort((a, b) => new Date(a.date) - new Date(b.date));
    const firstDate = new Date(goal.contributions[0].date);
    const lastDate = new Date(goal.contributions[goal.contributions.length - 1].date);
    
    const monthsElapsed = differenceInDays(lastDate, firstDate) / 30.44;
    const totalContributed = goal.contributions.reduce((sum, c) => sum + c.amount, 0);
    const averagePerMonth = monthsElapsed > 0 ? totalContributed / monthsElapsed : totalContributed;
    
    return { averagePerMonth };
}


const prompt = ai.definePrompt({
  name: 'goalProjectionPrompt',
  model: googleAI.model('gemini-1.5-flash'),
  input: { schema: GoalProjectionInputSchema },
  output: { schema: GoalProjectionOutputSchema },
  prompt: `Você é um planejador financeiro especialista em projeções de metas.

Dados da Meta do Usuário:
{{{goal}}}

Consulta de Simulação do Usuário:
"{{{simulationQuery}}}"

Sua Tarefa:
1.  **Identifique o Aumento:** Analise a consulta do usuário e identifique qual o valor do aumento no aporte mensal que ele está propondo. Retorne esse valor no campo 'monthlyContributionIncrease'. Se a consulta não mencionar um valor claro, use 0.
2.  **Calcule a Nova Projeção:** Com base nos dados da meta e no aumento do aporte mensal, calcule a nova data em que a meta será alcançada.
3.  **Gere a Análise:** Escreva uma análise curta e motivacional (campo 'analysis') explicando o impacto positivo da simulação.
4.  **Formate a Data:** Retorne a nova data projetada no formato "MMMM de yyyy" (ex: "julho de 2025") no campo 'newProjectedDate'.

Seja direto, otimista e foque nos números.`,
});

export const goalProjectionFlow = ai.defineFlow(
  {
    name: 'goalProjectionFlow',
    inputSchema: GoalProjectionInputSchema,
    outputSchema: GoalProjectionOutputSchema,
  },
  async (input) => {
    const goalData = JSON.parse(input.goal);
    
    const llmResponse = await prompt(input);
    const output = llmResponse.output;

    if (!output || typeof output.monthlyContributionIncrease !== 'number') {
      throw new Error("A IA não retornou uma análise válida.");
    }

    const { averagePerMonth } = calculateBaseProjection(goalData);
    const newMonthlyContribution = averagePerMonth + output.monthlyContributionIncrease;
    
    const remainingAmount = goalData.targetAmount - goalData.currentAmount;
    if (remainingAmount <= 0) {
        return {
            newProjectedDate: "Meta Alcançada",
            analysis: "Parabéns! Você já alcançou esta meta. Não há necessidade de projeção.",
            monthlyContributionIncrease: output.monthlyContributionIncrease,
        }
    }
    
    if (newMonthlyContribution <= 0) {
        return {
            newProjectedDate: "Incalculável",
            analysis: "Com base na sua simulação, o aporte mensal seria muito baixo para projetar uma data de conclusão. Tente aumentar o valor do aporte.",
            monthlyContributionIncrease: output.monthlyContributionIncrease,
        }
    }

    const monthsToComplete = Math.ceil(remainingAmount / newMonthlyContribution);
    const projectedDate = addMonths(new Date(), monthsToComplete);

    const formattedDate = format(projectedDate, "MMMM 'de' yyyy", { locale: ptBR });

    return {
        newProjectedDate: formattedDate,
        analysis: output.analysis,
        monthlyContributionIncrease: output.monthlyContributionIncrease,
    };
  }
);
