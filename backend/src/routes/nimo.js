import { queryOpenRouter } from '../services/openrouter.js';

// Development fallback only. NIMO Core supports a distributed Cloudflare limiter binding.
const ipRateMap = new Map();

function isRateLimited(ip) {
  if (!ip) return false;
  const now = Date.now();
  const windowMs = 60000;
  const maxRequests = 10;
  let timestamps = ipRateMap.get(ip) || [];
  timestamps = timestamps.filter(timestamp => now - timestamp < windowMs);

  if (timestamps.length >= maxRequests) {
    ipRateMap.set(ip, timestamps);
    return true;
  }

  timestamps.push(now);
  ipRateMap.set(ip, timestamps);
  if (ipRateMap.size > 2000) ipRateMap.clear();
  return false;
}

function safeHistory(value) {
  if (!Array.isArray(value)) return [];
  return value
    .slice(-10)
    .filter(item => item && (item.role === 'user' || item.role === 'assistant') && typeof item.content === 'string')
    .map(item => ({ role: item.role, content: item.content.trim().slice(0, 1000) }))
    .filter(item => item.content);
}

export async function handleNimoChatRoute(request, env = {}, corsHeaders = {}) {
  try {
    let bodyData;
    try {
      bodyData = await request.json();
    } catch {
      return new Response(JSON.stringify({ success: false, error: 'Invalid JSON payload' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    const clientIp = request.headers.get('cf-connecting-ip') || request.headers.get('x-forwarded-for') || '127.0.0.1';
    if (isRateLimited(clientIp)) {
      return new Response(JSON.stringify({
        success: false,
        reply: "Easy there 😭 My circuits need a second. ⚡",
        error: 'Rate limit exceeded.'
      }), {
        status: 429,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    const { message, context, history } = bodyData || {};
    if (!message || typeof message !== 'string' || !message.trim()) {
      return new Response(JSON.stringify({ success: false, reply: null, error: 'Message parameter is required.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    if (message.trim().length > 1000) {
      return new Response(JSON.stringify({
        success: false,
        reply: "Whoa, that’s a whole novel 😭 Keep it shorter and I’ll take a look. ⚡",
        error: 'Input exceeds maximum length of 1000 characters.'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    const sanitizedMessage = message.trim().slice(0, 1000);
    const idPattern = /^[a-z0-9][a-z0-9-]{0,63}$/;
    const cleanId = (value, fallback) => {
      const normalized = typeof value === 'string' ? value.trim().toLowerCase() : '';
      return idPattern.test(normalized) ? normalized : fallback;
    };
    const sanitizedContext = {
      page: cleanId(context?.pageId || context?.page, 'home'),
      section: cleanId(context?.sectionId || context?.section, 'work'),
      project: cleanId(context?.projectId || context?.project, null),
      language: ['en', 'hi', 'hinglish'].includes(context?.language) ? context.language : 'en'
    };

    // The legacy provider ignores history today; accepting and validating it keeps the client contract migration-safe.
    const result = await queryOpenRouter(sanitizedMessage, { ...sanitizedContext, history: safeHistory(history) }, env);

    if (!result.success) {
      console.error(JSON.stringify({ event: 'legacy_nimo_failure', error: result.error || 'unknown' }));
      return new Response(JSON.stringify({
        success: false,
        reply: null,
        error: 'Extended assistant service unavailable'
      }), {
        status: 503,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    return new Response(JSON.stringify({
      success: true,
      reply: result.reply,
      actions: [{ label: 'View Projects', navigate: 'index.html#work' }]
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  } catch {
    return new Response(JSON.stringify({
      success: false,
      reply: null,
      error: 'Internal server error processing NIMO request'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
}
