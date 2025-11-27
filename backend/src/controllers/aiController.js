
// backend/src/controllers/aiController.js
import pkg from '@prisma/client';
const { PrismaClient } = pkg;
import { suggestCategoryFlow } from '../ai/flows/category-suggestion-flow.js';
import { searchTransactionsFlow } from '../ai/flows/transaction-search-flow.js';
import { habitAnalysisFlow } from '../ai/flows/habit-analysis-flow.js';
import { opportunityAnalysisFlow } from '../ai/flows/opportunity-analysis-flow.js';
import { inspirationalQuoteFlow } from '../ai/flows/inspirational-quote-flow.js';
import { receiptOcrFlow } from '../ai/flows/receipt-ocr-flow.js';
import { dailySummaryFlow } from '../ai/flows/daily-summary-flow.js';
import { budgetSuggestionFlow } from '../ai/flows/budget-suggestion-flow.js';
import { goalProjectionFlow } from '../ai/flows/goal-projection-flow.js';
import { startOfDay, endOfDay, subMonths } from 'date-fns';
import AuditService from '../services/auditService.js';
import GamificationService from '../services/gamificationService.js';
import { createWorker } from 'tesseract.js';
import sharp from 'sharp';

let tesseractWorker = null;

const getTesseractWorker = async () => {
    if (!tesseractWorker) {
        console.log('Initializing Tesseract Worker...');
        tesseractWorker = await createWorker('por');
    }
    return tesseractWorker;
};

const prisma = new PrismaClient();

