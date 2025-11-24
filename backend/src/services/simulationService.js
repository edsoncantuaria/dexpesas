class SimulationService {
    /**
     * Simulate investment scenarios
     * @param {string} userId
     * @param {Array} scenarios
     */
    async simulateScenarios(userId, scenarios) {
        // scenarios: [{ name, monthlyContribution, expectedReturnYearly, years }]

        const results = scenarios.map(scenario => {
            const { monthlyContribution, expectedReturnYearly, years } = scenario;
            const months = years * 12;
            const monthlyRate = Math.pow(1 + (expectedReturnYearly / 100), 1 / 12) - 1;

            let total = 0;
            let totalInvested = 0;
            const evolution = [];

            for (let i = 1; i <= months; i++) {
                total = (total + monthlyContribution) * (1 + monthlyRate);
                totalInvested += monthlyContribution;

                if (i % 12 === 0) { // Record yearly points
                    evolution.push({
                        year: i / 12,
                        amount: total,
                        invested: totalInvested,
                    });
                }
            }

            return {
                name: scenario.name,
                finalAmount: total,
                totalInvested,
                totalInterest: total - totalInvested,
                evolution,
            };
        });

        return results;
    }
}

export default new SimulationService();
