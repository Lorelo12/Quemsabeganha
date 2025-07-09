import { z } from 'zod';

export const QuestionSchema = z.object({
  question: z.string().describe('The question text.'),
  options: z.object({
    A: z.string(),
    B: z.string(),
    C: z.string(),
    D: z.string(),
  }).describe('The multiple choice options.'),
  correctAnswerKey: z.enum(['A', 'B', 'C', 'D']).describe('The key of the correct answer.'),
});
export type Question = z.infer<typeof QuestionSchema>;


export interface PrizeTier {
  amount: number;
  label: string;
  isCheckpoint: boolean;
}

export interface LifelineState {
  skip: number;
  cards: boolean;
  audience: boolean;
  experts: boolean;
}

export type LeaderboardEntry = {
  player_name: string;
  score: number;
};
