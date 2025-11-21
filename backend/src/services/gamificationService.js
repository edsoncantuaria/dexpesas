
// backend/src/services/gamificationService.js
import pkg from '@prisma/client';
import { differenceInDays, subMonths, startOfMonth, endOfMonth, startOfDay, startOfWeek } from 'date-fns';
import NotificationService from './notificationService.js';
import AuditService from './auditService.js';

const { PrismaClient } = pkg;
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
// Definição dos eventos de gamificação que concedem XP
const gamificationEvents = {
    TRANSACTION_CREATED: { xp: 15, description: 'Registrou uma nova transação.' },
    BUDGET_CREATED: { xp: 50, description: 'Criou um novo orçamento.' },
    GOAL_CONTRIBUTION: { xp: 30, description: 'Contribuiu para uma meta.' },
    GOAL_COMPLETED: { xp: 500, description: 'Completou uma meta financeira.' },
    BILL_PAID: { xp: 25, description: 'Pagou uma fatura.' },
    BILL_UNPAID: { xp: -25, description: 'Desmarcou um pagamento.' },
    // Penalidades
    PAYMENT_DUE: { xp: -100, description: 'Deixou uma conta vencer.' },
    BUDGET_EXCEEDED: { xp: -50, description: 'Estourou o limite de um orçamento.' },
    VICE_SPENDING: { xp: -20, description: 'Gasto em uma categoria de "Vício".' },
    GUILD_CONTRIBUTION: { xp: 40, description: 'Contribuiu para o banco da família.', limit: { period: 'daily', max: 3 } },
    GUILD_MISSION_COMPLETED: { xp: 150, description: 'Completou uma missão cooperativa.', limit: { period: 'weekly', max: 2 } },
    RECONCILIATION_STREAK: { xp: 60, description: 'Manteve a rotina de reconciliação.', limit: { period: 'daily', max: 1 } },
    DAILY_CHECKIN: { xp: 20, description: 'Realizou o check-in diário.', limit: { period: 'daily', max: 1 } },
    INVESTMENT_PLAN_STREAK: { xp: 100, description: 'Manteve o plano de investimentos por 3 meses seguidos.', limit: { period: 'monthly', max: 1 } },
};

const WEEKLY_XP_CAP = 1000;


// Fórmula de XP para o próximo nível
const xpNeeded = (level) => Math.floor(100 * Math.pow(level, 1.15));
export const getXpNeededForLevel = xpNeeded;

/**
 * Nova árvore de classes.
 */
/**
 * Sistema de classes baseado em padrões de gasto.
 * Reflete o equilíbrio e especialização dos atributos.
 */
