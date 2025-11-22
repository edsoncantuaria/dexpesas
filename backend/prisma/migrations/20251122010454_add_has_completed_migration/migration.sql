-- DropForeignKey
ALTER TABLE `InvestmentHolding` DROP FOREIGN KEY `InvestmentHolding_goalId_fkey`;

-- DropIndex
DROP INDEX `InvestmentHolding_goalId_fkey` ON `InvestmentHolding`;

-- AlterTable
ALTER TABLE `Achievement` ADD COLUMN `criteria` JSON NULL,
    ADD COLUMN `trigger` VARCHAR(191) NULL,
    MODIFY `icon` LONGTEXT NOT NULL;

-- AlterTable
ALTER TABLE `User` ADD COLUMN `emailVerificationExpires` DATETIME(3) NULL,
    ADD COLUMN `emailVerificationToken` VARCHAR(191) NULL,
    ADD COLUMN `emailVerified` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `hasCompletedMigration` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `hasCompletedTutorial` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `lastWeeklyReset` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `resetPasswordExpires` DATETIME(3) NULL,
    ADD COLUMN `resetPasswordToken` VARCHAR(191) NULL,
    ADD COLUMN `weeklyXp` INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE `InvestmentNudgeConversion` (
    `id` VARCHAR(191) NOT NULL,
    `planId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `aiAnalysisId` VARCHAR(191) NOT NULL,
    `targetAmount` DECIMAL(18, 4) NOT NULL,
    `triggeredAt` DATETIME(3) NOT NULL,
    `convertedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
