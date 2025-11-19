/*
  Warnings:

  - You are about to alter the column `notes` on the `cell_equilibrium_settlements` table. The data in that column could be lost. The data in that column will be cast from `VarChar(255)` to `VarChar(191)`.

*/
-- DropForeignKey
ALTER TABLE `cell_equilibrium_settlements` DROP FOREIGN KEY `cell_equilibrium_settlements_cellId_fkey`;

-- DropForeignKey
ALTER TABLE `cell_equilibrium_settlements` DROP FOREIGN KEY `cell_equilibrium_settlements_payerId_fkey`;

-- DropForeignKey
ALTER TABLE `cell_equilibrium_settlements` DROP FOREIGN KEY `cell_equilibrium_settlements_receiverId_fkey`;

-- DropIndex
DROP INDEX `cell_equilibrium_settlements_payerId_fkey` ON `cell_equilibrium_settlements`;

-- DropIndex
DROP INDEX `cell_equilibrium_settlements_receiverId_fkey` ON `cell_equilibrium_settlements`;

-- AlterTable
ALTER TABLE `cell_equilibrium_settlements` MODIFY `notes` VARCHAR(191) NULL;
