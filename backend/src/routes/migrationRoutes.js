
// backend/src/routes/migrationRoutes.js
import express from 'express';
import migrationController from '../controllers/migrationController.js';
import { completeMigrationSchema } from '../validators/migrationSchema.js';
import authMiddleware from '../middlewares/authMiddleware.js';
import validate from '../middlewares/validate.js';
import {
    migrationAccountsSchema,
    migrationCardsSchema,
    cardHistorySchema,
} from '../validators/migrationSchema.js';

const router = express.Router();

// Todas as rotas requerem autenticação
router.use(authMiddleware);

// Iniciar processo de migração
router.post('/start', migrationController.startMigration);

// Criar contas em lote
router.post('/accounts', validate(migrationAccountsSchema), migrationController.createAccounts);

// Criar cartões em lote
router.post('/cards', validate(migrationCardsSchema), migrationController.createCards);

// Criar histórico de faturas de cartão
router.post('/card-history', validate(cardHistorySchema), migrationController.createCardHistory);

// Completar migração (marca flag)
router.post('/complete', migrationController.completeMigration);

// Pular migração (usuário escolhe fazer manualmente)
router.post('/skip', authMiddleware, validate(completeMigrationSchema), migrationController.skipMigration);
router.post('/postpone', authMiddleware, validate(completeMigrationSchema), migrationController.postponeMigration);

export default router;
