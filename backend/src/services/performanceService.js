import pkg from '@prisma/client';
const { PrismaClient } = pkg;
const prisma = new PrismaClient();

class PerformanceService {
    /**
     * Get performance summary for a portfolio
     * @param {string} portfolioId
     */
    async getPerformanceSummary(portfolioId) {
        const portfolio = await prisma.portfolio.findUnique({
            where: { id: portfolioId },
            include: {
                positions: true,
                snapshots: {
                    orderBy: { date: 'desc' },
                    take: 12, // Last 12 snapshots
                },
            },
        });

        if (!portfolio) return null;

        let currentTotal = 0;
        let investedTotal = 0;

        portfolio.positions.forEach(pos => {
            currentTotal += Number(pos.currentValue);
            investedTotal += Number(pos.avgPrice) * Number(pos.quantity);
        });

        const absolutePnL = currentTotal - investedTotal;
        const percentagePnL = investedTotal > 0 ? (absolutePnL / investedTotal) * 100 : 0;

        return {
            portfolioId,
            currentValue: currentTotal,
            investedValue: investedTotal,
            absolutePnL,
            percentagePnL,
            history: portfolio.snapshots.map(s => ({
                date: s.date,
                value: Number(s.totalValue),
                pnl: Number(s.pnlPercent),
            })),
        };
    }

    /**
     * Get detailed performance for a specific position
     * @param {string} positionId
     */
    async getAssetPerformance(positionId) {
        const position = await prisma.position.findUnique({
            where: { id: positionId },
            include: {
                asset: {
                    include: {
                        priceHistory: {
                            orderBy: { date: 'desc' },
                            take: 30,
                        },
                    },
                },
            },
        });

        if (!position) return null;

        const currentVal = Number(position.currentValue);
        const investedVal = Number(position.avgPrice) * Number(position.quantity);
        const pnl = currentVal - investedVal;
        const pnlPercent = investedVal > 0 ? (pnl / investedVal) * 100 : 0;

        return {
            assetName: position.asset.name,
            ticker: position.asset.ticker,
            quantity: Number(position.quantity),
            avgPrice: Number(position.avgPrice),
            currentPrice: Number(position.currentValue) / Number(position.quantity), // Derived
            totalValue: currentVal,
            pnl,
            pnlPercent,
            priceHistory: position.asset.priceHistory,
        };
    }
}

export default new PerformanceService();
