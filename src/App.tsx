
import React, { useState, useEffect } from 'react';
import { GameState, GameMode } from './types';
import { loadModels } from './services/visionService';
import { generateGhostAsset, generateScreamAsset, generateZombieFaceAsset, generateDamagedEyeAsset, generateDaggerAsset } from './services/geminiService';
import { generateFlyingGhostSVG } from './services/generateFlyingGhost';
import { HauntedMirror } from './components/HauntedMirror';
import { FlyingGhosts } from './components/FlyingGhosts';
import { BatCatcher } from './components/BatCatcher';
import { Possession } from './components/Possession';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(GameState.IDLE);
  const [gameMode, setGameMode] = useState<GameMode>(GameMode.MIRROR);
  const [ghostImage, setGhostImage] = useState<string | null>(null);
  const [flyingGhostImage, setFlyingGhostImage] = useState<string | null>(null);
  const [screamAudio, setScreamAudio] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>('');
  
  // Possession Assets
  const [possessionFace, setPossessionFace] = useState<string | null>(null);
  const [possessionEye, setPossessionEye] = useState<string | null>(null);
  const [possessionDagger, setPossessionDagger] = useState<string | null>(null);

  // Reset to main menu
  const resetGame = () => {
    setGameState(GameState.IDLE);
    setGhostImage(null);
    setScreamAudio(null);
    setErrorMsg('');
  };

  // Initializer
  const startGame = async () => {
    try {
      setGameState(GameState.LOADING_MODELS);
      
      // Generate flying ghost SVG
      setFlyingGhostImage(generateFlyingGhostSVG());
      await loadModels();
      
      // Generate assets based on mode
      if (gameMode === GameMode.MIRROR) {
        setGameState(GameState.GENERATING_GHOST);
        
        // Generate both assets in parallel
        const [imageUrl, audioData] = await Promise.all([
          generateGhostAsset(),
          generateScreamAsset()
        ]);
        
        setGhostImage(imageUrl);
        setScreamAudio(audioData);
      } else if (gameMode === GameMode.POSSESSION) {
        setGameState(GameState.GENERATING_GHOST);
        
        // Load multiple assets for possession with retry logic
        try {
          const [face, eye, dagger] = await Promise.all([
            generateZombieFaceAsset(),
            generateDamagedEyeAsset(),
            generateDaggerAsset()
          ]);
          
          if (!face || !eye || !dagger) {
            throw new Error('Failed to generate possession assets. Please try again.');
          }
          
          setPossessionFace(face);
          setPossessionEye(eye);
          setPossessionDagger(dagger);
        } catch (assetError: any) {
          throw new Error(`Asset generation failed: ${assetError.message || 'Unknown error'}. Try again.`);
        }
      }
      
      setGameState(GameState.ACTIVE);
    } catch (e: any) {
      console.error(e);
      setErrorMsg(e.message || String(e));
      setGameState(GameState.ERROR);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-red-50 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-[url('https://picsum.photos/1920/1080?grayscale&blur=10')] opacity-10 bg-cover bg-center pointer-events-none"></div>

      <header className="z-10 text-center mb-8">
        <h1 className="font-horror text-6xl md:text-8xl text-red-600 tracking-wider drop-shadow-[0_0_15px_rgba(255,0,0,0.5)]">
          THE FOUR HOUSE OF TERROR
        </h1>
        <p className="font-sans text-neutral-400 mt-2 text-lg max-w-md mx-auto">
          {gameMode === GameMode.MIRROR 
            ? "Look directly at the mirror to summon it. Look away to banish it. Do not try to touch it..."
            : gameMode === GameMode.FLYING_GHOSTS
            ? "Move your finger in circles to control the flying ghosts!"
            : gameMode === GameMode.BAT_CATCHER
            ? "Catch the flying bats with your hand to score points!"
            : "You are possessed. Hit your face and stab your eyes..."}
        </p>
      </header>

      <main className="w-full z-10 flex flex-col items-center">
        {gameState === GameState.IDLE && (
          <div className="bg-neutral-900/80 p-8 rounded-xl border border-neutral-800 backdrop-blur-sm max-w-md text-center shadow-2xl">
            <div className="mb-6 text-yellow-600 text-5xl">⚠️</div>
            <h2 className="text-2xl font-bold mb-4 text-white">Warning</h2>
            <p className="mb-6 text-neutral-300">
              This experience uses your camera and AI to detect your face and hands. 
              Ensure you are in a well-lit room, but keep the mood spooky.
            </p>
            
            {/* Mode Selection */}
            <div className="mb-6 flex gap-3 flex-wrap justify-center">
              <button
                onClick={() => setGameMode(GameMode.MIRROR)}
                className={`py-3 px-6 rounded-lg font-bold transition-all text-base ${
                  gameMode === GameMode.MIRROR
                    ? 'bg-red-700 text-white shadow-[0_0_20px_rgba(220,38,38,0.8)] border-2 border-red-500'
                    : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700 border-2 border-neutral-700'
                }`}
              >
                👻 Mirror Mode
              </button>
              <button
                onClick={() => setGameMode(GameMode.FLYING_GHOSTS)}
                className={`py-3 px-6 rounded-lg font-bold transition-all text-base ${
                  gameMode === GameMode.FLYING_GHOSTS
                    ? 'bg-blue-700 text-white shadow-[0_0_20px_rgba(59,130,246,0.8)] border-2 border-blue-500'
                    : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700 border-2 border-neutral-700'
                }`}
              >
                🌀 Flying Ghosts
              </button>
              <button
                onClick={() => setGameMode(GameMode.BAT_CATCHER)}
                className={`py-3 px-6 rounded-lg font-bold transition-all text-base ${
                  gameMode === GameMode.BAT_CATCHER
                    ? 'bg-orange-700 text-white shadow-[0_0_20px_rgba(234,88,12,0.8)] border-2 border-orange-500'
                    : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700 border-2 border-neutral-700'
                }`}
              >
                🦇 Bat Catcher
              </button>
              <button
                onClick={() => setGameMode(GameMode.POSSESSION)}
                className={`py-3 px-6 rounded-lg font-bold transition-all text-base ${
                  gameMode === GameMode.POSSESSION
                    ? 'bg-purple-700 text-white shadow-[0_0_20px_rgba(147,51,234,0.8)] border-2 border-purple-500'
                    : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700 border-2 border-neutral-700'
                }`}
              >
                🔪 Possession
              </button>
            </div>
            
            <button 
              onClick={startGame}
              className="bg-red-800 hover:bg-red-700 text-white font-bold py-4 px-8 rounded-full transition-all transform hover:scale-105 shadow-[0_0_20px_rgba(220,38,38,0.5)] uppercase tracking-widest"
            >
              Start the Ritual
            </button>
          </div>
        )}

        {gameState === GameState.LOADING_MODELS && (
          <div className="text-center animate-pulse">
            <h3 className="text-3xl font-horror text-neutral-300">Calibrating Spiritual Sensors...</h3>
            <p className="text-sm text-neutral-500 mt-2">Loading TensorFlow Vision Models</p>
          </div>
        )}

        {gameState === GameState.GENERATING_GHOST && (
          <div className="text-center animate-pulse">
            <h3 className="text-3xl font-horror text-red-500">Summoning the Entity...</h3>
            <p className="text-sm text-neutral-500 mt-2">Consulting Gemini Nano & TTS</p>
          </div>
        )}

        {gameState === GameState.ERROR && (
          <div className="bg-red-950/90 p-6 rounded-lg border border-red-600 text-center max-w-md">
            <h3 className="text-2xl font-bold text-red-200 mb-2">Ritual Failed</h3>
            <p className="text-red-100 mb-4 break-words text-sm font-mono">{errorMsg}</p>
            <button 
              onClick={() => setGameState(GameState.IDLE)}
              className="underline text-white hover:text-red-300"
            >
              Try Again
            </button>
          </div>
        )}

        {gameState === GameState.ACTIVE && (
          <div className="flex flex-col items-center w-full">
            {gameMode === GameMode.MIRROR ? (
              <HauntedMirror 
                gameState={gameState}
                ghostImage={ghostImage} 
                screamAudio={screamAudio}
                onReset={resetGame}
              />
            ) : gameMode === GameMode.FLYING_GHOSTS ? (
              <FlyingGhosts 
                gameState={gameState}
                ghostImage={flyingGhostImage}
                onReset={resetGame}
              />
            ) : gameMode === GameMode.BAT_CATCHER ? (
              <BatCatcher 
                gameState={gameState}
                onReset={resetGame}
              />
            ) : (
              <Possession 
                gameState={gameState}
                onReset={resetGame}
                possessionAssets={{
                  face: possessionFace,
                  eye: possessionEye,
                  dagger: possessionDagger
                }}
              />
            )}
            
            <div className="mt-6 text-neutral-500 text-sm font-mono border border-neutral-800 p-3 rounded bg-black/50">
              <span className="text-red-500 mr-2">●</span> LIVE FEED ACTIVE
              <span className="mx-2">|</span>
              MODE: {gameMode === GameMode.MIRROR ? 'MIRROR' : gameMode === GameMode.FLYING_GHOSTS ? 'FLYING GHOSTS' : gameMode === GameMode.BAT_CATCHER ? 'BAT CATCHER' : 'POSSESSION'}
              <span className="mx-2">|</span>
              HAND TRACKER: ONLINE
            </div>
          </div>
        )}
      </main>

      <footer className="absolute bottom-4 text-neutral-600 text-xs z-0">
        Powered by Gemini 2.5 Flash, TensorFlow.js & React
      </footer>
    </div>
  );
};

export default App;
