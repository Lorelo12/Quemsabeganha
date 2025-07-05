import { Crown, Sparkles } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PRIZE_TIERS } from '@/lib/questions';
import { cn } from '@/lib/utils';

export function PrizeTable() {
    const firstHalf = PRIZE_TIERS.slice(0, 8);
    const secondHalf = PRIZE_TIERS.slice(8, 16);

    const renderTier = (tier: (typeof PRIZE_TIERS)[0], originalIndex: number) => {
        const isMillion = tier.amount === 1000000;
        const isCheckpoint = tier.isCheckpoint;

        return (
            <div
                key={tier.amount}
                className={cn(
                    'p-1.5 rounded-md border border-transparent text-white font-semibold bg-black/40 text-sm',
                    isMillion && 'bg-primary/80 border-primary text-shadow-neon-pink',
                    isCheckpoint && 'bg-secondary/80 border-secondary text-shadow-neon-yellow'
                )}
            >
                <span className="flex justify-between px-2">
                    <span>{originalIndex + 1}</span>
                    <span>R$ {tier.label}</span>
                </span>
            </div>
        );
    };

    return (
        <Card className="bg-black/30 border-2 border-primary/50 rounded-2xl p-4 w-full max-w-sm mx-auto">
            <CardHeader className="p-2 mb-2">
                <CardTitle className="flex items-center justify-center gap-2 text-2xl font-bold text-primary text-shadow-neon-pink">
                    <Crown className="w-8 h-8" />
                    TABELA DE PRÊMIOS
                </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
                <div className="grid grid-cols-2 gap-x-2">
                    <div className="flex flex-col-reverse gap-1.5">
                        {firstHalf.map((tier, index) => renderTier(tier, index))}
                    </div>
                    <div className="flex flex-col-reverse gap-1.5">
                        {secondHalf.map((tier, index) => renderTier(tier, index + 8))}
                    </div>
                </div>
                <p className="text-center text-xs text-white/70 mt-4 flex items-center justify-center gap-2">
                    <Sparkles className="w-4 h-4 text-secondary" />
                    Checkpoints seguros nas perguntas 5 e 10.
                </p>
            </CardContent>
        </Card>
    );
}
