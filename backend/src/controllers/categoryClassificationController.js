// backend/src/controllers/categoryClassificationController.js
import CategoryClassificationService from '../services/categoryClassificationService.js';
import AuditService from '../services/auditService.js';

class CategoryClassificationController {
    /**
     * GET /api/category-classifications
     * Listar todas as classificações do usuário
     */
    async getAll(req, res, next) {
        try {
            const userId = req.user.id;
            const classifications = await CategoryClassificationService.getClassifications(userId);
            res.json(classifications);
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/category-classifications/statistics
     * Obter estatísticas de classificações
     */
    async getStatistics(req, res, next) {
        try {
            const userId = req.user.id;
            const stats = await CategoryClassificationService.getStatistics(userId);
            res.json(stats);
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/category-classifications/:categoryId
     * Obter classificação de uma categoria específica
     */
    async getOne(req, res, next) {
        try {
            const userId = req.user.id;
            const { categoryId } = req.params;

            const classification = await CategoryClassificationService.getClassification(userId, categoryId);

            if (!classification) {
                return res.status(404).json({ message: 'Classificação não encontrada.' });
            }

            res.json(classification);
        } catch (error) {
            next(error);
        }
    }

    /**
     * PUT /api/category-classifications/:categoryId
     * Atualizar classificação de uma categoria
     */
    async update(req, res, next) {
        try {
            const userId = req.user.id;
            const { categoryId } = req.params;
            const { classification } = req.body;

            const updated = await CategoryClassificationService.setClassification(userId, categoryId, classification);

            await AuditService.log({
                userId,
                action: 'UPDATE_CATEGORY_CLASSIFICATION',
                entity: 'CATEGORY_CLASSIFICATION',
                entityId: updated.id,
                details: { categoryId, classification },
                ipAddress: req.ip,
            });

            res.json(updated);
        } catch (error) {
            next(error);
        }
    }

    /**
     * POST /api/category-classifications/bulk
     * Atualizar múltiplas classificações
     */
    async bulkUpdate(req, res, next) {
        try {
            const userId = req.user.id;
            const { classifications } = req.body;

            const results = await CategoryClassificationService.bulkSetClassifications(userId, classifications);

            await AuditService.log({
                userId,
                action: 'BULK_UPDATE_CATEGORY_CLASSIFICATION',
                entity: 'CATEGORY_CLASSIFICATION',
                details: { count: results.length },
                ipAddress: req.ip,
            });

            res.json({ success: true, updated: results });
        } catch (error) {
            next(error);
        }
    }

    /**
     * POST /api/category-classifications/initialize
     * Inicializar classificações padrão
     */
    async initialize(req, res, next) {
        try {
            const userId = req.user.id;

            await CategoryClassificationService.initializeDefaults(userId);

            await AuditService.log({
                userId,
                action: 'INITIALIZE_CATEGORY_CLASSIFICATIONS',
                entity: 'CATEGORY_CLASSIFICATION',
                details: {},
                ipAddress: req.ip,
            });

            const classifications = await CategoryClassificationService.getClassifications(userId);
            res.json({ success: true, classifications });
        } catch (error) {
            next(error);
        }
    }

    /**
     * POST /api/category-classifications/reset
     * Resetar para padrões
     */
    async reset(req, res, next) {
        try {
            const userId = req.user.id;

            await CategoryClassificationService.resetToDefaults(userId);

            await AuditService.log({
                userId,
                action: 'RESET_CATEGORY_CLASSIFICATIONS',
                entity: 'CATEGORY_CLASSIFICATION',
                details: {},
                ipAddress: req.ip,
            });

            const classifications = await CategoryClassificationService.getClassifications(userId);
            res.json({ success: true, classifications });
        } catch (error) {
            next(error);
        }
    }

    /**
     * DELETE /api/category-classifications/:categoryId
     * Remover classificação
     */
    async delete(req, res, next) {
        try {
            const userId = req.user.id;
            const { categoryId } = req.params;

            await CategoryClassificationService.removeClassification(userId, categoryId);

            await AuditService.log({
                userId,
                action: 'DELETE_CATEGORY_CLASSIFICATION',
                entity: 'CATEGORY_CLASSIFICATION',
                details: { categoryId },
                ipAddress: req.ip,
            });

            res.status(204).send();
        } catch (error) {
            next(error);
        }
    }
}

export default new CategoryClassificationController();
