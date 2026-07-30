const CANONICAL_CONTACT_EMAIL = 'monographpixel@gmail.com';
const LEGACY_EMAILS = [
  'monographicalpixel@gmail.com',
  'manavagarwal193@gmail.com'
];

function replaceLegacyEmails(value) {
  let output = String(value || '');
  for (const email of LEGACY_EMAILS) {
    output = output.replaceAll(email, CANONICAL_CONTACT_EMAIL);
  }
  return output;
}

function cleanStoredNimoHistory() {
  try {
    const key = 'nimo_history';
    const raw = sessionStorage.getItem(key);
    if (!raw) return;
    const history = JSON.parse(raw);
    if (!Array.isArray(history)) return;
    const cleaned = history.map(entry => ({
      ...entry,
      text: replaceLegacyEmails(entry?.text)
    }));
    sessionStorage.setItem(key, JSON.stringify(cleaned));
  } catch {
    // Storage can be unavailable in restricted browsing contexts.
  }
}

export function initCanonicalContactEmail() {
  cleanStoredNimoHistory();

  const nimo = window.NIMO;
  if (!nimo || typeof nimo.processUserQuery !== 'function' || nimo.__canonicalContactReady) return;

  const originalProcessUserQuery = nimo.processUserQuery.bind(nimo);
  nimo.processUserQuery = (input) => {
    const normalized = String(input || '').toLowerCase();
    if (/\b(email|e-mail|mail|contact details|contact info|contact manav|reach manav|get in touch)\b/.test(normalized)) {
      return {
        intentId: 'contact_info',
        text: `Manav Agarwal's only official contact email is **${CANONICAL_CONTACT_EMAIL}**.`,
        actions: [{ label: 'Take me to Contact', navigate: 'index.html#contact' }]
      };
    }

    const response = originalProcessUserQuery(input);
    if (response?.text) response.text = replaceLegacyEmails(response.text);
    return response;
  };

  nimo.canonicalContactEmail = CANONICAL_CONTACT_EMAIL;
  nimo.__canonicalContactReady = true;
}
