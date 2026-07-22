/**
 * Arcade3DPlanetEngine & OrbitalEnvironmentController
 * Live Orbital Space System for ArcadeOS.
 * Features:
 * - Unified Solar Light Source & Sun Optics Bloom
 * - 3-Tier Multi-Depth Dynamic Starfield with Solar Lighting Sensitivity
 * - Subtle Constellation Guide Lines
 * - 3D Spherical Earth (23.4° axial tilt, rotating continents & city lights)
 * - Independent Rotating Cloud Layer
 * - Rotating Surface Location Marker & Night Urban Glow
 * - Polar Aurora Ribbons anchored to rotating polar atmosphere
 * - 3D Inclined Moon Orbit with True Z-Depth Occlusion
 * - 3D Orbital Satellites (ISS & Research Satellites with real-data fallback)
 * - Rare Meteor / Shooting Star Event Engine
 * - Developer ?orbitDebug=1 Mode
 * - Offscreen pause via IntersectionObserver
 */

export const Arcade3DPlanetEngine = {
  config: {
    earthRotationDuration: 240, // 240 seconds per rotation
    cloudRotationDuration: 210, // Independent cloud drift
    moonOrbitDuration: 280,     // 280 seconds per orbit
    issOrbitDuration: 160,      // ISS satellite orbital cycle
    sat2OrbitDuration: 210,     // Secondary satellite cycle
    meteorIntervalMin: 45,      // Seconds between meteors
    meteorIntervalMax: 180,
    axialTiltDeg: 23.4,
    debugEarthRotDuration: 20,  // Fast debug mode
    debugMoonOrbitDuration: 15,
    debugSatOrbitDuration: 12
  },

  state: {
    initialized: false,
    running: false,
    animFrameId: null,
    startTime: Date.now(),
    earthAngle: 0,
    cloudAngle: 0,
    moonOrbitAngle: 0,
    issOrbitAngle: 0,
    sat2OrbitAngle: 0,
    stars: [],
    constellations: [],
    activeMeteor: null,
    nextMeteorTime: Date.now() + 30000,
    observer: null,
    canvas: null,
    ctx: null,
    issRealData: null
  },

  /**
   * Developer debug mode check (?orbitDebug=1).
   */
  isDebugMode() {
    try {
      if (typeof window !== 'undefined') {
        if (window.ORBIT_DEBUG) return true;
        const params = new URLSearchParams(window.location.search);
        return params.has('orbitDebug') || params.get('debug') === 'orbit';
      }
    } catch {}
    return false;
  },

  /**
   * Initializes the 3D Planet & Orbital Space Engine inside .arcade-universe-bg.
   */
  init() {
    if (this.state.initialized) return;

    const universeBg = document.querySelector('.arcade-universe-bg');
    if (!universeBg) return;

    this.state.initialized = true;
    this.initStarfield();
    this.createCanvas(universeBg);
    this.setupIntersectionObserver(universeBg);
    this.fetchLiveIssData();
    this.start();
  },

  /**
   * Initializes multi-depth procedural starfield and subtle constellation lines.
   */
  initStarfield() {
    const stars = [];
    // Distant faint stars (Tier 1)
    for (let i = 0; i < 80; i++) {
      stars.push({
        xRatio: Math.random(),
        yRatio: Math.random() * 0.65,
        size: 0.5 + Math.random() * 0.5,
        alpha: 0.15 + Math.random() * 0.25,
        tier: 1,
        color: '#f8fafc'
      });
    }
    // Mid brighter stars (Tier 2)
    for (let i = 0; i < 35; i++) {
      stars.push({
        xRatio: Math.random(),
        yRatio: Math.random() * 0.6,
        size: 1.0 + Math.random() * 0.6,
        alpha: 0.35 + Math.random() * 0.35,
        tier: 2,
        color: Math.random() > 0.4 ? '#e2e8f0' : '#38bdf8'
      });
    }
    // Rare bright star points (Tier 3)
    const brightColors = ['#ffffff', '#fef08a', '#38bdf8', '#a855f7'];
    for (let i = 0; i < 8; i++) {
      stars.push({
        xRatio: Math.random(),
        yRatio: Math.random() * 0.5,
        size: 1.8 + Math.random() * 0.8,
        alpha: 0.6 + Math.random() * 0.35,
        tier: 3,
        color: brightColors[i % brightColors.length],
        twinkleSpeed: 0.002 + Math.random() * 0.003
      });
    }
    this.state.stars = stars;

    // Sparse constellation guide lines (Tier 3 star index connections)
    this.state.constellations = [
      { from: 115, to: 117, label: 'CYGNUS' },
      { from: 118, to: 120, label: 'ORION' },
      { from: 121, to: 122, label: 'CASSIOPEIA' }
    ];
  },

  /**
   * Fetches real ISS position data safely with graceful fallback.
   */
  async fetchLiveIssData() {
    try {
      const res = await fetch('https://api.wheretheiss.at/v1/satellites/25544', { signal: AbortSignal.timeout(4000) });
      if (res.ok) {
        const data = await res.json();
        if (data && data.latitude !== undefined) {
          this.state.issRealData = {
            lat: data.latitude,
            lon: data.longitude,
            alt: Math.round(data.altitude || 418),
            vel: Math.round(data.velocity || 27600)
          };
        }
      }
    } catch {
      this.state.issRealData = null; // Graceful fallback to cinematic simulation
    }
  },

  /**
   * Creates overlay canvas for 3D Earth, Moon, Satellites, and Space projection.
   */
  createCanvas(container) {
    let canvas = container.querySelector('.arcade-3d-canvas');
    if (!canvas) {
      canvas = document.createElement('canvas');
      canvas.className = 'arcade-3d-canvas';
      canvas.style.position = 'absolute';
      canvas.style.inset = '0';
      canvas.style.width = '100%';
      canvas.style.height = '100%';
      canvas.style.pointerEvents = 'none';
      canvas.style.zIndex = '1';
      container.appendChild(canvas);
    }
    this.state.canvas = canvas;
    this.state.ctx = canvas.getContext('2d');
    this.resizeCanvas();
    window.addEventListener('resize', () => this.resizeCanvas());
  },

  resizeCanvas() {
    if (!this.state.canvas) return;
    const rect = this.state.canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.state.canvas.width = Math.floor(rect.width * dpr);
    this.state.canvas.height = Math.floor(rect.height * dpr);
  },

  setupIntersectionObserver(target) {
    if (!('IntersectionObserver' in window)) return;
    this.state.observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          this.start();
        } else {
          this.stop();
        }
      });
    }, { threshold: 0.05 });
    this.state.observer.observe(target);
  },

  start() {
    if (this.state.running) return;
    this.state.running = true;
    this.tick();
  },

  stop() {
    this.state.running = false;
    if (this.state.animFrameId) {
      cancelAnimationFrame(this.state.animFrameId);
      this.state.animFrameId = null;
    }
  },

  /**
   * Main animation loop.
   */
  tick() {
    if (!this.state.running) return;

    const isDebug = this.isDebugMode();
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const now = Date.now();
    const elapsedSec = (now - this.state.startTime) / 1000;

    const earthRotDur = reducedMotion ? 3600 : isDebug ? this.config.debugEarthRotDuration : this.config.earthRotationDuration;
    const moonRotDur = reducedMotion ? 3600 : isDebug ? this.config.debugMoonOrbitDuration : this.config.moonOrbitDuration;
    const issRotDur = reducedMotion ? 3600 : isDebug ? this.config.debugSatOrbitDuration : this.config.issOrbitDuration;

    this.state.earthAngle = ((elapsedSec / earthRotDur) * 2 * Math.PI) % (2 * Math.PI);
    this.state.cloudAngle = ((elapsedSec / this.config.cloudRotationDuration) * 2 * Math.PI) % (2 * Math.PI);
    this.state.moonOrbitAngle = ((elapsedSec / moonRotDur) * 2 * Math.PI) % (2 * Math.PI);
    this.state.issOrbitAngle = ((elapsedSec / issRotDur) * 2 * Math.PI) % (2 * Math.PI);
    this.state.sat2OrbitAngle = ((elapsedSec / (this.config.sat2OrbitDuration)) * 2 * Math.PI) % (2 * Math.PI);

    // Rare Meteor Trigger Pipeline
    if (now >= this.state.nextMeteorTime || (isDebug && !this.state.activeMeteor && Math.random() < 0.02)) {
      this.triggerMeteorEvent(isDebug);
    }

    this.renderFrame(isDebug);

    this.state.animFrameId = requestAnimationFrame(() => this.tick());
  },

  /**
   * Triggers a rare meteor / shooting star event.
   */
  triggerMeteorEvent(isDebug = false) {
    const canvas = this.state.canvas;
    if (!canvas) return;

    const w = canvas.width;
    const h = canvas.height;

    const startX = Math.random() * w * 0.7;
    const startY = Math.random() * h * 0.3;
    const length = 80 + Math.random() * 120;
    const angle = (25 + Math.random() * 20) * (Math.PI / 180);

    this.state.activeMeteor = {
      startX,
      startY,
      endX: startX + Math.cos(angle) * length,
      endY: startY + Math.sin(angle) * length,
      durationMs: 600 + Math.random() * 600,
      startTime: Date.now()
    };

    const intervalSec = isDebug ? 5 : this.config.meteorIntervalMin + Math.random() * (this.config.meteorIntervalMax - this.config.meteorIntervalMin);
    this.state.nextMeteorTime = Date.now() + intervalSec * 1000;
  },

  /**
   * Master Render Frame method for 3D Space, Earth, Moon, Satellites, and Meteors.
   */
  renderFrame(isDebug = false) {
    const canvas = this.state.canvas;
    const ctx = this.state.ctx;
    if (!canvas || !ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    const envCtx = (window.ArcadeEnvironmentService && window.ArcadeEnvironmentService.state.context) || null;

    // 1. Render Multi-Depth Starfield & Solar Sky Dimming
    this.renderStarfield(ctx, w, h, envCtx);

    // 2. Render Rare Meteor Streak
    this.renderMeteor(ctx);

    // Shared Geometry
    const earthCenterX = w * 0.5;
    const earthCenterY = h * 1.48;
    const earthRadius = w * 0.42;

    // 3. Render Distant Sun Optics & Shared Solar Direction
    this.renderSunOptics(ctx, w, h, envCtx);

    // 4. Calculate 3D Moon Orbit Position
    const moonOrbitRx = w * 0.46;
    const moonOrbitRy = h * 0.38;
    const moonAngle = this.state.moonOrbitAngle;

    const moonX = earthCenterX + Math.cos(moonAngle) * moonOrbitRx;
    const moonY = (h * 0.22) + Math.sin(moonAngle) * moonOrbitRy * 0.45;
    const moonZ = Math.sin(moonAngle); // Z-depth: >0 front, <0 back

    const distToEarthCenter = Math.hypot(moonX - earthCenterX, moonY - earthCenterY);
    const isMoonOccluded = moonZ < 0 && distToEarthCenter < (earthRadius * 0.98);
    const isBehindEarth = isMoonOccluded;

    // 5. Calculate 3D ISS Satellite Orbit Position
    const issAngle = this.state.issOrbitAngle;
    const issX = earthCenterX + Math.cos(issAngle + 0.8) * (w * 0.48);
    const issY = (h * 0.32) + Math.sin(issAngle + 0.8) * (h * 0.28);
    const issZ = Math.sin(issAngle + 0.8);
    const isIssOccluded = issZ < 0 && Math.hypot(issX - earthCenterX, issY - earthCenterY) < (earthRadius * 0.98);

    // Render Moon if in BACK (and not occluded)
    if (moonZ < 0 && !isMoonOccluded) {
      this.renderMoonNode(ctx, moonX, moonY, moonZ, envCtx?.moon, envCtx);
    }

    // Render ISS Satellite if in BACK (and not occluded)
    if (issZ < 0 && !isIssOccluded) {
      this.renderSatelliteNode(ctx, issX, issY, issZ, 'ISS', this.state.issRealData);
    }

    // 6. Render 3D Spherical Earth & Rotating Clouds
    this.renderSphericalEarth(ctx, earthCenterX, earthCenterY, earthRadius, envCtx);

    // Render Moon if in FRONT of Earth
    if (moonZ >= 0) {
      this.renderMoonNode(ctx, moonX, moonY, moonZ, envCtx?.moon, envCtx);
    }

    // Render ISS Satellite if in FRONT of Earth
    if (issZ >= 0) {
      this.renderSatelliteNode(ctx, issX, issY, issZ, 'ISS', this.state.issRealData);
    }

    // 7. Render Rotating Surface Location Marker
    this.renderLocationMarker(ctx, earthCenterX, earthCenterY, earthRadius, envCtx);

    // 8. Developer ?orbitDebug=1 Badge
    if (isDebug) {
      this.renderDebugBadge(ctx, w, moonZ, isMoonOccluded, issZ);
    }
  },

  /**
   * Renders multi-depth procedural stars and subtle constellation guide lines.
   */
  renderStarfield(ctx, w, h, envCtx) {
    const isDay = envCtx?.solarPhase === 'DAY';
    const sunriseGlow = envCtx?.solarPhase === 'SUNRISE' || envCtx?.solarPhase === 'SUNSET';
    
    // Star dimming factor: Day = 0.25 opacity multiplier, Night = 1.0
    const starAlphaMult = isDay ? 0.25 : sunriseGlow ? 0.6 : 1.0;
    const now = Date.now();

    ctx.save();
    this.state.stars.forEach(star => {
      const x = star.xRatio * w;
      const y = star.yRatio * h;

      let alpha = star.alpha * starAlphaMult;
      if (star.tier === 3 && star.twinkleSpeed) {
        alpha *= (0.7 + 0.3 * Math.sin(now * star.twinkleSpeed));
      }

      ctx.fillStyle = star.color;
      ctx.globalAlpha = Math.max(0, alpha);
      ctx.beginPath();
      ctx.arc(x, y, star.size, 0, Math.PI * 2);
      ctx.fill();
    });

    // Constellation Guide Lines (Only at Night/Twilight, 5% opacity)
    if (!isDay && this.state.stars.length >= 123) {
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.08)';
      ctx.lineWidth = 0.6;
      ctx.setLineDash([3, 6]);

      this.state.constellations.forEach(c => {
        const s1 = this.state.stars[c.from];
        const s2 = this.state.stars[c.to];
        if (s1 && s2) {
          ctx.beginPath();
          ctx.moveTo(s1.xRatio * w, s1.yRatio * h);
          ctx.lineTo(s2.xRatio * w, s2.yRatio * h);
          ctx.stroke();
        }
      });
      ctx.setLineDash([]);
    }
    ctx.restore();
  },

  /**
   * Renders shared Solar Light Source Optics & Distant Limb Bloom.
   */
  renderSunOptics(ctx, w, h, envCtx) {
    const phase = envCtx?.solarPhase || 'NIGHT';
    if (phase === 'NIGHT') return;

    ctx.save();
    let sunX = w * 0.85;
    let sunY = h * 0.12;
    let sunColor = 'rgba(253, 230, 138, 0.3)';

    if (phase === 'SUNRISE') {
      sunX = w * 0.92;
      sunY = h * 0.24;
      sunColor = 'rgba(251, 146, 60, 0.45)';
    } else if (phase === 'SUNSET') {
      sunX = w * 0.08;
      sunY = h * 0.24;
      sunColor = 'rgba(244, 63, 94, 0.45)';
    }

    // Distant Sun Bloom Flare
    const sunGrad = ctx.createRadialGradient(sunX, sunY, 2, sunX, sunY, 180);
    sunGrad.addColorStop(0, '#ffffff');
    sunGrad.addColorStop(0.2, sunColor);
    sunGrad.addColorStop(0.6, 'rgba(56, 189, 248, 0.1)');
    sunGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

    ctx.fillStyle = sunGrad;
    ctx.beginPath();
    ctx.arc(sunX, sunY, 180, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  },

  /**
   * Renders rare shooting star / meteor event.
   */
  renderMeteor(ctx) {
    const meteor = this.state.activeMeteor;
    if (!meteor) return;

    const now = Date.now();
    const progress = (now - meteor.startTime) / meteor.durationMs;

    if (progress >= 1.0) {
      this.state.activeMeteor = null;
      return;
    }

    const currentX = meteor.startX + (meteor.endX - meteor.startX) * progress;
    const currentY = meteor.startY + (meteor.endY - meteor.startY) * progress;

    ctx.save();
    const alpha = (1 - progress) * 0.85;

    const streakGrad = ctx.createLinearGradient(meteor.startX, meteor.startY, currentX, currentY);
    streakGrad.addColorStop(0, 'rgba(255, 255, 255, 0)');
    streakGrad.addColorStop(0.7, 'rgba(56, 189, 248, 0.4)');
    streakGrad.addColorStop(1, 'rgba(255, 255, 255, 0.95)');

    ctx.strokeStyle = streakGrad;
    ctx.lineWidth = 1.5;
    ctx.globalAlpha = alpha;
    ctx.beginPath();
    ctx.moveTo(meteor.startX, meteor.startY);
    ctx.lineTo(currentX, currentY);
    ctx.stroke();

    // Bright meteor head
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = '#38bdf8';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(currentX, currentY, 1.8, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  },

  /**
   * Renders true 3D spherical Earth surface with axial tilt, rotating continents, city lights, and clouds.
   */
  renderSphericalEarth(ctx, cx, cy, r, envCtx) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.clip();

    // Base Oceanic Deep Navy Sphere Shader
    const oceanGrad = ctx.createRadialGradient(cx, cy - r * 0.2, r * 0.1, cx, cy, r);
    const isDay = envCtx?.solarPhase === 'DAY';
    if (isDay) {
      oceanGrad.addColorStop(0, '#0a2540');
      oceanGrad.addColorStop(0.5, '#061a30');
      oceanGrad.addColorStop(1, '#020b18');
    } else {
      oceanGrad.addColorStop(0, '#061024');
      oceanGrad.addColorStop(0.5, '#030816');
      oceanGrad.addColorStop(1, '#01030a');
    }
    ctx.fillStyle = oceanGrad;
    ctx.fill();

    // 23.4° Axial Tilt Rotation Transformation
    ctx.translate(cx, cy);
    ctx.rotate((this.config.axialTiltDeg * Math.PI) / 180);
    ctx.translate(-cx, -cy);

    // Rotating Continents (3D Spherical Orthographic Projection)
    const earthRot = this.state.earthAngle;
    const continents = [
      { name: 'Americas', baseLon: 0 },
      { name: 'Eurasia', baseLon: Math.PI * 0.65 },
      { name: 'AsiaPacific', baseLon: Math.PI * 1.3 }
    ];

    continents.forEach(cont => {
      const lon = (cont.baseLon + earthRot) % (Math.PI * 2);
      const isVisibleFront = Math.cos(lon) > -0.2;

      if (isVisibleFront) {
        const xOffset = Math.sin(lon) * r * 0.85;
        const scaleX = Math.max(0.1, Math.cos(lon));
        const alpha = Math.max(0, (Math.cos(lon) + 0.2) / 1.2);

        ctx.save();
        ctx.globalAlpha = alpha * 0.75;
        ctx.fillStyle = isDay ? '#1e3a5f' : '#0f1f38';

        // Organic continental shape path
        ctx.beginPath();
        ctx.ellipse(cx + xOffset, cy - r * 0.4, r * 0.35 * scaleX, r * 0.22, 0, 0, Math.PI * 2);
        ctx.ellipse(cx + xOffset * 1.1, cy - r * 0.15, r * 0.28 * scaleX, r * 0.18, 0, 0, Math.PI * 2);
        ctx.fill();

        // Night City Lights & Urban Glow (Warm Amber/Gold on Night Hemisphere)
        if (!isDay) {
          ctx.fillStyle = '#fbbf24';
          ctx.shadowColor = '#f59e0b';
          ctx.shadowBlur = 8;
          ctx.globalAlpha = alpha * 0.85;
          
          ctx.beginPath();
          ctx.arc(cx + xOffset - 12 * scaleX, cy - r * 0.38, 2.5, 0, Math.PI * 2);
          ctx.arc(cx + xOffset + 18 * scaleX, cy - r * 0.32, 2.0, 0, Math.PI * 2);
          ctx.arc(cx + xOffset + 5 * scaleX, cy - r * 0.22, 3.0, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();
      }
    });

    // Independent Rotating Cloud Layer
    const cloudRot = this.state.cloudAngle;
    ctx.save();
    ctx.globalAlpha = Math.max(0.2, envCtx?.cloudCoverage ?? 0.5) * 0.45;
    ctx.fillStyle = '#f0f9ff';
    ctx.filter = 'blur(4px)';

    const cloudOffset1 = Math.sin(cloudRot) * r * 0.9;
    const cloudOffset2 = Math.cos(cloudRot) * r * 0.85;

    ctx.beginPath();
    ctx.ellipse(cx + cloudOffset1, cy - r * 0.45, r * 0.4, r * 0.08, 0.1, 0, Math.PI * 2);
    ctx.ellipse(cx - cloudOffset2, cy - r * 0.25, r * 0.45, r * 0.09, -0.1, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Rotating Polar Aurora Ribbon (Anchored to Polar Atmosphere)
    const auroraAlpha = (envCtx?.solarPhase === 'DAY') ? 0.05 : 0.35;
    ctx.save();
    ctx.globalAlpha = auroraAlpha;
    ctx.fillStyle = 'rgba(16, 185, 129, 0.4)';
    ctx.filter = 'blur(8px)';
    ctx.beginPath();
    ctx.ellipse(cx + Math.sin(earthRot) * 40, cy - r * 0.72, r * 0.35, r * 0.06, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.restore(); // Undo axial tilt

    // Atmospheric Edge Glow & Solar Terminator Shadow
    const atmosphereGrad = ctx.createRadialGradient(cx, cy, r * 0.92, cx, cy, r);
    atmosphereGrad.addColorStop(0, 'rgba(56, 189, 248, 0)');
    atmosphereGrad.addColorStop(0.85, 'rgba(56, 189, 248, 0.25)');
    atmosphereGrad.addColorStop(1, 'rgba(168, 85, 247, 0.45)');
    ctx.fillStyle = atmosphereGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
  },

  /**
   * Renders Moon node with perspective scale and 3D depth.
   */
  renderMoonNode(ctx, x, y, zDepth, moonData, envCtx) {
    ctx.save();

    const scale = 1 + zDepth * 0.08;
    const moonRadius = 24 * scale;

    ctx.translate(x, y);

    let weatherAlpha = 0.95;
    const cond = envCtx?.weatherCondition || 'CLEAR';
    if (cond === 'PARTLY_CLOUDY') weatherAlpha = 0.75;
    else if (cond === 'CLOUDY') weatherAlpha = 0.45;
    else if (cond === 'RAIN' || cond === 'SNOW' || cond === 'FOG') weatherAlpha = 0.22;
    else if (cond === 'THUNDERSTORM') weatherAlpha = 0.15;

    ctx.globalAlpha = weatherAlpha;

    // Reflected Halo Glow
    const haloGrad = ctx.createRadialGradient(0, 0, moonRadius * 0.5, 0, 0, moonRadius * 1.8);
    haloGrad.addColorStop(0, 'rgba(255, 255, 255, 0.6)');
    haloGrad.addColorStop(0.6, 'rgba(203, 213, 225, 0.2)');
    haloGrad.addColorStop(1, 'rgba(148, 163, 184, 0)');
    ctx.fillStyle = haloGrad;
    ctx.beginPath();
    ctx.arc(0, 0, moonRadius * 1.8, 0, Math.PI * 2);
    ctx.fill();

    // Moon Base Body
    const moonGrad = ctx.createRadialGradient(-moonRadius * 0.3, -moonRadius * 0.3, moonRadius * 0.1, 0, 0, moonRadius);
    moonGrad.addColorStop(0, '#f8fafc');
    moonGrad.addColorStop(0.6, '#cbd5e1');
    moonGrad.addColorStop(1, '#475569');
    ctx.fillStyle = moonGrad;
    ctx.beginPath();
    ctx.arc(0, 0, moonRadius, 0, Math.PI * 2);
    ctx.fill();

    // Crater Detail
    ctx.fillStyle = '#64748b';
    ctx.globalAlpha = weatherAlpha * 0.35;
    ctx.beginPath();
    ctx.arc(-moonRadius * 0.2, -moonRadius * 0.15, moonRadius * 0.2, 0, Math.PI * 2);
    ctx.arc(moonRadius * 0.25, moonRadius * 0.1, moonRadius * 0.25, 0, Math.PI * 2);
    ctx.arc(-moonRadius * 0.3, moonRadius * 0.3, moonRadius * 0.15, 0, Math.PI * 2);
    ctx.fill();

    // Continuous Lunar Terminator Shadow Mask
    const illum = moonData?.illumination ?? 0.75;
    const waxing = moonData?.waxing ?? true;
    let lightOnRight = waxing;
    if (moonData?.isSouthernHemisphere) lightOnRight = !lightOnRight;

    if (illum < 0.97) {
      ctx.globalAlpha = weatherAlpha * 0.92;
      ctx.fillStyle = '#020617';
      const rx = Math.abs(moonRadius * (1 - 2 * illum));
      
      ctx.beginPath();
      ctx.arc(0, 0, moonRadius, Math.PI * 0.5, Math.PI * 1.5, lightOnRight);
      ctx.ellipse(0, 0, rx, moonRadius, 0, Math.PI * 1.5, Math.PI * 0.5, !lightOnRight);
      ctx.fill();
    }

    ctx.restore();
  },

  /**
   * Renders 3D Orbital Satellites (ISS & Research Satellites).
   */
  renderSatelliteNode(ctx, x, y, zDepth, satName = 'ISS', realData = null) {
    ctx.save();
    ctx.translate(x, y);

    const scale = 1 + zDepth * 0.1;
    const alpha = Math.max(0.2, 0.85 + zDepth * 0.15);
    ctx.globalAlpha = alpha;

    // Faint trailing orbital arc segment
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.18)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(0, 0, 16, Math.PI * 0.8, Math.PI * 1.2);
    ctx.stroke();

    // Satellite body (cyan point + solar panel T-shape)
    ctx.fillStyle = '#38bdf8';
    ctx.shadowColor = '#38bdf8';
    ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.arc(0, 0, 2.5 * scale, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = 'rgba(224, 242, 254, 0.9)';
    ctx.fillRect(-6 * scale, -1 * scale, 12 * scale, 2 * scale);

    // Micro HUD Tag
    ctx.font = '600 7px "JetBrains Mono", monospace';
    ctx.fillStyle = 'rgba(56, 189, 248, 0.7)';
    const altStr = realData ? `ALT ${realData.alt}KM` : 'ALT 418KM';
    ctx.fillText(`${satName} // ${altStr}`, 8, 3);

    ctx.restore();
  },

  /**
   * Renders rotating 3D surface location marker (e.g. HYDERABAD).
   */
  renderLocationMarker(ctx, cx, cy, r, envCtx) {
    if (!envCtx || !envCtx.locationName) return;

    const earthRot = this.state.earthAngle;
    const markerLon = (earthRot) % (Math.PI * 2);
    const isVisibleFront = Math.cos(markerLon) > 0.05;

    if (isVisibleFront) {
      const xOffset = Math.sin(markerLon) * r * 0.75;
      const markerX = cx + xOffset;
      const markerY = cy - r * 0.35;
      const alpha = Math.max(0, Math.cos(markerLon));

      ctx.save();
      ctx.globalAlpha = alpha * 0.9;

      ctx.fillStyle = '#38bdf8';
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(markerX, markerY, 4, 0, Math.PI * 2);
      ctx.fill();

      ctx.font = '700 9px "JetBrains Mono", monospace';
      ctx.fillStyle = '#e0f2fe';
      ctx.shadowColor = '#000000';
      ctx.shadowBlur = 4;
      ctx.fillText(envCtx.locationName, markerX + 8, markerY + 3);

      ctx.restore();
    }
  },

  /**
   * Renders developer ?orbitDebug=1 inspection badge.
   */
  renderDebugBadge(ctx, w, moonZ, isMoonOccluded, issZ) {
    ctx.save();
    ctx.font = '600 10px "JetBrains Mono", monospace';
    ctx.fillStyle = '#38bdf8';
    const mStatus = isMoonOccluded ? 'BEHIND (OCCLUDED)' : moonZ >= 0 ? 'FRONT (+3D)' : 'BACK';
    const satStatus = issZ >= 0 ? 'FRONT' : 'BACK';
    const meteorStatus = this.state.activeMeteor ? 'METEOR STREAK' : 'IDLE';
    const text = `[ORBIT DEBUG] EARTH: 20s | MOON: 15s (${mStatus}) | ISS: 12s (${satStatus}) | ${meteorStatus}`;
    ctx.fillText(text, 16, 24);
    ctx.restore();
  }
};
