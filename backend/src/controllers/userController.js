
// src/controllers/userController.js
import pkg from '@prisma/client';
const { PrismaClient } = pkg;
import bcrypt from 'bcryptjs';
import GamificationService from '../services/gamificationService.js';
import crypto from 'crypto';
import EmailService from '../services/emailService.js';
import { decryptValue, encryptValue } from '../utils/fieldEncryption.js';

const prisma = new PrismaClient();

const ALLOWED_GAMIFICATION_MODES = ['FULL', 'LITE', 'OFF'];

const generateTokenPayload = (hoursValid = 1) => {
    const token = crypto.randomBytes(32).toString('hex');
    const hash = crypto.createHash('sha256').update(token).digest('hex');
    const expiresAt = new Date(Date.now() + hoursValid * 60 * 60 * 1000);
    return { token, hash, expiresAt };
};

class UserController {
    async getUser(req, res, next) {
        try {
            const user = await prisma.user.findUnique({
                where: { id: req.user.id },
                select: {
                    id: true,
                    email: true,
                    emailVerified: true,
                    username: true,
                    name: true,
                    age: true,
                    gender: true,
                    avatarUrl: true,
                    firstOpen: true,
                    futureProjectionCount: true,
                    daysUntilDueReminder: true,
                    enableAchievementNotifications: true,
                    enableBudgetNotifications: true,
                    enableLimitAlerts: true,
                    enableUpcomingPaymentNotifications: true,
                    enableOcr: true,
                    ocrProvider: true,
                    enableDailySummary: true,
                    enableBudgetSuggestion: true,
                    enableReconciliationAi: true,
                    enableGoalProjection: true,
                    habilitarDescricaoInteligente: true,
                    dashboardLayout: true,
                    professionalSituation: true,
                    monthlyIncomeRange: true,
                    investmentProfile: true,
                    mainFinancialGoal: true,
                    fixedMonthlyIncome: true,
                    favoriteCategories: true,
                    dashboardPreferences: true,
                    hideFamilyMode: true,
                    hasCompletedTutorial: true,
                    hasCompletedMigration: true,
                    phoneNumber: true,
                    phoneVerified: true,
                    twoFactorEnabled: true,
                    lastSecurityNotificationAt: true,
                    gamificationMode: true,
                    isAdmin: true,
                    level: true,
                    // Correção: Acessar a relação ClanMember para obter o clanId e role
                    clanMemberships: {
                        select: {
                            clanId: true,
                            role: true,
                        }
                    }
                }
            });

            if (!user) {
                return res.status(401).json({ message: 'Usuário não encontrado ou sessão expirada.' });
            }

            const { clanMemberships = [], ...userData } = user;
            const primaryMembership = clanMemberships[0] ?? null;
            const userResponse = {
                ...userData,
                phoneNumber: userData.phoneNumber ? decryptValue(userData.phoneNumber) : null,
                clanMemberships,
                clanMembership: primaryMembership,
                clanId: primaryMembership?.clanId || null,
            };

            res.json(userResponse);
        } catch (error) {
            next(error);
        }
    }

    async updateProfile(req, res, next) {
        const { name, gender, age, avatarUrl, professionalSituation, monthlyIncomeRange, investmentProfile, mainFinancialGoal, fixedMonthlyIncome } = req.body;
        try {
            const updatedUser = await prisma.user.update({
                where: { id: req.user.id },
                data: {
                    name,
                    gender,
                    age: age !== null && age !== undefined ? parseInt(age, 10) : null,
                    avatarUrl,
                    professionalSituation,
                    monthlyIncomeRange,
                    investmentProfile,
                    mainFinancialGoal,
                    fixedMonthlyIncome: fixedMonthlyIncome !== undefined && fixedMonthlyIncome !== null ? parseFloat(fixedMonthlyIncome) : null,
                },
                select: {
                    id: true, email: true, username: true, name: true, age: true, gender: true, avatarUrl: true, futureProjectionCount: true,
                    daysUntilDueReminder: true, enableAchievementNotifications: true, enableBudgetNotifications: true, enableLimitAlerts: true, enableUpcomingPaymentNotifications: true,
                    professionalSituation: true, monthlyIncomeRange: true, investmentProfile: true, mainFinancialGoal: true, fixedMonthlyIncome: true,
                }
            });
            res.json(updatedUser);
        } catch (error) {
            next(error);
        }
    }

