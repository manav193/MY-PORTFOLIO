export function initArcadeCinematicScene() {
  const install = () => {
    const home = document.getElementById('arcade-home');
    if (!home) return false;

    home.classList.add('arcade-scene-v3');

    if (!home.querySelector('.arcade-scene-decor')) {
      const decor = document.createElement('div');
      decor.className = 'arcade-scene-decor';
      decor.setAttribute('aria-hidden', 'true');
      decor.innerHTML = `
        <div class="arcade-earth">
          <div class="arcade-earth-glow"></div>
          <div class="arcade-earth-surface"></div>
          <div class="arcade-earth-atmosphere"></div>
        </div>
        <div class="arcade-orbit-line"></div>
        <div class="arcade-rocket">🚀<span class="arcade-rocket-trail"></span></div>
        <div class="arcade-float arcade-float--1">👾</div>
        <div class="arcade-float arcade-float--2">🕹️</div>
        <div class="arcade-float arcade-float--3">🎮</div>
        <div class="arcade-float arcade-float--4">🎨</div>
        <div class="arcade-float arcade-float--5">🔧</div>
        <div class="arcade-float arcade-float--6">🧪</div>
      `;
      home.prepend(decor);
    }

    return true;
  };

  if (!install()) {
    window.setTimeout(install, 150);
    window.setTimeout(install, 600);
    window.setTimeout(install, 1400);
  }

  if (!document.getElementById('arcade-scene-v3-styles')) {
    const style = document.createElement('style');
    style.id = 'arcade-scene-v3-styles';
    style.textContent = `
      #arcade-home.arcade-scene-v3{
        isolation:isolate!important;
        background:
          radial-gradient(circle at 50% 18%,rgba(92,63,255,.18),transparent 30%),
          linear-gradient(180deg,#030714 0%,#05091b 54%,#02050d 100%)!important;
      }
      #arcade-home.arcade-scene-v3:before{
        background:none!important;
        opacity:0!important;
      }
      #arcade-home.arcade-scene-v3:after{
        display:none!important;
      }
      .arcade-scene-decor{
        position:absolute;inset:0;z-index:0;overflow:hidden;pointer-events:none;
      }
      .arcade-earth{
        position:absolute;left:50%;bottom:-38%;width:122%;aspect-ratio:2/1;transform:translateX(-50%);
        border-radius:50% 50% 0 0/100% 100% 0 0;
        background:
          radial-gradient(circle at 52% 18%,rgba(120,226,255,.52) 0 2%,transparent 3%),
          radial-gradient(circle at 35% 28%,rgba(30,114,167,.95) 0 8%,transparent 9%),
          radial-gradient(circle at 64% 24%,rgba(28,154,133,.9) 0 7%,transparent 8%),
          radial-gradient(circle at 47% 36%,rgba(29,103,151,.95) 0 10%,transparent 11%),
          linear-gradient(180deg,#13b8df 0%,#1264b3 28%,#082c6a 58%,#04142f 100%);
        box-shadow:0 -12px 34px rgba(26,213,255,.7),0 -34px 92px rgba(49,74,255,.42);
        filter:saturate(1.18);
      }
      .arcade-earth:before{
        content:"";position:absolute;inset:0;border-radius:inherit;
        background:
          radial-gradient(ellipse at 28% 22%,rgba(74,190,118,.85) 0 6%,transparent 7%),
          radial-gradient(ellipse at 66% 19%,rgba(87,177,118,.8) 0 8%,transparent 9%),
          radial-gradient(ellipse at 48% 31%,rgba(109,190,121,.7) 0 7%,transparent 8%),
          repeating-linear-gradient(90deg,transparent 0 42px,rgba(255,255,255,.025) 43px 44px);
        opacity:.8;
      }
      .arcade-earth:after{
        content:"";position:absolute;left:0;right:0;top:-1px;height:10px;border-radius:50%;
        background:linear-gradient(90deg,transparent,#73efff 20%,#d8ffff 50%,#73efff 80%,transparent);
        box-shadow:0 0 14px #50e8ff,0 0 34px rgba(60,119,255,.85);
      }
      .arcade-earth-glow{position:absolute;inset:-8% -5% 0;border-radius:inherit;box-shadow:inset 0 26px 48px rgba(172,246,255,.18)}
      .arcade-earth-surface{position:absolute;inset:0;border-radius:inherit;background:repeating-linear-gradient(0deg,transparent 0 17px,rgba(255,255,255,.018) 18px 19px);mix-blend-mode:screen}
      .arcade-earth-atmosphere{position:absolute;left:4%;right:4%;top:-4%;height:12%;border-radius:50%;background:radial-gradient(ellipse,rgba(90,236,255,.32),transparent 70%);filter:blur(10px)}
      .arcade-orbit-line{
        position:absolute;left:6%;right:6%;bottom:13%;height:32%;border:1px solid rgba(121,82,255,.34);border-color:rgba(121,82,255,.36) transparent transparent transparent;border-radius:50%;transform:rotate(-5deg);
      }
      .arcade-rocket{
        position:absolute;right:8%;top:15%;font-size:32px;transform:rotate(-37deg);filter:drop-shadow(0 8px 10px rgba(0,0,0,.48));animation:arcadeRocketDrift 6s ease-in-out infinite;
      }
      .arcade-rocket-trail{
        position:absolute;width:70px;height:6px;right:25px;top:23px;border-radius:999px;
        background:linear-gradient(90deg,transparent,rgba(85,226,255,.15),rgba(98,71,255,.7));filter:blur(2px);transform:rotate(4deg);
      }
      .arcade-float{
        position:absolute;font-size:22px;opacity:.72;filter:drop-shadow(0 5px 8px rgba(0,0,0,.45));animation:arcadeFloat 5.4s ease-in-out infinite;
      }
      .arcade-float--1{left:7%;top:18%;font-size:28px;animation-delay:-1.4s}
      .arcade-float--2{left:16%;top:47%;font-size:24px;animation-delay:-3.1s}
      .arcade-float--3{right:17%;top:42%;animation-delay:-2.2s}
      .arcade-float--4{right:7%;top:52%;font-size:21px;animation-delay:-4s}
      .arcade-float--5{left:5%;top:63%;font-size:19px;animation-delay:-.8s}
      .arcade-float--6{right:28%;top:17%;font-size:18px;animation-delay:-2.8s}
      @keyframes arcadeFloat{0%,100%{transform:translate3d(0,0,0) rotate(-4deg)}50%{transform:translate3d(0,-8px,0) rotate(5deg)}}
      @keyframes arcadeRocketDrift{0%,100%{transform:translate3d(0,0,0) rotate(-37deg)}50%{transform:translate3d(-16px,-9px,0) rotate(-33deg)}}

      #arcade-home.arcade-scene-v3 .arcade-cinematic-brand-v2{
        z-index:4!important;margin-top:2px!important;margin-bottom:14px!important;
      }
      #arcade-home.arcade-scene-v3 .arcade-cinematic-title-v2{
        font-size:clamp(52px,9.6vw,92px)!important;
        letter-spacing:-.055em!important;
        filter:drop-shadow(0 5px 0 #7b180c) drop-shadow(0 14px 26px rgba(255,86,18,.35))!important;
      }
      #arcade-home.arcade-scene-v3 .arcade-cinematic-tagline-v2{
        color:#21f0f4!important;text-shadow:0 0 18px rgba(33,240,244,.48)!important;
      }
      #arcade-home.arcade-scene-v3 #home-carousel{
        z-index:4!important;max-width:760px!important;gap:16px!important;padding:10px 4px 16px!important;
      }
      #arcade-home.arcade-scene-v3 .app-card.is-dashboard-visible{
        height:182px!important;border-radius:18px!important;
        background:linear-gradient(180deg,rgba(10,18,46,.9),rgba(3,8,24,.94))!important;
        border:1px solid rgba(115,83,255,.62)!important;
        backdrop-filter:blur(8px);
      }
      #arcade-home.arcade-scene-v3 .app-card.is-dashboard-visible.focused{
        border-color:#17e8ff!important;
        box-shadow:0 0 0 1px rgba(23,232,255,.28),0 0 30px rgba(23,232,255,.26),0 20px 40px rgba(0,0,0,.44)!important;
      }
      #arcade-home.arcade-scene-v3 .arcade-card-icon-v2{font-size:62px!important;min-height:70px!important}
      #arcade-home.arcade-scene-v3 #home-details{
        z-index:4!important;background:rgba(2,7,22,.68)!important;border-color:rgba(67,223,255,.12)!important;backdrop-filter:blur(6px);
      }
      @media(max-width:720px){
        .arcade-earth{width:150%;bottom:-31%}.arcade-rocket{font-size:24px;right:7%}.arcade-float{opacity:.5}
        #arcade-home.arcade-scene-v3 .arcade-cinematic-title-v2{font-size:48px!important}
        #arcade-home.arcade-scene-v3 .app-card.is-dashboard-visible{height:146px!important}
      }
      @media(prefers-reduced-motion:reduce){.arcade-rocket,.arcade-float{animation:none!important}}
    `;
    document.head.appendChild(style);
  }
}
