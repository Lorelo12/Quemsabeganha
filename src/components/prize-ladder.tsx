import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { PrizeTier } from '@/lib/types';
import { Star, Trophy } from 'lucide-react';

interface PrizeLadderProps {
  prizes: PrizeTier[];
  currentQuestionIndex: number;
}

export function PrizeLadder({ prizes, currentQuestionIndex }: PrizeLadderProps) {
  return (
    <Card className="shadow-lg h-full bg-card/80 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 justify-center text-2xl text-primary-foreground">
          <Trophy className="text-primary" />
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

              return (
                <li
                  key={prize.amount}
                  className={cn(
                    'flex items-center justify-between p-2 rounded-md transition-all duration-300 text-sm',
                    isCurrent && 'bg-primary text-primary-foreground scale-105 shadow-lg shadow-primary/50',
                    isPast && 'opacity-50',
                    prize.isCheckpoint && 'font-bold text-primary-foreground',
                    !isCurrent && !isPast && 'bg-muted/50'
                  )}
                >
                  <div className="flex items-center gap-3">
                     {prize.isCheckpoint ? <Star className="h-5 w-5 text-yellow-400 fill-yellow-400" /> : <span className="w-5 h-5" />}
                    <span>{prizes.length - index}</span>
                  </div>
                  <span>R$ {prize.label}</span>
                </li>
              );
            })}
        </ul>
        <p className="text-center text-xs text-muted-foreground mt-4">Valores Fictícios</p>
      </CardContent>
    </Card>
  );
}
