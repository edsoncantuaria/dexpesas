// backend/src/services/reconciliationService.js
import { PrismaClient } from '@prisma/client';
import { parse as parseOfx } from 'ofx-js';
import { parse as parseCsv } from 'csv-parse';
import { differenceInDays, isValid, parse as parseDate, startOfDay, endOfDay } from 'date-fns';
import pkg from 'string-similarity-js';
import minioClient from '../config/minioClient.js';
import config from '../config/config.js';

const findBestStringMatch =
  pkg?.findBestMatch ||
  ((source, target) => {
    const baseScore =
      typeof pkg?.getStringSimilarity === 'function'
        ? pkg.getStringSimilarity(source, target)
        : source === target
          ? 1
          : 0;
    return { bestMatch: { rating: baseScore } };
  });


const prisma = new PrismaClient();

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
        // Baixa o arquivo do MinIO
        const fileStream = await minioClient.getObject(config.minio.bucketName, filePath);
        const fileContent = await streamToString(fileStream);

        if (fileType === 'CSV') {
            return this.processCsvFile(fileContent, reconciliationId, mapping);
        }
        return this.processOfxFile(fileContent, reconciliationId);
    }
    
    /**
     * Processa um arquivo CSV, mapeia as colunas e importa as transações.
     */
    static async processCsvFile(fileContent, reconciliationId, mapping) {
        const records = await new Promise((resolve, reject) => {
            parseCsv(fileContent, {
                columns: true,
                skip_empty_lines: true,
                trim: true,
            }, (err, records) => {
                if (err) return reject(err);
                resolve(records);
            });
        });

        const importedTransactionsToCreate = records.map((r, index) => 
            this.mapCsvTransaction(r, reconciliationId, mapping, index)
        ).filter(Boolean);

        if (importedTransactionsToCreate.length === 0) {
            await prisma.reconciliation.update({ where: { id: reconciliationId }, data: { status: 'FAILED' } });
            return { count: 0 };
        }

        await this.saveAndMatchTransactions(reconciliationId, importedTransactionsToCreate);
        return { count: importedTransactionsToCreate.length };
    }

    /**
     * Mapeia uma única linha do CSV para o formato da nossa transação importada.
     */
    static mapCsvTransaction(record, reconciliationId, mapping, index) {
        const { date, description, amount, date_format } = mapping;
        
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
        
        const type = parsedAmount >= 0 ? 'CREDIT' : 'DEBIT';

        return {
            reconciliationId,
            date: parsedDate,
            amount: Math.abs(parsedAmount),
            type: type,
            description: record[description] || 'Descrição não encontrada',
            fitId: `csv-${reconciliationId}-${index}`,
        };
    }
    
    /**
     * Processa um arquivo OFX, extrai os dados e importa as transações.
     */
    static async processOfxFile(fileContent, reconciliationId) {
        // Pré-processamento do arquivo OFX para remover caracteres inválidos e cabeçalhos
        const ofxContent = fileContent
            .replace(/&/g, '&amp;') // Escapa o ampersand
            .replace(/<[A-Z0-9_]*>./g, (match) => match.replace(/&/g, '')) // Remove '&' dentro de tags
            .split('<OFX>')[1]; // Remove o cabeçalho
        
        if (!ofxContent) {
            console.warn(`Arquivo OFX vazio ou inválido para reconciliação ${reconciliationId}.`);
            await prisma.reconciliation.update({ where: { id: reconciliationId }, data: { status: 'FAILED' } });
            return { count: 0 };
        }
        
        const ofxParsed = await parseOfx(`<OFX>${ofxContent}`);

        const bankStatement = ofxParsed?.OFX?.BANKMSGSRSV1?.STMTTRNRS?.STMTRS;
        const creditCardStatement = ofxParsed?.OFX?.CREDITCARDMSGSRSV1?.CCSTMTTRNRS?.CCSTMTRS;
        
        const statement = bankStatement || creditCardStatement;

        if (!statement) {
            console.warn(`Estrutura OFX inválida para reconciliação ${reconciliationId}. Nenhum extrato bancário ou de cartão encontrado.`);
            await prisma.reconciliation.update({ where: { id: reconciliationId }, data: { status: 'FAILED' } });
            return { count: 0 };
        }
        
        const transactionList = statement.BANKTRANLIST || statement;
        const transactions = Array.isArray(transactionList?.STMTTRN)
            ? transactionList.STMTTRN
            : transactionList?.STMTTRN ? [transactionList.STMTTRN] : [];

        if (transactions.length === 0) {
            await prisma.reconciliation.update({ where: { id: reconciliationId }, data: { status: 'PENDING_REVIEW' } });
            return { count: 0 };
        }

        const importedTransactionsToCreate = transactions.map(t => this.mapOfxTransaction(t, reconciliationId));
        
        await this.saveAndMatchTransactions(reconciliationId, importedTransactionsToCreate);

        return { count: importedTransactionsToCreate.length };
    }

    /**
     * Mapeia uma transação do formato OFX para o nosso modelo Prisma.
     */
    static mapOfxTransaction(t, reconciliationId) {
        const amount = parseFloat(t.TRNAMT);
        const dateString = t.DTPOSTED.substring(0, 8);
        const year = parseInt(dateString.substring(0, 4), 10);
        const month = parseInt(dateString.substring(4, 6), 10) - 1;
        const day = parseInt(dateString.substring(6, 8), 10);
        const postDate = new Date(year, month, day);

        return {
            reconciliationId,
            date: postDate,
            amount: Math.abs(amount), // Trabalhamos com valores absolutos
            type: amount >= 0 ? 'CREDIT' : 'DEBIT',
            description: t.MEMO,
            fitId: t.FITID,
        };
    }
    
    /**
     * Salva as transações importadas no banco e executa o algoritmo de matching.
     */
    static async saveAndMatchTransactions(reconciliationId, transactionsToCreate) {
        const reconciliation = await prisma.reconciliation.findUnique({ where: { id: reconciliationId } });
        if (!reconciliation) throw new Error("Registro de reconciliação não encontrado.");

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
            await tx.importedTransaction.createMany({
                data: transactionsToCreate,
                skipDuplicates: true, // Garante que transações com o mesmo FITID não sejam inseridas novamente.
            });

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
            
            const valueScore = Math.abs(importedTx.amount) === parseFloat(manualTx.valor) ? 50 : 0;
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
}

export default ReconciliationService;
