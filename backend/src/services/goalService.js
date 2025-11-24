import pkg from '@prisma/client';
const { PrismaClient } = pkg;
const prisma = new PrismaClient();

class GoalService {
    /**
     * List investment goals
     * @param {string} userId
     */
    async listGoals(userId) {
        const goals = await prisma.investmentGoal.findMany({
            where: { userId },
            include: {
                portfolios: {
                    include: {
                        positions: true,
                    },
                },
            },
        });

        return goals.map(goal => {
            const currentAmount = goal.portfolios.reduce((acc, p) => {
                return acc + p.positions.reduce((pAcc, pos) => pAcc + Number(pos.currentValue), 0);
            }, 0);

            const percent = goal.targetValue > 0 ? (currentAmount / Number(goal.targetValue)) * 100 : 0;

            return {
                ...goal,
                currentAmount,
                percentCompleted: Math.min(100, percent),
            };
        });
    }

    /**
     * Create a new goal
     * @param {string} userId
     * @param {object} data
     */
    async createGoal(userId, data) {
        return prisma.investmentGoal.create({
            data: {
                userId,
                name: data.name,
                targetValue: data.targetValue,
                targetDate: data.targetDate ? new Date(data.targetDate) : null,
                priority: data.priority || 1,
            },
        });
    }
}

export default new GoalService();
