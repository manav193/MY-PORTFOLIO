/* 
 * ELITE ENGINEERING BACKGROUND SYSTEM
 * Layered Procedural SVG Engine (GPU Accelerated, Responsive, Vanilla JS)
 */

(function() {
  const container = document.getElementById('machine-bg');
  if (!container) return;

  // Clear existing if any
  container.innerHTML = '';

  const style = document.createElement('style');
  style.textContent = `
    #machine-bg {
      position: fixed;
      inset: 0;
      z-index: -2;
      pointer-events: none;
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0;
      transition: opacity 3s cubic-bezier(0.16, 1, 0.3, 1);
    }
    #machine-bg.ready {
      opacity: 1;
    }
    .mb-svg {
      width: 150vw;
      height: 150vh;
      max-width: 2500px;
      max-height: 2500px;
      transform-origin: center;
      will-change: transform;
    }
    
    /* Layer Stylings */
    .mb-line { fill: none; stroke: rgba(var(--highlight-rgb), 0.04); stroke-width: 1; vector-effect: non-scaling-stroke; }
    .mb-line-medium { fill: none; stroke: rgba(var(--highlight-rgb), 0.08); stroke-width: 1.5; vector-effect: non-scaling-stroke; }
    .mb-line-bold { fill: none; stroke: rgba(var(--highlight-rgb), 0.15); stroke-width: 2; vector-effect: non-scaling-stroke; }
    
    .mb-glow { fill: none; stroke: rgba(var(--highlight-rgb), 0.1); stroke-width: 12px; filter: blur(16px); }
    .mb-dot { fill: rgba(var(--highlight-rgb), 0.25); }
    
    /* Dynamic Noise Overlay */
    .mb-noise { mix-blend-mode: overlay; opacity: 0.15; pointer-events: none; }

    /* Precision Motion Physics */
    @keyframes spin-cw { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
    @keyframes spin-ccw { from { transform: rotate(0deg); } to { transform: rotate(-360deg); } }
    
    /* Using CSS Variables that can be mutated by Scroll Velocity in motion.js */
    .spin-slow { animation: spin-cw calc(240s / var(--scroll-velocity, 1)) linear infinite; transform-origin: center; }
    .spin-slower { animation: spin-ccw calc(360s / var(--scroll-velocity, 1)) linear infinite; transform-origin: center; }
    .spin-fast { animation: spin-cw calc(120s / var(--scroll-velocity, 1)) cubic-bezier(0.25, 0.1, 0.25, 1) infinite; transform-origin: center; }
    .pulse-glow { animation: pulse 8s ease-in-out infinite alternate; }
    
    @keyframes pulse { 0% { opacity: 0.3; } 100% { opacity: 0.8; } }

    /* Theme Adaptations */
    [data-theme="light-apple"] .mb-line { stroke: rgba(0,0,0,0.03); }
    [data-theme="light-apple"] .mb-line-medium { stroke: rgba(0,0,0,0.06); }
    [data-theme="light-apple"] .mb-line-bold { stroke: rgba(0,0,0,0.1); }
    [data-theme="light-apple"] .mb-glow { stroke: rgba(0,0,0,0.04); }
    [data-theme="light-apple"] .mb-dot { fill: rgba(0,0,0,0.15); }
  `;
  document.head.appendChild(style);

  // SVG Initialization
  const svgNS = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(svgNS, "svg");
  svg.setAttribute("viewBox", "0 0 1000 1000");
  svg.setAttribute("class", "mb-svg");

  const cx = 500, cy = 500;

  // Utility functions
  const createCircle = (r, className, dasharray) => {
    const c = document.createElementNS(svgNS, "circle");
    c.setAttribute("cx", cx); c.setAttribute("cy", cy); c.setAttribute("r", r);
    c.setAttribute("class", className);
    if (dasharray) c.setAttribute("stroke-dasharray", dasharray);
    return c;
  };
  const createLine = (x1, y1, x2, y2, className) => {
    const l = document.createElementNS(svgNS, "line");
    l.setAttribute("x1", x1); l.setAttribute("y1", y1); l.setAttribute("x2", x2); l.setAttribute("y2", y2);
    l.setAttribute("class", className);
    return l;
  };

  /* =======================================================================
     LAYER 9: DYNAMIC NOISE & LAYER 8: SOFT GLASS (Defined in Filters)
     ======================================================================= */
  const defs = document.createElementNS(svgNS, "defs");
  
  // Dynamic Noise Filter
  const noiseFilter = document.createElementNS(svgNS, "filter");
  noiseFilter.setAttribute("id", "dynamicNoise");
  const turbulence = document.createElementNS(svgNS, "feTurbulence");
  turbulence.setAttribute("type", "fractalNoise");
  turbulence.setAttribute("baseFrequency", "0.65");
  turbulence.setAttribute("numOctaves", "3");
  turbulence.setAttribute("stitchTiles", "stitch");
  noiseFilter.appendChild(turbulence);
  defs.appendChild(noiseFilter);

  // Glass Reflection Gradient
  const grad = document.createElementNS(svgNS, "linearGradient");
  grad.setAttribute("id", "glassGlow");
  grad.setAttribute("x1", "0%"); grad.setAttribute("y1", "0%"); grad.setAttribute("x2", "100%"); grad.setAttribute("y2", "100%");
  const stop1 = document.createElementNS(svgNS, "stop"); stop1.setAttribute("offset", "0%"); stop1.setAttribute("stop-color", "rgba(var(--highlight-rgb), 0.2)");
  const stop2 = document.createElementNS(svgNS, "stop"); stop2.setAttribute("offset", "100%"); stop2.setAttribute("stop-color", "rgba(var(--highlight-rgb), 0)");
  grad.appendChild(stop1); grad.appendChild(stop2);
  defs.appendChild(grad);
  svg.appendChild(defs);

  /* =======================================================================
     LAYER 1: ENGINEERING GRID (Base Blueprint Layer)
     ======================================================================= */
  const gridGroup = document.createElementNS(svgNS, "g");
  for (let i = 0; i <= 1000; i += 40) {
    gridGroup.appendChild(createLine(i, 0, i, 1000, i % 200 === 0 ? "mb-line-medium" : "mb-line"));
    gridGroup.appendChild(createLine(0, i, 1000, i, i % 200 === 0 ? "mb-line-medium" : "mb-line"));
  }
  svg.appendChild(gridGroup);

  /* =======================================================================
     LAYER 5: CONNECTION LINES & LAYER 7: AMBIENT LIGHTING
     ======================================================================= */
  const ambientGroup = document.createElementNS(svgNS, "g");
  ambientGroup.appendChild(createLine(0, cy, 1000, cy, "mb-line-medium")); // Horizon axis
  ambientGroup.appendChild(createLine(cx, 0, cx, 1000, "mb-line-medium")); // Vertical axis
  
  // Diagonal connection geometry
  ambientGroup.appendChild(createLine(cx - 300, cy - 300, cx + 300, cy + 300, "mb-line"));
  ambientGroup.appendChild(createLine(cx + 300, cy - 300, cx - 300, cy + 300, "mb-line"));
  svg.appendChild(ambientGroup);

  /* =======================================================================
     LAYER 2: CONCENTRIC RINGS & LAYER 6: ORBITING NODES (Slow CCW)
     ======================================================================= */
  const outerOrbit = document.createElementNS(svgNS, "g");
  outerOrbit.setAttribute("class", "spin-slower");
  outerOrbit.appendChild(createCircle(420, "mb-line-bold", "1 150")); // Sparse orbit track
  outerOrbit.appendChild(createCircle(400, "mb-line", "4 12")); // Dotted orbit track
  outerOrbit.appendChild(createCircle(390, "mb-glow pulse-glow")); // Ambient glow
  
  // Orbiting Nodes
  const nodeGroups = [[0, -420], [420, 0], [0, 420], [-420, 0]];
  nodeGroups.forEach(pos => {
    const node = document.createElementNS(svgNS, "circle");
    node.setAttribute("cx", cx + pos[0]); node.setAttribute("cy", cy + pos[1]); node.setAttribute("r", 5);
    node.setAttribute("class", "mb-dot");
    outerOrbit.appendChild(node);
  });
  svg.appendChild(outerOrbit);

  /* =======================================================================
     LAYER 3: CALIBRATION MARKS (Mid Ring - Slow CW)
     ======================================================================= */
  const calibrationRing = document.createElementNS(svgNS, "g");
  calibrationRing.setAttribute("class", "spin-slow");
  calibrationRing.appendChild(createCircle(280, "mb-line-medium", "24 8"));
  
  // Precision Calibration Ticks
  for (let i = 0; i < 360; i += 5) {
    const tick = document.createElementNS(svgNS, "line");
    tick.setAttribute("x1", cx); tick.setAttribute("y1", cy - 275);
    tick.setAttribute("x2", cx); tick.setAttribute("y2", i % 45 === 0 ? cy - 295 : cy - 285);
    tick.setAttribute("class", i % 45 === 0 ? "mb-line-bold" : "mb-line");
    tick.setAttribute("transform", `rotate(${i} ${cx} ${cy})`);
    calibrationRing.appendChild(tick);
  }
  svg.appendChild(calibrationRing);

  /* =======================================================================
     LAYER 4: TECHNICAL GEOMETRY & LAYER 10: ENGINEERING CORE (Fast CW)
     ======================================================================= */
  const coreGroup = document.createElementNS(svgNS, "g");
  
  // Time of Day Logic: Reverse core direction if PM
  const isPM = new Date().getHours() >= 12;
  coreGroup.setAttribute("class", isPM ? "spin-fast" : "spin-slower");
  
  coreGroup.appendChild(createCircle(140, "mb-line-bold", "2 6"));
  coreGroup.appendChild(createCircle(100, "mb-line"));
  
  // Inner Glass Core Geometry (Hexagon)
  const hex = document.createElementNS(svgNS, "polygon");
  const hexPoints = [];
  for (let i = 0; i < 6; i++) {
    const angle = (i * 60) * (Math.PI / 180);
    hexPoints.push(`${cx + 100 * Math.cos(angle)},${cy + 100 * Math.sin(angle)}`);
  }
  hex.setAttribute("points", hexPoints.join(" "));
  hex.setAttribute("class", "mb-line-bold");
  hex.setAttribute("fill", "url(#glassGlow)");
  coreGroup.appendChild(hex);

  // Technical Crosshairs
  coreGroup.appendChild(createLine(cx - 90, cy, cx + 90, cy, "mb-line-medium"));
  coreGroup.appendChild(createLine(cx, cy - 90, cx, cy + 90, "mb-line-medium"));
  svg.appendChild(coreGroup);

  // Append Noise Overlay Rect
  const noiseRect = document.createElementNS(svgNS, "rect");
  noiseRect.setAttribute("width", "1000"); noiseRect.setAttribute("height", "1000");
  noiseRect.setAttribute("filter", "url(#dynamicNoise)");
  noiseRect.setAttribute("class", "mb-noise");
  svg.appendChild(noiseRect);

  // Inject SVG
  container.appendChild(svg);
  setTimeout(() => container.classList.add('ready'), 200);

  /* =======================================================================
     INTERACTION: VIEWPORT, MOUSE, SCROLL PHYSICS
     ======================================================================= */
  let mouseX = 0, mouseY = 0;
  let currentX = 0, currentY = 0;
  
  document.addEventListener('mousemove', (e) => {
    const winX = window.innerWidth / 2;
    const winY = window.innerHeight / 2;
    mouseX = (e.clientX - winX) / winX;
    mouseY = (e.clientY - winY) / winY;
  }, { passive: true });

  const renderLoop = () => {
    const scrollY = window.scrollY;
    
    // Smooth Lerp Physics
    currentX += (mouseX - currentX) * 0.05;
    currentY += (mouseY - currentY) * 0.05;
    
    // Parallax limits (-30px to +30px X/Y shift) + Scroll depth
    const tx = currentX * -30; 
    const ty = (currentY * -30) - (scrollY * 0.08); 
    
    // Z-Axis Depth Scaling
    const scale = 1.05 + (scrollY * 0.0001);
    
    // Rotate entire machine opposite to scroll direction
    const globalRot = scrollY * 0.01;
    
    svg.style.transform = `translate3d(${tx}px, ${ty}px, 0) rotate(${globalRot}deg) scale(${scale})`;
    
    requestAnimationFrame(renderLoop);
  };

  requestAnimationFrame(renderLoop);

})();
