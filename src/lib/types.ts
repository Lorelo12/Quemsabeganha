export interface Question {
  question: string;
  options: { [key: string]: string };
  correctAnswerKey: string;
}

export interface PrizeTier {
  amount: number;
  label: string;
  isCheckpoint: boolean;
}
