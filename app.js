import { GoogleGenerativeAI } from "@google/generative-ai";

// Game State Management
const GameState = {
    IDLE: 'IDLE',
    LOADING_MODELS: 'LOADING_MODELS',
    GENERATING_GHOST: 'GENERATING_GHOST',
    ACTIVE: 'ACTIVE',
    ERROR: 'ERROR'
};

class GhostInTheMirror {
    constructor() {
        this.state = GameState.IDLE;
        this.faceDetector = null;
        this.handDetector = null;
        this.video = document.getElementById('webcam');
        this.canvas = document.getElementById('debug-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.ghostImage = document.getElementById('ghost-image');
        this.showDebug = true;
        this.animationFrame = null;
        this.screamAudio = null;
        this.audioContext = null;
        
        // Ghost state
        this.ghostState = {
            isVisible: false,
            position: { x: 0.7, y: 0.3 },
            opacity: 0,
            scale: 1,
            isFleeing: false
        };
        
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        document.getElementById('start-btn').addEventListener('click', () => this.startGame());
        document.getElementById('retry-btn').addEventListener('click', () => this.reset());
        document.getElementById('debug-toggle').addEventListener('click', () => this.toggleDebug());
    }
    
    setState(newState) {
        this.state = newState;
        this.updateUI();
    }
    
    updateUI() {
        // Hide all screens
        document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
        
        // Show current screen
        switch(this.state) {
            case GameState.IDLE:
                document.getElementById('idle-screen').classList.remove('hidden');
                break;
            case GameState.LOADING_MODELS:
                document.getElementById('loading-screen').classList.remove('hidden');
                break;
            case GameState.GENERATING_GHOST:
                document.getElementById('generating-screen').classList.remove('hidden');
                break;
            case GameState.ACTIVE:
                document.getElementById('game-screen').classList.remove('hidden');
                break;
            case GameState.ERROR:
                document.getElementById('error-screen').classList.remove('hidden');
                break;
        }
    }
    
    async startGame() {
        try {
            this.setState(GameState.LOADING_MODELS);
            await this.loadModels();
            
            this.setState(GameState.GENERATING_GHOST);
            await this.generateGhostAsset();
            
            await this.startCamera();
            this.setState(GameState.ACTIVE);
            this.gameLoop();
            
        } catch (error) {
            console.error('Error starting game:', error);
            document.getElementById('error-message').textContent = error.message || String(error);
            this.setState(GameState.ERROR);
        }
    }
    
    async loadModels() {
        console.log('Loading TensorFlow models...');
        
        // Check globals
        if (!window.tf) throw new Error('TensorFlow.js not loaded');
        if (!window.faceDetection) throw new Error('Face Detection not loaded');
        if (!window.handPoseDetection) throw new Error('Hand Pose Detection not loaded');
        
        // Set backend
        await tf.setBackend('webgl');
        await tf.ready();
        console.log('TensorFlow backend ready');
        
        // Load Face Detector
        const faceModel = faceDetection.SupportedModels.MediaPipeFaceDetector;
        this.faceDetector = await faceDetection.createDetector(faceModel, {
            runtime: 'mediapipe',
            solutionPath: 'https://cdn.jsdelivr.net/npm/@mediapipe/face_detection',
            maxFaces: 1,
            modelType: 'short'
        });
        console.log('Face detector loaded');
        
        // Load Hand Detector
        const handModel = handPoseDetection.SupportedModels.MediaPipeHands;
        this.handDetector = await handPoseDetection.createDetector(handModel, {
            runtime: 'mediapipe',
            solutionPath: 'https://cdn.jsdelivr.net/npm/@mediapipe/hands',
            maxHands: 1,
            modelType: 'lite'
        });
        console.log('Hand detector loaded');
    }
    
    async generateGhostAsset() {
        console.log('Generating ghost image and scream audio with Gemini...');
        
        const apiKey = 'AIzaSyBJr084nLzSX38mLU3yR04tcqD0RnDo3Do';
        const genAI = new GoogleGenerativeAI(apiKey);
        
        try {
            // Generate ghost image
            const imagePrompt = `A terrifying, high-contrast horror movie ghost figure. The ghost is a pale, spectral woman with long hair, reaching a hand out towards the viewer. CRITICAL: The background MUST be pure solid black (#000000). The ghost should look like smoke and decay. Photorealistic style, grainy found footage look.`;
            
            console.log('Requesting ghost image from Gemini...');
            const imageModel = genAI.getGenerativeModel({ 
                model: "gemini-2.0-flash-exp"
            });
            
            const imageResult = await imageModel.generateContent({
                contents: [{ role: "user", parts: [{ text: imagePrompt }] }],
                generationConfig: {
                    responseModalities: "image"
                }
            });
            
            const response = await imageResult.response;
            console.log('Image response:', response);
            
            const candidates = response.candidates || [];
            const parts = candidates[0]?.content?.parts || [];
            const imagePart = parts.find(p => p.inlineData);
            
            if (imagePart?.inlineData?.data) {
                const mimeType = imagePart.inlineData.mimeType || 'image/png';
                this.ghostImage.src = `data:${mimeType};base64,${imagePart.inlineData.data}`;
                console.log('Ghost image loaded successfully');
            } else {
                console.error('No image data in response:', response);
                throw new Error('No image data in response');
            }
            
        } catch (error) {
            console.error('Error generating ghost image:', error);
            // Use fallback ghost image
            this.ghostImage.src = 'https://i.imgur.com/7kQJ6xM.png';
            console.log('Using fallback ghost image');
        }
        
        try {
            // Generate scream audio using Gemini TTS
            const audioPrompt = 'get away from me!';
            
            console.log('Requesting scream audio from Gemini TTS...');
            
            // Use direct REST API call for audio generation
            const audioResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{
                        parts: [{ text: audioPrompt }]
                    }],
                    generationConfig: {
                        responseModalities: ['AUDIO'],
                        speechConfig: {
                            voiceConfig: {
                                prebuiltVoiceConfig: { voiceName: 'Kore' }
                            }
                        }
                    }
                })
            });
            
            if (!audioResponse.ok) {
                const errorText = await audioResponse.text();
                console.warn('Audio generation failed:', errorText);
                this.screamAudio = null;
            } else {
                const audioData = await audioResponse.json();
                console.log('Audio response:', audioData);
                
                const audioPart = audioData.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
                
                if (audioPart?.inlineData?.data) {
                    this.screamAudio = audioPart.inlineData.data;
                    this.initAudioContext();
                    console.log('Scream audio loaded successfully, length:', audioPart.inlineData.data.length);
                } else {
                    console.warn('No audio data in response:', audioData);
                    this.screamAudio = null;
                }
            }
        } catch (error) {
            console.warn('Error generating scream audio:', error);
            this.screamAudio = null;
        }
    }
    
    initAudioContext() {
        if (!this.audioContext) {
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            this.audioContext = new AudioContextClass({ sampleRate: 24000 });
        }
    }
    
    async playScream() {
        // If we have Gemini-generated audio, play it
        if (this.screamAudio && this.audioContext) {
            try {
                const ctx = this.audioContext;
                if (ctx.state === 'suspended') await ctx.resume();
                
                // Decode base64
                const binaryString = atob(this.screamAudio);
                const len = binaryString.length;
                const bytes = new Uint8Array(len);
                for (let i = 0; i < len; i++) {
                    bytes[i] = binaryString.charCodeAt(i);
                }
                
                // Convert 16-bit PCM to Float32
                const int16Data = new Int16Array(bytes.buffer);
                const float32Data = new Float32Array(int16Data.length);
                for (let i = 0; i < int16Data.length; i++) {
                    float32Data[i] = int16Data[i] / 32768.0;
                }
                
                const buffer = ctx.createBuffer(1, float32Data.length, 24000);
                buffer.copyToChannel(float32Data, 0);
                
                const source = ctx.createBufferSource();
                source.buffer = buffer;
                source.connect(ctx.destination);
                source.start();
                
                console.log('Playing Gemini scream audio');
                return;
            } catch (e) {
                console.error('Failed to play Gemini scream:', e);
            }
        }
        
        // Fallback: Generate a scary sound effect using Web Audio API
        try {
            if (!this.audioContext) {
                this.initAudioContext();
            }
            
            const ctx = this.audioContext;
            if (ctx.state === 'suspended') await ctx.resume();
            
            // Create a scary scream-like sound
            const duration = 1.5;
            const sampleRate = ctx.sampleRate;
            const buffer = ctx.createBuffer(1, duration * sampleRate, sampleRate);
            const data = buffer.getChannelData(0);
            
            // Generate distorted noise with pitch drop (scream effect)
            for (let i = 0; i < data.length; i++) {
                const t = i / sampleRate;
                // Frequency drops from 800Hz to 200Hz
                const freq = 800 - (600 * t / duration);
                // Add noise and distortion
                const noise = (Math.random() * 2 - 1) * 0.3;
                const tone = Math.sin(2 * Math.PI * freq * t);
                // Envelope: quick attack, slow decay
                const envelope = Math.exp(-3 * t);
                data[i] = (tone * 0.7 + noise * 0.3) * envelope;
            }
            
            const source = ctx.createBufferSource();
            source.buffer = buffer;
            
            // Add some reverb/distortion
            const gainNode = ctx.createGain();
            gainNode.gain.value = 0.5;
            
            source.connect(gainNode);
            gainNode.connect(ctx.destination);
            source.start();
            
            console.log('Playing fallback scream sound');
        } catch (e) {
            console.error('Failed to play fallback scream:', e);
        }
    }
    
    async startCamera() {
        console.log('Starting camera...');
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' }
            });
            this.video.srcObject = stream;
            await this.video.play();
            
            // Set canvas size
            this.canvas.width = this.video.videoWidth;
            this.canvas.height = this.video.videoHeight;
            
        } catch (error) {
            throw new Error('Camera permission denied or not available');
        }
    }
    
    async detectFeatures() {
        const result = {
            isLookingAtCamera: false,
            handPosition: null,
            faceKeypoints: [],
            handKeypoints: []
        };
        
        try {
            // Detect face
            const faces = await this.faceDetector.estimateFaces(this.video, { flipHorizontal: true });
            if (faces.length > 0) {
                const keypoints = faces[0].keypoints;
                
                // Normalize keypoints
                result.faceKeypoints = keypoints.map(k => ({
                    x: k.x / this.video.videoWidth,
                    y: k.y / this.video.videoHeight,
                    name: k.name
                }));
                
                // Check if looking at camera
                const nose = keypoints.find(k => k.name === 'noseTip');
                const rightEar = keypoints.find(k => k.name === 'rightEarTragion');
                const leftEar = keypoints.find(k => k.name === 'leftEarTragion');
                
                if (nose && rightEar && leftEar) {
                    const distToRightEar = Math.abs(nose.x - rightEar.x);
                    const distToLeftEar = Math.abs(nose.x - leftEar.x);
                    const ratio = distToRightEar / (distToLeftEar + 0.01);
                    
                    if (ratio > 0.4 && ratio < 2.5) {
                        result.isLookingAtCamera = true;
                    }
                }
            }
            
            // Detect hands
            const hands = await this.handDetector.estimateHands(this.video, { flipHorizontal: true });
            if (hands.length > 0) {
                const indexTip = hands[0].keypoints.find(k => k.name === 'index_finger_tip');
                
                result.handKeypoints = hands[0].keypoints.map(k => ({
                    x: k.x / this.video.videoWidth,
                    y: k.y / this.video.videoHeight,
                    name: k.name
                }));
                
                if (indexTip) {
                    result.handPosition = {
                        x: indexTip.x / this.video.videoWidth,
                        y: indexTip.y / this.video.videoHeight
                    };
                }
            }
            
        } catch (error) {
            // Silent catch to prevent loop spam
        }
        
        return result;
    }
    
    drawDebug(detection) {
        if (!this.showDebug) {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            return;
        }
        
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        const w = this.canvas.width;
        const h = this.canvas.height;
        
        // Draw face keypoints
        if (detection.faceKeypoints) {
            detection.faceKeypoints.forEach(k => {
                this.ctx.beginPath();
                this.ctx.arc(k.x * w, k.y * h, 4, 0, 2 * Math.PI);
                this.ctx.fillStyle = '#00ff00';
                this.ctx.fill();
            });
        }
        
        // Draw hand skeleton
        if (detection.handKeypoints && detection.handKeypoints.length >= 21) {
            const kp = detection.handKeypoints;
            const connections = [
                [0, 1], [1, 2], [2, 3], [3, 4],
                [0, 5], [5, 6], [6, 7], [7, 8],
                [0, 9], [9, 10], [10, 11], [11, 12],
                [0, 13], [13, 14], [14, 15], [15, 16],
                [0, 17], [17, 18], [18, 19], [19, 20],
                [5, 9], [9, 13], [13, 17]
            ];
            
            // Draw lines
            connections.forEach(([i, j]) => {
                this.ctx.beginPath();
                this.ctx.moveTo(kp[i].x * w, kp[i].y * h);
                this.ctx.lineTo(kp[j].x * w, kp[j].y * h);
                this.ctx.strokeStyle = 'rgba(255, 0, 0, 0.8)';
                this.ctx.lineWidth = 2;
                this.ctx.stroke();
            });
            
            // Draw points
            kp.forEach(k => {
                this.ctx.beginPath();
                this.ctx.arc(k.x * w, k.y * h, 4, 0, 2 * Math.PI);
                this.ctx.fillStyle = '#ff0000';
                this.ctx.fill();
            });
        }
    }
    
    updateGhostState(detection) {
        const FADE_SPEED = 0.05;
        const RETREAT_SPEED = 0.04;
        
        // Visibility logic
        if (detection.isLookingAtCamera && !this.ghostState.isFleeing) {
            this.ghostState.isVisible = true;
            this.ghostState.opacity = Math.min(this.ghostState.opacity + FADE_SPEED, 1.0);
        } else {
            this.ghostState.isVisible = this.ghostState.opacity > 0;
            this.ghostState.opacity = Math.max(this.ghostState.opacity - FADE_SPEED, 0);
        }
        
        // Hand interaction
        if (detection.handPosition && this.ghostState.opacity > 0.3) {
            const ghostCenter = { 
                x: this.ghostState.position.x, 
                y: this.ghostState.position.y + 0.1 
            };
            const dist = this.getDistance(detection.handPosition, ghostCenter);
            
            if (dist < 0.15 && !this.ghostState.isFleeing) {
                this.ghostState.isFleeing = true;
                document.getElementById('flee-text').classList.remove('hidden');
                this.playScream(); // Play scream when ghost flees
            }
        }
        
        // Fleeing animation
        if (this.ghostState.isFleeing) {
            const vanishingPoint = { x: 0.5, y: 0.4 };
            const deltaX = vanishingPoint.x - this.ghostState.position.x;
            const deltaY = vanishingPoint.y - this.ghostState.position.y;
            
            this.ghostState.position.x += deltaX * RETREAT_SPEED;
            this.ghostState.position.y += deltaY * RETREAT_SPEED;
            this.ghostState.scale = Math.max(this.ghostState.scale * 0.9, 0.1);
            this.ghostState.opacity = Math.max(this.ghostState.opacity - (FADE_SPEED * 0.5), 0);
            
            if (this.ghostState.opacity <= 0) {
                this.ghostState.isFleeing = false;
                this.ghostState.position = { 
                    x: 0.65 + (Math.random() * 0.2), 
                    y: 0.2 + (Math.random() * 0.2) 
                };
                this.ghostState.scale = 1;
                document.getElementById('flee-text').classList.add('hidden');
            }
        }
        
        // Update ghost image
        this.ghostImage.style.left = `${this.ghostState.position.x * 100}%`;
        this.ghostImage.style.top = `${this.ghostState.position.y * 100}%`;
        this.ghostImage.style.opacity = this.ghostState.opacity;
        this.ghostImage.style.transform = `translate(-50%, -50%) scale(${this.ghostState.scale})`;
    }
    
    getDistance(p1, p2) {
        return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
    }
    
    updateTimestamp() {
        const now = new Date();
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');
        const ampm = now.getHours() >= 12 ? 'PM' : 'AM';
        document.getElementById('timestamp').textContent = `${hours}:${minutes}:${seconds} ${ampm}`;
    }
    
    async gameLoop() {
        if (this.state !== GameState.ACTIVE) return;
        
        if (this.video.readyState === 4) {
            const detection = await this.detectFeatures();
            this.drawDebug(detection);
            this.updateGhostState(detection);
            this.updateTimestamp();
        }
        
        this.animationFrame = requestAnimationFrame(() => this.gameLoop());
    }
    
    toggleDebug() {
        this.showDebug = !this.showDebug;
        document.getElementById('debug-toggle').textContent = 
            this.showDebug ? '[HIDE DEBUG]' : '[SHOW DEBUG]';
    }
    
    reset() {
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
        }
        if (this.video.srcObject) {
            this.video.srcObject.getTracks().forEach(track => track.stop());
        }
        this.ghostState = {
            isVisible: false,
            position: { x: 0.7, y: 0.3 },
            opacity: 0,
            scale: 1,
            isFleeing: false
        };
        this.setState(GameState.IDLE);
    }
}

// Initialize the game
const game = new GhostInTheMirror();
