import { queryOpenRouter } from '../services/openrouter.js';

export async function handleNimoChatRoute(request, env = {}, corsHeaders = {}) {
  try {
    let bodyData = null;
    try {
      bodyData = await request.json();
    } catch (e) {
      return new Response(JSON.stringify({ success: false, error: 'Invalid JSON payload' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    const { message, context } = bodyData || {};

    if (!message || typeof message !== 'string' || !message.trim()) {
      return new Response(JSON.stringify({
        success: false,
        reply: null,
        error: 'Message parameter is required.'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    const sanitizedMessage = message.trim().substring(0, 500);
    const sanitizedContext = {
      page: context?.page ? String(context.page).substring(0, 100) : 'home',
      section: context?.section ? String(context.section).substring(0, 100) : 'work',
      project: context?.project ? String(context.project).substring(0, 100) : null,
      language: context?.language ? String(context.language).substring(0, 20) : 'en'
    };

    const result = await queryOpenRouter(sanitizedMessage, sanitizedContext, env);

    if (!result.success) {
      return new Response(JSON.stringify({
        success: false,
        reply: null,
        error: result.error || 'Extended assistant service unavailable'
      }), {
        status: 503,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    return new Response(JSON.stringify({
      success: true,
      reply: result.reply,
      actions: [
        { label: 'View Projects', navigate: 'index.html#work' }
      ]
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  } catch (err) {
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
