// backend/src/routes/storageRoutes.js
import express from 'express';
import multer from 'multer';
import storageController from '../controllers/storageController.js';
import authMiddleware from '../middlewares/authMiddleware.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.use(authMiddleware);

// Rota para fazer upload de um arquivo, retorna o objectName
router.post('/upload', upload.single('file'), storageController.uploadFile);

// Nova rota para obter a URL pré-assinada de um arquivo
router.post('/get-url', storageController.getPresignedUrl);

export default router;
