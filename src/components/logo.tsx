import { Clover } from 'lucide-react';

export function Logo() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 select-none">
      <Clover className="h-20 w-20 text-accent animate-pulse-slow" style={{ filter: 'drop-shadow(0 0 15px hsl(var(--accent) / 0.8))' }} />
      <h1 className="text-5xl md:text-7xl font-bold tracking-wider" style={{ 
        color: '#FFFDF4',
        textShadow: '-1.5px -1.5px 0 hsl(var(--accent)), 1.5px -1.5px 0 hsl(var(--accent)), -1.5px 1.5px 0 hsl(var(--accent)), 1.5px 1.5px 0 hsl(var(--accent)), 4px 4px 6px hsl(var(--primary) / 0.7)'
       }}>
        Quiz Milionário
      </h1>
    </div>
  );
}
