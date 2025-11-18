-- CreateTable
CREATE TABLE `cell_shared_accounts` (
    `id` VARCHAR(191) NOT NULL,
    `cellId` VARCHAR(191) NOT NULL,
    `accountId` VARCHAR(191) NOT NULL,
    `visibility` ENUM('MEMBERS', 'ADMINS', 'CUSTOM') NOT NULL DEFAULT 'MEMBERS',
    `allowedRoles` JSON NOT NULL,
    `metadata` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `cell_shared_accounts_cellId_accountId_key`(`cellId`, `accountId`),
    INDEX `cell_shared_accounts_cellId_idx`(`cellId`),
    INDEX `cell_shared_accounts_accountId_idx`(`accountId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AlterTable
ALTER TABLE `cell_expenses`
    ADD COLUMN `splitAppliedAt` DATETIME(3) NULL;

-- AddForeignKey
ALTER TABLE `cell_shared_accounts`
    ADD CONSTRAINT `cell_shared_accounts_cellId_fkey`
    FOREIGN KEY (`cellId`) REFERENCES `family_cells`(`id`) ON DELETE CASCADE;

-- AddForeignKey
ALTER TABLE `cell_shared_accounts`
    ADD CONSTRAINT `cell_shared_accounts_accountId_fkey`
    FOREIGN KEY (`accountId`) REFERENCES `Account`(`id`) ON DELETE CASCADE;
