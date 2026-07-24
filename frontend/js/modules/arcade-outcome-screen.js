/**
 * ARCADE OS - SHARED OUTCOME SYSTEM (v1.1)
 * Polished, animated outcome screens for Game Over, Victory, Level Complete, Wave Clear, and New High Score.
 */

export class ArcadeOutcomeScreen {
  static currentOverlay = null;

  static getHost() {
    const safeViewport = document.querySelector('.arcade-viewport-safe');
    if (safeViewport) {
      let root = document.getElementById('arcade-system-overlay-root');
      if (!root) {
        root = document.createElement('div');
        root.id = 'arcade-system-overlay-root';
        root.setAttribute('aria-live', 'polite');
      }

      // The game app view is rewritten with innerHTML whenever a game mounts.
      // Keeping the shared outcome layer inside that view makes it disposable.
      // Mount it directly under the stable CRT safe viewport instead.
      if (root.parentElement !== safeViewport) safeViewport.appendChild(root);

      Object.assign(root.style, {
        position: 'absolute',
        inset: '0',
        width: '100%',
        height: '100%',
        zIndex: '10000',
        pointerEvents: 'none',
        overflow: 'hidden'
      });

      return root;
    }

    return document.getElementById('arcade-app-view') ||
      document.getElementById('arcade-os') ||
      document.body;
  }

