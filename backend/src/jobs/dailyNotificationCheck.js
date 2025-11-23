// backend/src/jobs/dailyNotificationCheck.js
import cron from 'node-cron';
import SmartAlertsService from '../services/notifications/smartAlerts.js';

/**
 * Schedule daily notification checks
 * Runs every day at 9:00 AM
 */
export function scheduleDailyNotificationCheck() {
    // Cron expression: "0 9 * * *" = At 9:00 AM every day
    cron.schedule('0 9 * * *', async () => {
        console.log('⏰ [CRON] Daily notification check triggered at', new Date().toISOString());

        try {
            await SmartAlertsService.runAllChecks();
        } catch (error) {
            console.error('[CRON] Error in daily notification check:', error);
        }
    }, {
        timezone: 'America/Sao_Paulo' // Adjust to your timezone
    });

    console.log('✅ Daily notification check scheduled for 9:00 AM');
}

/**
 * Run checks immediately (for testing/manual trigger)
 */
export async function runNotificationCheckNow() {
    console.log('🔄 Running notification check manually...');
    await SmartAlertsService.runAllChecks();
}
