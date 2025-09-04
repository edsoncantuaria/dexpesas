// backend/src/models/definitions.js

/**
 * @typedef {Object} User
 * @property {string} id
 * @property {string} name
 * @property {string} username
 * @property {string} email
 * @property {string} [password]
 * @property {number} [age]
 * @property {'masculino' | 'feminino' | 'outro' | 'naodizer'} [gender]
 * @property {string} [avatarUrl]
 */

/**
 * @typedef {Object} GamificationAttribute
 * @property {number} Alimentacao
 * @property {number} Lazer
 * @property {number} Transporte
 * @property {number} Investimentos
 * @property {number} Vicios
 * @property {number} Moradia
 * @property {number} Saude
 * @property {number} Educacao
 * @property {number} Compras
 */

/**
 * @typedef {GamificationAttribute & {id: string, userId: string, level: number, xp: number}} GamificationProfile
 */

/**
 * @typedef {Object} Account
 * @property {string} id
 * @property {string} userId
 * @property {string} nome
 * @property {string} instituicao
 * @property {'corrente' | 'poupanca' | 'investimento'} tipo
 * @property {number} saldo
 */

/**
 * @typedef {Object} Card
 * @property {string} id
 * @property {string} userId
 * @property {string} nome
 * @property {number} limite
 * @property {number} diaFechamento
 * @property {number} diaVencimento
 * @property {'visa' | 'mastercard' | 'elo' | 'amex'} bandeira
 * @property {number} saldoFatura
 */

/**
 * @typedef {Object} Transaction
 * @property {string} id
 * @property {string} userId
 * @property {string} [accountId]
 * @property {string} [cardId]
 * @property {string} descricao
 * @property {number} valor
 * @property {number} [valorTotal]
 * @property {'receita' | 'despesa'} tipo
 * @property {string} data
 * @property {string} categoria
 * @property {'debito' | 'credito' | 'pix' | 'dinheiro'} metodoPagamento
 * @property {boolean} pago
 * @property {boolean} [installment]
 * @property {string} [installmentId]
 * @property {number} [installmentNumber]
 * @property {number} [totalInstallments]
 * @property {boolean} [recorrente]
 * @property {string} [recorrenciaId]
 */

/**
 * @typedef {Object} Category
 * @property {string} id
 * @property {string} nome
 * @property {string} icon
 */

/**
 * @typedef {Object} Achievement
 * @property {string} id
 * @property {string} nome
 * @property {string} descricao
 * @property {string} icon
 * @property {number} xp
 */

/**
 * @typedef {Object} UnlockedAchievement
 * @property {string} id
 * @property {string} userId
 * @property {string} achievementId
 * @property {Date} unlockedAt
 * @property {boolean} destacada
 */

/**
 * @typedef {Object} NotificationAction
 * @property {string} label - O texto do botão (ex: "Marcar como Paga")
 * @property {string} action - A chave da ação (ex: "MARK_AS_PAID")
 * @property {'default' | 'destructive' | 'outline' | 'secondary'} variant - O estilo do botão
 */

/**
 * @typedef {Object} Notification
 * @property {string} id
 * @property {string} userId
 * @property {string} title
 * @property {string} message
 * @property {'TRANSACTION_CREATED' | 'PAYMENT_DUE' | 'LIMIT_ALERT' | 'ACHIEVEMENT_UNLOCKED' | 'BUDGET_ALERT'} type
 * @property {boolean} read
 * @property {string} createdAt
 * @property {string} [relatedId]
 * @property {NotificationAction[]} [actions]
 */


// Este arquivo não precisa exportar nada, ele serve apenas para a definição de tipos com JSDoc.
// O TypeScript no frontend irá referenciar estes tipos.
