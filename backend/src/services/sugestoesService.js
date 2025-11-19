// backend/src/services/sugestoesService.js
import pkg from '@prisma/client';
const { PrismaClient } = pkg;
import { findBestMatch } from 'string-similarity';
import { differenceInDays } from 'date-fns';

const prisma = new PrismaClient();

// Pesos para o cálculo do score de ranking
const WEIGHTS = {
    SIMILARITY: 0.5,
    RECENCY: 0.25,
    VALUE_PROXIMITY: 0.15,
    FREQUENCY: 0.1,
};
const RECENCY_MAX_DAYS = 180; // Transações com mais de 180 dias têm peso de recência 0

class SugestoesService {
    /**
     * @typedef {Object} SugestaoTransacao
     * @property {string} idTransacaoReferencia
     * @property {string} descricao
     * @property {string} categoriaId
     * @property {string} categoriaNome
     * @property {string[]} tags
     * @property {'pix'|'debito'|'credito'|'dinheiro'} metodoPagamento
     * @property {string|null} contaId
     * @property {string|null} cartaoId
     * @property {number} valorAproximado
     * @property {number} similaridade
     * @property {number} recenciaDias
     * @property {number} frequencia
     */

    /**
     * Retorna uma lista de sugestões de transações baseada em buscas e ranking.
     * @param {object} params
     * @param {string} params.userId
     * @param {string} params.termo
     * @param {'receita'|'despesa'} params.tipo
     * @param {number} [params.valor]
     * @param {number} params.limite
     * @returns {Promise<SugestaoTransacao[]>}
     */
    static async getSugestoesTransacao({ userId, termo, tipo, valor, limite }) {
        // 1. Buscar um pool maior de transações recentes do mesmo tipo
        const transacoesRecentes = await prisma.transaction.findMany({
            where: {
                userId,
                tipo,
                pago: true,
            },
            include: {
                category: { select: { nome: true } },
                tags: { select: { name: true } },
            },
            take: 500, // Aumenta o pool de busca para melhores resultados
            orderBy: {
                data: 'desc',
            },
        });

        // 2. Filtrar em memória por conter o termo (case-insensitive)
        const lowerCaseTermo = termo.toLowerCase();
        const transacoesCandidatas = transacoesRecentes.filter(t => 
            t.descricao.toLowerCase().includes(lowerCaseTermo)
        );

        if (transacoesCandidatas.length === 0) {
            return [];
        }

        // 3. Pré-processar e calcular frequência
        const descricoesUnicas = {};
        transacoesCandidatas.forEach(t => {
            const descLower = t.descricao.toLowerCase();
            if (!descricoesUnicas[descLower]) {
                descricoesUnicas[descLower] = { ...t, frequencia: 0 };
            }
            descricoesUnicas[descLower].frequencia++;
        });
        const transacoesUnicas = Object.values(descricoesUnicas);

        // 4. Calcular similaridade, scores e ranquear
        const sugestoesRanqueadas = transacoesUnicas.map(t => {
            // Score de Similaridade de Texto
            const similaridade = findBestMatch(lowerCaseTermo, [t.descricao.toLowerCase()]).bestMatch.rating;

            // Score de Recência
            const recenciaDias = differenceInDays(new Date(), new Date(t.data));
            const recenciaNorm = Math.max(0, 1 - (recenciaDias / RECENCY_MAX_DAYS));

            // Score de Proximidade de Valor
            let proximidadeValor = 0;
            if (valor !== undefined) {
                const diff = Math.abs(valor - Number(t.valor));
                proximidadeValor = 1 - Math.min(1, diff / Math.max(valor, 1));
            }

            // Score de Frequência (normalização simples)
            const frequenciaNorm = Math.min(1, t.frequencia / 10); // Normaliza assumindo que 10+ ocorrências é o máximo

            // Score Final
            const score =
                similaridade * WEIGHTS.SIMILARITY +
                recenciaNorm * WEIGHTS.RECENCY +
                proximidadeValor * WEIGHTS.VALUE_PROXIMITY +
                frequenciaNorm * WEIGHTS.FREQUENCY;
            
            return {
                idTransacaoReferencia: t.id,
                descricao: t.descricao,
                categoriaId: t.categoryId,
                categoriaNome: t.category?.nome,
                tags: t.tags.map(tag => tag.name),
                metodoPagamento: t.metodoPagamento,
                contaId: t.accountId,
                cartaoId: t.cardId,
                valorAproximado: Number(t.valor),
                similaridade,
                recenciaDias,
                frequencia: t.frequencia,
                score,
            };
        });

        // 5. Ordenar pelo score e retornar o limite
        return sugestoesRanqueadas
            .sort((a, b) => b.score - a.score)
            .slice(0, limite);
    }
}

export default SugestoesService;
