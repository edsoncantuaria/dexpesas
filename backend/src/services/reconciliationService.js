// backend/src/services/reconciliationService.js
import pkg from '@prisma/client';
const { PrismaClient } = pkg;
import { parse as parseOfx } from 'ofx-js';
import { parse as parseCsv } from 'csv-parse';
import { differenceInDays, isValid, parse as parseDate, startOfDay, endOfDay } from 'date-fns';
import similarityPkg from 'string-similarity-js';
import minioClient from '../config/minioClient.js';
import config from '../config/config.js';

const findBestStringMatch =
    similarityPkg?.findBestMatch ||
    ((source, target) => {
        const baseScore =
            typeof similarityPkg?.getStringSimilarity === 'function'
                ? similarityPkg.getStringSimilarity(source, target)
                : source === target
                    ? 1
                    : 0;
        return { bestMatch: { rating: baseScore } };
    });


const prisma = new PrismaClient();

const DEFAULT_TIMEZONE = 'America/Sao_Paulo';
const TIMEZONE_OFFSETS = {
    UTC: 0,
    'America/Sao_Paulo': -180,
    'America/New_York': -300,
    'Europe/London': 0,
};
const MATCH_VALUE_TOLERANCE = 0.05; // até 5 centavos
export const BALANCE_TOLERANCE = 0.05;

const getTimezoneOffsetMinutes = (timezone) => {
    if (!timezone) return 0;
    return TIMEZONE_OFFSETS[timezone] ?? 0;
};

const convertDateToUtc = (date, timezone) => {
    if (!date || !(date instanceof Date) || !isValid(date)) return date;
    const offsetMinutes = getTimezoneOffsetMinutes(timezone);
    const base = Date.UTC(
        date.getFullYear(),
        date.getMonth(),
        date.getDate(),
        date.getHours(),
        date.getMinutes(),
        date.getSeconds(),
        date.getMilliseconds()
    );
    return new Date(base - offsetMinutes * 60 * 1000);
};

// Helper para converter stream em string
async function streamToString(stream) {
    const chunks = [];
    return new Promise((resolve, reject) => {
        stream.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
        stream.on('error', (err) => reject(err));
        stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')));
    });
}


class ReconciliationService {

    /**
     * Ponto de entrada principal. Determina o tipo de arquivo e chama o parser apropriado.
     */
    static async processStatementFile(filePath, reconciliationId, userId, fileType, mapping) {
        const reconciliation = await prisma.reconciliation.findUnique({ where: { id: reconciliationId } });
        if (!reconciliation) {
            throw new Error('Reconciliação não encontrada ao processar extrato.');
        }

        console.info(`[Reconciliation ${reconciliationId}] Iniciando processamento do arquivo ${fileType} (userId=${userId}).`);

        try {
            // Baixa o arquivo do MinIO
            const fileStream = await minioClient.getObject(config.minio.bucketName, filePath);
            const fileContent = await streamToString(fileStream);

            if (fileType === 'CSV') {
                return this.processCsvFile(fileContent, reconciliation, mapping || {});
            }
            return this.processOfxFile(fileContent, reconciliation);
        } catch (error) {
            console.error(
                `[Reconciliation ${reconciliationId}] Falha ao processar arquivo ${fileType}.`,
                {
                    filePath,
                    userId,
                    message: error.message,
                    stack: error.stack,
                },
            );
            throw error;
        }
    }

