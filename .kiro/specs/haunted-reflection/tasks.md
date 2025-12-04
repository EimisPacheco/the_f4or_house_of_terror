# Implementation Plan

- [ ] 1. Set up project structure and core types
  - Create TypeScript interfaces for GameState, GameMode, DetectionResult, and entity models
  - Set up Vite configuration with React and TypeScript
  - Configure Tailwind CSS with custom horror-themed classes
  - _Requirements: 1.1, 1.2_

- [ ] 2. Implement vision service with TensorFlow.js
  - [ ] 2.1 Create visionService.ts with model loading functions
    - Implement loadModels() to initialize MediaPipe Face Detection and Hand Pose Detection
    - Add error handling for model loading failures
    - _Requirements: 2.1, 2.2_
  
  - [ ] 2.2 Implement face detection and gaze tracking
    - Create detectFeatures() function to process video frames
    - Implement gaze detection algorithm based on eye positions
    - Return normalized face keypoints (0-1 coordinates)
    - _Requirements: 2.1, 2.3_
  
  - [ ] 2.3 Implement hand detection and pose classification
    - Detect 21 hand keypoints per hand
    - Calculate normalized hand position from keypoints
    - Implement pointing gesture classification
    - _Requirements: 2.2, 2.4, 2.5_
  
  - [ ] 2.4 Write property test for normalized coordinates
    - **Property 6: Normalized coordinates**
    - **Validates: Requirements 2.4**
  
  - [ ] 2.5 Write property test for hand keypoint count
    - **Property 4: Hand keypoint count**
    - **Validates: Requirements 2.2**

- [ ] 3. Implement Gemini AI asset generation service
  - [ ] 3.1 Create geminiService.ts with API integration
    - Set up Gemini API client with environment variable for API key
    - Implement retry logic for failed generations
    - Add error handling and timeout management
    - _Requirements: 7.1, 7.2, 7.3, 7.4_
  
  - [ ] 3.2 Implement ghost and audio asset generators
    - Create generateGhostAsset() with spooky prompt
    - Create generateScreamAsset() for audio generation
    - Return base64-encoded data URLs
    - _Requirements: 7.1, 7.2_
  
  - [ ] 3.3 Implement possession asset generators
    - Create generateZombieFaceAsset() for face mask
    - Create generateDamagedEyeAsset() for eye overlay
    - Create generateDaggerAsset() for hand weapon
    - _Requirements: 7.3_
  
  - [ ] 3.4 Implement image processing for transparency
    - Create chroma key function to remove white backgrounds
    - Process RGB values and set alpha channel
    - Return processed image as HTMLImageElement
    - _Requirements: 7.5_
  
  - [ ] 3.5 Write property test for chroma key transparency
    - **Property 25: Chroma key transparency**
    - **Validates: Requirements 7.5**

- [ ] 4. Implement Web Audio API synthesis
  - [ ] 4.1 Create audio synthesis utilities
    - Implement createReverbImpulse() for reverb effects
    - Implement createPinkNoise() for noise generation
    - Add helper functions for oscillator and filter configuration
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_
  
  - [ ] 4.2 Implement scream sound synthesis
    - Create playScreamSound() with formant filters
    - Add distortion and reverb effects
    - Implement frequency modulation for organic sound
    - _Requirements: 8.1_
  
  - [ ] 4.3 Implement game-specific sound effects
    - Create playBatSound() for high-pitched chirp
    - Create playExplosionSound() with noise burst
    - Create playHitSound() for thud effect
    - Create playSinisterLaugh() with HA-HA pattern
    - _Requirements: 8.2, 8.3, 8.4, 8.5_

- [ ] 5. Implement main App component and mode selection
  - [ ] 5.1 Create App.tsx with state management
    - Set up game state and mode state
    - Implement mode selection UI with visual feedback
    - Add "Start the Ritual" button with state transition
    - _Requirements: 1.1, 1.2, 1.3_
  
  - [ ] 5.2 Implement loading and error states
    - Create loading screen for model initialization
    - Create loading screen for asset generation
    - Implement error state with retry functionality
    - _Requirements: 1.3, 7.4_
  
  - [ ] 5.3 Write property test for mode selection
    - **Property 1: Mode selection visual feedback**
    - **Validates: Requirements 1.2**
  
  - [ ] 5.4 Write property test for state transition
    - **Property 2: State transition on start**
    - **Validates: Requirements 1.3**

