// backend/src/services/categorizationService.js
import { PrismaClient } from '@prisma/client';
import { defaultRules } from '../config/seedData.js'; // Importa as regras padrão

const prisma = new PrismaClient();

// Pré-processa as regras padrão para otimização
const processedDefaultRules = defaultRules.map(rule => ({
    ...rule,
    lowerCaseKeyword: rule.termo.toLowerCase(),
}));

class CategorizationService {
    /**
     * Aplica regras de categorização (primeiro as do usuário, depois as padrão)
     * a uma descrição de transação e retorna o NOME da categoria.
     * @param {string} userId - O ID do usuário.
     * @param {string} description - A descrição da transação.
     * @returns {Promise<string|null>} O NOME da categoria ou nulo se nenhuma regra corresponder.
     */
    static async applyRulesAndGetName(userId, description) {
        if (!userId || !description) {
            return null;
        }

        const lowerCaseDescription = description.toLowerCase();

        // 1. Busca e verifica as regras personalizadas do usuário primeiro
        const userRules = await prisma.categorizationRule.findMany({
            where: { userId },
            include: { category: true }, // Inclui o objeto da categoria para pegar o nome
        });

        if (userRules.length > 0) {
            for (const rule of userRules) {
                const lowerCaseKeyword = rule.keyword.toLowerCase();
                if (rule.conditionType === 'CONTAINS' && lowerCaseDescription.includes(lowerCaseKeyword)) {
                    console.log(`Regra do USUÁRIO encontrada: "${rule.keyword}" -> Categoria ${rule.category.nome}`);
                    return rule.category.nome;
                }
            }
        }

        // 2. Se nenhuma regra do usuário corresponder, verifica as regras padrão em memória
        const allCategories = await prisma.category.findMany();
        const categoryMap = new Map(allCategories.map(cat => [cat.nome, cat]));

        for (const rule of processedDefaultRules) {
            if (lowerCaseDescription.includes(rule.lowerCaseKeyword)) {
                 const category = categoryMap.get(rule.categoriaNome);
                 if (category) {
                    console.log(`Regra PADRÃO encontrada: "${rule.termo}" -> Categoria ${category.nome}`);
                    return category.nome;
                 }
            }
        }

        return null; // Nenhuma regra encontrada
    }
}

export default CategorizationService;