const getHeroClass = (attributes) => {
    const { Forca, Resistencia, Sabedoria, Sorte } = attributes;

    // Calcula médias e dominância
    const total = Forca + Resistencia + Sabedoria + Sorte;
    const average = total / 4;
    const highest = Math.max(Forca, Resistencia, Sabedoria, Sorte);
    const lowest = Math.min(Forca, Resistencia, Sabedoria, Sorte);
    const balance = highest - lowest; // Quanto maior, mais desequilibrado

    // Identifica atributo dominante
    const dominant =
        Forca === highest ? 'Forca' :
            Resistencia === highest ? 'Resistencia' :
                Sabedoria === highest ? 'Sabedoria' : 'Sorte';

    // === CLASSES BALANCEADAS (Equilíbrio) ===
    if (balance < 15 && average > 60) return 'Maestro do Equilíbrio';
    if (balance < 20 && average > 40) return 'Guardião Harmônico';
    if (balance < 25 && average > 25) return 'Aventureiro Versátil';
    if (balance < 20) return 'Aprendiz Equilibrado';

    // === CLASSES LENDÁRIAS (Maestria + Segundo Forte) ===
    if (dominant === 'Forca' && Forca > 80) {
        if (Resistencia > 60) return 'Imperador da Prosperidade';
        if (Sabedoria > 60) return 'Líder Iluminado';
        if (Sorte > 60) return 'Conquistador Afortunado';
        return 'Titã da Renda';
    }
    if (dominant === 'Resistencia' && Resistencia > 80) {
        if (Forca > 60) return 'Fortaleza Impenetrável';
        if (Sabedoria > 60) return 'Sábio Guardião';
        if (Sorte > 60) return 'Protetor da Fortuna';
        return 'Guardião Eterno';
    }
    if (dominant === 'Sabedoria' && Sabedoria > 80) {
        if (Forca > 60) return 'Estrategista Supremo';
        if (Resistencia > 60) return 'Oráculo do Tesouro';
        if (Sorte > 60) return 'Adivinho da Sorte';
        return 'Oráculo Supremo';
    }
    if (dominant === 'Sorte' && Sorte > 80) {
        if (Forca > 60) return 'Herói Carismático';
        if (Resistencia > 60) return 'Nobre Generoso';
        if (Sabedoria > 60) return 'Filósofo da Fortuna';
        return 'Arauto do Destino';
    }

    // === CLASSES ESPECIALIZADAS (Alta maestria, baixa em outra) ===
    if (Forca > 60 && Sabedoria < 25) return 'Gigante Impulsivo';
    if (Forca > 60 && Resistencia < 25) return 'Gastador Opulento';
    if (Sabedoria > 60 && Forca < 25) return 'Erudito Ascético';
    if (Sabedoria > 60 && Sorte < 25) return 'Pensador Solitário';
    if (Resistencia > 60 && Sorte < 25) return 'Avarento Cauteloso';
    if (Sorte > 60 && Resistencia < 25) return 'Generoso Despreocupado';

    // === CLASSES INTERMEDIÁRIAS (Dominante) ===
    if (dominant === 'Forca' && Forca > 50) return 'Magnata Emergente';
    if (dominant === 'Resistencia' && Resistencia > 50) return 'Guardião Prudente';
    if (dominant === 'Sabedoria' && Sabedoria > 50) return 'Estrategista Sagaz';
    if (dominant === 'Sorte' && Sorte > 50) return 'Socialite Carismático';

    // === CLASSES INICIANTES (Dominante menor) ===
    if (dominant === 'Forca') return 'Trabalhador Dedicado';
    if (dominant === 'Resistencia') return 'Poupador Iniciante';
    if (dominant === 'Sabedoria') return 'Estudante Curioso';
    if (dominant === 'Sorte') return 'Alma Generosa';

    return 'Aventureiro Iniciante';
};


class GamificationService {
    static getXpNeeded(level) {
        return xpNeeded(Math.max(level, 1));
    }

    static getLimitWindowStart(period) {
        if (period === 'daily') {
            return startOfDay(new Date());
        }
        if (period === 'weekly') {
            return startOfWeek(new Date(), { weekStartsOn: 1 });
        }
        return null;
    }

    static async hasReachedEventLimit(userId, eventType, limit) {
        if (!limit) return false;
        const windowStart = this.getLimitWindowStart(limit.period);
        if (!windowStart) return false;

        const count = await prisma.auditLog.count({
            where: {
                userId,
                action: 'GAMIFICATION_EVENT',
                entityId: eventType,
                createdAt: { gte: windowStart },
            },
        });

        return count >= limit.max;
    }

    /**
    * Processa a mudança de XP de um usuário, lidando com level-ups e limite semanal.
    * @param {Prisma.TransactionClient} tx - Instância transacional do Prisma.
    * @param {string} userId - O ID do usuário.
    * @param {number} deltaXp - A quantidade de XP a ser adicionada (pode ser negativa).
    */
    static async processXpChange(tx, userId, deltaXp) {
        const user = await tx.user.findUnique({
            where: { id: userId },
            include: { inventoryItems: { where: { equipped: true }, include: { item: true } } }
        });
        if (!user) return;
        if (user.gamificationMode === 'OFF') return;

        // Verifica e reseta o limite semanal se necessário
        const now = new Date();
        const lastReset = new Date(user.lastWeeklyReset);
        const daysSinceReset = differenceInDays(now, lastReset);

        let currentWeeklyXp = user.weeklyXp;

        if (daysSinceReset >= 7) {
            currentWeeklyXp = 0;
            await tx.user.update({
                where: { id: userId },
                data: { weeklyXp: 0, lastWeeklyReset: now }
            });
        }

        // Se for ganho de XP, verifica o limite
        if (deltaXp > 0) {
            if (currentWeeklyXp >= WEEKLY_XP_CAP) {
                console.log(`⚠️ Limite semanal de XP atingido para usuário ${userId}.`);
                return;
            }
            // Ajusta deltaXp se for ultrapassar o limite
            if (currentWeeklyXp + deltaXp > WEEKLY_XP_CAP) {
                deltaXp = WEEKLY_XP_CAP - currentWeeklyXp;
            }
        }

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

        // Atualiza XP total e XP semanal
        await tx.user.update({
            where: { id: userId },
            data: {
                level: currentLevel,
                xp: currentXp,
                weeklyXp: { increment: deltaXp > 0 ? deltaXp : 0 }
            }
        });
    }

