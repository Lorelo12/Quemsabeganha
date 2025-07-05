import GameClient from '@/components/game-client';

export default function Home() {
  return (
    <main className="flex min-h-screen w-full flex-col bg-background">
      <GameClient />
    </main>
  );
}
