const NIMO_LOGO_PATH = 'icons/nimo-logo.svg';

export function initRuntimeFixes() {
  hardenNimoControls();
  hardenArcadeEntry();
  installArcadeHomeRedesign();
}

function hardenNimoControls() {
  const widget = document.getElementById('nimo-widget');
  const panel = document.getElementById('nimo-panel');
  const launcher = document.getElementById('nimo-launcher');
  const closeBtn = document.getElementById('nimo-close-btn');

  if (!widget || !panel || !launcher || !closeBtn) return;

  closeBtn.type = 'button';
  closeBtn.style.pointerEvents = 'auto';
  closeBtn.style.touchAction = 'manipulation';
  closeBtn.style.position = 'relative';
  closeBtn.style.zIndex = '4';

  const forceClose = (event) => {
    event?.preventDefault();
    event?.stopPropagation();
    panel.classList.remove('active');
    launcher.setAttribute('aria-expanded', 'false');
  };

  closeBtn.addEventListener('pointerdown', forceClose, { capture: true });
  closeBtn.addEventListener('click', forceClose, { capture: true });

  const brandMarkup = `<img class="nimo-brand-mark" src="${NIMO_LOGO_PATH}" alt="" width="28" height="28" decoding="async">`;
  const avatar = widget.querySelector('.nimo-avatar');
  if (avatar) {
    avatar.classList.add('nimo-avatar--brand');
    avatar.innerHTML = brandMarkup;
  }

  const launcherIcon = widget.querySelector('.nimo-launcher-icon');
  if (launcherIcon) launcherIcon.innerHTML = brandMarkup;

  if (!document.getElementById('nimo-runtime-brand-styles')) {
    const style = document.createElement('style');
    style.id = 'nimo-runtime-brand-styles';
    style.textContent = `
      .nimo-brand-mark{display:block;width:100%;height:100%;object-fit:contain;filter:drop-shadow(0 6px 14px rgba(79,70,229,.28))}
      .nimo-avatar--brand{display:grid!important;place-items:center!important;padding:0!important;overflow:visible!important;background:transparent!important;border:0!important}
      .nimo-avatar--brand .nimo-brand-mark{width:34px;height:34px}
      .nimo-launcher-icon{display:grid;place-items:center}
      .nimo-launcher-icon .nimo-brand-mark{width:28px;height:28px}
      #nimo-close-btn{cursor:pointer;isolation:isolate}
      #nimo-close-btn svg{pointer-events:none}
    `;
    document.head.appendChild(style);
  }
}

function hardenArcadeEntry() {
  if (typeof window.enterArcade !== 'function' || window.enterArcade.__nimoArcadeHardened) return;

  const originalEnterArcade = window.enterArcade;
  let entrySettlingUntil = 0;

  const stabilizeCabinetPosition = () => {
    const intro = document.getElementById('intro-sequence');
    if (!intro) return;

    const introTop = intro.getBoundingClientRect().top + window.scrollY;
    const targetY = introTop + window.innerHeight * 0.96;
    const distance = Math.abs(window.scrollY - targetY);

    if (distance > Math.max(72, window.innerHeight * 0.12)) {
      window.scrollTo({ top: targetY, behavior: 'auto' });
      window.dispatchEvent(new Event('scroll'));
    }
  };

  const hardenedEnterArcade = (...args) => {
    entrySettlingUntil = Date.now() + 2200;
    const result = originalEnterArcade(...args);

    requestAnimationFrame(() => requestAnimationFrame(stabilizeCabinetPosition));
    window.setTimeout(stabilizeCabinetPosition, 700);
    window.setTimeout(stabilizeCabinetPosition, 1500);
    return result;
  };

  hardenedEnterArcade.__nimoArcadeHardened = true;
  window.enterArcade = hardenedEnterArcade;

  const installForceHomeGuard = () => {
    const arcade = window.ArcadeOS;
    if (!arcade || typeof arcade.forceGoHome !== 'function' || arcade.forceGoHome.__entryGuarded) return;

    const originalForceGoHome = arcade.forceGoHome.bind(arcade);
    const guardedForceGoHome = (...args) => {
      const enteringArcade = Date.now() < entrySettlingUntil && document.body.classList.contains('arcade-active');
      if (enteringArcade) return;
      return originalForceGoHome(...args);
    };

    guardedForceGoHome.__entryGuarded = true;
    arcade.forceGoHome = guardedForceGoHome;
  };

  installForceHomeGuard();
  window.setTimeout(installForceHomeGuard, 250);
  window.setTimeout(installForceHomeGuard, 1000);
}

