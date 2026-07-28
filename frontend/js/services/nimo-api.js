/**
 * NIMO frontend API client.
 * Keeps the portfolio UI independent from the standalone NIMO Core service.
 */
function getBackendUrl() {
  if (typeof window !== 'undefined' && window.NIMO_CORE_URL) return window.NIMO_CORE_URL;
  if (typeof window !== 'undefined' && window.NIMO_BACKEND_URL) return window.NIMO_BACKEND_URL;
  if (typeof window !== 'undefined' && window.location.hostname === 'localhost') return '/api/nimo/chat';

  // Retain the verified production endpoint until NIMO Core is deployed and smoke-tested.
  return 'https://nimo-backend.manav-nimo.workers.dev/api/nimo/chat';
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
  const timeoutId = setTimeout(() => controller.abort(), 12000);

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
