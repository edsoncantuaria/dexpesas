

// backend/src/controllers/automationController.js
import { PrismaClient } from '@prisma/client';
import AutomationService from '../services/automationService.js';
import AuditService from '../services/auditService.js';

const prisma = new PrismaClient();

class AutomationController {
    /**
     * Busca todas as configurações de automação para o usuário logado.
     * Se não existir, cria a configuração padrão (desativada).
     */
    async getAutomations(req, res, next) {
        const userId = req.user.id;
        const { type, goalId } = req.query;

        try {
            const whereClause = { userId };
            if (type) whereClause.type = type;
            if (goalId) whereClause.goalId = goalId;
            
            const automations = await prisma.automation.findMany({ where: whereClause });
            
            // Para garantir que a automação de Round Up sempre exista para a UI
            if (!automations.some(a => a.type === 'ROUND_UP')) {
                const roundUpAutomation = await prisma.automation.create({
                    data: { 
                        userId, 
                        type: 'ROUND_UP', 
                        enabled: false, 
                        config: {},
                        goalId: null,
                        scheduleType: 'MANUAL',
                    }
                });
                automations.push(roundUpAutomation);
            }

            res.json(automations); 
        } catch (error) {
            next(error);
        }
    }

    /**
     * Atualiza a configuração de uma automação específica (ex: ROUND_UP ou BILL_PAY).
     */
    async updateAutomation(req, res, next) {
        const { type } = req.params;
        const { enabled, config, goalId, scheduleType, scheduleValue, recorrenciaId } = req.body;
        const userId = req.user.id;

        try {
            let uniqueIdentifier;
            const dataToUpdate = { enabled, config, scheduleType, scheduleValue };
            
            const originalAutomation = await prisma.automation.findFirst({ where: { userId, type, recorrenciaId: recorrenciaId || null }});

            // Lógica para determinar o identificador único correto
            if (type === 'BILL_PAY') {
                 uniqueIdentifier = { userId_type_recorrenciaId: { userId, type, recorrenciaId } };
            } else if (type === 'ROUND_UP') {
                 // Para ROUND_UP, a combinação de userId e type é única, mas também pode ter um goalId.
                 // A chave @@unique([userId, type, goalId]) lida com isso.
                 // Buscamos pela automação de round-up existente para obter seu ID.
                 const existingRoundUp = await prisma.automation.findFirst({ where: { userId, type: 'ROUND_UP' }});
                 if (existingRoundUp) {
                    uniqueIdentifier = { id: existingRoundUp.id };
                 } else {
                    uniqueIdentifier = { userId_type_goalId: { userId, type, goalId: goalId || null } };
                 }
            } else {
                 const err = new Error('Tipo de automação desconhecido.');
                 err.statusCode = 400;
                 throw err;
            }
            
            const updatedAutomation = await prisma.automation.upsert({
                where: uniqueIdentifier,
                update: dataToUpdate,
                create: { 
                    userId, 
                    type, 
                    ...dataToUpdate, 
                    goalId: type === 'ROUND_UP' ? goalId : null, 
                    recorrenciaId: type === 'BILL_PAY' ? recorrenciaId : null
                },
            });
            
            await AuditService.log({
                userId,
                action: 'UPDATE_AUTOMATION',
                entity: 'AUTOMATION',
                entityId: updatedAutomation.id,
                details: { before: originalAutomation, after: updatedAutomation },
                ipAddress: req.ip,
            });

            res.json(updatedAutomation);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Roda uma automação manualmente. Principalmente para o "Guardar o Troco".
     */
    async runAutomation(req, res, next) {
        const { type } = req.params;
        const userId = req.user.id;

        try {
            if (type === 'ROUND_UP') {
                const result = await AutomationService.runRoundUp(userId);
                
                await AuditService.log({
                    userId,
                    action: 'RUN_AUTOMATION',
                    entity: 'AUTOMATION',
                    entityId: type,
                    details: { type: 'ROUND_UP', result },
                    ipAddress: req.ip,
                });
                
                res.json(result);
            } else {
                const err = new Error('Tipo de automação desconhecido.');
                err.statusCode = 400;
                throw err;
            }
        } catch (error) {
            next(error);
        }
    }

    /**
     * Busca todas as despesas recorrentes do usuário para a automação de Bill Pay.
     */
    async getRecurringExpensesForBillPay(req, res, next) {
        const userId = req.user.id;
        try {
            const recurringTransactions = await prisma.transaction.findMany({
                where: {
                    userId,
                    recurrenceType: { not: null },
                    tipo: 'despesa',
                    recorrenciaId: { not: null },
                },
                distinct: ['recorrenciaId'], // Pega apenas uma transação de cada série
                select: {
                    id: true,
                    descricao: true,
                    recorrenciaId: true,
                    valor: true,
                    data: true,
                }
            });

            // Busca as automações existentes para essas recorrências
            const recurrenceIds = recurringTransactions.map(t => t.recorrenciaId).filter(Boolean);
            const automations = await prisma.automation.findMany({
                where: {
                    userId,
                    type: 'BILL_PAY',
                    recorrenciaId: { in: recurrenceIds },
                }
            });

            const automationsMap = new Map(automations.map(a => [a.recorrenciaId, a]));

            const result = recurringTransactions.map(t => ({
                ...t,
                automation: automationsMap.get(t.recorrenciaId || '') || null
            }));

            res.json(result);
        } catch (error) {
            next(error);
        }
    }
}

export default new AutomationController();
