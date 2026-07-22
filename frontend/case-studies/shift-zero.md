# SHIFT ZERO

## Short Overview
SHIFT ZERO is a multi-disciplinary project encompassing both a premium Cyberpunk Heads-Up Display (HUD) interface design and a fully playable collaborative game prototype built in the Godot 4 engine. 

## Problem
In fast-paced, visually chaotic action games, critical player information (health, ammo, objectives) is often lost in the noise. The challenge was to design a UI that matched the aggressive, neon-drenched cyberpunk aesthetic while maintaining absolute clarity and split-second readability.

## My Approach
I separated the project into two distinct phases: UI/UX conceptualization in Figma, and technical implementation in Godot. I approached the UI by studying military aviation HUDs, focusing on angular geometries, high-contrast neon accents against dark transparencies, and kinetic motion.

## Design Decisions
- **Typography:** Selected a highly legible, aggressive sans-serif typeface to convey technical precision.
- **Color Theory:** Utilized a stark monochromatic base with highly saturated, singular accent colors (e.g., electric cyan or alert red) strictly reserved for critical status changes.
- **Diegetic Elements:** Designed components that look like they exist within the game world (angled projections, scanlines) rather than flat overlays.

## Technical Implementation
The UI mockups were translated into the Godot 4 engine. I utilized Godot's Control nodes and custom shaders to replicate the CRT scanline effects and chromatic aberration seen in the Figma designs. 

## Challenges
The hardest technical challenge was ensuring the UI shaders in Godot did not severely impact the game's framerate. The design challenge lay in balancing the "cool factor" of a cluttered cyberpunk interface with the strict usability requirements of an action game.

## Result
A cohesive game prototype featuring a highly praised, visually striking UI that successfully communicates complex game states in a chaotic environment without breaking immersion.

## Tech Stack
- **Design:** Figma, Photoshop
- **Game Engine:** Godot 4
- **Scripting:** GDScript, Custom Shaders

## Key Features
- High-contrast, readability-focused HUD
- Custom CRT and chromatic aberration shaders
- Playable prototype mechanics

## Lessons Learned
This project was a masterclass in bridging the gap between static design and real-time rendering. It taught me how to optimize visual effects for game engines and the importance of playtesting UI designs in motion.
