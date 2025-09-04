// backend/src/middlewares/validate.js
import { z } from 'zod';

/**
 * Middleware para validar o corpo da requisição usando um schema Zod.
 * @param {z.ZodSchema<any>} schema - O schema Zod a ser usado para validação.
 */
const validate = (schema) => (req, res, next) => {
  try {
    schema.parse(req.body);
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.errors.map((issue) => ({
          message: `${issue.path.join('.')} is ${issue.message}`,
      }))
      return res.status(400).json({ error: 'Invalid input data', details: errorMessages });
    }
    // Para outros tipos de erro, passa para o errorHandler geral
    next(error);
  }
};

export default validate;
