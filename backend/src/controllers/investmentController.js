import PortfolioService from '../services/portfolioService.js';
import PositionService from '../services/positionService.js';
import PerformanceService from '../services/performanceService.js';
import RiskService from '../services/riskService.js';
import GoalService from '../services/goalService.js';
import RecommendationService from '../services/recommendationService.js';
import SimulationService from '../services/simulationService.js';
import MarketDataService from '../services/marketDataService.js';
import InvestmentImportService from '../services/investmentImportService.js';

class InvestmentController {
    // --- Portfolios ---
    async getOverview(req, res, next) {
        try {
            const overview = await PortfolioService.getPortfolioOverview(req.user.id);
            res.json(overview);
        } catch (error) {
            next(error);
        }
    }

    async listPortfolios(req, res, next) {
        try {
            const portfolios = await PortfolioService.listPortfolios(req.user.id);
            res.json(portfolios);
        } catch (error) {
            next(error);
        }
    }

    async createPortfolio(req, res, next) {
        try {
            const portfolio = await PortfolioService.createPortfolio(req.user.id, req.body);
            res.status(201).json(portfolio);
        } catch (error) {
            next(error);
        }
    }

    // --- Positions & Trades ---
    async recordTrade(req, res, next) {
        try {
            const trade = await PositionService.recordTrade(req.user.id, req.body);
            res.status(201).json(trade);
        } catch (error) {
            next(error);
        }
    }

    async getPositions(req, res, next) {
        try {
            const { portfolioId } = req.query;
            if (!portfolioId) return res.status(400).json({ message: 'Portfolio ID required' });
            const positions = await PositionService.getPositions(portfolioId);
            res.json(positions);
        } catch (error) {
            next(error);
        }
    }

    // --- Performance & Risk ---
    async getPerformance(req, res, next) {
        try {
            const { portfolioId } = req.query;
            if (!portfolioId) return res.status(400).json({ message: 'Portfolio ID required' });
            const performance = await PerformanceService.getPerformanceSummary(portfolioId);
            res.json(performance);
        } catch (error) {
            next(error);
        }
    }

    async getRiskAnalysis(req, res, next) {
        try {
            const risk = await RiskService.analyzeRisk(req.user.id);
            res.json(risk);
        } catch (error) {
            next(error);
        }
    }

    // --- Goals ---
    async listGoals(req, res, next) {
        try {
            const goals = await GoalService.listGoals(req.user.id);
            res.json(goals);
        } catch (error) {
            next(error);
        }
    }

    async createGoal(req, res, next) {
        try {
            const goal = await GoalService.createGoal(req.user.id, req.body);
            res.status(201).json(goal);
        } catch (error) {
            next(error);
        }
    }

    // --- Recommendations & Simulation ---
    async getRecommendations(req, res, next) {
        try {
            const recs = await RecommendationService.getRecommendations(req.user.id);
            res.json(recs);
        } catch (error) {
            next(error);
        }
    }

    async simulate(req, res, next) {
        try {
            const { scenarios } = req.body;
            const results = await SimulationService.simulateScenarios(req.user.id, scenarios);
            res.json(results);
        } catch (error) {
            next(error);
        }
    }

    // --- Market Data ---
    async getQuote(req, res, next) {
        try {
            const { ticker } = req.query;
            if (!ticker) return res.status(400).json({ message: 'Ticker required' });
            const quote = await MarketDataService.getQuote(ticker);
            res.json(quote);
        } catch (error) {
            next(error);
        }
    }

    async getRates(req, res, next) {
        try {
            const rates = await MarketDataService.getOfficialRates();
            res.json(rates);
        } catch (error) {
            next(error);
        }
    }

    // --- Import ---
    async importTransactions(req, res, next) {
        try {
            if (!req.file) {
                return res.status(400).json({ message: 'Nenhum arquivo enviado.' });
            }
            const result = await InvestmentImportService.importB3File(
                req.file.buffer,
                req.file.mimetype,
                req.user.id
            );
            res.json(result);
        } catch (error) {
            next(error);
        }
    }
}

export default new InvestmentController();
