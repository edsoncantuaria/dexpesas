// src/controllers/dataController.js
import { PrismaClient } from '@prisma/client';
import CacheService from '../services/cacheService.js';
import GamificationService from '../services/gamificationService.js';

const prisma = new PrismaClient();

const CACHE_KEYS = {
    CATEGORIES: 'categories',
};

class DataController {
    async getAllCategories(req, res, next) {
        try {
            // Tenta buscar do cache primeiro
            const cachedCategories = await CacheService.get(CACHE_KEYS.CATEGORIES);
            if (cachedCategories) {
                return res.json(cachedCategories);
            }

            // Se não estiver no cache, busca no banco
            const categories = await prisma.category.findMany({
                orderBy: {
                    nome: 'asc',
                }
            });
            
            // Salva no cache por 1 hora (3600 segundos)
            await CacheService.set(CACHE_KEYS.CATEGORIES, categories, 3600);

            res.json(categories);
        } catch (error) {
            next(error);
        }
    }

    async getGamificationProfile(req, res, next) {
        // Modificado para aceitar um ID de usuário, ou usar o do usuário logado
        const userId = req.params.userId || req.user.id;
        try {
            const user = await prisma.user.findUnique({
                where: { id: userId },
                select: {
                    level: true,
                    xp: true,
                    heroClass: true, // Adicionado para consistência
                }
            });

            if (!user) {
                return res.status(404).json({ message: 'Perfil de gamificação não encontrado.' });
            }

            // Invoca o serviço para calcular os atributos dinamicamente
            const calculatedAttributes = await GamificationService.calculateAllAttributes(userId);

            const profileData = {
                level: user.level,
                xp: user.xp,
                heroClass: user.heroClass,
                ...calculatedAttributes // Combina os atributos calculados
            };
            
            res.json(profileData);
        } catch (error) {
            next(error);
        }
    }

    async getAllAchievements(req, res, next) {
        try {
            const achievements = await prisma.achievement.findMany({
                orderBy: { name: 'asc' }
            });
            res.json(achievements);
        } catch (error) {
            next(error);
        }
    }

    async getUnlockedAchievements(req, res, next) {
        try {
            const unlocked = await prisma.unlockedAchievement.findMany({
                where: { userId: req.user.id }
            });
            res.json(unlocked);
        } catch (error) {
            next(error);
        }
    }
    
    async getInventory(req, res, next) {
        const userId = req.user.id;
        try {
            const inventory = await prisma.userItem.findMany({
                where: { userId },
                include: { item: true },
                orderBy: { item: { name: 'asc' } },
            });
            res.json(inventory);
        } catch (error) {
            next(error);
        }
    }
}

export default new DataController();