    /**
     * Processa um arquivo CSV, mapeia as colunas e importa as transações.
     */
    static async processCsvFile(fileContent, reconciliation, mapping = {}) {
        let records;
        try {
            records = await new Promise((resolve, reject) => {
                parseCsv(fileContent, {
                    columns: true,
                    skip_empty_lines: true,
                    trim: true,
                }, (err, parsedRecords) => {
                    if (err) return reject(err);
                    resolve(parsedRecords);
                });
            });
        } catch (error) {
            console.error(`[Reconciliation ${reconciliation.id}] Erro ao analisar CSV.`, { message: error.message, stack: error.stack });
            throw error;
        }

        console.info(`[Reconciliation ${reconciliation.id}] CSV processado com ${records.length} linhas.`);

        const timezone = mapping.timezone || reconciliation.statementTimezone || DEFAULT_TIMEZONE;

        const importedTransactionsToCreate = records.map((r, index) =>
            this.mapCsvTransaction(r, reconciliation.id, mapping, index, timezone)
        ).filter(Boolean);

        if (importedTransactionsToCreate.length === 0) {
            console.warn(`[Reconciliation ${reconciliation.id}] Nenhuma transação válida encontrada nas linhas do CSV.`);
            await prisma.reconciliation.update({ where: { id: reconciliation.id }, data: { status: 'FAILED' } });
            return { count: 0 };
        }

        await this.saveAndMatchTransactions(reconciliation.id, importedTransactionsToCreate, reconciliation);
        return { count: importedTransactionsToCreate.length };
    }

    /**
     * Mapeia uma única linha do CSV para o formato da nossa transação importada.
     */
    static mapCsvTransaction(record, reconciliationId, mapping, index, timezone) {
        const { date, description, amount, date_format, type, credit_value, debit_value } = mapping;

        const dateStr = record[date];
        const amountStrInput = record[amount] || '0';

        // Lógica de parsing de valor mais robusta
        let amountStr = amountStrInput.replace(/[R$\s]/g, '');
        if (amountStr.includes(',') && amountStr.includes('.')) {
            amountStr = amountStr.replace(/\./g, '').replace(',', '.');
        } else if (amountStr.includes(',')) {
            amountStr = amountStr.replace(',', '.');
        }
        const parsedAmount = parseFloat(amountStr);

        // Tenta vários formatos de data se um não for especificado
        const dateFormats = [date_format, 'yyyy-MM-dd', 'dd/MM/yyyy', 'MM/dd/yyyy'].filter(Boolean);
        let parsedDate;
        for (const format of dateFormats) {
            const dt = parseDate(dateStr, format, new Date());
            if (isValid(dt)) {
                parsedDate = dt;
                break;
            }
        }

        if (!parsedDate || !isValid(parsedDate) || isNaN(parsedAmount)) {
            console.warn(`Linha ${index + 2} do CSV ignorada devido a formato inválido.`);
            return null;
        }

        const normalizedDate = convertDateToUtc(parsedDate, timezone);

        let resolvedType = parsedAmount >= 0 ? 'CREDIT' : 'DEBIT';
        if (type && record[type]) {
            const rawType = record[type].toString().trim().toUpperCase();
            const creditToken = (credit_value || 'C').toString().trim().toUpperCase();
            const debitToken = (debit_value || 'D').toString().trim().toUpperCase();
            if (rawType === creditToken) {
                resolvedType = 'CREDIT';
            } else if (rawType === debitToken) {
                resolvedType = 'DEBIT';
            }
        }

        return {
            reconciliationId,
            date: normalizedDate,
            amount: Math.abs(parsedAmount),
            type: resolvedType,
            description: record[description] || 'Descrição não encontrada',
            fitId: `csv-${reconciliationId}-${index}`,
        };
    }

