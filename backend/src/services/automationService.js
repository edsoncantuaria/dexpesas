// backend/src/services/automationService.js
import { PrismaClient } from '@prisma/client';
import NotificationService from './notificationService.js';

const prisma = new PrismaClient();

// Helper para buscar e mapear categorias
async function getCategoryMap(tx) {
    const prismaInstance = tx || prisma;
    const categories = await prismaInstance.category.findMany();
    return new Map(categories.map(cat => [cat.nome, cat.id]));
}

class AutomationService {

    /**
     * Lida com a criação de uma entrada de arredondamento após uma transação ser criada.
     */
    static async handleRoundUpEntry(tx, userId, transaction) {
        const roundUpAutomation = await tx.automation.findFirst({
            where: { 
                userId, 
                type: 'ROUND_UP', 
            }
        });

        if (!roundUpAutomation || !roundUpAutomation.enabled) {
            return;
        }
        if (transaction.tipo !== 'despesa' || !['debito', 'pix'].includes(transaction.metodoPagamento)) {
            return;
        }

        const centavos = parseFloat(transaction.valor) % 1;
        if (centavos === 0) {
            return; // Valor já é redondo
        }

        const roundUpAmount = 1 - centavos;

        await tx.roundUpEntry.create({
            data: {
                transactionId: transaction.id,
                amount: parseFloat(roundUpAmount.toFixed(2)),
            }
        });
    }

    /**
     * Executa a automação "Guardar o Troco".
     */
    static async runRoundUp(userId) {
        const automation = await prisma.automation.findFirst({
            where: {
                userId,
                type: 'ROUND_UP',
            },
        });

        if (!automation || !automation.enabled) {
            const error = new Error('Automação "Guardar o Troco" não está ativa.');
            error.statusCode = 400;
            throw error;
        }
        
        const { destinationAccountId, destinationGoalId } = automation.config || {};
        if (!destinationAccountId && !destinationGoalId) {
            const error = new Error('Destino (conta ou meta) não configurado para a automação.');
            error.statusCode = 400;
            throw error;
        }


        return prisma.$transaction(async (tx) => {
            const categoryMap = await getCategoryMap(tx);
            const investimentosCategoryId = categoryMap.get('Investimentos');
            if (!investimentosCategoryId) {
                throw new Error("Categoria 'Investimentos' não encontrada.");
            }

            const pendingEntries = await tx.roundUpEntry.findMany({
                where: {
                    transaction: { userId: userId },
                    processed: false,
                },
            });

            if (pendingEntries.length === 0) {
                 return { message: "Nenhum valor para guardar no momento.", amount: 0 };
            }

            const totalRoundUp = pendingEntries.reduce((sum, entry) => sum + parseFloat(entry.amount), 0);
            
            if(automation.scheduleType === 'THRESHOLD' && automation.scheduleValue) {
                if(totalRoundUp < parseFloat(automation.scheduleValue)) {
                    return { message: `Ainda não atingiu o valor mínimo de R$${automation.scheduleValue}. Acumulado: R$${totalRoundUp.toFixed(2)}`, amount: 0, skipped: true };
                }
            }

            if (destinationGoalId) {
                 await tx.goalContribution.create({
                    data: {
                        goalId: destinationGoalId,
                        amount: totalRoundUp,
                        date: new Date(),
                    },
                });
                await tx.goal.update({
                    where: { id: destinationGoalId },
                    data: { currentAmount: { increment: totalRoundUp } }
                });

            } else { 
                const sourceAccount = await tx.account.findFirst({ where: { userId, tipo: 'corrente' } });
                if (!sourceAccount) {
                    const error = new Error('Nenhuma conta corrente de origem encontrada para a automação.');
                    error.statusCode = 404;
                    throw error;
                }
                if (sourceAccount.id === destinationAccountId) {
                    const error = new Error('A conta de origem e destino do cofrinho não podem ser a mesma.');
                    error.statusCode = 400;
                    throw error;
                }
                
                await tx.transaction.create({
                    data: {
                        userId, accountId: sourceAccount.id, descricao: `Cofrinho Digital - Guardando o Troco`,
                        valor: totalRoundUp, data: new Date(), tipo: 'despesa', categoryId: investimentosCategoryId,
                        metodoPagamento: 'debito', pago: true,
                    }
                });

                await tx.transaction.create({
                    data: {
                        userId, accountId: destinationAccountId, descricao: `Depósito do Cofrinho Digital`,
                        valor: totalRoundUp, data: new Date(), tipo: 'receita', categoryId: investimentosCategoryId,
                        metodoPagamento: 'debito', pago: true,
                    }
                });
            }
            
            const entryIds = pendingEntries.map(e => e.id);
            await tx.roundUpEntry.updateMany({
                where: { id: { in: entryIds } },
                data: { processed: true, processedAt: new Date() },
            });
            
            await tx.automation.update({
                where: { id: automation.id },
                data: { lastRun: new Date() }
            });

            return {
                message: `R$ ${totalRoundUp.toFixed(2)} guardados com sucesso!`,
                amount: totalRoundUp
            };
        });
    }

