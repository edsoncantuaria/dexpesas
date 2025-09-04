// backend/src/ai/flows/daily-summary-flow.js
'use server';
import { ai } from '../genkit.js';
import { z } from 'zod';
import { googleAI } from '@genkit-ai/googleai';
import wav from 'wav';

// Esquema de entrada: uma lista de transações do dia.
export const DailySummaryInputSchema = z.object({
  transactions: z.string().describe('Um JSON stringified de uma lista de transações do dia.'),
});

// Esquema de saída: o resumo em texto e o áudio em Data URI.
export const DailySummaryOutputSchema = z.object({
  summary: z.string().describe('Um resumo textual e amigável do dia financeiro.'),
  audioDataUri: z.string().describe("O áudio do resumo, como um data URI que deve incluir um MIME type (audio/wav) e usar Base64. Formato: 'data:audio/wav;base64,<encoded_data>'."),
});

/**
 * Converte dados de áudio PCM brutos para o formato WAV em Base64.
 * O modelo de TTS do Gemini retorna áudio PCM, que não é diretamente tocável na web.
 */
async function toWav(pcmData, channels = 1, rate = 24000, sampleWidth = 2) {
  return new Promise((resolve, reject) => {
    const writer = new wav.Writer({
      channels,
      sampleRate: rate,
      bitDepth: sampleWidth * 8,
    });

    const bufs = [];
    writer.on('error', reject);
    writer.on('data', (d) => bufs.push(d));
    writer.on('end', () => resolve(Buffer.concat(bufs).toString('base64')));

    writer.write(pcmData);
    writer.end();
  });
}

// 1. Prompt para gerar o resumo em TEXTO.
const summaryPrompt = ai.definePrompt({
  name: 'dailySummaryTextPrompt',
  model: googleAI.model('gemini-1.5-flash'),
  input: { schema: DailySummaryInputSchema },
  output: { schema: z.object({ summary: z.string() }) },
  prompt: `Você é um assistente financeiro. Analise as transações de hoje e crie um resumo curto e amigável, como um boletim de notícias.

Transações de Hoje:
{{{transactions}}}

Se não houver transações, diga que o dia foi tranquilo. Caso contrário, mencione o total de receitas, o total de despesas e o balanço do dia (receitas - despesas). Destaque o gasto mais significativo, se houver.
`,
});

// 2. Fluxo principal que orquestra a geração de texto e depois de áudio.
export const dailySummaryFlow = ai.defineFlow(
  {
    name: 'dailySummaryFlow',
    inputSchema: DailySummaryInputSchema,
    outputSchema: DailySummaryOutputSchema,
  },
  async (input) => {
    // Passo 1: Gera o resumo em texto.
    const textResponse = await summaryPrompt(input);
    const summaryText = textResponse.output?.summary;

    if (!summaryText) {
      throw new Error('A IA não conseguiu gerar o resumo em texto.');
    }

    // Passo 2: Usa o texto gerado para criar o áudio.
    const { media } = await ai.generate({
        model: googleAI.model('gemini-2.5-flash-preview-tts'),
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Algenib' }, // Voz masculina amigável
            },
          },
        },
        prompt: summaryText,
      });

    if (!media) {
      throw new Error('A IA não conseguiu gerar o áudio.');
    }
    
    // Converte o áudio PCM para WAV
    const audioBuffer = Buffer.from(media.url.substring(media.url.indexOf(',') + 1), 'base64');
    const wavBase64 = await toWav(audioBuffer);

    return {
      summary: summaryText,
      audioDataUri: `data:audio/wav;base64,${wavBase64}`,
    };
  }
);
