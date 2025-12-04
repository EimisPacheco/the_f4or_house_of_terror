import React, { useEffect, useRef, useState, useCallback } from 'react';
import { GameState, DetectionResult } from '../types';
import { detectFeatures } from '../services/visionService';

interface FlyingGhostsProps {
  gameState: GameState;
  ghostImage: string | null;
  onReset: () => void;
}

export const FlyingGhosts: React.FC<FlyingGhostsProps> = ({ gameState, ghostImage, onReset }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>();
  
  const [showDebug, setShowDebug] = useState(true);
  const showDebugRef = useRef(true);
  const [cameraError, setCameraError] = useState<string | null>(null);
  
  // Spirit state - EXACTLY like reference
  const [spirits, setSpirits] = useState([
    { id: 1, angle: 0, radius: 0.2, speed: 0.05, scale: 0.5, opacity: 0, x: 0.5, y: 0.5 },
    { id: 2, angle: 2, radius: 0.25, speed: 0.03, scale: 0.4, opacity: 0, x: 0.5, y: 0.5 },
    { id: 3, angle: 4, radius: 0.15, speed: 0.07, scale: 0.3, opacity: 0, x: 0.5, y: 0.5 },
  ]);
  
  const handHistoryRef = useRef<{x: number, y: number}[]>([]);
  const isSwirlingRef = useRef(false);
  const lastFlyingSoundRef = useRef(0);
  
  // FIX: Store target in ref so setSpirits callback can access current value
  const targetRef = useRef<{x: number, y: number}>({x: 0.5, y: 0.5});
  
  // FIX: Lock to head target when swirling starts
  const swirlLockTimeRef = useRef(0);
  const wasSwirlingRef = useRef(false);
  
  // Debug: Track target position for visual indicator
  const [debugTarget, setDebugTarget] = useState<{x: number, y: number} | null>(null);
  
  useEffect(() => {
    showDebugRef.current = showDebug;
  }, [showDebug]);

  const getDistance = (p1: {x: number, y: number}, p2: {x: number, y: number}) => {
    return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
  };

  const playFlyingSound = () => {
    try {
      const AudioContextClass = (window.AudioContext || (window as any).webkitAudioContext);
      const ctx = new AudioContextClass();
      if (ctx.state === 'suspended') ctx.resume();
      const t = ctx.currentTime;
      const bufferSize = ctx.sampleRate * 1.0;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * 0.5;
      }
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.Q.value = 0.5;
      filter.frequency.setValueAtTime(300, t);
      filter.frequency.linearRampToValueAtTime(800, t + 0.4);
      filter.frequency.linearRampToValueAtTime(100, t + 0.9);
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.4, t + 0.2);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.9);
      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      noise.start();
    } catch (e) {
      console.error('Error playing flying sound:', e);
    }
  };


  const gameLoop = useCallback(async () => {
    if (gameState !== GameState.ACTIVE || !videoRef.current) return;

    const video = videoRef.current;
    if (video.readyState === 4) {
      const detection: DetectionResult = await detectFeatures(video);

      // --- SWARM MODE LOGIC - EXACT FROM REFERENCE ---
      const isHandDetected = !!detection.handPosition;
      if (detection.handPosition) {
         handHistoryRef.current.push(detection.handPosition);
         // Reduced from 10 to 5 frames for FASTER detection response
         if (handHistoryRef.current.length > 5) handHistoryRef.current.shift();
         
         // Calculate Total Movement (Cumulative Distance) to detect "Swirl" or "Shaking"
         let totalMovement = 0;
         for (let i = 1; i < handHistoryRef.current.length; i++) {
             totalMovement += getDistance(handHistoryRef.current[i-1], handHistoryRef.current[i]);
         }
         
         // Lowered threshold from 0.20 to 0.12 for FASTER/EASIER circular detection
         const isMovingFast = totalMovement > 0.12;
         
         // CRITICAL: Only swirl if POINTING gesture AND moving fast in circles
         // Stop immediately if not pointing or not moving
         if (isMovingFast && detection.handPose === 'pointing') {
             isSwirlingRef.current = true;
             if (Date.now() - lastFlyingSoundRef.current > 800) {
                 playFlyingSound();
                 lastFlyingSoundRef.current = Date.now();
             }
         } else {
             // Not pointing or not moving fast - stop swirling
             isSwirlingRef.current = false;
         }
      } else {
         handHistoryRef.current = [];
         isSwirlingRef.current = false;
      }

      const nose = detection.faceKeypoints?.find(k => k.name === 'noseTip');
      const now = Date.now();
      
      // FIX: Detect swirl start/stop and lock to head
      if (isSwirlingRef.current && !wasSwirlingRef.current) {
          // Swirl just started - lock to head for minimum 2 seconds
          swirlLockTimeRef.current = now + 2000;
          console.log('🌀 SWIRL STARTED - LOCKING TO HEAD');
      }
      wasSwirlingRef.current = isSwirlingRef.current;
      
      // Check if we're still in swirl lock period
      const isLockedToHead = now < swirlLockTimeRef.current;
      const shouldTargetHead = (isSwirlingRef.current || isLockedToHead) && nose;
      
      // DEBUG: Log swirling state and nose detection
      if (shouldTargetHead) {
          console.log('SWIRLING/LOCKED! isSwirling:', isSwirlingRef.current, 'isLocked:', isLockedToHead, 'nose:', nose ? `(${nose.x.toFixed(2)}, ${nose.y.toFixed(2)})` : 'NOT FOUND');
      }
      
      // FIX: Update target in ref so setSpirits can access it
      if (shouldTargetHead) {
          // LOCKED TO HEAD - ignore hand position
          targetRef.current = {
              x: nose!.x,
              y: nose!.y - 0.3 // Orbit above head
          };
          console.log('🎯 TARGET LOCKED TO HEAD:', targetRef.current.x.toFixed(2), targetRef.current.y.toFixed(2));
          setDebugTarget({x: targetRef.current.x, y: targetRef.current.y});
      } else if (detection.handPosition) {
          // Follow hand when not swirling
          targetRef.current = {
              x: detection.handPosition.x,
              y: detection.handPosition.y
          };
          setDebugTarget(null);
      } else if (nose) {
          // Fallback to head if no hand
          targetRef.current = {
              x: nose.x,
              y: nose.y - 0.3
          };
          setDebugTarget(null);
      } else {
          targetRef.current = {x: 0.5, y: 0.5};
          setDebugTarget(null);
      }

      setSpirits(prevSpirits => {
          return prevSpirits.map((spirit, idx) => {
              let s = { ...spirit };
              const FADE_SPEED = 0.1;
              if (isHandDetected) {
                  s.opacity = Math.min(s.opacity + FADE_SPEED, 0.9);
              } else {
                  s.opacity = Math.max(s.opacity - FADE_SPEED, 0);
              }

              const rotationSpeed = isSwirlingRef.current ? s.speed * 3 : s.speed;
              s.angle += rotationSpeed;
              
              const targetRadius = isSwirlingRef.current ? 0.15 : 0.25;
              s.radius = s.radius + (targetRadius - s.radius) * 0.1;

              // FIX: Use targetRef.current instead of closure variables
              const orbitX = targetRef.current.x + Math.cos(s.angle) * s.radius;
              const orbitY = targetRef.current.y + Math.sin(s.angle) * s.radius;

              // DEBUG: Log what orbit position is calculated
              const now = Date.now();
              const isLockedToHead = now < swirlLockTimeRef.current;
              if (idx === 0 && (isSwirlingRef.current || isLockedToHead)) {
                  console.log('INSIDE setSpirits - targetX:', targetRef.current.x.toFixed(2), 'targetY:', targetRef.current.y.toFixed(2), 'orbitX:', orbitX.toFixed(2), 'orbitY:', orbitY.toFixed(2));
              }

              // MUCH faster lerp when swirling/locked for instant response to head
              const lerp = (isSwirlingRef.current || isLockedToHead) ? 0.5 : 0.1; 
              s.x = s.x + (orbitX - s.x) * lerp;
              s.y = s.y + (orbitY - s.y) * lerp;
              s.scale = spirit.scale + Math.sin(s.angle * 2) * 0.01;
              
              // DEBUG: Log final position
              if (idx === 0 && (isSwirlingRef.current || isLockedToHead)) {
                  console.log('FINAL spirit position - x:', s.x.toFixed(2), 'y:', s.y.toFixed(2));
              }
              
              return s;
          });
      });
    }

    requestRef.current = requestAnimationFrame(gameLoop);
  }, [gameState]);

  useEffect(() => {
    if (gameState === GameState.ACTIVE) {
      const startCamera = async () => {
        setCameraError(null);
        try {
          let stream;
          try {
             stream = await navigator.mediaDevices.getUserMedia({
                video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' }
             });
          } catch (e) {
             stream = await navigator.mediaDevices.getUserMedia({ video: true });
          }
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.onloadedmetadata = () => {
               videoRef.current?.play();
               requestRef.current = requestAnimationFrame(gameLoop);
            };
          }
        } catch (err: any) {
          console.error("Camera error:", err);
          setCameraError("Camera permission denied or device not found.");
        }
      };
      startCamera();
    } else {
        if (videoRef.current && videoRef.current.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach(track => track.stop());
        }
        if (requestRef.current) {
            cancelAnimationFrame(requestRef.current);
        }
    }
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [gameState, gameLoop]);


  return (
    <div className="relative w-full max-w-3xl mx-auto aspect-[4/3] bg-black rounded-lg overflow-visible">
      {/* Artistic Border Frame with Mystical Elements */}
      <div className="absolute inset-0 pointer-events-none z-30" style={{
        border: '20px solid transparent',
        borderImage: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 50%, #3b82f6 100%) 1',
        boxShadow: '0 0 60px rgba(59, 130, 246, 0.8), inset 0 0 40px rgba(139, 92, 246, 0.3)',
        borderRadius: '8px'
      }}>
        
        {/* Mystical Corner Symbols */}
        <svg className="absolute top-4 left-4 w-20 h-20" viewBox="0 0 100 100" style={{filter: 'drop-shadow(0 0 10px rgba(139, 92, 246, 0.8))'}}>
          <circle cx="50" cy="50" r="35" fill="none" stroke="#8b5cf6" strokeWidth="2" opacity="0.6"/>
          <circle cx="50" cy="50" r="25" fill="none" stroke="#3b82f6" strokeWidth="1.5" opacity="0.8"/>
          <path d="M50,15 L55,45 L85,50 L55,55 L50,85 L45,55 L15,50 L45,45 Z" fill="#a78bfa" opacity="0.7"/>
          <circle cx="50" cy="50" r="8" fill="#c4b5fd"/>
          <circle cx="50" cy="15" r="3" fill="#3b82f6"/>
          <circle cx="85" cy="50" r="3" fill="#3b82f6"/>
          <circle cx="50" cy="85" r="3" fill="#3b82f6"/>
          <circle cx="15" cy="50" r="3" fill="#3b82f6"/>
        </svg>
        
        <svg className="absolute top-4 right-4 w-20 h-20" viewBox="0 0 100 100" style={{filter: 'drop-shadow(0 0 10px rgba(139, 92, 246, 0.8))'}}>
          <circle cx="50" cy="50" r="35" fill="none" stroke="#8b5cf6" strokeWidth="2" opacity="0.6"/>
          <circle cx="50" cy="50" r="25" fill="none" stroke="#3b82f6" strokeWidth="1.5" opacity="0.8"/>
          <path d="M50,15 L55,45 L85,50 L55,55 L50,85 L45,55 L15,50 L45,45 Z" fill="#a78bfa" opacity="0.7"/>
          <circle cx="50" cy="50" r="8" fill="#c4b5fd"/>
        </svg>
        
        <svg className="absolute bottom-4 left-4 w-20 h-20" viewBox="0 0 100 100" style={{filter: 'drop-shadow(0 0 10px rgba(139, 92, 246, 0.8))'}}>
          <circle cx="50" cy="50" r="35" fill="none" stroke="#8b5cf6" strokeWidth="2" opacity="0.6"/>
          <circle cx="50" cy="50" r="25" fill="none" stroke="#3b82f6" strokeWidth="1.5" opacity="0.8"/>
          <path d="M50,15 L55,45 L85,50 L55,55 L50,85 L45,55 L15,50 L45,45 Z" fill="#a78bfa" opacity="0.7"/>
          <circle cx="50" cy="50" r="8" fill="#c4b5fd"/>
        </svg>
        
        <svg className="absolute bottom-4 right-4 w-20 h-20" viewBox="0 0 100 100" style={{filter: 'drop-shadow(0 0 10px rgba(139, 92, 246, 0.8))'}}>
          <circle cx="50" cy="50" r="35" fill="none" stroke="#8b5cf6" strokeWidth="2" opacity="0.6"/>
          <circle cx="50" cy="50" r="25" fill="none" stroke="#3b82f6" strokeWidth="1.5" opacity="0.8"/>
          <path d="M50,15 L55,45 L85,50 L55,55 L50,85 L45,55 L15,50 L45,45 Z" fill="#a78bfa" opacity="0.7"/>
          <circle cx="50" cy="50" r="8" fill="#c4b5fd"/>
        </svg>
        
        {/* Ethereal Wisps */}
        <div className="absolute top-[20px] left-[20%] w-1 h-24 bg-gradient-to-b from-blue-400 via-purple-400 to-transparent opacity-50 animate-pulse" style={{filter: 'blur(2px)'}}></div>
        <div className="absolute top-[20px] right-[30%] w-1 h-20 bg-gradient-to-b from-purple-400 via-blue-400 to-transparent opacity-50 animate-pulse" style={{filter: 'blur(2px)', animationDelay: '0.5s'}}></div>
        
        {/* Mystical Text */}
        <div className="absolute top-8 left-32 text-blue-400 font-horror text-xl opacity-80" style={{textShadow: '0 0 10px #000, 0 0 20px #3b82f6'}}>
          SPIRITS AWAKEN
        </div>
        <div className="absolute top-8 right-32 text-purple-400 font-horror text-xl opacity-80" style={{textShadow: '0 0 10px #000, 0 0 20px #8b5cf6'}}>
          THEY FOLLOW
        </div>
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-blue-300 font-horror text-lg opacity-80" style={{textShadow: '0 0 10px #000, 0 0 20px #3b82f6'}}>
          🌀 SWIRL TO SUMMON 🌀
        </div>
      </div>
      
      {cameraError && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/90 p-8 text-center">
            <div>
                <h3 className="text-red-600 font-horror text-3xl mb-4">SIGHTLESS</h3>
                <p className="text-neutral-400">{cameraError}</p>
            </div>
        </div>
      )}

      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-cover transform scale-x-[-1]" 
        playsInline
        muted
      />
      
      <canvas 
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none"
      />

      <button
        onClick={() => setShowDebug(prev => !prev)}
        className="absolute top-2 right-2 z-50 bg-black/60 hover:bg-black/90 text-green-400 border border-green-900 px-2 py-1 text-xs font-mono rounded cursor-pointer transition-colors backdrop-blur-sm"
      >
        {showDebug ? '[HIDE DEBUG]' : '[SHOW DEBUG]'}
      </button>

      <button
        onClick={onReset}
        className="absolute top-2 left-2 z-50 bg-black/60 hover:bg-black/90 text-yellow-400 border border-yellow-600 px-3 py-1 text-xs font-mono rounded cursor-pointer transition-colors backdrop-blur-sm"
      >
        [MENU]
      </button>

      <div className="scanlines pointer-events-none"></div>
      <div className="vignette pointer-events-none"></div>

      {ghostImage && spirits.map(spirit => (
         <div 
            key={spirit.id}
            className="absolute pointer-events-none transition-opacity duration-300 z-40"
            style={{
                left: `${spirit.x * 100}%`,
                top: `${spirit.y * 100}%`,
                width: '40%', 
                height: 'auto',
                opacity: spirit.opacity,
                transform: `translate(-50%, -50%) scale(${spirit.scale})`,
                mixBlendMode: 'screen', 
                filter: 'brightness(1.5) drop-shadow(0 0 15px rgba(255,255,255,0.6))'
            }}
         >
             <img src={ghostImage} alt="Spirit" className="w-full h-full" style={{backgroundColor: 'transparent'}} />
         </div>
      ))}
      
      {/* DEBUG: Show target position when swirling */}
      {showDebug && debugTarget && (
        <div 
          className="absolute pointer-events-none z-50"
          style={{
            left: `${debugTarget.x * 100}%`,
            top: `${debugTarget.y * 100}%`,
            transform: 'translate(-50%, -50%)'
          }}
        >
          <div className="relative">
            {/* Crosshair */}
            <div className="absolute w-12 h-12 border-4 border-red-500 rounded-full animate-pulse"></div>
            <div className="absolute w-1 h-16 bg-red-500 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"></div>
            <div className="absolute w-16 h-1 bg-red-500 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"></div>
            <div className="absolute -top-8 left-1/2 -translate-x-1/2 text-red-500 font-mono text-xs whitespace-nowrap bg-black/80 px-2 py-1 rounded">
              HEAD TARGET
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
