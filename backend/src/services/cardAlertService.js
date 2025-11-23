// backend/src/services/cardAlertService.js
import pkg from '@prisma/client';
const { PrismaClient } = pkg;
import { getInvoicePeriod } from '../utils/date-helpers.js';
import { startOfDay, addDays } from 'date-fns';

const prisma = new PrismaClient();

class CardAlertService {
    /**
     * Verifica faturas próximas do vencimento
     * @param {string} userId - ID do usuário
     * @param {string} cardId - ID do cartão (opcional)
     */
    async checkDueInvoices(userId, cardId = null) {
        const where = { userId };
        if (cardId) where.id = cardId;

        const cards = await prisma.card.findMany({ where });
        const alerts = [];

        for (const card of cards) {
            const today = new Date();
            const { end: closingDate } = getInvoicePeriod(card, today);

            // Calcular data de vencimento
            const dueDate = new Date(closingDate);
            dueDate.setDate(card.diaVencimento);

            // Se já passou do fechamento mas não do vencimento, avançar 1 mês
            if (dueDate <= closingDate) {
                dueDate.setMonth(dueDate.getMonth() + 1);
            }

            const daysUntilDue = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));

            // Buscar saldo da fatura
            const { start, end } = getInvoicePeriod(card, today);
            const invoiceExpenses = await prisma.transaction.aggregate({
                _sum: { valor: true },
                where: { cardId: card.id, tipo: 'despesa', data: { gte: start, lte: end } }
            });
            const invoicePayments = await prisma.transaction.aggregate({
                _sum: { valor: true },
                where: { cardId: card.id, tipo: 'receita', data: { gte: start, lte: end } }
            });
            const balance = (Number(invoiceExpenses._sum.valor) || 0) - (Number(invoicePayments._sum.valor) || 0);

            // Pular se fatura já está paga
            if (balance <= 0) continue;

            // Determinar severidade e criar alerta
            let severity = null;
            let title = '';
            let message = '';

            if (daysUntilDue < 0) {
                // Vencido
                severity = 'CRITICAL';
                title = `Fatura vencida - ${card.nome}`;
                message = `A fatura do cartão ${card.nome} está vencida há ${Math.abs(daysUntilDue)} dias. Valor: R$ ${balance.toFixed(2)}`;
            } else if (daysUntilDue === 0) {
                // Vence hoje
                severity = 'CRITICAL';
                title = `Fatura vence hoje - ${card.nome}`;
                message = `A fatura do cartão ${card.nome} vence hoje! Valor: R$ ${balance.toFixed(2)}`;
            } else if (daysUntilDue === 1) {
                // Vence amanhã
                severity = 'CRITICAL';
                title = `Fatura vence amanhã - ${card.nome}`;
                message = `A fatura do cartão ${card.nome} vence amanhã. Valor: R$ ${balance.toFixed(2)}`;
            } else if (daysUntilDue <= 3) {
                // 2-3 dias
                severity = 'WARNING';
                title = `Fatura próxima - ${card.nome}`;
                message = `A fatura do cartão ${card.nome} vence em ${daysUntilDue} dias. Valor: R$ ${balance.toFixed(2)}`;
            } else if (daysUntilDue <= 7) {
                // 4-7 dias
                severity = 'INFO';
                title = `Fatura a vencer - ${card.nome}`;
                message = `A fatura do cartão ${card.nome} vence em ${daysUntilDue} dias. Valor: R$ ${balance.toFixed(2)}`;
            }

