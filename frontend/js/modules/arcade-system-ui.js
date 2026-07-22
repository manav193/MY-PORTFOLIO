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

  refreshFocusableElements() {
    if (!this.rootElement) return;
    
    // Check if virtual confirmation modal is active
    const modal = document.getElementById('arcade-confirm-modal');
    const modalActive = modal && modal.classList.contains('active');
    
    const container = modalActive ? modal : this.rootElement;
    
    // Query visible, enabled controls
    const elements = Array.from(container.querySelectorAll('[data-arcade-focusable]'))
      .filter(el => {
        if (el.disabled || el.classList.contains('disabled')) return false;
        // Verify visual visibility
        const rect = el.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0;
      });
      
    this.focusableElements = elements;
    
    // Sync index
    const currentFocused = this.getFocusedElement();
    if (currentFocused && currentFocused.isConnected) {
      this.selectedIndex = this.focusableElements.indexOf(currentFocused);
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
    
    // Trigger browser native focus to keep accessibility layers happy
    try {
      el.focus({ preventScroll: true });
    } catch(e) {}
    
    // Keep keyboard focus visible without allowing transformed cabinet content
    // to scroll the portfolio document and accidentally suspend ArcadeOS.
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
    if (this.rootElement) {
      this.rootElement.querySelectorAll('.is-ui-focused').forEach(el => {
        el.classList.remove('is-ui-focused');
      });
    }
    const modal = document.getElementById('arcade-confirm-modal');
    if (modal) {
      modal.querySelectorAll('.is-ui-focused').forEach(el => {
        el.classList.remove('is-ui-focused');
      });
    }
  },

  move(direction) {
    // Suspend UI navigation if game is active
    if (window.ArcadeOS && window.ArcadeOS.state === 'APP') return;
    
    this.refreshFocusableElements();
    if (this.focusableElements.length === 0) return;
    
    const el = this.getFocusedElement();
    
    // Sliders / Ranges adjustment blocks standard navigation
    if (el && el.getAttribute('data-arcade-control') === 'range') {
      if (direction === 'left' || direction === 'right') {
        this.adjustSlider(el, direction);
        return;
      }
    }
    
    // Text input in editing mode blocks navigation
    if (this.editingElement) return;

    if (direction === 'down' || direction === 'right') {
      let next = this.selectedIndex + 1;
      if (next >= this.focusableElements.length) next = 0; // wrap
      this.setFocus(this.focusableElements[next]);
    } else if (direction === 'up' || direction === 'left') {
      let prev = this.selectedIndex - 1;
      if (prev < 0) prev = this.focusableElements.length - 1; // wrap
      this.setFocus(this.focusableElements[prev]);
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
    
    // Dispatch input and change events so page bindings receive updates
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  },

  activate() {
    if (window.ArcadeOS && window.ArcadeOS.state === 'APP') return;
    
    this.refreshFocusableElements();
    const el = this.getFocusedElement();
    if (!el) return;
    
    // Text control activation
    const controlType = el.getAttribute('data-arcade-control');
    if (controlType === 'text') {
      this.setEditingMode(el);
      return;
    }
    
    // Simulate natural browser click
    el.click();
    
    // Refresh list in case DOM changed
    setTimeout(() => this.refreshFocusableElements(), 100);
  },

  back() {
    if (window.ArcadeOS && window.ArcadeOS.state === 'APP') return;
    
    if (window.ARCADE_DEBUG) console.log('[ArcadeSystemUI] back() resolving priorities');

    // 1. If active confirm modal is open (e.g. #arcade-confirm-modal with class active)
    const modal = document.getElementById('arcade-confirm-modal');
    if (modal && modal.classList.contains('active')) {
      if (window.ARCADE_DEBUG) console.log('ArcadeSystemUI.back: Closing confirm modal');
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

    // 2. If customize import diff modal/overlay is open
    const diffModal = document.getElementById('builder-import-diff-modal');
    if (diffModal && diffModal.classList.contains('active')) {
      if (window.ARCADE_DEBUG) console.log('ArcadeSystemUI.back: Closing customizer diff modal');
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

    // 3. If in editing mode (textbox/select/slider range active focus)
    if (this.editingElement) {
      if (window.ARCADE_DEBUG) console.log('ArcadeSystemUI.back: Exiting editing mode');
      this.clearEditingMode();
      return;
    }

    // 4. If CUSTOMIZE route has unsaved changes, check with checkUnsavedChanges
    if (window.ArcadeOS && window.ArcadeOS.state === 'CUSTOMIZE') {
      if (window.ArcadeCustomizer && window.ArcadeCustomizer.isDirty()) {
        if (window.ARCADE_DEBUG) console.log('ArcadeSystemUI.back: CUSTOMIZE has unsaved changes, showing modal');
        if (window.ArcadeOS.checkUnsavedChanges(() => window.ArcadeOS.goHome())) {
          return;
        }
      }
    }

    // 5. If currently in a system route (non-HOME), return to HOME
    if (window.ArcadeOS && window.ArcadeOS.state !== 'HOME') {
      if (window.ARCADE_DEBUG) console.log('ArcadeSystemUI.back: Returning to HOME from state:', window.ArcadeOS.state);
      window.ArcadeOS.goHome();
      return;
    }

    // 6. Else if HOME, exit Arcade mode (slide back to portfolio) if trigger exit exists
    if (window.ArcadeOS && window.ArcadeOS.state === 'HOME') {
      if (window.ARCADE_DEBUG) console.log('ArcadeSystemUI.back: Exiting Arcade mode to Portfolio');
      if (window.DockController && typeof window.DockController.selectItem === 'function') {
        window.DockController.selectItem('portfolio');
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
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
