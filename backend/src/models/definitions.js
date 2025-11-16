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
 * @property {string} [bankCode]
 * @property {string} [agencyNumber]
 * @property {string} [agencyDigit]
 * @property {string} [accountNumber]
 * @property {string} [accountDigit]
 * @property {'corrente' | 'poupanca' | 'investimento'} tipo
 * @property {'BRL' | 'USD'} currency
 * @property {number} saldoInicial
 * @property {string} [color]
 * @property {string} [icone]
 * @property {boolean} isArchived
 * @property {number} [saldo]
 * @property {number} [saldoPago]
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
 * @property {'ACTIVE' | 'BLOCKED' | 'CANCELLED'} status
 * @property {string} [rewardsType]
 * @property {string} [rewardsProgram]
 * @property {number} [rewardsConversionRate]
 * @property {string} [lastFourDigits]
 * @property {string} [issuer]
 * @property {'BRL' | 'USD'} billingCurrency
 * @property {'BRL' | 'USD'} [currencyForConversion]
 * @property {number} currentInvoiceAmount
 * @property {number} [availableLimit]
 * @property {number} [jurosRotativo]
 * @property {string} [paymentAccountId]
 * @property {string} [bestDayToBuy]
 */

/**
 * @typedef {Object} Transaction
 * @property {string} id
 * @property {string} userId
 * @property {string} [accountId]
 * @property {string} [cardId]
 * @property {string} descricao
 * @property {number} valor
 * @property {'receita' | 'despesa'} tipo
 * @property {string} data
 * @property {'debito' | 'credito' | 'pix' | 'dinheiro' | 'transferencia'} metodoPagamento
 * @property {'BRL' | 'USD'} currency
 * @property {'PENDING' | 'POSTED' | 'CANCELLED' | 'FAILED'} status
 * @property {boolean} pago
 * @property {string} [notes]
 * @property {boolean} [installment]
 * @property {string} [installmentId]
 * @property {number} [installmentNumber]
 * @property {number} [totalInstallments]
 * @property {boolean} [withInterest]
 * @property {number} [interestRate]
 * @property {number} [valorTotal]
 * @property {number} [totalWithInterest]
 * @property {number} [balanceAfter]
 * @property {'WEEKLY' | 'BIWEEKLY' | 'MONTHLY' | 'BIMONTHLY' | 'TRIMONTHLY' | 'SEMIANNUALLY'} [recurrenceType]
 * @property {string} [recorrenciaId]
 * @property {string} [attachmentUrl]
 * @property {string} [bankReference]
 * @property {string} [authorizationCode]
 * @property {string} [merchantName]
 * @property {string} [merchantCategory]
 * @property {string} [counterparty]
 * @property {string} [postedAt]
 * @property {string} [clearedAt]
 * @property {boolean} [isTransfer]
 * @property {string} [counterAccountId]
 * @property {string} [transferGroupId]
 * @property {boolean} isReconciled
 * @property {string} [categoryId]
 * @property {boolean} [isInvoicePayment]
 */

/**
 * @typedef {Object} Category
 * @property {string} id
 * @property {string} nome
 * @property {string} label
 * @property {string} [icon]
 * @property {'receita' | 'despesa'} type
 * @property {string} [parentCategoryId]
 * @property {string} [userId]
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

/**
 * @typedef {Object} LedgerEntry
 * @property {string} id
 * @property {string} transactionId
 * @property {string} accountId
 * @property {'DEBIT' | 'CREDIT'} direction
 * @property {number} amount
 * @property {'BRL' | 'USD'} currency
 * @property {number} [exchangeRate]
 */


// Este arquivo não precisa exportar nada, ele serve apenas para a definição de tipos com JSDoc.
// O TypeScript no frontend irá referenciar estes tipos.