    /**
     * Executa o pagamento automático de uma conta.
     * @param {string} userId - O ID do usuário.
     * @param {string} transactionId - O ID da transação pendente a ser paga.
     * @param {string | null} sourceAccountId - O ID da conta de origem.
     */
    static async runBillPayment(userId, transactionId, sourceAccountId) {
        return prisma.$transaction(async (tx) => {
            const user = await tx.user.findUnique({ where: { id: userId }});
            if (!user) throw new Error("Usuário não encontrado para automação.");

            const bill = await tx.transaction.findUnique({ where: { id: transactionId } });
            if (!bill || bill.pago) {
                console.log(`Fatura ${transactionId} já paga ou não encontrada. Pulando.`);
                return;
            }

            let finalSourceAccountId = sourceAccountId;
            let accountToDebit;

            // Se nenhuma conta foi definida, usa a de maior saldo.
            if (!finalSourceAccountId) {
                const accounts = await tx.account.findMany({
                    where: { userId, tipo: 'corrente' },
                    include: { transactions: { where: { pago: true } } }
                });
                if (accounts.length === 0) throw new Error("Nenhuma conta corrente encontrada para pagamento automático.");

                const accountsWithBalance = accounts.map(account => {
                    const balance = Number(account.saldoInicial) + account.transactions.reduce((acc, t) => acc + (t.tipo === 'receita' ? Number(t.valor) : -Number(t.valor)), 0);
                    return { ...account, currentBalance: balance };
                });
                
                accountsWithBalance.sort((a, b) => b.currentBalance - a.currentBalance);
                accountToDebit = accountsWithBalance[0];
                finalSourceAccountId = accountToDebit.id;
            } else {
                const foundAccount = await tx.account.findUnique({ where: { id: finalSourceAccountId }, include: { transactions: { where: { pago: true } } } });
                const balance = Number(foundAccount.saldoInicial) + foundAccount.transactions.reduce((acc, t) => acc + (t.tipo === 'receita' ? Number(t.valor) : -Number(t.valor)), 0);
                accountToDebit = { ...foundAccount, currentBalance: balance };
            }

            // **NOVO**: Validação de saldo
            if (accountToDebit.currentBalance < Number(bill.valor)) {
                await NotificationService.createNotification(tx, user, {
                    title: 'Falha no Pagamento Automático',
                    message: `Saldo insuficiente na conta "${accountToDebit.nome}" para pagar a despesa "${bill.descricao}".`,
                    type: 'BUDGET_ALERT', // Reutilizando um tipo de alerta
                    relatedId: bill.id,
                });
                console.warn(`Pagamento automático da transação ${transactionId} pulado por falta de saldo.`);
                return; // Pula a execução
            }
            
            // Marca a transação como paga e define a conta de origem.
            const updatedBill = await tx.transaction.update({
                where: { id: transactionId },
                data: { 
                    pago: true,
                    accountId: finalSourceAccountId
                },
            });
            
            await NotificationService.createNotification(tx, user, {
                title: 'Pagamento Automático Realizado',
                message: `Sua conta recorrente "${updatedBill.descricao}" de ${updatedBill.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} foi paga.`,
                type: 'TRANSACTION_CREATED',
                relatedId: updatedBill.id,
            });

            console.log(`✅ Pagamento automático da transação ${transactionId} concluído.`);
            return updatedBill;
        });
    }
}

export default AutomationService;
