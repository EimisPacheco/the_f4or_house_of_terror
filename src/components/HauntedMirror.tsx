import React, { useEffect, useRef, useState, useCallback } from 'react';
import { GameState, GhostState, DetectionResult, Keypoint } from '../types';
import { detectFeatures } from '../services/visionService';

interface HauntedMirrorProps {
  gameState: GameState;
  ghostImage: string | null;
  screamAudio: string | null; // Base64 raw PCM
  onReset: () => void;
}

// Helper to decode base64
function decodeBase64(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

export const HauntedMirror: React.FC<HauntedMirrorProps> = ({ gameState, ghostImage, screamAudio, onReset }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>();
  const audioContextRef = useRef<AudioContext | null>(null);
  const reverbBufferRef = useRef<AudioBuffer | null>(null);
  
  // Debug State
  const [showDebug, setShowDebug] = useState(true);
  const showDebugRef = useRef(true);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Sync ref with state for loop access
  useEffect(() => {
    showDebugRef.current = showDebug;
  }, [showDebug]);
  
  // Ghost Logic State
  const [ghostState, setGhostState] = useState<GhostState>({
    isVisible: false,
    position: { x: 0.7, y: 0.3 }, // Default behind right shoulder
    opacity: 0,
    scale: 1,
    isFleeing: false,
    imageUrl: ghostImage
  });

  
  // Track last position to spawn on opposite side
  const lastPositionRef = useRef({ x: 0.7, y: 0.3 });

  // --- AUDIO ENGINE ---

  // Generate a synthetic Impulse Response for a massive reverb (Ghostly Hall)
  const createReverbImpulse = (ctx: AudioContext) => {
      const duration = 2.5;
      const decay = 2.0;
      const rate = ctx.sampleRate;
      const length = rate * duration;
      const impulse = ctx.createBuffer(2, length, rate);
      const left = impulse.getChannelData(0);
      const right = impulse.getChannelData(1);

      for (let i = 0; i < length; i++) {
          const n = i / length;
          // Exponential decay noise
          left[i] = (Math.random() * 2 - 1) * Math.pow(1 - n, decay);
          right[i] = (Math.random() * 2 - 1) * Math.pow(1 - n, decay);
      }
      return impulse;
  };

  // Generate Pink Noise (Better for natural/scary sounds than White Noise)
  const createPinkNoise = (ctx: AudioContext) => {
      const bufferSize = ctx.sampleRate * 2; // 2 seconds
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      let b0, b1, b2, b3, b4, b5, b6;
      b0 = b1 = b2 = b3 = b4 = b5 = b6 = 0.0;
      for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          b0 = 0.99886 * b0 + white * 0.0555179;
          b1 = 0.99332 * b1 + white * 0.0750759;
          b2 = 0.96900 * b2 + white * 0.1538520;
          b3 = 0.86650 * b3 + white * 0.3104856;
          b4 = 0.55000 * b4 + white * 0.5329522;
          b5 = -0.7616 * b5 - white * 0.0168980;
          data[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
          data[i] *= 0.11; // Compensate for gain
          b6 = white * 0.115926;
      }
      return buffer;
  };

  // Initialize Audio Context & Reverb
  useEffect(() => {
    if (!audioContextRef.current) {
      const AudioContextClass = (window.AudioContext || (window as any).webkitAudioContext);
      const ctx = new AudioContextClass({ sampleRate: 24000 });
      audioContextRef.current = ctx;
      // Pre-calculate reverb
      reverbBufferRef.current = createReverbImpulse(ctx);
    }
    return () => {
      audioContextRef.current?.close();
    };
  }, []);

  const playScreamSound = async () => {
    console.log('🔊 playScreamSound called!');
    
    try {
      // Create a fresh audio context each time to avoid issues
      const AudioContextClass = (window.AudioContext || (window as any).webkitAudioContext);
      const ctx = new AudioContextClass();
      
      if (ctx.state === 'suspended') {
        console.log('⏸️ Resuming suspended audio context...');
        await ctx.resume();
      }
      console.log('✅ Audio context state:', ctx.state);

      const t = ctx.currentTime;
      const duration = 2.0;

      // Create reverb buffer
      const reverbDuration = 2.5;
      const decay = 2.0;
      const rate = ctx.sampleRate;
      const length = rate * reverbDuration;
      const impulse = ctx.createBuffer(2, length, rate);
      const left = impulse.getChannelData(0);
      const right = impulse.getChannelData(1);
      for (let i = 0; i < length; i++) {
          const n = i / length;
          left[i] = (Math.random() * 2 - 1) * Math.pow(1 - n, decay);
          right[i] = (Math.random() * 2 - 1) * Math.pow(1 - n, decay);
      }

      // Create pink noise buffer
      const bufferSize = ctx.sampleRate * 2;
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = noiseBuffer.getChannelData(0);
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
      for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          b0 = 0.99886 * b0 + white * 0.0555179;
          b1 = 0.99332 * b1 + white * 0.0750759;
          b2 = 0.96900 * b2 + white * 0.1538520;
          b3 = 0.86650 * b3 + white * 0.3104856;
          b4 = 0.55000 * b4 + white * 0.5329522;
          b5 = -0.7616 * b5 - white * 0.0168980;
          data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
          b6 = white * 0.115926;
      }

      // --- ORGANIC SCREAM ENGINE ---
      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(0, t);
      masterGain.gain.linearRampToValueAtTime(0.7, t + 0.1); 
      masterGain.gain.exponentialRampToValueAtTime(0.01, t + duration);

      // 1. Reverb
      const convolver = ctx.createConvolver();
      convolver.buffer = impulse;
      const reverbMix = ctx.createGain();
      reverbMix.gain.value = 0.5;

      masterGain.connect(ctx.destination);
      masterGain.connect(convolver);
      convolver.connect(reverbMix);
      reverbMix.connect(ctx.destination);

      // 2. The Vocal Cords (Carrier)
      const voiceOsc = ctx.createOscillator();
      voiceOsc.type = 'sawtooth';
      voiceOsc.frequency.setValueAtTime(400, t);
      voiceOsc.frequency.linearRampToValueAtTime(1200, t + 0.4);
      voiceOsc.frequency.exponentialRampToValueAtTime(200, t + duration);

      // 3. The Rasp/Fry (Modulator)
      const modNoise = ctx.createBufferSource();
      modNoise.buffer = noiseBuffer;
      modNoise.loop = true;

      const modFilter = ctx.createBiquadFilter();
      modFilter.type = 'lowpass';
      modFilter.frequency.value = 50;
      
      const modGain = ctx.createGain();
      modGain.gain.value = 300;

      modNoise.connect(modFilter);
      modFilter.connect(modGain);
      modGain.connect(voiceOsc.frequency);

      // 4. The Mouth (Formant Filters)
      const formant1 = ctx.createBiquadFilter();
      formant1.type = 'bandpass';
      formant1.frequency.setValueAtTime(800, t);
      formant1.Q.value = 4;

      const formant2 = ctx.createBiquadFilter();
      formant2.type = 'bandpass';
      formant2.frequency.setValueAtTime(2500, t);
      formant2.Q.value = 4;

      voiceOsc.connect(formant1);
      voiceOsc.connect(formant2);

      // 5. Distortion (Vocal Break)
      const shaper = ctx.createWaveShaper();
      const curve = new Float32Array(44100);
      const deg = Math.PI / 180;
      for (let i = 0; i < 44100; i++) {
          const x = i * 2 / 44100 - 1;
          curve[i] = (3 + 20) * x * 20 * deg / (Math.PI + 20 * Math.abs(x));
      }
      shaper.curve = curve;

      formant1.connect(shaper);
      formant2.connect(shaper);
      shaper.connect(masterGain);

      // 6. Breath Layer (High Air)
      const breathSrc = ctx.createBufferSource();
      breathSrc.buffer = noiseBuffer;
      breathSrc.loop = true;
      const breathFilter = ctx.createBiquadFilter();
      breathFilter.type = 'highpass';
      breathFilter.frequency.value = 3000;
      const breathGain = ctx.createGain();
      breathGain.gain.setValueAtTime(0, t);
      breathGain.gain.linearRampToValueAtTime(0.2, t + 0.5);
      breathGain.gain.linearRampToValueAtTime(0, t + duration);
      
      breathSrc.connect(breathFilter);
      breathFilter.connect(breathGain);
      breathGain.connect(masterGain);

      // Start everything
      console.log('🎵 Starting audio oscillators...');
      voiceOsc.start(t);
      modNoise.start(t);
      breathSrc.start(t);

      // Stop
      voiceOsc.stop(t + duration);
      modNoise.stop(t + duration);
      breathSrc.stop(t + duration);
      console.log('✅ Scream sound triggered successfully!');
      
      // Close context after sound finishes
      setTimeout(() => ctx.close(), (duration + 1) * 1000);
      
    } catch (error) {
      console.error('❌ Error playing scream:', error);
    }
  };

  // Helper to calculate distance between normalized points
  const getDistance = (p1: {x: number, y: number}, p2: {x: number, y: number}) => {
    return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
  };

  // Draw debug info on canvas
  const drawDebug = (detection: DetectionResult) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Match canvas size to display size for sharp rendering
    if (canvas.width !== canvas.clientWidth || canvas.height !== canvas.clientHeight) {
        canvas.width = canvas.clientWidth;
        canvas.height = canvas.clientHeight;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const w = canvas.width;
    const h = canvas.height;

    // Helper to draw points
    const drawPoint = (k: Keypoint, color: string) => {
        ctx.beginPath();
        ctx.arc(k.x * w, k.y * h, 4, 0, 2 * Math.PI);
        ctx.fillStyle = color;
        ctx.fill();
    };

    // Helper to draw lines
    const drawLine = (k1: Keypoint, k2: Keypoint, color: string) => {
        ctx.beginPath();
        ctx.moveTo(k1.x * w, k1.y * h);
        ctx.lineTo(k2.x * w, k2.y * h);
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.stroke();
    };

    if (detection.faceKeypoints) {
        detection.faceKeypoints.forEach(k => drawPoint(k, '#00ff00')); 
    }

    if (detection.handKeypoints && detection.handKeypoints.length >= 21) {
        const kp = detection.handKeypoints;
        const connections = [
            [0, 1], [1, 2], [2, 3], [3, 4],         // Thumb
            [0, 5], [5, 6], [6, 7], [7, 8],         // Index
            [0, 9], [9, 10], [10, 11], [11, 12],    // Middle
            [0, 13], [13, 14], [14, 15], [15, 16],  // Ring
            [0, 17], [17, 18], [18, 19], [19, 20],  // Pinky
            [5, 9], [9, 13], [13, 17]               // Palm/Knuckles
        ];

        connections.forEach(([i, j]) => {
            drawLine(kp[i], kp[j], 'rgba(255, 0, 0, 0.8)');
        });

        kp.forEach(k => drawPoint(k, '#ff0000'));
    }
  };

  const gameLoop = useCallback(async () => {
    if (gameState !== GameState.ACTIVE || !videoRef.current) return;

    const video = videoRef.current;
    if (video.readyState === 4) {
      const detection: DetectionResult = await detectFeatures(video);
      
      if (showDebugRef.current) {
        drawDebug(detection);
      } else {
        const canvas = canvasRef.current;
        if (canvas) {
            const ctx = canvas.getContext('2d');
            ctx?.clearRect(0, 0, canvas.width, canvas.height);
        }
      }

      setGhostState(prev => {
        let newState = { ...prev };
        const TARGET_OPACITY = 1.0;
        const FADE_SPEED = 0.05;
        
        // New settings for "getting further away"
        const RETREAT_SPEED = 0.04; 

        // --- 1. Visibility Logic (Face Direction) ---
        if (detection.isLookingAtCamera && !prev.isFleeing) {
          newState.isVisible = true;
          newState.opacity = Math.min(prev.opacity + FADE_SPEED, TARGET_OPACITY);
        } else {
          newState.isVisible = prev.opacity > 0;
          newState.opacity = Math.max(prev.opacity - FADE_SPEED, 0);
          
          // When ghost fades out from looking away, respawn on opposite side
          if (newState.opacity <= 0 && !newState.isFleeing && prev.opacity > 0) {
            const wasOnRight = prev.position.x > 0.5;
            const newX = wasOnRight ? 0.2 + (Math.random() * 0.15) : 0.65 + (Math.random() * 0.15);
            newState.position = { x: newX, y: 0.2 + (Math.random() * 0.2) };
            lastPositionRef.current = newState.position;
          }
        }

        // --- 2. Interaction Logic (Hand Touch) ---
        if (detection.handPosition && prev.opacity > 0.3) {
          const ghostCenter = { x: prev.position.x, y: prev.position.y + 0.1 }; 
          const dist = getDistance(detection.handPosition, ghostCenter);

          // If touch detected and not already fleeing - PLAY SCREAM DIRECTLY
          if (dist < 0.15 && !prev.isFleeing) {
            newState.isFleeing = true;
            // Call playScreamSound directly here
            playScreamSound();
          }
        }

        // --- 3. Fleeing Animation (Perspective Retreat) ---
        if (newState.isFleeing) {
            // To look like it's getting further away:
            // 1. Move towards the visual "center/vanishing point" (approx 0.5, 0.4)
            // 2. Shrink scale significantly
            
            const vanishingPoint = { x: 0.5, y: 0.4 };
            const deltaX = vanishingPoint.x - prev.position.x;
            const deltaY = vanishingPoint.y - prev.position.y;

            newState.position = {
                x: prev.position.x + (deltaX * RETREAT_SPEED),
                y: prev.position.y + (deltaY * RETREAT_SPEED)
            };

            // Exponential decay of scale for rapid "zooming out" effect
            newState.scale = Math.max(prev.scale * 0.9, 0.1);
            
            // Fade out slightly slower than it shrinks
            newState.opacity = Math.max(prev.opacity - (FADE_SPEED * 0.5), 0);
            
            // Reset fleeing if completely gone
            if (newState.opacity <= 0) {
                newState.isFleeing = false;
                // Respawn somewhere slightly different
                const wasOnRight = lastPositionRef.current.x > 0.5; const newX = wasOnRight ? 0.2 + (Math.random() * 0.15) : 0.65 + (Math.random() * 0.15); newState.position = { x: newX, y: 0.2 + (Math.random() * 0.2) }; lastPositionRef.current = newState.position; 
                newState.scale = 1;
            }
        }

        return newState;
      });
    }

    requestRef.current = requestAnimationFrame(gameLoop);
  }, [gameState]);

  useEffect(() => {
    if (gameState === GameState.ACTIVE) {
      // Start Camera
      const startCamera = async () => {
        setCameraError(null);
        try {
          // Attempt 1: Ideal constraints (User facing, specific res)
          let stream;
          try {
             stream = await navigator.mediaDevices.getUserMedia({
                video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' }
             });
          } catch (e) {
             console.warn("Ideal camera constraints failed, attempting fallback...", e);
             // Attempt 2: Fallback to basic video (any camera, any res)
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
          setCameraError("Camera permission denied or device not found. Please allow camera access in your browser address bar.");
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
    <div className="relative w-full max-w-3xl mx-auto aspect-[4/3] bg-black rounded-lg overflow-hidden">
      {/* Artistic Border Frame */}
      <div className="absolute inset-0 pointer-events-none z-30" style={{
        border: '20px solid transparent',
        borderImage: 'linear-gradient(135deg, #7f1d1d 0%, #450a0a 50%, #7f1d1d 100%) 1',
        boxShadow: '0 0 60px rgba(127, 29, 29, 0.8), inset 0 0 40px rgba(127, 29, 29, 0.3)',
        borderRadius: '8px'
      }}>
        
        {/* Detailed Corner Spider Webs - Organic Design */}
        {/* Top Left Web */}
        <svg className="absolute top-0 left-0 w-40 h-40" viewBox="0 0 150 150" style={{filter: 'drop-shadow(0 0 4px rgba(255,255,255,0.5))'}}>
          <defs>
            <radialGradient id="webGradient1" cx="0%" cy="0%">
              <stop offset="0%" style={{stopColor: '#ffffff', stopOpacity: 0.9}} />
              <stop offset="100%" style={{stopColor: '#cccccc', stopOpacity: 0.4}} />
            </radialGradient>
          </defs>
          {/* Anchor threads from corner */}
          <line x1="0" y1="0" x2="75" y2="75" stroke="url(#webGradient1)" strokeWidth="1.5" opacity="0.8"/>
          <line x1="0" y1="40" x2="75" y2="75" stroke="url(#webGradient1)" strokeWidth="1.2" opacity="0.7"/>
          <line x1="40" y1="0" x2="75" y2="75" stroke="url(#webGradient1)" strokeWidth="1.2" opacity="0.7"/>
          <line x1="0" y1="75" x2="75" y2="75" stroke="url(#webGradient1)" strokeWidth="1" opacity="0.6"/>
          <line x1="75" y1="0" x2="75" y2="75" stroke="url(#webGradient1)" strokeWidth="1" opacity="0.6"/>
          {/* Radial threads */}
          <line x1="15" y1="15" x2="75" y2="75" stroke="#e8e8e8" strokeWidth="0.8" opacity="0.7"/>
          <line x1="30" y1="10" x2="75" y2="75" stroke="#e8e8e8" strokeWidth="0.8" opacity="0.7"/>
          <line x1="10" y1="30" x2="75" y2="75" stroke="#e8e8e8" strokeWidth="0.8" opacity="0.7"/>
          {/* Spiral web structure */}
          <path d="M 20,20 Q 30,35 45,40 T 75,75" fill="none" stroke="#e8e8e8" strokeWidth="0.8" opacity="0.6"/>
          <path d="M 10,35 Q 25,45 40,50 T 75,75" fill="none" stroke="#e8e8e8" strokeWidth="0.8" opacity="0.6"/>
          <path d="M 35,10 Q 45,25 50,40 T 75,75" fill="none" stroke="#e8e8e8" strokeWidth="0.8" opacity="0.6"/>
          <path d="M 5,50 Q 20,55 35,60 T 75,75" fill="none" stroke="#e8e8e8" strokeWidth="0.7" opacity="0.5"/>
          <path d="M 50,5 Q 55,20 60,35 T 75,75" fill="none" stroke="#e8e8e8" strokeWidth="0.7" opacity="0.5"/>
          {/* Spider body */}
          <ellipse cx="75" cy="75" rx="5" ry="7" fill="#8b0000" opacity="0.95"/>
          <circle cx="75" cy="72" r="3.5" fill="#a00000" opacity="0.95"/>
          {/* Spider legs */}
          <path d="M 75,75 Q 70,70 65,68" stroke="#8b0000" strokeWidth="1.2" fill="none" opacity="0.9"/>
          <path d="M 75,75 Q 68,75 62,75" stroke="#8b0000" strokeWidth="1.2" fill="none" opacity="0.9"/>
          <path d="M 75,75 Q 70,80 65,82" stroke="#8b0000" strokeWidth="1.2" fill="none" opacity="0.9"/>
          <path d="M 75,75 Q 80,70 85,68" stroke="#8b0000" strokeWidth="1.2" fill="none" opacity="0.9"/>
          <path d="M 75,75 Q 82,75 88,75" stroke="#8b0000" strokeWidth="1.2" fill="none" opacity="0.9"/>
          <path d="M 75,75 Q 80,80 85,82" stroke="#8b0000" strokeWidth="1.2" fill="none" opacity="0.9"/>
        </svg>
        
        {/* Top Right Web */}
        <svg className="absolute top-0 right-0 w-40 h-40" viewBox="0 0 150 150" style={{filter: 'drop-shadow(0 0 4px rgba(255,255,255,0.5))', transform: 'scaleX(-1)'}}>
          <defs>
            <radialGradient id="webGradient2" cx="0%" cy="0%">
              <stop offset="0%" style={{stopColor: '#ffffff', stopOpacity: 0.9}} />
              <stop offset="100%" style={{stopColor: '#cccccc', stopOpacity: 0.4}} />
            </radialGradient>
          </defs>
          <line x1="0" y1="0" x2="75" y2="75" stroke="url(#webGradient2)" strokeWidth="1.5" opacity="0.8"/>
          <line x1="0" y1="40" x2="75" y2="75" stroke="url(#webGradient2)" strokeWidth="1.2" opacity="0.7"/>
          <line x1="40" y1="0" x2="75" y2="75" stroke="url(#webGradient2)" strokeWidth="1.2" opacity="0.7"/>
          <line x1="0" y1="75" x2="75" y2="75" stroke="url(#webGradient2)" strokeWidth="1" opacity="0.6"/>
          <line x1="75" y1="0" x2="75" y2="75" stroke="url(#webGradient2)" strokeWidth="1" opacity="0.6"/>
          <line x1="15" y1="15" x2="75" y2="75" stroke="#e8e8e8" strokeWidth="0.8" opacity="0.7"/>
          <line x1="30" y1="10" x2="75" y2="75" stroke="#e8e8e8" strokeWidth="0.8" opacity="0.7"/>
          <line x1="10" y1="30" x2="75" y2="75" stroke="#e8e8e8" strokeWidth="0.8" opacity="0.7"/>
          <path d="M 20,20 Q 30,35 45,40 T 75,75" fill="none" stroke="#e8e8e8" strokeWidth="0.8" opacity="0.6"/>
          <path d="M 10,35 Q 25,45 40,50 T 75,75" fill="none" stroke="#e8e8e8" strokeWidth="0.8" opacity="0.6"/>
          <path d="M 35,10 Q 45,25 50,40 T 75,75" fill="none" stroke="#e8e8e8" strokeWidth="0.8" opacity="0.6"/>
          <path d="M 5,50 Q 20,55 35,60 T 75,75" fill="none" stroke="#e8e8e8" strokeWidth="0.7" opacity="0.5"/>
          <path d="M 50,5 Q 55,20 60,35 T 75,75" fill="none" stroke="#e8e8e8" strokeWidth="0.7" opacity="0.5"/>
          <ellipse cx="75" cy="75" rx="5" ry="7" fill="#8b0000" opacity="0.95"/>
          <circle cx="75" cy="72" r="3.5" fill="#a00000" opacity="0.95"/>
          <path d="M 75,75 Q 70,70 65,68" stroke="#8b0000" strokeWidth="1.2" fill="none" opacity="0.9"/>
          <path d="M 75,75 Q 68,75 62,75" stroke="#8b0000" strokeWidth="1.2" fill="none" opacity="0.9"/>
          <path d="M 75,75 Q 70,80 65,82" stroke="#8b0000" strokeWidth="1.2" fill="none" opacity="0.9"/>
          <path d="M 75,75 Q 80,70 85,68" stroke="#8b0000" strokeWidth="1.2" fill="none" opacity="0.9"/>
          <path d="M 75,75 Q 82,75 88,75" stroke="#8b0000" strokeWidth="1.2" fill="none" opacity="0.9"/>
          <path d="M 75,75 Q 80,80 85,82" stroke="#8b0000" strokeWidth="1.2" fill="none" opacity="0.9"/>
        </svg>
        
        {/* Bottom Left Web */}
        <svg className="absolute bottom-0 left-0 w-40 h-40" viewBox="0 0 150 150" style={{filter: 'drop-shadow(0 0 4px rgba(255,255,255,0.5))', transform: 'scaleY(-1)'}}>
          <defs>
            <radialGradient id="webGradient3" cx="0%" cy="0%">
              <stop offset="0%" style={{stopColor: '#ffffff', stopOpacity: 0.9}} />
              <stop offset="100%" style={{stopColor: '#cccccc', stopOpacity: 0.4}} />
            </radialGradient>
          </defs>
          <line x1="0" y1="0" x2="75" y2="75" stroke="url(#webGradient3)" strokeWidth="1.5" opacity="0.8"/>
          <line x1="0" y1="40" x2="75" y2="75" stroke="url(#webGradient3)" strokeWidth="1.2" opacity="0.7"/>
          <line x1="40" y1="0" x2="75" y2="75" stroke="url(#webGradient3)" strokeWidth="1.2" opacity="0.7"/>
          <line x1="0" y1="75" x2="75" y2="75" stroke="url(#webGradient3)" strokeWidth="1" opacity="0.6"/>
          <line x1="75" y1="0" x2="75" y2="75" stroke="url(#webGradient3)" strokeWidth="1" opacity="0.6"/>
          <line x1="15" y1="15" x2="75" y2="75" stroke="#e8e8e8" strokeWidth="0.8" opacity="0.7"/>
          <line x1="30" y1="10" x2="75" y2="75" stroke="#e8e8e8" strokeWidth="0.8" opacity="0.7"/>
          <line x1="10" y1="30" x2="75" y2="75" stroke="#e8e8e8" strokeWidth="0.8" opacity="0.7"/>
          <path d="M 20,20 Q 30,35 45,40 T 75,75" fill="none" stroke="#e8e8e8" strokeWidth="0.8" opacity="0.6"/>
          <path d="M 10,35 Q 25,45 40,50 T 75,75" fill="none" stroke="#e8e8e8" strokeWidth="0.8" opacity="0.6"/>
          <path d="M 35,10 Q 45,25 50,40 T 75,75" fill="none" stroke="#e8e8e8" strokeWidth="0.8" opacity="0.6"/>
          <path d="M 5,50 Q 20,55 35,60 T 75,75" fill="none" stroke="#e8e8e8" strokeWidth="0.7" opacity="0.5"/>
          <path d="M 50,5 Q 55,20 60,35 T 75,75" fill="none" stroke="#e8e8e8" strokeWidth="0.7" opacity="0.5"/>
          <ellipse cx="75" cy="75" rx="5" ry="7" fill="#8b0000" opacity="0.95"/>
          <circle cx="75" cy="72" r="3.5" fill="#a00000" opacity="0.95"/>
          <path d="M 75,75 Q 70,70 65,68" stroke="#8b0000" strokeWidth="1.2" fill="none" opacity="0.9"/>
          <path d="M 75,75 Q 68,75 62,75" stroke="#8b0000" strokeWidth="1.2" fill="none" opacity="0.9"/>
          <path d="M 75,75 Q 70,80 65,82" stroke="#8b0000" strokeWidth="1.2" fill="none" opacity="0.9"/>
          <path d="M 75,75 Q 80,70 85,68" stroke="#8b0000" strokeWidth="1.2" fill="none" opacity="0.9"/>
          <path d="M 75,75 Q 82,75 88,75" stroke="#8b0000" strokeWidth="1.2" fill="none" opacity="0.9"/>
          <path d="M 75,75 Q 80,80 85,82" stroke="#8b0000" strokeWidth="1.2" fill="none" opacity="0.9"/>
        </svg>
        
        {/* Bottom Right Web */}
        <svg className="absolute bottom-0 right-0 w-40 h-40" viewBox="0 0 150 150" style={{filter: 'drop-shadow(0 0 4px rgba(255,255,255,0.5))', transform: 'scale(-1, -1)'}}>
          <defs>
            <radialGradient id="webGradient4" cx="0%" cy="0%">
              <stop offset="0%" style={{stopColor: '#ffffff', stopOpacity: 0.9}} />
              <stop offset="100%" style={{stopColor: '#cccccc', stopOpacity: 0.4}} />
            </radialGradient>
          </defs>
          <line x1="0" y1="0" x2="75" y2="75" stroke="url(#webGradient4)" strokeWidth="1.5" opacity="0.8"/>
          <line x1="0" y1="40" x2="75" y2="75" stroke="url(#webGradient4)" strokeWidth="1.2" opacity="0.7"/>
          <line x1="40" y1="0" x2="75" y2="75" stroke="url(#webGradient4)" strokeWidth="1.2" opacity="0.7"/>
          <line x1="0" y1="75" x2="75" y2="75" stroke="url(#webGradient4)" strokeWidth="1" opacity="0.6"/>
          <line x1="75" y1="0" x2="75" y2="75" stroke="url(#webGradient4)" strokeWidth="1" opacity="0.6"/>
          <line x1="15" y1="15" x2="75" y2="75" stroke="#e8e8e8" strokeWidth="0.8" opacity="0.7"/>
          <line x1="30" y1="10" x2="75" y2="75" stroke="#e8e8e8" strokeWidth="0.8" opacity="0.7"/>
          <line x1="10" y1="30" x2="75" y2="75" stroke="#e8e8e8" strokeWidth="0.8" opacity="0.7"/>
          <path d="M 20,20 Q 30,35 45,40 T 75,75" fill="none" stroke="#e8e8e8" strokeWidth="0.8" opacity="0.6"/>
          <path d="M 10,35 Q 25,45 40,50 T 75,75" fill="none" stroke="#e8e8e8" strokeWidth="0.8" opacity="0.6"/>
          <path d="M 35,10 Q 45,25 50,40 T 75,75" fill="none" stroke="#e8e8e8" strokeWidth="0.8" opacity="0.6"/>
          <path d="M 5,50 Q 20,55 35,60 T 75,75" fill="none" stroke="#e8e8e8" strokeWidth="0.7" opacity="0.5"/>
          <path d="M 50,5 Q 55,20 60,35 T 75,75" fill="none" stroke="#e8e8e8" strokeWidth="0.7" opacity="0.5"/>
          <ellipse cx="75" cy="75" rx="5" ry="7" fill="#8b0000" opacity="0.95"/>
          <circle cx="75" cy="72" r="3.5" fill="#a00000" opacity="0.95"/>
          <path d="M 75,75 Q 70,70 65,68" stroke="#8b0000" strokeWidth="1.2" fill="none" opacity="0.9"/>
          <path d="M 75,75 Q 68,75 62,75" stroke="#8b0000" strokeWidth="1.2" fill="none" opacity="0.9"/>
          <path d="M 75,75 Q 70,80 65,82" stroke="#8b0000" strokeWidth="1.2" fill="none" opacity="0.9"/>
          <path d="M 75,75 Q 80,70 85,68" stroke="#8b0000" strokeWidth="1.2" fill="none" opacity="0.9"/>
          <path d="M 75,75 Q 82,75 88,75" stroke="#8b0000" strokeWidth="1.2" fill="none" opacity="0.9"/>
          <path d="M 75,75 Q 80,80 85,82" stroke="#8b0000" strokeWidth="1.2" fill="none" opacity="0.9"/>
        </svg>
        
        {/* Blood Drips */}
        <div className="absolute top-[20px] left-[15%] w-2 h-16 bg-gradient-to-b from-red-600 to-transparent opacity-70" style={{filter: 'blur(1px)'}}></div>
        <div className="absolute top-[20px] left-[25%] w-1.5 h-12 bg-gradient-to-b from-red-700 to-transparent opacity-60" style={{filter: 'blur(1px)'}}></div>
        <div className="absolute top-[20px] right-[20%] w-2 h-20 bg-gradient-to-b from-red-600 to-transparent opacity-70" style={{filter: 'blur(1px)'}}></div>
        
        {/* Creepy Text Overlays */}
        <div className="absolute top-8 left-32 text-red-600 font-horror text-2xl opacity-80" style={{textShadow: '0 0 10px #000, 0 0 20px #7f1d1d'}}>
          DON'T BLINK
        </div>
        <div className="absolute top-8 right-32 text-red-600 font-horror text-2xl opacity-80" style={{textShadow: '0 0 10px #000, 0 0 20px #7f1d1d'}}>
          THEY SEE YOU
        </div>
        <div className="absolute bottom-8 left-32 text-red-600 font-horror text-2xl opacity-80" style={{textShadow: '0 0 10px #000, 0 0 20px #7f1d1d'}}>
          NO ESCAPE
        </div>
        <div className="absolute bottom-8 right-24 text-red-600 font-horror text-2xl opacity-80" style={{textShadow: '0 0 10px #000, 0 0 20px #7f1d1d'}}>
          LOOK BEHIND YOU
        </div>
      </div>
      
      {cameraError && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/90 p-8 text-center">
            <div>
                <h3 className="text-red-600 font-horror text-3xl mb-4">SIGHTLESS</h3>
                <p className="text-neutral-400">{cameraError}</p>
                <button 
                  onClick={() => window.location.reload()}
                  className="mt-6 px-4 py-2 border border-red-800 text-red-500 hover:bg-red-900/20 rounded"
                >
                  Reload Page
                </button>
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

      {ghostImage && (
        <div 
            className="absolute pointer-events-none transition-opacity duration-100"
            style={{
                left: `${ghostState.position.x * 100}%`,
                top: `${ghostState.position.y * 100}%`,
                width: '65%',
                height: 'auto',
                opacity: ghostState.opacity,
                transform: `translate(-50%, -50%) scale(${ghostState.scale})`,
                mixBlendMode: 'screen',
                filter: 'sepia(0.2) contrast(1.4) brightness(1.3)'
            }}
        >
            <img src={ghostImage} alt="Ghost" className="w-full h-full animate-pulse" />
        </div>
      )}

      {gameState === GameState.ACTIVE && ghostState.isFleeing && (
         <div className="absolute top-1/2 left-0 right-0 text-center text-red-600 font-horror text-4xl animate-ping pointer-events-none" style={{ textShadow: '0 0 10px #000' }}>
             GET AWAY!
         </div>
      )}
    </div>
  );
};