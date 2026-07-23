import { ArcadeAudio } from './arcade-audio.js';

const PROFILE_IDS = ['industrial', 'retroSoft', 'digitalClean', 'minimal', 'muted'];
const EVENT_IDS = ['boot', 'navigation', 'confirm', 'back', 'coin', 'achievement', 'warning', 'error'];

export const ArcadeSoundLab = {
  initialized: false,
  view: null,

  init() {
    this.initialized = true;
  },

  open(view) {
    this.view = view;
    this.render(view);
  },

  render(view) {
    const settings = window.ArcadeStorage?.get(window.ArcadeStorage.KEYS.SETTINGS) || {};
    const profile = ArcadeAudio.getProfile();
    const muted = !settings.soundEnabled;
    const volume = typeof settings.volume === 'number' ? settings.volume : 0.5;
    const sfxVolume = typeof settings.sfxVolume === 'number' ? settings.sfxVolume : ArcadeAudio.sfxVolume;
    const musicVolume = typeof settings.musicVolume === 'number' ? settings.musicVolume : ArcadeAudio.musicVolume;
    const reducedAudio = !!settings.reducedAudio;

    view.innerHTML = `
      <div class="sys-app soundlab-app">
        <div class="sys-header">
          <div>
            <h2>SOUNDLAB</h2>
            <p class="sys-subtitle">Locally generated synth cues. No audio files are downloaded.</p>
          </div>
          <button class="sys-back-btn" data-arcade-focusable data-arcade-action="back" id="soundlab-back-btn">BACK (ESC)</button>
        </div>

        <div class="soundlab-grid" aria-live="polite">
          <section class="soundlab-panel">
            <h3>Sound Profiles</h3>
            <div class="sound-profile-list">
              ${PROFILE_IDS.map(id => {
                const item = ArcadeAudio.profiles[id];
                const active = id === profile;
                return `
                  <button class="sound-profile-card ${active ? 'active' : ''}" data-profile-id="${id}" data-arcade-focusable aria-pressed="${active}">
                    <span>${item.label}</span>
                    <small>${active ? 'CURRENT PROFILE' : 'SELECT PROFILE'}</small>
                  </button>
                `;
              }).join('')}
            </div>
          </section>

          <section class="soundlab-panel">
            <h3>Preview Cues</h3>
            <div class="sound-preview-grid">
              ${EVENT_IDS.map(id => `
                <button class="sys-btn sound-preview-btn" data-preview-event="${id}" data-arcade-focusable aria-label="Preview ${id} sound">${id.toUpperCase()}</button>
              `).join('')}
            </div>
          </section>

          <section class="soundlab-panel soundlab-controls">
            <h3>Master Output</h3>
            <div class="setting-item">
              <label for="soundlab-volume">Volume</label>
              <input id="soundlab-volume" type="range" min="0" max="1" step="0.05" value="${volume}" data-arcade-focusable data-arcade-control="range" aria-valuetext="${Math.round(volume * 100)} percent">
              <span id="soundlab-volume-readout">${Math.round(volume * 100)}%</span>
            </div>
            <div class="setting-item">
              <label for="soundlab-sfx-volume">SFX</label>
              <input id="soundlab-sfx-volume" type="range" min="0" max="1" step="0.05" value="${sfxVolume}" data-arcade-focusable data-arcade-control="range" aria-valuetext="${Math.round(sfxVolume * 100)} percent">
              <span id="soundlab-sfx-readout">${Math.round(sfxVolume * 100)}%</span>
            </div>
            <div class="setting-item">
              <label for="soundlab-music-volume">Music</label>
              <input id="soundlab-music-volume" type="range" min="0" max="1" step="0.05" value="${musicVolume}" data-arcade-focusable data-arcade-control="range" aria-valuetext="${Math.round(musicVolume * 100)} percent">
              <span id="soundlab-music-readout">${Math.round(musicVolume * 100)}%</span>
            </div>
            <button class="sys-btn" id="soundlab-mute-btn" data-arcade-focusable aria-pressed="${muted}">${muted ? 'MASTER MUTED' : 'MASTER ENABLED'}</button>
            <button class="sys-btn" id="soundlab-reduced-btn" data-arcade-focusable aria-pressed="${reducedAudio}">${reducedAudio ? 'REDUCED AUDIO ON' : 'REDUCED AUDIO OFF'}</button>
            <button class="sys-btn danger-btn" id="soundlab-reset-btn" data-arcade-focusable>RESET SOUND PROFILE</button>
            <p class="soundlab-status" id="soundlab-status" aria-live="polite">Profile: ${ArcadeAudio.profiles[profile]?.label || profile}. Master mute is separate from the Muted profile.</p>
          </section>
        </div>
      </div>
    `;

    this.bind(view);
  },

  bind(view) {
    view.querySelector('#soundlab-back-btn')?.addEventListener('click', () => window.ArcadeOS.goHome());

    view.querySelectorAll('[data-profile-id]').forEach(button => {
      button.addEventListener('click', () => {
        ArcadeAudio.initFromGesture();
        ArcadeAudio.setProfile(button.dataset.profileId);
        ArcadeAudio.preview('confirm');
        this.render(view);
        this.refreshFocus();
      });
    });

    view.querySelectorAll('[data-preview-event]').forEach(button => {
      button.addEventListener('click', () => {
        ArcadeAudio.initFromGesture();
        ArcadeAudio.preview(button.dataset.previewEvent);
        this.setStatus(`Previewing ${button.dataset.previewEvent.toUpperCase()} cue.`);
      });
    });

    const volume = view.querySelector('#soundlab-volume');
    volume?.addEventListener('input', () => {
      ArcadeAudio.setMasterVolume(parseFloat(volume.value));
      const readout = view.querySelector('#soundlab-volume-readout');
      const pct = Math.round(parseFloat(volume.value) * 100);
      if (readout) readout.textContent = `${pct}%`;
      volume.setAttribute('aria-valuetext', `${pct} percent`);
      this.setStatus(`Master volume ${pct}%.`);
    });

    const bindChannelVolume = (id, readoutId, setter, label) => {
      const control = view.querySelector(id);
      control?.addEventListener('input', () => {
        const value = parseFloat(control.value);
        setter.call(ArcadeAudio, value);
        const pct = Math.round(value * 100);
        const readout = view.querySelector(readoutId);
        if (readout) readout.textContent = `${pct}%`;
        control.setAttribute('aria-valuetext', `${pct} percent`);
        this.setStatus(`${label} volume ${pct}%.`);
      });
    };
    bindChannelVolume('#soundlab-sfx-volume', '#soundlab-sfx-readout', ArcadeAudio.setSfxVolume, 'SFX');
    bindChannelVolume('#soundlab-music-volume', '#soundlab-music-readout', ArcadeAudio.setMusicVolume, 'Music');

    view.querySelector('#soundlab-mute-btn')?.addEventListener('click', () => {
      const settings = window.ArcadeStorage?.get(window.ArcadeStorage.KEYS.SETTINGS) || {};
      ArcadeAudio.setMuted(!!settings.soundEnabled);
      this.render(view);
      this.refreshFocus();
    });

    view.querySelector('#soundlab-reduced-btn')?.addEventListener('click', () => {
      const settings = window.ArcadeStorage?.get(window.ArcadeStorage.KEYS.SETTINGS) || {};
      settings.reducedAudio = !settings.reducedAudio;
      window.ArcadeStorage?.set(window.ArcadeStorage.KEYS.SETTINGS, settings);
      ArcadeAudio.reducedAudio = settings.reducedAudio;
      this.render(view);
      this.refreshFocus();
    });

    view.querySelector('#soundlab-reset-btn')?.addEventListener('click', () => {
      window.ArcadeOS.showConfirmModal('Reset sound profile to Industrial? Master mute and volume will be preserved.', () => {
        ArcadeAudio.stopPreview();
        ArcadeAudio.setProfile('industrial');
        this.render(view);
        this.refreshFocus();
      }, () => {});
    });
  },

  setStatus(message) {
    const status = this.view?.querySelector('#soundlab-status');
    if (status) status.textContent = message;
  },

  refreshFocus() {
    if (window.ArcadeSystemUI) {
      window.ArcadeSystemUI.mountRoute('SOUNDLAB', this.view);
      window.ArcadeSystemUI.refreshFocusableElements();
      window.ArcadeSystemUI.focusFirst();
    }
  },

  destroy() {
    ArcadeAudio.stopPreview();
    ArcadeAudio.destroyTemporaryNodes();
    this.view = null;
  }
};

if (typeof window !== 'undefined') {
  window.ArcadeSoundLab = ArcadeSoundLab;
}

export default ArcadeSoundLab;
