import { ArcadePauseMenu } from './arcade-pause-menu.js';

const ARCADE_DESKTOP_QUERY = '(min-width: 1024px) and (hover: hover) and (pointer: fine)';
const ARCADE_TRIGGER_SELECTOR = '[data-enter-arcade], [data-arcade-desktop-only], [data-dock-action="arcade"]';

export function initRuntimeFixes() {
  const applyFixes = () => {
    installArcadeDesktopGate();
    installNimoArcadeAvailability();

    if (isArcadeDesktopAvailable()) {
      installArcadeHomeRedesign();
      installArcadeOverlayRoot();
      installArcadeEscapeController();
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyFixes, { once: true });
  } else {
    applyFixes();
  }
}

function isArcadeDesktopAvailable() {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
  return window.matchMedia(ARCADE_DESKTOP_QUERY).matches;
}

function installArcadeDesktopGate() {
  if (window.__arcadeDesktopGateInstalled) return;
  window.__arcadeDesktopGateInstalled = true;
  window.isDesktopArcadeAvailable = isArcadeDesktopAvailable;
  window.showArcadeDesktopNotice = showArcadeDesktopNotice;

  installArcadeDesktopStyles();
  guardArcadeExperienceController();

  const applyDeviceState = () => {
    const available = isArcadeDesktopAvailable();
    document.body.classList.toggle('arcade-mobile-disabled', !available);
    document.documentElement.dataset.arcadeAvailable = available ? 'true' : 'false';

    document.querySelectorAll(ARCADE_TRIGGER_SELECTOR).forEach(trigger => {
      if (!trigger.dataset.arcadeOriginalTitle) {
        trigger.dataset.arcadeOriginalTitle = trigger.getAttribute('title') || '';
      }

      trigger.classList.toggle('arcade-desktop-disabled', !available);
      if (!available) {
        trigger.setAttribute('aria-disabled', 'true');
        trigger.setAttribute('title', 'ArcadeOS is available on desktop and laptop only');
      } else {
        trigger.removeAttribute('aria-disabled');
        const originalTitle = trigger.dataset.arcadeOriginalTitle;
        if (originalTitle) trigger.setAttribute('title', originalTitle);
        else trigger.removeAttribute('title');
      }
    });

    syncMobileCabinetNotice(available);

    if (!available && document.body.classList.contains('arcade-active')) {
      window.ArcadeExperience?.exitArcadeExperience?.('device-gate', 'main-content');
    }
  };

  const blockUnsupportedEntry = event => {
    const trigger = event.target?.closest?.(ARCADE_TRIGGER_SELECTOR);
    if (!trigger || isArcadeDesktopAvailable()) return;

    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    showArcadeDesktopNotice();
  };

  document.addEventListener('click', blockUnsupportedEntry, { capture: true });
  document.addEventListener('keydown', event => {
    if (!['Enter', ' '].includes(event.key)) return;
    blockUnsupportedEntry(event);
  }, { capture: true });

  const media = window.matchMedia(ARCADE_DESKTOP_QUERY);
  media.addEventListener?.('change', applyDeviceState);

  let resizeTimer = 0;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(applyDeviceState, 120);
  }, { passive: true });

  window.addEventListener('pagehide', () => {
    media.removeEventListener?.('change', applyDeviceState);
    clearTimeout(resizeTimer);
  }, { once: true });

  applyDeviceState();
}

function guardArcadeExperienceController() {
  const experience = window.ArcadeExperience;
  if (!experience || experience.__desktopOnlyGuarded) return;

  const originalEnter = experience.enterArcadeExperience.bind(experience);
  experience.enterArcadeExperience = (...args) => {
    if (!isArcadeDesktopAvailable()) {
      showArcadeDesktopNotice();
      return Promise.resolve(false);
    }
    return originalEnter(...args);
  };
  experience.__desktopOnlyGuarded = true;
}

