'use client';

import { PRIZE_TIERS } from '@/lib/questions';
import { cn } from '@/lib/utils';
import { ShieldCheck, Trophy } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface PrizeLadderProps {
  currentQuestionIndex: number;
}

export function PrizeLadder({ currentQuestionIndex }: PrizeLadderProps) {
  return (
    <Card className="w-full bg-card/80 border-2 border-secondary/50 rounded-xl p-2 h-full">
      <div className="flex flex-col-reverse justify-end h-full">
        {PRIZE_TIERS.map((tier, index) => {
          const isCurrent = index === currentQuestionIndex;
          const isPast = index < currentQuestionIndex;
          const isCheckpoint = tier.isCheckpoint;
          const isMillion = index === PRIZE_TIERS.length - 1;
          
          return (
            <div
              key={tier.amount}
              className={cn(
                "flex items-center justify-between text-lg font-sans rounded-md p-1.5 transition-all duration-300 my-0.5",
                isCurrent && "bg-primary text-primary-foreground scale-105 font-bold box-glow-primary z-10",
                !isCurrent && isPast && "text-white/40",
                !isCurrent && !isPast && "text-white/80",
                isCheckpoint && !isCurrent && "font-semibold text-primary/80",
                isMillion && !isCurrent && "font-bold text-primary text-glow-primary"
              )}
            >
              <div className="flex items-center gap-3">
                <span className={cn("w-6 text-right font-mono text-sm", isCurrent ? "text-primary-foreground/80" : "text-primary/80")}>
                  {index + 1}
                </span>
                <span>R$ {tier.amount.toLocaleString('pt-BR')}</span>
              </div>
              {isCheckpoint && <ShieldCheck className={cn("w-5 h-5", isCurrent ? "text-primary-foreground" : "text-primary")} />}
              {isMillion && <Trophy className={cn("w-5 h-5", isCurrent ? "text-primary-foreground" : "text-primary")} />}
            </div>
          );
        })}
      </div>
    </Card>
  );
}
