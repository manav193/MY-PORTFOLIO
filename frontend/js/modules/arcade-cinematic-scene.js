/**
 * ArcadeOS — Cinematic Retro-Futuristic Home Scene (v5.0)
 * Precision target matching reference design:
 * 3D Retro ARCADEOS title with yellow-orange-red gradient, cyan tagline,
 * perspective grid, glowing horizon arc, 4 large portrait cards with premium illustrated SVG icons,
 * and glossy hardware status strip below monitor.
 */

export function initArcadeCinematicScene() {
  const install = () => {
    const home = document.getElementById('arcade-home');
    if (!home) return false;

    home.classList.add('arcade-cinematic-v5');

    // Remove obsolete text logo / tagline elements if present
    const oldBrand = home.querySelector('.arcade-cinematic-brand-v2');
    if (oldBrand) oldBrand.remove();

    return true;
  };

  if (!install()) {
    window.setTimeout(install, 100);
    window.setTimeout(install, 400);
    window.setTimeout(install, 1200);
  }

  let style = document.getElementById('arcade-cinematic-v5-styles');
  if (!style) {
    style = document.createElement('style');
    style.id = 'arcade-cinematic-v5-styles';
    document.head.appendChild(style);
  }
  style.textContent = `
      /* ==========================================
         ARCADE OS HOME SCREEN V5 STYLES
         ========================================== */
      .cabinet-chassis:not(.is-scaled) #arcade-os,
      .cabinet-chassis:not(.is-scaled) #arcade-home,
      .cabinet-chassis:not(.is-scaled) #arcade-app-view,
      .cabinet-chassis:not(.is-scaled) #arcade-loading,
      .os-view:not(.active),
      #arcade-home:not(.active),
      #arcade-app-view:not(.active),
      #arcade-loading:not(.active) {
        display: none !important;
        opacity: 0 !important;
        visibility: hidden !important;
        height: 0 !important;
        overflow: hidden !important;
        pointer-events: none !important;
      }

      #arcade-home.arcade-cinematic-v5.active {
        position: relative !important;
        overflow: hidden !important;
        box-sizing: border-box !important;
        padding: 10px 16px 8px !important;
        display: flex !important;
        flex-direction: column !important;
        justify-content: space-between !important;
        align-items: center !important;
        isolation: isolate !important;
        background: linear-gradient(180deg, #02040d 0%, #06091e 58%, #020309 100%) !important;
        flex: 1 1 0% !important;
        width: 100% !important;
        height: 100% !important;
        min-height: 0 !important;
      }

      #arcade-app-view.os-view.active {
        display: flex !important;
        flex-direction: column !important;
        flex: 1 1 0% !important;
        width: 100% !important;
        height: 100% !important;
        min-height: 0 !important;
        overflow: hidden !important;
        box-sizing: border-box !important;
      }

      /* Hide old pseudo overrides */
      #arcade-home.arcade-cinematic-v5:before,
      #arcade-home.arcade-cinematic-v5:after {
        display: none !important;
        content: none !important;
      }

      /* 1. Hero Brand Header (3D ARCADEOS Title & Tagline) */
      .arcade-hero-brand {
        position: relative;
        z-index: 5;
        text-align: center;
        margin-top: 2px;
        margin-bottom: 6px;
        pointer-events: none;
        user-select: none;
      }

      .arcade-hero-title {
        font-family: Impact, "Arial Black", sans-serif;
        font-size: clamp(38px, 6.2vw, 66px);
        line-height: 0.86;
        letter-spacing: -0.04em;
        font-style: italic;
        background: linear-gradient(180deg, #fff360 0%, #ffc000 28%, #ff6a00 62%, #d82000 88%, #8b0000 100%);
        -webkit-background-clip: text;
        background-clip: text;
        color: transparent;
        -webkit-text-stroke: 1px rgba(255, 235, 120, 0.45);
        filter: drop-shadow(0 3px 0 #7b1208) drop-shadow(0 6px 0 #4a0a04) drop-shadow(0 12px 22px rgba(255, 80, 20, 0.42));
        margin: 0;
      }

      .arcade-hero-title span {
        margin-left: 0.02em;
      }

      .arcade-hero-tagline {
        margin-top: 5px;
        margin-bottom: 0;
        font-family: "Inter", system-ui, sans-serif;
        font-size: clamp(8px, 1.3vw, 11px);
        font-weight: 900;
        letter-spacing: 0.22em;
        color: #16edf2;
        text-shadow: 0 0 12px rgba(22, 237, 242, 0.6), 0 0 24px rgba(22, 237, 242, 0.3);
        text-transform: uppercase;
      }

      /* 2. Background Universe Decor Layer (Rich Planetary Horizon) */
      .arcade-universe-bg {
        position: absolute;
        inset: 0;
        z-index: 1;
        pointer-events: none !important;
        overflow: hidden;
      }

      .arcade-space-gradient {
        position: absolute;
        inset: 0;
        background:
          radial-gradient(ellipse at 50% 10%, rgba(168, 85, 247, 0.22) 0%, transparent 60%),
          radial-gradient(circle at 20% 25%, rgba(56, 189, 248, 0.12), transparent 40%),
          radial-gradient(circle at 80% 30%, rgba(168, 85, 247, 0.12), transparent 40%),
          linear-gradient(180deg, #030612 0%, #060b1e 60%, #02040b 100%);
      }

      /* Restrained Starfield */
      .arcade-orbital-stars .star {
        position: absolute;
        border-radius: 50%;
        background: #ffffff;
        box-shadow: 0 0 4px #ffffff;
        opacity: 0.6;
      }
      .arcade-orbital-stars .s1 { top: 10%; left: 12%; width: 2px; height: 2px; }
      .arcade-orbital-stars .s2 { top: 22%; left: 84%; width: 2.5px; height: 2.5px; background: #38bdf8; box-shadow: 0 0 6px #38bdf8; }
      .arcade-orbital-stars .s3 { top: 8%; left: 68%; width: 1.5px; height: 1.5px; }
      .arcade-orbital-stars .s4 { top: 28%; left: 22%; width: 2px; height: 2px; background: #a855f7; }
      .arcade-orbital-stars .s5 { top: 16%; left: 45%; width: 1.5px; height: 1.5px; }
      .arcade-orbital-stars .s6 { top: 32%; left: 92%; width: 2px; height: 2px; }
      .arcade-orbital-stars .s7 { top: 14%; left: 34%; width: 1px; height: 1px; opacity: 0.4; }
      .arcade-orbital-stars .s8 { top: 26%; left: 76%; width: 1.5px; height: 1.5px; opacity: 0.5; }
      .arcade-orbital-stars .s9 { top: 6%; left: 28%; width: 2px; height: 2px; background: #fef08a; }
      .arcade-orbital-stars .s10 { top: 18%; left: 62%; width: 1px; height: 1px; opacity: 0.3; }
      .arcade-orbital-stars .s11 { top: 34%; left: 18%; width: 1.5px; height: 1.5px; opacity: 0.5; }
      .arcade-orbital-stars .s12 { top: 24%; left: 52%; width: 2px; height: 2px; background: #38bdf8; }

      /* Realistic Earth Planetary Horizon Container (Lower 45-50% of CRT viewport) */
      .arcade-earth-container {
        position: absolute;
        left: 50%;
        bottom: -48%;
        width: 155%;
        height: 100%;
        transform: translateX(-50%);
        pointer-events: none !important;
        overflow: hidden;
      }

      /* Dark Night-Side Oceanic Planet Body with 3D Spherical Falloff */
      .arcade-earth-base {
        position: absolute;
        inset: 0;
        border-radius: 50% 50% 0 0 / 100% 100% 0 0;
        background: radial-gradient(ellipse at 50% 0%, #030816 0%, #061024 35%, #030716 70%, #010206 100%);
        box-shadow: inset 0 24px 60px rgba(0, 0, 0, 0.96);
      }

      /* Organic Landmasses & Night City Lights */
      .arcade-earth-continents-realistic,
      .arcade-earth-city-lights,
      .arcade-earth-hud-overlay {
        position: absolute;
        inset: 0;
        border-radius: 50% 50% 0 0 / 100% 100% 0 0;
        overflow: hidden;
      }

      .arcade-earth-continents-realistic svg,
      .arcade-earth-city-lights svg,
      .arcade-earth-hud-overlay svg {
        width: 100%;
        height: 100%;
        display: block;
      }

      /* Independent Multi-Layered Soft Drifting Clouds (90s / 120s orbital drift) */
      .arcade-earth-clouds {
        position: absolute;
        inset: 0;
        border-radius: 50% 50% 0 0 / 100% 100% 0 0;
        overflow: hidden;
        mask-image: radial-gradient(ellipse at 50% 0%, rgba(0,0,0,1) 0%, rgba(0,0,0,0.75) 60%, transparent 90%);
        -webkit-mask-image: radial-gradient(ellipse at 50% 0%, rgba(0,0,0,1) 0%, rgba(0,0,0,0.75) 60%, transparent 90%);
      }

      .arcade-earth-clouds.layer-1 {
        animation: earthCloudDrift1 90s linear infinite alternate;
      }

      .arcade-earth-clouds.layer-2 {
        animation: earthCloudDrift2 120s linear infinite alternate-reverse;
      }

      .arcade-earth-clouds svg {
        width: 100%;
        height: 100%;
        display: block;
      }

      @keyframes earthCloudDrift1 {
        0% { transform: translateX(-2.5%) scale(1); }
        100% { transform: translateX(2.5%) scale(1.03); }
      }

      @keyframes earthCloudDrift2 {
        0% { transform: translateX(2%) scale(1.02); }
        100% { transform: translateX(-2%) scale(1); }
      }

      /* Faint Atmospheric Polar Aurora Wisp */
      .arcade-earth-aurora {
        position: absolute;
        top: -12px;
        left: 20%;
        width: 35%;
        height: 40px;
        background: linear-gradient(90deg, transparent 0%, rgba(16, 185, 129, 0.25) 35%, rgba(56, 189, 248, 0.3) 70%, transparent 100%);
        filter: blur(12px);
        pointer-events: none;
        animation: auroraWisp 45s ease-in-out infinite alternate;
      }

      @keyframes auroraWisp {
        0% { opacity: 0.6; transform: translateX(-10px) scaleY(0.9); }
        100% { opacity: 1; transform: translateX(15px) scaleY(1.1); }
      }

      /* Multi-Layered Non-Uniform Atmospheric Rim Glow */
      .arcade-earth-atmosphere-realistic {
        position: absolute;
        inset: -2px 0 0 0;
        border-radius: 50% 50% 0 0 / 100% 100% 0 0;
        pointer-events: none;
      }

      .arcade-earth-atmosphere-realistic .atmosphere-core {
        position: absolute;
        inset: 0;
        border-radius: inherit;
        border-top: 1.5px solid rgba(224, 242, 254, 0.95);
        box-shadow: 0 -2px 10px rgba(56, 189, 248, 0.9);
      }

      .arcade-earth-atmosphere-realistic .atmosphere-scatter {
        position: absolute;
        inset: 0;
        border-radius: inherit;
        box-shadow: 0 -6px 26px rgba(56, 189, 248, 0.45);
        animation: earthAtmospherePulse 30s ease-in-out infinite alternate;
      }

      .arcade-earth-atmosphere-realistic .atmosphere-haze {
        position: absolute;
        inset: 0;
        border-radius: inherit;
        box-shadow: 0 -22px 70px rgba(168, 85, 247, 0.28);
      }

      /* Asymmetric Sunrise Terminator & Anamorphic Flare Streak */
      .arcade-earth-terminator {
        position: absolute;
        top: -24px;
        right: 8%;
        width: 32%;
        height: 64px;
        background: radial-gradient(ellipse at 50% 50%, rgba(253, 230, 138, 0.32) 0%, rgba(254, 215, 170, 0.22) 40%, rgba(56, 189, 248, 0.15) 75%, transparent 100%);
        filter: blur(18px);
        pointer-events: none;
      }

      .arcade-earth-terminator .sunrise-flare-streak {
        position: absolute;
        top: 18px;
        right: 15%;
        width: 280px;
        height: 2px;
        background: linear-gradient(90deg, transparent 0%, rgba(56, 189, 248, 0.6) 30%, rgba(253, 230, 138, 0.8) 70%, transparent 100%);
        filter: blur(1px);
        box-shadow: 0 0 10px rgba(253, 230, 138, 0.6);
      }

      /* Orbital Satellite Marker Animation */
      .orbital-satellite-marker {
        animation: satelliteOrbit 55s linear infinite;
      }

      @keyframes satelliteOrbit {
        0% { transform: translate(-400px, 50px); }
        100% { transform: translate(400px, -50px); }
      }

      @keyframes earthAtmospherePulse {
        0% { opacity: 0.85; filter: brightness(0.95); }
        100% { opacity: 1; filter: brightness(1.05); }
      }

      /* Environmental Variable-Driven Reactive Earth Rendering */
      :root {
        --earth-daylight: 0.05;
        --earth-sunrise-glow: 0.0;
        --earth-sunset-glow: 0.0;
        --earth-city-lights-opacity: 0.88;
        --earth-cloud-coverage: 0.7;
        --earth-storm-intensity: 0.0;
      }

      .arcade-earth-city-lights {
        opacity: var(--earth-city-lights-opacity, 0.88);
        transition: opacity 2s ease;
      }

      .arcade-earth-clouds {
        opacity: var(--earth-cloud-coverage, 0.7);
        transition: opacity 3s ease;
      }

      /* Sunrise / Sunset Limb Glow Dynamics */
      .arcade-earth-container[data-solar-phase="SUNRISE"] .arcade-earth-terminator {
        opacity: 1 !important;
        background: radial-gradient(ellipse at 50% 50%, rgba(253, 230, 138, 0.45) 0%, rgba(254, 215, 170, 0.3) 40%, rgba(56, 189, 248, 0.2) 75%, transparent 100%) !important;
        transition: opacity 2s ease;
      }

      .arcade-earth-container[data-solar-phase="SUNSET"] .arcade-earth-terminator {
        opacity: 1 !important;
        background: radial-gradient(ellipse at 50% 50%, rgba(249, 115, 22, 0.4) 0%, rgba(217, 70, 239, 0.25) 45%, rgba(56, 189, 248, 0.15) 80%, transparent 100%) !important;
        transition: opacity 2s ease;
      }

      .arcade-earth-container[data-solar-phase="DAY"] .arcade-earth-base {
        background: radial-gradient(ellipse at 50% 0%, #061e40 0%, #082854 35%, #04122c 70%, #01040f 100%) !important;
        transition: background 3s ease;
      }

      /* Environmental Sci-Fi HUD Overlay Pill */
      .arcade-earth-env-hud {
        position: absolute;
        bottom: 12px;
        right: 18px;
        z-index: 10;
        pointer-events: none;
        user-select: none;
      }

      .env-hud-pill {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 4px 10px;
        background: rgba(8, 14, 24, 0.72);
        border: 1px solid rgba(56, 189, 248, 0.25);
        border-radius: 4px;
        backdrop-filter: blur(8px);
        font-family: 'JetBrains Mono', monospace;
        font-size: 8px;
        letter-spacing: 0.08em;
        color: rgba(224, 242, 254, 0.85);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
      }

      .env-hud-loc {
        color: #38bdf8;
        font-weight: 700;
      }

      .env-hud-temp {
        color: #fbbf24;
      }

      .env-hud-cond {
        color: rgba(255, 255, 255, 0.9);
      }

      .env-hud-sun {
        color: rgba(255, 255, 255, 0.45);
        border-left: 1px solid rgba(255, 255, 255, 0.15);
        padding-left: 8px;
      }

      .env-hud-moon {
        color: #e2e8f0;
        border-left: 1px solid rgba(255, 255, 255, 0.15);
        padding-left: 8px;
        font-weight: 600;
      }

      /* Realistic Astronomical Moon Element Container */
      .arcade-moon-element {
        position: absolute;
        width: clamp(76px, 5.5vw, 110px);
        height: clamp(76px, 5.5vw, 110px);
        z-index: 2;
        pointer-events: none !important;
        transition: opacity 1.5s ease, filter 1.5s ease, top 2s ease, left 2s ease, right 2s ease;
      }

      .arcade-moon-svg {
        width: 100%;
        height: 100%;
        display: block;
        overflow: visible;
      }

      .arcade-moon-debug-badge {
        position: absolute;
        top: 8px;
        right: 12px;
        z-index: 99;
        padding: 4px 8px;
        background: rgba(15, 23, 42, 0.9);
        border: 1px solid #38bdf8;
        border-radius: 4px;
        font-family: 'JetBrains Mono', monospace;
        font-size: 9px;
        color: #38bdf8;
        letter-spacing: 0.05em;
        pointer-events: none;
      }

      @media (prefers-reduced-motion: reduce) {
        .arcade-earth-clouds.layer-1,
        .arcade-earth-clouds.layer-2,
        .arcade-earth-aurora,
        .arcade-earth-atmosphere-realistic .atmosphere-scatter,
        .orbital-satellite-marker {
          animation: none !important;
        }
      }

      /* 3. Interactive 4-Card Viewport Layer */
      #arcade-home.arcade-cinematic-v5 .home-carousel-wrapper {
        position: relative !important;
        z-index: 4 !important;
        width: 100% !important;
        max-width: min(1040px, 98%) !important;
        height: auto !important;
        overflow: visible !important;
        margin: 2px 0 !important;
      }

      #arcade-home.arcade-cinematic-v5 #home-carousel {
        position: relative !important;
        z-index: 4 !important;
        display: grid !important;
        grid-template-columns: repeat(4, minmax(0, 1fr)) !important;
        gap: 16px !important;
        width: 100% !important;
        padding: 4px 2px 8px !important;
        transform: none !important;
        overflow: visible !important;
        align-items: stretch !important;
      }

      /* Card Visibility & Styling */
      #arcade-home.arcade-cinematic-v5 .app-card {
        display: none !important;
      }

      #arcade-home.arcade-cinematic-v5 .app-card.is-visible {
        display: flex !important;
        position: relative !important;
        width: 100% !important;
        height: 200px !important;
        padding: 16px 10px 12px !important;
        border-radius: 18px !important;
        flex-direction: column !important;
        justify-content: center !important;
        align-items: center !important;
        gap: 10px !important;
        text-align: center !important;
        background: linear-gradient(180deg, rgba(14, 22, 54, 0.94), rgba(4, 8, 26, 0.97)) !important;
        border: 1.5px solid rgba(115, 83, 255, 0.55) !important;
        box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.04), 0 16px 36px rgba(0, 0, 0, 0.5) !important;
        backdrop-filter: blur(10px);
        opacity: 0.85 !important;
        transform: scale(0.97) !important;
        transition: transform 0.22s cubic-bezier(0.2, 0.8, 0.2, 1), border-color 0.2s ease, box-shadow 0.2s ease, opacity 0.2s ease !important;
      }

      #arcade-home.arcade-cinematic-v5 .app-card.is-visible.focused {
        opacity: 1 !important;
        transform: translateY(-6px) scale(1.03) !important;
        border-color: #14e9ff !important;
        box-shadow:
          0 0 0 1px rgba(20, 233, 255, 0.4),
          0 0 34px rgba(20, 233, 255, 0.35),
          0 22px 44px rgba(0, 0, 0, 0.6) !important;
      }

      .arcade-card-icon {
        width: 60px !important;
        height: 60px !important;
        min-height: 60px !important;
        display: grid !important;
        place-items: center !important;
        filter: drop-shadow(0 8px 14px rgba(0,0,0,0.5));
      }

      .arcade-premium-icon {
        width: 52px !important;
        height: 52px !important;
        display: block !important;
      }

      .arcade-card-copy {
        display: flex;
        flex-direction: column;
        gap: 3px;
        width: 100%;
        min-width: 0;
      }

      .arcade-card-name {
        font-size: 12px;
        font-weight: 900;
        letter-spacing: 0.06em;
        text-transform: uppercase;
        color: #ffffff;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .arcade-card-sub {
        font-size: 8px;
        line-height: 1.3;
        color: rgba(220, 230, 255, 0.72);
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }

      /* 4. Hardware Control / Status Strip */
      #arcade-home.arcade-cinematic-v5 #home-details {
        position: relative !important;
        z-index: 5 !important;
        width: min(1040px, 98%) !important;
        min-height: 38px !important;
        margin: 2px auto 0 !important;
        padding: 5px 10px !important;
        border: 1px solid rgba(0, 229, 255, 0.2) !important;
        background: linear-gradient(180deg, rgba(8, 12, 30, 0.92), rgba(3, 5, 16, 0.96)) !important;
        border-radius: 12px !important;
        box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.08), 0 8px 24px rgba(0, 0, 0, 0.5) !important;
        backdrop-filter: blur(10px);
      }

      .arcade-hw-strip {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
        width: 100%;
      }

      .hw-btn {
        appearance: none;
        border: 1px solid rgba(255, 255, 255, 0.12);
        background: linear-gradient(180deg, #1b2138 0%, #0d1122 100%);
        color: #e2e8f0;
        font-size: 9px;
        font-weight: 800;
        letter-spacing: 0.06em;
        padding: 5px 10px;
        border-radius: 6px;
        display: inline-flex;
        align-items: center;
        gap: 6px;
        cursor: pointer;
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
        transition: background 0.15s ease, border-color 0.15s ease;
      }

      .hw-btn:hover,
      .hw-btn.focused,
      .hw-btn.is-ui-focused,
      .hw-btn:focus-visible {
        border-color: #38bdf8 !important;
        background: linear-gradient(180deg, #1e293b 0%, #0f172a 100%) !important;
        color: #ffffff !important;
        outline: none !important;
        box-shadow: 0 0 12px rgba(56, 189, 248, 0.4), inset 0 1px 1px rgba(255, 255, 255, 0.2) !important;
      }

      .hw-led {
        width: 7px;
        height: 7px;
        border-radius: 50%;
        display: inline-block;
      }

      .hw-led.red { background: #ff3355; box-shadow: 0 0 8px #ff3355; }
      .hw-led.green { background: #00ff88; box-shadow: 0 0 8px #00ff88; }
      .hw-led.yellow { background: #ffbb00; box-shadow: 0 0 8px #ffbb00; }

      .hw-clock {
        font-family: "Courier New", monospace;
        font-size: 11px;
        font-weight: 900;
        color: #00f0ff;
        text-shadow: 0 0 10px rgba(0, 240, 255, 0.6);
        background: rgba(2, 8, 22, 0.8);
        padding: 4px 10px;
        border-radius: 6px;
        border: 1px solid rgba(0, 240, 255, 0.25);
        letter-spacing: 0.08em;
      }

      .hw-user-tag {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 3px 8px;
        border-radius: 6px;
        background: linear-gradient(90deg, rgba(160, 82, 255, 0.25), rgba(0, 240, 255, 0.25));
        border: 1px solid rgba(160, 82, 255, 0.4);
      }

      .hw-user-tag strong {
        font-size: 9px;
        font-weight: 900;
        color: #ffffff;
        letter-spacing: 0.08em;
      }

      /* Responsive Adjustments */
      @media (max-width: 720px) {
        #arcade-home.arcade-cinematic-v5.active { padding: 8px 6px 6px !important; }
        .arcade-hero-title { font-size: 34px !important; }
        #arcade-home.arcade-cinematic-v5 #home-carousel { gap: 6px !important; }
        #arcade-home.arcade-cinematic-v5 .app-card.is-visible { height: 140px !important; padding: 8px 4px !important; }
        .arcade-card-icon { width: 44px !important; height: 44px !important; min-height: 44px !important; }
        .arcade-premium-icon { width: 38px !important; height: 38px !important; }
        .arcade-card-name { font-size: 10px; }
        .arcade-card-sub { font-size: 6px; }
        .hw-btn { padding: 4px 6px; font-size: 8px; }
      }

      @media (prefers-reduced-motion: reduce) {
        .app-card.is-visible { transition: none !important; }
      }
    `;
}
