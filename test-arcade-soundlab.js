const fs = require('fs');
const path = require('path');

let failures = 0;
function assert(condition, message) {
  if (!condition) {
    console.error(`FAIL: ${message}`);
    failures++;
  } else {
    console.log(`PASS: ${message}`);
  }
}

const root = __dirname;
const os = fs.readFileSync(path.join(root, 'js/arcade-os.js'), 'utf8');
const audio = fs.readFileSync(path.join(root, 'js/modules/arcade-audio.js'), 'utf8');
const soundlab = fs.readFileSync(path.join(root, 'js/modules/arcade-soundlab.js'), 'utf8');
const build = fs.readFileSync(path.join(root, 'build.js'), 'utf8');

assert(fs.existsSync(path.join(root, 'js/modules/arcade-audio.js')), 'shared arcade audio module exists');
assert(os.includes('masterGain') && os.includes('initFromGesture()'), 'ArcadeAudio owns master gain and gesture init');
assert(os.includes('profiles:') && os.includes('industrial') && os.includes('retroSoft') && os.includes('digitalClean') && os.includes('minimal') && os.includes('muted'), 'five sound profiles are registered');
assert(os.includes('stopPreview()') && os.includes('destroyTemporaryNodes()'), 'preview and oscillator cleanup APIs exist');
assert(os.includes('this.ctx = new AudioContext()') && !/new AudioContext\(\)[\s\S]*new AudioContext\(\)/.test(os), 'single AudioContext creation site in arcade-os');
assert(audio.includes('export const ArcadeAudio'), 'audio module exports ArcadeAudio contract');
assert(soundlab.includes('export const ArcadeSoundLab'), 'SoundLab module exports route engine');
assert(soundlab.includes('data-profile-id') && soundlab.includes('data-preview-event'), 'SoundLab renders profile cards and preview controls');
assert(soundlab.includes('reducedAudio'), 'SoundLab exposes reduced audio setting');
assert(soundlab.includes('stopPreview') && soundlab.includes('destroyTemporaryNodes'), 'SoundLab cleanup stops previews and temporary nodes');
assert(os.includes('SOUNDLAB') && os.includes("loader: () => import('./modules/arcade-soundlab.js')"), 'SOUNDLAB is in system route manifest');
assert(build.includes('modules/arcade-audio.js') && build.includes('modules/arcade-soundlab.js'), 'build bundles audio and SoundLab modules');

if (failures) {
  console.error(`test-arcade-soundlab failed with ${failures} failure(s).`);
  process.exit(1);
}
console.log('test-arcade-soundlab passed.');
