-- CreateTable
CREATE TABLE `InvestmentMetricSnapshot` (
    `id` VARCHAR(191) NOT NULL,
    `month` VARCHAR(191) NOT NULL,
    `soloPlanAdoptionPct` DECIMAL(6, 4) NOT NULL DEFAULT 0,
    `avgContributionIncomeRatio` DECIMAL(10, 4) NOT NULL DEFAULT 0,
    `planAdherenceRate` DECIMAL(6, 4) NOT NULL DEFAULT 0,
    `nudgeConversionRate` DECIMAL(6, 4) NOT NULL DEFAULT 0,
    `adoptionRate` DECIMAL(6, 4) NOT NULL DEFAULT 0,
    `churnRate` DECIMAL(6, 4) NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `InvestmentMetricSnapshot_month_key`(`month`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
