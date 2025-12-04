# Design Document

## Overview

The Four House of Terror is a browser-based interactive horror experience built with React, TypeScript, TensorFlow.js, and Google's Gemini AI. The application uses real-time computer vision to track the user's face and hands, enabling gesture-based interactions across four distinct game modes. Each mode provides a unique horror experience with AI-generated assets, synthesized audio, and visual effects.

The architecture follows a component-based design with clear separation between vision detection, asset generation, game logic, and UI rendering. The system prioritizes real-time performance while maintaining smooth animations and responsive interactions.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         App.tsx                              │
│  (Main Application State & Mode Selection)                   │
└────────────┬────────────────────────────────────────────────┘
             │
             ├─────────────────┬──────────────────┬────────────┐
             │                 │                  │            │
┌────────────▼──────┐ ┌───────▼────────┐ ┌──────▼──────┐ ┌──▼─────────┐
│  HauntedMirror    │ │ FlyingGhosts   │ │ BatCatcher  │ │ Possession │
│   Component       │ │   Component    │ │  Component  │ │ Component  │
└────────┬──────────┘ └───────┬────────┘ └──────┬──────┘ └──┬─────────┘
         │                    │                  │            │
         └────────────────────┴──────────────────┴────────────┘
                              │
                 ┌────────────┴────────────┐
                 │                         │
        ┌────────▼──────────┐    ┌────────▼──────────┐
        │  visionService.ts │    │ geminiService.ts  │
        │  (TensorFlow.js)  │    │  (AI Generation)  │
        └───────────────────┘    └───────────────────┘
```

### Technology Stack

- **Frontend Framework**: React 19.2.0 with TypeScript
- **Computer Vision**: TensorFlow.js with MediaPipe Face Detection and Hand Pose Detection
- **AI Generation**: Google Gemini 2.5 Flash for image and audio generation
- **Audio**: Web Audio API for real-time sound synthesis
- **Build Tool**: Vite 6.2.0
- **Styling**: Tailwind CSS with custom horror-themed classes

## Components and Interfaces

### Core Types (types.ts)

```typescript
enum GameState {
  IDLE, LOADING_MODELS, GENERATING_GHOST, ACTIVE, ERROR
}

enum GameMode {
  MIRROR, FLYING_GHOSTS, BAT_CATCHER, POSSESSION
}

interface Keypoint {
  x: number;  // Normalized 0-1
  y: number;  // Normalized 0-1
  name?: string;
}

