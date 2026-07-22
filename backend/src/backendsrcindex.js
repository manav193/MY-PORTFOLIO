import { handleNimoChatRoute } from './routes/nimo.js';

const DEFAULT_ALLOWED_ORIGINS = [
  'http://localhost:8080',
  'http://localhost:5500',
  'http://127.0.0.1:5500',
  'http://localhost:4173',
  'https://my-portfolio-mu-jade-52.vercel.app'
];

function getAllowedOrigins(env) {
  if (!env.ALLOWED_ORIGINS) return DEFAULT_ALLOWED_ORIGINS;

  return env.ALLOWED_ORIGINS
    .split(',')
    .map(origin => origin.trim())
    .filter(Boolean);
}

function buildCorsHeaders(request, env) {
  const origin = request.headers.get('Origin');
  const allowedOrigins = getAllowedOrigins(env);

  const headers = {
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json'
  };

  if (origin && allowedOrigins.includes(origin)) {
    headers['Access-Control-Allow-Origin'] = origin;
    headers['Vary'] = 'Origin';
  }

  return headers;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const corsHeaders = buildCorsHeaders(request, env);

    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: corsHeaders
      });
    }

    if (request.method === 'GET' && url.pathname === '/api/health') {
      return Response.json(
        {
          status: 'ok',
          service: 'NIMO Backend API',
          timestamp: new Date().toISOString()
        },
        {
          headers: corsHeaders
        }
      );
    }

    if (request.method === 'POST' && url.pathname === '/api/nimo/chat') {
      try {
        const body = await request.json();

        // IMPORTANT:
        // Your existing handleNimoChatRoute(req, res, bodyData)
        // is Node-specific if it uses res.writeHead/res.end.
        // It must be adapted to return a Web Response instead.
        return await handleNimoChatRoute(request, env, body, corsHeaders);
      } catch {
        return Response.json(
          {
            success: false,
            error: 'Invalid JSON payload'
          },
          {
            status: 400,
            headers: corsHeaders
          }
        );
      }
    }

    return Response.json(
      {
        error: 'Endpoint not found'
      },
      {
        status: 404,
        headers: corsHeaders
      }
    );
  }
};