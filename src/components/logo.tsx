import { Sparkles } from 'lucide-react';

export function Logo() {
  return (
    <div className="flex flex-col items-center select-none gap-2 text-center">
      <div className="flex w-full max-w-md items-center justify-center gap-4 md:gap-6">
        <div className="h-1 flex-grow bg-primary rounded-full box-glow-primary animate-pulse-slow"></div>
        <h1 className="font-display font-bold uppercase text-primary text-glow-primary animate-pulse-glow shrink-0">
          <span className="block text-4xl md:text-5xl tracking-widest">Quem Sabe</span>
          <span className="block text-6xl md:text-8xl leading-none">Ganha!</span>
        </h1>
        <div className="h-1 flex-grow bg-primary rounded-full box-glow-primary animate-pulse-slow"></div>
      </div>
      <Sparkles className="w-10 h-10 text-primary mt-2" style={{ filter: 'drop-shadow(0 0 10px hsl(var(--primary)))' }}/>
    </div>
  );
}
