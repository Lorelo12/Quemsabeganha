import { Sparkles } from 'lucide-react';

export function Logo() {
  return (
    <div className="flex flex-col items-center select-none gap-2 text-center">
      <h1 className="font-display font-bold uppercase text-primary text-glow-primary animate-pulse-glow">
        <span className="block text-4xl md:text-5xl tracking-widest">Quem Sabe</span>
        <span className="block text-6xl md:text-8xl leading-none">Ganha!</span>
      </h1>
      <Sparkles className="w-10 h-10 text-primary" style={{ filter: 'drop-shadow(0 0 10px hsl(var(--primary)))' }}/>
    </div>
  );
}
