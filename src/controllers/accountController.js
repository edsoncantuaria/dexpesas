// src/controllers/accountController.js
import { PrismaClient } from '@prisma/client';
import AuditService from '../services/auditService.js'; // Importa o serviço
import { endOfDay } from 'date-fns';

const prisma = new PrismaClient();

// Helper para buscar e mapear categorias
async function getCategoryMap(tx) {
    const prismaInstance = tx || prisma;
    const categories = await prismaInstance.category.findMany();
    return new Map(categories.map(cat => [cat.nome, cat.id]));
}


class AccountController {
    async getAllAccounts(req, res, next) {
        const userId = req.user.id;
        try {
            // 1. Busca todas as contas do usuário.
            const accounts = await prisma.account.findMany({
                where: { userId },
                orderBy: { nome: 'asc' },
            });
            
            if (accounts.length === 0) {
                return res.json([]);
            }
            
            // Otimização Máxima: 1 única consulta para buscar todas as somas de transações
            const transactionsSums = await prisma.transaction.groupBy({
                by: ['accountId', 'tipo'], // Agrupa por conta E por tipo
                where: {
                    userId,
                    accountId: { in: accounts.map(a => a.id) },
                    pago: true,
                    data: { lte: endOfDay(new Date()) }
                },
                _sum: {
                    valor: true,
                },
            });

            // Processa os resultados em memória (muito mais rápido que múltiplos acessos ao DB)
            const receitasMap = new Map();
            const despesasMap = new Map();

            transactionsSums.forEach(group => {
                if (group.tipo === 'receita') {
                    receitasMap.set(group.accountId, group._sum.valor || 0);
                } else {
                    despesasMap.set(group.accountId, group._sum.valor || 0);
                }
            });

            const accountsWithCurrentBalance = accounts.map(account => {
                const totalReceitas = Number(receitasMap.get(account.id)) || 0;
                const totalDespesas = Number(despesasMap.get(account.id)) || 0;
                const saldo = Number(account.saldoInicial) + totalReceitas - totalDespesas;
                
                return { ...account, saldo };
            });

            res.json(accountsWithCurrentBalance);

        } catch (error) {
            next(error);
        }
    }

    async createAccount(req, res, next) {
        try {
            const { nome, instituicao, tipo, saldo } = req.body;
            const userId = req.user.id;
            const initialBalance = parseFloat(saldo) || 0;

            // Lógica refatorada: Apenas cria a conta com o saldo inicial.
            // A transação automática foi removida para evitar dupla contagem.
            const newAccount = await prisma.account.create({
                data: {
                    nome,
                    instituicao,
                    tipo,
                    saldoInicial: initialBalance,
                    userId,
                }
            });
            
            await AuditService.log({
                userId: req.user.id,
                action: 'CREATE_ACCOUNT',
                entity: 'ACCOUNT',
                entityId: newAccount.id,
                details: { after: newAccount },
                ipAddress: req.ip
            });

            res.status(201).json(newAccount);

        } catch (error) {
            next(error);
        }
    }

    async updateAccount(req, res, next) {
        try {
            const { id } = req.params;
            const { nome, instituicao, tipo } = req.body;

            const originalAccount = await prisma.account.findUnique({ where: { id: id, userId: req.user.id }});
            if (!originalAccount) {
                 return res.status(404).json({ message: 'Conta não encontrada.' });
            }

            const updatedAccount = await prisma.account.update({
                where: { id: id, userId: req.user.id },
                data: { nome, instituicao, tipo }
            });
            
            await AuditService.log({
                userId: req.user.id,
                action: 'UPDATE_ACCOUNT',
                entity: 'ACCOUNT',
                entityId: updatedAccount.id,
                details: { before: originalAccount, after: updatedAccount },
                ipAddress: req.ip
            });

            res.json(updatedAccount);
        } catch (error)
        {
            next(error);
        }
    }

