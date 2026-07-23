/**
 * EXPERIENCE CONTROLLER
 * Authoritative high-level state controller for Portfolio <-> Arcade transitions.
 * 
 * Valid States:
 * - PORTFOLIO
 * - ARCADE_ENTERING
 * - ARCADE_HOME
 * - ARCADE_APP
 * - ARCADE_EXITING
 */

let currentState = 'PORTFOLIO';

export const ExperienceController = {
  get state() {
    return currentState;
  },

  getState() {
    return currentState;
  },

  async enterArcadeExperience(source = 'button') {
    if (currentState === 'ARCADE_HOME' || currentState === 'ARCADE_APP' || currentState === 'ARCADE_ENTERING') {
      return true;
    }

    currentState = 'ARCADE_ENTERING';

    // 1. Scaled cabinet chassis
    const chassis = document.querySelector('.cabinet-chassis');
    if (chassis) chassis.classList.add('is-scaled');

    // 2. Reveal Arcade OS layer
    const osLayer = document.getElementById('arcade-os');
    if (osLayer) {
      osLayer.style.opacity = '1';
      osLayer.style.pointerEvents = 'auto';
      osLayer.classList.remove('is-hidden');
    }

    // 3. Ensure ArcadeOS runtime ready / booted / resumed
    if (window.ArcadeOS) {
      window.ArcadeOS.userExited = false;
      window.ArcadeOS.osVisible = true;
      if (!window.ArcadeOS.booted) {
        window.ArcadeOS.boot();
      } else {
        window.ArcadeOS.resume();
      }
    }

    // 4. Start the visual sequence after the runtime has mounted its views.
    if (window.ArcadeBootController) {
      window.ArcadeBootController.triggerBootSequence();
    }

    // 5. Position to cabinet if triggered by button or dock
    if (source === 'dock' || source === 'button') {
      const intro = document.getElementById('intro-sequence');
      if (intro) {
        const rect = intro.getBoundingClientRect();
        const targetY = window.scrollY + rect.top + window.innerHeight * 0.96;
        window.scrollTo({ top: targetY, behavior: 'instant' });
      }
    }

    // 6. Set authoritative state
    if (window.ArcadeOS?.activeApp || window.ArcadeOS?.state === 'APP') {
      currentState = 'ARCADE_APP';
    } else {
      currentState = 'ARCADE_HOME';
    }

    // 7. Sync active dock item
    if (typeof window.setActiveDock === 'function') {
      window.setActiveDock('arcade');
    }

    return true;
  },

  async exitArcadeExperience(source = 'button', targetSectionId = null) {
    if (currentState === 'PORTFOLIO' || currentState === 'ARCADE_EXITING') {
      if (targetSectionId && targetSectionId !== 'none') {
        this.navigateToPortfolioSection(targetSectionId);
      }
      return true;
    }

    currentState = 'ARCADE_EXITING';

    if (window.ArcadeBootController) {
      await window.ArcadeBootController.sleep();
    }

    // 1. Suspend ArcadeOS runtime safely
    if (window.ArcadeOS) {
      window.ArcadeOS.userExited = true;
      window.ArcadeOS.osVisible = false;
      window.ArcadeOS.suspend();
    }

    // 2. Hide Arcade OS visual layer
    const osLayer = document.getElementById('arcade-os');
    if (osLayer) {
      osLayer.style.opacity = '0';
      osLayer.style.pointerEvents = 'none';
    }

    // 3. Reset chassis scaling
    const chassis = document.querySelector('.cabinet-chassis');
    if (chassis) chassis.classList.remove('is-scaled');

    // 4. Scroll to portfolio section if requested via dock or button
    if (source === 'dock' || source === 'button' || targetSectionId) {
      const targetId = targetSectionId || (source === 'dock' ? 'portfolio-intro' : 'main-content');
      this.navigateToPortfolioSection(targetId);
    }

    // 5. Set final state
    currentState = 'PORTFOLIO';

    return true;
  },

  navigateToPortfolioSection(targetSectionId) {
    if (!targetSectionId || targetSectionId === 'none') return;
    if (targetSectionId === 'portfolio-intro' || targetSectionId === 'top') {
      window.scrollTo({ top: 0, behavior: 'instant' });
      if (typeof window.setActiveDock === 'function') {
        window.setActiveDock('portfolio-intro');
      }
      return;
    }
    const elem = document.getElementById(targetSectionId);
    if (elem) {
      const header = document.getElementById('main-nav');
      const offset = (header?.getBoundingClientRect().height || 0) + 16;
      const top = Math.max(0, window.scrollY + elem.getBoundingClientRect().top - offset);
      window.scrollTo({ top, behavior: 'instant' });
    }
    if (typeof window.setActiveDock === 'function') {
      window.setActiveDock(targetSectionId);
    }
  },

  notifyAppStateChange(appActive) {
    if (currentState === 'PORTFOLIO' || currentState === 'ARCADE_EXITING') return;
    currentState = appActive ? 'ARCADE_APP' : 'ARCADE_HOME';
  }
};

if (typeof window !== 'undefined') {
  window.ArcadeExperience = ExperienceController;
  window.enterArcadeExperience = (src) => ExperienceController.enterArcadeExperience(src);
  window.exitArcadeExperience = (src, target) => ExperienceController.exitArcadeExperience(src, target);
  
  // Backward compatibility facades
  window.enterArcade = () => ExperienceController.enterArcadeExperience('dock');
  window.exitArcadeToPortfolio = (target) => ExperienceController.exitArcadeExperience('dock', target);
  window.activateArcade = () => ExperienceController.enterArcadeExperience('scroll');
}
