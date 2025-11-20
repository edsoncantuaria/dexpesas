/*
  Warnings:

  - Made the column `totalJobs` on table `Reconciliation` required. This step will fail if there are existing NULL values in that column.
  - Made the column `completedJobs` on table `Reconciliation` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE `Reconciliation` ADD COLUMN `balanceDifference` DECIMAL(14, 2) NULL,
    ADD COLUMN `statementClosingBalance` DECIMAL(14, 2) NULL,
    ADD COLUMN `statementCurrency` VARCHAR(191) NULL DEFAULT 'BRL',
    ADD COLUMN `statementOpeningBalance` DECIMAL(14, 2) NULL,
    ADD COLUMN `statementTimezone` VARCHAR(191) NULL DEFAULT 'America/Sao_Paulo',
    ADD COLUMN `systemClosingBalance` DECIMAL(14, 2) NULL,
    ADD COLUMN `systemOpeningBalance` DECIMAL(14, 2) NULL,
    MODIFY `totalJobs` INTEGER NOT NULL DEFAULT 0,
    MODIFY `completedJobs` INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX `Reconciliation_userId_idx` ON `Reconciliation`(`userId`);
