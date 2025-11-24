import pkg from '@prisma/client';
const { PrismaClient } = pkg;
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

        let newQuantity = Number(position.quantity);
        let newAvgPrice = Number(position.avgPrice);

        if (type === 'BUY') {
            const totalCost = (newQuantity * newAvgPrice) + grossAmount + tradeFees;
            newQuantity += tradeQty;
            newAvgPrice = newQuantity > 0 ? totalCost / newQuantity : 0;
        } else if (type === 'SELL') {
            // FIFO or Average Price logic? Brazil uses Average Price for tax.
            // Selling doesn't change Average Price, only realizes PnL.
            if (tradeQty > newQuantity) {
                throw new Error('Insufficient quantity to sell.');
            }
            newQuantity -= tradeQty;
        }

        // 4. Create Trade record
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
            },
        });

        // 5. Update Position
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
