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
const reset = fs.readFileSync(path.join(root, 'js/modules/arcade-reset-safety.js'), 'utf8');
const os = fs.readFileSync(path.join(root, 'js/arcade-os.js'), 'utf8');

assert(fs.existsSync(path.join(root, 'js/modules/arcade-reset-safety.js')), 'reset safety module exists');
assert(reset.includes('schemaVersion') && reset.includes('exportedAt') && reset.includes('domains'), 'backup schema has version, timestamp, and domains');
['settings', 'stats', 'achievements', 'profile', 'customization', 'saves'].forEach(domain => {
  assert(reset.includes(`${domain}: readJson`), `backup includes ${domain} domain`);
});
assert(reset.includes('256 * 1024'), 'backup export is bounded to 256 KB');
assert(reset.includes('URL.revokeObjectURL'), 'backup export revokes object URLs');
assert(reset.includes('resetSoundProfile') && reset.includes('clearSessionHistory') && reset.includes('resetAchievements') && reset.includes('resetAggregateStats') && reset.includes('resetPerGameRecords'), 'separate reset actions exist');
assert(reset.includes('Preserved: settings') || reset.includes('Preserved settings'), 'full reset documents preserved domains');
assert(!reset.includes('confirm(') && !reset.includes('alert(') && !reset.includes('prompt('), 'reset safety uses no native dialogs');
assert(os.includes('data-arcade-action="backup-export"'), 'settings exposes backup export action');
assert(os.includes('data-arcade-action="reset-sound-profile"'), 'settings exposes sound reset action');
assert(os.includes('data-arcade-action="reset-game-records"'), 'settings exposes per-game record reset');
assert(os.includes('data-arcade-action="reset-aggregate-stats"'), 'settings exposes aggregate stats reset');
assert(os.includes('data-arcade-action="full-machine-reset"'), 'settings exposes full machine reset');
assert(os.includes('loadResetSafetyEngine'), 'ArcadeOS lazy-loads reset safety engine');

if (failures) {
  console.error(`test-arcade-reset-safety failed with ${failures} failure(s).`);
  process.exit(1);
}
console.log('test-arcade-reset-safety passed.');
