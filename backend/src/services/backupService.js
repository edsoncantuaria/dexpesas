// backend/src/services/backupService.js
import pkg from '@prisma/client';
const { PrismaClient } = pkg;

const prisma = new PrismaClient();

class BackupService {
    /**
     * Create complete backup of user data
     */
    async createBackup(userId) {
        const backup = {
            version: '1.0',
            exportDate: new Date().toISOString(),
            user: await this.getUserData(userId),
            accounts: await prisma.account.findMany({
                where: { userId },
                include: { transactions: true }
            }),
            cards: await prisma.card.findMany({ where: { userId } }),
            transactions: await prisma.transaction.findMany({
                where: { userId },
                include: { tags: true }
            }),
            categories: await prisma.category.findMany({ where: { userId } }),
            budgets: await prisma.budget.findMany({ where: { userId } }),
            goals: await prisma.goal.findMany({ where: { userId } }),
            automations: await prisma.automation.findMany({ where: { userId } }),
            categorizationRules: await prisma.categorizationRule.findMany({ where: { userId } }),
            tags: await prisma.tag.findMany({ where: { userId } }),
            categoryClassifications: await prisma.categoryClassification.findMany({ where: { userId } })
        };

        return backup;
    }

    /**
     * Get user data (excluding sensitive fields)
     */
    async getUserData(userId) {
        const user = await prisma.user.findUnique({ where: { id: userId } });

        // Exclude sensitive fields
        const { password, pushSubscription, twoFactorSecret, resetPasswordToken, emailVerificationToken, ...safeUserData } = user;

        return safeUserData;
    }

    /**
     * Restore backup (full replace)
     */
    async restoreBackup(userId, backupData) {
        // Validate version
        if (backupData.version !== '1.0') {
            throw new Error('Versão de backup incompatível');
        }

        await prisma.$transaction(async (tx) => {
            // 1. Delete existing data (in reverse dependency order)
            await tx.categorizationRule.deleteMany({ where: { userId } });
            await tx.automation.deleteMany({ where: { userId } });
            await tx.budget.deleteMany({ where: { userId } });
            await tx.goal.deleteMany({ where: { userId } });
            await tx.categoryClassification.deleteMany({ where: { userId } });

            // Delete transactions and their associations
            await tx.transaction.deleteMany({ where: { userId } });

            await tx.card.deleteMany({ where: { userId } });
            await tx.account.deleteMany({ where: { userId } });
            await tx.category.deleteMany({ where: { userId } });
            await tx.tag.deleteMany({ where: { userId } });

            // 2. Restore data

            // Categories first (they're referenced by transactions)
            if (backupData.categories?.length > 0) {
                for (const category of backupData.categories) {
                    const { userId: _, ...categoryData } = category;
                    await tx.category.create({
                        data: { ...categoryData, userId }
                    });
                }
            }

            // Tags
            if (backupData.tags?.length > 0) {
                for (const tag of backupData.tags) {
                    const { userId: _, ...tagData } = tag;
                    await tx.tag.create({
                        data: { ...tagData, userId }
                    });
                }
            }

            // Accounts
            if (backupData.accounts?.length > 0) {
                for (const account of backupData.accounts) {
                    const { userId: _, transactions, ...accountData } = account;
                    await tx.account.create({
                        data: { ...accountData, userId }
                    });
                }
            }

            // Cards
            if (backupData.cards?.length > 0) {
                for (const card of backupData.cards) {
                    const { userId: _, ...cardData } = card;
                    await tx.card.create({
                        data: { ...cardData, userId }
                    });
                }
            }

            // Transactions (complex because of tags)
            if (backupData.transactions?.length > 0) {
                for (const transaction of backupData.transactions) {
                    const { userId: _, tags, ...transactionData } = transaction;

                    // Get tag connections
                    const tagConnections = tags?.map(t => ({ id: t.id })) || [];

                    await tx.transaction.create({
                        data: {
                            ...transactionData,
                            userId,
                            tags: tagConnections.length > 0 ? {
                                connect: tagConnections
                            } : undefined
                        }
                    });
                }
            }

            // Budgets
            if (backupData.budgets?.length > 0) {
                for (const budget of backupData.budgets) {
                    const { userId: _, ...budgetData } = budget;
                    await tx.budget.create({
                        data: { ...budgetData, userId }
                    });
                }
            }

            // Goals
            if (backupData.goals?.length > 0) {
                for (const goal of backupData.goals) {
                    const { userId: _, ...goalData } = goal;
                    await tx.goal.create({
                        data: { ...goalData, userId }
                    });
                }
            }

            // Automations
            if (backupData.automations?.length > 0) {
                for (const automation of backupData.automations) {
                    const { userId: _, ...autoData } = automation;
                    await tx.automation.create({
                        data: { ...autoData, userId }
                    });
                }
            }

            // Categorization Rules
            if (backupData.categorizationRules?.length > 0) {
                for (const rule of backupData.categorizationRules) {
                    const { userId: _, ...ruleData } = rule;
                    await tx.categorizationRule.create({
                        data: { ...ruleData, userId }
                    });
                }
            }

            // Category Classifications
            if (backupData.categoryClassifications?.length > 0) {
                for (const classification of backupData.categoryClassifications) {
                    const { userId: _, ...classData } = classification;
                    await tx.categoryClassification.create({
                        data: { ...classData, userId }
                    });
                }
            }
        });

        return { success: true, message: 'Backup restaurado com sucesso' };
    }

    /**
     * Get backup summary (for preview)
     */
    getBackupSummary(backupData) {
        return {
            version: backupData.version,
            exportDate: backupData.exportDate,
            counts: {
                accounts: backupData.accounts?.length || 0,
                cards: backupData.cards?.length || 0,
                transactions: backupData.transactions?.length || 0,
                categories: backupData.categories?.length || 0,
                budgets: backupData.budgets?.length || 0,
                goals: backupData.goals?.length || 0,
                automations: backupData.automations?.length || 0,
                rules: backupData.categorizationRules?.length || 0,
                tags: backupData.tags?.length || 0
            }
        };
    }
}

export default new BackupService();
