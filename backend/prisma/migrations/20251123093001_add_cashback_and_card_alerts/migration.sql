-- AlterTable
ALTER TABLE `Card` ADD COLUMN `cashbackExpiresAt` DATETIME(3) NULL,
    ADD COLUMN `cashbackRedemptionMinimum` DECIMAL(10, 2) NULL,
    ADD COLUMN `closingDayGap` INTEGER NOT NULL DEFAULT 7,
    ADD COLUMN `defaultCashbackRate` DECIMAL(5, 2) NULL DEFAULT 0,
    ADD COLUMN `totalCashbackEarned` DECIMAL(18, 4) NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE `ImportedTransaction` ADD COLUMN `metadata` JSON NULL;

-- AlterTable
ALTER TABLE `Reconciliation` ADD COLUMN `invoiceMonth` VARCHAR(191) NULL,
    ADD COLUMN `replaceMode` BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE `Transaction` ADD COLUMN `cashbackAmount` DECIMAL(10, 4) NULL,
    ADD COLUMN `cashbackPercentage` DECIMAL(5, 2) NULL;

-- AlterTable
ALTER TABLE `User` MODIFY `hasCompletedMigration` INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE `CardAlert` (
    `id` VARCHAR(191) NOT NULL,
    `cardId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `type` ENUM('DUE_DATE', 'LIMIT_WARNING', 'UNUSUAL_SPENDING', 'OVERDUE', 'PAYMENT_SUCCESS') NOT NULL,
    `severity` ENUM('INFO', 'WARNING', 'CRITICAL') NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `message` VARCHAR(191) NOT NULL,
    `metadata` JSON NULL,
    `triggeredAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `read` BOOLEAN NOT NULL DEFAULT false,
    `dismissed` BOOLEAN NOT NULL DEFAULT false,

    INDEX `CardAlert_userId_read_idx`(`userId`, `read`),
    INDEX `CardAlert_cardId_triggeredAt_idx`(`cardId`, `triggeredAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `MigrationDraft` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `currentStep` VARCHAR(191) NULL,
    `accounts` JSON NULL,
    `cards` JSON NULL,
    `cardHistory` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `MigrationDraft_userId_key`(`userId`),
    INDEX `MigrationDraft_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
