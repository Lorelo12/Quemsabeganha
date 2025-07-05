import { Crown, Sparkles } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PRIZE_TIERS } from '@/lib/questions';
import { cn } from '@/lib/utils';

export function PrizeTable() {
    const tiers = PRIZE_TIERS.slice().reverse();

    return (
        <Card className="bg-black/30 border-2 border-primary/50 rounded-2xl p-4 w-full max-w-lg mx-auto">
            <CardHeader className="p-2">
                <CardTitle className="flex items-center justify-center gap-2 text-2xl font-bold text-primary text-shadow-neon-pink">
                    <Crown className="w-8 h-8"/>
                    TABELA DE PRÊMIOS
                </CardTitle>
            </CardHeader>
            <CardContent className="p-2">
                <div className="grid grid-cols-2 gap-2 text-center">
                    {tiers.map((tier, index) => {
                        const isMillion = tier.amount === 1000000;
                        const isCheckpoint = tier.amount === 50000;

                        return (
                        <div key={tier.amount} className={cn(
                            "p-2 rounded-lg border border-transparent text-white font-semibold",
                             isMillion && "bg-primary/80 border-primary text-shadow-neon-pink col-span-2",
                             isCheckpoint && "bg-secondary/80 border-secondary text-shadow-neon-yellow"
                        )}>
                            <span>{16 - index}º: R$ {tier.label}</span>
                        </div>
                    )})}
                </div>
                <p className="text-center text-sm text-primary mt-4 flex items-center justify-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    Checkpoints seguros nas perguntas 5 e 10
                </p>
            </CardContent>
        </Card>
    );
}
