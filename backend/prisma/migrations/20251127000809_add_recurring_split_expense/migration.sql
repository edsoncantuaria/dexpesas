-- CreateTable
CREATE TABLE `RecurringSplitExpense` (
    `id` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NOT NULL,
    `amount` DECIMAL(10, 2) NOT NULL,
    `frequency` VARCHAR(191) NOT NULL,
    `startDate` DATETIME(3) NOT NULL,
    `nextRun` DATETIME(3) NOT NULL,
    `active` BOOLEAN NOT NULL DEFAULT true,
    `splitType` ENUM('EQUAL', 'PERCENTAGE', 'EXACT') NOT NULL DEFAULT 'EQUAL',
    `groupId` VARCHAR(191) NOT NULL,
    `paidById` VARCHAR(191) NULL,
    `splits` JSON NOT NULL,
    `payers` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `RecurringSplitExpense_groupId_idx`(`groupId`),
    INDEX `RecurringSplitExpense_paidById_idx`(`paidById`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