    /**
    * Verifica e concede conquistas a um usuário com base em uma ação gatilho.
    * @param {PrismaClient | Prisma.TransactionClient} tx - Instância do Prisma.
    * @param {string} userId - O ID do usuário.
    * @param {string} trigger - A ação que disparou a verificação (ex: 'BUDGET_CREATED').
    */
    /**
    * Verifica e concede conquistas a um usuário com base em uma ação gatilho.
    * @param {PrismaClient | Prisma.TransactionClient} tx - Instância do Prisma.
    * @param {string} userId - O ID do usuário.
    * @param {string} trigger - A ação que disparou a verificação (ex: 'BUDGET_CREATED').
    * @param {string} entityId - ID da entidade relacionada (opcional).
    */
    static async checkAndAwardAchievements(tx, userId, trigger, entityId) {
        const user = await tx.user.findUnique({ where: { id: userId } });
        if (!user || !user.enableAchievementNotifications) return;
        if (user.gamificationMode === 'OFF') return;

        // 1. Conquistas Hardcoded (Legado/Complexas)
        const achievementKey = Object.keys(achievements).find(key => key.startsWith(trigger.split('_')[0]));
        if (achievementKey) {
            const achievement = achievements[achievementKey];
            const existingUnlock = await tx.unlockedAchievement.findUnique({
                where: { userId_achievementId: { userId, achievementId: achievement.id } }
            });
            if (!existingUnlock && await achievement.check(tx, userId, entityId)) {
                // Cria registro se não existir no banco (para hardcoded)
                // Nota: Idealmente, todos deveriam estar no banco.
                // Simplificação: Apenas concede XP e notificação se não tiver ID de banco real
                await this.processXpChange(tx, userId, achievement.xp);
                await NotificationService.createNotification(tx, user, {
                    title: `Conquista Desbloqueada: ${achievement.name}!`,
                    message: achievement.message,
                    type: 'ACHIEVEMENT_UNLOCKED'
                });
                // Tenta salvar o unlock se o ID existir no banco (migração futura)
            }
        }

        // 2. Conquistas Dinâmicas (Do Banco)
        const dynamicAchievements = await tx.achievement.findMany({
            where: { trigger }
        });

        for (const achievement of dynamicAchievements) {
            const existingUnlock = await tx.unlockedAchievement.findUnique({
                where: { userId_achievementId: { userId, achievementId: achievement.id } }
            });
            if (existingUnlock) continue;

            let criteriaMet = true;
            if (achievement.criteria) {
                criteriaMet = await this.evaluateCriteria(tx, userId, achievement.criteria, entityId);
            }

            if (criteriaMet) {
                await tx.unlockedAchievement.create({
                    data: { userId, achievementId: achievement.id }
                });
                await this.processXpChange(tx, userId, achievement.xp);
                await NotificationService.createNotification(tx, user, {
                    title: `Conquista Desbloqueada: ${achievement.name}!`,
                    message: achievement.description,
                    type: 'ACHIEVEMENT_UNLOCKED'
                });
            }
        }
    }

