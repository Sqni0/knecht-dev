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

  const budgetLabels = {
    klein: 'Landing Page / One-Pager',
    mittel: 'Unternehmensseite',
    gross: 'eigene Software/Anwendung',
    tbd: 'Noch unklar',
  };
  const timelineLabels = {
    asap: 'So schnell wie möglich',
    '1month': 'In 4–6 Wochen',
    '3months': 'In 2–3 Monaten',
    flexible: 'Bin flexibel',
  };
  const budgetLabel = budgetLabels[safe(budget)] || null;
  const timelineLabel = timelineLabels[safe(timeline)] || null;

  const escapeHtml = (v) =>
    safe(v)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');

  // TODO: swap to https://digitknecht.de once its TLS/DNS on this Vercel
  // project is confirmed live (currently fails handshake — MX/TXT for mail
  // are set up, but the web-facing custom domain isn't reliably serving yet).
  const SITE_URL = 'https://knecht-dev.vercel.app';
  const LOGO_URL = `${SITE_URL}/src/img/digitknecht-logo-email.png`;

  const confirmText = [
    `Hallo ${safe(name)},`,
    '',
    'danke für deine Anfrage bei Digitknecht! Wir haben sie erhalten und melden uns innerhalb von 24 Stunden persönlich bei dir.',
    '',
    'Deine Anfrage:',
    budgetLabel ? `Projektart: ${budgetLabel}` : null,
    timelineLabel ? `Zeitrahmen: ${timelineLabel}` : null,
    '',
    'Deine Nachricht:',
    safe(message),
    '',
    'Bis gleich,',
    'Santino',
    'Digitknecht — dein persönlicher Ansprechpartner',
    '',
    'Digitknecht · Inhaber: Alexander Knecht · Oyenstraße 27, 46325 Borken, Deutschland',
    'info@digitknecht.de · digitknecht.de',
  ].filter((line) => line !== null).join('\n');

  const confirmHtml = `
<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Deine Anfrage ist angekommen — Digitknecht</title>
</head>
<body style="margin:0; padding:0; background-color:#f5f5f7; font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f5f5f7; padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px; width:100%; background-color:#ffffff; border:1px solid #e0e0e0; border-radius:16px; overflow:hidden;">

          <tr>
            <td style="padding:32px 40px 24px 40px; border-bottom:1px solid #e0e0e0;">
              <img src="${LOGO_URL}" width="190" height="51" alt="Digitknecht" style="display:block; border:0; outline:none;">
            </td>
          </tr>

          <tr>
            <td style="padding:32px 40px 8px 40px;">
              <p style="margin:0 0 16px 0; font-size:22px; line-height:1.3; font-weight:600; color:#1d1d1f;">
                Hallo ${escapeHtml(name)},
              </p>
              <p style="margin:0 0 16px 0; font-size:16px; line-height:1.6; font-weight:400; color:#1d1d1f;">
                danke für deine Anfrage bei Digitknecht! Wir haben sie erhalten und melden uns innerhalb von 24&nbsp;Stunden persönlich bei dir.
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding:8px 40px 8px 40px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f5f5f7; border:1px solid #e0e0e0; border-radius:14px;">
                <tr>
                  <td style="padding:20px 24px;">
                    <p style="margin:0 0 12px 0; font-size:13px; font-weight:600; letter-spacing:0.02em; text-transform:uppercase; color:#6e6e73;">
                      Deine Anfrage
                    </p>
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="font-size:15px; line-height:1.6; color:#1d1d1f;">
                      ${budgetLabel ? `
                      <tr>
                        <td style="padding:4px 0; width:120px; color:#6e6e73; vertical-align:top;">Projektart</td>
                        <td style="padding:4px 0; vertical-align:top;">${escapeHtml(budgetLabel)}</td>
                      </tr>` : ''}
                      ${timelineLabel ? `
                      <tr>
                        <td style="padding:4px 0; width:120px; color:#6e6e73; vertical-align:top;">Zeitrahmen</td>
                        <td style="padding:4px 0; vertical-align:top;">${escapeHtml(timelineLabel)}</td>
                      </tr>` : ''}
                    </table>
                    <p style="margin:16px 0 0 0; padding-left:14px; border-left:3px solid #0066cc; font-size:15px; line-height:1.6; color:#1d1d1f; white-space:pre-wrap;">${escapeHtml(message)}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td align="left" style="padding:28px 40px 8px 40px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="border-radius:9999px; background-color:#0066cc;">
                    <a href="${SITE_URL}" target="_blank" style="display:inline-block; padding:11px 24px; font-size:15px; font-weight:600; color:#ffffff; text-decoration:none; border-radius:9999px;">
                      Zur Website
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding:28px 40px 8px 40px;">
              <p style="margin:0 0 2px 0; font-size:16px; line-height:1.5; color:#1d1d1f;">Bis gleich,</p>
              <p style="margin:0; font-size:17px; font-weight:600; line-height:1.4; color:#1d1d1f;">Santino</p>
              <p style="margin:2px 0 0 0; font-size:14px; line-height:1.4; color:#6e6e73;">Digitknecht · dein persönlicher Ansprechpartner</p>
            </td>
          </tr>

          <tr>
            <td style="padding:24px 40px 32px 40px; border-top:1px solid #e0e0e0;">
              <p style="margin:0 0 4px 0; font-size:12px; line-height:1.6; color:#6e6e73;">
                Digitknecht &middot; Inhaber: Alexander Knecht &middot; Oyenstraße 27, 46325 Borken, Deutschland
              </p>
              <p style="margin:0; font-size:12px; line-height:1.6; color:#6e6e73;">
                <a href="mailto:info@digitknecht.de" style="color:#6e6e73; text-decoration:underline;">info@digitknecht.de</a>
                &nbsp;&middot;&nbsp;
                <a href="${SITE_URL}" style="color:#6e6e73; text-decoration:underline;">digitknecht.de</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`.trim();

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
        html: confirmHtml,
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