function syncMobileCabinetNotice(available) {
  const chassis = document.querySelector('.cabinet-chassis');
  if (!chassis) return;

  let notice = chassis.querySelector('[data-arcade-mobile-lock]');
  if (!notice) {
    notice = document.createElement('div');
    notice.className = 'arcade-mobile-lock-card';
    notice.dataset.arcadeMobileLock = '';
    notice.setAttribute('role', 'note');
    notice.innerHTML = `
      <strong>ARCADEOS // DESKTOP EXPERIENCE</strong>
      <span>Open this portfolio on a desktop or laptop for the full cabinet, games, audio, and controls.</span>
    `;
    chassis.appendChild(notice);
  }
  notice.hidden = available;
}

function showArcadeDesktopNotice() {
  document.querySelector('[data-arcade-desktop-toast]')?.remove();

  const toast = document.createElement('div');
  toast.className = 'arcade-desktop-toast';
  toast.dataset.arcadeDesktopToast = '';
  toast.setAttribute('role', 'status');
  toast.setAttribute('aria-live', 'polite');
  toast.innerHTML = `
    <strong>ArcadeOS is desktop-only</strong>
    <span>Use a desktop or laptop window at least 1024px wide to experience the cabinet, games, sound, and full controls.</span>
  `;
  document.body.appendChild(toast);

  requestAnimationFrame(() => toast.classList.add('is-visible'));
  window.setTimeout(() => {
    toast.classList.remove('is-visible');
    window.setTimeout(() => toast.remove(), 240);
  }, 4200);
}

function installArcadeDesktopStyles() {
  if (document.getElementById('arcade-desktop-only-styles')) return;

  const style = document.createElement('style');
  style.id = 'arcade-desktop-only-styles';
  style.textContent = `
    body.arcade-mobile-disabled ${ARCADE_TRIGGER_SELECTOR} {
      cursor: not-allowed !important;
      opacity: 0.58 !important;
      filter: saturate(0.55);
    }

    body.arcade-mobile-disabled [data-enter-arcade]:not(.dock-item)::after,
    body.arcade-mobile-disabled [data-arcade-desktop-only]:not(.dock-item)::after {
      content: 'DESKTOP ONLY';
      display: inline-flex;
      margin-left: 8px;
      padding: 3px 6px;
      border: 1px solid currentColor;
      border-radius: 3px;
      font: 700 0.58rem/1 'JetBrains Mono', monospace;
      letter-spacing: 0.08em;
      vertical-align: middle;
    }

    .arcade-mobile-lock-card {
      position: absolute;
      left: 50%;
      top: 50%;
      z-index: 5000;
      width: min(82%, 320px);
      display: none;
      transform: translate(-50%, -50%);
      padding: 18px;
      border: 1px solid rgba(103, 232, 249, 0.42);
      border-radius: 10px;
      background: rgba(3, 8, 18, 0.92);
      box-shadow: 0 18px 50px rgba(0, 0, 0, 0.72), inset 0 0 24px rgba(34, 211, 238, 0.08);
      color: #e6fbff;
      text-align: center;
      pointer-events: none;
      backdrop-filter: blur(16px);
    }

    body.arcade-mobile-disabled .arcade-mobile-lock-card:not([hidden]) {
      display: grid;
      gap: 9px;
    }

    .arcade-mobile-lock-card strong {
      color: #67e8f9;
      font: 800 0.72rem/1.3 'JetBrains Mono', monospace;
      letter-spacing: 0.1em;
    }

    .arcade-mobile-lock-card span {
      color: rgba(230, 251, 255, 0.76);
      font: 500 0.76rem/1.55 Inter, sans-serif;
    }

    .arcade-desktop-toast {
      position: fixed;
      left: 50%;
      bottom: max(24px, env(safe-area-inset-bottom));
      z-index: 30000;
      width: min(calc(100vw - 32px), 470px);
      display: grid;
      gap: 6px;
      transform: translate(-50%, 18px);
      opacity: 0;
      padding: 16px 18px;
      border: 1px solid rgba(103, 232, 249, 0.38);
      border-radius: 10px;
      background: rgba(7, 12, 24, 0.96);
      color: #eefcff;
      box-shadow: 0 18px 50px rgba(0, 0, 0, 0.62);
      transition: opacity 220ms ease, transform 220ms ease;
      backdrop-filter: blur(18px);
    }

    .arcade-desktop-toast.is-visible {
      opacity: 1;
      transform: translate(-50%, 0);
    }

    .arcade-desktop-toast strong {
      color: #67e8f9;
      font: 800 0.78rem/1.2 'JetBrains Mono', monospace;
      letter-spacing: 0.06em;
      text-transform: uppercase;
    }

    .arcade-desktop-toast span {
      color: rgba(238, 252, 255, 0.78);
      font: 500 0.82rem/1.5 Inter, sans-serif;
    }
  `;
  document.head.appendChild(style);
}

