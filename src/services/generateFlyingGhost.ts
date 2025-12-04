export const generateFlyingGhostSVG = (): string => {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="300" height="400" viewBox="0 0 300 400">
      <defs>
        <!-- Ethereal glow effect -->
        <filter id="etherealGlow">
          <feGaussianBlur stdDeviation="8" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
        
        <!-- Wispy texture -->
        <filter id="wispy">
          <feTurbulence type="fractalNoise" baseFrequency="0.02" numOctaves="3" seed="2"/>
          <feDisplacementMap in="SourceGraphic" scale="15"/>
        </filter>
        
        <!-- Gradient for depth -->
        <radialGradient id="ghostGradient" cx="50%" cy="30%">
          <stop offset="0%" style="stop-color:#e0f2ff;stop-opacity:0.95"/>
          <stop offset="40%" style="stop-color:#bae6fd;stop-opacity:0.85"/>
          <stop offset="70%" style="stop-color:#7dd3fc;stop-opacity:0.6"/>
          <stop offset="100%" style="stop-color:#0ea5e9;stop-opacity:0.2"/>
        </radialGradient>
        
        <!-- Shadow gradient -->
        <radialGradient id="shadowGradient" cx="50%" cy="50%">
          <stop offset="0%" style="stop-color:#1e293b;stop-opacity:0.4"/>
          <stop offset="100%" style="stop-color:#1e293b;stop-opacity:0"/>
        </radialGradient>
      </defs>
      
      <!-- Outer glow aura -->
      <ellipse cx="150" cy="150" rx="140" ry="180" fill="url(#shadowGradient)" filter="url(#etherealGlow)"/>
      
      <!-- Main ghost body - flowing sheet shape -->
      <path d="M 150 40
               C 120 40, 90 60, 80 90
               C 70 120, 75 150, 70 180
               C 65 210, 60 240, 65 270
               C 68 290, 75 310, 85 330
               Q 90 345, 95 360
               C 98 370, 100 380, 105 385
               Q 110 380, 115 385
               C 120 390, 125 385, 130 380
               Q 135 375, 140 380
               C 145 385, 150 390, 155 385
               Q 160 380, 165 385
               C 170 390, 175 385, 180 380
               Q 185 375, 190 380
               C 195 385, 200 390, 205 385
               Q 210 380, 215 385
               C 218 380, 220 370, 223 360
               Q 228 345, 233 330
               C 243 310, 250 290, 253 270
               C 258 240, 253 210, 248 180
               C 243 150, 248 120, 238 90
               C 228 60, 198 40, 168 40
               C 162 40, 156 40, 150 40 Z"
            fill="url(#ghostGradient)"
            filter="url(#wispy)"
            opacity="0.9"/>
      
      <!-- Flowing fabric details - left side -->
      <path d="M 80 120
               Q 60 140, 55 170
               Q 52 200, 60 230
               Q 65 250, 75 270
               C 80 280, 85 290, 90 300"
            fill="none"
            stroke="#bae6fd"
            stroke-width="2"
            opacity="0.5"
            filter="url(#etherealGlow)"/>
      
      <!-- Flowing fabric details - right side -->
      <path d="M 238 120
               Q 258 140, 263 170
               Q 266 200, 258 230
               Q 253 250, 243 270
               C 238 280, 233 290, 228 300"
            fill="none"
            stroke="#bae6fd"
            stroke-width="2"
            opacity="0.5"
            filter="url(#etherealGlow)"/>
      
      <!-- Head/hood area with more definition -->
      <ellipse cx="150" cy="80" rx="55" ry="65" fill="#f0f9ff" opacity="0.7" filter="url(#etherealGlow)"/>
      
      <!-- Dark hollow eyes -->
      <ellipse cx="130" cy="75" rx="10" ry="15" fill="#0f172a" opacity="0.9"/>
      <ellipse cx="170" cy="75" rx="10" ry="15" fill="#0f172a" opacity="0.9"/>
      
      <!-- Eerie eye glow -->
      <ellipse cx="130" cy="75" rx="8" ry="12" fill="#38bdf8" opacity="0.3" filter="url(#etherealGlow)"/>
      <ellipse cx="170" cy="75" rx="8" ry="12" fill="#38bdf8" opacity="0.3" filter="url(#etherealGlow)"/>
      
      <!-- Wispy trailing edges at bottom -->
      <path d="M 105 385
               Q 100 395, 95 405
               Q 90 410, 85 408"
            fill="none"
            stroke="#bae6fd"
            stroke-width="3"
            opacity="0.4"
            stroke-linecap="round"/>
      
      <path d="M 155 385
               Q 150 395, 145 405
               Q 140 410, 135 408"
            fill="none"
            stroke="#bae6fd"
            stroke-width="3"
            opacity="0.4"
            stroke-linecap="round"/>
      
      <path d="M 205 385
               Q 200 395, 195 405
               Q 190 410, 185 408"
            fill="none"
            stroke="#bae6fd"
            stroke-width="3"
            opacity="0.4"
            stroke-linecap="round"/>
      
      <!-- Subtle inner highlights for dimension -->
      <ellipse cx="140" cy="100" rx="20" ry="30" fill="#ffffff" opacity="0.15"/>
      <ellipse cx="160" cy="120" rx="25" ry="35" fill="#ffffff" opacity="0.1"/>
    </svg>
  `;
  
  return 'data:image/svg+xml;base64,' + btoa(svg);
};
