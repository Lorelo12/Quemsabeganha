'use server';
/**
 * @fileOverview A flow for generating a full set of 16 quiz questions.
 *
 * - generateQuiz - Generates a new quiz with 16 questions.
 * - GenerateQuizOutput - The return type for the generateQuiz function.
 */

import { ai } from '@/ai/genkit';
import { Question, QuestionSchema } from '@/lib/types';
import { z } from 'genkit';

const GenerateQuizOutputSchema = z.object({
  questions: z.array(QuestionSchema).length(16).describe('An array of 16 quiz questions.'),
});
export type GenerateQuizOutput = z.infer<typeof GenerateQuizOutputSchema>;


export async function generateQuiz(): Promise<Question[]> {
  const { output } = await generateQuizFlow();
  return output?.questions || [];
}

const prompt = ai.definePrompt({
    name: 'generateQuizPrompt',
    output: { schema: GenerateQuizOutputSchema },
    prompt: `Você é o roteirista principal e gerador de perguntas para o game show "Quiz Milionário". Sua responsabilidade é criar um quiz completo de 16 perguntas de alta qualidade.

**Sua Tarefa:**
Gerar 16 perguntas de múltipla escolha com 4 alternativas (A, B, C, D) e apenas UMA resposta correta para cada.

**Regras Essenciais:**

1.  **Dificuldade Crescente:** As perguntas devem começar muito fáceis e aumentar a dificuldade progressivamente. A pergunta 1 deve ser de conhecimento popular, enquanto a pergunta 16 deve ser extremamente difícil, para especialistas.
2.  **Aleatoriedade e Variedade MÁXIMA:**
    *   **Temas Diversificados:** Varie os temas entre as perguntas: história, geografia, ciências, cultura pop, artes, esportes, etc. Não foque em apenas uma área.
    *   **Sempre Original:** As perguntas devem ser diferentes e não clichês.
3.  **Resposta Única e Incontestável:**
    *   Para cada pergunta, apenas UMA opção pode ser a correta.
    *   As outras três opções (distratores) devem ser incorretas, mas plausíveis o suficiente para criar dúvida.
    *   Evite ambiguidades ou perguntas com múltiplas interpretações.
4.  **Qualidade do Conteúdo:**
    *   **Evite perguntas datadas:** Não use perguntas que dependam do tempo (Ex: "Quem é o atual presidente...?").
    *   **Evite regionalismos extremos:** As perguntas devem ser compreensíveis para um público de língua portuguesa em geral.

Gere o conjunto completo de 16 perguntas agora.`,
});

const generateQuizFlow = ai.defineFlow(
    {
        name: 'generateQuizFlow',
        outputSchema: GenerateQuizOutputSchema,
        retry: {
            maxAttempts: 3,
            backoff: {
                delay: '2s',
                multiplier: 2
            }
        }
    },
    async () => {
        const { output } = await prompt();
        return output!;
    }
);
