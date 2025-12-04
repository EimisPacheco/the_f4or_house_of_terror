import React, { useEffect, useRef, useState, useCallback } from 'react';
import { GameState, DetectionResult } from '../types';
import { detectFeatures } from '../services/visionService';

interface PossessionProps {
  gameState: GameState;
  onReset: () => void;
  possessionAssets?: {
    face: string | null;
    eye: string | null;
    dagger: string | null;
  };
}

// Helper to remove white background via Chroma Key
const removeWhiteBackground = (img: HTMLImageElement): Promise<HTMLImageElement> => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      resolve(img);
      return;
    }
    
    ctx.drawImage(img, 0, 0);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    // Chroma Key: Turn white pixels transparent
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      // Threshold for White (approx > 220)
      if (r > 220 && g > 220 && b > 220) {
        data[i + 3] = 0; // Alpha 0
      }
    }
    
    ctx.putImageData(imageData, 0, 0);
    const processedImg = new Image();
    processedImg.onload = () => resolve(processedImg);
    processedImg.src = canvas.toDataURL();
  });
};

const processImageTransparency = (src: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.onload = () => {
      removeWhiteBackground(img).then(resolve);
    };
    img.onerror = reject;
    img.src = src;
  });
};

export const Possession: React.FC<PossessionProps> = ({ gameState, onReset, possessionAssets }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>();
  
  // Asset Refs for Canvas Rendering
  const possessionFaceImgRef = useRef<HTMLImageElement | null>(null);
  const possessionEyeImgRef = useRef<HTMLImageElement | null>(null);
  const possessionDaggerImgRef = useRef<HTMLImageElement | null>(null);
  
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [faceHits, setFaceHits] = useState(0);
  const [eyeStabs, setEyeStabs] = useState(0);
  const [showBlood, setShowBlood] = useState(false);
  const [showEyeDamage, setShowEyeDamage] = useState(false);
  const [showKnife, setShowKnife] = useState(false);
  const [showDebug, setShowDebug] = useState(true);
  const showDebugRef = useRef(true);
  const [eyePositions, setEyePositions] = useState<Array<{ x: number; y: number }>>([]);
  const [handPositions, setHandPositions] = useState<Array<{ x: number; y: number }>>([]);
  const [faceCenter, setFaceCenter] = useState<{ x: number; y: number } | null>(null);
  const [showPossessedMessage, setShowPossessedMessage] = useState(false);
  
  // Preload and Process Images
  useEffect(() => {
    const loadAssets = async () => {
      if (possessionAssets?.face) {
        try {
          const img = await processImageTransparency(possessionAssets.face);
          possessionFaceImgRef.current = img;
        } catch(e) { console.error("Failed to process face", e); }
      }
      if (possessionAssets?.eye) {
        try {
          const img = await processImageTransparency(possessionAssets.eye);
          possessionEyeImgRef.current = img;
        } catch(e) { console.error("Failed to process eye", e); }
      }
      if (possessionAssets?.dagger) {
        try {
          const img = await processImageTransparency(possessionAssets.dagger);
          possessionDaggerImgRef.current = img;
        } catch(e) { console.error("Failed to process dagger", e); }
      }
    };
    loadAssets();
  }, [possessionAssets]);
  
  // Sync debug ref
  useEffect(() => {
    showDebugRef.current = showDebug;
  }, [showDebug]);
  
  // Possession state refs (matching the-haunted-reflection-last)
  const possessionRef = useRef({
    headBangs: 0,
    eyeStabs: 0,
    isHeadDown: false,
    lastHitTime: 0,
    lastStabTime: 0,
    possessedShown: false
  });
  
  const [hitFlash, setHitFlash] = useState(0);
  
  // Hit flash effect
  useEffect(() => {
    if (hitFlash > 0) {
      const timer = setTimeout(() => setHitFlash(0), 100);
      return () => clearTimeout(timer);
    }
  }, [hitFlash]);
  
  const triggerHitFlash = () => {
    setHitFlash(0.5);
  };
  
  // Helper to calculate distance
  const getDistance = (p1: {x: number, y: number}, p2: {x: number, y: number}) => {
    return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
  };
  
  // Hit sound effect (from the-haunted-reflection-last)
  const playHitSound = async () => {
    try {
      const AudioContextClass = (window.AudioContext || (window as any).webkitAudioContext);
      const ctx = new AudioContextClass();
      
      if (ctx.state === 'suspended') await ctx.resume();
      
      const t = ctx.currentTime;
      const osc = ctx.createOscillator();
      osc.type = 'square';
      osc.frequency.setValueAtTime(80, t);
      osc.frequency.exponentialRampToValueAtTime(10, t + 0.1);
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.5, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.1);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      
      setTimeout(() => ctx.close(), 500);
    } catch (e) {
      console.error('Error playing hit sound:', e);
    }
  };
  
  // Draw canvas with possession effects (matching the-haunted-reflection-last)
  const drawCanvas = (detection: DetectionResult, leftEye: any, rightEye: any) => {
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

    // --- Draw Dagger on Hand ---
    if (detection.handPosition && possessionDaggerImgRef.current) {
      const x = detection.handPosition.x * w;
      const y = detection.handPosition.y * h;
      const size = 150;
      
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(-45 * Math.PI / 180); 
      try {
        ctx.drawImage(possessionDaggerImgRef.current, -size/2, -size, size, size*2);
      } catch(e) {}
      ctx.restore();
    }

    // --- Draw Face Mask and Damaged Eyes ---
    if (leftEye && rightEye) {
      const lx = leftEye.x * w;
      const ly = leftEye.y * h;
      const rx = rightEye.x * w;
      const ry = rightEye.y * h;
      const eyeDist = Math.hypot(rx - lx, ry - ly);

      // Draw Face Mask (Hits >= 3) - Sized to properly cover face
      if (possessionRef.current.headBangs >= 3 && possessionFaceImgRef.current) {
        const faceWidth = eyeDist * 4.2; // Balanced size between 3.5 and 5.0
        const faceHeight = faceWidth * 1.35; // Balanced height
        const cx = (lx + rx) / 2;
        const cy = (ly + ry) / 2;

        ctx.save();
        ctx.globalAlpha = 0.85; // Balanced opacity
        try {
          ctx.drawImage(
            possessionFaceImgRef.current, 
            cx - faceWidth/2, 
            cy - (faceHeight * 0.37), // Balanced vertical position
            faceWidth, 
            faceHeight
          );
        } catch(e) {}
        ctx.restore();
      }

      // Draw Damaged Eyes (Stabs >= 3)
      if (possessionRef.current.eyeStabs >= 3 && possessionEyeImgRef.current) {
        const radius = (eyeDist * 0.4) / 2;
        const size = radius * 2;
        
        const drawEye = (x: number, y: number, flip: boolean) => {
          ctx.save();
          ctx.beginPath();
          ctx.arc(x, y, radius, 0, Math.PI * 2);
          ctx.closePath();
          ctx.clip();
          
          ctx.translate(x, y);
          if (flip) ctx.scale(-1, 1);
          
          ctx.drawImage(possessionEyeImgRef.current!, -radius, -radius, size, size);
          ctx.restore();
        };

        drawEye(lx, ly, false);
        drawEye(rx, ry, true);
      }
    }

    // --- Draw Debug Info ---
    if (showDebugRef.current) {
      // Draw face keypoints
      if (detection.faceKeypoints) {
        detection.faceKeypoints.forEach(k => {
          ctx.beginPath();
          ctx.arc(k.x * w, k.y * h, 4, 0, 2 * Math.PI);
          ctx.fillStyle = '#00ff00';
          ctx.fill();
        });
      }

      // Draw HIT THRESHOLD line (below nose - higher Y value = lower on screen)
      const HIT_THRESHOLD = 0.70;
      const threshY = HIT_THRESHOLD * h;
      ctx.strokeStyle = 'rgba(255, 0, 0, 0.8)';
      ctx.beginPath();
      ctx.moveTo(0, threshY);
      ctx.lineTo(w, threshY);
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = '#ff0000';
      ctx.font = '14px monospace';
      ctx.fillText(`HIT LINE (Y > ${HIT_THRESHOLD})`, 10, threshY - 5);

      // Draw eye positions and Y values
      if (leftEye && rightEye) {
        ctx.fillStyle = '#ffff00';
        ctx.font = '14px monospace';
        ctx.fillText(`Left Eye Y: ${leftEye.y.toFixed(2)}`, 10, 20);
        ctx.fillText(`Right Eye Y: ${rightEye.y.toFixed(2)}`, 10, 40);
        ctx.fillText(`Eyes Down: ${leftEye.y > HIT_THRESHOLD && rightEye.y > HIT_THRESHOLD ? 'YES' : 'NO'}`, 10, 60);
      }

      // Draw hand keypoints
      if (detection.handKeypoints && detection.handKeypoints.length >= 21) {
        const kp = detection.handKeypoints;
        kp.forEach(k => {
          ctx.beginPath();
          ctx.arc(k.x * w, k.y * h, 4, 0, 2 * Math.PI);
          ctx.fillStyle = '#ff0000';
          ctx.fill();
        });
      }
    }
  };

  const gameLoop = useCallback(async () => {
    if (gameState !== GameState.ACTIVE || !videoRef.current) return;

    const video = videoRef.current;
    if (video.readyState === 4) {
      const detection: DetectionResult = await detectFeatures(video);
      
      // Get eye keypoints (using named keypoints from MediaPipe)
      // MediaPipe Face Detection uses: leftEye, rightEye, noseTip, mouthCenter, leftEarTragion, rightEarTragion
      const leftEye = detection.faceKeypoints?.find(k => k.name === 'leftEye');
      const rightEye = detection.faceKeypoints?.find(k => k.name === 'rightEye');
      
      // Draw canvas with possession effects
      drawCanvas(detection, leftEye, rightEye);
      
      // Track eye positions for rendering
      if (leftEye && rightEye) {
        setEyePositions([
          { x: leftEye.x, y: leftEye.y },
          { x: rightEye.x, y: rightEye.y }
        ]);
        
        // Track face center
        const centerX = (leftEye.x + rightEye.x) / 2;
        const centerY = (leftEye.y + rightEye.y) / 2;
        setFaceCenter({ x: centerX, y: centerY });
      }
      
      // Track hand positions (index finger tip - keypoint 8)
      if (detection.handKeypoints && detection.handKeypoints.length >= 21) {
        setHandPositions([
          { x: detection.handKeypoints[8].x, y: detection.handKeypoints[8].y }
        ]);
      } else {
        setHandPositions([]);
      }
      
      // --- POSSESSION MODE LOGIC (from the-haunted-reflection-last) ---
      
      // 1. Detect Desk Hit (Rapid movement down) - matching reference
      if (leftEye && rightEye) {
        const HIT_THRESHOLD = 0.70;
        const now = Date.now();
        // BOTH eyes must be below threshold for a hit (stricter detection)
        const isEyesDown = leftEye.y > HIT_THRESHOLD && rightEye.y > HIT_THRESHOLD;

        // Hit happens on the WAY DOWN (Impact)
        // Cooldown of 500ms to prevent jittering counts
        if (!possessionRef.current.isHeadDown && 
             isEyesDown && 
             (now - possessionRef.current.lastHitTime > 500)) {
            
            possessionRef.current.isHeadDown = true;
            possessionRef.current.headBangs += 1;
            possessionRef.current.lastHitTime = now;
            playHitSound();
            triggerHitFlash();
        } 
        // Reset state when at least one eye rises above threshold
        else if (possessionRef.current.isHeadDown && !isEyesDown) {
            possessionRef.current.isHeadDown = false;
        }
        
        // Sync state for rendering (matching reference pattern)
        if (possessionRef.current.headBangs !== faceHits) {
          setFaceHits(possessionRef.current.headBangs);
          
          if (possessionRef.current.headBangs < 3) {
            setShowBlood(true);
            setTimeout(() => setShowBlood(false), 500);
          } else {
            setShowBlood(true);
          }
        }
      }

      // 2. Detect Eye Stab (matching reference implementation)
      if (detection.handPosition && detection.faceKeypoints) {
        const now = Date.now();

        if (now - possessionRef.current.lastStabTime > 1000) { // Cooldown
          const checkStab = (eye: { x: number; y: number }) => {
            const dist = getDistance(detection.handPosition!, eye);
            if (dist < 0.08) {
              possessionRef.current.eyeStabs += 1;
              possessionRef.current.lastStabTime = now;
              playHitSound();
              triggerHitFlash();
            }
          };
          
          // Check both eyes (reference allows both to be stabbed)
          if (leftEye) checkStab(leftEye);
          if (rightEye) checkStab(rightEye);
          
          // Update state after checking both eyes
          if (possessionRef.current.eyeStabs !== eyeStabs) {
            setEyeStabs(possessionRef.current.eyeStabs);
            
            if (possessionRef.current.eyeStabs < 3) {
              setShowEyeDamage(true);
              setTimeout(() => setShowEyeDamage(false), 500);
            } else {
              setShowEyeDamage(true);
            }
          }
        }
      }
      
      // Check if both conditions are met for possessed message (only trigger once)
      if (possessionRef.current.headBangs >= 3 && possessionRef.current.eyeStabs >= 3) {
        if (!possessionRef.current.possessedShown) {
          possessionRef.current.possessedShown = true;
          setShowPossessedMessage(true);
          setTimeout(() => setShowPossessedMessage(false), 3000);
        }
      }
    }

    requestRef.current = requestAnimationFrame(gameLoop);
  }, [gameState, showPossessedMessage]);

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
  }, [gameState, gameLoop]);

  return (
    <div className="relative w-full max-w-3xl mx-auto">
      {/* Face Hits Counter - OUTSIDE camera container */}
      <div className="absolute top-4 left-0 z-50 bg-black/90 px-4 py-2 rounded-lg border-2 border-red-600" style={{transform: 'translateX(-110%)'}}>
        <div className="text-red-500 font-horror text-xl">FACE HITS</div>
        <div className="text-white font-bold text-3xl text-center">{faceHits}/3</div>
      </div>

      {/* Eye Stabs Counter - OUTSIDE camera container */}
      <div className="absolute top-4 right-0 z-50 bg-black/90 px-4 py-2 rounded-lg border-2 border-red-600" style={{transform: 'translateX(110%)'}}>
        <div className="text-red-500 font-horror text-xl">EYE STABS</div>
        <div className="text-white font-bold text-3xl text-center">{eyeStabs}/3</div>
      </div>

      <div className="relative w-full aspect-[4/3] bg-black rounded-lg overflow-visible">
      {/* Artistic Border Frame with Dark Ornaments */}
      <div className="absolute inset-0 pointer-events-none z-50" style={{
        border: '20px solid transparent',
        borderImage: 'linear-gradient(135deg, #581c87 0%, #3b0764 50%, #581c87 100%) 1',
        boxShadow: '0 0 60px rgba(126, 34, 206, 0.8), inset 0 0 40px rgba(126, 34, 206, 0.3)',
        borderRadius: '8px'
      }}>
        
        {/* Dark Corner Ornaments with Chains */}
        <svg className="absolute top-2 left-2 w-24 h-24" viewBox="0 0 100 100" style={{filter: 'drop-shadow(0 0 8px rgba(147, 51, 234, 0.8))'}}>
          <circle cx="20" cy="20" r="15" fill="none" stroke="#9333ea" strokeWidth="2"/>
          <circle cx="20" cy="20" r="10" fill="none" stroke="#7e22ce" strokeWidth="1.5"/>
          <circle cx="20" cy="20" r="5" fill="#581c87"/>
          <path d="M20,35 L20,100" stroke="#6b21a8" strokeWidth="3" strokeDasharray="5,5"/>
          <path d="M35,20 L100,20" stroke="#6b21a8" strokeWidth="3" strokeDasharray="5,5"/>
          <circle cx="20" cy="50" r="4" fill="#9333ea"/>
          <circle cx="20" cy="70" r="4" fill="#9333ea"/>
          <circle cx="50" cy="20" r="4" fill="#9333ea"/>
          <circle cx="70" cy="20" r="4" fill="#9333ea"/>
        </svg>
        
        <svg className="absolute top-2 right-2 w-24 h-24" viewBox="0 0 100 100" style={{filter: 'drop-shadow(0 0 8px rgba(147, 51, 234, 0.8))'}}>
          <circle cx="80" cy="20" r="15" fill="none" stroke="#9333ea" strokeWidth="2"/>
          <circle cx="80" cy="20" r="10" fill="none" stroke="#7e22ce" strokeWidth="1.5"/>
          <circle cx="80" cy="20" r="5" fill="#581c87"/>
          <path d="M80,35 L80,100" stroke="#6b21a8" strokeWidth="3" strokeDasharray="5,5"/>
          <path d="M65,20 L0,20" stroke="#6b21a8" strokeWidth="3" strokeDasharray="5,5"/>
          <circle cx="80" cy="50" r="4" fill="#9333ea"/>
          <circle cx="80" cy="70" r="4" fill="#9333ea"/>
          <circle cx="50" cy="20" r="4" fill="#9333ea"/>
          <circle cx="30" cy="20" r="4" fill="#9333ea"/>
        </svg>
        
        <svg className="absolute bottom-2 left-2 w-24 h-24" viewBox="0 0 100 100" style={{filter: 'drop-shadow(0 0 8px rgba(147, 51, 234, 0.8))'}}>
          <circle cx="20" cy="80" r="15" fill="none" stroke="#9333ea" strokeWidth="2"/>
          <circle cx="20" cy="80" r="10" fill="none" stroke="#7e22ce" strokeWidth="1.5"/>
          <circle cx="20" cy="80" r="5" fill="#581c87"/>
          <path d="M20,65 L20,0" stroke="#6b21a8" strokeWidth="3" strokeDasharray="5,5"/>
          <path d="M35,80 L100,80" stroke="#6b21a8" strokeWidth="3" strokeDasharray="5,5"/>
          <circle cx="20" cy="50" r="4" fill="#9333ea"/>
          <circle cx="20" cy="30" r="4" fill="#9333ea"/>
          <circle cx="50" cy="80" r="4" fill="#9333ea"/>
          <circle cx="70" cy="80" r="4" fill="#9333ea"/>
        </svg>
        
        <svg className="absolute bottom-2 right-2 w-24 h-24" viewBox="0 0 100 100" style={{filter: 'drop-shadow(0 0 8px rgba(147, 51, 234, 0.8))'}}>
          <circle cx="80" cy="80" r="15" fill="none" stroke="#9333ea" strokeWidth="2"/>
          <circle cx="80" cy="80" r="10" fill="none" stroke="#7e22ce" strokeWidth="1.5"/>
          <circle cx="80" cy="80" r="5" fill="#581c87"/>
          <path d="M80,65 L80,0" stroke="#6b21a8" strokeWidth="3" strokeDasharray="5,5"/>
          <path d="M65,80 L0,80" stroke="#6b21a8" strokeWidth="3" strokeDasharray="5,5"/>
          <circle cx="80" cy="50" r="4" fill="#9333ea"/>
          <circle cx="80" cy="30" r="4" fill="#9333ea"/>
          <circle cx="50" cy="80" r="4" fill="#9333ea"/>
          <circle cx="30" cy="80" r="4" fill="#9333ea"/>
        </svg>
        
        {/* Dark Energy Wisps */}
        <div className="absolute top-[20px] left-[25%] w-2 h-20 bg-gradient-to-b from-purple-600 to-transparent opacity-60 animate-pulse" style={{filter: 'blur(2px)'}}></div>
        <div className="absolute top-[20px] right-[25%] w-2 h-16 bg-gradient-to-b from-purple-700 to-transparent opacity-60 animate-pulse" style={{filter: 'blur(2px)', animationDelay: '0.3s'}}></div>
        
        {/* Ominous Text */}
        <div className="absolute top-8 left-32 text-purple-400 font-horror text-xl opacity-80" style={{textShadow: '0 0 10px #000, 0 0 20px #7e22ce'}}>
          SURRENDER
        </div>
        <div className="absolute top-8 right-32 text-purple-400 font-horror text-xl opacity-80" style={{textShadow: '0 0 10px #000, 0 0 20px #7e22ce'}}>
          SUBMIT
        </div>
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-purple-300 font-horror text-lg opacity-80" style={{textShadow: '0 0 10px #000, 0 0 20px #7e22ce'}}>
          🔪 THE RITUAL BEGINS 🔪
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
        className="absolute inset-0 w-full h-full pointer-events-none z-10"
      />

      {/* Debug Button */}
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

      {/* Debug Info - Back at top right */}
      {showDebug && (
        <div className="absolute top-16 right-4 z-50 bg-black/90 px-4 py-3 rounded-lg border border-green-600 text-green-400 font-mono text-xs max-w-xs">
          <div>Head Down: {possessionRef.current.isHeadDown ? 'YES' : 'NO'}</div>
          <div>Face Hits: {faceHits}</div>
          <div>Eye Stabs: {eyeStabs}</div>
          <div>Hand Detected: {handPositions.length > 0 ? 'YES' : 'NO'}</div>
        </div>
      )}

      {/* Hit Flash Effect */}
      {hitFlash > 0 && (
        <div 
          className="absolute inset-0 z-50 pointer-events-none"
          style={{ backgroundColor: `rgba(255, 0, 0, ${hitFlash})` }}
        />
      )}

      {/* Blood Effect */}
      {showBlood && (
        <div className="absolute inset-0 z-40 pointer-events-none animate-pulse">
          <div className="absolute inset-0 bg-red-900/40"></div>
          <div className="absolute top-0 left-0 w-full h-1/3 bg-gradient-to-b from-red-600/60 to-transparent"></div>
        </div>
      )}

      {/* Eye Damage Effect */}
      {showEyeDamage && (
        <div className="absolute inset-0 z-40 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-20 h-20 bg-red-600/50 rounded-full blur-xl animate-pulse"></div>
          <div className="absolute top-1/4 right-1/4 w-20 h-20 bg-red-600/50 rounded-full blur-xl animate-pulse"></div>
        </div>
      )}

      {/* Effects are now drawn on canvas */}

      {/* Completion Messages - Shows for 2 seconds */}
      {showPossessedMessage && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/90 animate-pulse">
          <div className="text-center">
            <h2 className="font-horror text-6xl text-red-600 mb-4">POSSESSED</h2>
            <p className="text-yellow-400 text-2xl">The entity has taken control...</p>
          </div>
        </div>
      )}

      <div className="scanlines pointer-events-none"></div>
      <div className="vignette pointer-events-none"></div>
      </div>
    </div>
  );
};