- [ ] 6. Implement HauntedMirror component
  - [ ] 6.1 Create HauntedMirror.tsx with camera setup
    - Set up video element and canvas for rendering
    - Implement camera permission request with fallback
    - Add error handling for camera access denial
    - _Requirements: 1.4, 1.5_
  
  - [ ] 6.2 Implement ghost state management
    - Create ghost state with position, opacity, scale, and fleeing status
    - Implement game loop with requestAnimationFrame
    - Add debug visualization toggle
    - _Requirements: 3.1, 3.2, 3.3, 3.4_
  
  - [ ] 6.3 Implement ghost visibility logic
    - Fade in ghost when user looks at camera
    - Fade out ghost when user looks away
    - Respawn ghost on opposite side after fade out
    - _Requirements: 3.1, 3.2, 3.3_
  
  - [ ] 6.4 Implement collision detection and fleeing
    - Calculate distance between hand and ghost
    - Trigger fleeing animation on collision
    - Implement perspective retreat with scale reduction
    - Play scream sound on flee trigger
    - _Requirements: 3.4, 3.5_
  
  - [ ] 6.5 Add decorative border with spider webs
    - Create SVG spider web decorations for corners
    - Add blood drip effects
    - Add creepy text overlays
    - _Requirements: 9.1_
  
  - [ ] 6.6 Write property test for ghost fade in
    - **Property 8: Ghost fade in**
    - **Validates: Requirements 3.1**
  
  - [ ] 6.7 Write property test for ghost fade out
    - **Property 9: Ghost fade out**
    - **Validates: Requirements 3.2**
  
  - [ ] 6.8 Write property test for respawn position
    - **Property 10: Ghost respawn position inversion**
    - **Validates: Requirements 3.3**
  
  - [ ] 6.9 Write property test for collision detection
    - **Property 11: Collision triggers fleeing**
    - **Validates: Requirements 3.4**

- [ ] 7. Implement FlyingGhosts component
  - [ ] 7.1 Create FlyingGhosts.tsx with spirit entities
    - Set up multiple spirit entities with orbital parameters
    - Implement camera setup and game loop
    - Add debug visualization for target position
    - _Requirements: 4.1_
  
  - [ ] 7.2 Implement circular motion detection
    - Track hand position history (last 5 frames)
    - Calculate cumulative distance traveled
    - Detect swirl when distance > threshold AND pointing gesture
    - _Requirements: 4.2_
  
  - [ ] 7.3 Implement spirit orbital mechanics
    - Calculate orbital position using angle and radius
    - Implement smooth interpolation with lerp
    - Increase speed during swirl mode
    - _Requirements: 4.1, 4.2_
  
  - [ ] 7.4 Implement head-lock mechanism
    - Lock spirits to orbit above head when swirl starts
    - Maintain lock for minimum 2 seconds
    - Use nose keypoint for head position
    - _Requirements: 4.3_
  
  - [ ] 7.5 Implement spirit visibility and sound
    - Fade in spirits when hand detected
    - Fade out spirits when hand not detected
    - Play flying sound during swirl
    - _Requirements: 4.1, 4.4, 4.5_
  
  - [ ] 7.6 Add decorative border with mystical symbols
    - Create SVG mystical symbols for corners
    - Add ethereal wisp effects
    - Add mystical text overlays
    - _Requirements: 9.2_
  
  - [ ] 7.7 Write property test for spirit visibility
    - **Property 12: Spirit visibility with hand**
    - **Validates: Requirements 4.1**
  
  - [ ] 7.8 Write property test for swirl speed
    - **Property 13: Swirl increases speed**
    - **Validates: Requirements 4.2**
  
  - [ ] 7.9 Write property test for swirl lock
    - **Property 14: Swirl lock duration**
    - **Validates: Requirements 4.3**

- [ ] 8. Implement BatCatcher component
  - [ ] 8.1 Create BatCatcher.tsx with bat entities
    - Set up bat state with position, velocity, rotation
    - Implement camera setup and game loop
    - Add score and level state management
    - _Requirements: 5.1, 5.2_
  
  - [ ] 8.2 Implement bat spawning system
    - Spawn bats from left and right edges at intervals
    - Adjust spawn rate based on level (1200ms L1, 800ms L2)
    - Randomize bat trajectory and rotation
    - Play chirp sound on spawn
    - _Requirements: 5.1_
  
  - [ ] 8.3 Implement collision detection with finger
    - Use index finger tip (keypoint 8) as collision point
    - Calculate distance between finger and bat
    - Remove bat, increment score, create explosion on collision
    - Play explosion sound on collision
    - _Requirements: 5.2, 5.3_
  
  - [ ] 8.4 Implement level progression and timer
    - Track time remaining in current level
    - Advance to level 2 after 60 seconds
    - Increase bat speed and spawn rate in level 2
    - Trigger game over after level 2 completes
    - _Requirements: 5.4, 5.5_
  
  - [ ] 8.5 Implement game over screen
    - Display final score
    - Show creepy laughing face animation
    - Play sinister laugh sound
    - _Requirements: 5.5_
  
  - [ ] 8.6 Add decorative border with golden ornaments
    - Create SVG golden ornaments for corners
    - Add decorative text overlays
    - _Requirements: 9.3_
  
  - [ ] 8.7 Write property test for bat spawn intervals
    - **Property 16: Bat spawn intervals**
    - **Validates: Requirements 5.1**
  
  - [ ] 8.8 Write property test for collision state updates
    - **Property 17: Collision updates state**
    - **Validates: Requirements 5.2**
  
  - [ ] 8.9 Write property test for level progression
    - **Property 18: Level progression**
    - **Validates: Requirements 5.4**

