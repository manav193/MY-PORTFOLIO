const CASE_PROOF = {
  nimo: {
    label: 'FLAGSHIP INTELLIGENCE',
    decisions: [
      ['Local-first intent engine', 'Core navigation and portfolio answers remain available without depending on a hosted language model.'],
      ['Allowlisted actions', 'NIMO resolves requests into controlled portfolio actions instead of executing arbitrary commands.'],
      ['Trilingual interaction', 'English, Hindi and Hinglish are handled by one website-aware intent layer.']
    ],
    evidence: [['75+', 'Developer glossary terms represented in the current knowledge module'], ['3', 'Supported language modes: English, Hindi and Hinglish'], ['Local', 'Primary intent resolution and portfolio navigation path']]
  },
  arcade: {
    label: 'FLAGSHIP INTERFACE',
    decisions: [
      ['Vanilla JavaScript core', 'The operating-system shell stays dependency-light and exposes browser APIs directly.'],
      ['Unified input routing', 'Keyboard, pointer, touch and gamepad interactions share controlled lifecycle boundaries.'],
      ['Desktop-first cabinet', 'The complete cabinet is reserved for capable screens while mobile receives a lighter portfolio path.']
    ],
    evidence: [['PWA', 'Offline-capable application shell and cache lifecycle'], ['Multi-input', 'Keyboard, pointer, touch and gamepad interaction paths'], ['Low-power', 'Dedicated mobile rendering fallback']]
  },
  toolverse: {
    label: 'UTILITY PLATFORM',
    decisions: [
      ['Browser-side processing', 'Supported files are processed locally to reduce unnecessary uploads.'],
      ['Static generation', 'Tool pages are generated from structured modules for repeatable deployment.'],
      ['Offline-safe routing', 'Navigation fallbacks are separated from failed script, style and image requests.']
    ],
    evidence: [['70+', 'Published browser-tool catalog stated by the current product'], ['Local', 'Supported image and document processing path'], ['PWA', 'Manifest and service-worker application shell']]
  },
  shiftzero: {
    label: 'GAME SYSTEM FOUNDATION',
    decisions: [
      ['Layered Godot architecture', 'Presentation, gameplay and services remain separated for maintainability.'],
      ['Data-driven configuration', 'Gameplay parameters are prepared for iteration without scattering constants.'],
      ['Milestone honesty', 'The portfolio distinguishes foundation work from unfinished core gameplay.']
    ],
    evidence: [['Godot 4', 'Current engine foundation'], ['5 layers', 'Dependency-checked architecture described in the case study'], ['CI', 'Repository validation and automated checks']]
  },
  promptai: {
    label: 'AI WORKSPACE CONCEPT',
    decisions: [
      ['Parallel comparison', 'The interface prioritizes side-by-side model output review.'],
      ['Dense information hierarchy', 'Prompt, context and output remain visible without excessive page switching.'],
      ['Concept labeling', 'The project is presented as an interface study rather than a hosted model provider.']
    ],
    evidence: [['Split-pane', 'Comparison-oriented workspace structure'], ['Prototype', 'Clearly labelled project maturity'], ['Responsive', 'Desktop and compact layout direction']]
  },
  love: {
    label: 'NARRATIVE EXPERIENCE',
    decisions: [
      ['Scroll-paced storytelling', 'Content timing follows the emotional sequence rather than a conventional landing-page grid.'],
      ['Native media controls', 'Audio remains user-controlled instead of forced autoplay.'],
      ['Archived status', 'The work is retained as a narrative experiment, not presented as an active product.']
    ],
    evidence: [['Canvas', 'Ambient visual layer'], ['Web Audio', 'Native browser audio capability'], ['Archived', 'Transparent lifecycle status']]
  },
  nintendo: {
    label: 'CONSOLE UX CONCEPT',
    decisions: [
      ['Spatial navigation', 'The layout emphasises fast movement through a game library.'],
      ['Brand familiarity', 'Playful visual cues are retained while density and hierarchy are modernised.'],
      ['Prototype boundary', 'The case study does not claim affiliation with or implementation by Nintendo.']
    ],
    evidence: [['Figma', 'Primary design and prototyping environment'], ['Console UI', 'Interaction domain'], ['Prototype', 'Current project status']]
  },
  nike: {
    label: 'COMMERCE UI CONCEPT',
    decisions: [
      ['Product-first composition', 'Imagery, sizing and purchase actions remain visually prioritised.'],
      ['Kinetic typography', 'Motion language supports performance positioning without replacing usability.'],
      ['Concept boundary', 'The page is presented as independent design work, not an official Nike property.']
    ],
    evidence: [['Figma', 'Primary design environment'], ['Commerce', 'Product exploration and purchase-flow focus'], ['Prototype', 'Current project status']]
  },
  velora: {
    label: 'EDITORIAL HOSPITALITY UI',
    decisions: [
      ['Editorial hierarchy', 'Luxury tone is created through spacing, typography and restrained composition.'],
      ['Reservation clarity', 'Primary conversion actions remain visible across responsive layouts.'],
      ['Fictional concept', 'No real restaurant operation, customer count or verified rating is claimed.']
    ],
    evidence: [['Responsive', 'Desktop and mobile interface direction'], ['Design system', 'Reusable visual tokens'], ['Concept', 'Transparent fictional project status']]
  }
};

