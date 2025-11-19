-- CreateTable
CREATE TABLE `cell_equilibrium_settlements` (
    `id` VARCHAR(191) NOT NULL,
    `cellId` VARCHAR(191) NOT NULL,
    `payerId` VARCHAR(191) NOT NULL,
    `receiverId` VARCHAR(191) NOT NULL,
    `amount` DECIMAL(18, 4) NOT NULL,
    `notes` VARCHAR(255) NULL,
    `referenceMonth` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `cell_equilibrium_settlements_cellId_idx`(`cellId`),
    CONSTRAINT `cell_equilibrium_settlements_cellId_fkey` FOREIGN KEY (`cellId`) REFERENCES `family_cells`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `cell_equilibrium_settlements_payerId_fkey` FOREIGN KEY (`payerId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `cell_equilibrium_settlements_receiverId_fkey` FOREIGN KEY (`receiverId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
