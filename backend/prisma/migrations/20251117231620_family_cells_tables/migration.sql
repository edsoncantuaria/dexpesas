-- backend/prisma/migrations/20251117231620_family_cells_tables/migration.sql
-- Renomeia tabelas herdadas de “clan” para “family_cells” e recria índices exclusivos.

RENAME TABLE `clans` TO `family_cells`;
RENAME TABLE `clan_members` TO `cell_members`;
RENAME TABLE `clan_invites` TO `cell_invites`;

CREATE UNIQUE INDEX `cell_invites_clanId_invitedUserId_key` ON `cell_invites`(`clanId`, `invitedUserId`);
DROP INDEX `clan_invites_clanId_invitedUserId_key` ON `cell_invites`;

CREATE UNIQUE INDEX `family_cells_leaderId_key` ON `family_cells`(`leaderId`);
DROP INDEX `clans_leaderId_key` ON `family_cells`;

CREATE UNIQUE INDEX `family_cells_name_key` ON `family_cells`(`name`);
DROP INDEX `clans_name_key` ON `family_cells`;
