/*
  Warnings:

  - You are about to drop the column `balanceDifference` on the `Reconciliation` table. All the data in the column will be lost.
  - You are about to drop the column `statementClosingBalance` on the `Reconciliation` table. All the data in the column will be lost.
  - You are about to drop the column `statementCurrency` on the `Reconciliation` table. All the data in the column will be lost.
  - You are about to drop the column `statementOpeningBalance` on the `Reconciliation` table. All the data in the column will be lost.
  - You are about to drop the column `statementTimezone` on the `Reconciliation` table. All the data in the column will be lost.
  - You are about to drop the column `systemClosingBalance` on the `Reconciliation` table. All the data in the column will be lost.
  - You are about to drop the column `systemOpeningBalance` on the `Reconciliation` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX `Reconciliation_userId_idx` ON `Reconciliation`;

-- AlterTable
ALTER TABLE `Reconciliation` DROP COLUMN `balanceDifference`,
    DROP COLUMN `statementClosingBalance`,
    DROP COLUMN `statementCurrency`,
    DROP COLUMN `statementOpeningBalance`,
    DROP COLUMN `statementTimezone`,
    DROP COLUMN `systemClosingBalance`,
    DROP COLUMN `systemOpeningBalance`,
    MODIFY `totalJobs` INTEGER NULL,
    MODIFY `completedJobs` INTEGER NULL;
