import cron from 'node-cron';
import pkg from '@prisma/client';
import { addWeeks, addMonths, addYears, startOfDay } from 'date-fns';
import AuditService from './auditService.js';

const { PrismaClient } = pkg;
const prisma = new PrismaClient();

class CronService {
    constructor() {
        this.job = null;
    }

    init() {
        // Run every hour
        this.job = cron.schedule('0 * * * *', async () => {
            console.log('Running recurring expense check...');
            await this.checkRecurringExpenses();
        });
        console.log('Cron service initialized.');
    }

    async checkRecurringExpenses() {
        try {
            const now = new Date();

            const dueExpenses = await prisma.recurringSplitExpense.findMany({
                where: {
                    active: true,
                    nextRun: {
                        lte: now
                    }
                }
            });

            console.log(`Found ${dueExpenses.length} recurring expenses due.`);

            for (const recurring of dueExpenses) {
                await this.processRecurringExpense(recurring);
            }
        } catch (error) {
            console.error('Error checking recurring expenses:', error);
        }
    }

    async processRecurringExpense(recurring) {
        try {
            await prisma.$transaction(async (tx) => {
                // 1. Create the new expense
                const newExpense = await tx.splitExpense.create({
                    data: {
                        description: recurring.description,
                        amount: recurring.amount,
                        date: new Date(), // Today
                        splitType: recurring.splitType,
                        groupId: recurring.groupId,
                        paidById: recurring.paidById,
                    }
                });

                // 2. Create Splits
                if (recurring.splits) {
                    const splitsData = Array.isArray(recurring.splits) ? recurring.splits : JSON.parse(JSON.stringify(recurring.splits));

                    for (const split of splitsData) {
                        await tx.splitExpenseSplit.create({
                            data: {
                                expenseId: newExpense.id,
                                memberId: split.memberId,
                                amount: split.amount || 0,
                                percentage: split.percentage
                            }
                        });
                    }
                }

                // 3. Create Payers (if multiple)
                if (recurring.payers) {
                    const payersData = Array.isArray(recurring.payers) ? recurring.payers : JSON.parse(JSON.stringify(recurring.payers));

                    for (const payer of payersData) {
                        await tx.splitExpensePayer.create({
                            data: {
                                expenseId: newExpense.id,
                                memberId: payer.memberId,
                                amount: payer.amount
                            }
                        });
                    }
                }

                // 4. Calculate next run
                let nextRun = new Date(recurring.nextRun);
                switch (recurring.frequency) {
                    case 'WEEKLY':
                        nextRun = addWeeks(nextRun, 1);
                        break;
                    case 'MONTHLY':
                        nextRun = addMonths(nextRun, 1);
                        break;
                    case 'YEARLY':
                        nextRun = addYears(nextRun, 1);
                        break;
                    default:
                        nextRun = addMonths(nextRun, 1); // Default to monthly
                }

                // 5. Update Recurring Expense
                await tx.recurringSplitExpense.update({
                    where: { id: recurring.id },
                    data: { nextRun }
                });

                // 6. Log Activity
                await tx.splitGroupActivity.create({
                    data: {
                        groupId: recurring.groupId,
                        action: 'RECURRING_EXPENSE_GENERATED',
                        details: {
                            recurringId: recurring.id,
                            expenseId: newExpense.id,
                            description: recurring.description,
                            amount: recurring.amount
                        },
                        userId: recurring.paidById || 'SYSTEM' // Attribution might be tricky if paidById is null
                    }
                });
            });

            console.log(`Processed recurring expense ${recurring.id}. Next run: ${recurring.nextRun}`);

        } catch (error) {
            console.error(`Error processing recurring expense ${recurring.id}:`, error);
        }
    }
}

export default new CronService();
