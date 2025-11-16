-- AlterTable
ALTER TABLE `Notification` MODIFY `type` ENUM('TRANSACTION_CREATED', 'PAYMENT_DUE', 'LIMIT_ALERT', 'ACHIEVEMENT_UNLOCKED', 'BUDGET_ALERT', 'UPCOMING_PAYMENT', 'STREAK_AWARDED', 'SECURITY_ALERT', 'FAMILY_UPDATE') NOT NULL;

-- AlterTable
ALTER TABLE `User` ADD COLUMN `dashboardPreferences` JSON NULL,
    ADD COLUMN `favoriteCategories` JSON NULL,
    ADD COLUMN `fixedMonthlyIncome` DECIMAL(18, 2) NULL,
    ADD COLUMN `hideFamilyMode` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `lastSecurityNotificationAt` DATETIME(3) NULL,
    ADD COLUMN `phoneNumber` VARCHAR(191) NULL,
    ADD COLUMN `phoneVerified` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `twoFactorEnabled` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `twoFactorSecret` VARCHAR(191) NULL;

-- CreateTable
CREATE TABLE `user_favorite_categories` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `categoryId` VARCHAR(191) NOT NULL,
    `priority` INTEGER NOT NULL DEFAULT 0,

    UNIQUE INDEX `user_favorite_categories_userId_categoryId_key`(`userId`, `categoryId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user_devices` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `deviceId` VARCHAR(191) NOT NULL,
    `deviceName` VARCHAR(191) NULL,
    `platform` VARCHAR(191) NULL,
    `ipAddress` VARCHAR(191) NULL,
    `trusted` BOOLEAN NOT NULL DEFAULT false,
    `lastLoginAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `user_devices_userId_deviceId_key`(`userId`, `deviceId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `security_events` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `type` ENUM('NEW_DEVICE', 'PASSWORD_RESET', 'TWO_FACTOR_CHALLENGE') NOT NULL,
    `message` VARCHAR(191) NOT NULL,
    `metadata` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `security_events_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