function installArcadeHomeRedesign() {
  const install = () => {
    const arcade = window.ArcadeOS;
    if (!arcade || typeof arcade.renderHome !== 'function' || arcade.renderHome.__cinematicDashboard) return false;

    const originalRenderHome = arcade.renderHome.bind(arcade);

    const decorate = () => {
      const home = document.getElementById('arcade-home');
      const carousel = document.getElementById('home-carousel');
      const details = document.getElementById('home-details');
      if (!home || !carousel || !details) return;

      home.classList.add('arcade-home-cinematic');

      if (!home.querySelector('.arcade-cinematic-brand')) {
        const brand = document.createElement('div');
        brand.className = 'arcade-cinematic-brand';
        brand.innerHTML = `
          <div class="arcade-cinematic-title">ARCADE<span>OS</span></div>
          <div class="arcade-cinematic-tagline">PLAY. CODE. CREATE. REPEAT.</div>
        `;
        home.prepend(brand);
      }

      const items = typeof arcade.getHomeItems === 'function' ? arcade.getHomeItems() : [];
      carousel.querySelectorAll('.app-card').forEach((card) => {
        const idx = Number(card.dataset.idx);
        const item = items[idx];
        if (!item) return;

        const oldIcon = card.querySelector('.app-icon');
        const icon = oldIcon?.innerHTML || '◈';
        const label = item.title || item.id || 'APP';
        const desc = item.description || (item.group === 'PLAY' ? 'Play classic & modern' : item.group === 'CREATE' ? 'Create something new' : 'System utility');

        card.innerHTML = `
          <div class="arcade-card-icon">${icon}</div>
          <div class="arcade-card-copy">
            <strong>${escapeMarkup(label)}</strong>
            <span>${escapeMarkup(desc)}</span>
          </div>
        `;
      });

      const selected = items[arcade.selectedIndex] || items[0];
      if (selected) {
        details.innerHTML = `
          <div class="arcade-cinematic-meta">
            <span>${escapeMarkup(selected.group || selected.category || 'ARCADE')}</span>
            <strong>${escapeMarkup(selected.title || selected.id || 'Ready')}</strong>
            <small>Press ENTER, Start, or Tap to open</small>
          </div>
        `;
      }

      requestAnimationFrame(() => {
        const focused = carousel.querySelector('.app-card.focused');
        if (focused) focused.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      });
    };

    const redesignedRenderHome = (...args) => {
      const result = originalRenderHome(...args);
      decorate();
      return result;
    };

    redesignedRenderHome.__cinematicDashboard = true;
    arcade.renderHome = redesignedRenderHome;

    if (arcade.state === 'HOME') arcade.renderHome();
    return true;
  };

  if (!install()) {
    window.setTimeout(install, 250);
    window.setTimeout(install, 900);
    window.setTimeout(install, 1800);
  }

  if (!document.getElementById('arcade-cinematic-dashboard-styles')) {
    const style = document.createElement('style');
    style.id = 'arcade-cinematic-dashboard-styles';
    style.textContent = `
      #arcade-home.arcade-home-cinematic{
        position:relative!important;overflow:hidden!important;padding:16px 18px 14px!important;box-sizing:border-box!important;
        background:
          radial-gradient(circle at 50% 88%,rgba(0,216,255,.2),transparent 28%),
          radial-gradient(circle at 18% 18%,rgba(128,42,255,.13),transparent 24%),
          linear-gradient(180deg,#020511 0%,#050719 58%,#02040d 100%)!important;
      }
      #arcade-home.arcade-home-cinematic:before{
        content:"";position:absolute;inset:0;pointer-events:none;opacity:.52;
        background-image:linear-gradient(rgba(87,67,255,.11) 1px,transparent 1px),linear-gradient(90deg,rgba(87,67,255,.11) 1px,transparent 1px);
        background-size:26px 26px;mask-image:linear-gradient(to bottom,transparent 7%,#000 35%,#000 100%);
      }
      #arcade-home.arcade-home-cinematic:after{
        content:"";position:absolute;left:-12%;right:-12%;bottom:-31%;height:55%;border-radius:50% 50% 0 0/22% 22% 0 0;
        border-top:2px solid rgba(0,220,255,.92);box-shadow:0 -10px 30px rgba(0,188,255,.26),0 -2px 70px rgba(88,52,255,.24);pointer-events:none;
      }
      .arcade-cinematic-brand{position:relative;z-index:2;text-align:center;margin:2px 0 12px;pointer-events:none}
      .arcade-cinematic-title{font-family:Impact,"Arial Black",sans-serif;font-size:clamp(34px,7.2vw,72px);line-height:.88;letter-spacing:-.035em;font-style:italic;
        background:linear-gradient(180deg,#fff26a 0%,#ffc52e 34%,#ff7b1d 67%,#d92919 100%);-webkit-background-clip:text;background-clip:text;color:transparent;
        -webkit-text-stroke:1px rgba(255,205,72,.32);filter:drop-shadow(0 4px 0 #7b160b) drop-shadow(0 10px 18px rgba(255,91,20,.2));}
      .arcade-cinematic-title span{margin-left:.03em}
      .arcade-cinematic-tagline{margin-top:8px;font-size:clamp(8px,1.6vw,14px);font-weight:900;letter-spacing:.12em;color:#16ecf1;text-shadow:0 0 16px rgba(22,236,241,.35)}
      #arcade-home.arcade-home-cinematic #home-carousel{
        position:relative!important;z-index:2!important;display:grid!important;grid-auto-flow:column!important;grid-auto-columns:minmax(118px,1fr)!important;
        gap:12px!important;overflow-x:auto!important;overflow-y:hidden!important;transform:none!important;padding:8px 6px 12px!important;scroll-snap-type:x mandatory!important;
        scrollbar-width:none!important;max-width:100%!important;align-items:stretch!important;
      }
      #arcade-home.arcade-home-cinematic #home-carousel::-webkit-scrollbar{display:none}
      #arcade-home.arcade-home-cinematic .app-card{
        position:relative!important;scroll-snap-align:center!important;min-width:118px!important;height:156px!important;padding:13px 10px 12px!important;border-radius:15px!important;
        display:flex!important;flex-direction:column!important;justify-content:center!important;align-items:center!important;gap:10px!important;text-align:center!important;
        background:linear-gradient(180deg,rgba(14,20,46,.94),rgba(5,9,27,.96))!important;border:1px solid rgba(107,74,255,.48)!important;
        box-shadow:inset 0 0 0 1px rgba(255,255,255,.025),0 12px 26px rgba(0,0,0,.28)!important;transition:transform .22s ease,border-color .22s ease,box-shadow .22s ease!important;
      }
      #arcade-home.arcade-home-cinematic .app-card.focused{
        transform:translateY(-4px) scale(1.025)!important;border-color:#12e8ff!important;
        box-shadow:0 0 0 1px rgba(18,232,255,.28),0 0 24px rgba(18,232,255,.28),0 18px 34px rgba(0,0,0,.38)!important;
      }
      .arcade-card-icon{font-size:48px;line-height:1;filter:drop-shadow(0 8px 10px rgba(0,0,0,.38));min-height:54px;display:grid;place-items:center}
      .arcade-card-copy{display:flex;flex-direction:column;gap:5px;min-width:0;width:100%}
      .arcade-card-copy strong{font-size:12px;letter-spacing:.06em;text-transform:uppercase;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
      .arcade-card-copy span{font-size:7px;line-height:1.25;color:rgba(229,236,255,.7);display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
      #arcade-home.arcade-home-cinematic #home-details{position:relative!important;z-index:2!important;min-height:43px!important;margin:0 6px!important;padding:8px 10px!important;border-top:1px solid rgba(255,255,255,.08)!important;background:rgba(3,7,18,.58)!important;border-radius:10px!important}
      .arcade-cinematic-meta{display:grid;grid-template-columns:auto 1fr auto;gap:10px;align-items:center;width:100%}
      .arcade-cinematic-meta span{font-size:7px;font-weight:900;letter-spacing:.12em;color:#14e6ec}
      .arcade-cinematic-meta strong{font-size:10px;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
      .arcade-cinematic-meta small{font-size:6px;color:rgba(255,255,255,.52);white-space:nowrap}
      @media(max-width:760px){
        #arcade-home.arcade-home-cinematic{padding:12px 10px 10px!important}
        #arcade-home.arcade-home-cinematic #home-carousel{grid-auto-columns:minmax(106px,42%)!important;gap:9px!important}
        #arcade-home.arcade-home-cinematic .app-card{height:144px!important;min-width:106px!important}
        .arcade-cinematic-meta{grid-template-columns:auto 1fr}.arcade-cinematic-meta small{display:none}
      }
    `;
    document.head.appendChild(style);
  }
}

function escapeMarkup(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