  static show(config = {}) {
    const {
      game = null,
      gameId = '',
      outcome = 'GAME_OVER',
      title = null,
      subtitle = null,
      stats = [],
      accentColor = null,
      themeClass = '',
      isNewHighScore = false,
      onRetry = null,
      onNext = null,
      onHome = null,
      customButtons = null
    } = config;

    this.hide();

    const targetContainer = this.getHost();
    if (!targetContainer) return null;

    const isCheated = !!(game?.cheated || window.ArcadeDeveloperMode?.hasActiveCheats?.(gameId));
    const validHighScore = isNewHighScore && !isCheated;

    let displayTitle = title;
    let displaySubtitle = subtitle;

    if (!displayTitle) {
      switch (outcome) {
        case 'VICTORY': displayTitle = 'VICTORY!'; break;
        case 'MAZE_CLEARED': displayTitle = 'MAZE CLEARED!'; break;
        case 'BOARD_CLEARED': displayTitle = 'BOARD CLEARED!'; break;
        case 'LEVEL_COMPLETE': displayTitle = 'LEVEL COMPLETE!'; break;
        case 'WAVE_COMPLETE': displayTitle = 'WAVE CLEARED!'; break;
        case 'SECTOR_SECURED': displayTitle = 'SECTOR SECURED!'; break;
        case 'DEFEAT': displayTitle = 'DEFEAT'; break;
        case 'NEW_HIGH_SCORE': displayTitle = 'NEW HIGH SCORE!'; break;
        case 'GAME_OVER': default: displayTitle = 'GAME OVER'; break;
      }
    }

    let buttons = customButtons;
    if (!buttons || !buttons.length) {
      buttons = [];
      const isWinOutcome = ['VICTORY', 'MAZE_CLEARED', 'BOARD_CLEARED', 'LEVEL_COMPLETE', 'WAVE_COMPLETE', 'SECTOR_SECURED'].includes(outcome);

      if (onNext && isWinOutcome) {
        buttons.push({ label: 'NEXT LEVEL', action: 'next', primary: true, icon: '▶' });
      }

      if (onRetry) {
        buttons.push({ label: isWinOutcome ? 'REPLAY' : 'RETRY', action: 'retry', primary: !buttons.length, icon: '↺' });
      }

      buttons.push({ label: 'ARCADE HOME', action: 'home', primary: false, icon: '⌂' });
    }

    const overlay = document.createElement('div');
    overlay.id = 'arcade-outcome-overlay';
    overlay.className = `arcade-outcome-overlay outcome-${outcome.toLowerCase()} ${themeClass}`;
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', displayTitle || 'Arcade outcome');
    if (accentColor) overlay.style.setProperty('--outcome-accent', accentColor);

    // Inline geometry is intentional: outcome visibility must not depend on a
    // game-specific overlay class or on stylesheet ordering.
    Object.assign(overlay.style, {
      position: 'absolute',
      inset: '0',
      width: '100%',
      height: '100%',
      zIndex: '10001',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      visibility: 'visible',
      opacity: '1',
      pointerEvents: 'auto'
    });

    overlay.innerHTML = `
      <div class="arcade-outcome-vignette"></div>
      <div class="arcade-outcome-modal glass">
        ${isCheated ? `<div class="arcade-outcome-badge dev-badge">⚡ DEV MODIFIED // SCORE INVALID</div>` : ''}
        ${validHighScore ? `<div class="arcade-outcome-badge highscore-badge pulse">🏆 NEW HIGH SCORE!</div>` : ''}
        <div class="arcade-outcome-header">
          <h2 class="arcade-outcome-title">${displayTitle}</h2>
          ${displaySubtitle ? `<p class="arcade-outcome-subtitle">${displaySubtitle}</p>` : ''}
        </div>
        <div class="arcade-outcome-stats">
          ${stats.map(s => `
            <div class="arcade-stat-card ${s.highlight ? 'highlight' : ''}">
              <span class="arcade-stat-label">${s.label}</span>
              <span class="arcade-stat-value" data-value="${s.value}" data-animate="${s.animate !== false ? 'true' : 'false'}">${s.animate !== false ? '0' : s.value}</span>
            </div>
          `).join('')}
        </div>
        <div class="arcade-outcome-actions">
          ${buttons.map((b, idx) => `
            <button type="button" class="arcade-outcome-btn ${b.primary ? 'primary' : 'secondary'}" data-action="${b.action}" data-index="${idx}" data-arcade-focusable>
              ${b.icon ? `<span class="btn-icon">${b.icon}</span>` : ''}${b.label}
            </button>
          `).join('')}
        </div>
      </div>
    `;

    targetContainer.appendChild(overlay);
    this.currentOverlay = overlay;

    this.playAudio(game, outcome, validHighScore);
    this.animateStats(overlay);
    this.setupInputs(overlay, {
      onRetry,
      onNext,
      onHome: onHome || (() => (window.ArcadeOS || globalThis.ArcadeOS)?.goHome())
    });

    return overlay;
  }

  static hide() {
    const overlay = this.currentOverlay || document.getElementById('arcade-outcome-overlay');
    overlay?.remove();
    this.currentOverlay = null;
  }

  static playAudio(game, outcome, validHighScore) {
    const audio = game?.audio || window.ArcadeAudioManager;
    if (!audio) return;

    if (validHighScore) {
      if (typeof audio.playSequence === 'function') {
        audio.playSequence([[440, 'sine', 0.1, 0.06, 0], [554, 'sine', 0.1, 0.06, 80], [659, 'sine', 0.1, 0.06, 160], [880, 'sine', 0.25, 0.08, 240]], { owner: 'outcome' });
      } else if (typeof audio.play === 'function') {
        audio.play('newhighscore');
      }
      return;
    }

    const isWin = ['VICTORY', 'MAZE_CLEARED', 'BOARD_CLEARED', 'LEVEL_COMPLETE', 'WAVE_COMPLETE', 'SECTOR_SECURED'].includes(outcome);
    if (isWin) {
      if (typeof audio.playSequence === 'function') {
        audio.playSequence([[523, 'triangle', 0.1, 0.06, 0], [659, 'triangle', 0.1, 0.06, 80], [784, 'triangle', 0.1, 0.06, 160], [1046, 'triangle', 0.2, 0.08, 240]], { owner: 'outcome' });
      } else if (typeof audio.play === 'function') {
        audio.play('victory');
      }
    } else {
      if (typeof audio.playSequence === 'function') {
        audio.playSequence([[150, 'sawtooth', 0.15, 0.08, 0, 80], [90, 'sawtooth', 0.25, 0.1, 100]], { owner: 'outcome' });
      } else if (typeof audio.play === 'function') {
        audio.play('gameover');
      }
    }
  }

  static animateStats(overlay) {
    const statValues = overlay.querySelectorAll('.arcade-stat-value[data-animate="true"]');
    statValues.forEach(el => {
      const rawTarget = el.getAttribute('data-value');
      const numericTarget = parseInt(rawTarget, 10);
      if (isNaN(numericTarget) || numericTarget === 0) {
        el.textContent = rawTarget;
        return;
      }

      const duration = 600;
      const startTime = performance.now();
      const step = (now) => {
        if (!el.isConnected) return;
        const elapsed = now - startTime;
        const progress = Math.min(1, elapsed / duration);
        const current = Math.floor(numericTarget * progress);
        el.textContent = current.toLocaleString();
        if (progress < 1) {
          requestAnimationFrame(step);
        } else {
          el.textContent = numericTarget.toLocaleString();
        }
      };
      requestAnimationFrame(step);
    });
  }

  static setupInputs(overlay, callbacks) {
    const btnNodes = Array.from(overlay.querySelectorAll('.arcade-outcome-btn'));
    if (!btnNodes.length) return;

    let focusedIdx = 0;
    btnNodes[focusedIdx].focus({ preventScroll: true });

    const focusBtn = (idx) => {
      focusedIdx = (idx + btnNodes.length) % btnNodes.length;
      btnNodes[focusedIdx].focus({ preventScroll: true });
    };

    const handleAction = (btn) => {
      const action = btn.dataset.action;
      ArcadeOutcomeScreen.hide();

      if (action === 'retry' && callbacks.onRetry) {
        callbacks.onRetry();
      } else if (action === 'next' && callbacks.onNext) {
        callbacks.onNext();
      } else if (action === 'home') {
        callbacks.onHome?.();
      }
    };

    btnNodes.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        handleAction(btn);
      });
    });

    const keyHandler = (e) => {
      if (!ArcadeOutcomeScreen.currentOverlay) {
        window.removeEventListener('keydown', keyHandler);
        return;
      }

      if (['ArrowRight', 'ArrowDown'].includes(e.key)) {
        e.preventDefault();
        focusBtn(focusedIdx + 1);
      } else if (['ArrowLeft', 'ArrowUp'].includes(e.key)) {
        e.preventDefault();
        focusBtn(focusedIdx - 1);
      } else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleAction(btnNodes[focusedIdx]);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        focusBtn(0);
      }
    };

    window.addEventListener('keydown', keyHandler);
  }
}

if (typeof window !== 'undefined') {
  window.ArcadeOutcomeScreen = ArcadeOutcomeScreen;
}
