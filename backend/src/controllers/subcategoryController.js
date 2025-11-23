import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
import { CACHE_KEYS, CacheService } from '../services/cacheService.js';

class SubcategoryController {
    /**
     * Get all subcategories for a specific parent category
     */
    async getSubcategories(req, res, next) {
        try {
            const { parentId } = req.params;
            const userId = req.user.id;

            const subcategories = await prisma.category.findMany({
                where: {
                    parentCategoryId: parentId,
                    OR: [
                        { userId: userId },
                        { userId: null } // Include default subcategories
                    ]
                },
                orderBy: { label: 'asc' }
            });

            res.json(subcategories);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Create a new subcategory
     */
    async createSubcategory(req, res, next) {
        try {
            const { parentId } = req.params;
            const { nome, label, icon, type } = req.body;
            const userId = req.user.id;

            // Verify parent exists
            const parent = await prisma.category.findUnique({
                where: { id: parentId }
            });

            if (!parent) {
                return res.status(404).json({ error: 'Parent category not found' });
            }

            const subcategory = await prisma.category.create({
                data: {
                    nome,
                    label,
                    icon,
                    type: parent.type, // Inherit type from parent
                    parentCategoryId: parentId,
                    userId
                }
            });

            // Invalidate cache
            await CacheService.del(`${CACHE_KEYS.CATEGORIES}:${userId}`);

            res.status(201).json(subcategory);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Update a subcategory
     */
    async updateSubcategory(req, res, next) {
        try {
            const { id } = req.params;
            const { label, icon } = req.body;
            const userId = req.user.id;

            const subcategory = await prisma.category.findFirst({
                where: { id, userId }
            });

            if (!subcategory) {
                return res.status(404).json({ error: 'Subcategory not found or unauthorized' });
            }

            const updated = await prisma.category.update({
                where: { id },
                data: { label, icon }
            });

            // Invalidate cache
            await CacheService.del(`${CACHE_KEYS.CATEGORIES}:${userId}`);

            res.json(updated);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Delete a subcategory
     */
    async deleteSubcategory(req, res, next) {
        try {
            const { id } = req.params;
            const userId = req.user.id;

            const subcategory = await prisma.category.findFirst({
                where: { id, userId }
            });

            if (!subcategory) {
                return res.status(404).json({ error: 'Subcategory not found or unauthorized' });
            }

            // Check for transactions
            const transactionCount = await prisma.transaction.count({
                where: { categoryId: id }
            });

            if (transactionCount > 0) {
                return res.status(400).json({
                    error: 'Cannot delete subcategory with existing transactions',
                    count: transactionCount
                });
            }

            await prisma.category.delete({
                where: { id }
            });

            // Invalidate cache
            await CacheService.del(`${CACHE_KEYS.CATEGORIES}:${userId}`);

            res.status(204).send();
        } catch (error) {
            next(error);
        }
    }
}

export default new SubcategoryController();
