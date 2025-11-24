import pkg from '@prisma/client';
const { PrismaClient } = pkg;
const prisma = new PrismaClient();

class RiskService {
    /**
     * Analyze portfolio risk
     * @param {string} userId
     */
    async analyzeRisk(userId) {
        const portfolios = await prisma.portfolio.findMany({
            where: { userId },
            include: {
                positions: {
                    include: { asset: true },
                },
            },
        });

        let totalValue = 0;
        const assetConcentration = {};
        const classConcentration = {};
        let highRiskValue = 0;

        for (const portfolio of portfolios) {
            for (const position of portfolio.positions) {
                const value = Number(position.currentValue);
                totalValue += value;

                // Asset Concentration
                const ticker = position.asset.ticker || position.asset.name;
                assetConcentration[ticker] = (assetConcentration[ticker] || 0) + value;

                // Class Concentration
                const assetClass = position.asset.class;
                classConcentration[assetClass] = (classConcentration[assetClass] || 0) + value;

                // Risk Level
                if (position.asset.riskLevel === 'HIGH') {
                    highRiskValue += value;
                }
            }
        }

        if (totalValue === 0) {
            return {
                riskScore: 0,
                concentrationWarnings: [],
                profileMismatch: [],
            };
        }

        const concentrationWarnings = [];
        for (const [ticker, value] of Object.entries(assetConcentration)) {
            const percent = (value / totalValue) * 100;
            if (percent > 20) {
                concentrationWarnings.push(`Alta concentração em ${ticker}: ${percent.toFixed(1)}% da carteira.`);
            }
        }

        const highRiskPercent = (highRiskValue / totalValue) * 100;
        const riskScore = Math.min(100, Math.max(0, 100 - highRiskPercent)); // Simple score: more high risk = lower score (safety score)

        // Profile Mismatch (Mock logic)
        const profileMismatch = [];
        // In a real app, we'd fetch user.investmentProfile and compare.
        // e.g. if user is CONSERVATIVE but highRiskPercent > 30...

        return {
            riskScore, // 0-100 (100 = safest)
            concentrationWarnings,
            profileMismatch,
            classAllocation: Object.entries(classConcentration).map(([k, v]) => ({
                class: k,
                percent: (v / totalValue) * 100,
            })),
        };
    }
}

export default new RiskService();
