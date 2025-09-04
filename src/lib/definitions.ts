// src/lib/definitions.ts
import type { DateRange } from "react-day-picker"

/**
 * @file Arquivo de definições de tipo para o frontend.
 * Estes tipos são importados das definições JSDoc do backend para garantir
 * consistência entre as duas aplicações.
 */

export type User = {
    id: string;
    name: string;
    username: string;
    email: string;
    age?: number;
    gender?: 'masculino' | 'feminino' | 'outro' | 'naodizer';
    avatarUrl?: string | null;
    firstOpen: boolean;
    futureProjectionCount: number; // Renomeado de recorrenciaPadrao
    daysUntilDueReminder: number;
    enableAchievementNotifications: boolean;
    enableBudgetNotifications: boolean;
    enableLimitAlerts: boolean;
    enableUpcomingPaymentNotifications: boolean;
    enableOcr: boolean;
    enableDailySummary: boolean;
    enableBudgetSuggestion: boolean;
    enableReconciliationAi: boolean;
    enableGoalProjection: boolean;
    habilitarDescricaoInteligente: boolean;
    dashboardLayout?: string[];
    professionalSituation?: string | null;
    monthlyIncomeRange?: string | null;
    investmentProfile?: string | null;
    mainFinancialGoal?: string | null;
    isAdmin: boolean;
    level: number;
    clanId?: string | null;
    clanMembership?: {
      role: 'LEADER' | 'ADMIN' | 'MEMBER'
    } | null;
};

export type LegacyRuin = {
    id: string;
    userId: string;
    name: string;
    totalAmountPaid: number;
    totalInterestPaid?: number | null;
    startDate: string;
    endDate: string;
    originalRecurrenceId: string;
}
  
export type GamificationProfile = {
    id: string;
    userId: string;
    level: number;
    xp: number;
    Forca: number;
    Resistencia: number;
    Sabedoria: number;
    Sorte: number;
    Alimentacao: number;
    AssinaturasEServicos: number;
    BaresERestaurantes: number;
    Casa: number;
    Compras: number;
    CuidadosPessoais: number;
    DividasEEmprestimos: number;
    Educacao: number;
    FamiliaEFilhos: number;
    ImpostosETaxas: number;
    LazerEHobbies: number;
    Mercado: number;
    Outros: number;
    Pets: number;
    PresentesEDoacoes: number;
    Roupas: number;
    Saude: number;
    Trabalho: number;
    Transporte: number;
    Viagem: number;
    Vicios: number;
};
  
export type Account = {
    id: string;
    userId: string;
    nome: string;
    instituicao: string;
    tipo: 'corrente' | 'poupanca' | 'investimento';
    saldo: number;
};
  
export type Card = {
    id: string;
    userId: string;
    nome: string;
    limite: number;
    diaFechamento: number;
    diaVencimento: number;
    bandeira: 'visa' | 'mastercard' | 'elo' | 'amex';
    saldoFatura: number;
    rewardsType?: string | null;
    rewardsProgram?: string | null;
    rewardsConversionRate?: number | null;
    currencyForConversion?: 'BRL' | 'USD' | null;
    jurosRotativo?: number | null;
    bestDayToBuy?: string;
    paymentAccountId?: string | null;
};

export type Tag = {
  id: string;
  name: string;
  userId: string;
};
  
export type Transaction = {
    id: string;
    userId: string;
    accountId?: string | null;
    cardId?: string | null;
    descricao: string;
    valor: number;
    valorTotal?: number | null;
    tipo: 'receita' | 'despesa';
    data: string;
    categoria: string; // Vem do include
    categoryId?: string | null;
    metodoPagamento: 'debito' | 'credito' | 'pix' | 'dinheiro';
    pago: boolean;
    notes?: string | null;
    installment?: boolean | null;
    installmentId?: string | null;
    installmentNumber?: number | null;
    totalInstallments?: number | null;
    withInterest?: boolean | null;
    interestRate?: number | null;
    totalWithInterest?: number | null;
    recurrenceType?: 'NONE' | 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY' | 'BIMONTHLY' | 'TRIMONTHLY' | 'SEMIANNUALLY' | null;
    recorrenciaId?: string | null;
    attachmentUrl?: string | null;
    isReconciled: boolean;
    importedTransactionId?: string | null;
    tags: Tag[];
};
  
export type Category = {
    id: string;
    nome: string;
    label: string;
    icon: string;
    type: 'receita' | 'despesa';
};
  
export type Achievement = {
    id: string;
    name: string;
    description: string;
    icon: string;
    xp: number;
};
  
export type UnlockedAchievement = {
    id: string;
    userId: string;
    achievementId: string;
    unlockedAt: Date;
    destacada: boolean;
};

export type Budget = {
    id: string;
    userId: string;
    categoryId: string;
    month: string;
    limit: number;
    originalLimit: number;
    rolloverAmount: number;
    spent: number;
    rollover: boolean;
    category?: Category; // Opcional, vindo do include
};

