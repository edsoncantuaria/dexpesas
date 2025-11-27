// backend/src/ai/flows/receipt-ocr-flow.js
'use server';
import { ai } from '../genkit.js';
import { z } from 'zod';
import { googleAI } from '@genkit-ai/googleai';

// Esquema de entrada: uma imagem em formato Data URI.
export const OcrInputSchema = z.object({
  imageDataUri: z
    .string()
    .describe(
      "A photo of a receipt, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});

// Esquema de saída: os dados estruturados que queremos extrair.
export const OcrOutputSchema = z.object({
  estabelecimento: z.string().optional().describe('O nome do estabelecimento ou loja.'),
  data: z.string().optional().describe('A data da transação no formato YYYY-MM-DD.'),
  valor: z.number().optional().describe('O valor total da compra.'),
  itens: z.array(z.object({
    descricao: z.string().describe('Nome ou descrição do item.'),
    valor: z.number().describe('Preço do item.'),
  })).optional().describe('Lista de itens comprados.'),
});

// Definição do prompt multimodal.
const ocrPrompt = ai.definePrompt({
  name: 'receiptOcrPrompt',
  model: googleAI.model('gemini-1.5-flash'),
  input: { schema: OcrInputSchema },
  output: { schema: OcrOutputSchema },
  prompt: `Analise a imagem deste recibo ou nota fiscal. Extraia as seguintes informações e retorne em formato JSON:
- 'estabelecimento': O nome do local da compra.
- 'data': A data da transação, formatada como YYYY-MM-DD.
- 'valor': O valor total final pago.
- 'itens': Uma lista com todos os itens comprados, contendo 'descricao' e 'valor' de cada um.

Imagem do Recibo:
{{media url=imageDataUri}}`,
});

// Definição do fluxo que executa o prompt.
export const receiptOcrFlow = ai.defineFlow(
  {
    name: 'receiptOcrFlow',
    inputSchema: OcrInputSchema,
    outputSchema: OcrOutputSchema,
  },
  async (input) => {
    const { output } = await ocrPrompt(input);
    if (!output) {
      throw new Error('A IA não conseguiu processar o recibo.');
    }
    return output;
  }
);
