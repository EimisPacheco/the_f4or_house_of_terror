# Requirements Document

## Introduction

The Four House of Terror is an interactive Halloween horror experience that uses real-time computer vision, AI-generated assets, and audio synthesis to create four distinct game modes. The application leverages webcam input, TensorFlow.js for face and hand tracking, and Google's Gemini AI for generating spooky visual and audio assets. Users interact through facial expressions, hand gestures, and body movements to trigger supernatural events.

## Glossary

- **System**: The Four House of Terror web application
- **User**: A person interacting with the application through their webcam
- **Game Mode**: One of four distinct interactive experiences (Mirror, Flying Ghosts, Bat Catcher, Possession)
- **Vision Service**: TensorFlow.js-based face and hand detection system
- **Asset Generator**: Gemini AI service that creates ghost images, sounds, and possession assets
- **Camera Feed**: Real-time video stream from the user's webcam
- **Keypoint**: A detected coordinate point on the user's face or hand
- **Normalized Coordinates**: Position values between 0 and 1 representing relative screen position

## Requirements

### Requirement 1: Application Initialization

**User Story:** As a user, I want to start the application and select a game mode, so that I can choose my preferred horror experience.

#### Acceptance Criteria

1. WHEN the application loads THEN the System SHALL display a warning screen with game mode selection options
2. WHEN a user selects a game mode THEN the System SHALL highlight the selected mode with distinct visual styling
3. WHEN a user clicks "Start the Ritual" THEN the System SHALL begin loading required models and assets
4. WHERE camera permissions are required THEN the System SHALL request webcam access from the browser
5. IF camera access is denied THEN the System SHALL display an error message with instructions to enable camera permissions

### Requirement 2: Computer Vision Detection

**User Story:** As a user, I want the system to accurately detect my face and hands, so that my movements control the game interactions.

#### Acceptance Criteria

1. WHEN the camera feed is active THEN the System SHALL detect face keypoints including eyes, nose, and mouth
2. WHEN the camera feed is active THEN the System SHALL detect hand keypoints for all 21 finger joints
3. WHEN face detection occurs THEN the System SHALL determine if the user is looking at the camera
4. WHEN hand detection occurs THEN the System SHALL calculate normalized hand position coordinates
5. WHEN hand gestures are detected THEN the System SHALL identify specific poses such as pointing gestures

### Requirement 3: Mirror Mode Gameplay

**User Story:** As a user playing Mirror Mode, I want a ghost to appear when I look at the camera and flee when I try to touch it, so that I experience an interactive haunting.

#### Acceptance Criteria

1. WHEN the user looks directly at the camera THEN the System SHALL fade in a ghost image behind the user's shoulder
2. WHILE the user looks away from the camera THEN the System SHALL fade out the ghost image
3. WHEN the ghost fades out completely THEN the System SHALL respawn the ghost on the opposite side of the screen
4. WHEN the user's hand touches the ghost position THEN the System SHALL trigger a fleeing animation with the ghost shrinking and moving toward a vanishing point
5. WHEN the ghost flees THEN the System SHALL play a synthesized scream sound effect

### Requirement 4: Flying Ghosts Mode Gameplay

**User Story:** As a user playing Flying Ghosts Mode, I want to control flying spirits with circular hand motions, so that I can summon and direct supernatural entities.

#### Acceptance Criteria

1. WHEN the user's hand is detected THEN the System SHALL display multiple ghost spirits that orbit around the hand position
2. WHEN the user moves their hand in circular motions with a pointing gesture THEN the System SHALL increase the orbital speed of the spirits
3. WHEN circular motion is detected THEN the System SHALL lock the spirits to orbit above the user's head for a minimum of 2 seconds
4. WHEN spirits are swirling THEN the System SHALL play ethereal flying sound effects
5. WHEN the hand is no longer detected THEN the System SHALL fade out the spirits

### Requirement 5: Bat Catcher Mode Gameplay

**User Story:** As a user playing Bat Catcher Mode, I want to catch flying bats with my index finger to score points, so that I can compete in a timed challenge.

#### Acceptance Criteria

