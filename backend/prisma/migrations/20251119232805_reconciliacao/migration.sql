-- DropForeignKey
ALTER TABLE `Goal` DROP FOREIGN KEY `Goal_cellFundId_fkey`;

-- DropForeignKey
ALTER TABLE `cell_expense_splits` DROP FOREIGN KEY `cell_expense_splits_defaultAccountId_fkey`;

-- DropIndex
DROP INDEX `cell_expense_splits_defaultAccountId_fkey` ON `cell_expense_splits`;
