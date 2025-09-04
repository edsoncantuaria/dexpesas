// backend/src/routes/reconciliationRoutes.js
import express from 'express';
import multer from 'multer';
import reconciliationController from '../controllers/reconciliationController.js';
import authMiddleware from '../middlewares/authMiddleware.js';

// Configuração do Multer para receber o arquivo em memória
const upload = multer({ storage: multer.memoryStorage() });

const router = express.Router();

router.use(authMiddleware);

// Rota para fazer o upload do arquivo de extrato (OFX/CSV)
router.post('/upload', upload.single('statement'), reconciliationController.uploadStatement);

// Rota para buscar templates de importação CSV salvos pelo usuário
router.get('/templates', reconciliationController.getImportTemplates);

// Rota para buscar todas as reconciliações do usuário (histórico)
router.get('/history', reconciliationController.getReconciliationHistory);

// Rota para buscar o status de uma reconciliação específica ou a última de uma conta
// Ex: /status?reconciliationId=123 ou /status?accountId=456
router.get('/status', reconciliationController.getReconciliationStatus);

// Rota para o usuário confirmar a conciliação de uma transação importada
router.post('/match', reconciliationController.matchTransaction);

// Rota para o usuário descartar uma transação importada
router.post('/discard', reconciliationController.discardTransaction);

// Rota para criar todas as transações pendentes de uma reconciliação em lote
router.post('/:reconciliationId/create-all', reconciliationController.createAllFromImported);

// Rota para finalizar uma reconciliação pendente
router.post('/:reconciliationId/finalize', reconciliationController.finalizeReconciliation);

// Rota para deletar/cancelar uma reconciliação
router.delete('/:reconciliationId', reconciliationController.deleteReconciliation);


export default router;
