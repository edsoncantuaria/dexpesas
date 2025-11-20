-- CreateTable
CREATE TABLE `InvestmentPlan` (
    `id` VARCHAR(191) NOT NULL,
    `priority` ENUM('investir', 'lazer', 'balanceado') NOT NULL DEFAULT 'investir',
    `targetPercent` DECIMAL(5, 4) NOT NULL DEFAULT 0.2,
    `targetAmountMin` DECIMAL(18, 2) NOT NULL DEFAULT 0,
    `targetAmount` DECIMAL(18, 2) NULL,
    `leisureFloor` DECIMAL(18, 2) NOT NULL DEFAULT 0,
    `leisurePercentMin` DECIMAL(5, 4) NOT NULL DEFAULT 0.15,
    `emergencyFundTarget` DECIMAL(18, 2) NULL,
    `notes` TEXT NULL,
    `status` ENUM('ACTIVE', 'PAUSED', 'ARCHIVED') NOT NULL DEFAULT 'ACTIVE',
    `userId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `InvestmentPlan_userId_key`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `InvestmentHolding` (
    `id` VARCHAR(191) NOT NULL,
    `planId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `accountId` VARCHAR(191) NOT NULL,
    `assetClass` VARCHAR(191) NOT NULL,
    `ticker` VARCHAR(191) NULL,
    `currentAmount` DECIMAL(18, 4) NOT NULL DEFAULT 0,
    `expectedReturn` DECIMAL(10, 4) NULL,
    `metadata` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `InvestmentContribution` (
    `id` VARCHAR(191) NOT NULL,
    `planId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `accountId` VARCHAR(191) NOT NULL,
    `fromAccountId` VARCHAR(191) NOT NULL,
    `holdingId` VARCHAR(191) NULL,
    `amount` DECIMAL(18, 4) NOT NULL,
    `leisureImpact` DECIMAL(18, 4) NULL DEFAULT 0,
    `status` ENUM('PENDING', 'EXECUTED', 'FAILED') NOT NULL DEFAULT 'EXECUTED',
    `source` ENUM('MANUAL', 'AUTOMATION', 'WINDFALL', 'AI_SUGGESTION') NOT NULL DEFAULT 'MANUAL',
    `notes` TEXT NULL,
    `analysisSnapshot` JSON NULL,
    `debitTransactionId` VARCHAR(191) NULL,
    `creditTransactionId` VARCHAR(191) NULL,
    `executedAt` DATETIME(3) NULL,
    `month` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `InvestmentContribution_debitTransactionId_key`(`debitTransactionId`),
    UNIQUE INDEX `InvestmentContribution_creditTransactionId_key`(`creditTransactionId`),
    INDEX `InvestmentContribution_planId_month_idx`(`planId`, `month`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `InvestmentSnapshot` (
    `id` VARCHAR(191) NOT NULL,
    `planId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `month` VARCHAR(191) NOT NULL,
    `totalInvested` DECIMAL(18, 4) NOT NULL DEFAULT 0,
    `totalReturns` DECIMAL(18, 4) NOT NULL DEFAULT 0,
    `leisureSpent` DECIMAL(18, 4) NOT NULL DEFAULT 0,
    `deltaVsPlan` DECIMAL(18, 4) NOT NULL DEFAULT 0,
    `confidenceScore` DECIMAL(5, 2) NULL,
    `commentaryJson` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `InvestmentSnapshot_planId_month_key`(`planId`, `month`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
