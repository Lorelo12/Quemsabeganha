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
    prompt: `Você é o roteirista principal e gerador de perguntas para o game show "Quiz Milionário". Sua responsabilidade é criar perguntas de alta qualidade que sejam desafiadoras, justas, e sempre novas.

**Sua Tarefa:**
Gerar UMA pergunta de múltipla escolha com 4 alternativas (A, B, C, D) e apenas UMA resposta correta.

**Regras Essenciais:**

1.  **Nível de Dificuldade Preciso:** A dificuldade da pergunta deve corresponder EXATAMENTE ao nível solicitado. A progressão é a chave da emoção do jogo.
    *   **Níveis 1-5 (Fácil):** Conhecimento geral básico. Perguntas que a maioria dos adultos saberia. (Ex: "Qual oceano banha a costa leste do Brasil?")
    *   **Níveis 6-10 (Médio):** Temas conhecidos, mas que exigem um pouco mais de detalhe. (Ex: "Qual pintor é famoso por sua obra 'Guernica'?")
    *   **Níveis 11-16 (Difícil):** Conhecimento específico, acadêmico ou de nicho. (Ex: "Qual foi o primeiro elemento químico a ser descoberto artificialmente?")

2.  **Aleatoriedade e Variedade MÁXIMA:**
    *   **Temas Diversificados:** Varie os temas a cada pergunta: história, geografia, ciências, cultura pop, artes, esportes, etc. Não foque em apenas uma área.
    *   **Sempre Original:** A pergunta deve ser diferente a cada nova partida. NUNCA repita clichês ou perguntas óbvias.

3.  **Evitar Repetição (Regra Crítica):** A pergunta gerada NÃO PODE estar na lista de "Perguntas Anteriores" fornecida abaixo. Verifique esta lista com atenção.

4.  **Resposta Única e Incontestável:**
    *   **Apenas UMA** opção pode ser a correta.
    *   As outras três opções (distratores) devem ser incorretas, mas plausíveis o suficiente para criar dúvida.
    *   Evite ambiguidades ou perguntas com múltiplas interpretações.

5.  **Qualidade do Conteúdo:**
    *   **Evite perguntas datadas:** Não use perguntas que dependam do tempo (Ex: "Quem é o atual presidente...?").
    *   **Evite regionalismos extremos:** As perguntas devem ser compreensíveis para um público de língua portuguesa em geral.

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

Gere a próxima pergunta seguindo todas as regras à risca.`,
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
