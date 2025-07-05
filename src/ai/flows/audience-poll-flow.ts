'use server';
/**
 * @fileOverview A flow for simulating an audience poll for a quiz question.
 * - getAudiencePoll - Simulates audience voting percentages.
 * - AudiencePollInput - Input schema.
 * - AudiencePollOutput - Output schema.
 */
import { ai } from '@/ai/genkit';
import { QuestionSchema } from '@/lib/types';
import { z } from 'genkit';

const AudiencePollInputSchema = QuestionSchema;
export type AudiencePollInput = z.infer<typeof AudiencePollInputSchema>;

const AudiencePollOutputSchema = z.object({
  A: z.number().describe('Percentage for option A'),
  B: z.number().describe('Percentage for option B'),
  C: z.number().describe('Percentage for option C'),
  D: z.number().describe('Percentage for option D'),
});
export type AudiencePollOutput = z.infer<typeof AudiencePollOutputSchema>;

export async function getAudiencePoll(input: AudiencePollInput): Promise<AudiencePollOutput> {
  return audiencePollFlow(input);
}

const prompt = ai.definePrompt({
    name: 'audiencePollPrompt',
    input: { schema: AudiencePollInputSchema },
    output: { schema: AudiencePollOutputSchema },
    prompt: `Você é um simulador de "opinião da plateia" para um game show.
Sua tarefa é gerar uma distribuição de votos percentuais para as quatro opções de uma pergunta.

Regras:
1.  A soma total das porcentagens deve ser 100.
2.  A resposta correta deve, na maioria das vezes, receber a maior porcentagem dos votos.
3.  A distribuição não deve ser óbvia demais. Adicione um pouco de incerteza, especialmente se a pergunta for difícil. Outras opções plausíveis podem receber uma quantidade significativa de votos.
4.  Retorne os valores como números inteiros.

Pergunta: {{{question}}}
Opções:
A) {{{options.A}}}
B) {{{options.B}}}
C) {{{options.C}}}
D) {{{options.D}}}

Resposta Correta: {{{correctAnswerKey}}}

Gere a distribuição de votos em porcentagem para cada opção.`,
});

const audiencePollFlow = ai.defineFlow(
    {
        name: 'audiencePollFlow',
        inputSchema: AudiencePollInputSchema,
        outputSchema: AudiencePollOutputSchema,
    },
    async (input) => {
        const { output } = await prompt(input);
        if (output) {
          const total = output.A + output.B + output.C + output.D;
          if (total !== 100 && total > 0) {
            output.A = Math.round((output.A / total) * 100);
            output.B = Math.round((output.B / total) * 100);
            output.C = Math.round((output.C / total) * 100);
            output.D = Math.round((output.D / total) * 100);
            
            const finalTotal = output.A + output.B + output.C + output.D;
            if (finalTotal !== 100) {
                output.A += (100 - finalTotal);
            }
          }
        }
        return output!;
    }
);
