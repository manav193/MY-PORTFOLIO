// js/arcade-module-loader.js
// Handles dynamic ESM imports for non-module scripts like arcade-os.js (Phase 4B)

window.ArcadeModuleLoader = {
  import(modulePath) {
    return import(modulePath);
  }
};
