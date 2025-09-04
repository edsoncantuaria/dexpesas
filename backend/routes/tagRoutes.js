
// backend/src/routes/tagRoutes.js
import express from 'express';
import tagController from '../controllers/tagController.js';
import authMiddleware from '../middlewares/authMiddleware.js';
import validate from '../middlewares/validate.js';
import { tagSchema } from '../validators/tagSchema.js';

const router = express.Router();

router.use(authMiddleware);

router.get('/', tagController.getTags);
router.post('/', validate(tagSchema), tagController.createTag);
router.delete('/:id', tagController.deleteTag);

export default router;
