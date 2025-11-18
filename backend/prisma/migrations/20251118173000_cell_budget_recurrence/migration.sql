-- AlterTable
ALTER TABLE `cell_budgets`
    ADD COLUMN `recurrenceType` ENUM('MONTHLY', 'WEEKLY', 'BIWEEKLY', 'CUSTOM') NOT NULL DEFAULT 'MONTHLY',
    ADD COLUMN `recurrenceDays` INTEGER NULL,
    ADD COLUMN `lastSyncedAt` DATETIME(3) NULL;

-- AlterTable
ALTER TABLE `Budget`
    ADD COLUMN `cellBudgetId` VARCHAR(191) NULL,
    DROP INDEX `Budget_userId_categoryId_accountId_type_month_startDate_endD_key`,
    ADD UNIQUE INDEX `Budget_user_cat_type_month_cell_key`(`userId`, `categoryId`, `type`, `month`, `startDate`, `endDate`, `cellBudgetId`);
