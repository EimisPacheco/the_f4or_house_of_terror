export const generateBatSVG = (): string => {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="200" height="120" viewBox="0 0 200 120">
      <defs>
        <radialGradient id="batGradient" cx="50%" cy="50%">
          <stop offset="0%" style="stop-color:#1a1a1a;stop-opacity:1"/>
          <stop offset="100%" style="stop-color:#000000;stop-opacity:1"/>
        </radialGradient>
        
        <filter id="batGlow">
          <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      
      <!-- Left Wing -->
      <path d="M 100 60
               Q 70 40, 40 50
               Q 20 55, 10 70
               Q 5 80, 15 85
               Q 25 88, 35 82
               Q 50 75, 65 70
               Q 80 65, 90 62
               Z"
            fill="url(#batGradient)"
            stroke="#4a0e0e"
            stroke-width="1"
            filter="url(#batGlow)"/>
      
      <!-- Right Wing -->
      <path d="M 100 60
               Q 130 40, 160 50
               Q 180 55, 190 70
               Q 195 80, 185 85
               Q 175 88, 165 82
               Q 150 75, 135 70
               Q 120 65, 110 62
               Z"
            fill="url(#batGradient)"
            stroke="#4a0e0e"
            stroke-width="1"
            filter="url(#batGlow)"/>
      
      <!-- Body -->
      <ellipse cx="100" cy="65" rx="12" ry="18" fill="#0a0a0a" stroke="#4a0e0e" stroke-width="1"/>
      
      <!-- Head -->
      <circle cx="100" cy="50" r="10" fill="#0a0a0a" stroke="#4a0e0e" stroke-width="1"/>
      
      <!-- Ears -->
      <path d="M 95 45 L 92 38 L 96 42 Z" fill="#0a0a0a"/>
      <path d="M 105 45 L 108 38 L 104 42 Z" fill="#0a0a0a"/>
      
      <!-- Eyes (red glow) -->
      <circle cx="96" cy="50" r="2" fill="#ff0000" filter="url(#batGlow)"/>
      <circle cx="104" cy="50" r="2" fill="#ff0000" filter="url(#batGlow)"/>
      
      <!-- Wing details -->
      <path d="M 40 60 Q 30 65, 25 72" stroke="#2a0a0a" stroke-width="1" fill="none"/>
      <path d="M 50 65 Q 40 70, 35 77" stroke="#2a0a0a" stroke-width="1" fill="none"/>
      <path d="M 160 60 Q 170 65, 175 72" stroke="#2a0a0a" stroke-width="1" fill="none"/>
      <path d="M 150 65 Q 160 70, 165 77" stroke="#2a0a0a" stroke-width="1" fill="none"/>
    </svg>
  `;
  
  return 'data:image/svg+xml;base64,' + btoa(svg);
};
