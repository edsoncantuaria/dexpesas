// backend/src/controllers/budgetController.js
import { PrismaClient } from '@prisma/client';
import { startOfMonth, endOfMonth, parseISO, subMonths } from 'date-fns';
import GamificationService from '../services/gamificationService.js';
import AuditService from '../services/auditService.js';

const prisma = new PrismaClient();

class BudgetController {
    /**
     * Busca os orçamentos de um determinado mês para o usuário logado.
     * Para cada orçamento, calcula o valor já gasto no período e aplica a lógica de rollover se ativa.
     */
    async getBudgets(req, res, next) {
        const userId = req.user.id;
        const { month } = req.query; // Formato 'YYYY-MM'

        if (!month || !/^\d{4}-\d{2}$/.test(month)) {
            return res.status(400).json({ message: 'Formato de mês inválido. Use YYYY-MM.' });
        }

        const currentMonthDate = parseISO(`${month}-01`);
        const startDate = startOfMonth(currentMonthDate);
        const endDate = endOfMonth(startDate);
        
        // Correção Lógica de Rollover: Precisamos olhar para o mês anterior
        const previousMonthDate = subMonths(currentMonthDate, 1);
        const prevMonthStr = previousMonthDate.toISOString().slice(0, 7);
        const prevMonthStartDate = startOfMonth(previousMonthDate);
        const prevMonthEndDate = endOfMonth(previousMonthDate);


        try {
            const budgets = await prisma.budget.findMany({
                where: { userId, month },
                include: {
                    category: true, // Inclui os dados da categoria
                }
            });
            
            const categoryIds = budgets.map(b => b.categoryId);
            if (categoryIds.length === 0) return res.json([]);
            
            // Busca dados atuais e do mês anterior em paralelo para eficiência
            const [currentExpenses, previousBudgets, previousExpenses] = await Promise.all([
                 prisma.transaction.groupBy({
                    by: ['categoryId'],
                    where: { userId, pago: true, tipo: 'despesa', data: { gte: startDate, lte: endDate }, categoryId: { in: categoryIds } },
                    _sum: { valor: true },
                }),
                // Busca orçamentos do mês anterior que tinham rollover ativo
                prisma.budget.findMany({
                    where: { userId, month: prevMonthStr, categoryId: { in: categoryIds }, rollover: true }
                }),
                // Busca despesas do mês anterior para calcular o saldo do rollover
                prisma.transaction.groupBy({
                    by: ['categoryId'],
                    where: { userId, pago: true, tipo: 'despesa', data: { gte: prevMonthStartDate, lte: prevMonthEndDate }, categoryId: { in: categoryIds } },
                    _sum: { valor: true },
                }),
            ]);
            
            const currentSpentMap = new Map(currentExpenses.map(e => [e.categoryId, e._sum.valor || 0]));
            const previousSpentMap = new Map(previousExpenses.map(e => [e.categoryId, e._sum.valor || 0]));
            const previousBudgetMap = new Map(previousBudgets.map(b => [b.categoryId, b.limit]));

            const budgetsWithProgress = budgets.map(budget => {
                let adjustedLimit = parseFloat(budget.limit);
                let rolloverAmount = 0;

                // Lógica de Rollover Corrigida
                if (budget.rollover && previousBudgetMap.has(budget.categoryId)) {
                    const prevLimit = previousBudgetMap.get(budget.categoryId) || 0;
                    const prevSpent = previousSpentMap.get(budget.categoryId) || 0;
                    rolloverAmount = parseFloat(prevLimit) - parseFloat(prevSpent);
                    adjustedLimit += rolloverAmount;
                }

                return {
                    ...budget,
                    limit: adjustedLimit, // O limite final ajustado
                    originalLimit: parseFloat(budget.limit), // O limite original definido pelo usuário
                    rolloverAmount: rolloverAmount, // O valor que veio do mês anterior
                    spent: currentSpentMap.get(budget.categoryId) || 0,
                };
            });

            res.json(budgetsWithProgress);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Cria um novo orçamento para uma categoria em um mês específico.
     */
    async createBudget(req, res, next) {
        const { categoryId, month, limit, rollover } = req.body;
        const userId = req.user.id;

        try {
            const newBudget = await prisma.$transaction(async (tx) => {
                const createdBudget = await tx.budget.create({
                    data: {
                        userId,
                        categoryId,
                        month,
                        limit: parseFloat(limit),
                        rollover: rollover || false,
                    },
                });

                await GamificationService.triggerXpEvent(tx, userId, 'BUDGET_CREATED');
                await GamificationService.checkAndAwardAchievements(tx, userId, 'BUDGET_CREATED');

                return createdBudget;
            });


            await AuditService.log({
                userId,
                action: 'CREATE_BUDGET',
                entity: 'BUDGET',
                entityId: newBudget.id,
                details: { after: newBudget },
                ipAddress: req.ip,
            });

            res.status(201).json(newBudget);
        } catch (error) {
            if (error.code === 'P2002') {
                return res.status(409).json({ message: 'Já existe um orçamento para esta categoria neste mês.' });
            }
            next(error);
        }
    }

    /**
     * Atualiza um orçamento existente.
     */
    async updateBudget(req, res, next) {
        const { id } = req.params;
        const { limit, rollover } = req.body;
        const userId = req.user.id;

        try {
            const originalBudget = await prisma.budget.findUnique({ where: { id: id, userId: userId }});
             if (!originalBudget) {
                return res.status(404).json({ message: 'Orçamento não encontrado.' });
            }

            const updatedBudget = await prisma.budget.update({
                where: {
                    id: id,
                    userId: userId,
                },
                data: {
                    limit: parseFloat(limit),
                    rollover: rollover,
                },
            });

            await AuditService.log({
                userId,
                action: 'UPDATE_BUDGET',
                entity: 'BUDGET',
                entityId: updatedBudget.id,
                details: { before: originalBudget, after: updatedBudget },
                ipAddress: req.ip,
            });

            res.json(updatedBudget);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Deleta um orçamento.
     */
    async deleteBudget(req, res, next) {
        const { id } = req.params;
        const userId = req.user.id;

        try {
             const budgetToDelete = await prisma.budget.findUnique({ where: { id: id, userId: userId }});
             if (!budgetToDelete) {
                return res.status(404).json({ message: 'Orçamento não encontrado.' });
            }

            await prisma.budget.delete({
                where: {
                    id: id,
                    userId: userId,
                },
            });

            await AuditService.log({
                userId,
                action: 'DELETE_BUDGET',
                entity: 'BUDGET',
                entityId: id,
                details: { before: budgetToDelete },
                ipAddress: req.ip,
            });

            res.status(204).send();
        } catch (error) {
            next(error);
        }
    }
}

export default new BudgetController();