    static async evaluateCriteria(tx, userId, criteria, entityId) {
        // Implementação básica de critérios
        // Ex: { "type": "count", "entity": "transaction", "min": 50 }
        // Ex: { "type": "amount", "min": 1000 }

        if (criteria.type === 'count') {
            const model = criteria.entity === 'transaction' ? tx.transaction :
                criteria.entity === 'budget' ? tx.budget : null;
            if (!model) return false;
            const count = await model.count({ where: { userId } });
            return count >= (criteria.min || 1);
        }

        if (criteria.type === 'amount' && entityId) {
            // Assume que entityId é de uma transação
            const transaction = await tx.transaction.findUnique({ where: { id: entityId } });
            if (!transaction) return false;
            return Number(transaction.valor) >= (criteria.min || 0);
        }

        return true; // Se não tiver critérios específicos implementados, assume true (cuidado!)
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

        if (await this.hasReachedEventLimit(userId, eventType, event.limit)) {
            console.log(`⚠️ Evento ${eventType} ignorado para usuário ${userId} (limite atingido).`);
            return;
        }

        let xpToAward = event.xp;

        if (['BILL_PAID', 'GOAL_CONTRIBUTION', 'TRANSACTION_CREATED', 'GUILD_CONTRIBUTION'].includes(eventType) && details.amount) {
            xpToAward = Math.max(1, Math.floor(Math.sqrt(details.amount / 10)));
        }

        if (xpToAward === 0) return;

        console.log(`✨ Evento de Gamificação: ${eventType} para usuário ${userId}. XP: ${xpToAward}`);
        await this.processXpChange(tx, userId, xpToAward);

        await AuditService.log({
            userId,
            action: 'GAMIFICATION_EVENT',
            entity: 'GAMIFICATION_EVENT',
            entityId: eventType,
            details: {
                eventType,
                xpAwarded: xpToAward,
                description: event.description,
                meta: details || {},
            },
        });
    }


    /**
     * Gera um insight "in-character" baseado nos atributos.
     */
    static getInsight(attributes) {
        const { Forca, Resistencia, Sabedoria, Sorte } = attributes;
        const lowest = Object.entries(attributes).sort(([, a], [, b]) => a - b)[0];
        const [lowAttr, lowValue] = lowest;

        if (lowValue > 80) return "Você é uma lenda viva! O reino prospera sob sua gestão.";

        switch (lowAttr) {
            case 'Forca':
                return "Sua força vital (Renda) precisa de atenção. Busque novas fontes de poder ou fortaleça sua saúde.";
            case 'Resistencia':
                return "Suas defesas (Investimentos) estão baixas. O inverno financeiro pode ser cruel sem uma muralha de reservas.";
            case 'Sabedoria':
                return "Você age por impulso. Consulte os pergaminhos do Orçamento para guiar suas decisões com mais Sabedoria.";
            case 'Sorte':
                return "Nuvens escuras (Dívidas) pairam sobre você. Realize rituais de pagamento para limpar seu karma financeiro.";
            default:
                return "Continue sua jornada, aventureiro. O equilíbrio é a chave.";
        }
    }

    static async calculateAllAttributes(userId) {
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) return {};

        const threeMonthsAgo = subMonths(new Date(), 3);

        // Busca transações
        const transactions = await prisma.transaction.findMany({
            where: { userId, pago: true, data: { gte: threeMonthsAgo } },
            include: { category: true },
        });

        // Sistema de Trade-offs: Cada categoria afeta múltiplos atributos
        // Valores positivos aumentam, valores negativos diminuem
        const CATEGORY_EFFECTS = {
            'Salario': { Forca: 2.0, Resistencia: 0.5, Sabedoria: -0.2 },
            'Renda Extra': { Forca: 1.5, Resistencia: 0.3 },
            'Saude': { Forca: 1.8, Resistencia: 0.4, Sorte: 0.2 },
            'Esporte': { Forca: 1.5, Sorte: 0.3, Sabedoria: -0.1 },
            'Academia': { Forca: 1.3, Resistencia: 0.2 },

            'Educacao': { Sabedoria: 2.0, Forca: 0.3, Resistencia: -0.2 },
            'Livros': { Sabedoria: 1.5, Sorte: 0.2 },
            'Cursos': { Sabedoria: 1.8, Forca: 0.2 },
            'Assinaturas': { Sabedoria: 1.0, Sorte: -0.1 },

            'Investimento': { Resistencia: 2.0, Sabedoria: 0.5, Forca: -0.3 },
            'Poupanca': { Resistencia: 1.5, Sorte: 0.2 },
            'Seguros': { Resistencia: 1.3, Sabedoria: 0.2 },
            'Emergencia': { Resistencia: 1.0 },

            'Doacao': { Sorte: 2.0, Sabedoria: 0.3, Forca: -0.2 },
            'Presentes': { Sorte: 1.5, Resistencia: -0.2 },
            'Dividas': { Sorte: -1.5, Resistencia: -0.5 },
            'Emprestimos': { Sorte: -1.0, Sabedoria: -0.3 },
            'Lazer': { Sorte: 1.0, Sabedoria: -0.3, Resistencia: -0.5 },
            'Entretenimento': { Sorte: 0.8, Sabedoria: -0.2 },
            'Viagem': { Sorte: 1.2, Sabedoria: 0.1, Resistencia: -0.4 },

            // Categorias gerais (com efeitos menores)
            'Alimentacao': { Forca: 0.5, Sorte: 0.1 },
            'Transporte': { Forca: 0.3 },
            'Moradia': { Resistencia: 0.4, Forca: -0.1 },
            'Outros': { Sorte: 0.1 },
        };

