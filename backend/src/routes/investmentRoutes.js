import express from 'express';
import InvestmentController from '../controllers/investmentController.js';
import authMiddleware from '../middlewares/authMiddleware.js';

const router = express.Router();

router.use(authMiddleware);

// Portfolios
router.get('/overview', InvestmentController.getOverview);
router.get('/portfolios', InvestmentController.listPortfolios);
router.post('/portfolios', InvestmentController.createPortfolio);

// Positions & Trades
router.get('/positions', InvestmentController.getPositions);
router.post('/trades', InvestmentController.recordTrade);

// Performance & Risk
router.get('/performance', InvestmentController.getPerformance);
router.get('/risk', InvestmentController.getRiskAnalysis);

// Goals
router.get('/goals', InvestmentController.listGoals);
router.post('/goals', InvestmentController.createGoal);

// Recommendations & Simulation
router.get('/recommendations', InvestmentController.getRecommendations);
router.post('/simulate', InvestmentController.simulate);

// Market Data
router.get('/quote', InvestmentController.getQuote);
router.get('/rates', InvestmentController.getRates);

// Import
import multer from 'multer';
const upload = multer();
router.post('/import', upload.single('file'), InvestmentController.importTransactions);

export default router;
