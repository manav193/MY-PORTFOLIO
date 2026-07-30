const WRENCH_PATH = 'M20 45C79 13 151 30 193 87C208 108 222 126 248 136L696 136C713 84 762 48 820 48C888 48 943 103 943 170C943 237 888 292 820 292C762 292 713 256 696 204L248 204C222 214 208 232 193 253C151 310 79 327 20 295L83 219C106 236 136 226 148 199C156 181 156 159 148 141C136 114 106 104 83 121L20 45ZM820 94L850 102L876 120L894 145L901 170L894 195L876 220L850 238L820 246L790 238L764 220L746 195L739 170L746 145L764 120L790 102L820 94Z';

export function createMaintenanceWrench() {
  const wrapper = document.createElement('div');
  wrapper.className = 'system-boot-wrench';
  wrapper.setAttribute('aria-hidden', 'true');
  wrapper.innerHTML = `<svg viewBox="0 0 960 340" xmlns="http://www.w3.org/2000/svg">
    <defs><linearGradient id="boot-forged-steel" x1="0" y1="0" x2=".92" y2="1">
      <stop offset="0" stop-color="#c9ced3"/><stop offset=".18" stop-color="#858b94"/>
      <stop offset=".5" stop-color="#aeb4ba"/><stop offset=".78" stop-color="#626973"/><stop offset="1" stop-color="#414750"/>
    </linearGradient></defs>
    <path fill-rule="evenodd" d="${WRENCH_PATH}" fill="url(#boot-forged-steel)" stroke="#d9dde1" stroke-opacity=".28" stroke-width="4" stroke-linejoin="round"/>
    <path d="M265 151H687M29 48C84 24 145 42 181 93M820 81C870 81 910 121 910 170C910 219 870 259 820 259" fill="none" stroke="#eef0f2" stroke-opacity=".16" stroke-width="3" stroke-linecap="round"/>
  </svg>`;
  return wrapper;
}

export async function runWrenchCalibration(element, { reducedMotion = false, duration = 520 } = {}) {
  if (!element?.animate) return;
  const frames = reducedMotion
    ? [{ opacity: 0.55 }, { opacity: 1 }]
    : [
        { transform: 'translate3d(-5px, 2px, 0) rotate(-2.4deg)', opacity: 0.58 },
        { transform: 'translate3d(2px, -1px, 0) rotate(1.4deg)', opacity: 0.94, offset: 0.62 },
        { transform: 'translate3d(0, 0, 0) rotate(0deg)', opacity: 1 }
      ];
  const animation = element.animate(frames, { duration, easing: 'cubic-bezier(.2,.75,.25,1)', fill: 'forwards' });
  try { await animation.finished; } catch {}
}