function themeKey() {
  const raw = (document.body.dataset.projectTheme || '').toLowerCase();
  if (raw.includes('nimo')) return 'nimo';
  if (raw.includes('arcade')) return 'arcade';
  if (raw.includes('toolverse')) return 'toolverse';
  if (raw.includes('shift')) return 'shiftzero';
  if (raw.includes('prompt')) return 'promptai';
  if (raw.includes('love')) return 'love';
  if (raw.includes('nintendo')) return 'nintendo';
  if (raw.includes('nike')) return 'nike';
  if (raw.includes('velora') || raw.includes('veldora')) return 'velora';
  return null;
}

function mountCaseProof() {
  const key = themeKey();
  const data = CASE_PROOF[key];
  if (!data || document.querySelector('[data-product-proof]')) return;
  const main = document.querySelector('main');
  if (!main) return;
  const section = document.createElement('section');
  section.className = 'product-proof section-shell';
  section.dataset.productProof = key;
  section.innerHTML = `
    <div class="product-proof__heading">
      <p class="proof-eyebrow">${data.label} // ENGINEERING RECORD</p>
      <h2>Decisions, constraints and verifiable evidence.</h2>
      <p>Design rationale is separated from measurable or directly inspectable implementation facts.</p>
    </div>
    <div class="decision-log" aria-label="Decision log">
      ${data.decisions.map(([title, body], index) => `<article><span>0${index + 1}</span><div><h3>${title}</h3><p>${body}</p></div></article>`).join('')}
    </div>
    <div class="proof-evidence" aria-label="Verified project evidence">
      ${data.evidence.map(([value, label]) => `<article><strong>${value}</strong><span>${label}</span></article>`).join('')}
    </div>`;
  const storyLab = main.querySelector('[data-story-lab], .story-lab, section:nth-of-type(2)');
  if (storyLab?.parentNode) storyLab.parentNode.insertBefore(section, storyLab);
  else main.appendChild(section);
}

function frameProjectMedia(card, badge, mode) {
  const media = card.querySelector('.project-media');
  if (!media || media.dataset.framed) return;
  media.dataset.framed = 'true';
  media.classList.add('product-frame', `product-frame--${mode}`);
  const chrome = document.createElement('div');
  chrome.className = 'product-frame__chrome';
  chrome.innerHTML = '<i></i><i></i><i></i><span>LIVE PRODUCT VIEW</span>';
  const tag = document.createElement('span');
  tag.className = 'product-frame__badge';
  tag.textContent = badge;
  media.prepend(chrome);
  media.appendChild(tag);
}

function mountProductGallery() {
  const showcase = document.querySelector('[data-project-showcase]');
  if (!showcase || showcase.dataset.productGallery) return;
  showcase.dataset.productGallery = 'true';
  const arcade = showcase.querySelector('[data-project-id="arcade-os"]');
  const nimo = showcase.querySelector('[data-project-id="nimo"]');
  if (arcade && nimo) {
    const flagship = document.createElement('section');
    flagship.className = 'flagship-pair';
    flagship.innerHTML = '<div class="flagship-pair__intro"><p>FLAGSHIP SYSTEM</p><h3>ArcadeOS is the interface. NIMO is the intelligence.</h3><span>Two connected products form the operating layer of this portfolio.</span></div><div class="flagship-pair__grid"></div>';
    showcase.parentNode.insertBefore(flagship, showcase);
    const grid = flagship.querySelector('.flagship-pair__grid');
    grid.append(arcade, nimo);
    arcade.classList.add('project-card--flagship', 'project-card--interface');
    nimo.classList.add('project-card--flagship', 'project-card--intelligence');
    frameProjectMedia(arcade, 'INTERFACE LAYER', 'desktop');
    frameProjectMedia(nimo, 'INTELLIGENCE LAYER', 'assistant');
  }
  const labels = {
    toolverse: ['SHIPPED WEB PRODUCT', 'browser'],
    'shift-zero': ['GAME SYSTEM', 'game'],
    love: ['NARRATIVE ARCHIVE', 'story'],
    'velora-bites': ['EDITORIAL UI', 'editorial'],
    nintendo: ['CONSOLE CONCEPT', 'console'],
    nike: ['COMMERCE CONCEPT', 'commerce']
  };
  Object.entries(labels).forEach(([id, [badge, mode]]) => {
    const card = showcase.querySelector(`[data-project-id="${id}"]`);
    if (card) frameProjectMedia(card, badge, mode);
  });
}

export function initProductProofGallery() {
  mountProductGallery();
  mountCaseProof();
}
