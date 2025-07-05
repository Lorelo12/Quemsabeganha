import GameClient from '@/components/game-client';
import { PrizeLadder } from '@/components/prize-ladder';
import { PRIZE_TIERS } from '@/lib/questions';

export default function Home() {
  return (
    <main className="min-h-screen w-full">
      <GameClient />
    </main>
  );
}
