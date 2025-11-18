-- CreateTable
CREATE TABLE `User` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `username` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `password` VARCHAR(191) NOT NULL,
    `age` INTEGER NULL,
    `gender` VARCHAR(191) NULL,
    `avatarUrl` VARCHAR(191) NULL,
    `role` ENUM('USER', 'ADMIN') NOT NULL DEFAULT 'USER',
    `isAdmin` BOOLEAN NOT NULL DEFAULT false,
    `firstOpen` BOOLEAN NOT NULL DEFAULT true,
    `futureProjectionCount` INTEGER NOT NULL DEFAULT 3,
    `daysUntilDueReminder` INTEGER NOT NULL DEFAULT 3,
    `enableAchievementNotifications` BOOLEAN NOT NULL DEFAULT true,
    `enableBudgetNotifications` BOOLEAN NOT NULL DEFAULT true,
    `enableLimitAlerts` BOOLEAN NOT NULL DEFAULT true,
    `enableUpcomingPaymentNotifications` BOOLEAN NOT NULL DEFAULT true,
    `enableOcr` BOOLEAN NOT NULL DEFAULT false,
    `enableDailySummary` BOOLEAN NOT NULL DEFAULT false,
    `enableBudgetSuggestion` BOOLEAN NOT NULL DEFAULT false,
    `enableReconciliationAi` BOOLEAN NOT NULL DEFAULT false,
    `enableGoalProjection` BOOLEAN NOT NULL DEFAULT false,
    `habilitarDescricaoInteligente` BOOLEAN NOT NULL DEFAULT true,
    `dashboardLayout` JSON NULL,
    `professionalSituation` VARCHAR(191) NULL,
    `monthlyIncomeRange` VARCHAR(191) NULL,
    `investmentProfile` VARCHAR(191) NULL,
    `mainFinancialGoal` VARCHAR(191) NULL,
    `fixedMonthlyIncome` DECIMAL(18, 2) NULL,
    `phoneNumber` VARCHAR(191) NULL,
    `phoneVerified` BOOLEAN NOT NULL DEFAULT false,
    `twoFactorEnabled` BOOLEAN NOT NULL DEFAULT false,
    `twoFactorSecret` VARCHAR(191) NULL,
    `favoriteCategories` JSON NULL,
    `dashboardPreferences` JSON NULL,
    `hideFamilyMode` BOOLEAN NOT NULL DEFAULT false,
    `lastSecurityNotificationAt` DATETIME(3) NULL,
    `pushSubscription` TEXT NULL,
    `gamificationMode` ENUM('FULL', 'LITE', 'OFF') NOT NULL DEFAULT 'FULL',
    `level` INTEGER NOT NULL DEFAULT 1,
    `xp` INTEGER NOT NULL DEFAULT 0,
    `heroClass` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `User_username_key`(`username`),
    UNIQUE INDEX `User_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `family_cells` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `iconUrl` VARCHAR(191) NULL,
    `balance` DECIMAL(18, 4) NOT NULL DEFAULT 0,
    `level` INTEGER NOT NULL DEFAULT 1,
    `xp` BIGINT NOT NULL DEFAULT 0,
    `policies` JSON NULL,
    `maxMembers` INTEGER NOT NULL DEFAULT 50,
    `leaderId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `family_cells_name_key`(`name`),
    UNIQUE INDEX `family_cells_leaderId_key`(`leaderId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `cell_members` (
    `userId` VARCHAR(191) NOT NULL,
    `clanId` VARCHAR(191) NOT NULL,
    `role` ENUM('LEADER', 'ADMIN', 'MEMBER') NOT NULL DEFAULT 'MEMBER',
    `joinedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `permissions_json` JSON NOT NULL,

    PRIMARY KEY (`userId`, `clanId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `cell_invites` (
    `id` VARCHAR(191) NOT NULL,
    `clanId` VARCHAR(191) NOT NULL,
    `invitedUserId` VARCHAR(191) NOT NULL,
    `inviterId` VARCHAR(191) NOT NULL,
    `status` ENUM('PENDING', 'ACCEPTED', 'DECLINED') NOT NULL DEFAULT 'PENDING',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `expiresAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `cell_invites_clanId_invitedUserId_key`(`clanId`, `invitedUserId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `cell_expenses` (
    `id` VARCHAR(191) NOT NULL,
    `clanId` VARCHAR(191) NOT NULL,
    `creatorId` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NOT NULL,
    `totalAmount` DECIMAL(18, 4) NOT NULL,
    `splitMethod` ENUM('EQUAL', 'PERCENTAGE', 'AMOUNT') NOT NULL,
    `categoryId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `cell_expense_splits` (
    `id` VARCHAR(191) NOT NULL,
    `sharedExpenseId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `amountOwed` DECIMAL(18, 4) NOT NULL,
    `createdTransactionId` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `cell_expense_splits_createdTransactionId_key`(`createdTransactionId`),
    UNIQUE INDEX `cell_expense_splits_sharedExpenseId_userId_key`(`sharedExpenseId`, `userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `cell_budgets` (
    `id` VARCHAR(191) NOT NULL,
    `cellId` VARCHAR(191) NOT NULL,
    `categoryId` VARCHAR(191) NULL,
    `label` VARCHAR(191) NULL,
    `type` ENUM('CELL', 'HYBRID', 'PERSONAL') NOT NULL DEFAULT 'CELL',
    `recurrenceType` ENUM('MONTHLY', 'WEEKLY', 'BIWEEKLY', 'CUSTOM') NOT NULL DEFAULT 'MONTHLY',
    `recurrenceDays` INTEGER NULL,
    `splitConfig` JSON NULL,
    `fundId` VARCHAR(191) NULL,
    `limit` DECIMAL(18, 4) NOT NULL,
    `effectiveFrom` DATETIME(3) NULL,
    `effectiveTo` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `cell_budgets_cellId_idx`(`cellId`),
    INDEX `cell_budgets_cellId_type_idx`(`cellId`, `type`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `cell_funds` (
    `id` VARCHAR(191) NOT NULL,
    `cellId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `targetAmount` DECIMAL(18, 4) NOT NULL,
    `currentAmount` DECIMAL(18, 4) NOT NULL DEFAULT 0,
    `usagePolicy` JSON NULL,
    `status` ENUM('ACTIVE', 'PAUSED', 'COMPLETED') NOT NULL DEFAULT 'ACTIVE',
    `goalDeadline` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `cell_funds_cellId_idx`(`cellId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `cell_fund_contributions` (
    `id` VARCHAR(191) NOT NULL,
    `fundId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `amount` DECIMAL(18, 4) NOT NULL,
    `source` VARCHAR(191) NULL,
    `fromBudgetId` VARCHAR(191) NULL,
    `metadata` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `cell_fund_contributions_fundId_createdAt_idx`(`fundId`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `cell_split_rules` (
    `id` VARCHAR(191) NOT NULL,
    `cellId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `trigger` ENUM('RECURRING_BILL', 'ADHOC', 'USAGE_BASED') NOT NULL DEFAULT 'ADHOC',
    `method` ENUM('EQUAL', 'WEIGHTED', 'CONSUMPTION', 'PAYER_REIMBURSED') NOT NULL DEFAULT 'EQUAL',
    `weightsConfig` JSON NULL,
    `consumptionMetric` VARCHAR(191) NULL,
    `autoReimburse` BOOLEAN NOT NULL DEFAULT false,
    `active` BOOLEAN NOT NULL DEFAULT true,
    `metadata` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `cell_split_rules_cellId_active_idx`(`cellId`, `active`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `cell_equilibrium_snapshots` (
    `id` VARCHAR(191) NOT NULL,
    `cellId` VARCHAR(191) NOT NULL,
    `referenceMonth` VARCHAR(191) NOT NULL,
    `summary` JSON NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `cell_equilibrium_snapshots_cellId_referenceMonth_key`(`cellId`, `referenceMonth`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
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
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `LegacyRuin` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `totalAmountPaid` DECIMAL(18, 4) NOT NULL,
    `totalInterestPaid` DECIMAL(18, 4) NULL,
    `startDate` DATETIME(3) NOT NULL,
    `endDate` DATETIME(3) NOT NULL,
    `originalRecurrenceId` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `LegacyRuin_originalRecurrenceId_key`(`originalRecurrenceId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `UserStreak` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `type` ENUM('DAILY_TRANSACTION', 'NO_VICE_SPENDING') NOT NULL,
    `currentStreak` INTEGER NOT NULL DEFAULT 0,
    `longestStreak` INTEGER NOT NULL DEFAULT 0,
    `lastCheckedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `UserStreak_userId_type_key`(`userId`, `type`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `GameEvent` (
    `id` VARCHAR(191) NOT NULL,
    `type` ENUM('XP_MULTIPLIER', 'ITEM_DROP') NOT NULL,
    `description` VARCHAR(191) NOT NULL,
    `multiplier` DOUBLE NULL,
    `itemId` VARCHAR(191) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `startAt` DATETIME(3) NOT NULL,
    `endAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Mission` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NOT NULL,
    `scope` ENUM('USER', 'GUILD') NOT NULL DEFAULT 'USER',
    `xpReward` INTEGER NOT NULL,
    `itemRewardId` VARCHAR(191) NULL,
    `minLevel` INTEGER NOT NULL DEFAULT 1,
    `requiredClass` VARCHAR(191) NULL,
    `triggerSpec` JSON NOT NULL,
    `isRepeatable` BOOLEAN NOT NULL DEFAULT false,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `UserItem` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `itemId` VARCHAR(191) NOT NULL,
    `quantity` INTEGER NOT NULL DEFAULT 1,
    `equipped` BOOLEAN NOT NULL DEFAULT false,

    UNIQUE INDEX `UserItem_userId_itemId_key`(`userId`, `itemId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Account` (
    `id` VARCHAR(191) NOT NULL,
    `nome` VARCHAR(191) NOT NULL,
    `instituicao` VARCHAR(191) NOT NULL,
    `bankCode` VARCHAR(191) NULL,
    `agencyNumber` VARCHAR(191) NULL,
    `agencyDigit` VARCHAR(191) NULL,
    `accountNumber` VARCHAR(191) NULL,
    `accountDigit` VARCHAR(191) NULL,
    `tipo` ENUM('corrente', 'poupanca', 'investimento') NOT NULL,
    `currency` ENUM('BRL', 'USD') NOT NULL DEFAULT 'BRL',
    `saldoInicial` DECIMAL(18, 4) NOT NULL,
    `color` VARCHAR(191) NULL,
    `icone` VARCHAR(191) NULL,
    `isArchived` BOOLEAN NOT NULL DEFAULT false,
    `userId` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Card` (
    `id` VARCHAR(191) NOT NULL,
    `nome` VARCHAR(191) NOT NULL,
    `limite` DECIMAL(18, 4) NOT NULL,
    `diaFechamento` INTEGER NOT NULL,
    `diaVencimento` INTEGER NOT NULL,
    `bandeira` ENUM('visa', 'mastercard', 'elo', 'amex') NOT NULL,
    `status` ENUM('ACTIVE', 'BLOCKED', 'CANCELLED') NOT NULL DEFAULT 'ACTIVE',
    `rewardsType` VARCHAR(191) NULL,
    `rewardsProgram` VARCHAR(191) NULL,
    `rewardsConversionRate` DECIMAL(10, 4) NULL,
    `lastFourDigits` VARCHAR(191) NULL,
    `issuer` VARCHAR(191) NULL,
    `billingCurrency` ENUM('BRL', 'USD') NOT NULL DEFAULT 'BRL',
    `currencyForConversion` ENUM('BRL', 'USD') NULL DEFAULT 'BRL',
    `currentInvoiceAmount` DECIMAL(18, 4) NOT NULL DEFAULT 0,
    `availableLimit` DECIMAL(18, 4) NULL,
    `jurosRotativo` DECIMAL(10, 4) NULL,
    `userId` VARCHAR(191) NOT NULL,
    `paymentAccountId` VARCHAR(191) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Transaction` (
    `id` VARCHAR(191) NOT NULL,
    `valor` DECIMAL(18, 4) NOT NULL,
    `descricao` VARCHAR(191) NOT NULL,
    `tipo` ENUM('receita', 'despesa') NOT NULL,
    `data` DATETIME(3) NOT NULL,
    `metodoPagamento` ENUM('debito', 'credito', 'pix', 'dinheiro', 'transferencia') NOT NULL,
    `currency` ENUM('BRL', 'USD') NOT NULL DEFAULT 'BRL',
    `status` ENUM('PENDING', 'POSTED', 'CANCELLED', 'FAILED') NOT NULL DEFAULT 'POSTED',
    `pago` BOOLEAN NOT NULL DEFAULT true,
    `notes` TEXT NULL,
    `installment` BOOLEAN NULL DEFAULT false,
    `installmentId` VARCHAR(191) NULL,
    `installmentNumber` INTEGER NULL,
    `totalInstallments` INTEGER NULL,
    `withInterest` BOOLEAN NULL DEFAULT false,
    `interestRate` DECIMAL(10, 4) NULL,
    `valorTotal` DECIMAL(18, 4) NULL,
    `totalWithInterest` DECIMAL(18, 4) NULL,
    `balanceAfter` DECIMAL(18, 4) NULL,
    `recurrenceType` ENUM('WEEKLY', 'BIWEEKLY', 'MONTHLY', 'BIMONTHLY', 'TRIMONTHLY', 'SEMIANNUALLY') NULL,
    `recorrenciaId` VARCHAR(191) NULL,
    `attachmentUrl` VARCHAR(191) NULL,
    `bankReference` VARCHAR(191) NULL,
    `authorizationCode` VARCHAR(191) NULL,
    `merchantName` VARCHAR(191) NULL,
    `merchantCategory` VARCHAR(191) NULL,
    `counterparty` VARCHAR(191) NULL,
    `postedAt` DATETIME(3) NULL,
    `clearedAt` DATETIME(3) NULL,
    `isTransfer` BOOLEAN NOT NULL DEFAULT false,
    `counterAccountId` VARCHAR(191) NULL,
    `transferGroupId` VARCHAR(191) NULL,
    `isReconciled` BOOLEAN NOT NULL DEFAULT false,
    `isInvoicePayment` BOOLEAN NOT NULL DEFAULT false,
    `finalizedGoalId` VARCHAR(191) NULL,
    `userId` VARCHAR(191) NOT NULL,
    `accountId` VARCHAR(191) NULL,
    `cardId` VARCHAR(191) NULL,
    `categoryId` VARCHAR(191) NULL,
    `importedTransactionId` VARCHAR(191) NULL,
    `sharedExpenseParticipantId` VARCHAR(191) NULL,

    UNIQUE INDEX `Transaction_importedTransactionId_key`(`importedTransactionId`),
    UNIQUE INDEX `Transaction_sharedExpenseParticipantId_key`(`sharedExpenseParticipantId`),
    INDEX `Transaction_recorrenciaId_idx`(`recorrenciaId`),
    INDEX `Transaction_installmentId_idx`(`installmentId`),
    INDEX `Transaction_userId_data_idx`(`userId`, `data`),
    INDEX `Transaction_status_idx`(`status`),
    INDEX `Transaction_bankReference_idx`(`bankReference`),
    INDEX `Transaction_transferGroupId_idx`(`transferGroupId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `LedgerEntry` (
    `id` VARCHAR(191) NOT NULL,
    `transactionId` VARCHAR(191) NOT NULL,
    `accountId` VARCHAR(191) NOT NULL,
    `direction` ENUM('DEBIT', 'CREDIT') NOT NULL,
    `amount` DECIMAL(18, 4) NOT NULL,
    `currency` ENUM('BRL', 'USD') NOT NULL DEFAULT 'BRL',
    `exchangeRate` DECIMAL(18, 8) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `LedgerEntry_transactionId_idx`(`transactionId`),
    INDEX `LedgerEntry_accountId_idx`(`accountId`),
    UNIQUE INDEX `LedgerEntry_transactionId_accountId_direction_key`(`transactionId`, `accountId`, `direction`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CardInvoice` (
    `id` VARCHAR(191) NOT NULL,
    `cardId` VARCHAR(191) NOT NULL,
    `referenceMonth` VARCHAR(191) NOT NULL,
    `startDate` DATETIME(3) NOT NULL,
    `endDate` DATETIME(3) NOT NULL,
    `closingDate` DATETIME(3) NOT NULL,
    `dueDate` DATETIME(3) NOT NULL,
    `status` ENUM('OPEN', 'CLOSED', 'PAID', 'OVERDUE') NOT NULL DEFAULT 'OPEN',
    `amountDue` DECIMAL(18, 4) NOT NULL,
    `amountPaid` DECIMAL(18, 4) NOT NULL DEFAULT 0,
    `minimumPayment` DECIMAL(18, 4) NULL,
    `previousBalance` DECIMAL(18, 4) NULL,
    `generatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `CardInvoice_cardId_referenceMonth_idx`(`cardId`, `referenceMonth`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CardInvoiceItem` (
    `id` VARCHAR(191) NOT NULL,
    `invoiceId` VARCHAR(191) NOT NULL,
    `transactionId` VARCHAR(191) NULL,
    `description` VARCHAR(191) NOT NULL,
    `type` ENUM('receita', 'despesa') NOT NULL,
    `amount` DECIMAL(18, 4) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `RecurringBill` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NOT NULL,
    `amount` DECIMAL(18, 4) NOT NULL,
    `currency` ENUM('BRL', 'USD') NOT NULL DEFAULT 'BRL',
    `type` ENUM('receita', 'despesa') NOT NULL,
    `status` ENUM('ACTIVE', 'PAUSED', 'CANCELLED') NOT NULL DEFAULT 'ACTIVE',
    `recurrenceType` ENUM('WEEKLY', 'BIWEEKLY', 'MONTHLY', 'BIMONTHLY', 'TRIMONTHLY', 'SEMIANNUALLY') NOT NULL,
    `dueDayOfMonth` INTEGER NULL,
    `startDate` DATETIME(3) NOT NULL,
    `endDate` DATETIME(3) NULL,
    `nextOccurrenceAt` DATETIME(3) NULL,
    `remindDaysBefore` INTEGER NOT NULL DEFAULT 2,
    `autopayEnabled` BOOLEAN NOT NULL DEFAULT false,
    `autoPayAccountId` VARCHAR(191) NULL,
    `autoPayCardId` VARCHAR(191) NULL,
    `accountId` VARCHAR(191) NULL,
    `cardId` VARCHAR(191) NULL,
    `categoryId` VARCHAR(191) NULL,
    `notes` TEXT NULL,
    `lastGeneratedAt` DATETIME(3) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `BillOccurrence` (
    `id` VARCHAR(191) NOT NULL,
    `billId` VARCHAR(191) NOT NULL,
    `dueDate` DATETIME(3) NOT NULL,
    `amount` DECIMAL(18, 4) NOT NULL,
    `status` ENUM('PENDING', 'PAID', 'SKIPPED', 'FAILED') NOT NULL DEFAULT 'PENDING',
    `paidAt` DATETIME(3) NULL,
    `transactionId` VARCHAR(191) NULL,
    `notes` TEXT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Attachment` (
    `id` VARCHAR(191) NOT NULL,
    `url` VARCHAR(191) NOT NULL,
    `mimeType` VARCHAR(191) NULL,
    `size` INTEGER NULL,
    `description` VARCHAR(191) NULL,
    `uploadedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `userId` VARCHAR(191) NOT NULL,
    `transactionId` VARCHAR(191) NULL,
    `billOccurrenceId` VARCHAR(191) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Tag` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `Tag_userId_name_key`(`userId`, `name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Category` (
    `id` VARCHAR(191) NOT NULL,
    `nome` VARCHAR(191) NOT NULL,
    `label` VARCHAR(191) NOT NULL,
    `icon` VARCHAR(191) NULL,
    `type` ENUM('receita', 'despesa') NOT NULL DEFAULT 'despesa',
    `parentCategoryId` VARCHAR(191) NULL,
    `userId` VARCHAR(191) NULL,

    INDEX `Category_parentCategoryId_idx`(`parentCategoryId`),
    UNIQUE INDEX `Category_userId_nome_key`(`userId`, `nome`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Budget` (
    `id` VARCHAR(191) NOT NULL,
    `month` VARCHAR(191) NULL,
    `limit` DECIMAL(18, 4) NOT NULL,
    `rollover` BOOLEAN NOT NULL DEFAULT false,
    `type` ENUM('MONTHLY', 'WEEKLY', 'CUSTOM') NOT NULL DEFAULT 'MONTHLY',
    `startDate` DATETIME(3) NULL,
    `endDate` DATETIME(3) NULL,
    `currency` ENUM('BRL', 'USD') NOT NULL DEFAULT 'BRL',
    `includeTransfers` BOOLEAN NOT NULL DEFAULT false,
    `userId` VARCHAR(191) NOT NULL,
    `categoryId` VARCHAR(191) NOT NULL,
    `accountId` VARCHAR(191) NULL,
    `cellBudgetId` VARCHAR(191) NULL,

    INDEX `Budget_userId_startDate_endDate_idx`(`userId`, `startDate`, `endDate`),
    INDEX `Budget_userId_month_idx`(`userId`, `month`),
    UNIQUE INDEX `Budget_user_cat_type_month_cell_key`(`userId`, `categoryId`, `type`, `month`, `startDate`, `endDate`, `cellBudgetId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Goal` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `targetAmount` DECIMAL(18, 4) NOT NULL,
    `currentAmount` DECIMAL(18, 4) NOT NULL DEFAULT 0,
    `status` ENUM('IN_PROGRESS', 'COMPLETED') NOT NULL DEFAULT 'IN_PROGRESS',
    `deadline` DATETIME(3) NULL,
    `imageUrl` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `userId` VARCHAR(191) NULL,
    `accountId` VARCHAR(191) NULL,
    `clanId` VARCHAR(191) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `GoalContribution` (
    `id` VARCHAR(191) NOT NULL,
    `amount` DECIMAL(18, 4) NOT NULL,
    `date` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `goalId` VARCHAR(191) NOT NULL,
    `debitTransactionId` VARCHAR(191) NULL,

    UNIQUE INDEX `GoalContribution_debitTransactionId_key`(`debitTransactionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Achievement` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NOT NULL,
    `icon` VARCHAR(191) NOT NULL,
    `xp` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `UnlockedAchievement` (
    `id` VARCHAR(191) NOT NULL,
    `destacada` BOOLEAN NOT NULL DEFAULT false,
    `unlockedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `userId` VARCHAR(191) NOT NULL,
    `achievementId` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `UnlockedAchievement_userId_achievementId_key`(`userId`, `achievementId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Notification` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `message` VARCHAR(191) NOT NULL,
    `type` ENUM('TRANSACTION_CREATED', 'PAYMENT_DUE', 'LIMIT_ALERT', 'ACHIEVEMENT_UNLOCKED', 'BUDGET_ALERT', 'UPCOMING_PAYMENT', 'STREAK_AWARDED', 'SECURITY_ALERT', 'FAMILY_UPDATE') NOT NULL,
    `read` BOOLEAN NOT NULL DEFAULT false,
    `relatedId` VARCHAR(191) NULL,
    `actions` JSON NULL,
    `userId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Automation` (
    `id` VARCHAR(191) NOT NULL,
    `type` ENUM('ROUND_UP', 'GOAL_CONTRIBUTION', 'BILL_PAY') NOT NULL,
    `enabled` BOOLEAN NOT NULL DEFAULT false,
    `config` JSON NOT NULL,
    `scheduleType` ENUM('MANUAL', 'DAILY', 'WEEKLY', 'MONTHLY', 'THRESHOLD') NOT NULL DEFAULT 'MANUAL',
    `scheduleValue` VARCHAR(191) NULL,
    `lastRun` DATETIME(3) NULL,
    `userId` VARCHAR(191) NOT NULL,
    `goalId` VARCHAR(191) NULL,
    `recorrenciaId` VARCHAR(191) NULL,

    UNIQUE INDEX `Automation_goalId_key`(`goalId`),
    UNIQUE INDEX `Automation_userId_type_recorrenciaId_key`(`userId`, `type`, `recorrenciaId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `RoundUpEntry` (
    `id` VARCHAR(191) NOT NULL,
    `transactionId` VARCHAR(191) NOT NULL,
    `amount` DECIMAL(18, 4) NOT NULL,
    `processed` BOOLEAN NOT NULL DEFAULT false,
    `processedAt` DATETIME(3) NULL,

    UNIQUE INDEX `RoundUpEntry_transactionId_key`(`transactionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CategorizationRule` (
    `id` VARCHAR(191) NOT NULL,
    `keyword` VARCHAR(191) NOT NULL,
    `conditionType` ENUM('CONTAINS', 'EQUALS', 'STARTS_WITH', 'ENDS_WITH') NOT NULL DEFAULT 'CONTAINS',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `userId` VARCHAR(191) NOT NULL,
    `categoryId` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ImportTemplate` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `mapping` JSON NOT NULL,
    `userId` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Reconciliation` (
    `id` VARCHAR(191) NOT NULL,
    `startDate` DATETIME(3) NULL,
    `endDate` DATETIME(3) NULL,
    `status` ENUM('PROCESSING', 'PENDING_REVIEW', 'COMPLETED', 'FAILED') NOT NULL DEFAULT 'PROCESSING',
    `filePath` VARCHAR(191) NOT NULL,
    `fileType` VARCHAR(191) NOT NULL,
    `totalJobs` INTEGER NULL,
    `completedJobs` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `userId` VARCHAR(191) NOT NULL,
    `accountId` VARCHAR(191) NULL,
    `cardId` VARCHAR(191) NULL,
    `importTemplateId` VARCHAR(191) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ImportedTransaction` (
    `id` VARCHAR(191) NOT NULL,
    `date` DATETIME(3) NOT NULL,
    `amount` DECIMAL(18, 4) NOT NULL,
    `type` ENUM('CREDIT', 'DEBIT') NOT NULL,
    `description` VARCHAR(191) NOT NULL,
    `fitId` VARCHAR(191) NOT NULL,
    `status` ENUM('PENDING', 'SUGGESTED', 'RECONCILED', 'DISCARDED') NOT NULL DEFAULT 'PENDING',
    `reconciliationId` VARCHAR(191) NOT NULL,
    `manualTransactionId` VARCHAR(191) NULL,
    `similarityScore` INTEGER NULL,

    UNIQUE INDEX `ImportedTransaction_fitId_key`(`fitId`),
    UNIQUE INDEX `ImportedTransaction_manualTransactionId_key`(`manualTransactionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AuditLog` (
    `id` VARCHAR(191) NOT NULL,
    `action` VARCHAR(191) NOT NULL,
    `entity` VARCHAR(191) NOT NULL,
    `entityId` VARCHAR(191) NOT NULL,
    `details` JSON NOT NULL,
    `status` ENUM('SUCCESS', 'FAILURE') NOT NULL DEFAULT 'SUCCESS',
    `origin` VARCHAR(191) NOT NULL DEFAULT 'WEB_APP',
    `ipAddress` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `userId` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AiAnalysis` (
    `id` VARCHAR(191) NOT NULL,
    `type` ENUM('HABIT_ANALYSIS', 'OPPORTUNITY_ANALYSIS') NOT NULL,
    `analysisText` TEXT NOT NULL,
    `relevantTransactionIds` TEXT NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `userId` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `UserMission` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `missionId` VARCHAR(191) NOT NULL,
    `acceptedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `progressJson` JSON NULL,
    `completedAt` DATETIME(3) NULL,
    `rewardClaimed` BOOLEAN NOT NULL DEFAULT false,

    UNIQUE INDEX `UserMission_userId_missionId_key`(`userId`, `missionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Item` (
    `id` VARCHAR(191) NOT NULL,
    `key` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `bonusJson` JSON NULL,
    `rarity` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `Item_key_key`(`key`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user_favorite_categories` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `categoryId` VARCHAR(191) NOT NULL,
    `priority` INTEGER NOT NULL DEFAULT 0,

    UNIQUE INDEX `user_favorite_categories_userId_categoryId_key`(`userId`, `categoryId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user_devices` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `deviceId` VARCHAR(191) NOT NULL,
    `deviceName` VARCHAR(191) NULL,
    `platform` VARCHAR(191) NULL,
    `ipAddress` VARCHAR(191) NULL,
    `trusted` BOOLEAN NOT NULL DEFAULT false,
    `lastLoginAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `user_devices_userId_deviceId_key`(`userId`, `deviceId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `security_events` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `type` ENUM('NEW_DEVICE', 'PASSWORD_RESET', 'TWO_FACTOR_CHALLENGE') NOT NULL,
    `message` VARCHAR(191) NOT NULL,
    `metadata` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `security_events_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Boss` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `hp` BIGINT NOT NULL,
    `currentHp` BIGINT NOT NULL,
    `rewardJson` JSON NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT false,
    `startAt` DATETIME(3) NULL,
    `endAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `_TagToTransaction` (
    `A` VARCHAR(191) NOT NULL,
    `B` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `_TagToTransaction_AB_unique`(`A`, `B`),
    INDEX `_TagToTransaction_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
