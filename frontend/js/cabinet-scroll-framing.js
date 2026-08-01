(function () {
  const intro = document.getElementById('intro-sequence');
  const chassis = document.querySelector('.cabinet-chassis');
  if (!intro || !chassis) return;

  const disabled = window.matchMedia('(max-width: 767px), (hover: none) and (pointer: coarse)').matches;
  if (disabled) return;

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let frame = 0;
  let current = reducedMotion ? 1 : 0;

  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  const easeOutCubic = (value) => 1 - Math.pow(1 - value, 3);

  function render() {
    frame = 0;
    if (!chassis.isConnected || !intro.isConnected) return;

    const viewport = Math.max(window.innerHeight, 1);
    const target = reducedMotion ? 1 : clamp(window.scrollY / (viewport * 0.72), 0, 1);
    current += (target - current) * 0.16;

    const eased = easeOutCubic(current);
    const narrowLaptop = window.innerWidth < 1180;
    const startScale = narrowLaptop ? 1.24 : 1.36;
    const startShiftY = narrowLaptop ? 5.5 : 7.5;
    const scale = startScale + (1 - startScale) * eased;
    const shiftY = startShiftY * (1 - eased);

    // Rotation remains owned by .cab-3d-volume in intro.js. This controller
    // only frames the complete cabinet chassis for the opening close-up.
    chassis.style.transform = `translate3d(0, ${shiftY}vh, 0) scale(${scale})`;
    chassis.style.transformOrigin = '50% 43%';
    chassis.style.willChange = target < 1 || Math.abs(target - current) > 0.002 ? 'transform' : 'auto';

    if (Math.abs(target - current) > 0.001) schedule();
  }

  function schedule() {
    if (frame) return;
    frame = requestAnimationFrame(render);
  }

  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', schedule, { passive: true });
  window.addEventListener('pageshow', schedule);
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) schedule();
  });

  schedule();
})();
