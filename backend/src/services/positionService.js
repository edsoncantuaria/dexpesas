import pkg from '@prisma/client';
const { PrismaClient, PaymentMethod } = pkg;
import AuditService from './auditService.js';

const prisma = new PrismaClient();

class PositionService {
    /**
     * Record a trade (Buy, Sell, Dividend, etc.)
     * @param {string} userId
     * @param {object} tradeInput
     */
    async recordTrade(userId, tradeInput) {
        const {
            portfolioId,
            assetId,
            type,
            quantity,
            price,
            date,
            fees = 0,
            tax = 0,
            brokerageNoteId, // Optional link to a file/note
            sourceAccountId, // Optional: Account to debit/credit
        } = tradeInput;

        // 1. Verify portfolio ownership
        const portfolio = await prisma.portfolio.findFirst({
            where: { id: portfolioId, userId },
        });

        if (!portfolio) {
            throw new Error('Portfolio not found or access denied.');
        }

        // 2. Find or create position
        let position = await prisma.position.findFirst({
            where: { portfolioId, assetId },
        });

        if (!position) {
            // If selling, cannot sell what you don't have (unless shorting, but let's keep it simple)
            if (type === 'SELL') {
                throw new Error('Cannot sell asset not in portfolio.');
            }
            position = await prisma.position.create({
                data: {
                    portfolioId,
                    assetId,
                    quantity: 0,
                    avgPrice: 0,
                    currentValue: 0,
                },
            });
        }

        // 3. Calculate new position state
        const tradeQty = Number(quantity);
        const tradePrice = Number(price);
        const tradeFees = Number(fees);
        const tradeTax = Number(tax);
        const grossAmount = tradeQty * tradePrice;

        // Net amount depends on type
        // BUY: Cost = Gross + Fees
        // SELL: Net = Gross - Fees - Tax
        // DIVIDEND: Net = Gross - Tax
        let netAmount = 0;

        let newQuantity = Number(position.quantity);
        let newAvgPrice = Number(position.avgPrice);

        if (type === 'BUY') {
            const totalCost = (newQuantity * newAvgPrice) + grossAmount + tradeFees;
            newQuantity += tradeQty;
            newAvgPrice = newQuantity > 0 ? totalCost / newQuantity : 0;
            netAmount = grossAmount + tradeFees; // Money leaving account
        } else if (type === 'SELL') {
            if (tradeQty > newQuantity) {
                throw new Error('Insufficient quantity to sell.');
            }
            newQuantity -= tradeQty;
            netAmount = grossAmount - tradeFees - tradeTax; // Money entering account
        } else if (type === 'DIVIDEND' || type === 'JCP' || type === 'INTEREST') {
            netAmount = grossAmount - tradeTax; // Money entering account
        }

        // 4. Create Financial Transaction (if sourceAccountId provided)
        let linkedTxnId = null;
        if (sourceAccountId) {
            const account = await prisma.account.findUnique({
                where: { id: sourceAccountId },
            });

            if (account) {
                // Determine transaction type and category
                // This assumes we have some default categories or we use "Investimentos"
                // For now, let's try to find a generic category or use null (if allowed)
                // Ideally, we should fetch the "Investimentos" category ID.
                const category = await prisma.category.findFirst({
                    where: {
                        userId,
                        nome: { in: ['Investimentos', 'Renda Variável', 'Renda Fixa', 'Outros'] }
                    }
                });

                const txnData = {
                    userId,
                    accountId: sourceAccountId,
                    data: new Date(date),
                    valor: netAmount,
                    metodoPagamento: PaymentMethod.transferencia, // Or other
                    status: 'POSTED', // Assumed paid/completed
                    pago: true,
                    categoryId: category?.id,
                };

                if (type === 'BUY') {
                    txnData.tipo = 'despesa';
                    txnData.descricao = `Aporte: ${tradeQty}x Asset #${assetId}`; // Ideally Asset Name
                } else if (['SELL', 'DIVIDEND', 'JCP', 'INTEREST'].includes(type)) {
                    txnData.tipo = 'receita';
                    txnData.descricao = `Proventos/Venda: Asset #${assetId}`;
                }

                if (txnData.tipo) {
                    const txn = await prisma.transaction.create({ data: txnData });
                    linkedTxnId = txn.id;
                }
            }
        }

        // 5. Create Trade record
        const trade = await prisma.trade.create({
            data: {
                positionId: position.id,
                type,
                quantity: tradeQty,
                price: tradePrice,
                grossAmount,
                fees: tradeFees,
                tax: tradeTax,
                tradeDate: new Date(date),
                linkedTxnId,
            },
        });

        // 6. Update Position
        // For current value, we ideally need the LATEST price.
        // For now, if it's a BUY, we might assume current price is close to buy price?
        // Or we just update quantity and avgPrice.
        // Let's update currentValue based on the trade price as a proxy for "last price"
        const newCurrentValue = newQuantity * tradePrice;

        await prisma.position.update({
            where: { id: position.id },
            data: {
                quantity: newQuantity,
                avgPrice: newAvgPrice,
                currentValue: newCurrentValue,
                lastUpdatedAt: new Date(),
            },
        });

        // 7. Audit Log
        await AuditService.log({
            userId,
            action: 'RECORD_TRADE',
            entity: 'TRADE',
            entityId: trade.id,
            details: {
                type,
                assetId,
                portfolioId,
                quantity: tradeQty,
                price: tradePrice,
                linkedTxnId
            }
        });

        return trade;
    }

    /**
     * Get positions for a portfolio
     * @param {string} portfolioId
     */
    async getPositions(portfolioId) {
        return prisma.position.findMany({
            where: { portfolioId },
            include: {
                asset: true,
            },
        });
    }
}

export default new PositionService();
