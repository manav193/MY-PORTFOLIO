export function initRuntimeFixes() {
  const applyFixes = () => {
    installArcadeHomeRedesign();
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyFixes);
  } else {
    applyFixes();
  }
}

function installArcadeHomeRedesign() {
  const home = document.getElementById('arcade-home');
  if (home) {
    home.classList.add('arcade-cinematic-v5');
    const oldBrand = home.querySelector('.arcade-cinematic-brand-v2');
    if (oldBrand) oldBrand.remove();
  }
}