    async updatePreferences(req, res, next) {
        const {
            futureProjectionCount,
            daysUntilDueReminder,
            enableAchievementNotifications,
            enableBudgetNotifications,
            enableLimitAlerts,
            enableUpcomingPaymentNotifications,
            enableOcr,
            ocrProvider,
            enableDailySummary,
            enableBudgetSuggestion,
            enableReconciliationAi,
            enableGoalProjection,
            habilitarDescricaoInteligente,
            dashboardLayout,
            favoriteCategoryIds,
            dashboardPreferences,
            hideFamilyMode,
            gamificationMode,
            hasCompletedTutorial,
            hasCompletedMigration,
        } = req.body;
        const userId = req.user.id;

        try {
            const dataToUpdate = {
                daysUntilDueReminder,
                enableAchievementNotifications,
                enableBudgetNotifications,
                enableLimitAlerts,
                enableUpcomingPaymentNotifications,
                enableOcr,
                ocrProvider,
                enableDailySummary,
                enableBudgetSuggestion,
                enableReconciliationAi,
                enableGoalProjection,
                habilitarDescricaoInteligente,
                // Correção: Garante que o layout seja sempre uma string JSON
                dashboardLayout: typeof dashboardLayout === 'object' ? JSON.stringify(dashboardLayout) : dashboardLayout,
            };

            if (typeof hasCompletedTutorial === 'boolean') {
                dataToUpdate.hasCompletedTutorial = hasCompletedTutorial;
            }
            if (typeof hasCompletedMigration === 'boolean') {
                dataToUpdate.hasCompletedMigration = hasCompletedMigration;
            }
            if (typeof hideFamilyMode === 'boolean') {
                dataToUpdate.hideFamilyMode = hideFamilyMode;
            }
            if (dashboardPreferences !== undefined) {
                dataToUpdate.dashboardPreferences = dashboardPreferences;
            }

            if (gamificationMode !== undefined) {
                const upperMode = typeof gamificationMode === 'string' ? gamificationMode.toUpperCase() : gamificationMode;
                if (!ALLOWED_GAMIFICATION_MODES.includes(upperMode)) {
                    return res.status(400).json({ message: 'Modo de gamificação inválido.' });
                }
                dataToUpdate.gamificationMode = upperMode;
            }

            if (futureProjectionCount !== undefined) {
                const count = Number(futureProjectionCount);
                if (isNaN(count) || count < 1 || count > 50) {
                    return res.status(400).json({ message: 'O valor da projeção futura deve ser um número entre 1 e 50.' });
                }
                dataToUpdate.futureProjectionCount = count;
            }


            const updatedUser = await prisma.$transaction(async (tx) => {
                if (Array.isArray(favoriteCategoryIds)) {
                    await tx.userFavoriteCategory.deleteMany({ where: { userId } });
                    if (favoriteCategoryIds.length > 0) {
                        await tx.userFavoriteCategory.createMany({
                            data: favoriteCategoryIds.map((categoryId, index) => ({
                                userId,
                                categoryId,
                                priority: index,
                            })),
                            skipDuplicates: true,
                        });
                    }
                    dataToUpdate.favoriteCategories = favoriteCategoryIds;
                }

                return tx.user.update({
                    where: { id: userId },
                    data: dataToUpdate,
                    select: {
                        id: true,
                        email: true,
                        username: true,
                        name: true,
                        futureProjectionCount: true,
                        daysUntilDueReminder: true,
                        enableAchievementNotifications: true,
                        enableBudgetNotifications: true,
                        enableLimitAlerts: true,
                        enableUpcomingPaymentNotifications: true,
                        enableOcr: true,
                        ocrProvider: true,
                        enableDailySummary: true,
                        enableBudgetSuggestion: true,
                        enableReconciliationAi: true,
                        enableGoalProjection: true,
                        habilitarDescricaoInteligente: true,
                        dashboardLayout: true,
                        favoriteCategories: true,
                        dashboardPreferences: true,
                        gamificationMode: true,
                        hideFamilyMode: true,
                        hasCompletedTutorial: true,
                        hasCompletedMigration: true,
                    },
                });
            });

            res.json(updatedUser);
        } catch (error) {
            next(error);
        }
    }

