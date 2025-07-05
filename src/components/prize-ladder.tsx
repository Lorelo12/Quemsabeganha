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
    <Card className="shadow-lg h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 justify-center font-headline text-2xl">
          <Trophy className="text-accent" />
          Prêmios
        </CardTitle>
      </CardHeader>
      <CardContent>
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
                    'flex items-center justify-between p-3 rounded-md transition-all duration-300',
                    isCurrent && 'bg-accent text-accent-foreground scale-105 shadow-lg',
                    isPast && 'bg-green-200 text-green-800',
                    prize.isCheckpoint && 'font-bold',
                    !isCurrent && !isPast && 'bg-primary/10'
                  )}
                >
                  <div className="flex items-center gap-2">
                    {prize.isCheckpoint && <Star className="h-5 w-5 text-yellow-500" />}
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
