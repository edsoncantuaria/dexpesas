-- AlterTable
ALTER TABLE `InvestmentHolding` ADD COLUMN `goalId` VARCHAR(191) NULL;

-- AddForeignKey
ALTER TABLE `InvestmentHolding` ADD CONSTRAINT `InvestmentHolding_goalId_fkey` FOREIGN KEY (`goalId`) REFERENCES `Goal`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
