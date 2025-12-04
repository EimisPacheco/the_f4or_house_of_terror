# The F4ur House of Horror

## Inspiration
I wanted to bridge the gap between classic horror tropes—the haunted mirror, the possession ritual, the swarm of bats—and modern browser technology. My goal was to create an experience that feels like a cursed artifact found on an old VHS tape, but powered by the most advanced AI available today. I was inspired by "found footage" horror movies and the desire to make the user the protagonist of their own scary movie using nothing but a standard webcam.

## What it does
**The F4ur House of Horror** is an interactive web application that transforms your webcam feed into a haunted mirror. Using real-time computer vision and generative AI, it overlays supernatural elements that react to your physical movements.

It features four distinct "Rituals" (Game Modes), each with unique mechanics:

### 1. Ghost in the Mirror (Mirror Mode)
This is the classic jump-scare experience.
*   **The Dynamic**: The ghost is shy but malevolent. It only manifests when you make direct eye contact with your reflection (the camera).
*   **The Mechanic**:
    *   **Summon**: Look straight at the camera. The ghost slowly fades in behind you.
    *   **Banish**: Turn your head or look away, and it vanishes into the ether.
    *   **The Scare**: If you try to verify its existence by touching it with your hand, the ghost detects the intrusion, emits a terrifying procedural scream, and rapidly retreats into the darkness.

### 2. Flying Ghosts (Swarm Mode)
This mode turns the user into a dark wizard casting spells.
*   **The Dynamic**: You control a swarm of spirits using hand gestures.
*   **The Mechanic**:
    *   **Summon**: Raise your index finger (Pointing gesture). Three spirits will appear and orbit your head/face.
    *   **Cast Spell**: Move your index finger in a rapid circular motion ("Swirling"). The system detects the kinetic energy of the gesture. The spirits will detach from your face, fly towards your hand, and orbit your finger at high speeds, accompanied by a ghostly "whooshing" wind sound generated in real-time.

### 3. Bat Catcher
An arcade-style survival game played with your physical body.
*   **The Dynamic**: Vampire bats are swarming your room, and you must protect yourself.
*   **The Mechanic**:
    *   **The Threat**: Bats spawn randomly from the left or right edges of the screen and fly across your video feed.
    *   **The Defense**: A cyan target reticle appears on your index finger. You must physically move your hand to intercept the bats.
    *   **The Impact**: When your finger touches a bat, it triggers a massive particle explosion and a realistic procedural "BOOM" sound effect.
    *   **Progression**: As your score increases, the bats spawn faster and fly more erratically, making them harder to catch.

### 4. Possession
A cinematic roleplay simulator that challenges you to act out a horror movie ritual.
*   **The Dynamic**: The mirror acts as a judge, waiting for you to complete specific ritualistic actions to transform your appearance.
*   **The Mechanic**:
    *   **The Desk Slam**: You must pretend to slam your head against a desk. The AI tracks your eye level; if you drop your head below a specific threshold (as if hitting a surface) and return, it counts as a hit. Do this **3 times** to complete the ritual and receive a "Day of the Dead" zombie face mask.
    *   **The Ritual Dagger**: A virtual antique dagger is attached to your hand. You must bring the dagger to your eye level (simulating a self-inflicted wound). Do this **3 times** to trigger a "Damaged Eye" effect, turning your irises into glowing mechanical red sockets.

## How I built it
I built this application using **React** for the UI and **TensorFlow.js** for the eyes and hands of the experience.
*   **Vision**: I utilized the MediaPipe Face Detection and Hand Pose models to track keypoints (eyes, nose, finger tips) in real-time directly in the browser.
*   **Generative AI**: I used **Google's Gemini 2.5 Flash** API to generate all the visual assets on the fly. The ghost, the bats, the zombie mask, and the dagger are all hallucinated by the AI when you start the game, meaning every session looks slightly different.
*   **Audio**: Instead of using pre-recorded MP3s, I built a custom **Procedural Audio Engine** using the **Web Audio API**. The screams, explosions, and bat chirps are synthesized in real-time using oscillators, pink noise buffers, and formant filters to create dynamic, organic horror sounds.

## Challenges I ran into
*   **Safety Filters vs. Horror**: One of the biggest hurdles was generating scary assets (like a "rotting zombie face" or "dagger") without triggering Gemini's safety filters. I had to learn creative prompt engineering—asking for "theatrical makeup" or "museum props" instead of "gore" to get the visual result I wanted without violation.
*   **The "Real" Scream**: Making a computer generate a realistic human scream was incredibly difficult. Early attempts sounded like 8-bit robots. I had to dive deep into audio synthesis, implementing "pink noise modulation" (to simulate vocal fry) and "dual formant filtering" (to mimic the shape of a human mouth) to create a convincing wail.
*   **Possession Logic**: Tuning the gesture detection for the "head slam" was tricky. It triggered too easily or not at all. I implemented a physics-based threshold system that tracks the position of both eyes simultaneously to ensure only a deliberate "bang" registers.

## Accomplishments that I'm proud of
I am particularly proud of the **Procedural Sound Design**. The fact that the "Ghost Scream" sounds terrifyingly human but is actually just math and code running in the browser is a huge win. I'm also proud of the **Client-Side Chroma Keying** implementation, which allows me to take rectangular images from Gemini and seamlessly blend them into the video feed by removing white backgrounds pixel-by-pixel in real-time.

## What I learned
I learned that "horror" is often about timing and latency. If the ghost takes 200ms to disappear, it's a glitch. If it disappears instantly, it's scary. Optimizing the React render loop to run at 60fps alongside heavy computer vision models taught me a lot about browser performance and memory management (using Refs instead of State for game loops).

## What's next for The F4ur House of Horror
I plan to add a **Multiplayer Seance** mode, where two users can connect via WebRTC, and a ghost appears in one user's room that only the *other* user can see, forcing them to communicate to survive. I also want to expand the "Possession" mode to support full-body tracking for more complex ritual gestures.