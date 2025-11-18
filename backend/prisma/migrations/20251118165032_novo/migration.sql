-- DropForeignKey
ALTER TABLE `cell_shared_accounts` DROP FOREIGN KEY `cell_shared_accounts_accountId_fkey`;

-- DropForeignKey
ALTER TABLE `cell_shared_accounts` DROP FOREIGN KEY `cell_shared_accounts_cellId_fkey`;

-- RedefineIndex
CREATE UNIQUE INDEX `Budget_userId_categoryId_type_month_startDate_endDate_cellBu_key` ON `Budget`(`userId`, `categoryId`, `type`, `month`, `startDate`, `endDate`, `cellBudgetId`);
DROP INDEX `Budget_user_cat_type_month_cell_key` ON `Budget`;