class AiController {
    /**
     * Recebe a descrição de uma transação e usa um fluxo de IA para sugerir a categoria.
     */
    async suggestCategory(req, res, next) {
        const { description } = req.body;
        if (!description) {
            return res.status(400).json({ message: 'A descrição é obrigatória.' });
        }
        try {
            const result = await suggestCategoryFlow({ description });
            res.json(result);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Recebe uma consulta em linguagem natural e usa um fluxo de IA para
     * traduzi-la em filtros estruturados para a busca de transações.
     */
    async searchTransactions(req, res, next) {
        const { query } = req.body;
        if (!query) {
            return res.status(400).json({ message: 'A consulta é obrigatória.' });
        }
        try {
            const result = await searchTransactionsFlow({ query });
            res.json(result);
        } catch (error) {
            next(error);
        }
    }

    async analyzeHabits(req, res, next) {
        const userId = req.user.id;
        try {
            const [transactions, profile, goals] = await Promise.all([
                prisma.transaction.findMany({ where: { userId, tipo: 'despesa' }, take: 100, orderBy: { data: 'desc' } }),
                prisma.user.findUnique({ where: { id: userId } }),
                prisma.goal.findMany({ where: { userId, status: 'IN_PROGRESS' } })
            ]);

            const input = {
                transactions: JSON.stringify(transactions),
                profile: JSON.stringify(profile),
                goals: JSON.stringify(goals),
            };

            const result = await habitAnalysisFlow(input);

            // Salva a análise no histórico
            const analysisRecord = await prisma.aiAnalysis.create({
                data: {
                    userId,
                    type: 'HABIT_ANALYSIS',
                    analysisText: result.analysis,
                    relevantTransactionIds: JSON.stringify(result.relevantTransactionIds || [])
                }
            });

            await AuditService.log({
                userId,
                action: 'RUN_AI_ANALYSIS',
                entity: 'AI_ANALYSIS',
                entityId: analysisRecord.id,
                details: { type: 'HABIT_ANALYSIS' },
                ipAddress: req.ip,
            });

            res.json(result);
        } catch (error) {
            next(error);
        }
    }

    async analyzeOpportunities(req, res, next) {
        const userId = req.user.id;
        try {
            const [transactions, profile, goals] = await Promise.all([
                prisma.transaction.findMany({ where: { userId }, take: 100, orderBy: { data: 'desc' } }),
                prisma.user.findUnique({ where: { id: userId } }),
                prisma.goal.findMany({ where: { userId, status: 'IN_PROGRESS' } })
            ]);

            const input = {
                transactions: JSON.stringify(transactions),
                profile: JSON.stringify(profile),
                goals: JSON.stringify(goals)
            };

            const result = await opportunityAnalysisFlow(input);

            // Salva a análise no histórico
            const analysisRecord = await prisma.aiAnalysis.create({
                data: {
                    userId,
                    type: 'OPPORTUNITY_ANALYSIS',
                    analysisText: result.analysis,
                    relevantTransactionIds: JSON.stringify(result.relevantTransactionIds || [])
                }
            });

            await AuditService.log({
                userId,
                action: 'RUN_AI_ANALYSIS',
                entity: 'AI_ANALYSIS',
                entityId: analysisRecord.id,
                details: { type: 'OPPORTUNITY_ANALYSIS' },
                ipAddress: req.ip,
            });

            res.json(result);
        } catch (error) {
            next(error);
        }
    }

    async getInspirationalQuote(req, res, next) {
        try {
            const result = await inspirationalQuoteFlow();
            res.json(result);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Recebe uma imagem de recibo e usa um fluxo de IA para extrair dados.
     */

    /**
     * Recebe uma imagem de recibo e usa um fluxo de IA ou Tesseract para extrair dados.
     */
    async scanReceipt(req, res, next) {
        const { imageDataUri, provider = 'GEMINI' } = req.body; // provider: 'GEMINI' | 'TESSERACT'
        if (!imageDataUri) {
            return res.status(400).json({ message: 'A imagem do recibo é obrigatória.' });
        }
        try {
            let result;

            if (provider === 'TESSERACT') {
                const worker = await getTesseractWorker();

                // Preprocess image with sharp
                const base64Data = imageDataUri.replace(/^data:image\/\w+;base64,/, "");
                const imgBuffer = Buffer.from(base64Data, 'base64');

                const processedBuffer = await sharp(imgBuffer)
                    .resize(1000, null, { withoutEnlargement: true }) // Resize to reasonable width
                    .grayscale() // Convert to grayscale
                    .normalize() // Enhance contrast
                    .sharpen() // Sharpen text
                    .toBuffer();

                // Tesseract accepts buffer directly
                const { data: { text } } = await worker.recognize(processedBuffer);

                // Do NOT terminate worker here to reuse it
                // await worker.terminate(); 

                // Improved Parsing Logic for Tesseract
                const lines = text.split('\n').filter(line => line.trim().length > 0);
                const items = [];
                let total = 0;
                let date = null;

                // Helper to clean number strings (OCR common errors)
                const parsePrice = (str) => {
                    // Replace common OCR typos
                    let cleaned = str.replace(/[oO]/g, '0')
                        .replace(/[lI]/g, '1')
                        .replace(/[S]/g, '5');
                    // Remove currency symbols and spaces
                    cleaned = cleaned.replace(/[R$€£]/g, '').trim();
                    // Fix decimal separator: 1.000,00 -> 1000.00 or 10,00 -> 10.00
                    // If contains comma, replace dots with nothing and comma with dot
                    if (cleaned.includes(',')) {
                        cleaned = cleaned.replace(/\./g, '').replace(',', '.');
                    }
                    return parseFloat(cleaned);
                };

                // Regex for date (DD/MM/YYYY, DD-MM-YYYY, DD.MM.YYYY, YYYY-MM-DD)
                const dateRegex = /(\d{2}[\/\.-]\d{2}[\/\.-]\d{4})|(\d{4}[\/\.-]\d{2}[\/\.-]\d{2})/;

                for (const line of lines) {
                    const trimmedLine = line.trim();

                    // Try to find date
                    if (!date) {
                        const dateMatch = trimmedLine.match(dateRegex);
                        if (dateMatch) {
                            let d = dateMatch[0];
                            // Normalize separators
                            d = d.replace(/[\.-]/g, '/');
                            const parts = d.split('/');
                            if (parts[0].length === 4) {
                                // YYYY/MM/DD
                                date = `${parts[0]}-${parts[1]}-${parts[2]}`;
                            } else {
                                // DD/MM/YYYY
                                date = `${parts[2]}-${parts[1]}-${parts[0]}`;
                            }
                        }
                    }

                    // Try to find price at the end of the line
                    // Look for the last "word" that looks like a number
                    const words = trimmedLine.split(/\s+/);
                    if (words.length > 1) {
                        const lastWord = words[words.length - 1];
                        // Check if it looks like a price (digits, comma/dot, 2 decimal places usually)
                        if (/[\d.,]+/.test(lastWord)) {
                            const price = parsePrice(lastWord);
                            if (!isNaN(price)) {
                                const description = words.slice(0, words.length - 1).join(' ');
                                const upperDesc = description.toUpperCase();

                                // Check if it's a Total line
                                if (upperDesc.includes('TOTAL') && !upperDesc.includes('SUB') && !upperDesc.includes('ITENS')) {
                                    total = price;
                                }
                                // Check if it's an Item line (filter out common non-item lines)
                                else if (
                                    description.length > 2 &&
                                    !upperDesc.includes('SUBTOTAL') &&
                                    !upperDesc.includes('TROCO') &&
                                    !upperDesc.includes('DINHEIRO') &&
                                    !upperDesc.includes('CARTAO') &&
                                    !upperDesc.includes('PAGAMENTO') &&
                                    !upperDesc.includes('CNPJ') &&
                                    !upperDesc.includes('CPF')
                                ) {
                                    items.push({ descricao: description, valor: price });
                                }
                            }
                        }
                    }
                }

                // If no explicit total found, sum items
                if (total === 0 && items.length > 0) {
                    total = items.reduce((sum, item) => sum + item.valor, 0);
                }

                result = {
                    estabelecimento: lines[0] || 'Desconhecido', // Assume first line is establishment
                    data: date,
                    valor: total,
                    itens: items
                };

            } else {
                // Default to Gemini (Genkit Flow)
                result = await receiptOcrFlow({ imageDataUri });
            }

            await AuditService.log({
                userId: req.user.id,
                action: 'RUN_AI_OCR',
                entity: 'TRANSACTION',
                entityId: 'N/A',
                details: { result, provider },
                ipAddress: req.ip,
            });

            res.json(result);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Gera um resumo textual e em áudio das transações do dia atual.
     */
    async getDailySummary(req, res, next) {
        const userId = req.user.id;
        try {
            const user = await prisma.user.findUnique({ where: { id: userId } });
            if (!user || !user.enableDailySummary) {
                return res.status(403).json({ message: "Funcionalidade não ativada pelo usuário." });
            }

            const todayStart = startOfDay(new Date());
            const todayEnd = endOfDay(new Date());

            const transactions = await prisma.transaction.findMany({
                where: {
                    userId,
                    data: {
                        gte: todayStart,
                        lte: todayEnd,
                    },
                },
                orderBy: {
                    data: 'desc'
                }
            });

            const input = {
                transactions: JSON.stringify(transactions),
            };

            const result = await dailySummaryFlow(input);

            await prisma.$transaction(async (tx) => {
                await GamificationService.triggerXpEvent(tx, userId, 'DAILY_CHECKIN');
            });

            res.json(result);

        } catch (error) {
            next(error);
        }
    }

    /**
    * Sugere um valor de orçamento para uma categoria com base no histórico de gastos.
    */
    async suggestBudget(req, res, next) {
        const userId = req.user.id;
        const { categoryId, categoryName } = req.body;

        if (!categoryId || !categoryName) {
            return res.status(400).json({ message: 'ID e nome da categoria são obrigatórios.' });
        }

        try {
            const user = await prisma.user.findUnique({ where: { id: userId } });
            if (!user || !user.enableBudgetSuggestion) {
                return res.status(403).json({ message: "Funcionalidade não ativada pelo usuário." });
            }

            const threeMonthsAgo = subMonths(new Date(), 3);

            const transactions = await prisma.transaction.findMany({
                where: {
                    userId,
                    categoryId,
                    tipo: 'despesa',
                    data: { gte: threeMonthsAgo }
                },
                orderBy: { data: 'desc' }
            });

            const input = {
                transactions: JSON.stringify(transactions),
                categoryName,
            };

            const result = await budgetSuggestionFlow(input);
            res.json(result);

        } catch (error) {
            next(error);
        }
    }

    /**
     * Roda uma simulação de projeção de meta.
     */
    async getGoalProjection(req, res, next) {
        const userId = req.user.id;
        const { goalId, simulationQuery } = req.body;

        if (!goalId || !simulationQuery) {
            return res.status(400).json({ message: 'ID da meta e consulta de simulação são obrigatórios.' });
        }

        try {
            const user = await prisma.user.findUnique({ where: { id: userId } });
            if (!user || !user.enableGoalProjection) {
                return res.status(403).json({ message: "Funcionalidade não ativada pelo usuário." });
            }

            const goal = await prisma.goal.findFirst({
                where: { id: goalId, userId },
                include: { contributions: { orderBy: { date: 'asc' } } }
            });
            if (!goal) {
                return res.status(404).json({ message: "Meta não encontrada." });
            }

            const input = {
                goal: JSON.stringify(goal),
                simulationQuery
            };

            const result = await goalProjectionFlow(input);
            res.json(result);

        } catch (error) {
            next(error);
        }
    }
}

export default new AiController();
