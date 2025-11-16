
// src/controllers/userController.js
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import GamificationService from '../services/gamificationService.js';

const prisma = new PrismaClient();

class UserController {
    async getUser(req, res, next) {
        try {
            const user = await prisma.user.findUnique({
                where: { id: req.user.id },
                select: {
                    id: true,
                    email: true,
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
        const { name, gender, age, avatarUrl, professionalSituation, monthlyIncomeRange, investmentProfile, mainFinancialGoal } = req.body;
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
                },
                 select: { 
                    id: true, email: true, username: true, name: true, age: true, gender: true, avatarUrl: true, futureProjectionCount: true,
                    daysUntilDueReminder: true, enableAchievementNotifications: true, enableBudgetNotifications: true, enableLimitAlerts: true, enableUpcomingPaymentNotifications: true,
                    professionalSituation: true, monthlyIncomeRange: true, investmentProfile: true, mainFinancialGoal: true,
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
            enableDailySummary,
            enableBudgetSuggestion,
            enableReconciliationAi,
            enableGoalProjection,
            habilitarDescricaoInteligente,
            dashboardLayout
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
                enableDailySummary,
                enableBudgetSuggestion,
                enableReconciliationAi,
                enableGoalProjection,
                habilitarDescricaoInteligente,
                // Correção: Garante que o layout seja sempre uma string JSON
                dashboardLayout: typeof dashboardLayout === 'object' ? JSON.stringify(dashboardLayout) : dashboardLayout,
            };

            if (futureProjectionCount !== undefined) {
                const count = Number(futureProjectionCount);
                 if (isNaN(count) || count < 1 || count > 50) {
                    return res.status(400).json({ message: 'O valor da projeção futura deve ser um número entre 1 e 50.' });
                }
                dataToUpdate.futureProjectionCount = count;
            }


            const updatedUser = await prisma.user.update({
                where: { id: userId },
                data: dataToUpdate,
                 select: {
                    id: true, email: true, username: true, name: true, futureProjectionCount: true,
                    daysUntilDueReminder: true, enableAchievementNotifications: true, enableBudgetNotifications: true, enableLimitAlerts: true, enableUpcomingPaymentNotifications: true, enableOcr: true, enableDailySummary: true, enableBudgetSuggestion: true, enableReconciliationAi: true, enableGoalProjection: true, habilitarDescricaoInteligente: true, dashboardLayout: true
                }
            });

            res.json(updatedUser);
        } catch(error) {
            next(error);
        }
    }

    async updateAccountInfo(req, res, next) {
        const { email, username } = req.body;
        try {
            const updatedUser = await prisma.user.update({
                where: { id: req.user.id },
                data: { email, username },
                select: {
                    id: true, email: true, username: true, name: true
                }
            });
            res.json(updatedUser);
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
}

export default new UserController();

    
