-- AlterTable
ALTER TABLE `Goal` ADD COLUMN `cellFundId` VARCHAR(191) NULL;

-- CreateIndex
CREATE UNIQUE INDEX `Goal_cellFundId_key` ON `Goal`(`cellFundId`);

-- AddForeignKey
ALTER TABLE `Goal` ADD CONSTRAINT `Goal_cellFundId_fkey` FOREIGN KEY (`cellFundId`) REFERENCES `cell_funds`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
