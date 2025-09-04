// backend/src/ai/flows/inspirational-quote-flow.js
import { ai } from '../genkit.js';
import { z } from 'zod';
import { googleAI } from '@genkit-ai/googleai';

export const InspirationalQuoteOutputSchema = z.object({
  quote: z.string().max(80).describe('A frase curta e inspiradora.'),
});

const prompt = ai.definePrompt({
  name: 'inspirationalQuotePrompt',
  model: googleAI.model('gemini-1.5-flash'),
  output: { schema: InspirationalQuoteOutputSchema },
  prompt: `Gere uma frase inspiradora e curta (máximo de 6 palavras) sobre finanças, com um tema de RPG ou fantasia.
  
Exemplos:
- Forje seu destino financeiro.
- Cada moeda, um ponto de XP.
- Sua jornada épica para a riqueza.
- Desbrave a masmorra das dívidas.
- O tesouro aguarda os disciplinados.`,
});

export const inspirationalQuoteFlow = ai.defineFlow(
  {
    name: 'inspirationalQuoteFlow',
    outputSchema: InspirationalQuoteOutputSchema,
  },
  async () => {
    const llmResponse = await prompt();
    return llmResponse.output;
  }
);