export type NotificationAction = {
  label: string;
  action: string;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary';
}

export type Notification = {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'TRANSACTION_CREATED' | 'PAYMENT_DUE' | 'LIMIT_ALERT' | 'ACHIEVEMENT_UNLOCKED' | 'BUDGET_ALERT' | 'UPCOMING_PAYMENT' | 'STREAK_AWARDED';
  read: boolean;
  createdAt: string;
  relatedId?: string | null;
  actions?: NotificationAction[];
};

export type GoalContribution = {
    id: string;
    goalId: string;
    amount: number;
    date: string;
    debitTransactionId?: string | null;
}

export type Goal = {
    id: string;
    userId?: string;
    clanId?: string;
    name: string;
    targetAmount: number;
    currentAmount: number;
    status: 'IN_PROGRESS' | 'COMPLETED';
    deadline?: string | null;
    imageUrl?: string | null;
    contributions: GoalContribution[];
    projectionDate?: string | null;
};

export type FilterState = {
  text: string | null;
  accounts: string[];
  cards: string[];
  categories: string[];
  methods: string[];
  tags: string[];
  type: 'receita' | 'despesa' | null;
  dateRange?: DateRange;
  value_greater_than?: number | null;
  value_less_than?: number | null;
};

export type Automation = {
    id: string;
    userId: string;
    type: 'ROUND_UP' | 'GOAL_CONTRIBUTION' | 'BILL_PAY';
    enabled: boolean;
    config: any; // { destinationAccountId?: string } ou { amount: number, frequency: string, fromAccountId: string }
    lastRun?: string | null;
    goalId?: string | null;
    recorrenciaId?: string | null;
    scheduleType?: 'MANUAL' | 'WEEKLY' | 'MONTHLY' | 'THRESHOLD';
    scheduleValue?: string | null;
};

export type CategorizationRule = {
    id: string;
    userId: string;
    conditionType: 'CONTAINS';
    keyword: string;
    categoryId: string;
    category: Category;
};

export type OcrData = {
  estabelecimento?: string;
  data?: string;
  valor?: number;
};

export type ImportedTransaction = {
    id: string;
    reconciliationId: string;
    date: string;
    amount: number;
    type: 'CREDIT' | 'DEBIT';
    description: string;
    fitId: string;
    status: 'PENDING' | 'SUGGESTED' |'RECONCILED' | 'DISCARDED';
    manualTransactionId?: string | null;
    similarityScore?: number | null;
};

export type Reconciliation = {
    id: string;
    userId: string;
    accountId: string;
    startDate: string;
    endDate: string;
    startBalance: number;
    endBalance: number;
    status: 'PROCESSING' | 'PENDING_REVIEW' | 'COMPLETED' | 'FAILED';
    importedTransactions: ImportedTransaction[];
    createdAt: string;
};

export type ImportTemplate = {
    id: string;
    name: string;
    mapping: any; // { date: string, description: string, amount: string, date_format?: string }
}

export type AuditLog = {
    id: string;
    userId: string;
    action: string;
    entity: string;
    entityId: string;
    details: any;
    status: 'SUCCESS' | 'FAILURE';
    origin: string;
    ipAddress?: string;
    createdAt: string;
}

export type Mission = {
    id: string;
    title: string;
    description: string;
    xpReward: number;
    itemRewardId?: string | null;
    minLevel: number;
    requiredClass?: string | null;
    triggerSpec: any;
    isRepeatable: boolean;
    isActive: boolean;
    scope: 'USER' | 'GUILD';
};

export type UserMission = {
    id: string;
    userId: string;
    missionId: string;
    completedAt?: string | null;
    progressJson?: any;
    mission: Mission;
};

export type Item = {
    id: string;
    key: string;
    name: string;
    type: 'consumable' | 'cosmetic' | 'bonus';
    bonusJson?: any;
    rarity?: 'common' | 'rare' | 'epic' | 'legendary';
}

export type UserItem = {
    id: string;
    userId: string;
    itemId: string;
    quantity: number;
    equipped: boolean;
    item: Item;
}

export type Clan = {
    id: string;
    name: string;
    description: string;
    iconUrl?: string | null;
    balance: number;
    level: number;
    xp: number;
    policies: any;
    leader: Partial<User> & { level: number };
    _count: { members: number };
    leaderId: string;
}

export type ClanInvite = {
    id: string;
    clanId: string;
    invitedUserId: string;
    status: 'PENDING' | 'ACCEPTED' | 'DECLINED';
};

export type GuildMessage = {
    id: string;
    content: string;
    createdAt: string;
    user: Partial<User>;
    userId: string;
    guildId: string;
};

export type Boss = {
    id: string;
    name: string;
    hp: number;
    currentHp: number;
    rewardJson: any;
    isActive: boolean;
    startAt?: string | null;
    endAt?: string | null;
}
