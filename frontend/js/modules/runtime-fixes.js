const NIMO_LOGO_PATH = 'icons/nimo-logo.svg';

export function initRuntimeFixes() {
  hardenNimoControls();
  hardenArcadeEntry();
  installPremiumInterfaceStyles();
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
  closeBtn.style.zIndex = '20';

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
}

function installPremiumInterfaceStyles() {
  if (document.getElementById('premium-arcade-nimo-concept-styles')) return;

  const style = document.createElement('style');
  style.id = 'premium-arcade-nimo-concept-styles';
  style.textContent = `
    /* ============================================================
       NIMO — premium dark assistant direction
       ============================================================ */
    .nimo-widget{--nimo-violet:#8b5cf6;--nimo-purple:#6d28d9;--nimo-cyan:#22d3ee;--nimo-panel:#070914;--nimo-surface:#0d1120;--nimo-line:rgba(139,92,246,.35)}
    .nimo-brand-mark{display:block;width:100%;height:100%;object-fit:contain;filter:drop-shadow(0 0 12px rgba(34,211,238,.34)) drop-shadow(0 0 18px rgba(139,92,246,.24))}
    .nimo-avatar--brand{display:grid!important;place-items:center!important;padding:0!important;overflow:visible!important;background:transparent!important;border:0!important;box-shadow:none!important}
    .nimo-avatar--brand .nimo-brand-mark{width:38px;height:38px}
    .nimo-launcher-icon{display:grid!important;place-items:center!important}
    .nimo-launcher-icon .nimo-brand-mark{width:30px;height:30px}

    .nimo-panel{
      background:
        radial-gradient(circle at 12% 0%,rgba(34,211,238,.08),transparent 28%),
        radial-gradient(circle at 92% 8%,rgba(139,92,246,.13),transparent 34%),
        linear-gradient(180deg,rgba(8,10,24,.985),rgba(4,6,16,.985))!important;
      border:1px solid rgba(168,85,247,.62)!important;
      box-shadow:0 28px 90px rgba(0,0,0,.58),0 0 0 1px rgba(34,211,238,.06) inset,0 0 38px rgba(109,40,217,.14)!important;
      border-radius:24px!important;
      overflow:hidden!important;
      backdrop-filter:blur(24px) saturate(140%);
    }
    .nimo-header{
      min-height:82px!important;
      padding:16px 18px!important;
      background:linear-gradient(180deg,rgba(16,18,40,.96),rgba(9,10,24,.94))!important;
      border-bottom:1px solid rgba(139,92,246,.24)!important;
      box-shadow:0 1px 0 rgba(255,255,255,.025) inset!important;
    }
    .nimo-header-brand{gap:12px!important}
    .nimo-name{font-weight:850!important;letter-spacing:.12em!important;font-size:16px!important;color:#f8fafc!important;text-shadow:0 0 18px rgba(255,255,255,.12)}
    .nimo-status{color:#a78bfa!important;font-size:11px!important;letter-spacing:.03em!important}
    .nimo-close-btn{
      cursor:pointer!important;isolation:isolate!important;width:42px!important;height:42px!important;border-radius:12px!important;
      border:1px solid rgba(139,92,246,.34)!important;background:rgba(109,40,217,.09)!important;color:#c084fc!important;
      transition:transform .18s ease,background .18s ease,border-color .18s ease,box-shadow .18s ease!important;
    }
    .nimo-close-btn:hover{transform:scale(1.04);background:rgba(139,92,246,.18)!important;border-color:rgba(192,132,252,.7)!important;box-shadow:0 0 22px rgba(139,92,246,.18)!important}
    .nimo-close-btn svg{pointer-events:none}
    .nimo-messages{padding:22px 20px 12px!important;background:transparent!important;scrollbar-width:thin;scrollbar-color:rgba(139,92,246,.4) transparent}
    .nimo-msg{max-width:88%!important;margin-bottom:14px!important}
    .nimo-msg-content{line-height:1.62!important;font-size:13px!important;letter-spacing:.005em!important}
    .nimo-msg-assistant{
      align-self:flex-start!important;
      background:linear-gradient(145deg,rgba(18,23,43,.96),rgba(10,13,28,.96))!important;
      border:1px solid rgba(148,163,184,.15)!important;
      box-shadow:0 12px 30px rgba(0,0,0,.24),0 1px 0 rgba(255,255,255,.025) inset!important;
      border-radius:6px 18px 18px 18px!important;
    }
    .nimo-msg-user{
      align-self:flex-end!important;
      background:linear-gradient(135deg,rgba(91,33,182,.86),rgba(76,29,149,.92))!important;
      border:1px solid rgba(167,139,250,.35)!important;
      box-shadow:0 12px 30px rgba(76,29,149,.2)!important;
      border-radius:18px 18px 6px 18px!important;
    }
    .nimo-msg-actions{gap:8px!important;margin-top:12px!important;display:flex!important;flex-wrap:wrap!important}
    .nimo-action-btn,.nimo-chip{
      border:1px solid rgba(139,92,246,.32)!important;background:rgba(15,18,36,.82)!important;color:#e9d5ff!important;
      border-radius:10px!important;box-shadow:none!important;transition:all .18s ease!important;
    }
    .nimo-action-btn:hover,.nimo-chip:hover{background:rgba(109,40,217,.2)!important;border-color:rgba(167,139,250,.65)!important;transform:translateY(-1px)!important}
    .nimo-suggestions{padding:10px 18px 14px!important;border-top:0!important;background:transparent!important}
    .nimo-input-form{
      margin:0 16px 16px!important;padding:7px!important;border:1px solid rgba(139,92,246,.34)!important;border-radius:14px!important;
      background:linear-gradient(180deg,rgba(11,14,29,.98),rgba(7,9,21,.98))!important;box-shadow:0 10px 34px rgba(0,0,0,.24),0 0 0 1px rgba(255,255,255,.015) inset!important;
    }
    .nimo-input{background:transparent!important;border:0!important;color:#f8fafc!important;padding:10px 12px!important}
    .nimo-input::placeholder{color:#7c849b!important}
    .nimo-input:focus{outline:none!important;box-shadow:none!important}
    .nimo-send-btn{
      width:40px!important;height:40px!important;border-radius:10px!important;border:1px solid rgba(192,132,252,.36)!important;
      background:linear-gradient(135deg,#7c3aed,#5b21b6)!important;color:#fff!important;box-shadow:0 8px 24px rgba(109,40,217,.32)!important;
    }
    .nimo-launcher{
      background:linear-gradient(145deg,rgba(8,10,24,.96),rgba(14,11,34,.98))!important;border:1px solid rgba(139,92,246,.55)!important;
      box-shadow:0 16px 45px rgba(0,0,0,.38),0 0 28px rgba(109,40,217,.15)!important;
    }

    /* ============================================================
       ARCADE OS — neon retro-future dashboard direction
       Existing JS behavior and launcher semantics remain unchanged.
       ============================================================ */
    #arcade-os{
      --arcade-cyan:#18e8ff;--arcade-blue:#2563eb;--arcade-violet:#7c3aed;--arcade-magenta:#d946ef;
      background:
        radial-gradient(circle at 50% 120%,rgba(0,174,255,.26),transparent 37%),
        radial-gradient(circle at 18% 0%,rgba(76,29,149,.22),transparent 36%),
        linear-gradient(180deg,#02030b 0%,#040617 46%,#04030e 100%)!important;
    }
    #arcade-home{
      position:relative!important;overflow:hidden!important;
      background:
        linear-gradient(rgba(55,48,163,.12) 1px,transparent 1px),
        linear-gradient(90deg,rgba(55,48,163,.12) 1px,transparent 1px),
        radial-gradient(ellipse at 50% 112%,rgba(0,174,255,.33),transparent 33%),
        radial-gradient(circle at 50% 25%,rgba(76,29,149,.18),transparent 45%),
        #03040d!important;
      background-size:42px 42px,42px 42px,auto,auto,auto!important;
    }
    #arcade-home::before{
      content:'ARCADE OS';position:absolute;z-index:0;top:7%;left:50%;transform:translateX(-50%);
      font-family:Impact,'Arial Black',system-ui,sans-serif;font-size:clamp(30px,6.5vw,72px);font-style:italic;font-weight:900;letter-spacing:.035em;white-space:nowrap;
      color:#ffbd21;text-shadow:0 4px 0 #e04b15,0 8px 0 rgba(112,30,8,.85),0 0 26px rgba(255,128,0,.26);
      pointer-events:none;
    }
    #arcade-home::after{
      content:'PLAY · CODE · CREATE · REPEAT';position:absolute;z-index:0;top:24%;left:50%;transform:translateX(-50%);
      color:#22d3ee;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:clamp(7px,1.5vw,13px);font-weight:800;letter-spacing:.22em;white-space:nowrap;text-shadow:0 0 18px rgba(34,211,238,.55);pointer-events:none;
    }
    #home-carousel{position:relative!important;z-index:2!important;filter:drop-shadow(0 20px 28px rgba(0,0,0,.34))}
    .app-card{
      border:1px solid rgba(99,102,241,.48)!important;border-radius:14px!important;
      background:linear-gradient(180deg,rgba(13,19,44,.92),rgba(4,8,24,.96))!important;
      box-shadow:0 14px 32px rgba(0,0,0,.36),0 0 0 1px rgba(255,255,255,.025) inset!important;
      transition:transform .18s ease,border-color .18s ease,box-shadow .18s ease,background .18s ease!important;
    }
    .app-card:hover,.app-card.focused,.app-card.is-ui-focused{
      transform:translateY(-4px) scale(1.035)!important;border-color:rgba(34,211,238,.92)!important;
      background:linear-gradient(180deg,rgba(14,30,62,.96),rgba(7,12,34,.98))!important;
      box-shadow:0 18px 44px rgba(0,0,0,.42),0 0 0 1px rgba(34,211,238,.2) inset,0 0 26px rgba(34,211,238,.2),0 0 42px rgba(124,58,237,.13)!important;
    }
    .app-card.system-card{border-color:rgba(217,70,239,.4)!important}
    .app-card.system-card:hover,.app-card.system-card.focused{border-color:rgba(217,70,239,.82)!important;box-shadow:0 18px 44px rgba(0,0,0,.42),0 0 26px rgba(217,70,239,.18)!important}
    .app-icon{filter:drop-shadow(0 10px 10px rgba(0,0,0,.45));transform:translateZ(0)}
    #home-details{position:relative!important;z-index:2!important}
    #home-details .app-group{color:#22d3ee!important;letter-spacing:.18em!important}
    #home-details .app-title{color:#f8fafc!important;text-shadow:0 0 20px rgba(255,255,255,.09)!important}
    #home-details .app-desc{color:#aab4ca!important}
    #home-details .app-status-badge{border:1px solid rgba(34,211,238,.3)!important;background:rgba(8,47,73,.28)!important;color:#67e8f9!important;border-radius:999px!important}
    #home-details .app-hint{color:#818cf8!important}

    .arcade-header,.arcade-topbar,.arcade-status-bar,.arcade-bottom-bar,.system-bar{
      background:linear-gradient(180deg,rgba(10,14,25,.96),rgba(4,7,14,.98))!important;border-color:rgba(100,116,139,.22)!important;
      box-shadow:0 8px 24px rgba(0,0,0,.28)!important;
    }

    @media (max-width:720px){
      .nimo-panel{border-radius:18px!important}
      .nimo-header{min-height:70px!important;padding:12px 14px!important}
      .nimo-messages{padding:16px 14px 10px!important}
      .nimo-input-form{margin:0 10px 10px!important}
      #arcade-home::before{top:6%;font-size:clamp(26px,10vw,50px)}
      #arcade-home::after{top:20%;font-size:7px;letter-spacing:.12em}
    }
  `;
  document.head.appendChild(style);
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
