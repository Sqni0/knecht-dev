// Vercel Serverless Function (Node.js runtime). No dependencies —
// uses the global `fetch` (Node 18+) to call the Resend HTTP API directly.

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const TO_ADDRESS = 'info@digitknecht.de';
// Must be an address on a domain verified in Resend.
const FROM_ADDRESS = 'Digitknecht Kontaktformular <kontakt@digitknecht.de>';

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  const body = req.body || {};
  const { name, email, budget, timeline, message, company } = body;

  // Honeypot: bots fill every field. Pretend success, don't tip them off.
  if (typeof company === 'string' && company.trim() !== '') {
    return res.status(200).json({ ok: true });
  }

  if (typeof name !== 'string' || !name.trim()) {
    return res.status(400).json({ ok: false, error: 'Name fehlt.' });
  }
  if (typeof email !== 'string' || !EMAIL_RE.test(email.trim())) {
    return res.status(400).json({ ok: false, error: 'Gültige E-Mail-Adresse fehlt.' });
  }
  if (typeof message !== 'string' || !message.trim()) {
    return res.status(400).json({ ok: false, error: 'Nachricht fehlt.' });
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error('RESEND_API_KEY is not set');
    return res.status(500).json({ ok: false, error: 'Serverfehler. Bitte versuch es später erneut.' });
  }

  const safe = (v) => (typeof v === 'string' ? v.trim() : '');
  const notifyText = [
    `Name: ${safe(name)}`,
    `E-Mail: ${safe(email)}`,
    `Projektart: ${safe(budget) || '–'}`,
    `Zeitrahmen: ${safe(timeline) || '–'}`,
    '',
    'Nachricht:',
    safe(message),
  ].join('\n');

  const confirmText = [
    `Hallo ${safe(name)},`,
    '',
    'danke für deine Anfrage bei Digitknecht! Wir haben sie erhalten und melden uns innerhalb von 24 Stunden persönlich bei dir.',
    '',
    'Deine Nachricht:',
    safe(message),
    '',
    'Bis gleich,',
    'Santino von Digitknecht',
  ].join('\n');

  const sendEmail = (payload) =>
    fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

  try {
    // Notification to us — must succeed, it's the whole point of the form.
    const notifyRes = await sendEmail({
      from: FROM_ADDRESS,
      to: [TO_ADDRESS],
      reply_to: safe(email),
      subject: `Neue Anfrage von ${safe(name)} (Kontaktformular)`,
      text: notifyText,
    });

    if (!notifyRes.ok) {
      const errText = await notifyRes.text();
      console.error('Resend API error (notify):', notifyRes.status, errText);
      return res.status(502).json({ ok: false, error: 'E-Mail konnte nicht gesendet werden.' });
    }

    // Confirmation to the sender — best-effort, doesn't fail the request.
    try {
      const confirmRes = await sendEmail({
        from: FROM_ADDRESS,
        to: [safe(email)],
        reply_to: TO_ADDRESS,
        subject: 'Deine Anfrage ist angekommen — Digitknecht',
        text: confirmText,
      });
      if (!confirmRes.ok) {
        const errText = await confirmRes.text();
        console.error('Resend API error (confirmation):', confirmRes.status, errText);
      }
    } catch (err) {
      console.error('Confirmation email failed:', err);
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Resend request failed:', err);
    return res.status(500).json({ ok: false, error: 'Serverfehler. Bitte versuch es später erneut.' });
  }
};
