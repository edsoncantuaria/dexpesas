// backend/src/controllers/analyticsController.js
import NetWorthHistoryService from '../services/analytics/netWorthHistory.js';
import InsightsService from '../services/insightsService.js';
import PDFReportService from '../services/pdfReportService.js';

class AnalyticsController {
    /**
     * GET /analytics/net-worth-history
     * Returns historical net worth data
     */
    async getNetWorthHistory(req, res, next) {
        const userId = req.user.id;
        const months = parseInt(req.query.months, 10) || 12;

        try {
            const history = await NetWorthHistoryService.getHistory(userId, months);
            res.json(history);
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /analytics/insights
     * Returns financial insights and trends
     */
    async getInsights(req, res, next) {
        const userId = req.user.id;

        try {
            const insights = await InsightsService.getInsights(userId);
            res.json(insights);
        } catch (error) {
            next(error);
        }
    }

    /**
     * POST /analytics/generate-pdf
     * Generate PDF financial report
     */
    async generatePDF(req, res, next) {
        const userId = req.user.id;
        const filters = req.body;

        try {
            const pdfDoc = await PDFReportService.generateReport(userId, filters);

            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', 'attachment; filename=relatorio_financeiro.pdf');

            pdfDoc.pipe(res);
        } catch (error) {
            next(error);
        }
    }
}

export default new AnalyticsController();
