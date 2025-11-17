-- AlterTable
ALTER TABLE `User` ADD COLUMN `gamificationMode` ENUM('FULL', 'LITE', 'OFF') NOT NULL DEFAULT 'FULL';
