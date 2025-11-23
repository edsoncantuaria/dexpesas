import prisma from '../config/prismaClient.js';
import CacheService from '../services/cacheService.js';

const CACHE_KEYS = {
    CATEGORIES: 'categories',
};

class CategoryController {
    // Get all categories (including subcategories structure if needed, or just flat list)
    async getAllCategories(req, res, next) {
        const cacheKey = `${CACHE_KEYS.CATEGORIES}:global`;
        try {
            // 1. Try cache
            const cachedCategories = await CacheService.get(cacheKey);
            if (cachedCategories) {
                return res.json(cachedCategories);
            }

            // 2. Fetch from DB
            // We fetch all categories that are either system default (userId: null) OR belong to the user
            const categories = await prisma.category.findMany({
                where: {
                    OR: [
                        { userId: null },
                        { userId: req.user.id }
                    ]
                },
                select: {
                    id: true,
                    nome: true,
                    label: true,
                    icon: true,
                    type: true,
                    parentCategoryId: true,
                    userId: true,
                },
                orderBy: { label: 'asc' },
            });

            // 3. Save to cache (only if it was a global fetch, but here it's user specific mixed with global)
            // Actually, since it's user specific, we shouldn't cache it globally.
            // We can cache it per user if we want, but for now let's skip caching or cache per user.
            // The original dataController cached it globally because it only fetched system categories.
            // Let's skip caching for now to ensure freshness with user categories.

            res.json(categories);
        } catch (error) {
            next(error);
        }
    }

    // Create a new category
    async createCategory(req, res, next) {
        try {
            const { nome, label, icon, type, parentCategoryId } = req.body;
            const userId = req.user.id;

            const category = await prisma.category.create({
                data: {
                    nome,
                    label: label || nome,
                    icon,
                    type,
                    parentCategoryId,
                    userId,
                },
            });

            res.status(201).json(category);
        } catch (error) {
            next(error);
        }
    }

    // Update a category
    async updateCategory(req, res, next) {
        try {
            const { id } = req.params;
            const { nome, label, icon, type, parentCategoryId } = req.body;
            const userId = req.user.id;

            // Verify ownership
            const existing = await prisma.category.findUnique({ where: { id } });
            if (!existing) return res.status(404).json({ message: 'Categoria não encontrada' });
            if (existing.userId !== userId) return res.status(403).json({ message: 'Sem permissão' });

            const category = await prisma.category.update({
                where: { id },
                data: {
                    nome,
                    label: label || nome,
                    icon,
                    type,
                    parentCategoryId,
                },
            });

            res.json(category);
        } catch (error) {
            next(error);
        }
    }

    // Delete a category
    async deleteCategory(req, res, next) {
        try {
            const { id } = req.params;
            const userId = req.user.id;

            // Verify ownership
            const existing = await prisma.category.findUnique({ where: { id } });
            if (!existing) return res.status(404).json({ message: 'Categoria não encontrada' });
            if (existing.userId !== userId) return res.status(403).json({ message: 'Sem permissão' });

            // Check for subcategories or transactions
            // If there are subcategories, we can't delete (or need to cascade/reassign)
            // For now, let's block if there are dependencies
            const subcategories = await prisma.category.count({ where: { parentCategoryId: id } });
            if (subcategories > 0) {
                return res.status(400).json({ message: 'Não é possível excluir categoria com subcategorias.' });
            }

            const transactions = await prisma.transaction.count({ where: { categoryId: id } });
            if (transactions > 0) {
                return res.status(400).json({ message: 'Não é possível excluir categoria com transações vinculadas.' });
            }

            await prisma.category.delete({ where: { id } });

            res.status(204).send();
        } catch (error) {
            next(error);
        }
    }
}

export default new CategoryController();
