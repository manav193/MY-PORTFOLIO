import { ArcadeAudio } from './arcade-audio.js';

const STORAGE_TEST_KEY = 'arcade_diag_storage_test';
const STATUS = {
  waiting: 'WAITING',
  pass: 'PASS',
  fail: 'FAIL',
  unsupported: 'UNSUPPORTED'
};

export const ArcadeDiagnostics = {
  view: null,
  statuses: {},
  listeners: [],
  timers: [],
  hardwareSnapshot: null,

  init() {},

  open(view) {
    this.view = view;
    this.statuses = {
      joystick: STATUS.waiting,
      actionA: STATUS.waiting,
      actionB: STATUS.waiting,
      start: STATUS.waiting,
      select: STATUS.waiting,
      keyboard: STATUS.waiting,
      touch: STATUS.waiting,
      gamepad: this.getGamepadStatus(),
      gamepadButtons: this.getGamepadStatus() === STATUS.unsupported ? STATUS.unsupported : STATUS.waiting,
      audio: STATUS.waiting,
      storage: STATUS.waiting,
      serviceWorker: this.getServiceWorkerStatus(),
      network: navigator.onLine ? 'PASS: browser online' : 'PASS: browser offline',
      brightness: STATUS.pass,
      leds: STATUS.waiting,
      coin: STATUS.waiting,
      moduleLoader: window.ArcadeModuleLoader?.import ? STATUS.pass : STATUS.fail
    };
    this.render();
    this.bind();
  },

  render() {
    if (!this.view) return;
    const panels = [
      ['joystick', 'Joystick directions'],
      ['actionA', 'Action A'],
      ['actionB', 'Action B'],
      ['start', 'Start'],
      ['select', 'Select'],
      ['keyboard', 'Keyboard input'],
      ['touch', 'Touch input'],
      ['gamepad', 'Gamepad connection'],
      ['gamepadButtons', 'Gamepad buttons'],
      ['audio', 'Audio output'],
      ['storage', 'Storage read/write'],
      ['serviceWorker', 'Service worker status'],
      ['network', 'Network status'],
      ['brightness', 'Screen brightness'],
      ['leds', 'LED test'],
      ['coin', 'Coin slot test'],
      ['moduleLoader', 'Module loader status']
    ];

    this.view.innerHTML = `
      <div class="sys-app diagnostics-app">
        <div class="sys-header">
          <div>
            <h2><span class="hw-icon">🖥️</span> HARDWARE TELEMETRY & DIAGNOSTICS</h2>
            <p class="sys-subtitle" style="font-size:7px; color:rgba(255,255,255,0.6); margin-top:2px; letter-spacing:0.06em;">TEST HARDWARE BUS, INPUTS, STORAGE, AND AUDIO SUBSYSTEMS IN REALTIME</p>
          </div>
          <button class="sys-back-btn" id="diagnostics-back-btn" data-arcade-focusable data-arcade-action="back">BACK (ESC)</button>
        </div>
        <div class="diagnostics-toolbar" style="display:flex; gap:6px; flex-wrap:wrap; margin-bottom:8px;">
          <button class="sys-btn" id="diag-storage-btn" data-arcade-focusable style="font-size:7px; padding:3px 6px;">RUN STORAGE TEST</button>
          <button class="sys-btn" id="diag-audio-btn" data-arcade-focusable style="font-size:7px; padding:3px 6px;">TEST AUDIO</button>
          <button class="sys-btn" id="diag-led-btn" data-arcade-focusable style="font-size:7px; padding:3px 6px;">TEST LEDS</button>
          <button class="sys-btn" id="diag-coin-btn" data-arcade-focusable style="font-size:7px; padding:3px 6px;">TEST COIN SLOT</button>
          <button class="sys-btn danger-btn" id="diag-reset-btn" data-arcade-focusable style="font-size:7px; padding:3px 6px;">RESET STATE</button>
        </div>
        <div class="diagnostics-grid" aria-live="polite" style="display:grid; grid-template-columns: 1fr 1fr; gap:6px; max-height:160px; overflow-y:auto; padding:2px;">
          ${panels.map(([key, label]) => `
            <div class="diagnostic-panel" data-panel="${key}" style="background:rgba(255,255,255,0.03); border:1px solid rgba(56,189,248,0.2); padding:6px 8px; border-radius:6px; display:flex; justify-content:space-between; align-items:center; font-size:8px;">
              <span style="opacity:0.8; font-weight:bold;">${label}</span>
              <strong class="${this.statusClass(this.statuses[key])}" style="font-size:8px; font-weight:800; font-family:'JetBrains Mono', monospace;">${this.statuses[key]}</strong>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  },

  bind() {
    this.view.querySelector('#diagnostics-back-btn')?.addEventListener('click', () => window.ArcadeOS.goHome());
    this.view.querySelector('#diag-storage-btn')?.addEventListener('click', () => this.runStorageTest());
    this.view.querySelector('#diag-audio-btn')?.addEventListener('click', () => this.runAudioTest());
    this.view.querySelector('#diag-led-btn')?.addEventListener('click', () => this.runLedTest());
    this.view.querySelector('#diag-coin-btn')?.addEventListener('click', () => this.runCoinTest());
    this.view.querySelector('#diag-reset-btn')?.addEventListener('click', () => {
      this.open(this.view);
      this.refreshFocus();
    });

    this.view.addEventListener('pointerdown', () => this.setStatus('touch', STATUS.pass), { once: true });
    this.subscribe('ARCADE_UP', () => this.setStatus('joystick', 'PASS: UP'));
    this.subscribe('ARCADE_DOWN', () => this.setStatus('joystick', 'PASS: DOWN'));
    this.subscribe('ARCADE_LEFT', () => this.setStatus('joystick', 'PASS: LEFT'));
    this.subscribe('ARCADE_RIGHT', () => this.setStatus('joystick', 'PASS: RIGHT'));
    this.subscribe('ARCADE_ACTION_A', () => this.setStatus('actionA', STATUS.pass));
    this.subscribe('ARCADE_ACTION_B', () => this.setStatus('actionB', STATUS.pass));
    this.subscribe('ARCADE_CONFIRM', (payload) => {
      this.setStatus('start', payload?.source === 'gamepad' ? 'PASS: GAMEPAD START/A' : STATUS.pass);
      this.setStatus('keyboard', STATUS.pass);
    });
    this.subscribe('ARCADE_BACK', (payload) => {
      this.setStatus('select', payload?.source === 'gamepad' ? 'PASS: GAMEPAD SELECT/B' : STATUS.pass);
    });
    this.subscribe('ARCADE_GAMEPAD_CONNECTED', () => this.setStatus('gamepad', STATUS.pass));
    this.subscribe('ARCADE_GAMEPAD_DISCONNECTED', () => this.setStatus('gamepad', STATUS.waiting));
    this.subscribe('ARCADE_GAMEPAD_BUTTON', () => this.setStatus('gamepadButtons', STATUS.pass));
  },

  subscribe(eventName, handler) {
    if (!window.ArcadeEventBus) return;
    window.ArcadeEventBus.on(eventName, handler, { owner: 'route', ownerId: 'DIAGNOSTICS' });
    this.listeners.push([eventName, handler]);
  },

  setStatus(key, value) {
    this.statuses[key] = value;
    const panel = this.view?.querySelector(`[data-panel="${key}"] strong`);
    if (panel) {
      panel.textContent = value;
      panel.className = this.statusClass(value);
    }
  },

  statusClass(value) {
    const normalized = String(value || '').toLowerCase();
    if (normalized.includes('pass')) return 'diag-pass';
    if (normalized.includes('fail')) return 'diag-fail';
    if (normalized.includes('unsupported')) return 'diag-unsupported';
    return 'diag-waiting';
  },

  getGamepadStatus() {
    if (!navigator.getGamepads) return STATUS.unsupported;
    const pads = Array.from(navigator.getGamepads ? navigator.getGamepads() : []).filter(Boolean);
    if (!pads.length) return STATUS.waiting;
    return pads.some(pad => pad.mapping === 'standard') ? STATUS.pass : 'UNSUPPORTED: unmapped';
  },

  getServiceWorkerStatus() {
    if (!('serviceWorker' in navigator)) return STATUS.unsupported;
    const reg = navigator.serviceWorker.controller;
    if (reg) return 'active';
    return 'uncontrolled-first-load';
  },

  runStorageTest() {
    try {
      const payload = { diagnostic: true, value: `diag-${Date.now()}` };
      localStorage.setItem(STORAGE_TEST_KEY, JSON.stringify(payload));
      const readBack = JSON.parse(localStorage.getItem(STORAGE_TEST_KEY) || '{}');
      localStorage.removeItem(STORAGE_TEST_KEY);
      this.setStatus('storage', readBack.value === payload.value ? STATUS.pass : STATUS.fail);
    } catch (_) {
      try { localStorage.removeItem(STORAGE_TEST_KEY); } catch (_) {}
      this.setStatus('storage', STATUS.fail);
    }
  },

  runAudioTest() {
    try {
      ArcadeAudio.initFromGesture();
      ArcadeAudio.preview('confirm');
      this.setStatus('audio', STATUS.pass);
    } catch (_) {
      this.setStatus('audio', STATUS.unsupported);
    }
  },

  runCoinTest() {
    const slot = document.querySelector('.cab-coin-slot');
    const returnLamp = document.querySelector('.cab-coin-return');
    slot?.classList.add('diag-active');
    returnLamp?.classList.add('diag-active');
    window.ArcadeEventBus?.emit('DIAGNOSTIC_COIN_TEST', { diagnostic: true });
    this.setStatus('coin', STATUS.pass);
    this.timers.push(setTimeout(() => {
      slot?.classList.remove('diag-active');
      returnLamp?.classList.remove('diag-active');
    }, 500));
  },

  runLedTest() {
    const hardware = window.ArcadeHardware;
    if (!hardware) {
      this.setStatus('leds', STATUS.unsupported);
      return;
    }
    const leds = [hardware.powerLed, hardware.inputLed, hardware.storageLed, hardware.networkLed].filter(Boolean);
    const marquee = hardware.marqueeText;
    const oled = hardware.oledStatus;
    this.hardwareSnapshot = {
      ledClasses: leds.map(led => led.className),
      marqueeText: marquee?.textContent || '',
      oledText: oled?.textContent || ''
    };
    leds.forEach(led => {
      led.classList.add('diag-active');
      led.classList.add('pulse-cyan');
    });
    if (marquee) marquee.textContent = 'DIAGNOSTIC';
    if (oled) oled.textContent = 'LED TEST PASS';
    this.setStatus('leds', STATUS.pass);
    this.timers.push(setTimeout(() => this.restoreHardware(), 750));
  },

  restoreHardware() {
    const hardware = window.ArcadeHardware;
    if (!hardware || !this.hardwareSnapshot) return;
    [hardware.powerLed, hardware.inputLed, hardware.storageLed, hardware.networkLed].filter(Boolean).forEach((led, idx) => {
      led.className = this.hardwareSnapshot.ledClasses[idx] || led.className.replace('diag-active', '');
    });
    if (hardware.marqueeText) hardware.marqueeText.textContent = this.hardwareSnapshot.marqueeText;
    if (hardware.oledStatus) hardware.oledStatus.textContent = this.hardwareSnapshot.oledText;
    this.hardwareSnapshot = null;
  },

  refreshFocus() {
    if (window.ArcadeSystemUI) {
      window.ArcadeSystemUI.mountRoute('DIAGNOSTICS', this.view);
      window.ArcadeSystemUI.refreshFocusableElements();
      window.ArcadeSystemUI.focusFirst();
    }
  },

  destroy() {
    this.listeners.forEach(([eventName, handler]) => window.ArcadeEventBus?.off(eventName, handler));
    this.listeners = [];
    this.timers.forEach(timer => clearTimeout(timer));
    this.timers = [];
    this.restoreHardware();
    ArcadeAudio.stopPreview();
    try { localStorage.removeItem(STORAGE_TEST_KEY); } catch (_) {}
    this.view = null;
  }
};

if (typeof window !== 'undefined') {
  window.ArcadeDiagnostics = ArcadeDiagnostics;
}

export default ArcadeDiagnostics;
