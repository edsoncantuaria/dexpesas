import pkg from '@prisma/client';
const { PrismaClient } = pkg;
const prisma = new PrismaClient();
import { parse } from 'csv-parse/sync';
import xlsx from 'xlsx';

class InvestmentImportService {
    /**
     * Parse B3 export file (Excel or CSV)
     * @param {Buffer} fileBuffer
     * @param {string} mimeType
     * @param {string} userId
     */
    async importB3File(fileBuffer, mimeType, userId) {
        let records = [];

        // 1. Parse File
        if (mimeType.includes('spreadsheet') || mimeType.includes('excel') || mimeType.includes('xlsx')) {
            const workbook = xlsx.read(fileBuffer, { type: 'buffer' });
            const sheetName = workbook.SheetNames[0];
            const sheet = workbook.Sheets[sheetName];
            records = xlsx.utils.sheet_to_json(sheet);
        } else {
            // Assume CSV
            records = parse(fileBuffer, {
                columns: true,
                skip_empty_lines: true,
                delimiter: [';', ','], // Try both common delimiters
                trim: true,
            });
        }

        // 2. Process Records
        // Expected B3 columns (approximate, as they change):
        // "Data", "Tipo de Movimentação", "Produto", "Instituição", "Quantidade", "Preço unitário", "Valor da Operação"

        const results = {
            success: 0,
            errors: 0,
            details: [],
        };

        // Ensure a default portfolio exists for imports
        let portfolio = await prisma.portfolio.findFirst({
            where: { userId, name: 'B3 Import' },
        });

        if (!portfolio) {
            portfolio = await prisma.portfolio.create({
                data: {
                    userId,
                    name: 'B3 Import',
                    riskProfile: 'MODERATE', // Default
                },
            });
        }

        for (const row of records) {
            try {
                // Normalize keys to lowercase/trimmed to handle variations
                const normalizedRow = {};
                Object.keys(row).forEach(key => {
                    normalizedRow[key.trim().toLowerCase()] = row[key];
                });

                // Extract fields
                const dateStr = normalizedRow['data'] || normalizedRow['data do negócio'];
                const typeStr = normalizedRow['tipo de movimentação'] || normalizedRow['movimentação'];
                const productStr = normalizedRow['produto'] || normalizedRow['ativo'];
                const institution = normalizedRow['instituição'];
                const quantityStr = normalizedRow['quantidade'];
                const priceStr = normalizedRow['preço unitário'];
                const valueStr = normalizedRow['valor da operação'];

                if (!dateStr || !typeStr || !productStr) {
                    throw new Error('Missing required fields (Data, Tipo, Produto)');
                }

                // Parse Date (DD/MM/YYYY)
                const [day, month, year] = dateStr.split('/');
                const tradeDate = new Date(`${year}-${month}-${day}`);

                // Parse Numbers (Handle "1.000,00" format)
                const parseBRL = (str) => {
                    if (typeof str === 'number') return str;
                    if (!str) return 0;
                    return parseFloat(str.replace(/\./g, '').replace(',', '.'));
                };

                const quantity = parseBRL(quantityStr);
                const price = parseBRL(priceStr);
                const grossAmount = parseBRL(valueStr);

                // Map Type
                let type = 'BUY'; // Default
                const t = typeStr.toLowerCase();
                if (t.includes('compra')) type = 'BUY';
                else if (t.includes('venda')) type = 'SELL';
                else if (t.includes('dividendo') || t.includes('rendimento')) type = 'DIVIDEND';
                else if (t.includes('juros sobre capital')) type = 'JCP';
                else if (t.includes('desdobramento')) type = 'SPLIT';
                else if (t.includes('agrupamento')) type = 'MERGE';
                else continue; // Skip unknown types like "Transferência" for now

                // Find or Create Asset
                // Extract Ticker from Product string (e.g., "PETR4 - PETROLEO BRASILEIRO")
                const tickerMatch = productStr.match(/^([A-Z0-9]{4,6})/);
                const ticker = tickerMatch ? tickerMatch[1] : productStr.split(' ')[0];

                let asset = await prisma.asset.findFirst({
                    where: { OR: [{ ticker }, { name: productStr }] },
                });

                if (!asset) {
                    asset = await prisma.asset.create({
                        data: {
                            ticker,
                            name: productStr,
                            class: this.inferAssetClass(productStr),
                        },
                    });
                }

                // Find or Create Position
                let position = await prisma.position.findFirst({
                    where: { portfolioId: portfolio.id, assetId: asset.id },
                });

                if (!position) {
                    position = await prisma.position.create({
                        data: {
                            portfolioId: portfolio.id,
                            assetId: asset.id,
                            quantity: 0,
                            avgPrice: 0,
                            currentValue: 0,
                        },
                    });
                }

                // Create Trade
                await prisma.trade.create({
                    data: {
                        positionId: position.id,
                        type,
                        quantity,
                        price,
                        grossAmount: Math.abs(grossAmount),
                        tradeDate,
                    },
                });

                // Update Position (Simplified logic - ideally reuse PositionService)
                // Re-calculating position state is complex if done out of order. 
                // For bulk import, we might want to recalculate everything at the end.
                // For now, let's just increment quantity for BUY/SELL to keep it consistent.
                if (type === 'BUY') {
                    await prisma.position.update({
                        where: { id: position.id },
                        data: { quantity: { increment: quantity } },
                    });
                } else if (type === 'SELL') {
                    await prisma.position.update({
                        where: { id: position.id },
                        data: { quantity: { decrement: quantity } },
                    });
                }

                results.success++;
            } catch (error) {
                results.errors++;
                results.details.push(`Row error: ${error.message}`);
            }
        }

        return results;
    }

    inferAssetClass(productName) {
        const name = productName.toUpperCase();
        if (name.includes('FII')) return 'FII';
        if (name.includes('ETF')) return 'ETF';
        if (name.includes('TESOURO')) return 'TESOURO';
        if (name.includes('CDB') || name.includes('LCI') || name.includes('LCA')) return 'FIXED_INCOME';
        return 'STOCK'; // Default
    }
}

export default new InvestmentImportService();
