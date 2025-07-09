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

        {/* Text */}
        <g fontFamily="var(--font-orbitron), sans-serif" textAnchor="middle" filter="url(#glow)">
          {/* Text Shadow for 3D effect */}
          <text x="250" y="115" fontSize="55" fill="#000" fillOpacity="0.5" fontWeight="900">QUEM SABE,</text>
          <text x="250" y="210" fontSize="110" fill="#000" fillOpacity="0.5" fontWeight="900">GANHA!</text>
          
          {/* Main Text */}
          <text x="248" y="112" fontSize="55" fill="url(#gold-gradient)" fontWeight="900">QUEM SABE,</text>
          <text x="248" y="207" fontSize="110" fill="url(#gold-gradient)" fontWeight="900">GANHA!</text>
        </g>
      </svg>
    </div>
  );
}
