// Shared Arcade audio engine facade.
// The classic arcade-os.js script owns the live singleton; this module exposes
// the same object to lazy-loaded system routes and tests.

const fallbackStorage = {
  KEYS: { SETTINGS: 'arcade_machine_settings' },
  get(key, fallback = null) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (_) {
      return fallback;
    }
  },
  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (_) {}
  }
};

function createFallbackAudio() {
  return {
    ctx: null,
    masterGain: null,
    activeNodes: new Set(),
    previewNodes: new Set(),
    profileId: 'minimal',
    masterVolume: 0.5,
    muted: true,
    unsupported: true,
    initFromGesture() { return false; },
    setProfile(profileId) { this.profileId = profileId || 'minimal'; },
    getProfile() { return this.profileId; },
    setMasterVolume(value) { this.masterVolume = Math.max(0, Math.min(1, Number(value) || 0)); },
    setMuted(value) { this.muted = !!value; },
    play() {},
    preview() {},
    stopPreview() {},
    suspend() {},
    resume() {},
    destroyTemporaryNodes() {}
  };
}

export const ArcadeAudio = window.ArcadeAudio || createFallbackAudio();
export const ArcadeAudioStorage = window.ArcadeStorage || fallbackStorage;

if (!window.ArcadeAudio) {
  window.ArcadeAudio = ArcadeAudio;
}

export default ArcadeAudio;
