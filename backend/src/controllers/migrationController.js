// backend/src/controllers/migrationController.js
import pkg from '@prisma/client';
const { PrismaClient } = pkg;
import { format, parse, setDate } from 'date-fns';
import CardBalanceService from '../services/cardBalanceService.js';
import AuditService from '../services/auditService.js';

const prisma = new PrismaClient();

/**
 * Helper para obter mapa de categoria
 */
async function getCategoryMap(tx) {
    const categories = await tx.category.findMany();
    return new Map(categories.map(cat => [cat.nome, cat.id]));
}

class MigrationController {
    /**
     * POST /api/migration/start
     * Inicia o processo de migração (apenas marca que está em andamento)
     */
    async startMigration(req, res, next) {
        const userId = req.user.id;

        try {
            const user = await prisma.user.findUnique({
                where: { id: userId },
                select: { hasCompletedMigration: true },
            });

            if (user.hasCompletedMigration === 1) {
                return res.status(400).json({
                    message: 'Migração já foi concluída anteriormente.'
                });
            }

            res.json({ message: 'Migração iniciada. Prossiga com os próximos passos.' });
        } catch (error) {
            next(error);
        }
    }

    /**
     * POST /api/migration/accounts
     * Cria múltiplas contas de débito/investimento em lote
     */
    async createAccounts(req, res, next) {
        const userId = req.user.id;
        const { accounts } = req.body;

        try {
            const user = await prisma.user.findUnique({
                where: { id: userId },
                select: { hasCompletedMigration: true },
            });

            if (user.hasCompletedMigration === 1) {
                return res.status(400).json({
                    message: 'Migração já foi concluída. Não é possível adicionar contas por este fluxo.'
                });
            }

            const createdAccounts = await prisma.$transaction(async (tx) => {
                const accountPromises = accounts.map(account =>
                    tx.account.create({
                        data: {
                            userId,
                            nome: account.nome,
                            instituicao: account.instituicao,
                            tipo: account.tipo,
                            saldoInicial: parseFloat(account.saldoInicial),
                            currency: account.currency || 'BRL',
                            color: account.color || null,
                            icone: account.icone || null,
                            isArchived: false,
                        },
                    })
                );

                return Promise.all(accountPromises);
            });

            // Audit log para cada conta criada
            for (const account of createdAccounts) {
                await AuditService.log({
                    userId,
                    action: 'CREATE_ACCOUNT',
                    entity: 'ACCOUNT',
                    entityId: account.id,
                    details: { after: account, migrationFlow: true },
                    ipAddress: req.ip,
                });
            }

            res.status(201).json({
                message: `${createdAccounts.length} conta(s) criada(s) com sucesso.`,
                accounts: createdAccounts,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * POST /api/migration/cards
     * Cria múltiplos cartões de crédito em lote
     */
    async createCards(req, res, next) {
        const userId = req.user.id;
        const { cards } = req.body;

        try {
            const user = await prisma.user.findUnique({
                where: { id: userId },
                select: { hasCompletedMigration: true },
            });

            if (user.hasCompletedMigration === 1) {
                return res.status(400).json({
                    message: 'Migração já foi concluída. Não é possível adicionar cartões por este fluxo.'
                });
            }

            const createdCards = await prisma.$transaction(async (tx) => {
                const cardPromises = cards.map(card =>
                    tx.card.create({
                        data: {
                            userId,
                            nome: card.nome,
                            limite: parseFloat(card.limite),
                            diaFechamento: card.diaFechamento,
                            diaVencimento: card.diaVencimento,
                            bandeira: card.bandeira || 'visa',
                            status: 'ACTIVE',
                            billingCurrency: card.billingCurrency || 'BRL',
                            currencyForConversion: card.billingCurrency || 'BRL',
                            currentInvoiceAmount: 0,
                            paymentAccountId: card.paymentAccountId || null,
                        },
                    })
                );

                return Promise.all(cardPromises);
            });

            // Audit log para cada cartão criado
            for (const card of createdCards) {
                await AuditService.log({
                    userId,
                    action: 'CREATE_CARD',
                    entity: 'CARD',
                    entityId: card.id,
                    details: { after: card, migrationFlow: true },
                    ipAddress: req.ip,
                });
            }

            res.status(201).json({
                message: `${createdCards.length} cartão(ões) criado(s) com sucesso.`,
                cards: createdCards,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * POST /api/migration/card-history
     * Registra histórico de faturas de um cartão (cria transações agregadas mensais)
     */
    async createCardHistory(req, res, next) {
        const userId = req.user.id;
        const { cardId, history } = req.body;

        try {
            const user = await prisma.user.findUnique({
                where: { id: userId },
                select: { hasCompletedMigration: true },
            });

            if (user.hasCompletedMigration === 1) {
                return res.status(400).json({
                    message: 'Migração já foi concluída. Não é possível adicionar histórico por este fluxo.'
                });
            }

            // Verifica se o cartão pertence ao usuário
            const card = await prisma.card.findFirst({
                where: { id: cardId, userId },
            });

            if (!card) {
                return res.status(404).json({ message: 'Cartão não encontrado.' });
            }

            const createdTransactions = await prisma.$transaction(async (tx) => {
                const categoryMap = await getCategoryMap(tx);

                // Categoria para despesas de migração (pode ser "Outros" ou criar uma específica)
                const migrationCategoryId = categoryMap.get('Outros') || categoryMap.values().next().value;

                const transactionPromises = history.map(month => {
                    // Parse month string (YYYY-MM) e criar data no dia de vencimento
                    const monthDate = parse(month.month, 'yyyy-MM', new Date());
                    const transactionDate = setDate(monthDate, card.diaVencimento);

                    return tx.transaction.create({
                        data: {
                            userId,
                            cardId,
                            descricao: `Fatura ${format(monthDate, 'MMM/yyyy')} - Migração`,
                            valor: parseFloat(month.totalAmount),
                            tipo: 'despesa',
                            data: transactionDate,
                            categoryId: migrationCategoryId,
                            metodoPagamento: 'credito',
                            currency: card.billingCurrency,
                            status: month.isPaid ? 'POSTED' : (month.isClosed ? 'PENDING' : 'PENDING'),
                            pago: month.isPaid,
                            notes: 'Transação criada via migração inicial',
                        },
                    });
                });

                return Promise.all(transactionPromises);
            });

            // Recalcular saldo do cartão
            await CardBalanceService.recalculateCardSummary(cardId);

            await AuditService.log({
                userId,
                action: 'CREATE_CARD_HISTORY',
                entity: 'CARD',
                entityId: cardId,
                details: {
                    transactionCount: createdTransactions.length,
                    migrationFlow: true,
                },
                ipAddress: req.ip,
            });

            res.status(201).json({
                message: `Histórico de ${createdTransactions.length} mês(es) criado com sucesso.`,
                transactions: createdTransactions,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * POST /api/migration/complete
     * Marca a migração como concluída (seta flag hasCompletedMigration)
     */
    async completeMigration(req, res, next) {
        const userId = req.user.id;

        try {
            const updatedUser = await prisma.user.update({
                where: { id: userId },
                data: { hasCompletedMigration: 1 }, // 1 = completou
                select: {
                    id: true,
                    hasCompletedMigration: true,
                },
            });

            await AuditService.log({
                userId,
                action: 'COMPLETE_MIGRATION',
                entity: 'USER',
                entityId: userId,
                details: { hasCompletedMigration: true },
                ipAddress: req.ip,
            });

            res.json({
                message: 'Migração concluída com sucesso!',
                user: updatedUser,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * POST /api/migration/skip
     * Marca migração como concluída sem importar dados (usuário escolheu fazer manualmente)
     */
    async skipMigration(req, res, next) {
        const userId = req.user.id;

        try {
            const updatedUser = await prisma.user.update({
                where: { id: userId },
                data: { hasCompletedMigration: 1 }, // 1 = completou (pulou definitivo)
                select: {
                    id: true,
                    hasCompletedMigration: true,
                },
            });

            await AuditService.log({
                userId,
                action: 'SKIP_MIGRATION',
                entity: 'USER',
                entityId: userId,
                details: { hasCompletedMigration: 1, skipped: true },
                ipAddress: req.ip,
            });

            res.json({
                message: 'Você optou por fazer a migração manualmente.',
                user: updatedUser,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * POST /api/migration/postpone
     * Marca migração como postergada (status 2) - aparece card em serviços
     */
    async postponeMigration(req, res, next) {
        const userId = req.user.id;

        try {
            const updatedUser = await prisma.user.update({
                where: { id: userId },
                data: { hasCompletedMigration: 2 }, // 2 = postergou
                select: {
                    id: true,
                    hasCompletedMigration: true,
                },
            });

            await AuditService.log({
                userId,
                action: 'POSTPONE_MIGRATION',
                entity: 'USER',
                entityId: userId,
                details: { hasCompletedMigration: 2, postponed: true },
                ipAddress: req.ip,
            });

            res.json({
                message: 'Migração postergada. Você pode retomar depois.',
                user: updatedUser,
            });
        } catch (error) {
            next(error);
        }
    }
}

export default new MigrationController();