    async updateAccountInfo(req, res, next) {
        const { email, username } = req.body;
        try {
            const currentUser = await prisma.user.findUnique({ where: { id: req.user.id } });

            const data = { username };
            let emailChanged = false;

            if (email && email !== currentUser.email) {
                data.email = email;
                data.emailVerified = false;
                const verification = generateTokenPayload(24);
                data.emailVerificationToken = verification.hash;
                data.emailVerificationExpires = verification.expiresAt;
                emailChanged = true;

                // Envia o email para o novo endereço
                EmailService.sendEmailVerification(email, verification.token).catch((error) => {
                    console.error('Falha ao enviar e-mail de verificação para novo endereço:', error.message);
                });
            }

            const updatedUser = await prisma.user.update({
                where: { id: req.user.id },
                data,
                select: {
                    id: true, email: true, username: true, name: true, emailVerified: true
                }
            });

            res.json({
                ...updatedUser,
                message: emailChanged
                    ? 'Perfil atualizado. Um link de verificação foi enviado para o novo e-mail.'
                    : 'Perfil atualizado com sucesso.'
            });
        } catch (error) {
            if (error.code === 'P2002') {
                return res.status(409).json({ message: `O ${error.meta.target.includes('email') ? 'email' : 'usuário'} já está em uso.` });
            }
            next(error);
        }
    }

    async changePassword(req, res, next) {
        const { currentPassword, newPassword } = req.body;
        try {
            const user = await prisma.user.findUnique({ where: { id: req.user.id } });
            if (!user) {
                return res.status(404).json({ message: "Usuário não encontrado." });
            }
            const isPasswordCorrect = await bcrypt.compare(currentPassword, user.password);
            if (!isPasswordCorrect) {
                return res.status(401).json({ message: "Senha atual incorreta." });
            }
            const hashedNewPassword = await bcrypt.hash(newPassword, 10);
            await prisma.user.update({
                where: { id: req.user.id },
                data: { password: hashedNewPassword }
            });
            res.json({ message: "Senha alterada com sucesso." });
        } catch (error) {
            next(error);
        }
    }

    async updateSecuritySettings(req, res, next) {
        const userId = req.user.id;
        const { phoneNumber, twoFactorEnabled } = req.body;
        try {
            const existingUser = await prisma.user.findUnique({
                where: { id: userId },
                select: { phoneNumber: true },
            });
            if (!existingUser) {
                return res.status(404).json({ message: 'Usuário não encontrado.' });
            }

            if (twoFactorEnabled === true && !(phoneNumber || existingUser.phoneNumber)) {
                return res.status(400).json({ message: 'Informe um telefone para ativar a verificação em duas etapas.' });
            }

            const data = {};
            if (phoneNumber !== undefined) {
                data.phoneNumber = phoneNumber ? encryptValue(phoneNumber) : null;
                data.phoneVerified = false;
            }
            if (typeof twoFactorEnabled === 'boolean') {
                data.twoFactorEnabled = twoFactorEnabled;
            }

            if (Object.keys(data).length === 0) {
                return res.status(400).json({ message: 'Nenhuma alteração informada.' });
            }

            const updated = await prisma.user.update({
                where: { id: userId },
                data,
                select: {
                    id: true,
                    phoneNumber: true,
                    phoneVerified: true,
                    twoFactorEnabled: true,
                },
            });

            res.json({
                ...updated,
                phoneNumber: updated.phoneNumber ? decryptValue(updated.phoneNumber) : null,
            });
        } catch (error) {
            next(error);
        }
    }

