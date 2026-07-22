# Manav & My Love Journey

## Short Overview
A cinematic, immersive storytelling website designed to document a personal relationship timeline. It moves beyond standard static photo galleries by integrating parallax scrolling, audio-reactive canvas visuals, and premium typography to evoke emotion.

## Problem
Traditional photo galleries and timeline templates often feel sterile and lack emotional resonance. The challenge was to create a digital experience that felt as personal and dynamic as the memories it contained, without sacrificing web performance.

## My Approach
I approached the project as a "digital interactive film." I prioritized scroll-driven storytelling, where the user's scroll position acts as the timeline scrubber. I integrated Web Audio APIs to allow the visuals to react to background music, enhancing the cinematic feel.

## Design Decisions
- **Dark, Cinematic Aesthetic:** Used deep blacks and soft glows to make photography the absolute focal point.
- **Masonry Layouts:** Avoided rigid grid systems in favor of fluid masonry layouts to accommodate mixed media (portrait, landscape, video).
- **Typography:** Chose elegant, high-contrast serif fonts for headings to convey a timeless, editorial feel.

## Technical Implementation
Built with frontend web technologies, utilizing the HTML5 Canvas API for particle and audio-reactive effects. The scroll-linked animations were implemented using Intersection Observers and RequestAnimationFrame to ensure a smooth 60fps experience even on mobile devices.

## Challenges
Synchronizing the Web Audio API with scrolling animations across different mobile browsers (which often heavily throttle or block auto-playing audio) was complex. This required implementing a deliberate user interaction (a custom "Enter Experience" button) to initialize the audio context cleanly.

## Result
A highly personal, emotionally engaging web experience that runs at a flawless 60fps, serving as both a technical playground for Canvas APIs and a beautiful personal archive.

## Tech Stack
- **Frontend:** HTML, CSS, JavaScript
- **Graphics:** HTML5 Canvas API
- **Audio:** Web Audio API

## Key Features
- Audio-reactive canvas elements
- Scroll-driven parallax animations
- Fluid masonry media gallery
- Custom Web Manifest for app-like installation

## Lessons Learned
This project heavily advanced my skills in creative coding, specifically around the Canvas API and managing browser-specific media playback policies. It proved that deep technical optimization is required to make highly visual experiences feel weightless.
