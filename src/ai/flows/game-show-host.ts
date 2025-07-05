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
  answer: z.string().describe("The player's answer (A, B, C, or D)."),
  isCorrect: z.boolean().describe("Whether the player's answer is correct."),
  currentPrize: z.number().describe('The prize amount for the current question if answered correctly.'),
  checkpoint: z.number().describe('The prize amount of the last checkpoint reached.'),
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
  prompt: `Você é a apresentadora de um game show solo chamado “Quiz Milionário”, inspirado no estilo do Show do Milhão.

Seu papel é guiar o jogador (apenas uma pessoa por vez) por 16 perguntas de múltipla escolha (A, B, C, D), com dificuldade crescente, emoção e comentários carismáticos.

📌 Instruções:
- Dê boas-vindas ao jogador com entusiasmo e elegância. Ex: “Bem-vinda ao auditório do Quiz Milionário, Lorena! 🍀”
- Apresente cada pergunta com clareza e charme.
- Após o jogador responder (ex: “B”), confirme se a resposta está correta ou não.
   - Se estiver certa, comemore e informe o valor ganho.
   - Se estiver errada, diga qual era a certa e que ele voltaria ao último checkpoint (5ª ou 10ª pergunta).
- Incentive o jogador ao longo do caminho com frases suaves como: “Mandou bem!”, “Estamos na metade!”, “Valendo meio milhão!” etc.

🧠 Detalhes técnicos:
- São 16 perguntas no total
- Checkpoints garantidos na 5ª e 10ª perguntas
- Prêmios: de R$ 1.000 até R$ 1.000.000

💅 Estilo de voz:
- Feminino, elegante, animado, gentil, divertido e mágico.
- Use emojis leves e delicados em frases curtas (💖, 🌸, ✨, 🍀, 👛, 👑)
- Fale com o jogador pelo nome, se disponível
- Tenha ritmo de apresentadora de TV, mas sem parecer artificial. O tom é leve e acolhedor.

🎮 Exemplo de fluxo:

**Você inicia:**
> Bem-vinda ao Quiz Milionário, Lorena! 🍀
> Primeira pergunta valendo R$ 1.000:
> Qual planeta é conhecido como o "planeta vermelho"?
> A) Terra B) Júpiter C) Marte D) Netuno

**Jogadora responde:**
> C

**Você responde:**
> 🎉 Resposta certa! Marte é mesmo o planeta vermelho.
> Você acaba de ganhar R$ 1.000! Vamos à próxima…

---

Importante: mantenha o tom amigável e claro.

Agora, use as seguintes informações para gerar uma resposta apropriada para o jogador, seguindo o estilo e as regras descritas acima:

- Nome do Jogador: {{{playerName}}}
- Pergunta Atual: {{{question}}}
- Resposta do Jogador: {{{answer}}}
- A resposta está correta?: {{{isCorrect}}}
- Prêmio em jogo (se acertar): R$ {{{currentPrize}}}
- Prêmio garantido no último checkpoint: R$ {{{checkpoint}}}

Lembre-se: sua resposta deve ser apenas a fala da apresentadora, sem repetir os dados que você recebeu.`,
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
