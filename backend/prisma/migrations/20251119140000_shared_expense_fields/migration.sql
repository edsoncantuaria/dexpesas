-- AlterTable
ALTER TABLE `cell_expenses` ADD COLUMN `expenseDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3);

-- AlterTable
ALTER TABLE `cell_expense_splits` ADD COLUMN `defaultAccountId` VARCHAR(191) NULL;

-- AddForeignKey
ALTER TABLE `cell_expense_splits` ADD CONSTRAINT `cell_expense_splits_defaultAccountId_fkey` FOREIGN KEY (`defaultAccountId`) REFERENCES `Account`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