        // Inicializa atributos em 10 (ponto de partida neutro)
        const attributes = {
            Forca: 10,
            Sabedoria: 10,
            Resistencia: 10,
            Sorte: 10
        };

        // Processa cada transação aplicando os efeitos
        transactions.forEach(transaction => {
            const categoryName = transaction.category?.nome;
            if (!categoryName) return;

            const effects = CATEGORY_EFFECTS[categoryName];
            if (!effects) return;

            // Valor da transação normalizado (divide por 100 para escalar)
            const normalizedValue = Number(transaction.valor) / 100;

            // Aplica cada efeito com diminishing returns
            Object.entries(effects).forEach(([attr, effect]) => {
                const currentValue = attributes[attr];

                // Fórmula de diminishing returns:
                // - Se efeito positivo: reduz ganho conforme atributo aumenta
                // - Se efeito negativo: reduz perda conforme atributo diminui
                let diminishingFactor;
                if (effect > 0) {
                    // Ganho reduz conforme se aproxima de 100
                    diminishingFactor = Math.max(0.1, 1 - (currentValue / 150));
                } else {
                    // Perda reduz conforme se aproxima de 0
                    diminishingFactor = Math.max(0.1, currentValue / 100);
                }

                // Aplica o efeito
                const delta = effect * normalizedValue * diminishingFactor;
                attributes[attr] = Math.max(1, Math.min(200, currentValue + delta));
            });
        });

        // Arredonda para 1 casa decimal
        Object.keys(attributes).forEach(key => {
            attributes[key] = parseFloat(attributes[key].toFixed(1));
        });

        const heroClass = getHeroClass(attributes);
        const insight = this.getInsight(attributes);

        // Atualiza classe do usuário se mudou
        if (user.heroClass !== heroClass) {
            await prisma.user.update({ where: { id: userId }, data: { heroClass } });
        }

        return {
            ...attributes,
            heroClass,
            insight,
            weeklyXp: user.weeklyXp,
            weeklyCap: WEEKLY_XP_CAP,
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

    static async generateMonthlyMissions(tx, userId) {
        const startOfCurrentMonth = startOfMonth(new Date());

        // Verifica se já existem missões para este mês
        const existingMissions = await tx.userMission.findFirst({
            where: {
                userId,
                mission: {
                    recurrenceType: 'MONTHLY'
                },
                createdAt: { gte: startOfCurrentMonth }
            }
        });

        if (existingMissions) return;

        // Busca templates de missões mensais
        const missionTemplates = await tx.mission.findMany({
            where: {
                isActive: true,
                recurrenceType: 'MONTHLY'
            }
        });

        // Se não houver templates, cria alguns padrões
        if (missionTemplates.length === 0) {
            // Criar templates padrão se não existirem (fallback)
            // Em produção, isso seria populado via seed ou admin panel
        }

        for (const template of missionTemplates) {
            await tx.userMission.create({
                data: {
                    userId,
                    missionId: template.id,
                    progressJson: { count: 0 },
                }
            });
        }
    }

    static async checkMissionProgress(tx, userId, triggerType, payload) {
        // Gera missões mensais se necessário (lazy load)
        await this.generateMonthlyMissions(tx, userId);

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
        if (userMission.mission.scope === 'GUILD') {
            await this.triggerXpEvent(tx, userId, 'GUILD_MISSION_COMPLETED', { missionId: userMission.missionId });
        }
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
            include: { inventoryItems: { where: { equipped: true }, include: { item: true } } }
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
        const damageLogs = await tx.auditLog.findMany({ where: { entity: 'BOSS', entityId: boss.id, action: 'BOSS_DAMAGE' } });
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
                    const existingItem = await tx.userItem.findFirst({ where: { userId, itemId } });
                    if (existingItem) await tx.userItem.update({ where: { id: existingItem.id }, data: { quantity: { increment: qty } } });
                    else await tx.userItem.create({ data: { userId, itemId, quantity: qty } });
                    const itemDetails = await tx.item.findUnique({ where: { id: itemId } });
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
