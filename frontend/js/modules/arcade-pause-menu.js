/**
 * ARCADE OS - SHARED IN-GAME PAUSE MENU (v1.0)
 * Context-aware in-game pause menu with Resume, Restart, and Arcade Home options.
 */

export class ArcadePauseMenu {
  static isOpen = false;
  static overlayEl = null;

  static show(game) {
    if (this.isOpen) return;
    this.isOpen = true;

    // Pause active game physics / RAF loop
    if (game && typeof game.pause === 'function') {
      game.pause();
    } else if (game && game.state === 'PLAYING') {
      game.state = 'PAUSED';
      if (typeof game.cancelLoop === 'function') game.cancelLoop();
    }

    const root = document.getElementById('arcade-system-overlay-root') ||
                 document.getElementById('arcade-app-view') ||
                 document.getElementById('arcade-os') ||
                 document.body;

    const overlay = document.createElement('div');
    overlay.id = 'arcade-pause-overlay';
    overlay.className = 'arcade-outcome-overlay outcome-pause';
    overlay.innerHTML = `
      <div class="arcade-outcome-vignette"></div>
      <div class="arcade-outcome-modal glass pause-modal">
        <div class="arcade-outcome-header">
          <div class="pause-icon pulse">⏸</div>
          <h2 class="arcade-outcome-title">GAME PAUSED</h2>
          <p class="arcade-outcome-subtitle">SELECT AN OPTION TO CONTINUE</p>
        </div>
        <div class="arcade-outcome-actions vertical">
          <button type="button" class="arcade-outcome-btn primary" data-action="resume" data-arcade-focusable>
            <span class="btn-icon">▶</span> RESUME GAME
          </button>
          <button type="button" class="arcade-outcome-btn secondary" data-action="restart" data-arcade-focusable>
            <span class="btn-icon">↺</span> RESTART
          </button>
          <button type="button" class="arcade-outcome-btn secondary" data-action="home" data-arcade-focusable>
            <span class="btn-icon">⌂</span> ARCADE HOME
          </button>
        </div>
      </div>
    `;

    root.appendChild(overlay);
    this.overlayEl = overlay;

    // Focus & Input Management
    const buttons = Array.from(overlay.querySelectorAll('.arcade-outcome-btn'));
    let focusedIndex = 0;
    if (buttons.length > 0) buttons[0].focus();

    const focusBtn = (idx) => {
      focusedIndex = (idx + buttons.length) % buttons.length;
      buttons[focusedIndex].focus();
    };

    buttons.forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const action = btn.dataset.action;
        if (action === 'resume') {
          ArcadePauseMenu.hide(game);
        } else if (action === 'restart') {
          ArcadePauseMenu.hide();
          if (game && typeof game.start === 'function') {
            game.start();
          } else if (game && typeof game.restart === 'function') {
            game.restart();
          }
        } else if (action === 'home') {
          ArcadePauseMenu.hide();
          if (window.ArcadeOS?.goHome) window.ArcadeOS.goHome();
        }
      });
    });

    const keyHandler = (e) => {
      if (!ArcadePauseMenu.isOpen) {
        window.removeEventListener('keydown', keyHandler);
        return;
      }
      if (['ArrowDown', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
        focusBtn(focusedIndex + 1);
      } else if (['ArrowUp', 'ArrowLeft'].includes(e.key)) {
        e.preventDefault();
        focusBtn(focusedIndex - 1);
      } else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        buttons[focusedIndex]?.click();
      }
    };

    window.addEventListener('keydown', keyHandler);
  }

  static hide(game) {
    if (!this.isOpen) return;
    this.isOpen = false;
    if (this.overlayEl && this.overlayEl.parentNode) {
      this.overlayEl.parentNode.removeChild(this.overlayEl);
    }
    this.overlayEl = null;

    // Resume active game
    if (game) {
      if (typeof game.resume === 'function') {
        game.resume();
      } else if (game.state === 'PAUSED') {
        game.state = 'PLAYING';
        if (typeof game.cancelLoop === 'function') game.cancelLoop();
        if (typeof game.gameLoop === 'function') game.gameLoop(performance.now());
      }
    }
  }

  static toggle(game) {
    if (this.isOpen) {
      this.hide(game);
    } else {
      this.show(game);
    }
  }
}

if (typeof window !== 'undefined') {
  window.ArcadePauseMenu = ArcadePauseMenu;
}
