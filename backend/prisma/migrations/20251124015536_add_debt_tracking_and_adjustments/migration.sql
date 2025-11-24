/*
  Warnings:

  - You are about to drop the `Card` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterTable
ALTER TABLE `Account` ADD COLUMN `overdraftLimit` DECIMAL(18, 4) NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE `Budget` ADD COLUMN `alertedAt100` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `alertedAt80` BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE `User` ADD COLUMN `notificationPreferences` JSON NULL;

-- DropTable
DROP TABLE `Card`;

-- CreateTable
CREATE TABLE `cards` (
    `id` VARCHAR(191) NOT NULL,
    `nome` VARCHAR(191) NOT NULL,
    `limite` DECIMAL(18, 4) NOT NULL,
    `diaFechamento` INTEGER NOT NULL,
    `diaVencimento` INTEGER NOT NULL,
    `closingDayGap` INTEGER NOT NULL DEFAULT 7,
    `bandeira` ENUM('visa', 'mastercard', 'elo', 'amex') NOT NULL,
    `status` ENUM('ACTIVE', 'BLOCKED', 'CANCELLED') NOT NULL DEFAULT 'ACTIVE',
    `rewardsType` VARCHAR(191) NULL,
    `rewardsProgram` VARCHAR(191) NULL,
    `rewardsConversionRate` DECIMAL(10, 4) NULL,
    `lastFourDigits` VARCHAR(191) NULL,
    `issuer` VARCHAR(191) NULL,
    `billingCurrency` ENUM('BRL', 'USD') NOT NULL DEFAULT 'BRL',
    `currencyForConversion` ENUM('BRL', 'USD') NULL DEFAULT 'BRL',
    `currentInvoiceAmount` DECIMAL(18, 4) NOT NULL DEFAULT 0,
    `availableLimit` DECIMAL(18, 4) NULL,
    `jurosRotativo` DECIMAL(10, 4) NULL,
    `userId` VARCHAR(191) NOT NULL,
    `paymentAccountId` VARCHAR(191) NULL,
    `defaultCashbackRate` DECIMAL(5, 2) NULL DEFAULT 0,
    `totalCashbackEarned` DECIMAL(18, 4) NOT NULL DEFAULT 0,
    `cashbackExpiresAt` DATETIME(3) NULL,
    `cashbackRedemptionMinimum` DECIMAL(10, 2) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `debts` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `debtType` ENUM('CREDIT_CARD', 'PERSONAL_LOAN', 'MORTGAGE', 'AUTO_LOAN', 'STUDENT_LOAN', 'MEDICAL', 'OVERDRAFT', 'OTHER') NOT NULL,
    `originalAmount` DECIMAL(12, 2) NOT NULL,
    `currentBalance` DECIMAL(12, 2) NOT NULL,
    `interestRate` DECIMAL(5, 2) NOT NULL,
    `minimumPayment` DECIMAL(12, 2) NOT NULL,
    `cardId` VARCHAR(191) NULL,
    `categoryId` VARCHAR(191) NULL,
    `strategy` ENUM('SNOWBALL', 'AVALANCHE', 'CUSTOM', 'HIGHEST_BALANCE') NOT NULL DEFAULT 'SNOWBALL',
    `targetPayoffDate` DATETIME(3) NULL,
    `extraMonthlyPayment` DECIMAL(12, 2) NULL,
    `status` ENUM('ACTIVE', 'PAID_OFF', 'SETTLED', 'IN_COLLECTIONS') NOT NULL DEFAULT 'ACTIVE',
    `paidOffAt` DATETIME(3) NULL,
    `lastReviewedAt` DATETIME(3) NULL,
    `lastPaymentAt` DATETIME(3) NULL,
    `alertConfig` JSON NULL,
    `adjustmentHistory` JSON NULL,
    `metadata` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `debts_cardId_key`(`cardId`),
    INDEX `debts_userId_idx`(`userId`),
    INDEX `debts_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `debt_payments` (
    `id` VARCHAR(191) NOT NULL,
    `debtId` VARCHAR(191) NOT NULL,
    `transactionId` VARCHAR(191) NULL,
    `amount` DECIMAL(12, 2) NOT NULL,
    `principal` DECIMAL(12, 2) NOT NULL,
    `interest` DECIMAL(12, 2) NOT NULL,
    `paymentDate` DATETIME(3) NOT NULL,
    `balanceAfter` DECIMAL(12, 2) NOT NULL,
    `isExtraPayment` BOOLEAN NOT NULL DEFAULT false,
    `notes` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `debt_payments_transactionId_key`(`transactionId`),
    INDEX `debt_payments_debtId_idx`(`debtId`),
    INDEX `debt_payments_paymentDate_idx`(`paymentDate`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `debt_milestones` (
    `id` VARCHAR(191) NOT NULL,
    `debtId` VARCHAR(191) NOT NULL,
    `type` ENUM('HALF_PAID', 'QUARTER_LEFT', 'TEN_PERCENT_LEFT', 'PAID_OFF', 'SIX_MONTHS_FREE') NOT NULL,
    `targetAmount` DECIMAL(12, 2) NOT NULL,
    `achievedAt` DATETIME(3) NULL,
    `celebrated` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `debt_milestones_debtId_idx`(`debtId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `debt_adjustments` (
    `id` VARCHAR(191) NOT NULL,
    `debtId` VARCHAR(191) NOT NULL,
    `amount` DECIMAL(12, 2) NOT NULL,
    `reason` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `debt_adjustments_debtId_idx`(`debtId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `category_classifications` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `categoryId` VARCHAR(191) NOT NULL,
    `classification` ENUM('ESSENTIAL', 'LEISURE', 'INVESTMENT', 'OTHER') NOT NULL DEFAULT 'OTHER',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `category_classifications_userId_idx`(`userId`),
    INDEX `category_classifications_userId_classification_idx`(`userId`, `classification`),
    UNIQUE INDEX `category_classifications_userId_categoryId_key`(`userId`, `categoryId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