function installNimoArcadeAvailability() {
  if (window.__nimoArcadeDeviceAwarenessInstalled) return;
  window.__nimoArcadeDeviceAwarenessInstalled = true;

  const availabilityPattern = /(where\s+(is|can i find)\s+(the\s+)?arcade|where.*arcade|arcade.*where|arcade\s+(kaha|kahan|kidhar)|arcade.*(available|access)|how.*(open|access).*arcade|can.*(open|play).*arcade|why.*arcade.*(not|nahi)|arcade.*mobile|arcade.*phone)/i;
  const launchPattern = /((open|launch|enter|play|start)\s+(the\s+)?arcade|arcade\s+(kholo|chalao|open|launch)|play\s+games)/i;

  document.addEventListener('submit', event => {
    const form = event.target?.closest?.('#nimo-input-form');
    if (!form) return;

    const input = form.querySelector('#nimo-input');
    const text = input?.value?.trim() || '';
    const asksAvailability = availabilityPattern.test(text);
    const unsupportedLaunch = !isArcadeDesktopAvailable() && launchPattern.test(text);
    if (!asksAvailability && !unsupportedLaunch) return;

    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    if (input) input.value = '';

    renderNimoArcadeDeviceReply(text, true);
  }, { capture: true });

  document.addEventListener('click', event => {
    if (isArcadeDesktopAvailable()) return;
    const control = event.target?.closest?.('.nimo-action-btn, .nimo-chip');
    if (!control || !/arcade|आर्केड/i.test(control.textContent || '')) return;

    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    renderNimoArcadeDeviceReply(control.textContent || 'Open Arcade', false);
  }, { capture: true });
}

function renderNimoArcadeDeviceReply(userText, includeUserMessage) {
  const messages = document.getElementById('nimo-messages');
  if (!messages) {
    showArcadeDesktopNotice();
    return;
  }

  const normalized = String(userText || '').toLowerCase();
  const isHindi = /[\u0900-\u097f]/.test(userText || '');
  const isHinglish = !isHindi && /(kaha|kahan|kidhar|kholo|chalao|nahi|kyu|kaise|bhai)/i.test(normalized);
  const available = isArcadeDesktopAvailable();

  let reply;
  if (isHindi) {
    reply = available
      ? 'ArcadeOS इसी पोर्टफोलियो के कस्टम कैबिनेट में उपलब्ध है। पूरा अनुभव डेस्कटॉप या लैपटॉप के लिए डिज़ाइन किया गया है—Enter Arcade बटन या Arcade dock icon इस्तेमाल करें।'
      : 'ArcadeOS मोबाइल और टैबलेट पर जानबूझकर बंद रखा गया है। पूरा कैबिनेट, गेम्स, ऑडियो और कंट्रोल अनुभव आप डेस्कटॉप या लैपटॉप पर देख सकते हैं।';
  } else if (isHinglish) {
    reply = available
      ? 'ArcadeOS isi portfolio ke custom cabinet mein hai. Full experience desktop ya laptop ke liye designed hai—Enter Arcade button ya Arcade dock icon use karo.'
      : 'ArcadeOS mobile aur tablet par intentionally disabled hai. Full cabinet, games, audio aur controls ka experience desktop ya laptop par available hai.';
  } else {
    reply = available
      ? 'ArcadeOS is inside the custom cabinet on this portfolio. The full experience is designed for desktop and laptop—use the Enter Arcade button or the Arcade dock icon.'
      : 'ArcadeOS is intentionally disabled on mobile and tablet. You can experience the full cabinet, games, audio, and controls on a desktop or laptop.';
  }

  if (includeUserMessage) appendNimoMessage(messages, 'user', userText);
  appendNimoMessage(messages, 'assistant', reply, available);
  persistNimoMessage(includeUserMessage ? { role: 'user', text: userText } : null, { role: 'assistant', text: reply });
  messages.scrollTop = messages.scrollHeight;

  if (!available) showArcadeDesktopNotice();
}

