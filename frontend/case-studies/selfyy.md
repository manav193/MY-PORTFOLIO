# SELFYY

## Short Overview
SELFYY is a modular application platform designed to integrate a static website alongside a dynamic, modular application builder. It serves as a structured digital ecosystem emphasizing high performance and modular architecture.

## Problem
When scaling a web presence that includes both a marketing/static front and a dynamic application backend, standard architectures often result in a monolithic structure that is slow to load and difficult to maintain. The challenge was maintaining static site speed while enabling complex application routing.

## My Approach
I focused on decoupled architecture. By leveraging Vercel's edge routing and custom configuration rules, I isolated the static marketing layers from the application logic. This allowed each layer to be optimized independently.

## Design Decisions
- **Modular File Structure:** Adopted a strict component-based architecture for scalability.
- **High-Contrast Identity:** Designed a visually distinct interface to differentiate the platform's utility tools from its informational pages.

## Technical Implementation
Deployed on Vercel, SELFYY utilizes advanced routing and caching strategies to deliver static assets from the edge while gracefully handling application logic. The architecture relies on clean HTML/CSS/JS with modular project boundaries.

## Challenges
Configuring the deployment pipeline to correctly route between static assets and application endpoints without causing 404 errors or infinite redirects proved challenging, requiring deep configuration of deployment JSON rules.

## Result
A scalable, highly organized platform that delivers instant page loads for static content while supporting dynamic application routes flawlessly.

## Tech Stack
- **Architecture:** Vercel Routing, Modular Monorepo pattern
- **Frontend:** Web native (HTML, CSS, JS)

## Key Features
- High-performance static delivery
- Modular application boundaries
- Edge routing integration

## Lessons Learned
Working on SELFYY solidified my understanding of edge networks, deployment configurations, and the critical importance of decoupling static assets from application logic early in the project lifecycle.
