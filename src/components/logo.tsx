export function Logo() {
  return (
    <div className="flex justify-center">
      <svg
        viewBox="0 0 512 200"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full max-w-sm md:max-w-md drop-shadow-lg"
      >
        <defs>
          <linearGradient id="logo-gradient-front" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style={{ stopColor: 'hsl(var(--secondary))', stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: 'hsl(var(--primary))', stopOpacity: 1 }} />
          </linearGradient>
           <linearGradient id="logo-gradient-top" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style={{ stopColor: 'hsl(45, 100%, 85%)', stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: 'hsl(var(--secondary))', stopOpacity: 1 }} />
          </linearGradient>
           <linearGradient id="logo-gradient-side" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style={{ stopColor: 'hsl(var(--primary))', stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: 'hsl(45, 100%, 40%)', stopOpacity: 1 }} />
          </linearGradient>
          <filter id="logo-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="4" result="blur" />
            <feFlood
              floodColor="hsl(var(--primary))"
              floodOpacity="0.7"
              result="flood"
            />
            <feComposite in="flood" in2="blur" operator="in" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <g style={{ filter: 'url(#logo-glow)' }}>
          {/* 3D Gold Pile */}
          <g opacity="0.95" transform="translate(10, 45)">
            {/* Back row bar */}
            <g transform="translate(120 70) rotate(-2)">
              <polygon points="0,15 250,15 260,5 10,5" fill="url(#logo-gradient-top)" />
              <polygon points="250,15 260,5 260,35 250,45" fill="url(#logo-gradient-side)" />
              <polygon points="0,15 0,45 250,45 250,15" fill="url(#logo-gradient-front)" />
            </g>
            
            {/* Bottom left bar */}
            <g transform="translate(40 85) rotate(-10)">
              <polygon points="0,15 180,15 190,5 10,5" fill="url(#logo-gradient-top)" />
              <polygon points="180,15 190,5 190,35 180,45" fill="url(#logo-gradient-side)" />
              <polygon points="0,15 0,45 180,45 180,15" fill="url(#logo-gradient-front)" />
            </g>
            
            {/* Bottom right bar */}
             <g transform="translate(260 90) rotate(8)">
              <polygon points="0,15 200,15 210,5 10,5" fill="url(#logo-gradient-top)" />
              <polygon points="200,15 210,5 210,35 200,45" fill="url(#logo-gradient-side)" />
              <polygon points="0,15 0,45 200,45 200,15" fill="url(#logo-gradient-front)" />
            </g>

            {/* Middle front bar */}
             <g transform="translate(140 65) rotate(1)">
              <polygon points="0,20 230,20 245,5 15,5" fill="url(#logo-gradient-top)" />
              <polygon points="230,20 245,5 245,35 230,50" fill="url(#logo-gradient-side)" />
              <polygon points="0,20 0,50 230,50 230,20" fill="url(#logo-gradient-front)" />
            </g>
          </g>

          {/* Text */}
          <g transform="translate(0, -10)">
            <text
              x="50%"
              y="40%"
              dominantBaseline="middle"
              textAnchor="middle"
              fill="url(#logo-gradient-front)"
              fontFamily="var(--font-orbitron)"
              fontSize="60"
              fontWeight="900"
              letterSpacing="0.05em"
              stroke="hsl(var(--primary-foreground))"
              strokeWidth="1"
            >
              QUEM SABE,
            </text>
            <text
              x="50%"
              y="78%"
              dominantBaseline="middle"
              textAnchor="middle"
              fill="url(#logo-gradient-front)"
              fontFamily="var(--font-orbitron)"
              fontSize="88"
              fontWeight="900"
              letterSpacing="0.02em"
              stroke="hsl(var(--primary-foreground))"
              strokeWidth="1"
            >
              GANHA!
            </text>
          </g>
        </g>
      </svg>
    </div>
  );
}
