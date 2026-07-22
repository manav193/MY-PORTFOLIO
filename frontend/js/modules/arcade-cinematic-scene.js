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

      /* 2. Background Universe Decor Layer */
      .arcade-universe-bg {
        position: absolute;
        inset: 0;
        z-index: 1;
        pointer-events: none;
        overflow: hidden;
      }

      .arcade-space-gradient {
        position: absolute;
        inset: 0;
        background:
          radial-gradient(ellipse at 50% 12%, rgba(110, 50, 255, 0.28) 0%, transparent 50%),
          radial-gradient(circle at 18% 30%, rgba(0, 210, 255, 0.14), transparent 35%),
          radial-gradient(circle at 82% 25%, rgba(220, 40, 255, 0.14), transparent 35%);
      }

      /* Perspective Grid near the bottom */
      .arcade-grid-perspective {
        position: absolute;
        left: -25%;
        right: -25%;
        bottom: -12%;
        height: 52%;
        transform: perspective(280px) rotateX(66deg);
        background-image:
          linear-gradient(rgba(0, 220, 255, 0.22) 1px, transparent 1px),
          linear-gradient(90deg, rgba(0, 220, 255, 0.22) 1px, transparent 1px);
        background-size: 36px 36px;
        mask-image: linear-gradient(to top, rgba(0,0,0,0.95) 10%, transparent 90%);
      }

      /* Curved Cyan/Blue Horizon Arc */
      .arcade-horizon-arc {
        position: absolute;
        left: 50%;
        bottom: -30%;
        width: 132%;
        height: 58%;
        transform: translateX(-50%);
        border-radius: 50% 50% 0 0 / 100% 100% 0 0;
        border-top: 3px solid #16f0f5;
        box-shadow: 0 -8px 28px rgba(22, 240, 245, 0.85), 0 -28px 75px rgba(50, 70, 255, 0.5);
        background: radial-gradient(ellipse at 50% 0%, rgba(22, 240, 245, 0.18), transparent 70%);
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

      .hw-btn:hover {
        border-color: rgba(0, 229, 255, 0.5);
        color: #ffffff;
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
