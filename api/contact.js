const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function json(res, status, body) {
  res.status(status).setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  return res.json(body);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return json(res, 405, { ok: false, error: 'Method not allowed.' });
  }

  const { name = '', email = '', message = '', website = '' } = req.body || {};
  if (website) return json(res, 200, { ok: true });

  const safeName = String(name).trim().slice(0, 100);
  const safeEmail = String(email).trim().slice(0, 160);
  const safeMessage = String(message).trim().slice(0, 5000);

  if (safeName.length < 2 || !EMAIL_PATTERN.test(safeEmail) || safeMessage.length < 10) {
    return json(res, 400, { ok: false, error: 'Please provide a valid name, email, and message.' });
  }

  const apiKey = process.env.RESEND_API_KEY;
  const destination = process.env.CONTACT_EMAIL || 'monographpixel@gmail.com';
  const from = process.env.CONTACT_FROM || 'Portfolio Contact <onboarding@resend.dev>';
  if (!apiKey) {
    return json(res, 503, { ok: false, error: 'Email delivery is not configured yet.', fallbackEmail: destination });
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from,
        to: [destination],
        reply_to: safeEmail,
        subject: `Portfolio inquiry from ${safeName}`,
        text: `${safeMessage}\n\nName: ${safeName}\nReply to: ${safeEmail}`
      })
    });

    if (!response.ok) {
      console.error('Resend contact failure', response.status, await response.text());
      return json(res, 502, { ok: false, error: 'Email delivery failed. Please use the direct email fallback.', fallbackEmail: destination });
    }

    return json(res, 200, { ok: true });
  } catch (error) {
    console.error('Contact endpoint error', error);
    return json(res, 500, { ok: false, error: 'Email service is temporarily unavailable.', fallbackEmail: destination });
  }
}