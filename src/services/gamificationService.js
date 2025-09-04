// backend/src/services/gamificationService.js
import { PrismaClient } from '@prisma/client';
import { differenceInDays, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import NotificationService from './notificationService.js';
import AuditService from './auditService.js';

const prisma = new PrismaClient();

// Definição das conquistas e seus critérios
const achievements = {
    'BUDGET_CREATED': {
        id: 'clz7w4h210002or01g2d3h4j5', // ID Fixo
        name: 'Planejador Mestre',
        message: 'Você definiu seu primeiro orçamento. Um grande passo para o controle financeiro!',
        xp: 100,
        check: async (tx, userId) => {
            const budgetCount = await tx.budget.count({ where: { userId } });
            return budgetCount >= 1;
        }
    },
    'TRANSACTION_MASTER': {
        id: 'clz7w4h210003or01h8g9i0k1', // ID Fixo
        name: 'Mestre dos Gastos',
        message: 'Você categorizou 50 transações e está no caminho certo para o domínio financeiro!',
        xp: 150,
        check: async (tx, userId) => {
            const transactionCount = await tx.transaction.count({ where: { userId } });
            return transactionCount >= 50;
        }
    },
    'GOAL_COMPLETED': {
        id: 'clz7w4h200001or01a2b3c4d5', // ID Fixo
        name: 'Conquistador de Metas',
        message: 'Você alcançou uma de suas metas! Continue assim!',
        xp: 250,
        check: async (tx, userId) => {
            const completedGoals = await tx.goal.count({ where: { userId, status: 'COMPLETED' } });
            return completedGoals >= 1;
        }
    },
    'PAYMENT_ON_TIME': {
         id: 'clz8w5i320004or01k9lmnpqr', // ID Fixo
         name: 'Pontualidade em Pessoa',
         message: 'Você pagou uma conta em dia! A disciplina é o caminho.',
         xp: 20,
         check: async (tx, userId, transactionId) => {
            if (!transactionId) return false;
            const transaction = await tx.transaction.findUnique({ where: { id: transactionId } });
            // Considera "em dia" se for pago na data de vencimento ou antes.
            return transaction && !transaction.pago && new Date() <= new Date(transaction.data);
         }
    }
};


// Definição dos eventos de gamificação que concedem XP
const gamificationEvents = {
    TRANSACTION_CREATED: { xp: 5, description: 'Registrou uma nova transação.' },
    BUDGET_CREATED: { xp: 10, description: 'Criou um novo orçamento.' },
    GOAL_CONTRIBUTION: { xp: 15, description: 'Contribuiu para uma meta.' },
    GOAL_COMPLETED: { xp: 250, description: 'Completou uma meta financeira.' },
    BILL_PAID: { xp: 10, description: 'Pagou uma fatura.' }, // XP proporcional ao valor será aplicado no trigger
    // Penalidades
    PAYMENT_DUE: { xp: -75, description: 'Deixou uma conta vencer.' },
    BUDGET_EXCEEDED: { xp: -50, description: 'Estourou o limite de um orçamento.' },
    VICE_SPENDING: { xp: -15, description: 'Gasto em uma categoria de "Vício".' }
};


// Fórmula de XP para o próximo nível
const xpNeeded = (level) => Math.floor(100 * Math.pow(level, 1.15));

/**
 * Nova árvore de classes.
 */
const getHeroClass = (level, attributes) => {
    const sortedAttributes = Object.entries(attributes)
        .sort(([, a], [, b]) => b - a)
        .map(([key]) => key);
    
    const [highest, second, , lowest] = sortedAttributes;
    const tier = Math.floor((level - 1) / 6); // 0, 1, 2, 3+

    const archetypes = {
        poder: (highest === 'Forca' && second === 'Resistencia') || (highest === 'Resistencia' && second === 'Forca'),
        disciplina: (highest === 'Resistencia' && second === 'Sabedoria') || (highest === 'Sabedoria' && second === 'Resistencia'),
        estrategia: (highest === 'Sabedoria' && second === 'Forca') || (highest === 'Forca' && second === 'Sabedoria'),
        audacia: (highest === 'Forca' && second === 'Sorte') || (highest === 'Sorte' && second === 'Forca'),
        persistencia: (highest === 'Sabedoria' && second === 'Sorte') || (highest === 'Sorte' && second === 'Sabedoria'),
    };
    
    // Classes de Tier 0 (Nível 1-5)
    if (tier === 0) {
        if (archetypes.poder) return 'Bruto Financeiro';
        if (archetypes.disciplina) return 'Guardião Iniciante';
        if (archetypes.estrategia) return 'Arquiteto de Planos';
        if (archetypes.audacia) return 'Mercador Ousado';
        if (archetypes.persistencia) return 'Escriba Diligente';
        return 'Aventureiro Novato';
    }
    
    // Classes de Tier 1 (Nível 6-11)
    if (tier === 1) {
        if (archetypes.poder) return 'Barão da Renda';
        if (archetypes.disciplina) return 'Paladino do Lucro';
        if (archetypes.estrategia) return 'Mestre de Guilda';
        if (archetypes.audacia) return 'Corsário de Crédito';
        if (archetypes.persistencia) return 'Estratega de Dívidas';
        return 'Explorador de Mercados';
    }

    // Classes de Tier 2 (Nível 12-17)
    if (tier === 2) {
        if (archetypes.poder) return 'Magnata Industrial';
        if (archetypes.disciplina) return 'Ascendente Prudente';
        if (archetypes.estrategia) return 'Regente Visionário';
        if (archetypes.audacia) return 'Caçador de Dívidas';
        if (archetypes.persistencia) return 'Oráculo da Oportunidade';
        return 'Navegador de Capital';
    }
    
    // Classes de Tier 3 (Nível 18+)
    if (tier >= 3) {
        if (archetypes.poder) return 'Soberano Imperial';
        if (archetypes.disciplina) return 'Avatar da Abundância';
        if (archetypes.estrategia) return 'Arconte do Tesouro';
        if (archetypes.audacia) return 'Lorde do Risco';
        if (archetypes.persistencia) return 'Eremita Iluminado';
        return 'Lenda Viva';
    }

    return 'Aventureiro';
};


class GamificationService {

     /**
     * Processa a mudança de XP de um usuário, lidando com level-ups.
     * @param {Prisma.TransactionClient} tx - Instância transacional do Prisma.
     * @param {string} userId - O ID do usuário.
     * @param {number} deltaXp - A quantidade de XP a ser adicionada (pode ser negativa).
     */
    static async processXpChange(tx, userId, deltaXp) {
        const user = await tx.user.findUnique({ 
            where: { id: userId },
            include: { inventoryItems: { where: { equipped: true }, include: { item: true }}}
        });
        if (!user) return;
        
        // Aplica bônus de itens e eventos
        let finalXp = deltaXp;
        let xpMultiplier = 1.0;

        // 1. Multiplicador de Itens
        user.inventoryItems.forEach(userItem => {
            const bonus = userItem.item.bonusJson || {};
            if (bonus.xpMultiplier) {
                xpMultiplier *= bonus.xpMultiplier;
            }
        });
        
        // 2. Multiplicador de Eventos
        const activeEvent = await tx.gameEvent.findFirst({
            where: {
                type: 'XP_MULTIPLIER',
                isActive: true,
                startAt: { lte: new Date() },
                endAt: { gte: new Date() }
            }
        });

        if (activeEvent && activeEvent.multiplier) {
            xpMultiplier *= activeEvent.multiplier;
        }
        
        finalXp = Math.floor(deltaXp * xpMultiplier);

        let currentXp = user.xp + finalXp;
        let currentLevel = user.level;
        let needed = xpNeeded(currentLevel);

        while (currentXp >= needed) {
            currentXp -= needed;
            currentLevel++;
            needed = xpNeeded(currentLevel);
            
            await NotificationService.createNotification(tx, user, {
                title: 'Level Up!',
                message: `Parabéns! Você alcançou o Nível ${currentLevel}!`,
                type: 'ACHIEVEMENT_UNLOCKED',
            });
            await AuditService.log({
                userId,
                action: 'LEVEL_UP',
                entity: 'USER',
                entityId: userId,
                details: { oldLevel: user.level, newLevel: currentLevel }
            });
        }
        
        await tx.user.update({
            where: { id: userId },
            data: {
                level: currentLevel,
                xp: currentXp,
            }
        });
    }

     /**
     * Verifica e concede conquistas a um usuário com base em uma ação gatilho.
     * @param {PrismaClient | Prisma.TransactionClient} tx - Instância do Prisma.
     * @param {string} userId - O ID do usuário.
     * @param {string} trigger - A ação que disparou a verificação (ex: 'BUDGET_CREATED').
     */
    static async checkAndAwardAchievements(tx, userId, trigger, entityId) {
        const user = await tx.user.findUnique({ where: { id: userId } });
        if (!user || !user.enableAchievementNotifications) return;
        
        const achievementKey = Object.keys(achievements).find(key => key.startsWith(trigger.split('_')[0]));
        if (!achievementKey) return;
        
        const achievement = achievements[achievementKey];
            
        const existingUnlock = await tx.unlockedAchievement.findUnique({
            where: { userId_achievementId: { userId, achievementId: achievement.id } }
        });
        if (existingUnlock) return;

        if (await achievement.check(tx, userId, entityId)) {
            await tx.unlockedAchievement.create({
                data: { userId, achievementId: achievement.id }
            });
            
            await this.processXpChange(tx, userId, achievement.xp);

            await NotificationService.createNotification(tx, user, {
                title: `Conquista Desbloqueada: ${achievement.name}!`,
                message: achievement.message,
                type: 'ACHIEVEMENT_UNLOCKED'
            });
        }
    }
    
    /**
     * Aplica uma recompensa ou penalidade de XP para um evento específico.
     * @param {Prisma.TransactionClient} tx - Instância transacional do Prisma.
     * @param {string} userId - ID do usuário.
     * @param {keyof typeof gamificationEvents} eventType - O tipo de evento.
     * @param {object} [details] - Detalhes adicionais, como o valor da transação.
     */
    static async triggerXpEvent(tx, userId, eventType, details = {}) {
        const event = gamificationEvents[eventType];
        if (!event) return;

        let xpToAward = event.xp;

        // Lógica de XP proporcional ao valor para evitar farming
        if (['BILL_PAID', 'GOAL_CONTRIBUTION', 'TRANSACTION_CREATED'].includes(eventType) && details.amount) {
            xpToAward = Math.floor(Math.sqrt(details.amount / 10)); // Usa raiz quadrada para normalizar
        }

        if (xpToAward === 0) return;

        console.log(`✨ Evento de Gamificação: ${eventType} para usuário ${userId}. XP: ${xpToAward}`);
        await this.processXpChange(tx, userId, xpToAward);
    }

    
     /**
     * Calcula todos os atributos de gamificação para um usuário.
     * Esta função é projetada para ser chamada sob demanda para obter os dados mais recentes.
     * @param {string} userId - O ID do usuário.
     * @returns {Promise<object>} Um objeto com todos os atributos calculados.
     */
    static async calculateAllAttributes(userId) {
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) return {};

        const threeMonthsAgo = subMonths(new Date(), 3);
        const yesterday = endOfMonth(subMonths(new Date(), 1));

        const [transactions, accounts, budgets, debtsCategory] = await Promise.all([
            prisma.transaction.findMany({
                where: { userId, pago: true, data: { gte: threeMonthsAgo } },
                include: { category: true },
            }),
            prisma.account.findMany({
                where: { userId },
                include: { transactions: { where: { pago: true } } },
            }),
            prisma.budget.findMany({
                where: { userId, month: { lte: yesterday.toISOString().slice(0, 7) } },
            }),
            prisma.category.findUnique({ where: { nome: 'DividasEEmprestimos' }})
        ]);
        
        const RENDA_MEDIA_POPULACAO = 2800; 
        const monthlyIncome = transactions
            .filter(t => t.tipo === 'receita' && t.category?.nome === 'Salario')
            .reduce((sum, t) => sum + Number(t.valor), 0) / 3;
        
        const strength = monthlyIncome > 0 ? (monthlyIncome / RENDA_MEDIA_POPULACAO) * 100 : 0;
        
        const totalReserve = accounts
            .filter(a => ['poupanca', 'investimento'].includes(a.tipo))
            .reduce((sum, acc) => {
                 const accountBalance = Number(acc.saldoInicial) + acc.transactions.reduce((s, t) => s + (t.tipo === 'receita' ? Number(t.valor) : -Number(t.valor)), 0);
                 return sum + accountBalance;
            }, 0);
        
        const monthlyExpenses = transactions
            .filter(t => t.tipo === 'despesa')
            .reduce((sum, t) => sum + Number(t.valor), 0) / 3;

        const resilience = monthlyExpenses > 0 ? (totalReserve / monthlyExpenses) * 10 : 0;
        
        let completedBudgets = 0;
        if (budgets.length > 0) {
            const budgetIds = budgets.map(b => b.id);
            const expensesByBudgetMonth = await prisma.transaction.groupBy({
                by: ['categoryId'],
                _sum: { valor: true },
                where: {
                    userId,
                    pago: true,
                    tipo: 'despesa',
                    categoryId: { in: budgets.map(b => b.categoryId) },
                    data: { lte: yesterday }
                }
            });
            const expensesMap = new Map(expensesByBudgetMonth.map(e => [e.categoryId, e._sum.valor]));
            
            budgets.forEach(budget => {
                const spent = expensesMap.get(budget.categoryId) || 0;
                if (Number(spent) <= Number(budget.limit)) {
                    completedBudgets++;
                }
            });
        }
        const wisdom = budgets.length > 0 ? (completedBudgets / budgets.length) * 100 : 0;
        
        let luck = 50;
        if (debtsCategory) {
            const allDebts = await prisma.transaction.findMany({ where: { userId, categoryId: debtsCategory.id, tipo: 'despesa' }});
            if (allDebts.length > 0) {
                const paidDebtsCount = allDebts.filter(d => d.pago).length;
                luck = (paidDebtsCount / allDebts.length) * 100;
            }
        }
        
        const attributes = {
            Forca: parseFloat(strength.toFixed(1)),
            Resistencia: parseFloat(resilience.toFixed(1)),
            Sabedoria: parseFloat(wisdom.toFixed(1)),
            Sorte: parseFloat(luck.toFixed(1)),
        };

        const heroClass = getHeroClass(user.level, attributes);

        return {
            ...attributes,
            heroClass,
            updatedAt: new Date().toISOString(),
        };
    }
    
    static calculateGoalProjection(goal) {
        if (goal.status === 'COMPLETED' || Number(goal.currentAmount) >= Number(goal.targetAmount)) {
            return null;
        }

        if (goal.contributions.length < 2) {
            return null;
        }

        const sortedContributions = goal.contributions.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        const firstDate = new Date(sortedContributions[0].date);
        const lastDate = new Date(sortedContributions[sortedContributions.length - 1].date);
        
        const monthsElapsed = Math.max(1, differenceInDays(lastDate, firstDate) / 30.44);
        const totalContributed = sortedContributions.reduce((sum, c) => sum + Number(c.amount), 0);
        const averagePerMonth = totalContributed / monthsElapsed;
        
        if (averagePerMonth <= 0) return null;

        const remainingAmount = Number(goal.targetAmount) - Number(goal.currentAmount);
        const monthsToComplete = Math.ceil(remainingAmount / averagePerMonth);

        return addMonths(new Date(), monthsToComplete);
    }
    
    static async checkMissionProgress(tx, userId, triggerType, payload) {
        const userMissions = await tx.userMission.findMany({
            where: {
                userId,
                completedAt: null,
            },
            include: { mission: true },
        });

        for (const userMission of userMissions) {
            const { mission } = userMission;
            const triggerSpec = mission.triggerSpec || {};
            
            if (mission.scope === 'GUILD') {
                // Lógica de Missão de Guilda
                // (a ser implementada)
            } else {
                // Lógica de Missão de Usuário
                 if (triggerSpec.type !== triggerType) continue;

                if (triggerSpec.type === 'TRANSACTION_CREATED') {
                    let progress = userMission.progressJson || { count: 0 };
                    progress.count = (progress.count || 0) + 1;

                    if (progress.count >= triggerSpec.count) {
                        await this.completeUserMission(tx, userId, userMission, progress);
                    } else {
                        await tx.userMission.update({
                            where: { id: userMission.id },
                            data: { progressJson: progress },
                        });
                    }
                }
            }
        }
    }
    
    static async completeUserMission(tx, userId, userMission, finalProgress) {
        console.log(`Missão "${userMission.mission.title}" completada por ${userId}!`);
        await this.processXpChange(tx, userId, userMission.mission.xpReward);
        if (userMission.mission.itemRewardId) {
            const existingItem = await tx.userItem.findUnique({
                where: { userId_itemId: { userId, itemId: userMission.mission.itemRewardId } }
            });
            if (existingItem) {
                await tx.userItem.update({
                    where: { id: existingItem.id }, data: { quantity: { increment: 1 } }
                });
            } else {
                await tx.userItem.create({ data: { userId, itemId: userMission.mission.itemRewardId, quantity: 1 } });
            }
        }
        const finishedMission = await tx.userMission.update({
            where: { id: userMission.id },
            data: { 
                progressJson: finalProgress,
                completedAt: new Date(),
                rewardClaimed: true,
            },
        });
        await AuditService.log({
            userId, action: 'COMPLETE_MISSION', entity: 'USER_MISSION', entityId: finishedMission.id,
            details: { missionTitle: userMission.mission.title, xpReward: userMission.mission.xpReward },
        });
    }

    static async dealDamageToBoss(tx, userId, baseDamage) {
        const activeBoss = await tx.boss.findFirst({ where: { isActive: true } });
        if (!activeBoss) return;

        const user = await tx.user.findUnique({
            where: { id: userId },
            include: { inventoryItems: { where: { equipped: true }, include: { item: true }}}
        });
        if (!user) return;
        
        let damageMultiplier = 1.0;
        user.inventoryItems.forEach(userItem => {
            const bonus = userItem.item.bonusJson || {};
            if (bonus.damageMultiplier) {
                damageMultiplier *= bonus.damageMultiplier;
            }
        });

        const userAttributes = await this.calculateAllAttributes(userId);
        const strength = userAttributes.Forca || 0;
        const damage = Math.floor(baseDamage * (strength / 100) * damageMultiplier);
        
        if (damage <= 0) return;

        const updatedBoss = await tx.boss.update({
            where: { id: activeBoss.id }, data: { currentHp: { decrement: damage } },
        });
        
        console.log(`⚔️ Usuário ${userId} causou ${damage} de dano ao chefe ${activeBoss.name}. HP restante: ${updatedBoss.currentHp}`);
        await AuditService.log({
            userId, action: 'BOSS_DAMAGE', entity: 'BOSS', entityId: activeBoss.id,
            details: { damage, baseDamage, strength, bossName: activeBoss.name },
        });

        if (updatedBoss.currentHp <= 0) {
            await tx.boss.update({ where: { id: activeBoss.id }, data: { isActive: false, currentHp: 0 } });
            await AuditService.log({
                userId: 'SYSTEM', action: 'BOSS_DEFEATED', entity: 'BOSS', entityId: activeBoss.id,
                details: { bossName: activeBoss.name, defeatedBy: userId },
            });
            console.log(`☠️ Chefe ${activeBoss.name} foi derrotado!`);
            await this.distributeBossRewards(tx, activeBoss);
        }
    }
    
    static async distributeBossRewards(tx, boss) {
        console.log(`🏆 Distribuindo recompensas para a derrota do chefe ${boss.name}`);
        const damageLogs = await tx.auditLog.findMany({ where: { entity: 'BOSS', entityId: boss.id, action: 'BOSS_DAMAGE' }});
        if (damageLogs.length === 0) return;

        const totalDamage = damageLogs.reduce((sum, log) => sum + (log.details.damage || 0), 0);
        const userContributions = {};
        damageLogs.forEach(log => {
            const userId = log.userId;
            if (!userContributions[userId]) userContributions[userId] = 0;
            userContributions[userId] += log.details.damage || 0;
        });
        
        const rewards = boss.rewardJson || {};
        
        for (const userId in userContributions) {
            const user = await tx.user.findUnique({ where: { id: userId } });
            if (!user) continue;

            const userDamage = userContributions[userId];
            const contributionPercentage = totalDamage > 0 ? userDamage / totalDamage : 0;
            let rewardMessage = `Você recebeu as seguintes recompensas por derrotar ${boss.name}:\n`;

            if (rewards.xp) {
                const xpReward = Math.floor(rewards.xp * contributionPercentage);
                await this.processXpChange(tx, userId, xpReward);
                rewardMessage += `- ${xpReward} XP\n`;
            }

            if (rewards.items && Array.isArray(rewards.items)) {
                for (const itemReward of rewards.items) {
                    const { itemId, qty } = itemReward;
                    const existingItem = await tx.userItem.findFirst({ where: { userId, itemId }});
                    if (existingItem) await tx.userItem.update({ where: { id: existingItem.id }, data: { quantity: { increment: qty } } });
                    else await tx.userItem.create({ data: { userId, itemId, quantity: qty }});
                    const itemDetails = await tx.item.findUnique({ where: { id: itemId }});
                    rewardMessage += `- ${qty}x ${itemDetails?.name || 'Item Raro'}\n`;
                }
            }
            
            await NotificationService.createNotification(tx, user, {
                title: "Recompensa de Chefe!", message: rewardMessage, type: 'ACHIEVEMENT_UNLOCKED'
            });
        }
        console.log("✅ Recompensas distribuídas.");
    }
}

export default GamificationService;
