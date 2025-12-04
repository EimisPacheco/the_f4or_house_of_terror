# 👻 Spooky Ghost Encounter

An interactive Halloween horror experience using TensorFlow.js face and hand detection.

## Features

- **Face Detection**: Tracks when you're looking directly at the camera
- **Ghost Appearance**: A ghost appears behind you when you maintain eye contact
- **Ghost Vanishing**: The ghost disappears when you turn your head to look
- **Hand Tracking**: Try to touch the ghost's hand on your shoulder - it will flee!
- **Real-time AI**: Uses TensorFlow.js MediaPipe models for detection

## How to Play

1. Open `index.html` in a modern web browser (Chrome/Edge recommended)
2. Allow camera access when prompted
3. Click "Start Experience"
4. Look directly at the camera and wait 2 seconds
5. A ghost will appear behind you
6. Try to look at it - it vanishes!
7. Try to touch its hand - it moves away!

## Technical Details

- **Face Detection**: MediaPipe Face Detector (short range)
- **Hand Detection**: MediaPipe Hands (lite model)
- **Frontend**: Vanilla JavaScript, HTML5 Canvas
- **No build required**: All dependencies loaded via CDN

## Future Enhancements

- Gemini Nano integration for dynamic ghost behaviors
- Audio effects and whispers
- Multiple ghost types
- Difficulty levels
- Score system based on how long you can keep the ghost visible

## Browser Requirements

- Modern browser with WebGL support
- Webcam access
- Recommended: Chrome 90+, Edge 90+