- [ ] 9. Implement Possession component
  - [ ] 9.1 Create Possession.tsx with possession state
    - Set up possession state with counters and cooldowns
    - Implement camera setup and game loop
    - Add hit flash effect state
    - _Requirements: 6.1, 6.2_
  
  - [ ] 9.2 Implement face hit detection
    - Detect when both eyes Y > threshold (0.70)
    - Track head down state to detect impact
    - Implement 500ms cooldown between hits
    - Play hit sound and trigger flash
    - _Requirements: 6.1_
  
  - [ ] 9.3 Implement eye stab detection
    - Calculate distance between hand and each eye
    - Detect collision when distance < threshold (0.08)
    - Implement 1000ms cooldown between stabs
    - Play hit sound and trigger flash
    - _Requirements: 6.2_
  
  - [ ] 9.4 Implement asset rendering on canvas
    - Draw dagger on hand position with rotation
    - Draw zombie face mask when hits >= 3
    - Draw damaged eyes when stabs >= 3
    - Size assets based on eye distance
    - _Requirements: 6.3, 6.4_
  
  - [ ] 9.5 Implement possession completion
    - Display "POSSESSED" message when both counters >= 3
    - Show message for 3 seconds
    - Add blood and eye damage visual effects
    - _Requirements: 6.5_
  
  - [ ] 9.6 Add decorative border with dark chains
    - Create SVG chain decorations for corners
    - Add dark energy wisp effects
    - Add ominous text overlays
    - _Requirements: 9.4_
  
  - [ ] 9.7 Write property test for head hit detection
    - **Property 20: Head hit detection**
    - **Validates: Requirements 6.1**
  
  - [ ] 9.8 Write property test for eye stab detection
    - **Property 21: Eye stab detection**
    - **Validates: Requirements 6.2**
  
  - [ ] 9.9 Write property test for face mask rendering
    - **Property 22: Face mask rendering**
    - **Validates: Requirements 6.3**

- [ ] 10. Implement debug visualization system
  - [ ] 10.1 Add debug toggle to all components
    - Create debug button in each game mode
    - Implement showDebug state with ref sync
    - _Requirements: 10.1, 10.2, 10.5_
  
  - [ ] 10.2 Implement face keypoint visualization
    - Draw green dots for face keypoints
    - Add labels for keypoint names
    - _Requirements: 10.1_
  
  - [ ] 10.3 Implement hand keypoint visualization
    - Draw red dots for hand keypoints
    - Draw skeletal connections between joints
    - Highlight index finger tip in different color
    - _Requirements: 10.2_
  
  - [ ] 10.4 Add mode-specific debug visualizations
    - Add target crosshair for Bat Catcher mode
    - Add hit threshold line for Possession mode
    - Add head target indicator for Flying Ghosts mode
    - _Requirements: 10.3, 10.4_

- [ ] 11. Add visual effects and polish
  - [ ] 11.1 Implement scanline and vignette effects
    - Add CSS classes for scanline overlay
    - Add CSS classes for vignette overlay
    - Apply to all game modes
    - _Requirements: 9.5_
  
  - [ ] 11.2 Add explosion animations
    - Create explosion component with emoji
    - Implement fade-out animation
    - Auto-remove after animation completes
    - _Requirements: 5.2_
  
  - [ ] 11.3 Add blood and damage effects
    - Create blood overlay for Possession mode
    - Add red flash effect on hits
    - Implement eye damage visual effects
    - _Requirements: 6.1, 6.2_

- [ ] 12. Implement error handling and recovery
  - [ ] 12.1 Add camera error handling
    - Implement fallback constraints for camera
    - Display user-friendly error messages
    - Add reload button for retry
    - _Requirements: 1.4, 1.5_
  
  - [ ] 12.2 Add asset generation error handling
    - Wrap all Gemini calls in try-catch
    - Display specific error messages
    - Allow return to mode selection
    - _Requirements: 7.4_
  
  - [ ] 12.3 Add audio error handling
    - Check for AudioContext support
    - Resume suspended contexts
    - Silently fail audio without blocking gameplay
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [ ] 13. Final integration and testing
  - [ ] 13.1 Test all game modes end-to-end
    - Verify mode selection and transitions
    - Test camera permission flow
    - Verify asset generation for all modes
    - Test gameplay mechanics in each mode
    - _Requirements: All_
  
  - [ ] 13.2 Test error scenarios
    - Test camera denial
    - Test asset generation failures
    - Test model loading failures
    - Verify error messages and recovery
    - _Requirements: 1.5, 7.4_
  
  - [ ] 13.3 Run all property-based tests
    - Execute all property tests with 100 iterations
    - Verify all properties pass
    - Fix any failing properties
    - _Requirements: All testable properties_
  
  - [ ] 13.4 Performance optimization
    - Profile frame rate and detection latency
    - Optimize canvas rendering
    - Reduce memory usage
    - Test on target browsers
    - _Requirements: All_

- [ ] 14. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
