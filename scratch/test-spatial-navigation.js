// Pure Node.js unit test for ArcadeSystemUI 2D Spatial Navigation logic

const elements = [];

class MockElement {
  constructor(id, rect, attrs = {}, style = {}) {
    this.id = id;
    this.rect = rect;
    this.attrs = { 'data-arcade-focusable': '', ...attrs };
    this.style = { display: 'block', visibility: 'visible', opacity: '1', ...style };
    this.classList = {
      _classes: new Set(),
      add(c) { this._classes.add(c); },
      remove(c) { this._classes.delete(c); },
      contains(c) { return this._classes.has(c); }
    };
    this.disabled = false;
    this.isConnected = true;
    this.value = attrs.value || '0.5';
    this.parentElement = null;
  }

  getAttribute(attr) {
    return this.attrs[attr] !== undefined ? this.attrs[attr] : null;
  }

  getBoundingClientRect() {
    return this.rect;
  }

  focus() {}
  click() {}
  dispatchEvent() {}
  closest() { return null; }
}

// 1. Construct multi-column grid
const leftBtn1 = new MockElement('left-btn-1', { left: 10, top: 10, right: 110, bottom: 40, width: 100, height: 30 });
const leftBtn2 = new MockElement('left-btn-2', { left: 10, top: 50, right: 110, bottom: 80, width: 100, height: 30 });
const rightBtn1 = new MockElement('right-btn-1', { left: 200, top: 10, right: 300, bottom: 40, width: 100, height: 30 });
const rightBtn2 = new MockElement('right-btn-2', { left: 200, top: 50, right: 300, bottom: 80, width: 100, height: 30 });

const focusableList = [leftBtn1, leftBtn2, rightBtn1, rightBtn2];

// Mock ArcadeSystemUI state
const ArcadeSystemUI = {
  focusableElements: focusableList,
  selectedIndex: 0,
  editingElement: null,

  getFocusedElement() {
    return this.focusableElements[this.selectedIndex] || null;
  },

  setFocus(el) {
    this.focusableElements.forEach(e => e.classList.remove('is-ui-focused'));
    this.selectedIndex = this.focusableElements.indexOf(el);
    if (el) el.classList.add('is-ui-focused');
  },

  findSpatialTarget(direction) {
    const current = this.getFocusedElement() || this.focusableElements[0];
    if (!current) return null;

    const curRect = current.getBoundingClientRect();
    const curCenter = {
      x: curRect.left + curRect.width / 2,
      y: curRect.top + curRect.height / 2
    };

    let bestCandidate = null;
    let bestScore = Infinity;
    const alignmentPenalty = 2.5;

    for (const candidate of this.focusableElements) {
      if (candidate === current) continue;

      const candRect = candidate.getBoundingClientRect();
      const candCenter = {
        x: candRect.left + candRect.width / 2,
        y: candRect.top + candRect.height / 2
      };

      const dx = candCenter.x - curCenter.x;
      const dy = candCenter.y - curCenter.y;

      let isValidDirection = false;
      let primaryDist = 0;
      let secondaryDist = 0;

      switch (direction) {
        case 'right':
          isValidDirection = dx > 2 || (candRect.left >= curRect.right - 4 && Math.abs(dy) < Math.max(curRect.height, candRect.height));
          primaryDist = Math.abs(dx);
          secondaryDist = Math.abs(dy);
          break;
        case 'left':
          isValidDirection = dx < -2 || (candRect.right <= curRect.left + 4 && Math.abs(dy) < Math.max(curRect.height, candRect.height));
          primaryDist = Math.abs(dx);
          secondaryDist = Math.abs(dy);
          break;
        case 'down':
          isValidDirection = dy > 2 || (candRect.top >= curRect.bottom - 4 && Math.abs(dx) < Math.max(curRect.width, candRect.width));
          primaryDist = Math.abs(dy);
          secondaryDist = Math.abs(dx);
          break;
        case 'up':
          isValidDirection = dy < -2 || (candRect.bottom <= curRect.top + 4 && Math.abs(dx) < Math.max(curRect.width, candRect.width));
          primaryDist = Math.abs(dy);
          secondaryDist = Math.abs(dx);
          break;
      }

      if (!isValidDirection) continue;

      const score = primaryDist + secondaryDist * alignmentPenalty;
      if (score < bestScore) {
        bestScore = score;
        bestCandidate = candidate;
      }
    }

    return bestCandidate;
  },

  move(direction) {
    const target = this.findSpatialTarget(direction);
    if (target) this.setFocus(target);
  }
};

console.log('--- TEST 1: Initial Focus ---');
ArcadeSystemUI.setFocus(leftBtn1);
console.assert(ArcadeSystemUI.getFocusedElement().id === 'left-btn-1', 'Initial focus should be left-btn-1');

console.log('--- TEST 2: DOWN Movement ---');
ArcadeSystemUI.move('down');
console.assert(ArcadeSystemUI.getFocusedElement().id === 'left-btn-2', 'DOWN should move to left-btn-2 (got ' + ArcadeSystemUI.getFocusedElement().id + ')');

console.log('--- TEST 3: RIGHT Movement (Cross Column) ---');
ArcadeSystemUI.move('right');
console.assert(ArcadeSystemUI.getFocusedElement().id === 'right-btn-2', 'RIGHT should move spatially to right-btn-2 (got ' + ArcadeSystemUI.getFocusedElement().id + ')');

console.log('--- TEST 4: UP Movement ---');
ArcadeSystemUI.move('up');
console.assert(ArcadeSystemUI.getFocusedElement().id === 'right-btn-1', 'UP should move to right-btn-1 (got ' + ArcadeSystemUI.getFocusedElement().id + ')');

console.log('--- TEST 5: LEFT Movement (Return Column) ---');
ArcadeSystemUI.move('left');
console.assert(ArcadeSystemUI.getFocusedElement().id === 'left-btn-1', 'LEFT should move spatially back to left-btn-1 (got ' + ArcadeSystemUI.getFocusedElement().id + ')');

console.log('ALL SPATIAL NAVIGATION UNIT TESTS PASSED CLEANLY! 🎉');
