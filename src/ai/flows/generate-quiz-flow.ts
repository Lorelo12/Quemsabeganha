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
    prompt: `Você é o roteirista principal e gerador de perguntas para o game show "Quiz Milionário", inspirado no clássico "Show do Milhão". Sua responsabilidade é criar um quiz completo de 16 perguntas com uma curva de dificuldade muito específica.

**Sua Tarefa:**
Gerar 16 perguntas de múltipla escolha com 4 alternativas (A, B, C, D) e apenas UMA resposta correta para cada.

**Regras Essenciais:**

1.  **Curva de Dificuldade (Estilo Show do Milhão):** A dificuldade deve aumentar em blocos bem definidos. Siga esta estrutura rigorosamente:
    *   **Perguntas 1 a 5 (Prêmio: R$ 1.000 a R$ 5.000):** MUITO FÁCEIS. Devem ser de conhecimento geral básico, que uma criança ou a grande maioria dos adultos saberia responder. (Ex: "Qual a cor do céu em um dia sem nuvens?").
    *   **Perguntas 6 a 10 (Prêmio: R$ 10.000 a R$ 50.000):** FÁCEIS A MÉDIAS. Assuntos de conhecimento escolar, cultura geral e fatos conhecidos. (Ex: "Quem pintou a Mona Lisa?").
    *   **Perguntas 11 a 15 (Prêmio: R$ 100.000 a R$ 500.000):** DIFÍCEIS. Exigem conhecimento mais específico em áreas como ciências, história, geografia, artes ou literatura. As alternativas devem ser plausíveis para confundir o jogador.
    *   **Pergunta 16 (Prêmio: R$ 1.000.000):** PERGUNTA DO MILHÃO. Extremamente difícil e específica, sobre um detalhe pouco conhecido de um assunto complexo. A resposta não deve ser facilmente dedutível.

2.  **Variedade de Temas:** Em cada bloco de dificuldade, varie os temas das perguntas (história, geografia, ciências, cultura pop, artes, esportes, etc.). Não repita o mesmo tema em perguntas seguidas.

3.  **Formato de Saída OBRIGATÓRIO:**
    *   A saída DEVE ser um objeto JSON.
    *   O objeto principal deve ter uma chave "questions", que é um array de 16 objetos de pergunta.
    *   Cada objeto de pergunta deve ter EXATAMENTE as seguintes chaves: "question" (string), "options" (um objeto com chaves "A", "B", "C", "D"), e "correctAnswerKey" (uma string que seja "A", "B", "C", ou "D").

Gere o conjunto completo de 16 perguntas agora, seguindo estritamente a curva de dificuldade e o formato JSON especificado.`,
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
