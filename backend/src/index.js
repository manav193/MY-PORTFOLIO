import { handleNimoChatRoute } from './routes/nimo.js';

const DEFAULT_ALLOWED_ORIGINS = [
  'http://localhost:8080',
  'http://localhost:5500',
  'http://127.0.0.1:5500',
  'http://localhost:4173',
  'https://my-portfolio-mu-jade-52.vercel.app'
];

function getCorsInfo(request, env = {}) {
  const rawOrigins = env.ALLOWED_ORIGINS || '';
  const allowedOrigins = rawOrigins
    ? rawOrigins.split(',').map(o => o.trim())
    : DEFAULT_ALLOWED_ORIGINS;

  const origin = request.headers.get('origin');

  // Direct server-to-server or non-browser requests without Origin header
  if (!origin) {
    return {
      isAllowed: true,
      headers: {}
    };
  }

  // Exact origin match or wildcard allowlist
  if (allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
    return {
      isAllowed: true,
      headers: {
        'Access-Control-Allow-Origin': origin,
        'Vary': 'Origin',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Max-Age': '86400'
      }
    };
  }

  // Unauthorized origin
  return {
    isAllowed: false,
    headers: {}
  };
}

export default {
  async fetch(request, env = {}, ctx) {
    const cors = getCorsInfo(request, env);

    // Reject unauthorized cross-origin requests & preflights
    if (!cors.isAllowed) {
      return new Response(JSON.stringify({ error: 'Origin not allowed' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Handle OPTIONS preflight requests for allowed origins
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: cors.headers
      });
    }

    const url = new URL(request.url);

    // GET /api/health
    if (request.method === 'GET' && url.pathname === '/api/health') {
      return new Response(JSON.stringify({
        status: 'ok',
        service: 'NIMO Cloudflare Worker',
        timestamp: new Date().toISOString()
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...cors.headers }
      });
    }

    // POST /api/nimo/chat
    if (request.method === 'POST' && url.pathname === '/api/nimo/chat') {
      return await handleNimoChatRoute(request, env, cors.headers);
    }

    // 404 Fallback
    return new Response(JSON.stringify({ error: 'Endpoint not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json', ...cors.headers }
    });
  }
};
