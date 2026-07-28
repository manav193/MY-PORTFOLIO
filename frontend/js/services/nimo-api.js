/**
 * NIMO frontend API client.
 * Keeps the portfolio UI independent from the standalone NIMO Core service.
 */
function getBackendUrl() {
  if (typeof window !== 'undefined' && window.NIMO_CORE_URL) return window.NIMO_CORE_URL;
  if (typeof window !== 'undefined' && window.NIMO_BACKEND_URL) return window.NIMO_BACKEND_URL;
  if (typeof window !== 'undefined' && window.location.hostname === 'localhost') return '/api/nimo/chat';

  return 'https://nimo-core.manav-nimo.workers.dev/api/nimo/chat';
}

function getBoundedHistory() {
  if (typeof window === 'undefined') return [];

  try {
    const stored = JSON.parse(window.sessionStorage.getItem('nimo_history') || '[]');
    if (!Array.isArray(stored)) return [];

    // The current user message is already sent separately, so exclude the last stored entry.
    return stored
      .slice(-11, -1)
      .filter(item => item && (item.role === 'user' || item.role === 'assistant') && typeof item.text === 'string')
      .map(item => ({ role: item.role, content: item.text.trim().slice(0, 1000) }))
      .filter(item => item.content);
  } catch {
    return [];
  }
}

export async function fetchNimoBackendReply(userMessage, context = {}) {
  const controller = new AbortController();
  // The Worker may try multiple providers sequentially; keep this budget above
  // its bounded failover window so the browser does not cancel valid retries.
  const timeoutId = setTimeout(() => controller.abort(), 26000);

  try {
    const payload = {
      message: userMessage,
      history: getBoundedHistory(),
      context: {
        projectId: context.projectId || context.project || 'portfolio',
        pageId: context.pageId || context.page || 'home',
        sectionId: context.sectionId || context.section || 'home',
        language: context.language || 'en'
      }
    };

    const response = await fetch(getBackendUrl(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal
    });

    if (!response.ok) {
      return {
        success: false,
        reply: null,
        actions: [],
        error: response.status === 429 ? 'Too many requests' : 'Assistant service unavailable'
      };
    }

    const data = await response.json();
    return {
      success: Boolean(data.success),
      reply: typeof data.reply === 'string' ? data.reply : null,
      actions: Array.isArray(data.actions) ? data.actions : [],
      requestId: response.headers.get('X-Request-Id'),
      error: data.error || null
    };
  } catch (error) {
    return {
      success: false,
      reply: null,
      actions: [],
      error: error?.name === 'AbortError' ? 'Backend request timed out' : 'Backend unavailable'
    };
  } finally {
    clearTimeout(timeoutId);
  }
}

// Complex questions need conversational reasoning rather than a single local keyword match.
function shouldUseNimoCore(text) {
  const value = String(text || '').trim().toLowerCase();
  if (!value) return false;

  const comparison = /\b(compare|comparison|difference|different|versus|vs\.?|better|similar|between)\b|\b(difference kya|compare karo|kaunsa better)\b/i;
  const followUp = /^(which|what|why|how|where|when|who)\s+(one|project|app|game)\b|\b(which one|that one|this one|the other one|it|that project|this project|one uses|uses godot)\b/i;
  const reasoning = /\b(explain why|pros and cons|trade-?offs?|recommend|choose|analyse|analyze)\b/i;

  return comparison.test(value) || followUp.test(value) || reasoning.test(value);
}

function readHistory() {
  try {
    const history = JSON.parse(window.sessionStorage.getItem('nimo_history') || '[]');
    return Array.isArray(history) ? history : [];
  } catch {
    return [];
  }
}

function appendHistory(role, text) {
  const history = readHistory();
  history.push({ role, text });
  window.sessionStorage.setItem('nimo_history', JSON.stringify(history.slice(-20)));
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function renderCoreMessage(role, text, extraClass = '') {
  const messages = document.getElementById('nimo-messages');
  if (!messages) return null;

  const bubble = document.createElement('div');
  bubble.className = `nimo-msg nimo-msg-${role} reveal ${extraClass}`.trim();
  bubble.innerHTML = `<div class="nimo-msg-content">${escapeHtml(text)
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n/g, '<br>')}</div>`;
  messages.appendChild(bubble);
  messages.scrollTop = messages.scrollHeight;
  return bubble;
}

async function handleComplexSubmit(event) {
  const form = event.target;
  if (!(form instanceof HTMLFormElement) || form.id !== 'nimo-input-form') return;

  const input = document.getElementById('nimo-input');
  const text = input?.value?.trim();
  if (!shouldUseNimoCore(text)) return;

  event.preventDefault();
  event.stopImmediatePropagation();

  if (!input || input.dataset.nimoCorePending === 'true') return;
  input.dataset.nimoCorePending = 'true';
  input.disabled = true;
  const sendButton = document.getElementById('nimo-send-btn');
  if (sendButton) sendButton.disabled = true;

  input.value = '';
  renderCoreMessage('user', text);
  appendHistory('user', text);

  const typing = document.createElement('div');
  typing.className = 'nimo-msg nimo-msg-assistant nimo-typing';
  typing.innerHTML = '<div class="nimo-typing-dots"><span></span><span></span><span></span></div>';
  document.getElementById('nimo-messages')?.appendChild(typing);

  try {
    const result = await fetchNimoBackendReply(text, {
      page: document.title || 'portfolio',
      section: window.location.hash.replace('#', '') || 'home',
      project: document.body?.dataset?.project || 'portfolio',
      language: document.documentElement.lang || 'en'
    });

    typing.remove();
    const reply = result?.success && result?.reply
      ? result.reply
      : 'I could not reach NIMO Core right now. Please try again in a moment.';
    renderCoreMessage('assistant', reply);
    appendHistory('assistant', reply);
  } catch {
    typing.remove();
    const reply = 'I could not reach NIMO Core right now. Please try again in a moment.';
    renderCoreMessage('assistant', reply);
    appendHistory('assistant', reply);
  } finally {
    input.disabled = false;
    delete input.dataset.nimoCorePending;
    if (sendButton) sendButton.disabled = false;
    input.focus();
  }
}

if (typeof document !== 'undefined') {
  // Capture phase runs before the local intent form handler.
  document.addEventListener('submit', handleComplexSubmit, true);
}
