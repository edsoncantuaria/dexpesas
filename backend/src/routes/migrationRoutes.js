import express from 'express';
import migrationController from '../controllers/migrationController.js';
import migrationDraftController from '../controllers/migrationDraftController.js';
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

// Draft management
router.get('/draft', migrationDraftController.getDraft);
router.post('/draft', migrationDraftController.saveDraft);
router.delete('/draft', migrationDraftController.deleteDraft);

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
router.post('/skip', migrationController.skipMigration);

// Retomar migração
router.post('/resume', migrationController.resumeMigration);

export default router;
