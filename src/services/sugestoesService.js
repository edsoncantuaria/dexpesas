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
        // 1. Buscar transações candidatas
        const transacoesCandidatas = await prisma.transaction.findMany({
            where: {
                userId,
                tipo,
                pago: true, // Apenas transações passadas e pagas
                descricao: {
                    contains: termo,
                },
            },
            include: {
                category: { select: { nome: true } },
                tags: { select: { name: true } },
            },
            take: 100, // Pega um pool maior para ranquear
            orderBy: {
                data: 'desc',
            },
        });

        if (transacoesCandidatas.length === 0) {
            return [];
        }

        // 2. Pré-processar e calcular frequência, limpando a descrição
        const descricoesUnicas = {};
        transacoesCandidatas.forEach(t => {
            // Remove a parte da parcela (ex: " (1/12)") da descrição
            const cleanedDescription = t.descricao.replace(/\s\(\d+\/\d+\)$/, '').trim();
            const descLower = cleanedDescription.toLowerCase();

            if (!descricoesUnicas[descLower]) {
                descricoesUnicas[descLower] = { ...t, descricao: cleanedDescription, frequencia: 0 };
            }
            descricoesUnicas[descLower].frequencia++;
        });
        const transacoesUnicas = Object.values(descricoesUnicas);

        // 3. Calcular similaridade, scores e ranquear
        const sugestoesRanqueadas = transacoesUnicas.map(t => {
            // Score de Similaridade de Texto
            const similaridade = findBestMatch(termo.toLowerCase(), [t.descricao.toLowerCase()]).bestMatch.rating;

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

        // 4. Ordenar pelo score e retornar o limite
        return sugestoesRanqueadas
            .sort((a, b) => b.score - a.score)
            .slice(0, limite);
    }
}

export default SugestoesService;
