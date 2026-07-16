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
const diagnostics = fs.readFileSync(path.join(root, 'js/modules/arcade-diagnostics.js'), 'utf8');
const os = fs.readFileSync(path.join(root, 'js/arcade-os.js'), 'utf8');
const stats = fs.readFileSync(path.join(root, 'js/modules/arcade-stats.js'), 'utf8');
const achievements = fs.readFileSync(path.join(root, 'js/modules/arcade-achievements.js'), 'utf8');

assert(fs.existsSync(path.join(root, 'js/modules/arcade-diagnostics.js')), 'diagnostics module exists');
assert(diagnostics.includes('export const ArcadeDiagnostics'), 'diagnostics exports route engine');
['joystick', 'actionA', 'actionB', 'start', 'select', 'keyboard', 'touch', 'gamepad', 'audio', 'storage', 'serviceWorker', 'network', 'brightness', 'leds', 'coin', 'moduleLoader'].forEach(key => {
  assert(diagnostics.includes(key), `diagnostics includes ${key} panel`);
});
assert(diagnostics.includes("const STORAGE_TEST_KEY = 'arcade_diag_storage_test'"), 'diagnostics uses isolated storage key');
assert(!diagnostics.includes('arcade_machine_stats') && !diagnostics.includes('arcade_machine_achievements') && !diagnostics.includes('arcade_game_saves'), 'diagnostics does not touch protected storage domains');
assert(diagnostics.includes("diagnostic: true"), 'diagnostic events are flagged');
assert(!diagnostics.includes('recordCoinInsert') && !diagnostics.includes('insertCoin()'), 'coin diagnostic avoids real coin path');
assert(diagnostics.includes('restoreHardware()'), 'LED test restores hardware state');
assert(diagnostics.includes('uncontrolled-first-load') && diagnostics.includes('unsupported'), 'service worker status covers first-load and unsupported states');
assert(os.includes('DIAGNOSTICS') && os.includes("loader: () => import('./modules/arcade-diagnostics.js')"), 'DIAGNOSTICS is in system route manifest');
assert(stats.includes('data && data.diagnostic') && achievements.includes('payload && payload.diagnostic'), 'stats and achievements ignore diagnostic payloads');
assert(os.includes("String(event).startsWith('DIAGNOSTIC_')"), 'ArcadeOS achievement bridge ignores diagnostic events');

if (failures) {
  console.error(`test-arcade-diagnostics failed with ${failures} failure(s).`);
  process.exit(1);
}
console.log('test-arcade-diagnostics passed.');
