import type { PrizeTier } from './types';

export const PRIZE_TIERS: PrizeTier[] = [
  // 1-5
  { amount: 1000, label: '1.000', isCheckpoint: false },
  { amount: 2000, label: '2.000', isCheckpoint: false },
  { amount: 3000, label: '3.000', isCheckpoint: false },
  { amount: 4000, label: '4.000', isCheckpoint: false },
  { amount: 5000, label: '5.000', isCheckpoint: true }, // Question 5
  // 6-10
  { amount: 10000, label: '10.000', isCheckpoint: false },
  { amount: 20000, label: '20.000', isCheckpoint: false },
  { amount: 30000, label: '30.000', isCheckpoint: false },
  { amount: 40000, label: '40.000', isCheckpoint: false },
  { amount: 50000, label: '50.000', isCheckpoint: true }, // Question 10
  // 11-15
  { amount: 100000, label: '100.000', isCheckpoint: false },
  { amount: 200000, label: '200.000', isCheckpoint: false },
  { amount: 300000, label: '300.000', isCheckpoint: false },
  { amount: 400000, label: '400.000', isCheckpoint: false },
  { amount: 500000, label: '500.000', isCheckpoint: false },
  // 16
  { amount: 1000000, label: '1 MILHÃO', isCheckpoint: false },
];

// This file is intentionally left with only PRIZE_TIERS.
// The questions are now generated dynamically by an AI flow.
