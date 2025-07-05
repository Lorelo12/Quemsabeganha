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
  const output = await generateQuizFlow();
  if (!output?.questions) {
    console.error('Failed to generate quiz questions. The AI returned an empty or invalid response.');
    return [];
  }
  return output.questions;
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
3.  **Formato de Saída OBRIGATÓRIO:**
    *   A saída DEVE ser um objeto JSON.
    *   O objeto principal deve ter uma chave "questions", que é um array de 16 objetos de pergunta.
    *   Cada objeto de pergunta deve ter EXATAMENTE as seguintes chaves: "question" (string), "options" (um objeto com chaves "A", "B", "C", "D"), e "correctAnswerKey" (uma string que seja "A", "B", "C", ou "D").

Gere o conjunto completo de 16 perguntas agora, seguindo estritamente o formato JSON especificado.`,
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
        if (!output) {
          throw new Error('AI returned no output.');
        }
        return output;
    }
);
