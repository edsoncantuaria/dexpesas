// backend/src/services/categoryClassificationService.js
import pkg from '@prisma/client';

const { PrismaClient, CategoryClassificationType } = pkg;
const prisma = new PrismaClient();

/**
 * Categorias padrão para cada tipo de classificação
 */
const DEFAULT_CLASSIFICATIONS = {
    ESSENTIAL: [
        // Moradia
        'moradia', 'habitação', 'aluguel', 'condomínio', 'iptu', 'casa', 'apartamento',
        // Alimentação
        'mercado', 'supermercado', 'alimentação', 'feira', 'açougue', 'padaria', 'hortifruti',
        // Transporte
        'transporte', 'combustível', 'gasolina', 'ônibus', 'metrô', 'uber', 'táxi', '99', 'estacionamento',
        // Educação
        'educação', 'escola', 'faculdade', 'universidade', 'curso', 'livros', 'material escolar',
        // Saúde
        'saúde', 'médico', 'dentista', 'farmácia', 'remédio', 'plano de saúde', 'consulta', 'exame',
        'hospital', 'clínica', 'laboratório', 'medicamento',
        // Contas e Serviços Essenciais
        'luz', 'água', 'internet', 'telefone', 'celular', 'gás', 'energia', 'conta',
        'contas fixas', 'telefonia', 'banda larga',
        // Higiene e Cuidados Pessoais
        'higiene', 'cuidados', 'pessoal', 'farmácia', 'produtos de limpeza', 'limpeza',
        // Vestuário Básico
        'roupa', 'calçado', 'vestuário',
        // Seguros e Impostos
        'seguro', 'previdência', 'imposto', 'impostos', 'taxa', 'taxas',
        // Serviços Bancários
        'banco', 'tarifa', 'anuidade', 'manutenção',
        // Família
        'família', 'filhos', 'filho', 'creche',
    ],
    LEISURE: [
        // Entretenimento
        'lazer', 'entretenimento', 'diversão', 'hobby', 'hobbies',
        // Alimentação Fora
        'restaurante', 'bar', 'lanchonete', 'cafeteria', 'delivery', 'ifood', 'uber eats',
        'fast food', 'pizza', 'hambúrguer',
        // Cultura
        'cinema', 'teatro', 'show', 'evento', 'ingresso', 'espetáculo',
        // Viagens
        'viagem', 'turismo', 'hotel', 'pousada', 'passagem', 'hospedagem',
        // Streaming e Assinaturas de Entretenimento
        'assinaturas', 'assinatura', 'netflix', 'spotify', 'youtube', 'amazon prime', 'disney', 'hbo', 'streaming',
        'apple music', 'deezer', 'games', 'xbox', 'playstation', 'steam',
        // Compras não essenciais
        'shopping', 'compras', 'eletrônicos', 'gadget', 'acessórios',
        // Esportes e Fitness (não essencial)
        'academia', 'personal', 'esporte', 'fitness',
        // Beleza não essencial
        'salão', 'manicure', 'pedicure', 'spa', 'estética', 'beleza',
        // Pets (considerado lazer)
        'pet', 'veterinário', 'ração', 'animal',
        // Presentes e Ocasiões Especiais
        'presente', 'presentes', 'doação', 'doações',
    ],
    INVESTMENT: [
        'investimento', 'investimentos', 'poupança', 'aplicação', 'renda fixa',
        'tesouro', 'fundos', 'cdb', 'lci', 'lca', 'previdência privada',
        'aporte', 'b3', 'xp', 'nubank investimentos', 'inter investimentos',
        // Palavras que precisam de match mais específico
    ],
};

class CategoryClassificationService {
    /**
     * Obt\u00e9m todas as classificações de um usuário
     * @param {string} userId
     * @returns {Promise<Array>}
     */
    static async getClassifications(userId) {
        return prisma.categoryClassification.findMany({
            where: { userId },
            include: { category: true },
        });
    }

    /**
     * Obtém a classificação de uma categoria específica
     * @param {string} userId
     * @param {string} categoryId
     * @returns {Promise<Object|null>}
     */
    static async getClassification(userId, categoryId) {
        return prisma.categoryClassification.findUnique({
            where: { userId_categoryId: { userId, categoryId } },
            include: { category: true },
        });
    }

    /**
     * Define a classificação de uma categoria
     * @param {string} userId
     * @param {string} categoryId
     * @param {CategoryClassificationType} classificationType
     * @returns {Promise<Object>}
     */
    static async setClassification(userId, categoryId, classificationType) {
        // Validar que a categoria existe e pertence ao usuário (ou é global)
        const category = await prisma.category.findFirst({
            where: {
                id: categoryId,
                OR: [{ userId }, { userId: null }],
            },
        });

        if (!category) {
            const error = new Error('Categoria não encontrada ou não pertence ao usuário.');
            error.statusCode = 404;
            throw error;
        }

        // Validar tipo de classificação
        if (!Object.values(CategoryClassificationType).includes(classificationType)) {
            const error = new Error('Tipo de classificação inválido.');
            error.statusCode = 400;
            throw error;
        }

        // Upsert da classificação
        return prisma.categoryClassification.upsert({
            where: { userId_categoryId: { userId, categoryId } },
            create: {
                userId,
                categoryId,
                classification: classificationType,
            },
            update: {
                classification: classificationType,
            },
            include: { category: true },
        });
    }

