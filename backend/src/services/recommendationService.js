import RiskService from './riskService.js';
import PortfolioService from './portfolioService.js';

class RecommendationService {
    /**
     * Get investment recommendations
     * @param {string} userId
     */
    async getRecommendations(userId) {
        const riskAnalysis = await RiskService.analyzeRisk(userId);
        const portfolioOverview = await PortfolioService.getPortfolioOverview(userId);

        const recommendations = [];
        const warnings = [...riskAnalysis.concentrationWarnings];

        // 1. Emergency Fund Check (Mock logic - assumes Fixed Income is proxy for emergency fund)
        const fixedIncome = portfolioOverview.allocation.fixedIncome || 0;
        const total = portfolioOverview.totalCurrentValue;

        if (total > 0 && (fixedIncome / total) < 0.2) {
            recommendations.push({
                type: 'DIVERSIFICATION',
                message: 'Considere aumentar sua exposição em Renda Fixa para segurança.',
                priority: 'HIGH',
            });
        }

        // 2. High Risk Check
        if (riskAnalysis.riskScore < 40) {
            recommendations.push({
                type: 'RISK_REDUCTION',
                message: 'Sua carteira está muito exposta a ativos de alto risco. Considere rebalancear.',
                priority: 'MEDIUM',
            });
        }

        // 3. General Advice
        if (total === 0) {
            recommendations.push({
                type: 'STARTING',
                message: 'Comece criando sua Reserva de Emergência (ex: Tesouro Selic ou CDB de liquidez diária).',
                priority: 'HIGH',
            });
        }

        return {
            score: riskAnalysis.riskScore,
            mainSuggestions: recommendations,
            warnings,
        };
    }
}

export default new RecommendationService();
