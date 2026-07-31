const PROJECT_TRUST = {
  'arcade-os': { maturity: 'Interactive Prototype', repo: 'https://github.com/manav193/MY-PORTFOLIO' },
  nimo: { maturity: 'Live Product', repo: 'https://github.com/manav193/NIMO-CORE' },
  toolverse: { maturity: 'Live Product', repo: 'https://github.com/manav193/ToolVerse' },
  'shift-zero': { maturity: 'Interactive Prototype', repo: 'https://github.com/manav193/SHIFT-ZERO' },
  love: { maturity: 'Archived Experiment', repo: '' },
  'velora-bites': { maturity: 'Live Product', repo: 'https://github.com/manav193/VELDORA-BITES' },
  nintendo: { maturity: 'UI Concept', repo: '' },
  nike: { maturity: 'UI Concept', repo: '' },
  promptai: { maturity: 'UI Concept', repo: '' }
};

const SERVICES = [
  { id: 'portfolio', name: 'Portfolio', url: () => `${location.origin}/`, kind: 'site' },
  { id: 'toolverse', name: 'ToolVerse', url: () => 'https://tool-verse-theta.vercel.app/', kind: 'site' },
  { id: 'veldora', name: 'VELDORA', url: () => 'https://veldora-bites.vercel.app/', kind: 'site' },
  { id: 'nimo', name: 'NIMO Worker', url: () => 'https://nimo-core.manav-nimo.workers.dev/api/health', kind: 'worker' }
];

function normalizeRepo(url) {
  try {
    const parsed = new URL(url, location.href);
    if (parsed.hostname !== 'github.com') return '';
    const parts = parsed.pathname.replace(/^\/+|\/+$/g, '').split('/');
    if (parts.length !== 2) return '';
    return `https://github.com/${parts[0]}/${parts[1]}`;
  } catch {
    return '';
  }
}

function applyProjectTrust() {
  document.querySelectorAll('[data-project-id]').forEach(card => {
    const config = PROJECT_TRUST[card.dataset.projectId];
    if (!config) return;

    if (card.dataset.maturity !== config.maturity) card.dataset.maturity = config.maturity;

    let badge = card.querySelector('[data-project-maturity]');
    if (!badge) {
      badge = document.createElement('span');
      badge.className = 'project-maturity-badge';
      badge.dataset.projectMaturity = '';
      const heading = card.querySelector('.project-heading-row, .project-content, h3');
      if (heading?.classList?.contains('project-heading-row')) heading.appendChild(badge);
      else card.querySelector('.project-content')?.prepend(badge);
    }
    if (badge && badge.textContent !== config.maturity) badge.textContent = config.maturity;

    card.querySelectorAll('a[href*="github.com"]').forEach(link => {
      const actual = normalizeRepo(link.href);
      const expected = normalizeRepo(config.repo);
      if (!expected || actual !== expected) {
        link.remove();
        return;
      }
      if (link.href !== `${expected}/` && link.href !== expected) link.href = expected;
      const label = `Open exact ${card.querySelector('h3')?.textContent?.trim() || 'project'} repository on GitHub`;
      if (link.getAttribute('aria-label') !== label) link.setAttribute('aria-label', label);
    });
  });
}

async function probe(service) {
  const started = performance.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 7000);
  try {
    const response = await fetch(service.url(), {
      method: 'GET', cache: 'no-store', signal: controller.signal,
      mode: service.kind === 'worker' ? 'no-cors' : 'cors',
      headers: { Accept: service.kind === 'worker' ? 'application/json' : 'text/html,application/xhtml+xml' }
    });
    return { ok: response.ok || response.type === 'opaque', status: response.status, latency: Math.round(performance.now() - started) };
  } catch (error) {
    return { ok: false, status: 0, latency: Math.round(performance.now() - started), reason: error?.name === 'AbortError' ? 'Timed out' : 'Unreachable' };
  } finally { clearTimeout(timer); }
}

function healthMarkup(service) {
  return `<article class="deployment-health-card is-checking" data-health-service="${service.id}"><div><span class="deployment-health-dot" aria-hidden="true"></span><strong>${service.name}</strong></div><p data-health-state>Checking latest endpoint…</p><small data-health-meta>Live browser probe</small></article>`;
}

function mountHealthDashboard() {
  if (document.body.dataset.projectTheme || document.querySelector('[data-deployment-health-dashboard]')) return;
  const work = document.querySelector('#work');
  if (!work) return;
  const section = document.createElement('section');
  section.className = 'deployment-health-dashboard';
  section.dataset.deploymentHealthDashboard = '';
  section.innerHTML = `<div class="deployment-health-heading"><span>DEPLOYMENT HEALTH</span><h2>Latest public endpoints, checked from this browser.</h2><p>Each status represents the current endpoint response, not an intermediate deployment attempt.</p></div><div class="deployment-health-grid">${SERVICES.map(healthMarkup).join('')}</div><button type="button" class="btn-secondary" data-refresh-health>Refresh health</button>`;
  work.before(section);

  const refresh = async () => {
    const refreshButton = section.querySelector('[data-refresh-health]');
    refreshButton.disabled = true;
    await Promise.all(SERVICES.map(async service => {
      const card = section.querySelector(`[data-health-service="${service.id}"]`);
      if (!card) return;
      card.className = 'deployment-health-card is-checking';
      card.querySelector('[data-health-state]').textContent = 'Checking latest endpoint…';
      const result = await probe(service);
      card.classList.remove('is-checking');
      card.classList.toggle('is-online', result.ok);
      card.classList.toggle('is-offline', !result.ok);
      card.querySelector('[data-health-state]').textContent = result.ok ? 'Operational' : (result.reason || `HTTP ${result.status}`);
      card.querySelector('[data-health-meta]').textContent = `${result.latency} ms · ${result.status ? `HTTP ${result.status}` : 'No response'}`;
    }));
    refreshButton.disabled = false;
    section.dataset.checkedAt = new Date().toISOString();
  };

  section.querySelector('[data-refresh-health]').addEventListener('click', refresh);
  refresh();
}

export function initPortfolioTrust4650() {
  applyProjectTrust();
  mountHealthDashboard();
  const work = document.querySelector('#work');
  if (!work) return;
  let scheduled = false;
  const scheduleTrustRefresh = () => {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => { scheduled = false; applyProjectTrust(); });
  };
  new MutationObserver(scheduleTrustRefresh).observe(work, { childList: true, subtree: true });
}
