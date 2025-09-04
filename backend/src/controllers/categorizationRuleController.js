// backend/src/controllers/categorizationRuleController.js
import { PrismaClient } from '@prisma/client';
import AuditService from '../services/auditService.js';
const prisma = new PrismaClient();

class CategorizationRuleController {
    /**
     * Busca todas as regras de categorização para o usuário logado.
     */
    async getRules(req, res, next) {
        const userId = req.user.id;
        try {
            const rules = await prisma.categorizationRule.findMany({
                where: { userId },
                include: {
                    category: true, // Inclui os dados da categoria relacionada
                },
                orderBy: { createdAt: 'desc' },
            });
            res.json(rules);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Cria uma nova regra de categorização.
     */
    async createRule(req, res, next) {
        const { keyword, categoryId } = req.body;
        const userId = req.user.id;

        if (!keyword || !categoryId) {
            return res.status(400).json({ message: 'Palavra-chave e categoria são obrigatórias.' });
        }

        try {
            const newRule = await prisma.categorizationRule.create({
                data: {
                    userId,
                    keyword,
                    categoryId,
                    conditionType: 'CONTAINS', // Padrão por enquanto
                },
                include: { category: true },
            });

            await AuditService.log({
                userId,
                action: 'CREATE_CATEGOZATION_RULE',
                entity: 'CATEGORIZATION_RULE',
                entityId: newRule.id,
                details: { after: newRule },
                ipAddress: req.ip,
            });

            res.status(201).json(newRule);
        } catch (error) {
            if (error.code === 'P2002') { // Violação de chave única (ex: se criarmos uma)
                return res.status(409).json({ message: 'Esta regra já existe.' });
            }
            next(error);
        }
    }

    /**
     * Deleta uma regra de categorização.
     */
    async deleteRule(req, res, next) {
        const { id } = req.params;
        const userId = req.user.id;

        try {
            const ruleToDelete = await prisma.categorizationRule.findUnique({ where: { id: id, userId: userId }});
             if (!ruleToDelete) {
                return res.status(404).json({ message: 'Regra não encontrada.' });
            }

            await prisma.categorizationRule.delete({
                where: {
                    id: id,
                    userId: userId, // Garante que o usuário só pode deletar suas próprias regras
                },
            });

             await AuditService.log({
                userId,
                action: 'DELETE_CATEGOZATION_RULE',
                entity: 'CATEGORIZATION_RULE',
                entityId: id,
                details: { before: ruleToDelete },
                ipAddress: req.ip,
            });

            res.status(204).send();
        } catch (error) {
            // Se o registro não for encontrado (P2025), o errorHandler geral tratará
            next(error);
        }
    }
    
    /**
     * Deleta TODAS as regras de categorização para o usuário logado.
     */
    async deleteAllRules(req, res, next) {
        const userId = req.user.id;
        try {
            const { count } = await prisma.categorizationRule.deleteMany({
                where: { userId },
            });

            await AuditService.log({
                userId,
                action: 'DELETE_ALL_CATEGORIZATION_RULES',
                entity: 'CATEGORIZATION_RULE',
                entityId: userId, // Usamos o userId como referência para a ação em massa
                details: { deletedCount: count },
                ipAddress: req.ip,
            });

            res.status(200).json({ message: `${count} regras foram excluídas com sucesso.` });

        } catch (error) {
            next(error);
        }
    }
}

export default new CategorizationRuleController();
