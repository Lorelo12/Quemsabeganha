import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { PrizeTier } from '@/lib/types';
import { Star, Trophy, Lock, Crown } from 'lucide-react';

interface PrizeLadderProps {
  prizes: PrizeTier[];
  currentQuestionIndex: number;
}

export function PrizeLadder({ prizes, currentQuestionIndex }: PrizeLadderProps) {
  return (
    <Card className="shadow-lg h-full bg-card/70 backdrop-blur-sm border-2 border-primary/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 justify-center text-2xl text-accent-foreground font-bold">
          <Trophy className="text-accent" />
          Prêmios
        </CardTitle>
      </CardHeader>
      <CardContent className="px-2">
        <ul className="space-y-1">
          {prizes
            .slice()
            .reverse()
            .map((prize, index) => {
              const questionNumber = prizes.length - 1 - index;
              const isCurrent = questionNumber === currentQuestionIndex;
              const isPast = questionNumber < currentQuestionIndex;
              const isTopPrize = questionNumber === prizes.length - 1;

              return (
                <li
                  key={prize.amount}
                  className={cn(
                    'flex items-center justify-between p-2 rounded-md transition-all duration-300 font-medium',
                    isCurrent && 'bg-primary/80 text-primary-foreground scale-105 shadow-lg shadow-primary/50 animate-pulse',
                    isPast && 'opacity-50',
                    prize.isCheckpoint && !isCurrent && 'font-bold bg-primary/20',
                    !isCurrent && !isPast && !prize.isCheckpoint && 'bg-muted/50'
                  )}
                >
                  <div className="flex items-center gap-3">
                     {isTopPrize ? (
                        <Crown className="h-5 w-5 text-accent" />
                      ) : prize.isCheckpoint ? (
                        <Lock className="h-5 w-5 text-pink-400" />
                      ) : (
                        <Star className="h-5 w-5 text-accent/50" />
                      )}
                    <span className="font-bold">{prizes.length - index}</span>
                  </div>
                  <div className="flex flex-col items-end leading-tight">
                    <span>R$ {prize.label}</span>
                     {prize.isCheckpoint && (
                      <span className="text-xs font-normal opacity-90">Garantido 💖</span>
                    )}
                  </div>
                </li>
              );
            })}
        </ul>
        <p className="text-center text-xs text-muted-foreground mt-4">Valores Fictícios</p>
      </CardContent>
    </Card>
  );
}
