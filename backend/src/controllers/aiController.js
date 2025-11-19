
// backend/src/controllers/aiController.js
import pkg from '@prisma/client';
const { PrismaClient } = pkg;
import { suggestCategoryFlow } from '../ai/flows/category-suggestion-flow.js';
import { searchTransactionsFlow } from '../ai/flows/transaction-search-flow.js';
import { habitAnalysisFlow } from '../ai/flows/habit-analysis-flow.js';
import { opportunityAnalysisFlow } from '../ai/flows/opportunity-analysis-flow.js';
import { inspirationalQuoteFlow } from '../ai/flows/inspirational-quote-flow.js';
import { receiptOcrFlow } from '../ai/flows/receipt-ocr-flow.js';
import { dailySummaryFlow } from '../ai/flows/daily-summary-flow.js';
import { budgetSuggestionFlow } from '../ai/flows/budget-suggestion-flow.js';
import { goalProjectionFlow } from '../ai/flows/goal-projection-flow.js';
import { startOfDay, endOfDay, subMonths } from 'date-fns';
import AuditService from '../services/auditService.js';
import GamificationService from '../services/gamificationService.js';

const prisma = new PrismaClient();

class AiController {
    /**
     * Recebe a descrição de uma transação e usa um fluxo de IA para sugerir a categoria.
     */
    async suggestCategory(req, res, next) {
        const { description } = req.body;
        if (!description) {
            return res.status(400).json({ message: 'A descrição é obrigatória.' });
        }
        try {
            const result = await suggestCategoryFlow({ description });
            res.json(result);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Recebe uma consulta em linguagem natural e usa um fluxo de IA para
     * traduzi-la em filtros estruturados para a busca de transações.
     */
    async searchTransactions(req, res, next) {
        const { query } = req.body;
        if (!query) {
            return res.status(400).json({ message: 'A consulta é obrigatória.' });
        }
        try {
            const result = await searchTransactionsFlow({ query });
            res.json(result);
        } catch (error) {
            next(error);
        }
    }
    
    async analyzeHabits(req, res, next) {
        const userId = req.user.id;
        try {
            const [transactions, profile, goals] = await Promise.all([
                prisma.transaction.findMany({ where: { userId, tipo: 'despesa' }, take: 100, orderBy: { data: 'desc' } }),
                prisma.user.findUnique({ where: { id: userId } }),
                prisma.goal.findMany({ where: { userId, status: 'IN_PROGRESS' }})
            ]);

            const input = {
                transactions: JSON.stringify(transactions),
                profile: JSON.stringify(profile),
                goals: JSON.stringify(goals),
            };
            
            const result = await habitAnalysisFlow(input);
            
            // Salva a análise no histórico
            const analysisRecord = await prisma.aiAnalysis.create({
                data: {
                    userId,
                    type: 'HABIT_ANALYSIS',
                    analysisText: result.analysis,
                    relevantTransactionIds: JSON.stringify(result.relevantTransactionIds || [])
                }
            });

            await AuditService.log({
                userId,
                action: 'RUN_AI_ANALYSIS',
                entity: 'AI_ANALYSIS',
                entityId: analysisRecord.id,
                details: { type: 'HABIT_ANALYSIS' },
                ipAddress: req.ip,
            });

            res.json(result);
        } catch(error) {
            next(error);
        }
    }

    async analyzeOpportunities(req, res, next) {
        const userId = req.user.id;
        try {
            const [transactions, profile, goals] = await Promise.all([
                prisma.transaction.findMany({ where: { userId }, take: 100, orderBy: { data: 'desc' } }),
                prisma.user.findUnique({ where: { id: userId } }),
                prisma.goal.findMany({ where: { userId, status: 'IN_PROGRESS' }})
            ]);
            
            const input = {
                transactions: JSON.stringify(transactions),
                profile: JSON.stringify(profile),
                goals: JSON.stringify(goals)
            };

            const result = await opportunityAnalysisFlow(input);
            
             // Salva a análise no histórico
             const analysisRecord = await prisma.aiAnalysis.create({
                data: {
                    userId,
                    type: 'OPPORTUNITY_ANALYSIS',
                    analysisText: result.analysis,
                    relevantTransactionIds: JSON.stringify(result.relevantTransactionIds || [])
                }
            });

            await AuditService.log({
                userId,
                action: 'RUN_AI_ANALYSIS',
                entity: 'AI_ANALYSIS',
                entityId: analysisRecord.id,
                details: { type: 'OPPORTUNITY_ANALYSIS' },
                ipAddress: req.ip,
            });

            res.json(result);
        } catch(error) {
            next(error);
        }
    }

    async getInspirationalQuote(req, res, next) {
        try {
            const result = await inspirationalQuoteFlow();
            res.json(result);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Recebe uma imagem de recibo e usa um fluxo de IA para extrair dados.
     */
    async scanReceipt(req, res, next) {
        const { imageDataUri } = req.body;
        if (!imageDataUri) {
            return res.status(400).json({ message: 'A imagem do recibo é obrigatória.' });
        }
        try {
            const result = await receiptOcrFlow({ imageDataUri });

            await AuditService.log({
                userId: req.user.id,
                action: 'RUN_AI_OCR',
                entity: 'TRANSACTION',
                entityId: 'N/A',
                details: { result },
                ipAddress: req.ip,
            });

            res.json(result);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Gera um resumo textual e em áudio das transações do dia atual.
     */
    async getDailySummary(req, res, next) {
        const userId = req.user.id;
        try {
            const user = await prisma.user.findUnique({ where: { id: userId }});
            if (!user || !user.enableDailySummary) {
                return res.status(403).json({ message: "Funcionalidade não ativada pelo usuário."});
            }

            const todayStart = startOfDay(new Date());
            const todayEnd = endOfDay(new Date());

            const transactions = await prisma.transaction.findMany({
                where: {
                    userId,
                    data: {
                        gte: todayStart,
                        lte: todayEnd,
                    },
                },
                orderBy: {
                    data: 'desc'
                }
            });

            const input = {
                transactions: JSON.stringify(transactions),
            };

            const result = await dailySummaryFlow(input);

            await prisma.$transaction(async (tx) => {
                await GamificationService.triggerXpEvent(tx, userId, 'DAILY_CHECKIN');
            });

            res.json(result);

        } catch (error) {
            next(error);
        }
    }

     /**
     * Sugere um valor de orçamento para uma categoria com base no histórico de gastos.
     */
    async suggestBudget(req, res, next) {
        const userId = req.user.id;
        const { categoryId, categoryName } = req.body;

        if (!categoryId || !categoryName) {
            return res.status(400).json({ message: 'ID e nome da categoria são obrigatórios.' });
        }

        try {
            const user = await prisma.user.findUnique({ where: { id: userId }});
             if (!user || !user.enableBudgetSuggestion) {
                return res.status(403).json({ message: "Funcionalidade não ativada pelo usuário."});
            }

            const threeMonthsAgo = subMonths(new Date(), 3);

            const transactions = await prisma.transaction.findMany({
                where: {
                    userId,
                    categoryId,
                    tipo: 'despesa',
                    data: { gte: threeMonthsAgo }
                },
                orderBy: { data: 'desc' }
            });

            const input = {
                transactions: JSON.stringify(transactions),
                categoryName,
            };

            const result = await budgetSuggestionFlow(input);
            res.json(result);

        } catch (error) {
            next(error);
        }
    }

    /**
     * Roda uma simulação de projeção de meta.
     */
    async getGoalProjection(req, res, next) {
        const userId = req.user.id;
        const { goalId, simulationQuery } = req.body;

        if (!goalId || !simulationQuery) {
            return res.status(400).json({ message: 'ID da meta e consulta de simulação são obrigatórios.' });
        }
        
        try {
            const user = await prisma.user.findUnique({ where: { id: userId }});
            if (!user || !user.enableGoalProjection) {
                return res.status(403).json({ message: "Funcionalidade não ativada pelo usuário." });
            }
            
            const goal = await prisma.goal.findFirst({
                where: { id: goalId, userId },
                include: { contributions: { orderBy: { date: 'asc' } } }
            });
            if (!goal) {
                return res.status(404).json({ message: "Meta não encontrada." });
            }

            const input = {
                goal: JSON.stringify(goal),
                simulationQuery
            };
            
            const result = await goalProjectionFlow(input);
            res.json(result);
            
        } catch (error) {
            next(error);
        }
    }
}

export default new AiController();
