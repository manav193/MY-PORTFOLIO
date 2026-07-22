// Unified ArcadeOS System UI Input & Focus Controller (Phase 4B)
// Coordinates focus states, keyboard/cabinet mappings, sliders, modals, and text inputs

export const ArcadeSystemUI = {
  initialized: false,
  rootElement: null,
  currentRoute: "",
  focusableElements: [],
  selectedIndex: -1,
  editingElement: null,
  previousFocusElement: null,
  
  init() {
    if (this.initialized) return;
    this.initialized = true;
    
    this.registerSystemListeners();

    // Direct mouse/pointer moves sync visual focus ring
    document.addEventListener('pointerdown', (e) => {
      // If clicking inside screen, check if we clicked a focusable item
      const focusable = e.target.closest('[data-arcade-focusable]');
      if (focusable && this.focusableElements.includes(focusable)) {
        this.setFocus(focusable);
      }
    }, { capture: true });

    // Text inputs real keyboard typing interceptor
    document.addEventListener('keydown', (e) => {
      if (this.editingElement) {
        // If in editing mode, allow text keys to pass through normally
        if (e.key === 'Enter') {
          e.preventDefault();
          this.clearEditingMode();
        } else if (e.key === 'Escape' || e.key === 'Backspace' && this.editingElement.value === '') {
          e.preventDefault();
          this.clearEditingMode();
        }
        // Let other keyboard events type natively
        e.stopPropagation();
      }
    }, { capture: true });
    
    // Monitor modal open/close to trigger focus refreshes
    const observer = new MutationObserver(() => {
      const modal = document.getElementById('arcade-confirm-modal');
      if (modal) {
        const isActive = modal.classList.contains('active');
        if (isActive && !this.previousFocusElement) {
          // Store previous focused element before trapping focus
          this.previousFocusElement = this.getFocusedElement();
          this.refreshFocusableElements();
          this.focusFirst();
        } else if (!isActive && this.previousFocusElement) {
          // Restore focus
          const toRestore = this.previousFocusElement;
          this.previousFocusElement = null;
          this.refreshFocusableElements();
          if (toRestore && this.focusableElements.includes(toRestore)) {
            this.setFocus(toRestore);
          } else {
            this.focusFirst();
          }
        }
      }
    });
    
    // Start observer after DOM binds
    setTimeout(() => {
      const modal = document.getElementById('arcade-confirm-modal');
      if (modal) {
        observer.observe(modal, { attributes: true, attributeFilter: ['class'] });
      } else {
        // Watch body in case modal is dynamically appended
        observer.observe(document.body, { childList: true, subtree: true });
      }
    }, 500);
  },

  registerSystemListeners() {
    if (window.ArcadeEventBus) {
      // Remove any existing ones to prevent double listening
      if (this._boundMoveUp) {
        window.ArcadeEventBus.off('ARCADE_UP', this._boundMoveUp);
        window.ArcadeEventBus.off('ARCADE_DOWN', this._boundMoveDown);
        window.ArcadeEventBus.off('ARCADE_LEFT', this._boundMoveLeft);
        window.ArcadeEventBus.off('ARCADE_RIGHT', this._boundMoveRight);
        window.ArcadeEventBus.off('ARCADE_CONFIRM', this._boundActivate);
        window.ArcadeEventBus.off('ARCADE_BACK', this._boundBack);
      }

      this._boundMoveUp = () => this.move('up');
      this._boundMoveDown = () => this.move('down');
      this._boundMoveLeft = () => this.move('left');
      this._boundMoveRight = () => this.move('right');
      this._boundActivate = () => this.activate();
      this._boundBack = () => this.back();

      const coreOwner = { owner: 'core', ownerId: 'system-ui' };
      window.ArcadeEventBus.on('ARCADE_UP', this._boundMoveUp, coreOwner);
      window.ArcadeEventBus.on('ARCADE_DOWN', this._boundMoveDown, coreOwner);
      window.ArcadeEventBus.on('ARCADE_LEFT', this._boundMoveLeft, coreOwner);
      window.ArcadeEventBus.on('ARCADE_RIGHT', this._boundMoveRight, coreOwner);
      window.ArcadeEventBus.on('ARCADE_CONFIRM', this._boundActivate, coreOwner);
      window.ArcadeEventBus.on('ARCADE_BACK', this._boundBack, coreOwner);
    }
  },

  mountRoute(route, root) {
    if (!root) return;
    this.currentRoute = route;
    this.rootElement = root;
    this.editingElement = null;
    this.previousFocusElement = null;
    
    this.refreshFocusableElements();
    this.focusFirst();
  },

  unmountRoute() {
    this.clearFocusClass();
    this.rootElement = null;
    this.currentRoute = "";
    this.focusableElements = [];
    this.selectedIndex = -1;
    this.editingElement = null;
    this.previousFocusElement = null;
  },

  isPhysicsGameplayActive() {
    if (!window.ArcadeOS || window.ArcadeOS.state !== 'APP') return false;
    const activeApp = window.ArcadeOS.activeApp;
    if (!activeApp) return false;

    const rawApp = activeApp._rawApp || activeApp;
    const appState = rawApp.state || activeApp.state;

    // Check if actively in physics play (Snake or Breakout in PLAYING state)
    if (appState === 'PLAYING') {
      const focused = this.getFocusedElement();
      // If a menu overlay button is explicitly focused inside app view, UI has priority
      if (focused && focused.closest('.snake-menu-paused, .snake-menu-gameover, .breakout-menu-paused, .breakout-menu-gameover')) {
        return false;
      }
      return true;
    }

    return false;
  },

  refreshFocusableElements() {
    const appView = document.getElementById('arcade-app-view');
    const homeView = document.getElementById('arcade-home');
    const modal = document.getElementById('arcade-confirm-modal');
    const diffModal = document.getElementById('builder-import-diff-modal');

    let container = document.body;

    if (modal && modal.classList.contains('active')) {
      container = modal;
    } else if (diffModal && diffModal.classList.contains('active')) {
      container = diffModal;
    } else if (window.ArcadeOS && window.ArcadeOS.state === 'APP' && appView) {
      const overlayMenu = appView.querySelector(
        '.snake-menu-paused, .snake-menu-gameover, .snake-menu-ready, ' +
        '.breakout-menu-paused, .breakout-menu-gameover, .breakout-menu-ready, .breakout-menu-levelclear, ' +
        '.rt-title-screen, .rt-error-screen, .pixelpad-app, .palette-app'
      );
      container = overlayMenu || appView;
    } else if (this.rootElement && this.rootElement.classList.contains('active')) {
      container = this.rootElement;
    } else if (homeView && homeView.classList.contains('active')) {
      container = homeView;
    } else if (appView && appView.classList.contains('active')) {
      container = appView;
    }

    let elements = Array.from(container.querySelectorAll('[data-arcade-focusable]'));

    if (elements.length === 0) {
      elements = Array.from(container.querySelectorAll('button, input, select, [tabindex="0"], a.btn'));
    }

    const filtered = elements.filter(el => {
      if (!el.isConnected) return false;
      if (el.disabled || el.classList.contains('disabled')) return false;
      const rect = el.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return false;
      const style = window.getComputedStyle(el);
      if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') return false;
      return true;
    });

    this.focusableElements = filtered;

    const currentFocused = this.getFocusedElement();
    if (currentFocused && currentFocused.isConnected && filtered.includes(currentFocused)) {
      this.selectedIndex = filtered.indexOf(currentFocused);
    } else if (filtered.length > 0) {
      this.selectedIndex = 0;
    } else {
      this.selectedIndex = -1;
    }
  },

  getFocusedElement() {
    if (this.selectedIndex >= 0 && this.selectedIndex < this.focusableElements.length) {
      const el = this.focusableElements[this.selectedIndex];
      if (el && el.isConnected) {
        return el;
      }
    }
    return null;
  },

  focusFirst() {
    if (this.focusableElements.length > 0) {
      this.setFocus(this.focusableElements[0]);
    }
  },

  setFocus(el) {
    this.clearFocusClass();
    if (!el || !el.isConnected) return;
    
    this.selectedIndex = this.focusableElements.indexOf(el);
    el.classList.add('is-ui-focused');
    
    try {
      el.focus({ preventScroll: true });
    } catch(e) {}
    
    let scrollParent = el.parentElement;
    while (scrollParent && scrollParent !== this.rootElement) {
      const style = window.getComputedStyle(scrollParent);
      const canScroll = scrollParent.scrollHeight > scrollParent.clientHeight
        && /(auto|scroll)/.test(style.overflowY);
      if (canScroll) break;
      scrollParent = scrollParent.parentElement;
    }

    if (scrollParent && scrollParent !== this.rootElement) {
      const elementRect = el.getBoundingClientRect();
      const parentRect = scrollParent.getBoundingClientRect();
      if (elementRect.top < parentRect.top) {
        scrollParent.scrollTop -= parentRect.top - elementRect.top;
      } else if (elementRect.bottom > parentRect.bottom) {
        scrollParent.scrollTop += elementRect.bottom - parentRect.bottom;
      }
    }
  },

  clearFocusClass() {
    document.querySelectorAll('.is-ui-focused').forEach(el => {
      el.classList.remove('is-ui-focused');
    });
  },

  findSpatialTarget(direction) {
    if (this.focusableElements.length === 0) return null;
    const current = this.getFocusedElement() || this.focusableElements[0];
    if (!current || !current.isConnected) return this.focusableElements[0];

    const explicitTargetId = current.getAttribute(`data-nav-${direction}`);
    if (explicitTargetId) {
      const hintTarget = document.getElementById(explicitTargetId) || document.querySelector(explicitTargetId);
      if (hintTarget && this.focusableElements.includes(hintTarget)) {
        return hintTarget;
      }
    }

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

    if (!bestCandidate) {
      const idx = this.focusableElements.indexOf(current);
      if (direction === 'down' || direction === 'right') {
        const next = (idx + 1) % this.focusableElements.length;
        bestCandidate = this.focusableElements[next];
      } else if (direction === 'up' || direction === 'left') {
        const prev = (idx - 1 + this.focusableElements.length) % this.focusableElements.length;
        bestCandidate = this.focusableElements[prev];
      }
    }

    return bestCandidate;
  },

  move(direction) {
    if (this.isPhysicsGameplayActive()) return;

    this.refreshFocusableElements();
    if (this.focusableElements.length === 0) return;

    const el = this.getFocusedElement();

    if (el && el.getAttribute('data-arcade-control') === 'range') {
      if (direction === 'left' || direction === 'right') {
        this.adjustSlider(el, direction);
        return;
      }
    }

    if (this.editingElement) return;

    const target = this.findSpatialTarget(direction);
    if (target) {
      this.setFocus(target);
    }
  },

  adjustSlider(el, direction) {
    const min = parseFloat(el.getAttribute('min') || '0');
    const max = parseFloat(el.getAttribute('max') || '1');
    const step = parseFloat(el.getAttribute('step') || '0.05');
    let val = parseFloat(el.value);
    
    if (direction === 'left') {
      val = Math.max(min, val - step);
    } else {
      val = Math.min(max, val + step);
    }
    
    el.value = val;
    
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  },

  activate() {
    if (this.isPhysicsGameplayActive()) return;

    this.refreshFocusableElements();
    const el = this.getFocusedElement();
    if (!el) return;

    const controlType = el.getAttribute('data-arcade-control');
    if (controlType === 'text') {
      this.setEditingMode(el);
      return;
    }

    el.click();

    setTimeout(() => this.refreshFocusableElements(), 100);
  },

  back() {
    const modal = document.getElementById('arcade-confirm-modal');
    if (modal && modal.classList.contains('active')) {
      const cancelBtn = modal.querySelector('#modal-cancel-btn') || modal.querySelector('#modal-ok-btn');
      if (cancelBtn) {
        cancelBtn.click();
      } else {
        modal.classList.remove('active');
        this.refreshFocusableElements();
        this.focusFirst();
      }
      return;
    }

    const diffModal = document.getElementById('builder-import-diff-modal');
    if (diffModal && diffModal.classList.contains('active')) {
      const cancelBtn = diffModal.querySelector('#import-cancel-btn');
      if (cancelBtn) {
        cancelBtn.click();
      } else {
        diffModal.remove();
        this.refreshFocusableElements();
        this.focusFirst();
      }
      return;
    }

    if (this.editingElement) {
      this.clearEditingMode();
      return;
    }

    if (window.ArcadeOS && window.ArcadeOS.state === 'APP') {
      const activeApp = window.ArcadeOS.activeApp;
      const rawApp = activeApp?._rawApp || activeApp;

      if (rawApp && typeof rawApp.pause === 'function' && rawApp.state === 'PLAYING') {
        rawApp.pause();
        this.refreshFocusableElements();
        this.focusFirst();
        return;
      }

      if (rawApp && typeof rawApp.resume === 'function' && rawApp.state === 'PAUSED') {
        rawApp.resume();
        this.refreshFocusableElements();
        return;
      }

      window.ArcadeOS.goHome();
      return;
    }

    if (window.ArcadeOS && window.ArcadeOS.state === 'CUSTOMIZE') {
      if (window.ArcadeCustomizer && window.ArcadeCustomizer.isDirty()) {
        if (window.ArcadeOS.checkUnsavedChanges(() => window.ArcadeOS.goHome())) {
          return;
        }
      }
    }

    if (window.ArcadeOS && window.ArcadeOS.state !== 'HOME') {
      window.ArcadeOS.goHome();
      return;
    }

    if (window.ArcadeOS && window.ArcadeOS.state === 'HOME') {
      return;
    }
  },

  setEditingMode(el) {
    this.editingElement = el;
    el.classList.add('editing-active');
    el.focus();
  },

  clearEditingMode() {
    if (this.editingElement) {
      this.editingElement.classList.remove('editing-active');
      this.editingElement.blur();
      this.editingElement = null;
    }
  }
};

// Auto initialize on load
if (typeof window !== 'undefined') {
  window.ArcadeSystemUI = ArcadeSystemUI;
}

export default ArcadeSystemUI;