    /**
     * Processa um arquivo OFX, extrai os dados e importa as transações.
     */
    static async processOfxFile(fileContent, reconciliation) {
        // Pré-processamento do arquivo OFX para remover caracteres inválidos e cabeçalhos
        const ofxContent = fileContent
            .replace(/&/g, '&amp;') // Escapa o ampersand
            .replace(/<[A-Z0-9_]*>./g, (match) => match.replace(/&/g, '')) // Remove '&' dentro de tags
            .split('<OFX>')[1]; // Remove o cabeçalho

        if (!ofxContent) {
            console.warn(`Arquivo OFX vazio ou inválido para reconciliação ${reconciliation.id}.`);
            await prisma.reconciliation.update({ where: { id: reconciliation.id }, data: { status: 'FAILED' } });
            return { count: 0 };
        }

        const ofxParsed = await parseOfx(`<OFX>${ofxContent}`);

        const bankStatement = ofxParsed?.OFX?.BANKMSGSRSV1?.STMTTRNRS?.STMTRS;
        const creditCardStatement = ofxParsed?.OFX?.CREDITCARDMSGSRSV1?.CCSTMTTRNRS?.CCSTMTRS;

        const statement = bankStatement || creditCardStatement;

        if (!statement) {
            console.warn(`Estrutura OFX inválida para reconciliação ${reconciliation.id}. Nenhum extrato bancário ou de cartão encontrado.`);
            await prisma.reconciliation.update({ where: { id: reconciliation.id }, data: { status: 'FAILED' } });
            return { count: 0 };
        }

        const transactionList = statement.BANKTRANLIST || statement;
        const transactions = Array.isArray(transactionList?.STMTTRN)
            ? transactionList.STMTTRN
            : transactionList?.STMTTRN ? [transactionList.STMTTRN] : [];

        if (transactions.length === 0) {
            console.warn(`Reconciliation ${reconciliation.id}: OFX sem transações dentro do período informado.`);
            await prisma.reconciliation.update({ where: { id: reconciliation.id }, data: { status: 'PENDING_REVIEW' } });
            return { count: 0 };
        }
        console.info(`[Reconciliation ${reconciliation.id}] OFX com ${transactions.length} transações detectadas.`);

        const timezone = reconciliation.statementTimezone || DEFAULT_TIMEZONE;
        const importedTransactionsToCreate = transactions.map(t => this.mapOfxTransaction(t, reconciliation.id, timezone));

        const closingBalance = statement?.LEDGERBAL?.BALAMT ? parseFloat(statement.LEDGERBAL.BALAMT) : null;
        const currency = statement?.LEDGERBAL?.CURDEF || statement?.CURDEF || reconciliation.statementCurrency;
        let openingBalance = reconciliation.statementOpeningBalance;
        if (closingBalance !== null && !Number.isNaN(closingBalance)) {
            const netChange = transactions.reduce((acc, tx) => acc + parseFloat(tx.TRNAMT || 0), 0);
            openingBalance = closingBalance - netChange;
        }

        await prisma.reconciliation.update({
            where: { id: reconciliation.id },
            data: {
                statementClosingBalance: closingBalance ?? reconciliation.statementClosingBalance,
                statementOpeningBalance: openingBalance ?? reconciliation.statementOpeningBalance,
                statementCurrency: currency || reconciliation.statementCurrency,
            },
        });

        await this.saveAndMatchTransactions(reconciliation.id, importedTransactionsToCreate, reconciliation);

        return { count: importedTransactionsToCreate.length };
    }

