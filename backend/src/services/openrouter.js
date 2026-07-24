const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

const DEFAULT_MODELS = [
  'google/gemma-4-26b-a4b-it:free',
  'nvidia/nemotron-3-super-120b-a12b:free',
  'openai/gpt-oss-20b:free'
];

const SYSTEM_PROMPT = `You are NIMO, a local-first, website-aware portfolio assistant for Manav Agarwal (Creative Frontend Developer in Hyderabad, India).

PORTFOLIO SUMMARY:
- Owner: Manav Agarwal (Creative Frontend Developer)
- Key Projects: Arcade OS (browser game OS), ToolVerse (70+ PWA tools), SHIFT-ZERO (Godot game UI), LOVE (narrative experiment), Velora Bites (fine dining UI), Nintendo UI (console redesign), Nike Website UI (e-commerce).
- Key Skills: Frontend Engineering (HTML5, Vanilla JS, ES Modules, CSS Grid), UI/UX Design (Figma), PWA & Node SSG, Game Architecture (Canvas, Web Audio, Gamepad API).

BEHAVIOR RULES:
- Be concise, smart, witty, and friendly. Use 1-3 emojis max per response (e.g. 😏 ✨ ⚡ 😭 🚀 🤖).
- Maintain accurate facts about Manav and his portfolio.
- Keep answers under 120 words (1-4 short sentences).
- CODE OUTPUT RESTRICTION: You may output at most 2 LINES of code per response. If asked for large coding tasks (complete websites, full React components, long functions, 100-line scripts), refuse playfully: "Nice try 😏 I’m Manav’s portfolio companion, not your free coding department. I can explain the approach though. ✨"
- Match the user's conversation language (English, Hindi, or Hinglish).
- Return only the final user-facing answer. Never expose reasoning leaks or moderation tags.`;

function sanitizeCodeInReply(replyText) {
  if (!replyText || typeof replyText !== 'string') return replyText;
  
  // Detect code fences ```...```
  const codeBlockRegex = /```[a-z]*\n([\s\S]*?)\n```/gi;
  let sanitized = replyText.replace(codeBlockRegex, (match, codeContent) => {
    const lines = codeContent.split('\n').filter(line => line.trim().length > 0);
    if (lines.length > 2) {
      // If code exceeds 2 lines, cap at 2 lines
      const cappedCode = lines.slice(0, 2).join('\n');
      return `\`\`\`javascript\n${cappedCode}\n// [Code output capped at 2 lines max] ✨\n\`\`\``;
    }
    return match;
  });

  return sanitized;
}

function getModelChain(env = {}) {
  const configuredModels = String(env.OPENROUTER_MODELS || '')
    .split(',')
    .map(model => model.trim())
    .filter(Boolean);

  if (configuredModels.length > 0) {
    return [...new Set(configuredModels)];
  }

  const configuredSingleModel = String(env.OPENROUTER_MODEL || '').trim();
  if (configuredSingleModel && configuredSingleModel !== 'openrouter/free') {
    return [...new Set([configuredSingleModel, ...DEFAULT_MODELS])];
  }

  return DEFAULT_MODELS;
}

function isJunkReply(replyText) {
  const normalized = String(replyText || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');

  if (!normalized) return true;

  const exactJunkReplies = new Set([
    'safe',
    'unsafe',
    'user safety: safe',
    'user safety: unsafe',
    'safety: safe',
    'safety: unsafe',
    'content safety: safe',
    'content safety: unsafe'
  ]);

  if (exactJunkReplies.has(normalized)) return true;
  if (/^(user|content)?\s*safety\s*:\s*(safe|unsafe)$/i.test(normalized)) return true;

  const reasoningLeakPatterns = [
    /^okay,?\s+the user\s+(is asking|asked|wants)/i,
    /^the user\s+(is asking|asked|wants)/i,
    /^let me\s+(analyze|think|check)/i,
    /\bi should:\s*/i,
    /\bthe safest response is\b/i,
    /\blooking at .*portfolio summary\b/i,
    /\bbut since i'm strictly bound\b/i,
    /\bi shouldn't invent\b/i
  ];

  return reasoningLeakPatterns.some(pattern => pattern.test(String(replyText || '').trim()));
}

async function requestModel({ apiKey, model, contextualSystemMessage, userMessage }) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 12000);

  try {
    const response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://my-portfolio-mu-jade-52.vercel.app',
        'X-Title': 'NIMO Portfolio Assistant'
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: contextualSystemMessage },
          { role: 'user', content: userMessage }
        ],
        max_tokens: 200,
        temperature: 0.55
      }),
      signal: controller.signal
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => '');
      return {
        success: false,
        error: `OpenRouter error (${response.status}) for ${model}: ${errText.substring(0, 120)}`
      };
    }

    const data = await response.json();
    let replyText = data.choices?.[0]?.message?.content?.trim();

    if (isJunkReply(replyText)) {
      return {
        success: false,
        error: `Rejected unusable or reasoning-leak response from ${model}`
      };
    }

    replyText = sanitizeCodeInReply(replyText);

    return {
      success: true,
      reply: replyText,
      model
    };
  } catch (err) {
    return {
      success: false,
      error: err?.name === 'AbortError'
        ? `OpenRouter request timed out for ${model}`
        : (err?.message || `OpenRouter request failed for ${model}`)
    };
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function queryOpenRouter(userMessage, context = {}, env = {}) {
  const apiKey = env.OPENROUTER_API_KEY || (typeof process !== 'undefined' ? process.env.OPENROUTER_API_KEY : null);

  if (!apiKey || apiKey === 'your_openrouter_api_key_here') {
    return {
      success: false,
      reply: null,
      error: 'OpenRouter API key is not configured on server.'
    };
  }

  const contextualSystemMessage = `${SYSTEM_PROMPT}\n\nCURRENT USER CONTEXT:\n- Viewing Page: ${context.page || 'Home'}\n- Active Section: ${context.section || 'work'}\n- Active Project: ${context.project || 'None'}\n- Preferred Language: ${context.language || 'English'}`;

  const models = getModelChain(env);
  const errors = [];

  for (const model of models) {
    const result = await requestModel({
      apiKey,
      model,
      contextualSystemMessage,
      userMessage
    });

    if (result.success) {
      return {
        success: true,
        reply: result.reply,
        model: result.model
      };
    }

    errors.push(result.error);
  }

  return {
    success: false,
    reply: null,
    error: errors.join(' | ') || 'All configured OpenRouter models failed.'
  };
}
