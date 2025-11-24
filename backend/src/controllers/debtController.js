import debtService from '../services/debtService.js';

class DebtController {
    async create(req, res) {
        try {
            const debt = await debtService.createDebt(req.user.id, req.body);
            res.status(201).json(debt);
        } catch (error) {
            console.error('Error creating debt:', error);
            res.status(500).json({ error: 'Failed to create debt' });
        }
    }

    async list(req, res) {
        try {
            const debts = await debtService.getDebts(req.user.id);
            res.json(debts);
        } catch (error) {
            console.error('Error listing debts:', error);
            res.status(500).json({ error: 'Failed to list debts' });
        }
    }

    async get(req, res) {
        try {
            const debt = await debtService.getDebtById(req.user.id, req.params.id);
            if (!debt) {
                return res.status(404).json({ error: 'Debt not found' });
            }
            res.json(debt);
        } catch (error) {
            console.error('Error getting debt:', error);
            res.status(500).json({ error: 'Failed to get debt' });
        }
    }

    async update(req, res) {
        try {
            const debt = await debtService.updateDebt(req.user.id, req.params.id, req.body);
            res.json(debt);
        } catch (error) {
            console.error('Error updating debt:', error);
            res.status(500).json({ error: 'Failed to update debt' });
        }
    }

    async delete(req, res) {
        try {
            await debtService.deleteDebt(req.user.id, req.params.id);
            res.status(204).send();
        } catch (error) {
            console.error('Error deleting debt:', error);
            res.status(500).json({ error: 'Failed to delete debt' });
        }
    }

    async recordPayment(req, res) {
        try {
            const result = await debtService.recordPayment(req.user.id, req.params.id, req.body);
            res.status(201).json(result);
        } catch (error) {
            console.error('Error recording payment:', error);
            res.status(500).json({ error: 'Failed to record payment' });
        }
    }

    async calculatePlan(req, res) {
        try {
            const { strategy, extraMonthly } = req.body;
            const plan = await debtService.calculatePayoffPlan(req.user.id, strategy, extraMonthly);
            res.json(plan);
        } catch (error) {
            console.error('Error calculating plan:', error);
            res.status(500).json({ error: 'Failed to calculate plan' });
        }
    }

    async getAnalytics(req, res) {
        try {
            const analytics = await debtService.getAnalytics(req.user.id);
            res.json(analytics);
        } catch (error) {
            console.error('Error getting analytics:', error);
            res.status(500).json({ error: 'Failed to get analytics' });
        }
    }

    async recordAdjustment(req, res) {
        try {
            const result = await debtService.recordAdjustment(req.user.id, req.params.id, req.body);
            res.status(201).json(result);
        } catch (error) {
            console.error('Error recording adjustment:', error);
            res.status(500).json({ error: 'Failed to record adjustment' });
        }
    }

    async getTrends(req, res) {
        try {
            const trends = await debtService.analyzeTrends(req.user.id);
            res.json(trends);
        } catch (error) {
            console.error('Error getting trends:', error);
            res.status(500).json({ error: 'Failed to analyze trends' });
        }
    }

    async getRecommendations(req, res) {
        try {
            const recommendations = await debtService.getRecommendations(req.user.id);
            res.json(recommendations);
        } catch (error) {
            console.error('Error getting recommendations:', error);
            res.status(500).json({ error: 'Failed to get recommendations' });
        }
    }

    async getPaymentHistory(req, res) {
        try {
            const history = await debtService.getPaymentHistory(req.user.id, req.params.id);
            res.json(history);
        } catch (error) {
            console.error('Error getting payment history:', error);
            res.status(500).json({ error: 'Failed to get payment history' });
        }
    }

    async simulateScenarios(req, res) {
        try {
            const { scenarios } = req.body;
            const simulation = await debtService.simulateScenarios(req.user.id, scenarios);
            res.json(simulation);
        } catch (error) {
            console.error('Error simulating scenarios:', error);
            res.status(500).json({ error: 'Failed to simulate scenarios' });
        }
    }
}

export default new DebtController();