    static slugify(text) {
        return text
            .toString()
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)+/g, '');
    }

    /**
     * Mapeia uma transação do formato OFX para o nosso modelo Prisma.
     */
    static mapOfxTransaction(t, reconciliationId, timezone) {
        const amount = parseFloat(t.TRNAMT);
        const dateString = t.DTPOSTED.substring(0, 8);
        const year = parseInt(dateString.substring(0, 4), 10);
        const month = parseInt(dateString.substring(4, 6), 10) - 1;
        const day = parseInt(dateString.substring(6, 8), 10);
        const postDate = convertDateToUtc(new Date(year, month, day), timezone);

        const description = t.MEMO;
        let metadata = null;

        // Regex para detectar "Parcela X/Y"
        // Aceita "Parcela X/Y", "X/Y", "Parc X/Y"
        const installmentMatch = description.match(/(?:Parcela|Parc\.?|)\s*(\d+)\s*\/\s*(\d+)/i);

        if (installmentMatch) {
            const currentInstallment = parseInt(installmentMatch[1], 10);
            const totalInstallments = parseInt(installmentMatch[2], 10);

            // Limpar nome da loja para gerar ID do grupo
            // Remove "Parcela X/Y" e prefixos comuns
            let cleanDesc = description
                .replace(/(?:Parcela|Parc\.?|)\s*(\d+)\s*\/\s*(\d+)/i, '') // Remove a parte da parcela
                .replace(/^(Zp|Mp|Cp|Ifd|Mercadopago|Mercadolivre)\s*\*?/i, '') // Remove prefixos
                .trim();

            // Se ficou vazio (ex: só tinha prefixo e parcela), usa a descrição original limpa
            if (!cleanDesc) {
                cleanDesc = description.replace(/(?:Parcela|Parc\.?|)\s*(\d+)\s*\/\s*(\d+)/i, '').trim();
            }

            const storeSlug = ReconciliationService.slugify(cleanDesc);
            const installmentGroupId = `${storeSlug}-${totalInstallments}`;

            metadata = {
                installmentNumber: currentInstallment,
                totalInstallments: totalInstallments,
                installmentGroupId: installmentGroupId
            };
        }

        // Gerar fitId único para parcelas
        // Alguns bancos (como Nubank) geram o mesmo FITID para todas as parcelas de uma compra
        // Precisamos tornar cada parcela única no nosso sistema
        let fitId = t.FITID;
        if (metadata && metadata.installmentNumber) {
            fitId = `${t.FITID}-installment-${metadata.installmentNumber}`;
        }

        return {
            reconciliationId,
            date: postDate,
            amount: Math.abs(amount), // Trabalhamos com valores absolutos
            type: amount >= 0 ? 'CREDIT' : 'DEBIT',
            description: t.MEMO,
            fitId: fitId,
            metadata: metadata
        };
    }

    /**
     * Salva as transações importadas no banco e executa o algoritmo de matching.
     */
    static async saveAndMatchTransactions(reconciliationId, transactionsToCreate, reconciliationRecord = null) {
        const reconciliation = reconciliationRecord || await prisma.reconciliation.findUnique({ where: { id: reconciliationId } });
        if (!reconciliation) throw new Error("Registro de reconciliação não encontrado.");

        const fitIds = transactionsToCreate.map((tx) => tx.fitId);
        if (fitIds.length === 0) {
            console.warn(`[Reconciliation ${reconciliationId}] Nenhuma transação mapeada para importação.`);
            await prisma.reconciliation.update({
                where: { id: reconciliationId },
                data: { status: 'FAILED' },
            });
            return;
        }

        const existingTransactions = await prisma.importedTransaction.findMany({
            where: { fitId: { in: fitIds } },
            select: { id: true, fitId: true, reconciliationId: true, status: true },
        });

        const existingMap = new Map(existingTransactions.map(t => [t.fitId, t]));
        const toCreate = [];
        const toUpdateIds = [];

        for (const tx of transactionsToCreate) {
            const existing = existingMap.get(tx.fitId);
            if (existing) {
                // Se já existe e não está reconciliada, trazemos para a reconciliação atual
                // Isso resolve o caso de transações importadas no mês anterior mas que pertencem a este mês
                if (existing.status !== 'RECONCILED') {
                    toUpdateIds.push(existing.id);
                }
                // Se já está reconciliada, ignoramos silenciosamente (já foi processada)
            } else {
                toCreate.push(tx);
            }
        }

        // Se todas já existem e estão reconciliadas, aí sim é erro
        if (toCreate.length === 0 && toUpdateIds.length === 0 && existingTransactions.length > 0) {
            console.warn(`[Reconciliation ${reconciliationId}] Todos os lançamentos já foram reconciliados anteriormente.`);
            // Não lançar erro, apenas finalizar com 0 importados, pois pode ser um re-upload parcial
            // Mas se o usuário espera algo, talvez devêssemos avisar. 
            // Mantendo comportamento original de erro se TUDO for duplicado reconciliado.
            if (existingTransactions.every(t => t.status === 'RECONCILED')) {
                await prisma.reconciliation.update({
                    where: { id: reconciliationId },
                    data: { status: 'FAILED' },
                });
                const duplicateError = new Error('Este extrato já foi reconciliado anteriormente.');
                duplicateError.code = 'EXTRACT_ALREADY_RECONCILED';
                throw duplicateError;
            }
        }

        const dates = transactionsToCreate.map(t => new Date(t.date));
        const startDate = startOfDay(new Date(Math.min.apply(null, dates)));
        const endDate = endOfDay(new Date(Math.max.apply(null, dates)));

        const whereClause = {
            isReconciled: false,
            data: {
                gte: startDate,
                lte: endDate,
            },
        };

        if (reconciliation.accountId) {
            whereClause.accountId = reconciliation.accountId;
        } else if (reconciliation.cardId) {
            whereClause.cardId = reconciliation.cardId;
        }

        const manualTransactions = await prisma.transaction.findMany({ where: whereClause });

        await prisma.$transaction(async (tx) => {
            // 1. Atualizar as transações órfãs para a nova reconciliação
            if (toUpdateIds.length > 0) {
                await tx.importedTransaction.updateMany({
                    where: { id: { in: toUpdateIds } },
                    data: { reconciliationId: reconciliationId }
                });
                console.info(`[Reconciliation ${reconciliationId}] ${toUpdateIds.length} transações antigas foram movidas para esta reconciliação.`);
            }

            // 2. Criar as novas transações
            if (toCreate.length > 0) {
                await tx.importedTransaction.createMany({
                    data: toCreate,
                    skipDuplicates: true,
                });
            }

            const importedTransactions = await tx.importedTransaction.findMany({
                where: { reconciliationId }
            });

            for (const importedTx of importedTransactions) {
                const suggestion = this.findBestMatch(importedTx, manualTransactions);
                if (suggestion && suggestion.score > 60) {
                    await tx.importedTransaction.update({
                        where: { id: importedTx.id },
                        data: {
                            status: 'SUGGESTED',
                            manualTransactionId: suggestion.match.id,
                            similarityScore: suggestion.score,
                        },
                    });
                    const index = manualTransactions.findIndex(mt => mt.id === suggestion.match.id);
                    if (index > -1) manualTransactions.splice(index, 1);
                }
            }

            await tx.reconciliation.update({
                where: { id: reconciliationId },
                data: {
                    status: 'PENDING_REVIEW',
                    startDate,
                    endDate,
                },
            });
        });

        console.info(`[Reconciliation ${reconciliationId}] ${transactionsToCreate.length} transações importadas foram salvas.`);

        await this.updateBalanceSnapshot(reconciliationId);
    }

    /**
     * Algoritmo de matching avançado que calcula um score de similaridade.
     */
    static findBestMatch(importedTx, manualTransactions) {
        let bestMatch = null;
        let highestScore = -1;

        for (const manualTx of manualTransactions) {
            // Se o tipo for oposto (receita vs despesa), não pode ser um match.
            const importedIsCredit = importedTx.type === 'CREDIT';
            const manualIsCredit = manualTx.tipo === 'receita';
            if (importedIsCredit !== manualIsCredit) continue;

            const manualValue = parseFloat(manualTx.valor);
            const valueDifference = Math.abs(Math.abs(importedTx.amount) - manualValue);
            const valueScore = valueDifference <= MATCH_VALUE_TOLERANCE
                ? 50
                : valueDifference <= MATCH_VALUE_TOLERANCE * 3
                    ? 20
                    : 0;
            if (valueScore === 0) continue;

            const dateDifference = Math.abs(differenceInDays(new Date(importedTx.date), new Date(manualTx.date)));
            const dateScore = Math.max(0, (5 - dateDifference) / 5) * 30;

            const descriptionScore = findBestStringMatch(importedTx.description.toLowerCase(), manualTx.descricao.toLowerCase()).bestMatch.rating * 20;

            const finalScore = valueScore + dateScore + descriptionScore;

            if (finalScore > highestScore) {
                highestScore = finalScore;
                bestMatch = manualTx;
            }
        }

        if (bestMatch) {
            return { match: bestMatch, score: Math.round(highestScore) };
        }
        return null;
    }

    static async aggregateValue(whereClause) {
        const result = await prisma.transaction.aggregate({
            _sum: { valor: true },
            where: whereClause,
        });
        return Number(result?._sum?.valor || 0);
    }

    static async calculateSystemBalances(reconciliation, startDate, endDate) {
        if (!startDate || !endDate) {
            return { systemOpeningBalance: null, systemClosingBalance: null };
        }

        if (reconciliation.accountId) {
            const account = await prisma.account.findUnique({ where: { id: reconciliation.accountId } });
            if (!account) return { systemOpeningBalance: null, systemClosingBalance: null };
            const accountId = reconciliation.accountId;
            const [receitasAntes, despesasAntes, receitasPeriodo, despesasPeriodo] = await Promise.all([
                this.aggregateValue({ accountId, tipo: 'receita', data: { lt: startDate } }),
                this.aggregateValue({ accountId, tipo: 'despesa', data: { lt: startDate } }),
                this.aggregateValue({ accountId, tipo: 'receita', data: { gte: startDate, lte: endDate } }),
                this.aggregateValue({ accountId, tipo: 'despesa', data: { gte: startDate, lte: endDate } }),
            ]);
            const saldoInicialConta = Number(account.saldoInicial || 0);
            const opening = saldoInicialConta + receitasAntes - despesasAntes;
            const closing = opening + receitasPeriodo - despesasPeriodo;
            return { systemOpeningBalance: opening, systemClosingBalance: closing };
        }

        if (reconciliation.cardId) {
            const cardId = reconciliation.cardId;
            const [receitasAntes, despesasAntes, receitasPeriodo, despesasPeriodo] = await Promise.all([
                this.aggregateValue({ cardId, tipo: 'receita', data: { lt: startDate } }),
                this.aggregateValue({ cardId, tipo: 'despesa', data: { lt: startDate } }),
                this.aggregateValue({ cardId, tipo: 'receita', data: { gte: startDate, lte: endDate } }),
                this.aggregateValue({ cardId, tipo: 'despesa', data: { gte: startDate, lte: endDate } }),
            ]);
            const opening = receitasAntes - despesasAntes;
            const closing = opening + receitasPeriodo - despesasPeriodo;
            return { systemOpeningBalance: opening, systemClosingBalance: closing };
        }

        return { systemOpeningBalance: null, systemClosingBalance: null };
    }

    static async updateBalanceSnapshot(reconciliationId) {
        const reconciliation = await prisma.reconciliation.findUnique({ where: { id: reconciliationId } });
        if (!reconciliation || !reconciliation.startDate || !reconciliation.endDate) {
            return;
        }
        const { systemOpeningBalance, systemClosingBalance } = await this.calculateSystemBalances(reconciliation, reconciliation.startDate, reconciliation.endDate);
        let balanceDifference = reconciliation.balanceDifference;
        if (reconciliation.statementClosingBalance !== null && reconciliation.statementClosingBalance !== undefined && systemClosingBalance !== null) {
            balanceDifference = Number((systemClosingBalance - Number(reconciliation.statementClosingBalance)).toFixed(2));
        }
        await prisma.reconciliation.update({
            where: { id: reconciliationId },
            data: {
                systemOpeningBalance,
                systemClosingBalance,
                balanceDifference,
            },
        });
        console.info(`[Reconciliation ${reconciliationId}] Snapshot de saldo atualizado. Diferença atual: ${balanceDifference ?? 'N/A'}.`);
    }
}

export default ReconciliationService;