1. WHEN Bat Catcher Mode starts THEN the System SHALL spawn bats from the left and right edges of the screen at regular intervals
2. WHEN the user's index finger tip touches a bat THEN the System SHALL remove the bat, increment the score by 10 points, and display an explosion effect
3. WHEN a bat is caught THEN the System SHALL play an explosion sound effect
4. WHEN 60 seconds elapse in Level 1 THEN the System SHALL advance to Level 2 with faster bat spawn rates and increased bat speed
5. WHEN 60 seconds elapse in Level 2 THEN the System SHALL display a game over screen with the final score and a creepy laughing face animation

### Requirement 6: Possession Mode Gameplay

**User Story:** As a user playing Possession Mode, I want to perform ritual actions by hitting my face and stabbing my eyes, so that I complete a possession ritual.

#### Acceptance Criteria

1. WHEN the user moves their head rapidly downward past a threshold THEN the System SHALL increment the face hit counter and play a hit sound
2. WHEN the user's hand touches their eye position THEN the System SHALL increment the eye stab counter and play a hit sound
3. WHEN the face hit counter reaches 3 THEN the System SHALL overlay a zombie face mask on the user's face
4. WHEN the eye stab counter reaches 3 THEN the System SHALL overlay damaged eye images on the user's eyes
5. WHEN both face hits and eye stabs reach 3 THEN the System SHALL display a "POSSESSED" message for 3 seconds

### Requirement 7: AI Asset Generation

**User Story:** As a user, I want the system to generate unique horror assets using AI, so that each session feels fresh and unpredictable.

#### Acceptance Criteria

1. WHEN Mirror Mode initializes THEN the System SHALL generate a ghost image using Gemini AI with a spooky prompt
2. WHEN Mirror Mode initializes THEN the System SHALL generate a scream audio file using Gemini AI text-to-speech
3. WHEN Possession Mode initializes THEN the System SHALL generate a zombie face image, damaged eye image, and dagger image using Gemini AI
4. IF asset generation fails THEN the System SHALL display an error message and allow the user to retry
5. WHEN assets are generated THEN the System SHALL process images to remove white backgrounds for transparency

### Requirement 8: Audio Synthesis

**User Story:** As a user, I want to hear realistic synthesized sound effects, so that the horror experience feels immersive.

#### Acceptance Criteria

1. WHEN a ghost flees in Mirror Mode THEN the System SHALL synthesize a scream sound using Web Audio API with formant filters and distortion
2. WHEN a bat spawns in Bat Catcher Mode THEN the System SHALL synthesize a high-pitched chirp sound
3. WHEN a bat is caught in Bat Catcher Mode THEN the System SHALL synthesize an explosion sound with noise burst and low oscillator
4. WHEN the user hits their face in Possession Mode THEN the System SHALL synthesize a thud sound
5. WHEN the game ends in Bat Catcher Mode THEN the System SHALL synthesize an evil laugh with multiple "HA" patterns

### Requirement 9: Visual Effects and UI

**User Story:** As a user, I want to see decorative borders and visual effects that match each game mode's theme, so that the experience feels polished and atmospheric.

#### Acceptance Criteria

1. WHEN Mirror Mode is active THEN the System SHALL display spider web decorations in the corners with blood drips and creepy text
2. WHEN Flying Ghosts Mode is active THEN the System SHALL display mystical symbols in the corners with ethereal wisps
3. WHEN Bat Catcher Mode is active THEN the System SHALL display golden ornaments in the corners with decorative text
4. WHEN Possession Mode is active THEN the System SHALL display dark chains in the corners with ominous text
5. WHEN any game mode is active THEN the System SHALL apply scanline and vignette effects to the camera feed

### Requirement 10: Debug and Development Tools

**User Story:** As a developer, I want to see debug visualizations of detected keypoints, so that I can troubleshoot detection issues.

#### Acceptance Criteria

1. WHEN the debug toggle is enabled THEN the System SHALL draw face keypoints as green dots on the canvas
2. WHEN the debug toggle is enabled THEN the System SHALL draw hand keypoints as red dots with skeletal connections
3. WHEN the debug toggle is enabled in Bat Catcher Mode THEN the System SHALL display a target crosshair on the index finger tip
4. WHEN the debug toggle is enabled in Possession Mode THEN the System SHALL display a hit threshold line and eye Y-coordinate values
5. WHEN the debug toggle is disabled THEN the System SHALL clear all debug visualizations from the canvas
