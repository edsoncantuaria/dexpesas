-- backend/prisma/migrations/20251118150000_cell_core_structures/migration.sql
-- Cria tabelas essenciais das Células Financeiras (fundos, orçamentos, contribuições, regras e snapshots).

CREATE TABLE `cell_funds` (
  `id` VARCHAR(191) NOT NULL,
  `cellId` VARCHAR(191) NOT NULL,
  `name` VARCHAR(191) NOT NULL,
  `targetAmount` DECIMAL(18, 4) NOT NULL,
  `currentAmount` DECIMAL(18, 4) NOT NULL DEFAULT 0,
  `usagePolicy` JSON NULL,
  `status` ENUM('ACTIVE','PAUSED','COMPLETED') NOT NULL DEFAULT 'ACTIVE',
  `goalDeadline` DATETIME(3) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),

  INDEX `cell_funds_cellId_idx`(`cellId`),
  PRIMARY KEY (`id`),
  CONSTRAINT `cell_funds_cellId_fkey` FOREIGN KEY (`cellId`) REFERENCES `family_cells`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `cell_budgets` (
  `id` VARCHAR(191) NOT NULL,
  `cellId` VARCHAR(191) NOT NULL,
  `categoryId` VARCHAR(191) NULL,
  `label` VARCHAR(191) NULL,
  `type` ENUM('CELL','HYBRID','PERSONAL') NOT NULL DEFAULT 'CELL',
  `splitConfig` JSON NULL,
  `fundId` VARCHAR(191) NULL,
  `limit` DECIMAL(18, 4) NOT NULL,
  `effectiveFrom` DATETIME(3) NULL,
  `effectiveTo` DATETIME(3) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),

  INDEX `cell_budgets_cellId_idx`(`cellId`),
  INDEX `cell_budgets_cellId_type_idx`(`cellId`,`type`),
  PRIMARY KEY (`id`),
  CONSTRAINT `cell_budgets_cellId_fkey` FOREIGN KEY (`cellId`) REFERENCES `family_cells`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `cell_budgets_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `Category`(`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `cell_budgets_fundId_fkey` FOREIGN KEY (`fundId`) REFERENCES `cell_funds`(`id`) ON DELETE SET NULL ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `cell_fund_contributions` (
  `id` VARCHAR(191) NOT NULL,
  `fundId` VARCHAR(191) NOT NULL,
  `userId` VARCHAR(191) NOT NULL,
  `amount` DECIMAL(18, 4) NOT NULL,
  `source` VARCHAR(191) NULL,
  `fromBudgetId` VARCHAR(191) NULL,
  `metadata` JSON NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

  INDEX `cell_fund_contributions_fundId_createdAt_idx`(`fundId`,`createdAt`),
  PRIMARY KEY (`id`),
  CONSTRAINT `cell_fund_contributions_fundId_fkey` FOREIGN KEY (`fundId`) REFERENCES `cell_funds`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `cell_fund_contributions_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `cell_fund_contributions_fromBudgetId_fkey` FOREIGN KEY (`fromBudgetId`) REFERENCES `cell_budgets`(`id`) ON DELETE SET NULL ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `cell_split_rules` (
  `id` VARCHAR(191) NOT NULL,
  `cellId` VARCHAR(191) NOT NULL,
  `name` VARCHAR(191) NOT NULL,
  `trigger` ENUM('RECURRING_BILL','ADHOC','USAGE_BASED') NOT NULL DEFAULT 'ADHOC',
  `method` ENUM('EQUAL','WEIGHTED','CONSUMPTION','PAYER_REIMBURSED') NOT NULL DEFAULT 'EQUAL',
  `weightsConfig` JSON NULL,
  `consumptionMetric` VARCHAR(191) NULL,
  `autoReimburse` BOOLEAN NOT NULL DEFAULT false,
  `active` BOOLEAN NOT NULL DEFAULT true,
  `metadata` JSON NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),

  INDEX `cell_split_rules_cellId_active_idx`(`cellId`,`active`),
  PRIMARY KEY (`id`),
  CONSTRAINT `cell_split_rules_cellId_fkey` FOREIGN KEY (`cellId`) REFERENCES `family_cells`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `cell_equilibrium_snapshots` (
  `id` VARCHAR(191) NOT NULL,
  `cellId` VARCHAR(191) NOT NULL,
  `referenceMonth` VARCHAR(191) NOT NULL,
  `summary` JSON NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

  UNIQUE INDEX `cell_equilibrium_snapshots_cellId_referenceMonth_key`(`cellId`,`referenceMonth`),
  PRIMARY KEY (`id`),
  CONSTRAINT `cell_equilibrium_snapshots_cellId_fkey` FOREIGN KEY (`cellId`) REFERENCES `family_cells`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
