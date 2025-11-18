/*
  Warnings:

  - You are about to drop the column `cellBudgetId` on the `Budget` table. All the data in the column will be lost.
  - You are about to drop the column `lastSyncedAt` on the `cell_budgets` table. All the data in the column will be lost.
  - You are about to drop the column `recurrenceDays` on the `cell_budgets` table. All the data in the column will be lost.
  - You are about to drop the column `recurrenceType` on the `cell_budgets` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[userId,categoryId,accountId,type,month,startDate,endDate]` on the table `Budget` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX `Budget_user_cat_type_month_cell_key` ON `Budget`;

-- AlterTable
ALTER TABLE `Budget` DROP COLUMN `cellBudgetId`;

-- AlterTable
ALTER TABLE `cell_budgets` DROP COLUMN `lastSyncedAt`,
    DROP COLUMN `recurrenceDays`,
    DROP COLUMN `recurrenceType`;

-- CreateIndex
CREATE UNIQUE INDEX `Budget_userId_categoryId_accountId_type_month_startDate_endD_key` ON `Budget`(`userId`, `categoryId`, `accountId`, `type`, `month`, `startDate`, `endDate`);
