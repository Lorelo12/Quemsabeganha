export function Logo() {
  return (
    <div className="flex justify-center">
      <svg
        viewBox="0 0 500 350"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full max-w-md drop-shadow-lg"
      >
        <defs>
          <linearGradient id="gold-grad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFF7B0" />
            <stop offset="50%" stopColor="#FFD700" />
            <stop offset="51%" stopColor="#FDB813" />
            <stop offset="100%" stopColor="#E6A100" />
          </linearGradient>
          <linearGradient id="gold-grad-border" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#E6A100" />
            <stop offset="100%" stopColor="#FDB813" />
          </linearGradient>
          <linearGradient id="gold-bar-top" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFF7B0" />
            <stop offset="100%" stopColor="#FFD700" />
          </linearGradient>
          <linearGradient id="gold-bar-front" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFD700" />
            <stop offset="100%" stopColor="#E6A100" />
          </linearGradient>

          <filter id="logo-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="5" result="blur" />
            <feFlood
              floodColor="hsl(var(--primary))"
              floodOpacity="0.8"
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
          {/* Background Emblem */}
          <path
            d="M 250,20 C 450,20 480,100 480,175 C 480,275 400,330 250,330 C 100,330 20,275 20,175 C 20,100 50,20 250,20 Z"
            fill="black"
            stroke="url(#gold-grad-border)"
            strokeWidth="12"
          />
          <path
            d="M 250,20 C 450,20 480,100 480,175 C 480,275 400,330 250,330 C 100,330 20,275 20,175 C 20,100 50,20 250,20 Z"
            fill="transparent"
            stroke="#FFF7B0"
            strokeWidth="2"
          />
          
          {/* Sparkles */}
          <g fill="url(#gold-grad)">
            <path transform="translate(100 70) scale(0.8)" d="m10.85,1.9a1.5,1.5 0 0 0 -1.7,0l-6.25,3.6a1.5,1.5 0 0 0 0,2.6l6.25,3.6a1.5,1.5 0 0 0 1.7,0l6.25,-3.6a1.5,1.5 0 0 0 0,-2.6l-6.25,-3.6z"/>
            <path transform="translate(380 70) scale(0.8)" d="m10.85,1.9a1.5,1.5 0 0 0 -1.7,0l-6.25,3.6a1.5,1.5 0 0 0 0,2.6l6.25,3.6a1.5,1.5 0 0 0 1.7,0l6.25,-3.6a1.5,1.5 0 0 0 0,-2.6l-6.25,-3.6z"/>
            <path transform="translate(80 270) scale(0.6)" d="m10.85,1.9a1.5,1.5 0 0 0 -1.7,0l-6.25,3.6a1.5,1.5 0 0 0 0,2.6l6.25,3.6a1.5,1.5 0 0 0 1.7,0l6.25,-3.6a1.5,1.5 0 0 0 0,-2.6l-6.25,-3.6z"/>
            <path transform="translate(420 270) scale(0.6)" d="m10.85,1.9a1.5,1.5 0 0 0 -1.7,0l-6.25,3.6a1.5,1.5 0 0 0 0,2.6l6.25,3.6a1.5,1.5 0 0 0 1.7,0l6.25,-3.6a1.5,1.5 0 0 0 0,-2.6l-6.25,-3.6z"/>
          </g>

          {/* Text Layers for 3D Effect */}
          <g
            fontFamily="var(--font-orbitron), sans-serif"
            fontWeight="900"
            textAnchor="middle"
            strokeLinejoin="round"
          >
            {/* Shadow */}
            <text x="253" y="113" fill="#000" opacity="0.5" fontSize="60">QUEM</text>
            <text x="253" y="183" fill="#000" opacity="0.5" fontSize="60">SABE</text>
            <text x="253" y="263" fill="#000" opacity="0.5" fontSize="80">GANHA!</text>
            
            {/* Main Text */}
            <text x="250" y="110" fill="url(#gold-grad)" stroke="#613400" strokeWidth="3" fontSize="60">QUEM</text>
            <text x="250" y="180" fill="url(#gold-grad)" stroke="#613400" strokeWidth="3" fontSize="60">SABE</text>
            <text x="250" y="260" fill="url(#gold-grad)" stroke="#613400" strokeWidth="4" fontSize="80">GANHA!</text>
          </g>
          
          {/* Gold Bar at the bottom */}
          <g transform="translate(160 270) rotate(-8)">
              <polygon points="0,5 180,0 185,15 5,20" fill="url(#gold-bar-top)"/>
              <polygon points="5,20 185,15 180,35 0,40" fill="url(#gold-bar-front)"/>
              <text 
                  x="92.5" y="18" textAnchor="middle" dominantBaseline="middle"
                  fontFamily="var(--font-orbitron)" fontSize="16" fontWeight="bold"
                  fill="#8C5C0B" transform="skewY(-5)">
                  GANHA.
              </text>
          </g>
        </g>
      </svg>
    </div>
  );
}
