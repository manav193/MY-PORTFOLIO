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
    if (!arcade || typeof arcade.renderHome !== 'function' || arcade.renderHome.__cinematicDashboardV2) return false;

    const originalRenderHome = arcade.renderHome.bind(arcade);

    const decorate = () => {
      const home = document.getElementById('arcade-home');
      const carousel = document.getElementById('home-carousel');
      const details = document.getElementById('home-details');
      if (!home || !carousel || !details) return;

      home.classList.add('arcade-home-cinematic-v2');

      let brand = home.querySelector('.arcade-cinematic-brand-v2');
      if (!brand) {
        brand = document.createElement('div');
        brand.className = 'arcade-cinematic-brand-v2';
        brand.innerHTML = `
          <div class="arcade-cinematic-title-v2">ARCADE<span>OS</span></div>
          <div class="arcade-cinematic-tagline-v2">PLAY. CODE. CREATE. REPEAT.</div>
        `;
        home.prepend(brand);
      }

      const items = typeof arcade.getHomeItems === 'function' ? arcade.getHomeItems() : [];
      const total = items.length;
      const selectedIndex = Math.max(0, Math.min(Number(arcade.selectedIndex) || 0, Math.max(0, total - 1)));
      let start = Math.max(0, selectedIndex - 1);
      if (start + 4 > total) start = Math.max(0, total - 4);
      const visibleIndexes = new Set(Array.from({ length: Math.min(4, total) }, (_, i) => start + i));

      carousel.querySelectorAll('.app-card').forEach((card) => {
        const idx = Number(card.dataset.idx);
        const item = items[idx];
        if (!item) return;

        card.classList.toggle('is-dashboard-visible', visibleIndexes.has(idx));
        const oldIcon = card.querySelector('.app-icon');
        const icon = oldIcon?.innerHTML || card.querySelector('.arcade-card-icon-v2')?.innerHTML || '◈';
        const label = item.title || item.id || 'APP';
        const desc = item.description || (item.group === 'PLAY' ? 'Play classic & modern' : item.group === 'CREATE' ? 'Create something new' : 'System utility');

        card.innerHTML = `
          <div class="arcade-card-icon-v2">${icon}</div>
          <div class="arcade-card-copy-v2">
            <strong>${escapeMarkup(label)}</strong>
            <span>${escapeMarkup(desc)}</span>
          </div>
        `;
      });

      const selected = items[selectedIndex] || items[0];
      details.innerHTML = selected ? `
        <div class="arcade-cinematic-meta-v2">
          <span>${escapeMarkup(selected.group || selected.category || 'ARCADE')}</span>
          <strong>${escapeMarkup(selected.title || selected.id || 'Ready')}</strong>
          <small>ENTER / START / TAP TO OPEN</small>
        </div>
      ` : '';
    };

    const redesignedRenderHome = (...args) => {
      const result = originalRenderHome(...args);
      decorate();
      return result;
    };

    redesignedRenderHome.__cinematicDashboardV2 = true;
    arcade.renderHome = redesignedRenderHome;

    if (arcade.state === 'HOME') arcade.renderHome();
    return true;
  };

  if (!install()) {
    window.setTimeout(install, 250);
    window.setTimeout(install, 900);
    window.setTimeout(install, 1800);
  }

  if (!document.getElementById('arcade-cinematic-dashboard-v2-styles')) {
    const style = document.createElement('style');
    style.id = 'arcade-cinematic-dashboard-v2-styles';
    style.textContent = `
      #arcade-home.arcade-home-cinematic-v2{
        position:relative!important;
        overflow:hidden!important;
        box-sizing:border-box!important;
        padding:18px 22px 14px!important;
        display:flex!important;
        flex-direction:column!important;
        justify-content:flex-start!important;
        background:
          radial-gradient(ellipse at 50% 112%,rgba(0,220,255,.34) 0%,rgba(65,38,255,.18) 22%,transparent 52%),
          radial-gradient(circle at 17% 20%,rgba(98,39,255,.18),transparent 25%),
          radial-gradient(circle at 82% 18%,rgba(0,201,255,.11),transparent 24%),
          linear-gradient(180deg,#02040e 0%,#05071b 58%,#02030a 100%)!important;
      }
      #arcade-home.arcade-home-cinematic-v2:before{
        content:"";position:absolute;inset:0;pointer-events:none;opacity:.7;
        background-image:
          radial-gradient(circle at 12% 18%,rgba(255,255,255,.8) 0 1px,transparent 1.5px),
          radial-gradient(circle at 76% 22%,rgba(255,255,255,.65) 0 1px,transparent 1.5px),
          radial-gradient(circle at 63% 10%,rgba(92,198,255,.8) 0 1px,transparent 1.5px),
          linear-gradient(rgba(77,67,210,.12) 1px,transparent 1px),
          linear-gradient(90deg,rgba(77,67,210,.12) 1px,transparent 1px);
        background-size:auto,auto,auto,30px 30px,30px 30px;
        mask-image:linear-gradient(to bottom,transparent 0%,#000 28%,#000 100%);
      }
      #arcade-home.arcade-home-cinematic-v2:after{
        content:"";position:absolute;left:-8%;right:-8%;bottom:-33%;height:58%;border-radius:50% 50% 0 0/18% 18% 0 0;
        border-top:3px solid rgba(0,229,255,.95);box-shadow:0 -8px 30px rgba(0,204,255,.42),0 -24px 70px rgba(70,48,255,.25);pointer-events:none;
      }
      .arcade-cinematic-brand-v2{position:relative;z-index:3;text-align:center;margin:0 0 15px;pointer-events:none;flex:0 0 auto}
      .arcade-cinematic-title-v2{
        font-family:Impact,"Arial Black",sans-serif;font-size:clamp(48px,9vw,86px);line-height:.82;letter-spacing:-.045em;font-style:italic;
        background:linear-gradient(180deg,#fff56a 0%,#ffd036 28%,#ff8b20 60%,#ec3c18 83%,#a81510 100%);
        -webkit-background-clip:text;background-clip:text;color:transparent;-webkit-text-stroke:1px rgba(255,230,114,.38);
        filter:drop-shadow(0 5px 0 #7b180c) drop-shadow(0 13px 24px rgba(255,92,19,.3));
      }
      .arcade-cinematic-title-v2 span{margin-left:.025em}
      .arcade-cinematic-tagline-v2{margin-top:10px;font-size:clamp(9px,1.8vw,15px);font-weight:900;letter-spacing:.12em;color:#16edf2;text-shadow:0 0 18px rgba(22,237,242,.42)}
      #arcade-home.arcade-home-cinematic-v2 #home-carousel{
        position:relative!important;z-index:3!important;display:grid!important;grid-template-columns:repeat(4,minmax(0,1fr))!important;
        gap:16px!important;width:100%!important;max-width:760px!important;margin:0 auto!important;padding:8px 4px 12px!important;
        transform:none!important;overflow:visible!important;align-items:stretch!important;flex:1 1 auto!important;
      }
      #arcade-home.arcade-home-cinematic-v2 .app-card{display:none!important}
      #arcade-home.arcade-home-cinematic-v2 .app-card.is-dashboard-visible{
        display:flex!important;position:relative!important;min-width:0!important;width:100%!important;height:176px!important;padding:16px 12px 14px!important;
        border-radius:17px!important;flex-direction:column!important;justify-content:center!important;align-items:center!important;gap:12px!important;text-align:center!important;
        background:linear-gradient(180deg,rgba(13,19,47,.96),rgba(5,8,25,.98))!important;border:1px solid rgba(110,70,255,.62)!important;
        box-shadow:inset 0 0 0 1px rgba(255,255,255,.025),0 18px 34px rgba(0,0,0,.34)!important;
        transition:transform .2s ease,border-color .2s ease,box-shadow .2s ease!important;
      }
      #arcade-home.arcade-home-cinematic-v2 .app-card.is-dashboard-visible.focused{
        transform:translateY(-5px) scale(1.025)!important;border-color:#13e9ff!important;
        box-shadow:0 0 0 1px rgba(19,233,255,.3),0 0 30px rgba(19,233,255,.3),0 20px 38px rgba(0,0,0,.42)!important;
      }
      .arcade-card-icon-v2{font-size:58px;line-height:1;min-height:64px;display:grid;place-items:center;filter:drop-shadow(0 9px 13px rgba(0,0,0,.42))}
      .arcade-card-copy-v2{display:flex;flex-direction:column;gap:6px;width:100%;min-width:0}
      .arcade-card-copy-v2 strong{font-size:13px;letter-spacing:.055em;text-transform:uppercase;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
      .arcade-card-copy-v2 span{font-size:8px;line-height:1.32;color:rgba(228,235,255,.74);display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
      #arcade-home.arcade-home-cinematic-v2 #home-details{
        position:relative!important;z-index:3!important;min-height:38px!important;width:min(740px,96%)!important;margin:2px auto 0!important;padding:7px 12px!important;
        border:1px solid rgba(255,255,255,.07)!important;background:rgba(3,6,18,.68)!important;border-radius:10px!important;flex:0 0 auto!important;
      }
      .arcade-cinematic-meta-v2{display:grid;grid-template-columns:auto 1fr auto;gap:12px;align-items:center;width:100%}
      .arcade-cinematic-meta-v2 span{font-size:7px;font-weight:900;letter-spacing:.13em;color:#12e9ee}
      .arcade-cinematic-meta-v2 strong{font-size:10px;color:#fff;text-align:center;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
      .arcade-cinematic-meta-v2 small{font-size:6px;color:rgba(255,255,255,.54);white-space:nowrap}
      @media(max-width:720px){
        #arcade-home.arcade-home-cinematic-v2{padding:12px 10px 10px!important}
        .arcade-cinematic-title-v2{font-size:44px}
        #arcade-home.arcade-home-cinematic-v2 #home-carousel{gap:8px!important}
        #arcade-home.arcade-home-cinematic-v2 .app-card.is-dashboard-visible{height:142px!important;padding:10px 7px!important}
        .arcade-card-icon-v2{font-size:42px;min-height:48px}
        .arcade-card-copy-v2 strong{font-size:10px}.arcade-card-copy-v2 span{font-size:6px}
        .arcade-cinematic-meta-v2 small{display:none}
      }
    `;
    document.head.appendChild(style);
  }
}

function escapeMarkup(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