    /**
     * Atualizar múltiplas classificações de uma vez
     * @param {string} userId
     * @param {Array<{categoryId: string, classification: CategoryClassificationType}>} updates
     * @returns {Promise<Array>}
     */
    static async bulkSetClassifications(userId, updates) {
        const results = [];

        for (const update of updates) {
            const result = await this.setClassification(userId, update.categoryId, update.classification);
            results.push(result);
        }

        return results;
    }

    /**
     * Obtém IDs de categorias por tipo de classificação
     * @param {string} userId
     * @param {CategoryClassificationType} classificationType
     * @returns {Promise<Array<string>>}
     */
    static async getCategoryIdsByType(userId, classificationType) {
        const classifications = await prisma.categoryClassification.findMany({
            where: {
                userId,
                classification: classificationType,
            },
            select: { categoryId: true },
        });

        return classifications.map((c) => c.categoryId);
    }

    /**
     * Inicializa classificações padrão para um usuário
     * @param {string} userId
     * @returns {Promise<void>}
     */
    static async initializeDefaults(userId) {
        // Buscar todas as categorias do usuário E categorias globais
        const categories = await prisma.category.findMany({
            where: {
                OR: [
                    { userId: userId },
                    { userId: null }, // Categorias globais
                ],
            },
            select: { id: true, nome: true, label: true },
        });

        console.log(`📦 Encontradas ${categories.length} categorias para classificar`);

        const classifications = [];

        // Para cada categoria, determinar sua classificação
        for (const category of categories) {
            const categoryName = (category.label || category.nome || '').toLowerCase().trim();

            let classificationType = CategoryClassificationType.OTHER;

            // Verificar se contém palavras-chave de ESSENTIAL
            if (DEFAULT_CLASSIFICATIONS.ESSENTIAL.some(keyword =>
                categoryName.includes(keyword.toLowerCase())
            )) {
                classificationType = CategoryClassificationType.ESSENTIAL;
            }
            // Verificar se contém palavras-chave de LEISURE
            else if (DEFAULT_CLASSIFICATIONS.LEISURE.some(keyword =>
                categoryName.includes(keyword.toLowerCase())
            )) {
                classificationType = CategoryClassificationType.LEISURE;
            }
            // Verificar se contém palavras-chave de INVESTMENT
            else if (DEFAULT_CLASSIFICATIONS.INVESTMENT.some(keyword =>
                categoryName.includes(keyword.toLowerCase())
            )) {
                classificationType = CategoryClassificationType.INVESTMENT;
            }

            classifications.push({
                userId,
                categoryId: category.id,
                classification: classificationType,
            });
        }

        // Criar todas as classificações em lote
        if (classifications.length > 0) {
            await prisma.categoryClassification.createMany({
                data: classifications,
                skipDuplicates: true,
            });
        }

        console.log(`✅ Inicializadas ${classifications.length} classificações padrão para usuário ${userId}`);
        return classifications;
    }

    /**
     * Deleta todas as classificações do usuário e reinicializa com padrões
     */
    static async resetToDefaults(userId) {
        // Deletar todas as classificações existentes
        await prisma.categoryClassification.deleteMany({
            where: { userId },
        });

        // Reinicializar com padrões usando a mesma lógica melhorada
        return await this.initializeDefaults(userId);
    }

    /**
     * Remove uma classificação específica
     * @param {string} userId
     * @param {string} categoryId
     * @returns {Promise<void>}
     */
    static async removeClassification(userId, categoryId) {
        await prisma.categoryClassification.deleteMany({
            where: { userId, categoryId },
        });
    }

    /**
     * Obtém estatísticas de classificações de um usuário
     * @param {string} userId
     * @returns {Promise<Object>}
     */
    static async getStatistics(userId) {
        const classifications = await this.getClassifications(userId);

        const stats = {
            total: classifications.length,
            essential: 0,
            leisure: 0,
            investment: 0,
            other: 0,
        };

        classifications.forEach((c) => {
            switch (c.classification) {
                case CategoryClassificationType.ESSENTIAL:
                    stats.essential++;
                    break;
                case CategoryClassificationType.LEISURE:
                    stats.leisure++;
                    break;
                case CategoryClassificationType.INVESTMENT:
                    stats.investment++;
                    break;
                case CategoryClassificationType.OTHER:
                    stats.other++;
                    break;
            }
        });

        return stats;
    }
}

export default CategoryClassificationService;
