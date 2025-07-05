'use server';
/**
 * @fileOverview A flow for generating quiz questions.
 *
 * - generateQuestion - Generates a new quiz question based on difficulty and previous questions.
 * - GenerateQuestionInput - The input type for the generateQuestion function.
 */

import { ai } from '@/ai/genkit';
import { Question, QuestionSchema } from '@/lib/types';
import { z } from 'genkit';

const GenerateQuestionInputSchema = z.object({
  difficulty: z.number().min(1).max(16).describe('The difficulty level of the question, from 1 (easy) to 16 (hard).'),
  previousQuestions: z.array(z.string()).describe('A list of questions that have already been asked, to avoid repetition.'),
});
export type GenerateQuestionInput = z.infer<typeof GenerateQuestionInputSchema>;


export async function generateQuestion(input: GenerateQuestionInput): Promise<Question> {
  return generateQuestionFlow(input);
}

const prompt = ai.definePrompt({
    name: 'generateQuestionPrompt',
    input: { schema: GenerateQuestionInputSchema },
    output: { schema: QuestionSchema },
    prompt: `Você é um especialista em criar perguntas para um game show de curiosidades.

Sua tarefa é gerar uma nova pergunta de múltipla escolha (com 4 opções: A, B, C, D) com base nos seguintes critérios:

1.  **Tema:** Conhecimentos gerais (história, geografia, ciências, cultura pop, artes, etc.).
2.  **Nível de Dificuldade:** A dificuldade deve ser compatível com o nível fornecido, em uma escala de 1 (mais fácil) a 16 (mais difícil).
    - Nível 1-5: Fácil. Perguntas que a maioria das pessoas com conhecimento básico saberia responder.
    - Nível 6-10: Médio. Perguntas que exigem um pouco mais de conhecimento específico.
    - Nível 11-15: Difícil. Perguntas bem específicas, para especialistas ou entusiastas.
    - Nível 16: Muito Difícil. A pergunta do milhão! Desafiadora e que poucos saberiam.
3.  **Originalidade:** A pergunta gerada deve ser única e não pode ser uma das perguntas da lista de "Perguntas Anteriores" abaixo. Seja criativo para que cada jogo seja uma experiência nova.
4.  **Exclusividade da Resposta:** É crucial que **apenas UMA** das quatro opções seja a resposta correta. As outras três devem ser incorretas, mas plausíveis (distratores). Evite ambiguidades ou perguntas com múltiplas respostas corretas.
5.  **Formato:** A resposta deve ser um objeto JSON com os campos "question", "options" (um objeto com chaves A, B, C, D) e "correctAnswerKey".

---
**Nível de Dificuldade Solicitado:** {{{difficulty}}}

**Perguntas Anteriores (a serem evitadas):**
{{#if previousQuestions}}
{{#each previousQuestions}}
- {{{this}}}
{{/each}}
{{else}}
Nenhuma.
{{/if}}
---

Gere a próxima pergunta.`,
});

const generateQuestionFlow = ai.defineFlow(
    {
        name: 'generateQuestionFlow',
        inputSchema: GenerateQuestionInputSchema,
        outputSchema: QuestionSchema,
    },
    async (input) => {
        const { output } = await prompt(input);
        return output!;
    }
);
