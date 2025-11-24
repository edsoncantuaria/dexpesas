// backend/src/controllers/budgetController.js
import pkg from '@prisma/client';
const { PrismaClient, Prisma } = pkg;
import { startOfMonth, endOfMonth, parseISO, subMonths } from 'date-fns';
import GamificationService from '../services/gamificationService.js';
import AuditService from '../services/auditService.js';

const prisma = new PrismaClient();

async function cleanupOrphanBudgets(userId) {
    await prisma.$executeRaw`
      DELETE B
      FROM Budget AS B
      LEFT JOIN Category AS C ON B.categoryId = C.id
      WHERE C.id IS NULL AND B.userId = ${userId}
    `;
}

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
            await cleanupOrphanBudgets(userId);
            const budgets = await prisma.budget.findMany({
                where: { userId, month },
                include: {
                    category: true, // Inclui os dados da categoria
                }
            });

            const categoryIds = budgets.map(b => b.categoryId);
            if (categoryIds.length === 0) return res.json([]);

            const mirroredBudgetIds = budgets.filter((budget) => budget.cellBudgetId).map((budget) => budget.cellBudgetId);
            const cellBudgetsMeta = mirroredBudgetIds.length
                ? await prisma.cellBudget.findMany({
                    where: { id: { in: mirroredBudgetIds } },
                    select: { id: true, cellId: true, categoryId: true, lastSyncedAt: true, updatedAt: true },
                })
                : [];
            const cellBudgetsMap = new Map(cellBudgetsMeta.map((meta) => [meta.id, meta]));

            let sharedSpentMap = new Map();
            if (cellBudgetsMeta.length) {
                const cellIds = [...new Set(cellBudgetsMeta.map((meta) => meta.cellId))];
                const cellCategoryIds = [
                    ...new Set(cellBudgetsMeta.map((meta) => meta.categoryId).filter(Boolean)),
                ];
                if (cellIds.length && cellCategoryIds.length) {
                    const sharedExpenses = await prisma.sharedExpense.groupBy({
                        by: ['clanId', 'categoryId'],
                        where: {
                            clanId: { in: cellIds },
                            categoryId: { in: cellCategoryIds },
                            createdAt: { gte: startDate, lte: endDate },
                        },
                        _sum: { totalAmount: true },
                    });
                    sharedSpentMap = new Map(
                        sharedExpenses.map((entry) => [
                            `${entry.clanId}:${entry.categoryId}`,
                            Number(entry._sum.totalAmount || 0),
                        ]),
                    );
                }
            }


            // Busca dados atuais e do mês anterior em paralelo para eficiência
            // IMPORTANTE: Não agrupamos por categoryId aqui, pois precisamos mapear subcategorias para pais
            const [currentTransactions, previousBudgets, previousTransactions, allCategories] = await Promise.all([
                prisma.transaction.findMany({
                    where: { userId, pago: true, tipo: 'despesa', data: { gte: startDate, lte: endDate } },
                    select: { categoryId: true, valor: true },
                }),
                // Busca orçamentos do mês anterior que tinham rollover ativo
                prisma.budget.findMany({
                    where: { userId, month: prevMonthStr, categoryId: { in: categoryIds }, rollover: true }
                }),
                // Busca despesas do mês anterior para calcular o saldo do rollover
                prisma.transaction.findMany({
                    where: { userId, pago: true, tipo: 'despesa', data: { gte: prevMonthStartDate, lte: prevMonthEndDate } },
                    select: { categoryId: true, valor: true },
                }),
                // Busca todas as categorias para mapear subcategorias aos pais
                prisma.category.findMany({
                    select: { id: true, parentCategoryId: true },
                }),
            ]);

            // Cria mapa de subcategoria -> categoria pai
            const categoryParentMap = new Map(
                allCategories.map(cat => [cat.id, cat.parentCategoryId || cat.id])
            );

            // Função helper para mapear transações para categorias pai
            const mapTransactionsByParentCategory = (transactions) => {
                const spentMap = new Map();
                for (const transaction of transactions) {
                    if (!transaction.categoryId) continue;

                    // Mapeia para categoria pai se for subcategoria
                    const parentCategoryId = categoryParentMap.get(transaction.categoryId) || transaction.categoryId;
                    const currentSpent = spentMap.get(parentCategoryId) || 0;
                    spentMap.set(parentCategoryId, Number(currentSpent) + Number(transaction.valor || 0));
                }
                return spentMap;
            };

            const currentSpentMap = mapTransactionsByParentCategory(currentTransactions);
            const previousSpentMap = mapTransactionsByParentCategory(previousTransactions);
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

                const personalSpent = Number(currentSpentMap.get(budget.categoryId) || 0);
                let sharedSpent = 0;
                let syncedAt = null;
                if (budget.cellBudgetId && cellBudgetsMap.has(budget.cellBudgetId)) {
                    const cellMeta = cellBudgetsMap.get(budget.cellBudgetId);
                    const key = cellMeta?.categoryId ? `${cellMeta.cellId}:${cellMeta.categoryId}` : null;
                    if (key) {
                        sharedSpent = sharedSpentMap.get(key) || 0;
                    }
                    const timestamp = cellMeta?.lastSyncedAt || cellMeta?.updatedAt || null;
                    syncedAt = timestamp ? timestamp.toISOString() : null;
                }

                const finalSpent = budget.cellBudgetId ? sharedSpent : personalSpent;

                return {
                    ...budget,
                    limit: adjustedLimit, // O limite final ajustado
                    originalLimit: parseFloat(budget.limit), // O limite original definido pelo usuário
                    rolloverAmount: rolloverAmount, // O valor que veio do mês anterior
                    spent: finalSpent,
                    personalSpent,
                    sharedSpent,
                    cellSyncedAt: syncedAt,
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
            const originalBudget = await prisma.budget.findUnique({ where: { id: id, userId: userId } });
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
            const budgetToDelete = await prisma.budget.findUnique({ where: { id: id, userId: userId } });
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
