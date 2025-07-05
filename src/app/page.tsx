import GameClient from '@/components/game-client';

export default function Home() {
  return (
    <main className="flex min-h-screen w-full flex-col items-center justify-center bg-background p-2 sm:p-4 md:p-8">
      <GameClient />
    </main>
  );
}
