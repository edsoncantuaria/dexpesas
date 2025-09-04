
      
// backend/src/controllers/goalController.js
import { PrismaClient } from '@prisma/client';
import GamificationService from '../services/gamificationService.js';
import AuditService from '../services/auditService.js';

const prisma = new PrismaClient();

// Helper para buscar e mapear categorias
async function getCategoryMap(tx) {
    const prismaInstance = tx || prisma;
    const categories = await prismaInstance.category.findMany();
    return new Map(categories.map(cat => [cat.nome, cat.id]));
}


class GoalController {
    /**
     * Lista todas as metas do usuário logado.
     * A geração de URL pré-assinada foi removida para otimização.
     * O frontend agora solicitará as URLs sob demanda.
     */
    async getGoals(req, res, next) {
        const userId = req.user.id;
        try {
            const goals = await prisma.goal.findMany({
                where: { userId },
                include: { contributions: true },
                orderBy: { createdAt: 'desc' }
            });

            // A lógica de gerar URL foi removida.
            // A projeção continua sendo calculada.
            const goalsWithDetails = goals.map((goal) => {
                const projectionDate = GamificationService.calculateGoalProjection(goal);
                return { ...goal, projectionDate };
            });

            res.json(goalsWithDetails);
        } catch (error) {
            next(error);
        }
    }
    
    async getGoalContributions(req, res, next) {
        const { goalId } = req.params;
        const userId = req.user.id;
        try {
            // Garante que a meta pertence ao usuário
            const goal = await prisma.goal.findFirst({ where: { id: goalId, userId }});
            if (!goal) {
                const err = new Error('Meta não encontrada.');
                err.statusCode = 404;
                return next(err);
            }

            const contributions = await prisma.goalContribution.findMany({
                where: { goalId },
                orderBy: { date: 'desc' }
            });
            res.json(contributions);
        } catch (error) {
            next(error);
        }
    }