            if (severity) {
                // Verificar se já existe alerta similar recente (últimas 24h)
                const existingAlert = await prisma.cardAlert.findFirst({
                    where: {
                        cardId: card.id,
                        userId,
                        type: 'DUE_DATE',
                        triggeredAt: { gte: addDays(new Date(), -1) },
                        dismissed: false
                    }
                });

                if (!existingAlert) {
                    const alert = await this.createAlert(
                        userId,
                        card.id,
                        'DUE_DATE',
                        severity,
                        title,
                        message,
                        {
                            dueDate: dueDate.toISOString(),
                            balance,
                            daysUntilDue
                        }
                    );
                    alerts.push(alert);
                }
            }
        }

        return alerts;
    }

    /**
     * Verifica utilização de limite do cartão
     * @param {string} userId - ID do usuário
     * @param {string} cardId - ID do cartão (opcional)
     */
    async checkLimitUsage(userId, cardId = null) {
        const where = { userId };
        if (cardId) where.id = cardId;

        const cards = await prisma.card.findMany({ where });
        const alerts = [];

        for (const card of cards) {
            // Calcular saldo global
            const globalExpenses = await prisma.transaction.aggregate({
                _sum: { valor: true },
                where: { cardId: card.id, tipo: 'despesa' }
            });
            const globalPayments = await prisma.transaction.aggregate({
                _sum: { valor: true },
                where: { cardId: card.id, tipo: 'receita' }
            });

            const totalUsed = (Number(globalExpenses._sum.valor) || 0) - (Number(globalPayments._sum.valor) || 0);
            const limit = Number(card.limite);
            const usagePercentage = (totalUsed / limit) * 100;

            let severity = null;
            let title = '';
            let message = '';

            if (usagePercentage >= 100) {
                severity = 'CRITICAL';
                title = `Limite excedido - ${card.nome}`;
                message = `Você excedeu o limite do cartão ${card.nome}. Usado: R$ ${totalUsed.toFixed(2)} de R$ ${limit.toFixed(2)} (${usagePercentage.toFixed(1)}%)`;
            } else if (usagePercentage >= 90) {
                severity = 'WARNING';
                title = `Limite quase esgotado - ${card.nome}`;
                message = `Você usou ${usagePercentage.toFixed(1)}% do limite do cartão ${card.nome}. Disponível: R$ ${(limit - totalUsed).toFixed(2)}`;
            } else if (usagePercentage >= 80) {
                severity = 'INFO';
                title = `Atenção ao limite - ${card.nome}`;
                message = `Você já usou ${usagePercentage.toFixed(1)}% do limite do cartão ${card.nome}.`;
            }

            if (severity) {
                // Verificar se já existe alerta similar recente (últimas 24h)
                const existingAlert = await prisma.cardAlert.findFirst({
                    where: {
                        cardId: card.id,
                        userId,
                        type: 'LIMIT_WARNING',
                        triggeredAt: { gte: addDays(new Date(), -1) },
                        dismissed: false
                    }
                });

                if (!existingAlert) {
                    const alert = await this.createAlert(
                        userId,
                        card.id,
                        'LIMIT_WARNING',
                        severity,
                        title,
                        message,
                        {
                            limit,
                            used: totalUsed,
                            available: limit - totalUsed,
                            usagePercentage
                        }
                    );
                    alerts.push(alert);
                }
            }
        }

        return alerts;
    }

    /**
     * Cria um novo alerta
     * @param {string} userId - ID do usuário
     * @param {string} cardId - ID do cartão
     * @param {string} type - Tipo de alerta
     * @param {string} severity - Severidade
     * @param {string} title - Título
     * @param {string} message - Mensagem
     * @param {Object} metadata - Metadados adicionais
     */
    async createAlert(userId, cardId, type, severity, title, message, metadata = {}) {
        return await prisma.cardAlert.create({
            data: {
                userId,
                cardId,
                type,
                severity,
                title,
                message,
                metadata
            }
        });
    }

    /**
     * Busca alertas do usuário
     * @param {string} userId - ID do usuário
     * @param {Object} filters - Filtros (cardId, type, severity, read, dismissed)
     */
    async getUserAlerts(userId, filters = {}) {
        const where = { userId };

        if (filters.cardId) where.cardId = filters.cardId;
        if (filters.type) where.type = filters.type;
        if (filters.severity) where.severity = filters.severity;
        if (filters.read !== undefined) where.read = filters.read;
        if (filters.dismissed !== undefined) where.dismissed = filters.dismissed;

        return await prisma.cardAlert.findMany({
            where,
            include: {
                card: {
                    select: {
                        id: true,
                        nome: true,
                        bandeira: true
                    }
                }
            },
            orderBy: [
                { read: 'asc' },
                { triggeredAt: 'desc' }
            ]
        });
    }

    /**
     * Marca alerta como lido
     * @param {string} alertId - ID do alerta
     * @param {string} userId - ID do usuário
     */
    async markAsRead(alertId, userId) {
        return await prisma.cardAlert.updateMany({
            where: { id: alertId, userId },
            data: { read: true }
        });
    }

    /**
     * Descarta alerta
     * @param {string} alertId - ID do alerta
     * @param {string} userId - ID do usuário
     */
    async dismissAlert(alertId, userId) {
        return await prisma.cardAlert.updateMany({
            where: { id: alertId, userId },
            data: { dismissed: true, read: true }
        });
    }

    /**
     * Executa todas as verificações
     * @param {string} userId - ID do usuário
     */
    async runAllChecks(userId) {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { enableLimitAlerts: true }
        });

        if (!user || !user.enableLimitAlerts) {
            return { skipped: true, reason: 'Alertas desabilitados para este usuário' };
        }

        const dueAlerts = await this.checkDueInvoices(userId);
        const limitAlerts = await this.checkLimitUsage(userId);

        return {
            dueAlerts: dueAlerts.length,
            limitAlerts: limitAlerts.length,
            total: dueAlerts.length + limitAlerts.length
        };
    }
}

export default new CardAlertService();
