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

const os = fs.readFileSync(path.join(__dirname, 'js/arcade-os.js'), 'utf8');

assert(os.includes('window.ArcadeInput = ArcadeInput'), 'ArcadeInput is exposed for diagnostics/tests');
assert(os.includes('startGamepadPolling()'), 'ArcadeInput has startGamepadPolling API');
assert(os.includes('stopGamepadPolling()'), 'ArcadeInput has stopGamepadPolling API');
assert(os.includes('handleGamepadFrame(time'), 'ArcadeInput has handleGamepadFrame API');
assert(os.includes('getConnectedGamepads()'), 'ArcadeInput has getConnectedGamepads API');
assert((os.match(/gamepadRafId/g) || []).length >= 5, 'gamepad RAF id is single owner state');
assert(os.includes("pad.mapping === 'standard'"), 'only standard-mapped gamepads are controlled');
assert(os.includes('deadzone: 0.35'), 'left-stick deadzone is configured');
assert(os.includes("handleGamepadButton(pad, 0, 'ARCADE_CONFIRM', 'A')"), 'button 0 maps to confirm/A');
assert(os.includes("handleGamepadButton(pad, 1, 'ARCADE_BACK', 'B')"), 'button 1 maps to back/B');
assert(os.includes("handleGamepadButton(pad, 9, 'ARCADE_CONFIRM', 'START')"), 'button 9 maps to start/confirm');
assert(os.includes("handleGamepadButton(pad, 8, 'ARCADE_BACK', 'SELECT')"), 'button 8 maps to select/back');
assert(os.includes('previousGamepadState') && os.includes('wasPressed'), 'button mapping is edge-triggered');
assert(os.includes('directionRepeatDelay') && os.includes('directionRepeatRate'), 'direction repeat is throttled');
assert(os.includes('document.hidden') && os.includes('osVisible === false'), 'polling stops when hidden or arcade is offscreen');
assert(os.includes('ARCADE_GAMEPAD_UNMAPPED'), 'non-standard gamepads are detected as unmapped');

if (failures) {
  console.error(`test-arcade-gamepad failed with ${failures} failure(s).`);
  process.exit(1);
}
console.log('test-arcade-gamepad passed.');