    /**
     * Cria uma nova meta financeira.
     */
    async createGoal(req, res, next) {
        const { name, targetAmount, deadline, imageUrl, accountId } = req.body;
        const userId = req.user.id;

        try {
            const newGoal = await prisma.goal.create({
                data: {
                    userId,
                    name,
                    targetAmount: parseFloat(targetAmount),
                    deadline: deadline ? new Date(deadline) : null,
                    imageUrl,
                    accountId: accountId === 'none' ? null : accountId,
                },
            });

            await AuditService.log({
                userId,
                action: 'CREATE_GOAL',
                entity: 'GOAL',
                entityId: newGoal.id,
                details: { after: newGoal },
                ipAddress: req.ip,
            });

            res.status(201).json(newGoal);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Atualiza uma meta existente.
     */
    async updateGoal(req, res, next) {
        const { id } = req.params;
        const { name, targetAmount, deadline, imageUrl, accountId } = req.body;
        const userId = req.user.id;

        try {
            const originalGoal = await prisma.goal.findUnique({ where: { id: id, userId: userId }});
            if (!originalGoal) {
                return res.status(404).json({ message: 'Meta não encontrada.' });
            }

            const dataToUpdate = {
                name,
                targetAmount: targetAmount ? parseFloat(targetAmount) : undefined,
                deadline: deadline ? new Date(deadline) : undefined,
                imageUrl,
            };

            if (accountId !== undefined) {
                dataToUpdate.accountId = accountId === 'none' ? null : accountId;
            }

            const updatedGoal = await prisma.goal.update({
                where: { id: id, userId: userId },
                data: dataToUpdate,
            });

            await AuditService.log({
                userId,
                action: 'UPDATE_GOAL',
                entity: 'GOAL',
                entityId: updatedGoal.id,
                details: { before: originalGoal, after: updatedGoal },
                ipAddress: req.ip,
            });

            res.json(updatedGoal);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Deleta uma meta.
     */
    async deleteGoal(req, res, next) {
        const { id } = req.params;
        const userId = req.user.id;
        try {
            const goalToDelete = await prisma.goal.findUnique({ where: { id: id, userId: userId } });
            if (!goalToDelete) {
                return res.status(404).json({ message: 'Meta não encontrada.' });
            }

            // Reverte as contribuições e transações antes de deletar a meta
            await prisma.$transaction(async (tx) => {
                const contributions = await tx.goalContribution.findMany({
                    where: { goalId: id },
                    select: { debitTransactionId: true }
                });
                const debitTransactionIds = contributions.map(c => c.debitTransactionId).filter(Boolean);

                // Deleta as transações de débito que originaram as contribuições
                if (debitTransactionIds.length > 0) {
                    await tx.transaction.deleteMany({
                        where: { id: { in: debitTransactionIds } }
                    });
                }
                
                // Deleta as contribuições associadas à meta
                // A relação onDelete: Cascade no schema do prisma já faria isso,
                // mas é mais explícito aqui para clareza da operação atômica.
                await tx.goalContribution.deleteMany({
                    where: { goalId: id }
                });

                // Finalmente, deleta a meta
                await tx.goal.delete({
                    where: { id: id, userId: userId }
                });
            });


            await AuditService.log({
                userId,
                action: 'DELETE_GOAL',
                entity: 'GOAL',
                entityId: id,
                details: { before: goalToDelete },
                ipAddress: req.ip,
            });

            res.status(204).send();
        } catch (error) {
            next(error);
        }
    }

    /**
     * Adiciona uma contribuição a uma meta.
     */
    async addContribution(req, res, next) {
        const { goalId } = req.params;
        const { amount, fromAccountId } = req.body;
        const userId = req.user.id;
        const parsedAmount = parseFloat(amount);

        if (!parsedAmount || parsedAmount <= 0) {
            const err = new Error('O valor da contribuição deve ser positivo.');
            err.statusCode = 400;
            return next(err);
        }

        try {
            const result = await prisma.$transaction(async (tx) => {
                const categoryMap = await getCategoryMap(tx);
                const investimentosCategoryId = categoryMap.get('Investimentos');
                if (!investimentosCategoryId) {
                     const err = new Error("Categoria 'Investimentos' não encontrada.");
                     err.statusCode = 500;
                     throw err;
                }

                // Validação de saldo da conta
                const sourceAccountWithBalance = await tx.account.findFirst({
                    where: { id: fromAccountId, userId },
                    include: { transactions: { where: { pago: true } } }
                });

                if (!sourceAccountWithBalance) {
                    const err = new Error('Conta de origem não encontrada.');
                    err.statusCode = 404;
                    throw err;
                }
                
                const currentBalance = Number(sourceAccountWithBalance.saldoInicial) + sourceAccountWithBalance.transactions.reduce((acc, t) => acc + (t.tipo === 'receita' ? Number(t.valor) : -Number(t.valor)), 0);

                if (currentBalance < parsedAmount) {
                     const err = new Error('Saldo insuficiente na conta de origem.');
                     err.statusCode = 400;
                     throw err;
                }
                
                const debitTransaction = await tx.transaction.create({
                    data: {
                        userId,
                        accountId: fromAccountId,
                        descricao: `Aporte para meta`,
                        valor: parsedAmount,
                        data: new Date(),
                        tipo: 'despesa',
                        categoryId: investimentosCategoryId,
                        metodoPagamento: 'debito',
                        pago: true,
                    }
                });

                const contribution = await tx.goalContribution.create({
                    data: {
                        goalId,
                        amount: parsedAmount,
                        date: new Date(),
                        debitTransactionId: debitTransaction.id,
                    },
                });

                const updatedGoal = await tx.goal.update({
                    where: { id: goalId, userId },
                    data: {
                        currentAmount: {
                            increment: parsedAmount,
                        },
                    },
                });

                await AuditService.log({
                    userId,
                    action: 'ADD_GOAL_CONTRIBUTION',
                    entity: 'GOAL',
                    entityId: goalId,
                    details: {
                        contribution,
                        debitTransactionId: debitTransaction.id,
                        fromAccountId,
                        amount: parsedAmount,
                    },
                    ipAddress: req.ip,
                });
                
                return updatedGoal;
            });
            
            res.status(200).json(result);

        } catch (error) {
            next(error);
        }
    }
    
    /**
     * Finaliza uma meta, movendo o valor para uma conta ou registrando como despesa.
     */
    async finalizeGoal(req, res, next) {
        const { goalId } = req.params;
        const { finalizationType, destinationAccountId, categoryId, amount } = req.body;
        const userId = req.user.id;

        try {
            const result = await prisma.$transaction(async (tx) => {
                const goal = await tx.goal.findUnique({ where: { id: goalId, userId } });

                if (!goal) {
                     const err = new Error("Meta não encontrada.");
                     err.statusCode = 404;
                     throw err;
                }
                if (goal.status === 'COMPLETED') {
                    const err = new Error("Esta meta já foi finalizada.");
                    err.statusCode = 400;
                    throw err;
                }

                const finalizationAmount = parseFloat(amount);
                if (!finalizationAmount || finalizationAmount <= 0) {
                     const err = new Error("O valor de finalização deve ser positivo.");
                     err.statusCode = 400;
                     throw err;
                }
                if (finalizationAmount > goal.currentAmount) {
                    const err = new Error("Valor de finalização maior que o saldo da meta.");
                     err.statusCode = 400;
                     throw err;
                }

                const description = `Finalização da Meta: ${goal.name}`;
                let finalizationTransaction;

                if (finalizationType === 'account') {
                    if (!destinationAccountId) {
                        const err = new Error("Conta de destino é obrigatória.");
                        err.statusCode = 400;
                        throw err;
                    }
                    const categoryMap = await getCategoryMap(tx);
                    finalizationTransaction = await tx.transaction.create({
                        data: {
                            userId, accountId: destinationAccountId, descricao,
                            valor: finalizationAmount, data: new Date(), tipo: 'receita',
                            metodoPagamento: 'dinheiro', pago: true,
                            categoryId: categoryMap.get('Investimentos'),
                            finalizedGoalId: goalId,
                        },
                    });
                } else if (finalizationType === 'purchase') {
                     if (!categoryId) {
                        const err = new Error("Categoria da despesa é obrigatória.");
                        err.statusCode = 400;
                        throw err;
                     }
                     finalizationTransaction = await tx.transaction.create({
                        data: {
                            userId, descricao, valor: finalizationAmount, data: new Date(),
                            tipo: 'despesa', metodoPagamento: 'dinheiro', pago: true,
                            categoryId: categoryId,
                            finalizedGoalId: goalId,
                        }
                     });
                }

                const remainingAmount = parseFloat(goal.currentAmount) - finalizationAmount;
                
                const updatedGoal = await tx.goal.update({
                    where: { id: goalId },
                    data: { 
                        status: remainingAmount <= 0 ? 'COMPLETED' : 'IN_PROGRESS',
                        currentAmount: remainingAmount,
                    },
                });
                
                if (updatedGoal.status === 'COMPLETED') {
                    await GamificationService.checkAndAwardAchievements(tx, userId, 'GOAL_COMPLETED');
                }

                await AuditService.log({
                    userId,
                    action: 'FINALIZE_GOAL',
                    entity: 'GOAL',
                    entityId: goalId,
                    details: {
                        finalizationType,
                        amount: finalizationAmount,
                        transactionId: finalizationTransaction?.id,
                        goalBefore: goal,
                        goalAfter: updatedGoal,
                    },
                    ipAddress: req.ip,
                });

                return updatedGoal;
            });
            res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    }

    async rescueGoal(req, res, next) {
        const { goalId } = req.params;
        const { destinationAccountId } = req.body;
        const userId = req.user.id;

        try {
            const result = await prisma.$transaction(async (tx) => {
                const goal = await tx.goal.findUnique({ where: { id: goalId, userId }});
                if (!goal) {
                    const err = new Error("Meta não encontrada.");
                    err.statusCode = 404;
                    throw err;
                }
                if (goal.currentAmount <= 0) {
                     const err = new Error("Não há saldo para resgatar.");
                     err.statusCode = 400;
                     throw err;
                }
                if (!destinationAccountId) {
                     const err = new Error("Conta de destino é obrigatória.");
                     err.statusCode = 400;
                     throw err;
                }

                const categoryMap = await getCategoryMap(tx);
                const rescuedAmount = Number(goal.currentAmount);

                const rescueTransaction = await tx.transaction.create({
                    data: {
                        userId,
                        accountId: destinationAccountId,
                        descricao: `Resgate da Meta: ${goal.name}`,
                        valor: rescuedAmount,
                        data: new Date(),
                        tipo: 'receita',
                        metodoPagamento: 'dinheiro',
                        pago: true,
                        categoryId: categoryMap.get('Investimentos'),
                    }
                });

                await tx.goal.update({ where: { id: goalId }, data: { currentAmount: 0 }});

                 await AuditService.log({
                    userId,
                    action: 'RESCUE_GOAL',
                    entity: 'GOAL',
                    entityId: goalId,
                    details: {
                        rescuedAmount: rescuedAmount,
                        destinationAccountId,
                        rescueTransactionId: rescueTransaction.id,
                        goalBefore: goal,
                        goalAfter: {...goal, currentAmount: 0}
                    },
                    ipAddress: req.ip,
                });

                return { message: "Valor resgatado com sucesso." };
            });

            res.status(200).json(result);

        } catch (error) {
            next(error);
        }
    }
}

export default new GoalController();

    