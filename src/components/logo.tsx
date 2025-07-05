import { Clover } from 'lucide-react';

export function Logo() {
  return (
    <div className="flex flex-col items-center select-none gap-2">
      <div className="flex items-center gap-4">
        <Clover className="w-16 h-16 text-primary" style={{ filter: 'drop-shadow(0 0 10px hsl(var(--primary)))' }}/>
        <h1 className="font-black uppercase">
          <span className="block text-7xl md:text-8xl text-primary text-shadow-neon-pink leading-none">Quiz</span>
          <span className="block text-6xl md:text-7xl text-secondary text-shadow-neon-yellow leading-none">Milionário</span>
        </h1>
      </div>
      <div className="flex items-center gap-2">
        <div className="h-0.5 w-10 bg-gradient-to-l from-primary/50 to-transparent"></div>
        <div className="flex gap-1.5">
            <div className="h-1 w-1 bg-primary rounded-full"></div>
            <div className="h-1 w-1 bg-primary rounded-full"></div>
            <div className="h-1 w-1 bg-primary rounded-full"></div>
        </div>
        <div className="h-0.5 w-10 bg-gradient-to-r from-primary/50 to-transparent"></div>
      </div>
    </div>
  );
}