    async deleteAccount(req, res, next) {
        try {
            const { id } = req.params;
            
            const accountToDelete = await prisma.account.findUnique({ where: { id: id, userId: req.user.id }});
             if (!accountToDelete) {
                 return res.status(404).json({ message: 'Conta não encontrada.' });
            }

            await prisma.account.delete({ where: { id: id, userId: req.user.id } });
            
            await AuditService.log({
                userId: req.user.id,
                action: 'DELETE_ACCOUNT',
                entity: 'ACCOUNT',
                entityId: id,
                details: { before: accountToDelete },
                ipAddress: req.ip
            });

            res.status(204).send();
        } catch (error) {
            next(error);
        }
    }

    async transferFunds(req, res, next) {
        const { fromAccountId, toAccountId, amount, description } = req.body;
        const userId = req.user.id;
        const parsedAmount = parseFloat(amount);

        if (fromAccountId === toAccountId) {
            return res.status(400).json({ message: 'A conta de origem e destino não podem ser a mesma.' });
        }
        if (parsedAmount <= 0) {
            return res.status(400).json({ message: 'O valor da transferência deve ser positivo.' });
        }

        try {
            const result = await prisma.$transaction(async (tx) => {
                const categoryMap = await getCategoryMap(tx);
                const transferCategoryId = categoryMap.get('Investimentos');
                if (!transferCategoryId) {
                    const err = new Error("Categoria 'Investimentos' não encontrada para transferência.");
                    err.statusCode = 500;
                    throw err;
                }

                // Validação de Saldo (usando a mesma lógica otimizada)
                const [fromAccount, destinationAccount] = await Promise.all([
                    tx.account.findFirst({ where: { id: fromAccountId, userId: userId } }),
                    tx.account.findFirst({ where: { id: toAccountId, userId: userId } })
                ]);

                if (!fromAccount || !destinationAccount) {
                    const err = new Error('Conta de origem ou destino não encontrada.');
                    err.statusCode = 404;
                    throw err;
                }
                
                 const [receitas, despesas] = await Promise.all([
                    tx.transaction.aggregate({ _sum: { valor: true }, where: { accountId: fromAccountId, tipo: 'receita', pago: true } }),
                    tx.transaction.aggregate({ _sum: { valor: true }, where: { accountId: fromAccountId, tipo: 'despesa', pago: true } }),
                ]);
                const fromAccountBalance = Number(fromAccount.saldoInicial) + (receitas._sum.valor || 0) - (despesas._sum.valor || 0);

                if (fromAccountBalance < parsedAmount) {
                     const err = new Error('Saldo insuficiente na conta de origem.');
                     err.statusCode = 400;
                     throw err;
                }

                // Criação das transações de débito e crédito
                const debitTransaction = await tx.transaction.create({
                    data: {
                        userId,
                        accountId: fromAccountId,
                        descricao: description || `Transferência para ${destinationAccount.nome}`,
                        valor: parsedAmount,
                        data: new Date(),
                        tipo: 'despesa',
                        pago: true,
                        metodoPagamento: 'debito',
                        categoryId: transferCategoryId,
                    }
                });

                const creditTransaction = await tx.transaction.create({
                    data: {
                        userId,
                        accountId: toAccountId,
                        descricao: description || `Transferência de ${fromAccount.nome}`,
                        valor: parsedAmount,
                        data: new Date(),
                        tipo: 'receita',
                        pago: true,
                        metodoPagamento: 'debito',
                        categoryId: transferCategoryId,
                    }
                });
                
                 await AuditService.log({
                    userId: req.user.id,
                    action: 'TRANSFER_FUNDS',
                    entity: 'TRANSACTION',
                    entityId: debitTransaction.id, 
                    details: {
                        fromAccountId: fromAccountId,
                        toAccountId: toAccountId,
                        amount: parsedAmount,
                        debitTransactionId: debitTransaction.id,
                        creditTransactionId: creditTransaction.id,
                    },
                    ipAddress: req.ip
                });

                return { debitTransaction, creditTransaction };
            });

            res.status(201).json({ message: "Transferência realizada com sucesso!", data: result });

        } catch (error) {
            next(error);
        }
    }
}

export default new AccountController();