interface DetectionResult {
  isLookingAtCamera: boolean;
  handPosition: { x: number; y: number } | null;
  faceKeypoints?: Keypoint[];
  handKeypoints?: Keypoint[];
  handPose?: string;
}
```

### Vision Service (visionService.ts)

**Purpose**: Provides real-time face and hand detection using TensorFlow.js models.

**Key Functions**:
- `loadModels()`: Initializes MediaPipe Face Detection and Hand Pose Detection models
- `detectFeatures(video: HTMLVideoElement): Promise<DetectionResult>`: Analyzes video frame and returns detected features

**Detection Logic**:
- Face detection uses MediaPipe Face Detection with 6 keypoints (eyes, nose, mouth, ears)
- Hand detection uses MediaPipe Hand Pose with 21 keypoints per hand
- Gaze detection calculates if user is looking at camera based on eye positions
- Hand pose classification identifies pointing gestures based on finger extension

### Gemini Service (geminiService.ts)

**Purpose**: Generates AI-powered visual and audio assets using Google's Gemini API.

**Key Functions**:
- `generateGhostAsset()`: Creates a spooky ghost image
- `generateScreamAsset()`: Generates a scream audio file
- `generateZombieFaceAsset()`: Creates a zombie face mask
- `generateDamagedEyeAsset()`: Creates a damaged eye image
- `generateDaggerAsset()`: Creates a dagger image

**Generation Strategy**:
- Uses detailed prompts to guide AI generation
- Implements retry logic for failed generations
- Returns base64-encoded data URLs for immediate use

### Game Mode Components

#### HauntedMirror Component

**State Management**:
- `ghostState`: Tracks ghost visibility, position, opacity, scale, and fleeing status
- `showDebug`: Toggles debug visualization
- `cameraError`: Stores camera permission errors

**Game Loop**:
1. Detect face direction and hand position
2. Update ghost visibility based on gaze
3. Check for hand-ghost collision
4. Trigger fleeing animation and scream sound on touch
5. Respawn ghost on opposite side after fade out

**Audio Synthesis**:
- Scream uses sawtooth oscillator with formant filters
- Applies distortion and reverb for organic sound
- Modulates frequency from 400Hz to 200Hz

#### FlyingGhosts Component

**State Management**:
- `spirits`: Array of 3 ghost entities with position, angle, radius, and opacity
- `handHistoryRef`: Tracks recent hand positions to detect circular motion
- `isSwirlingRef`: Boolean flag for swirl detection
- `swirlLockTimeRef`: Timestamp for head-lock duration

**Swirl Detection Algorithm**:
1. Store last 5 hand positions
2. Calculate cumulative distance traveled
3. If distance > 0.12 AND pointing gesture detected, activate swirl
4. Lock spirits to orbit above head for 2 seconds
5. Increase orbital speed during swirl

**Orbital Motion**:
- Each spirit orbits at different radius and speed
- Position calculated using: `x = centerX + cos(angle) * radius`
- Smooth interpolation using lerp factor (0.5 during swirl, 0.1 normal)

#### BatCatcher Component

**State Management**:
- `bats`: Array of bat entities with position, velocity, scale, rotation
- `explosions`: Array of explosion effects with timestamp
- `score`: Player's current score
- `level`: Current difficulty level (1 or 2)
- `timeLeft`: Remaining seconds in current level

**Bat Spawning**:
- Level 1: Spawn every 1.2 seconds
- Level 2: Spawn every 0.8 seconds with 2.5x speed multiplier
- Bats spawn from left or right edge with random Y position
- Each bat has unique rotation speed and trajectory

**Collision Detection**:
- Uses index finger tip (keypoint 8) as collision point
- Hit radius: 0.05 * bat scale
- Distance formula: `sqrt((x1-x2)² + (y1-y2)²)`
- On collision: Remove bat, add 10 points, create explosion, play sound

**Level Progression**:
- Level 1: 60 seconds
- Level 2: 60 seconds with faster, crazier bats
- Game Over: Display creepy laughing face with synthesized laugh

#### Possession Component

**State Management**:
- `possessionRef`: Tracks head bangs, eye stabs, and cooldown timers
- `faceHits`: Counter for face hits (0-3)
- `eyeStabs`: Counter for eye stabs (0-3)
- `hitFlash`: Red flash effect intensity

**Face Hit Detection**:
- Threshold: Both eyes Y > 0.70 (below nose level)
- Detects rapid downward head movement
- Cooldown: 500ms between hits
- Triggers hit sound and red flash

**Eye Stab Detection**:
- Checks distance between hand and each eye
- Hit radius: 0.08
- Cooldown: 1000ms between stabs
- Triggers hit sound and red flash

**Asset Rendering**:
- Zombie face mask: Overlays at 3+ face hits, sized 4.2x eye distance
- Damaged eyes: Overlays at 3+ eye stabs, clipped to circular regions
- Dagger: Follows hand position, rotated -45 degrees

**Image Processing**:
- Removes white backgrounds using chroma key
- Threshold: RGB values > 220
- Sets alpha channel to 0 for white pixels

## Data Models

### Ghost State Model

```typescript
interface GhostState {
  isVisible: boolean;
  position: { x: number; y: number };  // Normalized 0-1
  opacity: number;  // 0-1
  scale: number;  // Multiplier
  isFleeing: boolean;
  imageUrl: string | null;
}
```

**State Transitions**:
- Idle → Visible: User looks at camera
- Visible → Fleeing: Hand touches ghost
- Fleeing → Idle: Opacity reaches 0
- Idle → Visible: Respawn on opposite side

### Spirit Model

```typescript
interface Spirit {
  id: number;
  angle: number;  // Radians
  radius: number;  // Normalized distance from center
  speed: number;  // Radians per frame
  scale: number;  // Size multiplier
  opacity: number;  // 0-1
  x: number;  // Current position (normalized)
  y: number;  // Current position (normalized)
}
```

### Bat Model

```typescript
interface Bat {
  id: number;
  position: { x: number; y: number };  // Normalized 0-1
  velocity: { x: number; y: number };  // Movement per frame
  scale: number;  // Size multiplier (0.4-0.7)
  rotation: number;  // Degrees
  rotationSpeed: number;  // Degrees per frame
}
```

### Possession State Model

```typescript
interface PossessionState {
  headBangs: number;  // 0-3+
  eyeStabs: number;  // 0-3+
  isHeadDown: boolean;  // Current head position
  lastHitTime: number;  // Timestamp for cooldown
  lastStabTime: number;  // Timestamp for cooldown
  possessedShown: boolean;  // One-time message flag
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*


### Property 1: Mode selection visual feedback
*For any* game mode selection, when a mode is selected, the System should apply distinct visual styling to that mode's button
**Validates: Requirements 1.2**

### Property 2: State transition on start
*For any* initial application state, when "Start the Ritual" is clicked, the game state should transition to LOADING_MODELS
**Validates: Requirements 1.3**

### Property 3: Face keypoint structure
*For any* valid video frame with a detected face, the detection result should contain face keypoints with the expected structure (x, y coordinates and optional name)
**Validates: Requirements 2.1**

### Property 4: Hand keypoint count
*For any* valid video frame with a detected hand, the detection result should contain exactly 21 hand keypoints
**Validates: Requirements 2.2**

### Property 5: Gaze detection boolean
*For any* face detection result, the isLookingAtCamera property should be a boolean value
**Validates: Requirements 2.3**

### Property 6: Normalized coordinates
*For any* detected hand position, the x and y coordinates should be in the range [0, 1]
**Validates: Requirements 2.4**

### Property 7: Valid pose classification
*For any* hand gesture detection, the returned pose should be from a known set of valid poses or null
**Validates: Requirements 2.5**

### Property 8: Ghost fade in
*For any* ghost state where isLookingAtCamera is true and opacity < 1, the opacity should increase over time
**Validates: Requirements 3.1**

### Property 9: Ghost fade out
*For any* ghost state where isLookingAtCamera is false and opacity > 0, the opacity should decrease over time
**Validates: Requirements 3.2**

### Property 10: Ghost respawn position inversion
*For any* ghost that fades out completely, if the previous position x > 0.5, the new position x should be < 0.5, and vice versa
**Validates: Requirements 3.3**

### Property 11: Collision triggers fleeing
*For any* ghost state where the distance between hand and ghost is less than the collision threshold, isFleeing should become true
**Validates: Requirements 3.4**

### Property 12: Spirit visibility with hand
*For any* spirit when a hand is detected, the spirit opacity should be greater than 0
**Validates: Requirements 4.1**

### Property 13: Swirl increases speed
*For any* spirit when isSwirling is true, the rotation speed should be greater than the base speed
**Validates: Requirements 4.2**

### Property 14: Swirl lock duration
*For any* swirl start event, the lock time should be set to at least 2000ms in the future
**Validates: Requirements 4.3**

### Property 15: Spirit fade without hand
*For any* spirit when hand is not detected and opacity > 0, the opacity should decrease over time
**Validates: Requirements 4.5**

### Property 16: Bat spawn intervals
*For any* level, bats should spawn at intervals matching the level's spawn rate (1200ms for level 1, 800ms for level 2)
**Validates: Requirements 5.1**

### Property 17: Collision updates state
*For any* bat collision with index finger, the bat should be removed, score should increase by 10, and an explosion should be created
**Validates: Requirements 5.2**

### Property 18: Level progression
*For any* game state where timeLeft reaches 0 in level 1, the level should become 2 and spawn interval should decrease
**Validates: Requirements 5.4**

### Property 19: Game over condition
*For any* game state where timeLeft reaches 0 in level 2, gameOver should become true
**Validates: Requirements 5.5**

### Property 20: Head hit detection
*For any* possession state where both eyes Y > threshold and isHeadDown is false, headBangs should increment
**Validates: Requirements 6.1**

### Property 21: Eye stab detection
*For any* possession state where distance between hand and eye < threshold, eyeStabs should increment
**Validates: Requirements 6.2**

### Property 22: Face mask rendering
*For any* possession state where headBangs >= 3, the face mask should be rendered
**Validates: Requirements 6.3**

### Property 23: Damaged eyes rendering
*For any* possession state where eyeStabs >= 3, the damaged eye images should be rendered
**Validates: Requirements 6.4**

### Property 24: Possessed message trigger
*For any* possession state where both headBangs >= 3 and eyeStabs >= 3, showPossessedMessage should become true
**Validates: Requirements 6.5**

### Property 25: Chroma key transparency
*For any* pixel in a generated image where RGB values are all > 220, the alpha channel should be set to 0
**Validates: Requirements 7.5**

## Error Handling

### Camera Access Errors

**Error Type**: Camera permission denied or device not found

**Handling Strategy**:
- Attempt ideal constraints first (640x480, user-facing camera)
- Fall back to basic video constraints if ideal fails
- Display user-friendly error message with instructions
- Provide reload button to retry camera access

**Error State**:
```typescript
const [cameraError, setCameraError] = useState<string | null>(null);
```

### AI Asset Generation Errors

**Error Type**: Gemini API failures, network errors, or invalid responses

**Handling Strategy**:
- Wrap all generation calls in try-catch blocks
- Display specific error messages indicating which asset failed
- Set game state to ERROR to prevent progression
- Allow user to return to mode selection and retry

**Error State**:
```typescript
const [errorMsg, setErrorMsg] = useState<string>('');
const [gameState, setGameState] = useState<GameState>(GameState.ERROR);
```

### Model Loading Errors

**Error Type**: TensorFlow.js model download or initialization failures

**Handling Strategy**:
- Display loading state during model initialization
- Catch and log model loading errors
- Transition to ERROR state if models fail to load
- Provide clear error message about network or browser compatibility

### Audio Context Errors

**Error Type**: Web Audio API not supported or suspended context

**Handling Strategy**:
- Check for AudioContext support before creating
- Resume suspended contexts before playing sounds
- Wrap all audio synthesis in try-catch blocks
- Silently fail audio playback without blocking gameplay

**Error Recovery**:
```typescript
if (ctx.state === 'suspended') {
  await ctx.resume();
}
```

## Testing Strategy

### Unit Testing

**Framework**: Vitest (recommended for Vite projects)

**Test Coverage**:

1. **Vision Service Tests**
   - Mock TensorFlow.js models
   - Test keypoint normalization
   - Test gaze detection algorithm
   - Test hand pose classification

2. **Gemini Service Tests**
   - Mock Gemini API responses
   - Test retry logic
   - Test error handling
   - Test base64 encoding

3. **Component State Tests**
   - Test game state transitions
   - Test collision detection algorithms
   - Test timer and counter logic
   - Test asset loading states

4. **Audio Synthesis Tests**
   - Mock Web Audio API
   - Test oscillator configuration
   - Test filter parameters
   - Test gain envelopes

### Property-Based Testing

**Framework**: fast-check (JavaScript property-based testing library)

**Configuration**: Each property test should run a minimum of 100 iterations

**Test Generators**:

1. **Coordinate Generator**: Generates normalized coordinates (0-1)
```typescript
fc.record({
  x: fc.double({ min: 0, max: 1 }),
  y: fc.double({ min: 0, max: 1 })
})
```

2. **Keypoint Generator**: Generates valid keypoint structures
```typescript
fc.record({
  x: fc.double({ min: 0, max: 1 }),
  y: fc.double({ min: 0, max: 1 }),
  name: fc.option(fc.string())
})
```

3. **Game State Generator**: Generates valid game states
```typescript
fc.constantFrom(
  GameState.IDLE,
  GameState.LOADING_MODELS,
  GameState.GENERATING_GHOST,
  GameState.ACTIVE,
  GameState.ERROR
)
```

4. **Ghost State Generator**: Generates valid ghost states
```typescript
fc.record({
  isVisible: fc.boolean(),
  position: coordinateGenerator,
  opacity: fc.double({ min: 0, max: 1 }),
  scale: fc.double({ min: 0.1, max: 2 }),
  isFleeing: fc.boolean(),
  imageUrl: fc.option(fc.string())
})
```

**Property Test Examples**:

1. **Normalized Coordinates Property** (Property 6)
```typescript
// Feature: haunted-reflection, Property 6: Normalized coordinates
it('should always return coordinates in range [0, 1]', () => {
  fc.assert(
    fc.property(
      fc.record({ /* mock video frame */ }),
      async (frame) => {
        const result = await detectFeatures(frame);
        if (result.handPosition) {
          expect(result.handPosition.x).toBeGreaterThanOrEqual(0);
          expect(result.handPosition.x).toBeLessThanOrEqual(1);
          expect(result.handPosition.y).toBeGreaterThanOrEqual(0);
          expect(result.handPosition.y).toBeLessThanOrEqual(1);
        }
      }
    ),
    { numRuns: 100 }
  );
});
```

2. **Ghost Respawn Position Inversion Property** (Property 10)
```typescript
// Feature: haunted-reflection, Property 10: Ghost respawn position inversion
it('should respawn ghost on opposite side after fade out', () => {
  fc.assert(
    fc.property(
      fc.record({
        x: fc.double({ min: 0, max: 1 }),
        y: fc.double({ min: 0, max: 1 })
      }),
      (previousPosition) => {
        const newPosition = respawnGhost(previousPosition);
        if (previousPosition.x > 0.5) {
          expect(newPosition.x).toBeLessThan(0.5);
        } else {
          expect(newPosition.x).toBeGreaterThan(0.5);
        }
      }
    ),
    { numRuns: 100 }
  );
});
```

3. **Collision Detection Property** (Property 11)
```typescript
// Feature: haunted-reflection, Property 11: Collision triggers fleeing
it('should trigger fleeing when collision detected', () => {
  fc.assert(
    fc.property(
      coordinateGenerator,
      coordinateGenerator,
      fc.double({ min: 0, max: 0.2 }),
      (ghostPos, handPos, threshold) => {
        const distance = calculateDistance(ghostPos, handPos);
        const shouldFlee = distance < threshold;
        const ghostState = updateGhostState(ghostPos, handPos, threshold);
        expect(ghostState.isFleeing).toBe(shouldFlee);
      }
    ),
    { numRuns: 100 }
  );
});
```

4. **Chroma Key Transparency Property** (Property 25)
```typescript
// Feature: haunted-reflection, Property 25: Chroma key transparency
it('should set alpha to 0 for white pixels', () => {
  fc.assert(
    fc.property(
      fc.integer({ min: 0, max: 255 }),
      fc.integer({ min: 0, max: 255 }),
      fc.integer({ min: 0, max: 255 }),
      (r, g, b) => {
        const isWhite = r > 220 && g > 220 && b > 220;
        const alpha = applyChromaKey(r, g, b);
        if (isWhite) {
          expect(alpha).toBe(0);
        } else {
          expect(alpha).toBeGreaterThan(0);
        }
      }
    ),
    { numRuns: 100 }
  );
});
```

### Integration Testing

**Test Scenarios**:

1. **End-to-End Game Flow**
   - Start application → Select mode → Load models → Generate assets → Play game → Return to menu

2. **Camera Permission Flow**
   - Request camera → Handle denial → Display error → Retry

3. **Multi-Mode Testing**
   - Play each mode sequentially
   - Verify state resets between modes
   - Verify assets are properly cleaned up

### Performance Testing

**Metrics to Monitor**:
- Frame rate (target: 30+ FPS)
- Detection latency (target: < 50ms per frame)
- Memory usage (target: < 500MB)
- Asset generation time (target: < 10s)

**Testing Tools**:
- Chrome DevTools Performance profiler
- React DevTools Profiler
- TensorFlow.js profiling utilities

### Browser Compatibility Testing

**Target Browsers**:
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

**Required Features**:
- WebRTC (getUserMedia)
- Web Audio API
- WebGL (for TensorFlow.js)
- ES2020 JavaScript features

## Deployment Considerations

### Build Configuration

**Vite Configuration**:
- Optimize bundle size with code splitting
- Configure TensorFlow.js to use CDN for models
- Enable compression for production builds

### Environment Variables

Required environment variables:
- `GEMINI_API_KEY`: Google Gemini API key for asset generation

### Performance Optimizations

1. **Lazy Loading**: Load TensorFlow.js models only when needed
2. **Asset Caching**: Cache generated assets in session storage
3. **Canvas Optimization**: Use requestAnimationFrame for smooth rendering
4. **Memory Management**: Clean up video streams and audio contexts on unmount

### Security Considerations

1. **API Key Protection**: Store Gemini API key in environment variables, never in client code
2. **Camera Privacy**: Request camera permission only when needed, stop streams when not in use
3. **Content Security Policy**: Configure CSP headers to allow TensorFlow.js and Gemini API
4. **HTTPS Requirement**: Camera access requires HTTPS in production

## Future Enhancements

### Potential Features

1. **Multiplayer Mode**: Allow multiple users to interact with shared ghosts
2. **Difficulty Settings**: Adjustable sensitivity for detection thresholds
3. **Custom Assets**: Allow users to upload their own ghost images
4. **Leaderboard**: Track high scores across sessions
5. **Mobile Support**: Optimize for mobile browsers with touch controls
6. **VR Mode**: Integrate with WebXR for immersive VR experience
7. **Sound Effects Library**: Expand audio synthesis with more varied sounds
8. **Accessibility**: Add keyboard controls and screen reader support

### Technical Improvements

1. **Model Optimization**: Use quantized TensorFlow.js models for faster inference
2. **Progressive Web App**: Add service worker for offline support
3. **WebAssembly**: Compile performance-critical code to WASM
4. **GPU Acceleration**: Leverage WebGPU for better performance
5. **State Management**: Migrate to Redux or Zustand for complex state
6. **TypeScript Strict Mode**: Enable strict type checking for better type safety
