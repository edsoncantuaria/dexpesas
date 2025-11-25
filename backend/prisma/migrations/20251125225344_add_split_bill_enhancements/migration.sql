-- AlterTable
ALTER TABLE `SplitExpense` MODIFY `paidById` VARCHAR(191) NULL;

-- CreateTable
CREATE TABLE `SplitExpensePayer` (
    `id` VARCHAR(191) NOT NULL,
    `amount` DECIMAL(10, 2) NOT NULL,
    `memberId` VARCHAR(191) NOT NULL,
    `expenseId` VARCHAR(191) NOT NULL,

    INDEX `SplitExpensePayer_memberId_idx`(`memberId`),
    INDEX `SplitExpensePayer_expenseId_idx`(`expenseId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SplitGroupActivity` (
    `id` VARCHAR(191) NOT NULL,
    `groupId` VARCHAR(191) NOT NULL,
    `action` VARCHAR(191) NOT NULL,
    `details` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `userId` VARCHAR(191) NOT NULL,

    INDEX `SplitGroupActivity_groupId_idx`(`groupId`),
    INDEX `SplitGroupActivity_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
