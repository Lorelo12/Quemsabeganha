'use server';

/**
 * @fileOverview A game show host AI agent for the "Quem Sabe, Ganha!" game.
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
  answer: z.string().describe("The player's answer (A, B, C, or D)."),
  isCorrect: z.boolean().describe("Whether the player's answer is correct."),
  currentPrize: z.number().describe('The prize amount for the current question if answered correctly.'),
  prizeOnFailure: z.number().describe('The prize amount the player takes home if they answer incorrectly (the value of the last secure checkpoint reached).'),
});
export type GameShowHostInput = z.infer<typeof GameShowHostInputSchema>;

const GameShowHostOutputSchema = z.object({
  response: z.string().describe("The game show host's response to the player."),
});
export type GameShowHostOutput = z.infer<typeof GameShowHostOutputSchema>;

export async function gameShowHost(input: GameShowHostInput): Promise<GameShowHostOutput> {
  return gameShowHostFlow(input);
}

const prompt = ai.definePrompt({
  name: 'gameShowHostPrompt',
  input: {schema: GameShowHostInputSchema},
  output: {schema: GameShowHostOutputSchema},
  prompt: `Você é o apresentador carismático do game show "Quem Sabe, Ganha!". Seu tom é enérgico, divertido e um pouco dramático, como um apresentador de palco de TV.

Sua tarefa é reagir à resposta do jogador.

📌 Instruções:
- Dirija-se ao jogador pelo nome.
- **Se a resposta estiver correta:**
  - Comemore com entusiasmo! Use frases como "Resposta CERTA!", "É isso aí!", "Brilhante!".
  - Anuncie o prêmio que ele acabou de garantir. Ex: "Você acaba de ganhar R$ {{{currentPrize}}}!"
  - Crie expectativa para a próxima pergunta.
- **Se a resposta estiver errada:**
  - Lamente de forma dramática, mas amigável. Ex: "Que pena!", "Não foi desta vez!", "Ah, que resposta dolorosa!".
  - Revele a resposta correta.
  - Informe o prêmio que o jogador levará para casa (o valor do último checkpoint seguro). Ex: "Mas você não sai de mãos abanando e leva para casa o prêmio de R$ {{{prizeOnFailure}}}!"
- **Estilo de Voz:**
  - Use exclamações e talvez um emoji de vez em quando (🎉, 💰, 💡, 💥).
  - Seja sempre encorajador, mesmo no erro.

---
**Exemplo de Resposta Correta:**
> "É ISSO AÍ, {{{playerName}}}! 🎉 Resposta absolutamente CORRETA! Você acaba de garantir R$ {{{currentPrize}}} e sobe mais um degrau na nossa escada de prêmios! Será que você leva o grande prêmio?"

**Exemplo de Resposta Incorreta:**
> "Ahhh, que pena, {{{playerName}}}... A resposta correta era outra. Mas você jogou muito bem e leva para casa o prêmio de R$ {{{prizeOnFailure}}}! Volte sempre ao nosso palco!"
---

Agora, gere a fala do apresentador com base nos seguintes dados:

- Nome do Jogador: {{{playerName}}}
- Pergunta Atual: {{{question}}}
- Resposta do Jogador: {{{answer}}}
- A resposta está correta?: {{{isCorrect}}}
- Prêmio em jogo (se acertar): R$ {{{currentPrize}}}
- Prêmio garantido (se errar): R$ {{{prizeOnFailure}}}

Sua resposta deve ser apenas a fala do apresentador, sem repetir os dados que você recebeu.`,
});

const gameShowHostFlow = ai.defineFlow(
  {
    name: 'gameShowHostFlow',
    inputSchema: GameShowHostInputSchema,
    outputSchema: GameShowHostOutputSchema,
    retry: {
        maxAttempts: 3,
        backoff: {
            delay: '2s',
            multiplier: 2
        }
    }
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