function appendNimoMessage(container, role, text, includeArcadeAction = false) {
  const bubble = document.createElement('div');
  bubble.className = `nimo-msg nimo-msg-${role}`;
  const content = document.createElement('div');
  content.className = 'nimo-msg-content';
  content.textContent = text;
  bubble.appendChild(content);

  if (role === 'assistant' && includeArcadeAction) {
    const actions = document.createElement('div');
    actions.className = 'nimo-msg-actions';
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'nimo-action-btn';
    button.textContent = 'Open Arcade';
    button.dataset.enterArcade = '';
    button.addEventListener('click', () => window.enterArcade?.());
    actions.appendChild(button);
    bubble.appendChild(actions);
  }

  container.appendChild(bubble);
}

function persistNimoMessage(userEntry, assistantEntry) {
  try {
    const history = JSON.parse(sessionStorage.getItem('nimo_history') || '[]');
    if (userEntry) history.push(userEntry);
    history.push(assistantEntry);
    while (history.length > 20) history.shift();
    sessionStorage.setItem('nimo_history', JSON.stringify(history));
  } catch (_) {
    // NIMO remains usable even when storage is unavailable.
  }
}

function installArcadeHomeRedesign() {
  const home = document.getElementById('arcade-home');
  if (home) {
    home.classList.add('arcade-cinematic-v5');
    const oldBrand = home.querySelector('.arcade-cinematic-brand-v2');
    if (oldBrand) oldBrand.remove();
  }
}

function ensureArcadeSystemOverlayRoot() {
  const appView = document.getElementById('arcade-app-view');
  if (!appView) return null;

  let root = document.getElementById('arcade-system-overlay-root');
  if (!root || root.parentElement !== appView) {
    root?.remove();
    root = document.createElement('div');
    root.id = 'arcade-system-overlay-root';
    root.setAttribute('aria-live', 'polite');
    appView.appendChild(root);
  }
  return root;
}

function installArcadeOverlayRoot() {
  if (!document.getElementById('arcade-runtime-overlay-safety')) {
    const style = document.createElement('style');
    style.id = 'arcade-runtime-overlay-safety';
    style.textContent = `
      #arcade-app-view { position: relative; }
      #arcade-system-overlay-root {
        position: absolute;
        inset: 0;
        z-index: 120;
        pointer-events: none;
        overflow: hidden;
      }
      #arcade-system-overlay-root > * { pointer-events: auto; }
      #arcade-system-overlay-root .arcade-outcome-overlay {
        position: absolute !important;
        inset: 0 !important;
        z-index: 121 !important;
        display: flex !important;
        visibility: visible !important;
        opacity: 1 !important;
      }
    `;
    document.head.appendChild(style);
  }

  ensureArcadeSystemOverlayRoot();

  const observer = new MutationObserver(() => {
    if (!document.getElementById('arcade-app-view')) return;
    if (!document.getElementById('arcade-system-overlay-root')) {
      queueMicrotask(ensureArcadeSystemOverlayRoot);
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });
  window.addEventListener('pagehide', () => observer.disconnect(), { once: true });
}

function installArcadeEscapeController() {
  if (window.__arcadeEscapeControllerInstalled) return;
  window.__arcadeEscapeControllerInstalled = true;
  window.ArcadePauseMenu = ArcadePauseMenu;

  document.addEventListener('keydown', event => {
    if (event.key !== 'Escape') return;
    const arcade = window.ArcadeOS;
    if (!arcade || arcade.state !== 'APP') return;

    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();

    const outcome = document.getElementById('arcade-outcome-overlay');
    if (outcome) {
      outcome.querySelector('[data-arcade-focusable], button')?.focus({ preventScroll: true });
      return;
    }

    ensureArcadeSystemOverlayRoot();
    ArcadePauseMenu.toggle(arcade.activeApp);
  }, { capture: true });
}
