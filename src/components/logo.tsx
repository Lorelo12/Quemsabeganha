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
            <text x="253" y="103" fill="#000" opacity="0.5" fontSize="40">QUEM SABE</text>
            <text x="253" y="198" fill="#000" opacity="0.5" fontSize="100">GANHA!</text>
            
            {/* Main Text */}
            <text x="250" y="100" fill="url(#gold-grad)" stroke="#613400" strokeWidth="2" fontSize="40">QUEM SABE</text>
            <text x="250" y="195" fill="url(#gold-grad)" stroke="#613400" strokeWidth="5" fontSize="100">GANHA!</text>
          </g>
          
          {/* Gold Bar Pile */}
          <g transform="translate(130, 240)">
            {/* Bar 1 (bottom left) */}
            <g transform="rotate(-10)">
              <polygon points="0,5 180,0 185,20 5,25" fill="url(#gold-bar-top)"/>
              <polygon points="5,25 185,20 180,40 0,45" fill="url(#gold-bar-front)"/>
            </g>
            {/* Bar 2 (bottom right) */}
            <g transform="translate(80, 15) rotate(5)">
              <polygon points="0,5 180,0 185,20 5,25" fill="url(#gold-bar-top)"/>
              <polygon points="5,25 185,20 180,40 0,45" fill="url(#gold-bar-front)"/>
            </g>
             {/* Bar 3 (top) */}
            <g transform="translate(30, -15) rotate(-5)">
              <polygon points="0,5 200,0 205,20 5,25" fill="url(#gold-bar-top)"/>
              <polygon points="5,25 205,20 200,40 0,45" fill="url(#gold-bar-front)"/>
            </g>
          </g>
        </g>
      </svg>
    </div>
  );
}
