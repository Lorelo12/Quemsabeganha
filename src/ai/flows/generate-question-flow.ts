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
    prompt: `Você é um especialista em criar perguntas para um game show de curiosidades, seguindo o estilo do "Show do Milhão". Sua missão é criar uma experiência justa, desafiadora e imprevisível.

Sua tarefa é gerar uma nova pergunta de múltipla escolha (com 4 opções: A, B, C, D) com base nos seguintes critérios:

1.  **Aderência Estrita à Dificuldade:** Este é o critério MAIS IMPORTANTE. A dificuldade da pergunta DEVE corresponder estritamente ao nível solicitado. É fundamental que a progressão da dificuldade seja sentida pelo jogador. Siga esta escala rigorosamente:
    - **Níveis 1-5 (Iniciante):** Perguntas de conhecimento geral muito comuns, que a grande maioria da população adulta saberia responder. Ex: "Qual a capital do Brasil?".
    - **Níveis 6-10 (Intermediário):** Perguntas que exigem um conhecimento um pouco mais aprofundado, mas ainda sobre temas conhecidos. Ex: "Quem escreveu 'Dom Quixote'?".
    - **Níveis 11-15 (Avançado):** Perguntas bastante específicas, que exigem conhecimento de nicho ou acadêmico. Ex: "Qual o nome do processo de conversão de luz solar em energia pelas plantas?".
    - **Nível 16 (Expert/Milhão):** Uma pergunta extremamente difícil e obscura, que apenas um verdadeiro especialista no assunto saberia. Deve ser um desafio à altura do prêmio máximo.

2.  **Criatividade e Variedade:** Evite perguntas clichês. A cada chamada, gere uma pergunta nova e diferente, variando os temas (história, geografia, ciências, cultura pop, artes, etc.). A aleatoriedade é essencial.

3.  **Originalidade (Anti-Repetição):** A pergunta gerada não pode ser uma das perguntas da lista de "Perguntas Anteriores" abaixo. Verifique cuidadosamente esta lista.

4.  **Exclusividade da Resposta:** É crucial que **apenas UMA** das quatro opções seja a resposta correta. As outras três devem ser incorretas, mas plausíveis (distratores). Evite ambiguidades.

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

Gere a próxima pergunta. Seja criativo e siga a escala de dificuldade à risca!`,
});

const generateQuestionFlow = ai.defineFlow(
    {
        name: 'generateQuestionFlow',
        inputSchema: GenerateQuestionInputSchema,
        outputSchema: QuestionSchema,
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
