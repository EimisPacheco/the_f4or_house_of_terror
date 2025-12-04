import React, { useEffect, useRef, useState, useCallback } from 'react';
import { GameState, Bat, Explosion, DetectionResult } from '../types';
import { detectFeatures } from '../services/visionService';
import { generateBatSVG } from '../services/generateBat';

interface BatCatcherProps {
  gameState: GameState;
  onReset: () => void;
}

// Creepy Game Over Component with laughing face
const CreepyGameOver: React.FC<{ score: number }> = ({ score }) => {
  const [showFace, setShowFace] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  
  useEffect(() => {
    audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
  }, []);
  
  const playSinisterLaugh = () => {
    if (!audioContextRef.current) return;
    
    const ctx = audioContextRef.current;
    
    // Evil laugh: HA-HA-HA-HA-HAAAA pattern
    const laughNotes = [
      // First HA
      { freq: 400, time: 0, duration: 0.12 },
      // Second HA
      { freq: 450, time: 0.2, duration: 0.12 },
      // Third HA
      { freq: 400, time: 0.4, duration: 0.12 },
      // Fourth HA (higher pitch)
      { freq: 500, time: 0.6, duration: 0.12 },
      // Fifth HAAAA (long, descending)
      { freq: 450, time: 0.8, duration: 0.4 }
    ];
    
    laughNotes.forEach(({ freq, time, duration }) => {
      // Main voice oscillator
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator(); // Add harmonics
      const gainNode = ctx.createGain();
      const gain2 = ctx.createGain();
      const masterGain = ctx.createGain();
      
      osc1.connect(gainNode);
      osc2.connect(gain2);
      gainNode.connect(masterGain);
      gain2.connect(masterGain);
      masterGain.connect(ctx.destination);
      
      // Use triangle wave for more voice-like quality
      osc1.type = 'triangle';
      osc2.type = 'sine';
      
      // Main frequency
      osc1.frequency.setValueAtTime(freq, ctx.currentTime + time);
      // Add slight pitch drop for each "HA"
      osc1.frequency.exponentialRampToValueAtTime(freq * 0.85, ctx.currentTime + time + duration);
      
      // Harmonic (octave higher, quieter)
      osc2.frequency.setValueAtTime(freq * 1.5, ctx.currentTime + time);
      osc2.frequency.exponentialRampToValueAtTime(freq * 1.5 * 0.85, ctx.currentTime + time + duration);
      
      // Volume envelope for "HA" sound
      gainNode.gain.setValueAtTime(0, ctx.currentTime + time);
      gainNode.gain.linearRampToValueAtTime(0.2, ctx.currentTime + time + 0.02); // Quick attack
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + time + duration);
      
      gain2.gain.setValueAtTime(0, ctx.currentTime + time);
      gain2.gain.linearRampToValueAtTime(0.08, ctx.currentTime + time + 0.02);
      gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + time + duration);
      
      masterGain.gain.value = 0.6;
      
      osc1.start(ctx.currentTime + time);
      osc1.stop(ctx.currentTime + time + duration);
      osc2.start(ctx.currentTime + time);
      osc2.stop(ctx.currentTime + time + duration);
    });
    
    // Add subtle reverb/echo
    laughNotes.forEach(({ freq, time, duration }) => {
      const echoOsc = ctx.createOscillator();
      const echoGain = ctx.createGain();
      
      echoOsc.connect(echoGain);
      echoGain.connect(ctx.destination);
      
      echoOsc.type = 'sine';
      echoOsc.frequency.value = freq * 0.5; // Lower echo
      
      echoGain.gain.setValueAtTime(0, ctx.currentTime + time + 0.15);
      echoGain.gain.linearRampToValueAtTime(0.05, ctx.currentTime + time + 0.17);
      echoGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + time + duration + 0.3);
      
      echoOsc.start(ctx.currentTime + time + 0.15);
      echoOsc.stop(ctx.currentTime + time + duration + 0.3);
    });
  };
  
  useEffect(() => {
    // Show face after 2 seconds and play laugh
    const timer = setTimeout(() => {
      setShowFace(true);
      playSinisterLaugh();
    }, 2000);
    
    return () => clearTimeout(timer);
  }, []);
  
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/95">
      <div className="text-center p-8">
        <h2 className="font-horror text-7xl text-red-600 mb-6">GAME OVER</h2>
        <div className="text-yellow-400 text-3xl mb-4">FINAL SCORE</div>
        <div className="text-white font-bold text-6xl mb-8">{score}</div>
        <p className="text-neutral-400 text-xl mb-8">You survived 2 minutes of bat chaos!</p>
        
        {/* Creepy laughing face appears */}
        {showFace && (
          <div className="mt-8 animate-pulse">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              viewBox="0 0 200 200" 
              className="w-64 h-64 mx-auto"
              style={{ 
                animation: 'creepyShake 0.3s infinite, creepyGrow 2s ease-out',
                filter: 'drop-shadow(0 0 30px rgba(255, 0, 0, 0.8))'
              }}
            >
              {/* Face background */}
              <circle cx="100" cy="100" r="90" fill="#1a1a1a" stroke="#ff0000" strokeWidth="3"/>
              
              {/* Crazy eyes */}
              <ellipse cx="70" cy="75" rx="15" ry="25" fill="#ffffff"/>
              <ellipse cx="130" cy="75" rx="15" ry="25" fill="#ffffff"/>
              <circle cx="70" cy="75" r="8" fill="#000000"/>
              <circle cx="130" cy="75" r="8" fill="#000000"/>
              <circle cx="72" cy="73" r="3" fill="#ff0000"/>
              <circle cx="132" cy="73" r="3" fill="#ff0000"/>
              
              {/* Unsettling wide grin */}
              <path 
                d="M 40 120 Q 100 170, 160 120" 
                stroke="#ff0000" 
                strokeWidth="4" 
                fill="none"
              />
              <path 
                d="M 40 120 Q 100 165, 160 120 L 160 125 Q 100 175, 40 125 Z" 
                fill="#000000"
              />
              
              {/* Teeth */}
              <rect x="50" y="120" width="8" height="15" fill="#ffffff"/>
              <rect x="65" y="120" width="8" height="15" fill="#ffffff"/>
              <rect x="80" y="120" width="8" height="15" fill="#ffffff"/>
              <rect x="95" y="120" width="8" height="15" fill="#ffffff"/>
              <rect x="110" y="120" width="8" height="15" fill="#ffffff"/>
              <rect x="125" y="120" width="8" height="15" fill="#ffffff"/>
              <rect x="140" y="120" width="8" height="15" fill="#ffffff"/>
              
              {/* Creepy eyebrows */}
              <path d="M 55 55 L 85 60" stroke="#000000" strokeWidth="4" strokeLinecap="round"/>
              <path d="M 145 55 L 115 60" stroke="#000000" strokeWidth="4" strokeLinecap="round"/>
            </svg>
            
            <div className="text-red-600 font-horror text-4xl mt-6 animate-pulse">
              HA HA HA HA HA!
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Component to show target on index finger tip
const IndexFingerTarget: React.FC<{ videoRef: React.RefObject<HTMLVideoElement> }> = ({ videoRef }) => {
  const [fingerPos, setFingerPos] = useState<{ x: number; y: number } | null>(null);
  const requestRef = useRef<number>();
  
  const updateFingerPosition = useCallback(async () => {
    if (!videoRef.current || videoRef.current.readyState !== 4) {
      requestRef.current = requestAnimationFrame(updateFingerPosition);
      return;
    }
    
    const detection = await detectFeatures(videoRef.current);
    
    if (detection.handKeypoints && detection.handKeypoints.length >= 21) {
      setFingerPos({
        x: detection.handKeypoints[8].x,
        y: detection.handKeypoints[8].y
      });
    } else {
      setFingerPos(null);
    }
    
    requestRef.current = requestAnimationFrame(updateFingerPosition);
  }, [videoRef]);
  
  useEffect(() => {
    requestRef.current = requestAnimationFrame(updateFingerPosition);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [updateFingerPosition]);
  
  if (!fingerPos) return null;
  
  return (
    <div 
      className="absolute pointer-events-none z-40"
      style={{
        left: `${fingerPos.x * 100}%`,
        top: `${fingerPos.y * 100}%`,
        transform: 'translate(-50%, -50%)'
      }}
    >
      {/* Target crosshair */}
      <div className="relative w-12 h-12">
        <div className="absolute inset-0 border-4 border-red-500 rounded-full opacity-80 animate-pulse"></div>
        <div className="absolute inset-2 border-2 border-red-400 rounded-full opacity-60"></div>
        <div className="absolute top-1/2 left-0 w-full h-0.5 bg-red-500 opacity-60"></div>
        <div className="absolute top-0 left-1/2 w-0.5 h-full bg-red-500 opacity-60"></div>
        <div className="absolute top-1/2 left-1/2 w-2 h-2 bg-red-600 rounded-full transform -translate-x-1/2 -translate-y-1/2"></div>
      </div>
    </div>
  );
};

export const BatCatcher: React.FC<BatCatcherProps> = ({ gameState, onReset }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>();
  
  const [showDebug, setShowDebug] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [batImage] = useState(generateBatSVG());
  
  const [bats, setBats] = useState<Bat[]>([]);
  const [explosions, setExplosions] = useState<Explosion[]>([]);
  const batIdCounter = useRef(0);
  const explosionIdCounter = useRef(0);
  const lastSpawnTime = useRef(Date.now());
  
  // Level system
  const [level, setLevel] = useState(1);
  const [timeLeft, setTimeLeft] = useState(60); // 60 seconds per level
  const [gameOver, setGameOver] = useState(false);
  const levelStartTime = useRef(Date.now());
  
  // Audio context for boom sound
  const audioContextRef = useRef<AudioContext | null>(null);
  
  useEffect(() => {
    audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
  }, []);
  
  // Explosion sound effect (from the-haunted-reflection-last)
  const playExplosionSound = async () => {
    try {
      const AudioContextClass = (window.AudioContext || (window as any).webkitAudioContext);
      const ctx = new AudioContextClass();
      
      if (ctx.state === 'suspended') await ctx.resume();

      const t = ctx.currentTime;
      
      // 1. Noise Burst
      const bufferSize = ctx.sampleRate * 0.5;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
          data[i] = Math.random() * 2 - 1;
      }
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      
      const noiseFilter = ctx.createBiquadFilter();
      noiseFilter.type = 'lowpass';
      noiseFilter.frequency.setValueAtTime(1000, t);
      noiseFilter.frequency.exponentialRampToValueAtTime(100, t + 0.3);
      
      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.8, t);
      noiseGain.gain.exponentialRampToValueAtTime(0.01, t + 0.3);
      
      noise.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(ctx.destination);
      noise.start();

      // 2. Low Oscillator
      const osc = ctx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(120, t);
      osc.frequency.exponentialRampToValueAtTime(30, t + 0.4);
      
      const oscGain = ctx.createGain();
      oscGain.gain.setValueAtTime(1, t);
      oscGain.gain.exponentialRampToValueAtTime(0.01, t + 0.4);

      osc.connect(oscGain);
      oscGain.connect(ctx.destination);
      osc.start();
      
      setTimeout(() => ctx.close(), 1000);
    } catch (e) {
      console.error('Error playing explosion sound:', e);
    }
  };

  // Bat chirp sound effect (from the-haunted-reflection-last)
  const playBatSound = async () => {
    try {
      const AudioContextClass = (window.AudioContext || (window as any).webkitAudioContext);
      const ctx = new AudioContextClass();
      
      if (ctx.state === 'suspended') await ctx.resume();

      const t = ctx.currentTime;
      
      // High pitched sine chirp
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(6000, t);
      osc.frequency.exponentialRampToValueAtTime(3000, t + 0.1);
      
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.05, t + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.1);
      
      setTimeout(() => ctx.close(), 500);
    } catch (e) {
      console.error('Error playing bat sound:', e);
    }
  };
  
  const spawnBat = () => {
    const side = Math.random() > 0.5 ? 'left' : 'right';
    const startX = side === 'left' ? -0.1 : 1.1;
    const startY = Math.random() * 0.6 + 0.2; // Between 20% and 80%
    
    // Level 2: Faster and crazier bats!
    const speedMultiplier = level === 2 ? 2.5 : 1;
    const crazyFactor = level === 2 ? 0.004 : 0.002;
    
    const velocityX = side === 'left' 
      ? (Math.random() * 0.003 + 0.002) * speedMultiplier
      : -(Math.random() * 0.003 + 0.002) * speedMultiplier;
    const velocityY = (Math.random() - 0.5) * crazyFactor;
    
    const newBat: Bat = {
      id: batIdCounter.current++,
      position: { x: startX, y: startY },
      velocity: { x: velocityX, y: velocityY },
      scale: Math.random() * 0.3 + 0.4, // 0.4 to 0.7
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * (level === 2 ? 10 : 5) // Faster rotation in level 2
    };
    
    setBats(prev => [...prev, newBat]);
    playBatSound(); // Play bat chirp when spawning
  };
  
  const checkCollision = (batPos: { x: number; y: number }, fingerTipPos: { x: number; y: number }, batScale: number): boolean => {
    const hitRadius = 0.05 * batScale; // Smaller hit radius for finger tip
    const distance = Math.sqrt(
      Math.pow(batPos.x - fingerTipPos.x, 2) + 
      Math.pow(batPos.y - fingerTipPos.y, 2)
    );
    return distance < hitRadius;
  };
  
  const createExplosion = (x: number, y: number) => {
    const explosion: Explosion = {
      id: explosionIdCounter.current++,
      position: { x, y },
      timestamp: Date.now()
    };
    setExplosions(prev => [...prev, explosion]);
    
    // Remove explosion after animation
    setTimeout(() => {
      setExplosions(prev => prev.filter(e => e.id !== explosion.id));
    }, 500);
  };
  
  const drawDebug = (detection: DetectionResult, indexFingerTip: { x: number; y: number } | null) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (canvas.width !== canvas.clientWidth || canvas.height !== canvas.clientHeight) {
        canvas.width = canvas.clientWidth;
        canvas.height = canvas.clientHeight;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const w = canvas.width;
    const h = canvas.height;

    if (detection.handKeypoints && detection.handKeypoints.length >= 21) {
        const kp = detection.handKeypoints;
        
        // Draw hand skeleton
        const connections = [
            [0, 1], [1, 2], [2, 3], [3, 4],
            [0, 5], [5, 6], [6, 7], [7, 8],
            [0, 9], [9, 10], [10, 11], [11, 12],
            [0, 13], [13, 14], [14, 15], [15, 16],
            [0, 17], [17, 18], [18, 19], [19, 20],
        ];
        
        connections.forEach(([i, j]) => {
            ctx.beginPath();
            ctx.moveTo(kp[i].x * w, kp[i].y * h);
            ctx.lineTo(kp[j].x * w, kp[j].y * h);
            ctx.strokeStyle = 'rgba(0, 255, 0, 0.5)';
            ctx.lineWidth = 2;
            ctx.stroke();
        });
        
        kp.forEach((k, i) => {
            ctx.beginPath();
            ctx.arc(k.x * w, k.y * h, 4, 0, 2 * Math.PI);
            ctx.fillStyle = i === 8 ? '#ff0000' : '#00ff00'; // Index tip is red
            ctx.fill();
        });
    }
    
    // Draw target on index finger tip
    if (indexFingerTip) {
      ctx.beginPath();
      ctx.arc(indexFingerTip.x * w, indexFingerTip.y * h, 20, 0, 2 * Math.PI);
      ctx.strokeStyle = '#ff0000';
      ctx.lineWidth = 3;
      ctx.stroke();
      
      ctx.beginPath();
      ctx.arc(indexFingerTip.x * w, indexFingerTip.y * h, 10, 0, 2 * Math.PI);
      ctx.strokeStyle = '#ff0000';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  };
  
  const gameLoop = useCallback(async () => {
    if (gameState !== GameState.ACTIVE || !videoRef.current) return;

    const video = videoRef.current;
    if (video.readyState === 4) {
      const detection: DetectionResult = await detectFeatures(video);
      


      // Get index finger tip position (keypoint 8)
      let indexFingerTip: { x: number; y: number } | null = null;
      if (detection.handKeypoints && detection.handKeypoints.length >= 21) {
        indexFingerTip = {
          x: detection.handKeypoints[8].x,
          y: detection.handKeypoints[8].y
        };
      }
      
      if (showDebug) {
        drawDebug(detection, indexFingerTip);
      }

      // Update timer
      const now = Date.now();
      const elapsed = Math.floor((now - levelStartTime.current) / 1000);
      const remaining = 60 - elapsed;
      
      if (remaining !== timeLeft) {
        setTimeLeft(remaining);
      }
      
      // Check if level time is up
      if (remaining <= 0) {
        if (level === 1) {
          // Move to level 2
          setLevel(2);
          setTimeLeft(60);
          levelStartTime.current = Date.now();
          setBats([]); // Clear bats for new level
        } else {
          // Game over after level 2
          setGameOver(true);
          return;
        }
      }
      
      // Spawn new bats - faster in level 2
      const spawnInterval = level === 2 ? 800 : 1200; // Level 2: every 0.8s, Level 1: every 1.2s
      if (now - lastSpawnTime.current > spawnInterval) {
        spawnBat();
        lastSpawnTime.current = now;
      }

      // Update bats and check collisions
      setBats(prev => {
        const updatedBats = prev.map(bat => ({
          ...bat,
          position: {
            x: bat.position.x + bat.velocity.x,
            y: bat.position.y + bat.velocity.y
          },
          rotation: bat.rotation + bat.rotationSpeed
        }));

        // Check collisions with INDEX FINGER TIP only
        if (indexFingerTip) {
          const remainingBats = updatedBats.filter(bat => {
            if (checkCollision(bat.position, indexFingerTip!, bat.scale)) {
              // Bat caught with finger tip!
              createExplosion(bat.position.x, bat.position.y);
              playExplosionSound(); // Play explosion sound when catching bat
              setScore(s => s + 10);
              return false; // Remove bat
            }
            return true;
          });
          
          // Remove bats that went off screen
          return remainingBats.filter(bat => 
            bat.position.x > -0.2 && bat.position.x < 1.2 &&
            bat.position.y > -0.2 && bat.position.y < 1.2
          );
        }

        // Remove bats that went off screen
        return updatedBats.filter(bat => 
          bat.position.x > -0.2 && bat.position.x < 1.2 &&
          bat.position.y > -0.2 && bat.position.y < 1.2
        );
      });
    }

    if (!gameOver) {
      requestRef.current = requestAnimationFrame(gameLoop);
    }
  }, [gameState, showDebug, level, timeLeft, gameOver]);

  useEffect(() => {
    // Reset game when starting
    if (gameState === GameState.ACTIVE) {
      setLevel(1);
      setTimeLeft(60);
      setScore(0);
      setGameOver(false);
      setBats([]);
      levelStartTime.current = Date.now();
      lastSpawnTime.current = Date.now();
    }
  }, [gameState]);
  
  useEffect(() => {
    if (gameState === GameState.ACTIVE && !gameOver) {
      const startCamera = async () => {
        setCameraError(null);
        try {
          let stream;
          try {
             stream = await navigator.mediaDevices.getUserMedia({
                video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' }
             });
          } catch (e) {
             console.warn("Ideal camera constraints failed, attempting fallback...", e);
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
  }, [gameState, gameLoop, gameOver]);

  return (
    <div className="relative w-full max-w-3xl mx-auto aspect-[4/3] bg-black rounded-lg overflow-visible">
      {/* Artistic Border Frame with Golden Ornaments */}
      <div className="absolute inset-0 pointer-events-none z-50" style={{
        border: '20px solid transparent',
        borderImage: 'linear-gradient(135deg, #b45309 0%, #78350f 50%, #b45309 100%) 1',
        boxShadow: '0 0 60px rgba(234, 88, 12, 0.8), inset 0 0 40px rgba(234, 88, 12, 0.3)',
        borderRadius: '8px'
      }}>
        
        {/* Golden Corner Ornaments */}
        <svg className="absolute -top-2 -left-2 w-32 h-32" viewBox="0 0 100 100">
          <defs>
            <radialGradient id="goldGrad1" cx="50%" cy="50%">
              <stop offset="0%" stopColor="#fbbf24" />
              <stop offset="50%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#b45309" />
            </radialGradient>
          </defs>
          <circle cx="20" cy="20" r="18" fill="url(#goldGrad1)" stroke="#78350f" strokeWidth="2" filter="drop-shadow(0 0 8px rgba(251, 191, 36, 0.8))"/>
          <circle cx="20" cy="20" r="12" fill="none" stroke="#fbbf24" strokeWidth="1.5" opacity="0.6"/>
          <circle cx="20" cy="20" r="6" fill="#fef3c7" opacity="0.8"/>
          <line x1="20" y1="20" x2="100" y2="20" stroke="#f59e0b" strokeWidth="3" strokeLinecap="round"/>
          <line x1="20" y1="20" x2="20" y2="100" stroke="#f59e0b" strokeWidth="3" strokeLinecap="round"/>
        </svg>
        
        <svg className="absolute -top-2 -right-2 w-32 h-32" viewBox="0 0 100 100">
          <circle cx="80" cy="20" r="18" fill="url(#goldGrad1)" stroke="#78350f" strokeWidth="2" filter="drop-shadow(0 0 8px rgba(251, 191, 36, 0.8))"/>
          <circle cx="80" cy="20" r="12" fill="none" stroke="#fbbf24" strokeWidth="1.5" opacity="0.6"/>
          <circle cx="80" cy="20" r="6" fill="#fef3c7" opacity="0.8"/>
          <line x1="80" y1="20" x2="0" y2="20" stroke="#f59e0b" strokeWidth="3" strokeLinecap="round"/>
          <line x1="80" y1="20" x2="80" y2="100" stroke="#f59e0b" strokeWidth="3" strokeLinecap="round"/>
        </svg>
        
        <svg className="absolute -bottom-2 -left-2 w-32 h-32" viewBox="0 0 100 100">
          <circle cx="20" cy="80" r="18" fill="url(#goldGrad1)" stroke="#78350f" strokeWidth="2" filter="drop-shadow(0 0 8px rgba(251, 191, 36, 0.8))"/>
          <circle cx="20" cy="80" r="12" fill="none" stroke="#fbbf24" strokeWidth="1.5" opacity="0.6"/>
          <circle cx="20" cy="80" r="6" fill="#fef3c7" opacity="0.8"/>
          <line x1="20" y1="80" x2="100" y2="80" stroke="#f59e0b" strokeWidth="3" strokeLinecap="round"/>
          <line x1="20" y1="80" x2="20" y2="0" stroke="#f59e0b" strokeWidth="3" strokeLinecap="round"/>
        </svg>
        
        <svg className="absolute -bottom-2 -right-2 w-32 h-32" viewBox="0 0 100 100">
          <circle cx="80" cy="80" r="18" fill="url(#goldGrad1)" stroke="#78350f" strokeWidth="2" filter="drop-shadow(0 0 8px rgba(251, 191, 36, 0.8))"/>
          <circle cx="80" cy="80" r="12" fill="none" stroke="#fbbf24" strokeWidth="1.5" opacity="0.6"/>
          <circle cx="80" cy="80" r="6" fill="#fef3c7" opacity="0.8"/>
          <line x1="80" y1="80" x2="0" y2="80" stroke="#f59e0b" strokeWidth="3" strokeLinecap="round"/>
          <line x1="80" y1="80" x2="80" y2="0" stroke="#f59e0b" strokeWidth="3" strokeLinecap="round"/>
        </svg>
        
        {/* Decorative Text */}
        <div className="absolute top-8 left-1/2 -translate-x-1/2 text-orange-400 font-horror text-2xl opacity-80" style={{textShadow: '0 0 10px #000, 0 0 20px #ea580c'}}>
          🦇 CATCH THEM ALL 🦇
        </div>
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-orange-400 font-horror text-xl opacity-80" style={{textShadow: '0 0 10px #000, 0 0 20px #ea580c'}}>
          ☝️ USE YOUR FINGER ☝️
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

      {/* Score Display */}
      <div className="absolute top-4 left-4 z-50 bg-black/80 px-6 py-3 rounded-lg border-2 border-red-600">
        <div className="text-red-500 font-horror text-2xl">SCORE</div>
        <div className="text-white font-bold text-4xl text-center">{score}</div>
      </div>
      
      {/* Level and Timer Display */}
      <div className="absolute top-4 right-4 z-50 bg-black/80 px-6 py-3 rounded-lg border-2 border-purple-600">
        <div className="text-purple-400 font-horror text-xl">LEVEL {level}</div>
        <div className={`font-bold text-3xl text-center ${timeLeft <= 10 ? 'text-red-500 animate-pulse' : 'text-white'}`}>
          {timeLeft}s
        </div>
      </div>
      
      {/* Level Transition Overlay */}
      {level === 2 && timeLeft === 60 && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/90 animate-pulse">
          <div className="text-center">
            <h2 className="font-horror text-6xl text-red-600 mb-4">LEVEL 2</h2>
            <p className="text-yellow-400 text-2xl">FASTER & CRAZIER BATS!</p>
          </div>
        </div>
      )}
      
      {/* Game Over Screen */}
      {gameOver && <CreepyGameOver score={score} />}

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

      {/* Render Bats */}
      {bats.map(bat => (
        <div 
            key={bat.id}
            className="absolute pointer-events-none"
            style={{
                left: `${bat.position.x * 100}%`,
                top: `${bat.position.y * 100}%`,
                width: '15%',
                height: 'auto',
                transform: `translate(-50%, -50%) scale(${bat.scale}) rotate(${bat.rotation}deg)`,
                transition: 'none'
            }}
        >
            <img src={batImage} alt="Bat" className="w-full h-full" />
        </div>
      ))}

      {/* Render Explosions */}
      {explosions.map(explosion => (
        <div 
            key={explosion.id}
            className="absolute pointer-events-none"
            style={{
                left: `${explosion.position.x * 100}%`,
                top: `${explosion.position.y * 100}%`,
                width: '100px',
                height: '100px',
                transform: 'translate(-50%, -50%)',
                animation: 'explode 0.5s ease-out'
            }}
        >
          <div className="text-6xl">💥</div>
        </div>
      ))}
      
      {/* Index Finger Target Indicator */}
      <IndexFingerTarget videoRef={videoRef} />
      
    </div>
  );
};
