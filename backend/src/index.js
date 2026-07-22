import { handleNimoChatRoute } from './routes/nimo.js';

const DEFAULT_ALLOWED_ORIGINS = [
  'http://localhost:8080',
  'http://localhost:5500',
  'http://127.0.0.1:5500',
  'http://localhost:4173',
  'https://my-portfolio-mu-jade-52.vercel.app'
];

function getCorsHeaders(request, env = {}) {
  const rawOrigins = env.ALLOWED_ORIGINS || '';
  const allowedOrigins = rawOrigins
    ? rawOrigins.split(',').map(o => o.trim())
    : DEFAULT_ALLOWED_ORIGINS;

  const origin = request.headers.get('origin');
  let allowOrigin = '*';

  if (origin && (allowedOrigins.includes(origin) || allowedOrigins.includes('*'))) {
    allowOrigin = origin;
  } else if (allowedOrigins.length > 0 && !allowedOrigins.includes('*')) {
    allowOrigin = allowedOrigins[0];
  }

  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400'
  };
}

export default {
  async fetch(request, env = {}, ctx) {
    const corsHeaders = getCorsHeaders(request, env);

    // Handle OPTIONS preflight requests
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: corsHeaders
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
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    // POST /api/nimo/chat
    if (request.method === 'POST' && url.pathname === '/api/nimo/chat') {
      return await handleNimoChatRoute(request, env, corsHeaders);
    }

    // 404 Fallback
    return new Response(JSON.stringify({ error: 'Endpoint not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
};
