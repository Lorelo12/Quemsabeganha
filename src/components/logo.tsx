import { Clover } from 'lucide-react';

export function Logo() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 text-primary-foreground select-none">
      <Clover className="h-16 w-16 text-primary animate-pulse-slow" style={{ filter: 'drop-shadow(0 0 10px hsl(var(--primary)))' }} />
      <h1 className="text-5xl md:text-7xl font-bold tracking-wider" style={{ textShadow: '2px 2px 8px hsl(var(--background) / 0.8)' }}>
        Quiz Milionário
      </h1>
    </div>
  );
}
