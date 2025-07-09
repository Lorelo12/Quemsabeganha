export function Logo() {
  return (
    <div className="flex justify-center items-center w-full max-w-md">
      <svg viewBox="0 0 500 350" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto">
        <defs>
          <linearGradient id="gold-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style={{stopColor: 'hsl(var(--secondary))', stopOpacity: 1}} />
            <stop offset="100%" style={{stopColor: 'hsl(var(--primary))', stopOpacity: 1}} />
          </linearGradient>
          <filter id="glow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="8 8" result="glow"/>
            <feMerge>
              <feMergeNode in="glow"/>
              <feMergeNode in="glow"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        {/* Emblem Background */}
        <path 
          d="M50 20 Q250 -20 450 20 L480 300 Q250 370 20 300 Z" 
          fill="hsl(var(--card))" 
          stroke="url(#gold-gradient)" 
          strokeWidth="5"
        />

        {/* Text */}
        <g fontFamily="var(--font-orbitron), sans-serif" textAnchor="middle" filter="url(#glow)">
          {/* Text Shadow for 3D effect */}
          <text x="250" y="115" fontSize="55" fill="#000" fillOpacity="0.5" fontWeight="900">QUEM SABE,</text>
          <text x="250" y="210" fontSize="110" fill="#000" fillOpacity="0.5" fontWeight="900">GANHA!</text>
          
          {/* Main Text */}
          <text x="248" y="112" fontSize="55" fill="url(#gold-gradient)" fontWeight="900">QUEM SABE,</text>
          <text x="248" y="207" fontSize="110" fill="url(#gold-gradient)" fontWeight="900">GANHA!</text>
        </g>
        
        {/* Gold Bar at the bottom */}
        <path 
            d="M100 290 L120 275 L380 275 L400 290 L380 305 L120 305 Z"
            fill="url(#gold-gradient)"
            stroke="hsl(var(--primary-foreground))"
            strokeWidth="1.5"
        />

        {/* Sparkle */}
        <g fill="white">
            <path d="M130 280 L135 275 L140 280 L135 285 Z" />
            <path d="M125 282 L130 277 L135 282 L130 287 Z" opacity="0.7"/>
        </g>
      </svg>
    </div>
  );
}
