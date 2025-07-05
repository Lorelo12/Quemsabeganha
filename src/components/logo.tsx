import { Clover } from 'lucide-react';

export function Logo() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 select-none">
      <Clover className="h-20 w-20 text-accent animate-pulse-slow" style={{ filter: 'drop-shadow(0 0 15px hsl(var(--accent) / 0.8))' }} />
      <h1 className="text-5xl md:text-7xl font-black tracking-wider" style={{ 
        color: 'white',
        textShadow: `
          -2px -2px 0 hsl(var(--accent)),  
           2px -2px 0 hsl(var(--accent)),
          -2px  2px 0 hsl(var(--accent)),
           2px  2px 0 hsl(var(--accent)),
           4px 4px 8px hsla(var(--foreground), 0.2)`
       }}>
        Quiz Milionário
      </h1>
    </div>
  );
}
