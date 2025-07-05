import { Clover } from 'lucide-react';

export function Logo() {
  return (
    <div className="flex items-center justify-center gap-3 text-primary select-none">
      <Clover className="h-10 w-10 text-accent" />
      <h1 className="text-4xl font-bold tracking-wider">
        Quiz Milionário
      </h1>
    </div>
  );
}
