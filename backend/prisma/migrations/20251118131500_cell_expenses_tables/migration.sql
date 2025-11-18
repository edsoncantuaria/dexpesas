-- backend/prisma/migrations/20251118131500_cell_expenses_tables/migration.sql
-- Renomeia as tabelas de despesas compartilhadas para o novo padrão das Células Financeiras
-- e cria a nova tabela de eventos familiares.

RENAME TABLE `SharedExpense` TO `cell_expenses`;
RENAME TABLE `SharedExpenseParticipant` TO `cell_expense_splits`;

CREATE TABLE `cell_events` (
  `id` VARCHAR(191) NOT NULL,
  `cellId` VARCHAR(191) NOT NULL,
  `actorId` VARCHAR(191) NULL,
  `type` VARCHAR(191) NOT NULL,
  `title` VARCHAR(191) NULL,
  `description` VARCHAR(191) NULL,
  `payload` JSON NULL,
  `entityId` VARCHAR(191) NULL,
  `entityType` VARCHAR(191) NULL,
  `visibility` VARCHAR(191) NOT NULL DEFAULT 'CELL',
  `sourceAuditLogId` VARCHAR(191) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

  UNIQUE INDEX `cell_events_sourceAuditLogId_key`(`sourceAuditLogId`),
  INDEX `cell_events_cellId_createdAt_idx`(`cellId`, `createdAt`),
  INDEX `cell_events_entityId_entityType_idx`(`entityId`, `entityType`),
  PRIMARY KEY (`id`),
  CONSTRAINT `cell_events_cellId_fkey` FOREIGN KEY (`cellId`) REFERENCES `family_cells`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `cell_events_actorId_fkey` FOREIGN KEY (`actorId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