    async registerFcmToken(req, res, next) {
        const { token } = req.body;
        const userId = req.user.id;
        if (!token) {
            return res.status(400).json({ message: 'Token é obrigatório.' });
        }
        try {
            await prisma.user.update({
                where: { id: userId },
                data: { fcmToken: token },
            });
            res.status(200).json({ message: 'Token FCM registrado com sucesso.' });
        } catch (error) {
            next(error);
        }
    }

    async completeOnboarding(req, res, next) {
        const userId = req.user.id;
        try {
            await prisma.user.update({
                where: { id: userId },
                data: { firstOpen: false },
            });
            res.status(200).json({ message: 'Onboarding concluído com sucesso.' });
        } catch (error) {
            next(error);
        }
    }

    // Nova rota para destacar/remover destaque de uma conquista
    async toggleAchievementHighlight(req, res, next) {
        const userId = req.user.id;
        const { achievementId } = req.params;
        const { destacada } = req.body;

        try {
            const unlockedAchievement = await prisma.unlockedAchievement.findFirst({
                where: { userId, achievementId }
            });

            if (!unlockedAchievement) {
                return res.status(404).json({ message: 'Conquista não desbloqueada pelo usuário.' });
            }

            // Lógica para limitar o número de destaques
            if (destacada === true) {
                const highlightedCount = await prisma.unlockedAchievement.count({
                    where: { userId, destacada: true }
                });
                if (highlightedCount >= 2) {
                    return res.status(400).json({ message: 'Você só pode destacar no máximo 2 conquistas.' });
                }
            }

            const updated = await prisma.unlockedAchievement.update({
                where: { id: unlockedAchievement.id },
                data: { destacada },
            });

            res.json(updated);
        } catch (error) {
            next(error);
        }
    }

    // Nova rota para buscar as "ruínas" de um usuário
    async getLegacyRuins(req, res, next) {
        const userId = req.user.id;
        try {
            const ruins = await prisma.legacyRuin.findMany({
                where: { userId },
                orderBy: { endDate: 'desc' },
            });
            res.json(ruins);
        } catch (error) {
            next(error);
        }
    }

    async lookupUser(req, res, next) {
        const identifier = String(req.query.identifier || '').trim();
        if (!identifier) {
            return res.status(400).json({ message: 'Informe o email, usuário ou ID do convidado.' });
        }
        try {
            const user = await prisma.user.findFirst({
                where: {
                    OR: [
                        { id: identifier },
                        { email: identifier },
                        { username: identifier },
                    ],
                },
                select: {
                    id: true,
                    email: true,
                    username: true,
                    name: true,
                    avatarUrl: true,
                },
            });
            if (!user) {
                return res.status(404).json({ message: 'Usuário não encontrado.' });
            }
            res.json(user);
        } catch (error) {
            next(error);
        }
    }

    async getBackup(req, res, next) {
        const userId = req.user.id;

        try {
            const BackupService = (await import('../services/backupService.js')).default;
            const backup = await BackupService.createBackup(userId);

            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Content-Disposition', 'attachment; filename=dexpesas_backup.json');
            res.json(backup);
        } catch (error) {
            next(error);
        }
    }

    async restoreBackup(req, res, next) {
        const userId = req.user.id;
        const { strategy, tablesToSkip, ...backupData } = req.body;

        try {
            const BackupService = (await import('../services/backupService.js')).default;

            // Validate backup
            if (!backupData.version) {
                return res.status(400).json({ message: 'Arquivo de backup inválido' });
            }

            // If no strategy provided, check for conflicts first
            if (!strategy) {
                const { hasConflicts, counts } = await BackupService.checkConflicts(userId);
                if (hasConflicts) {
                    return res.status(409).json({
                        message: 'Dados existentes encontrados',
                        conflicts: counts,
                        requiresConfirmation: true
                    });
                }
            }

            const result = await BackupService.restoreBackup(userId, backupData, {
                strategy: strategy || 'replace', // Default to replace if no conflicts or explicit strategy
                tablesToSkip
            });
            res.json(result);
        } catch (error) {
            if (error.message === 'Versão de backup incompatível') {
                return res.status(400).json({ message: error.message });
            }
            next(error);
        }
    }
}

export default new UserController();
