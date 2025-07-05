'use server';
/**
 * @fileOverview A flow for simulating opinions from experts for a quiz question.
 * - getExpertsOpinion - Simulates three experts giving their opinion.
 * - ExpertsOpinionInput - Input schema.
 * - ExpertsOpinionOutput - Output schema.
 */
import { ai } from '@/ai/genkit';
import { QuestionSchema } from '@/lib/types';
import { z } from 'genkit';


const ExpertsOpinionInputSchema = QuestionSchema;
export type ExpertsOpinionInput = z.infer<typeof ExpertsOpinionInputSchema>;

const ExpertOpinionSchema = z.object({
  name: z.string().describe("The expert's fictitious name (e.g., 'Prof. Hélio')."),
  opinion: z.string().describe("The expert's opinion, indicating their choice and confidence level (e.g., 'Tenho quase certeza que é a opção C.')"),
});
const ExpertsOpinionOutputSchema = z.object({
    opinions: z.array(ExpertOpinionSchema).length(3).describe('An array of three expert opinions.')
});
export type ExpertsOpinionOutput = z.infer<typeof ExpertsOpinionOutputSchema>;

export async function getExpertsOpinion(input: ExpertsOpinionInput): Promise<ExpertsOpinionOutput> {
    return expertsOpinionFlow(input);
}

const prompt = ai.definePrompt({
    name: 'expertsOpinionPrompt',
    input: { schema: ExpertsOpinionInputSchema },
    output: { schema: ExpertsOpinionOutputSchema },
    prompt: `Você é um simulador de "ajuda dos universitários" para um game show.
Sua tarefa é gerar três opiniões curtas e distintas de especialistas fictícios sobre a resposta correta para a pergunta fornecida.

Regras:
1.  Crie três nomes fictícios para os especialistas (ex: Profa. Ana, Dr. Carlos, Mestre Bia).
2.  Gere uma opinião para cada um. As opiniões devem ser concisas.
3.  Varie a confiança dos especialistas. Um pode estar muito certo, outro pode estar em dúvida entre duas opções, e um terceiro pode até errar, especialmente em perguntas mais difíceis.
4.  A resposta correta deve ser a mais apontada, mas não de forma unânime e óbvia.

Pergunta: {{{question}}}
Opções:
A) {{{options.A}}}
B) {{{options.B}}}
C) {{{options.C}}}
D) {{{options.D}}}

Resposta Correta: {{{correctAnswerKey}}}

Gere as três opiniões.`,
});


const expertsOpinionFlow = ai.defineFlow(
    {
        name: 'expertsOpinionFlow',
        inputSchema: ExpertsOpinionInputSchema,
        outputSchema: ExpertsOpinionOutputSchema,
        retry: {
            maxAttempts: 3,
            backoff: {
                delay: '2s',
                multiplier: 2
            }
        }
    },
    async (input) => {
        const { output } = await prompt(input);
        return output!;
    }
);
