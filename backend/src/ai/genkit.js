// backend/src/ai/genkit.js
import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Garante que as variáveis de ambiente sejam carregadas antes de qualquer outra coisa
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });


export const ai = genkit({
  plugins: [
    googleAI({
      apiKey: process.env.GEMINI_API_KEY, // Usa a chave diretamente do .env
    }),
  ],
  logSinks: [],
  enableTracingAndMetrics: false,
});
