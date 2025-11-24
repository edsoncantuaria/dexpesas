// backend/src/jobs/weeklyDebtCheck.js
import pkg from '@prisma/client';
const { PrismaClient } = pkg;
import DebtNotificationService from '../services/debtNotificationService.js';

const prisma = new PrismaClient();

/**
 * Weekly job to check all users' debt situations
 * and create notifications for critical cases
 */
export async function runWeeklyDebtCheck() {
    try {
        console.log('[Weekly Debt Check] Starting...');

        // Get all users with active debts
        const usersWithDebts = await prisma.user.findMany({
            where: {
                debts: {
                    some: {
                        status: 'ACTIVE'
                    }
                }
            },
            select: {
                id: true,
                nome: true
            }
        });

        console.log(`[Weekly Debt Check] Found ${usersWithDebts.length} users with active debts`);

        let checkedCount = 0;
        for (const user of usersWithDebts) {
            try {
                await DebtNotificationService.checkDebtAlerts(user.id);
                checkedCount++;
            } catch (error) {
                console.error(`[Weekly Debt Check] Error for user ${user.id}:`, error);
            }
        }

        console.log(`[Weekly Debt Check] Completed. Checked ${checkedCount}/${usersWithDebts.length} users.`);
    } catch (error) {
        console.error('[Weekly Debt Check] Failed:', error);
    } finally {
        await prisma.$disconnect();
    }
}

// Run immediately if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
    runWeeklyDebtCheck();
}
