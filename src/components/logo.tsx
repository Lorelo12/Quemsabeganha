export function Logo() {
  return (
    <div className="flex justify-center">
      <svg
        viewBox="0 0 512 200"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full max-w-sm md:max-w-md drop-shadow-lg"
      >
        <defs>
          <linearGradient id="logo-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop
              offset="0%"
              style={{ stopColor: 'hsl(var(--secondary))', stopOpacity: 1 }}
            />
            <stop
              offset="100%"
              style={{ stopColor: 'hsl(var(--primary))', stopOpacity: 1 }}
            />
          </linearGradient>
          <filter id="logo-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="3" result="blur" />
            <feFlood
              floodColor="hsl(var(--primary))"
              floodOpacity="0.5"
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
          {/* Gold Pile */}
          <g opacity="0.8" transform="translate(0, 30)">
            <rect x="50" y="100" width="180" height="30" rx="8" fill="url(#logo-gradient)" transform="rotate(-15 140 115)"/>
            <rect x="150" y="110" width="220" height="40" rx="8" fill="url(#logo-gradient)" transform="rotate(5 260 130)"/>
            <rect x="280" y="95" width="180" height="35" rx="8" fill="url(#logo-gradient)" transform="rotate(20 370 112)"/>
            <rect x="100" y="130" width="300" height="50" rx="10" fill="url(#logo-gradient)" />
          </g>

          {/* Text */}
          <text
            x="50%"
            y="40%"
            dominantBaseline="middle"
            textAnchor="middle"
            fill="url(#logo-gradient)"
            fontFamily="var(--font-orbitron)"
            fontSize="60"
            fontWeight="900"
            letterSpacing="0.05em"
            stroke="hsl(var(--primary-foreground))"
            strokeWidth="0.5"
          >
            QUEM SABE,
          </text>
          <text
            x="50%"
            y="78%"
            dominantBaseline="middle"
            textAnchor="middle"
            fill="url(#logo-gradient)"
            fontFamily="var(--font-orbitron)"
            fontSize="88"
            fontWeight="900"
            letterSpacing="0.02em"
            stroke="hsl(var(--primary-foreground))"
            strokeWidth="0.5"
          >
            GANHA!
          </text>
        </g>
      </svg>
    </div>
  );
}
