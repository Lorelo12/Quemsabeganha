// use server'
'use server';

/**
 * @fileOverview A game show host AI agent for the Milionário Quiz game.
 *
 * - gameShowHost - A function that generates enthusiastic and personalized responses for the game.
 * - GameShowHostInput - The input type for the gameShowHost function.
 * - GameShowHostOutput - The return type for the gameShowHost function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GameShowHostInputSchema = z.object({
  playerName: z.string().describe('The name of the player.'),
  question: z.string().describe('The current question being asked.'),
  answer: z.string().describe('The player\'s answer (A, B, C, or D).'),
  isCorrect: z.boolean().describe('Whether the player\'s answer is correct.'),
  currentPrize: z.number().describe('The current prize amount the player has won.'),
  checkpoint: z.number().describe('The last checkpoint reached (0, 5, or 10).'),
});
export type GameShowHostInput = z.infer<typeof GameShowHostInputSchema>;

const GameShowHostOutputSchema = z.object({
  response: z.string().describe('The game show host\'s response to the player.'),
});
export type GameShowHostOutput = z.infer<typeof GameShowHostOutputSchema>;

export async function gameShowHost(input: GameShowHostInput): Promise<GameShowHostOutput> {
  return gameShowHostFlow(input);
}

const prompt = ai.definePrompt({
  name: 'gameShowHostPrompt',
  input: {schema: GameShowHostInputSchema},
  output: {schema: GameShowHostOutputSchema},
  prompt: `Você é a apresentadora de um game show chamado “Quiz Milionário”, inspirado no Show do Milhão. Seu papel é guiar os jogadores pelas 16 perguntas do jogo com carisma, humor leve e empolgação, como se estivesse em um auditório de TV.

⚙️ Regras do jogo:
- O jogador responde 16 perguntas, com dificuldade crescente.
- Cada pergunta tem 4 alternativas: A, B, C, D.
- Após a resposta, você confirma se foi correta e informa o valor simulado ganho.
- Se errar, informe que ele voltaria ao último checkpoint (pergunta 5 ou 10).
- Use frases animadas, como “Parabéns!”, “Essa foi difícil, hein?”, “Que pena!” etc.

🎯 Objetivo:
Criar uma experiência de entretenimento simulada, divertida e empolgante. Deixe claro que os prêmios são fictícios e o jogo é só para diversão.

💛 Estilo da apresentadora:
- Voz amigável, energética e com empatia
- Use emojis sutis quando estiver no chat
- Fale com o jogador pelo nome

Agora, use as seguintes informações para gerar uma resposta apropriada para o jogador:

Nome do Jogador: {{{playerName}}}
Pergunta: {{{question}}}
Resposta do Jogador: {{{answer}}}
Resposta Correta: {{{isCorrect}}}
Prêmio Atual: R$ {{{currentPrize}}} (fictícios)
Checkpoint: Pergunta {{{checkpoint}}}

Lembre-se: Sempre deixe claro que é um jogo fictício. Não há prêmios reais.
`,
});

const gameShowHostFlow = ai.defineFlow(
  {
    name: 'gameShowHostFlow',
    inputSchema: GameShowHostInputSchema,
    outputSchema: GameShowHostOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
