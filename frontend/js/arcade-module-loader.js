// js/arcade-module-loader.js
// Handles dynamic ESM imports for ArcadeOS modules and games

export const ArcadeModuleLoader = {
  async import(modulePath) {
    try {
      return await import(modulePath);
    } catch (err) {
      console.warn(`[ArcadeModuleLoader] Dynamic import failed for ${modulePath}:`, err);
      throw err;
    }
  }
};

if (typeof window !== 'undefined') {
  window.ArcadeModuleLoader = ArcadeModuleLoader;
}

export default ArcadeModuleLoader;
