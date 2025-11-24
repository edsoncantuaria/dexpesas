import pkg from '@prisma/client';
const { PrismaClient } = pkg;
const prisma = new PrismaClient();

class PortfolioService {
    /**
     * Get portfolio overview for a user
     * @param {string} userId
     */
    async getPortfolioOverview(userId) {
        const portfolios = await prisma.portfolio.findMany({
            where: { userId },
            include: {
                positions: {
                    include: {
                        asset: true,
                    },
                },
                snapshots: {
                    orderBy: { date: 'desc' },
                    take: 1,
                },
            },
        });

        let totalInvested = 0;
        let totalCurrentValue = 0;
        let totalPnL = 0;

        const allocation = {
            fixedIncome: 0,
            variableIncome: 0,
            crypto: 0,
            other: 0,
        };

        for (const portfolio of portfolios) {
            for (const position of portfolio.positions) {
                const currentVal = Number(position.currentValue);
                const investedVal = Number(position.avgPrice) * Number(position.quantity);

                totalInvested += investedVal;
                totalCurrentValue += currentVal;
                totalPnL += (currentVal - investedVal);

                // Simple allocation logic based on asset class
                const assetClass = position.asset.class.toUpperCase();
                if (['STOCK', 'FII', 'ETF', 'BDR'].includes(assetClass)) {
                    allocation.variableIncome += currentVal;
                } else if (['CDB', 'LCI', 'LCA', 'TESOURO', 'BOND', 'FIXED_INCOME'].includes(assetClass)) {
                    allocation.fixedIncome += currentVal;
                } else if (['CRYPTO', 'BITCOIN', 'ETHEREUM'].includes(assetClass)) {
                    allocation.crypto += currentVal;
                } else {
                    allocation.other += currentVal;
                }
            }
        }

        const totalReturnPercent = totalInvested > 0 ? (totalPnL / totalInvested) * 100 : 0;

        return {
            totalInvested,
            totalCurrentValue,
            totalPnL,
            totalReturnPercent,
            allocation,
            portfolios: portfolios.map(p => ({
                id: p.id,
                name: p.name,
                value: p.positions.reduce((acc, pos) => acc + Number(pos.currentValue), 0),
            })),
        };
    }

    /**
     * Create a new portfolio
     * @param {string} userId
     * @param {object} data
     */
    async createPortfolio(userId, data) {
        return prisma.portfolio.create({
            data: {
                userId,
                name: data.name,
                riskProfile: data.riskProfile,
                goalId: data.goalId,
                accountId: data.accountId,
            },
        });
    }

    /**
     * List user portfolios
     * @param {string} userId
     */
    async listPortfolios(userId) {
        return prisma.portfolio.findMany({
            where: { userId },
            include: {
                account: true,
                goal: true,
                _count: {
                    select: { positions: true },
                },
            },
        });
    }
}

export default new PortfolioService();
