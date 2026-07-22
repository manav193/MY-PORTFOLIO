const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

const SYSTEM_PROMPT = `You are NIMO, a local-first, website-aware portfolio assistant for Manav Agarwal (Creative Frontend Developer in Hyderabad, India).

PORTFOLIO SUMMARY:
- Owner: Manav Agarwal (Creative Frontend Developer)
- Key Projects: Arcade OS (browser game OS), ToolVerse (70+ PWA tools), SELFYY (cinematic memories), SHIFT-ZERO (Godot game UI), LOVE (narrative experiment), Velora Bites (fine dining UI), Nintendo UI (console redesign), Nike Website UI (e-commerce).
- Key Skills: Frontend Engineering (HTML5, Vanilla JS, ES Modules, CSS Grid), UI/UX Design (Figma), PWA & Node SSG, Game Architecture (Canvas, Web Audio, Gamepad API).

BEHAVIOR RULES:
- Be concise, helpful, and friendly.
- Maintain accurate facts about Manav and his portfolio.
- Never invent fake credentials, fake companies, or fake AI capabilities.
- Match the user's conversation language (English, Hindi, or Hinglish).`;

export async function queryOpenRouter(userMessage, context = {}, env = {}) {
  const apiKey = env.OPENROUTER_API_KEY || (typeof process !== 'undefined' ? process.env.OPENROUTER_API_KEY : null);
  const model = env.OPENROUTER_MODEL || (typeof process !== 'undefined' ? process.env.OPENROUTER_MODEL : null) || 'meta-llama/llama-3.3-70b-instruct:free';

  if (!apiKey || apiKey === 'your_openrouter_api_key_here') {
    return {
      success: false,
      reply: null,
      error: 'OpenRouter API key is not configured on server.'
    };
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  try {
    const contextualSystemMessage = `${SYSTEM_PROMPT}\n\nCURRENT USER CONTEXT:\n- Viewing Page: ${context.page || 'Home'}\n- Active Section: ${context.section || 'work'}\n- Active Project: ${context.project || 'None'}\n- Preferred Language: ${context.language || 'English'}`;

    const response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://my-portfolio-mu-jade-52.vercel.app',
        'X-Title': 'NIMO Portfolio Assistant'
      },
      body: JSON.stringify({
        model: model,
        messages: [
          { role: 'system', content: contextualSystemMessage },
          { role: 'user', content: userMessage }
        ],
        max_tokens: 300,
        temperature: 0.7
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errText = await response.text().catch(() => '');
      return {
        success: false,
        reply: null,
        error: `OpenRouter error (${response.status}): ${errText.substring(0, 100)}`
      };
    }

    const data = await response.json();
    const replyText = data.choices?.[0]?.message?.content?.trim();

    if (!replyText) {
      return {
        success: false,
        reply: null,
        error: 'Empty response payload from provider.'
      };
    }

    return {
      success: true,
      reply: replyText
    };
  } catch (err) {
    clearTimeout(timeoutId);
    return {
      success: false,
      reply: null,
      error: err.name === 'AbortError' ? 'OpenRouter request timed out.' : err.message
    };
  }
}
