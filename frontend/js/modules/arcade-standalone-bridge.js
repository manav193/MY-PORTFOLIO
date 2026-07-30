const REPOSITORY_URL = 'https://github.com/manav193/ARCADE-OS';

export function initArcadeStandaloneBridge() {
  if (document.documentElement.dataset.arcadeStandaloneBridge === 'ready') return;
  document.documentElement.dataset.arcadeStandaloneBridge = 'ready';
  injectStyles();
  updateProjectCard();
  updateCabinetBootActions();
  mountCabinetLinkPanel();

  document.addEventListener('click', event => {
    const launcher = event.target.closest('[data-launch-standalone-arcade]');
    if (!launcher) return;
    event.preventDefault();
    openRepository();
  });

  window.ArcadeStandalone = {
    repository: REPOSITORY_URL,
    openRepository
  };
}

function openRepository() {
  const opened = window.open(REPOSITORY_URL, '_blank');
  if (opened) {
    try { opened.opener = null; } catch {}
  } else {
    window.location.assign(REPOSITORY_URL);
  }
}

function updateProjectCard() {
  const card = document.querySelector('[data-project-id="arcade-os"]');
  if (!card) return;
  card.dataset.standaloneLinked = 'true';

  const title = card.querySelector('h3');
  if (title) title.textContent = 'ArcadeOS — Standalone Browser System';

  const type = card.querySelector('.project-type');
  if (type) type.textContent = 'Standalone browser OS + portfolio cabinet';

  const value = card.querySelector('.project-value');
  if (value) value.textContent = 'A standalone browser-based arcade operating system with draggable apps, six playable games, local persistence, procedural audio, NIMO-authorized Overdrive controls, diagnostics, and a separate cinematic cabinet presentation inside this portfolio.';

  const actions = card.querySelector('.project-actions');
  if (!actions) return;

  let source = actions.querySelector('[data-launch-standalone-arcade]');
  if (!source) {
    source = document.createElement('a');
    source.href = REPOSITORY_URL;
    source.target = '_blank';
    source.rel = 'noopener noreferrer';
    source.className = 'btn-primary arcade-standalone-launch';
    source.dataset.launchStandaloneArcade = '';
    source.textContent = 'Open Standalone Repository';
    actions.prepend(source);
  }

  const repo = [...actions.querySelectorAll('a')].find(link => link.textContent.trim().toLowerCase() === 'github');
  if (repo) repo.href = REPOSITORY_URL;

  const embedded = actions.querySelector('[data-enter-arcade]');
  if (embedded) {
    embedded.classList.remove('btn-primary');
    embedded.classList.add('btn-secondary');
    embedded.textContent = 'View Cabinet Experience';
  }
}

function updateCabinetBootActions() {
  const choices = document.querySelector('.boot-choice');
  if (!choices || choices.querySelector('[data-launch-standalone-arcade]')) return;
  const link = document.createElement('a');
  link.href = REPOSITORY_URL;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  link.dataset.launchStandaloneArcade = '';
  link.textContent = 'OPEN ARCADEOS REPOSITORY';
  choices.insertBefore(link, choices.lastElementChild);
}

function mountCabinetLinkPanel() {
  const screen = document.querySelector('#cabinet-screen');
  if (!screen || screen.querySelector('[data-standalone-link-panel]')) return;
  const panel = document.createElement('div');
  panel.className = 'arcade-standalone-panel';
  panel.dataset.standaloneLinkPanel = '';
  panel.innerHTML = `
    <span class="arcade-standalone-panel__status"><i></i> SOURCE REPOSITORY LINKED</span>
    <div>
      <strong>ARCADEOS 2.0</strong>
      <small>Independent public repository</small>
    </div>
    <button type="button" data-launch-standalone-arcade>OPEN ↗</button>
  `;
  screen.appendChild(panel);
}

function injectStyles() {
  if (document.querySelector('style[data-arcade-standalone-styles]')) return;
  const style = document.createElement('style');
  style.dataset.arcadeStandaloneStyles = '';
  style.textContent = `
    .arcade-standalone-panel{position:absolute;z-index:18;left:14px;right:14px;bottom:12px;display:grid;grid-template-columns:auto 1fr auto;align-items:center;gap:10px;padding:9px 10px;border:1px solid rgba(103,232,249,.22);border-radius:8px;background:rgba(2,7,16,.82);box-shadow:0 12px 28px rgba(0,0,0,.24),inset 0 0 20px rgba(103,232,249,.03);backdrop-filter:blur(12px);font-family:'JetBrains Mono',monospace}
    .arcade-standalone-panel__status{position:absolute;left:10px;top:-17px;display:flex;align-items:center;gap:5px;color:#67e8f9;font-size:.43rem;letter-spacing:.09em}
    .arcade-standalone-panel__status i{width:5px;height:5px;border-radius:50%;background:#22c55e;box-shadow:0 0 8px #22c55e}
    .arcade-standalone-panel>div{display:grid;gap:2px}.arcade-standalone-panel strong{color:#fff;font-size:.56rem;letter-spacing:.12em}.arcade-standalone-panel small{color:#718096;font-size:.43rem}
    .arcade-standalone-panel button{padding:7px 9px;border:1px solid rgba(103,232,249,.3);border-radius:6px;background:rgba(103,232,249,.08);color:#67e8f9;font:700 .48rem 'JetBrains Mono',monospace;cursor:pointer;transition:background .2s ease,transform .2s ease}.arcade-standalone-panel button:hover{transform:translateY(-1px);background:rgba(103,232,249,.15)}
    [data-project-id="arcade-os"][data-standalone-linked="true"] .project-media:after{content:'STANDALONE REPOSITORY';position:absolute;right:12px;bottom:12px;padding:6px 8px;border:1px solid rgba(103,232,249,.3);border-radius:999px;background:rgba(2,7,16,.78);color:#67e8f9;font:700 .56rem 'JetBrains Mono',monospace;letter-spacing:.08em;backdrop-filter:blur(8px)}
    .arcade-standalone-launch{box-shadow:0 0 24px rgba(103,232,249,.12)}
    @media(max-width:700px){.arcade-standalone-panel{grid-template-columns:1fr auto}.arcade-standalone-panel>span{display:none}.arcade-standalone-panel small{display:none}}
  `;
  document.head.appendChild(style);
}