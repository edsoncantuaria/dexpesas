-- backend/prisma/migrations/20251118103000_cell_member_permissions_backfill/migration.sql
-- Adiciona coluna de permissões granulares em membros da célula e realiza o backfill baseado no role atual.

ALTER TABLE `cell_members`
  ADD COLUMN `permissions_json` JSON NOT NULL DEFAULT (JSON_OBJECT());

UPDATE `cell_members`
SET `permissions_json` = CASE role
  WHEN 'LEADER' THEN JSON_OBJECT(
    'manageMembers', TRUE,
    'manageBudgets', TRUE,
    'recordTransactions', TRUE,
    'moveFunds', TRUE,
    'viewPersonalBudget', TRUE,
    'manageFunds', TRUE,
    'vote', TRUE,
    'approveSplits', TRUE
  )
  WHEN 'ADMIN' THEN JSON_OBJECT(
    'manageMembers', TRUE,
    'manageBudgets', TRUE,
    'recordTransactions', TRUE,
    'moveFunds', TRUE,
    'viewPersonalBudget', TRUE,
    'manageFunds', TRUE,
    'vote', TRUE,
    'approveSplits', TRUE
  )
  ELSE JSON_OBJECT(
    'manageMembers', FALSE,
    'manageBudgets', FALSE,
    'recordTransactions', TRUE,
    'moveFunds', FALSE,
    'viewPersonalBudget', FALSE,
    'manageFunds', FALSE,
    'vote', TRUE,
    'approveSplits', FALSE
  )
END;
