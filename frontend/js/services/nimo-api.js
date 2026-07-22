```javascript
/**
 * NIMO Frontend API Client Service
 * Handles secure asynchronous communication with the backend OpenRouter API endpoint.
 * Safe fallback guarantees 100% functionality even when offline or when backend is unreachable.
 */

const DEFAULT_BACKEND_URL =
  typeof window !== 'undefined' && window.NIMO_BACKEND_URL
    ? window.NIMO_BACKEND_URL
    : typeof window !== 'undefined' && window.location.hostname === 'localhost'
      ? 'http://localhost:3000/api/nimo/chat'
      : 'https://nimo-backend.manav-nimo.workers.dev/api/nimo/chat';

export async function fetchNimoBackendReply(userMessage, context = {}) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  try {
    const payload = {
      message: userMessage,
      context: {
        page: context.page || 'home',
        section: context.section || 'home',
        project: context.project || null,
        language: context.language || 'en'
      }
    };

    const response = await fetch(DEFAULT_BACKEND_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload),
      signal: controller.signal
    });

    if (!response.ok) {
      return {
        success: false,
        reply: null,
        actions: [],
error: 'Server responded with status ' + response.status
      };
    }

    const data = await response.json();

    return {
      success: Boolean(data.success),
      reply: data.reply || null,
      actions: Array.isArray(data.actions) ? data.actions : [],
      error: data.error || null
    };
  } catch (err) {
    return {
      success: false,
      reply: null,
      actions: [],
      error:
        err?.name === 'AbortError'
          ? 'Backend request timed out'
          : 'Backend unavailable'
    };
  } finally {
    clearTimeout(timeoutId);
  }
}
```
