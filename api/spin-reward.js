const PRIZES = [
  { nameEn: 'Cuticle Oil Pen', nameFr: 'Stylo huile à cuticules', code: 'TUI-CUTICLE-PEN', weight: 40 },
  { nameEn: '2-Finger Nail Art', nameFr: 'Nail art 2 ongles', code: 'TUI-2FINGER-ART', weight: 15 },
  { nameEn: 'Collagen', nameFr: 'Collagène', code: 'TUI-COLLAGEN', weight: 10 },
  { nameEn: 'Gel Polish Removal', nameFr: 'Retrait vernis gel', code: 'TUI-GEL-REMOVAL', weight: 10 },
  { nameEn: 'Fragrance Hand Cream', nameFr: 'Crème parfumée pour les mains', code: 'TUI-HAND-CREAM', weight: 15 },
  { nameEn: '$5 Off Your Service', nameFr: '5 $ de rabais sur votre service', code: 'TUI-5OFF-SERVICE', weight: 5 },
  { nameEn: 'Surprise Holiday Treat #1', nameFr: 'Gâterie surprise des Fêtes #1', code: 'TUI-HOLIDAY-TREAT-1', weight: 2 },
  { nameEn: 'Surprise Holiday Treat #2', nameFr: 'Gâterie surprise des Fêtes #2', code: 'TUI-HOLIDAY-TREAT-2', weight: 2 },
  { nameEn: 'Surprise Holiday Treat #3', nameFr: 'Gâterie surprise des Fêtes #3', code: 'TUI-HOLIDAY-TREAT-3', weight: 1 },
];

function escapeHtml(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function drawPrize(lang = 'fr') {
  const totalWeight = PRIZES.reduce((sum, p) => sum + p.weight, 0);
  const rand = Math.random() * totalWeight;
  let cumulative = 0;
  let chosen = PRIZES[0];

  for (const p of PRIZES) {
    cumulative += p.weight;
    if (rand <= cumulative) {
      chosen = p;
      break;
    }
  }

  return {
    prize: lang === 'en' ? chosen.nameEn : chosen.nameFr,
    code: chosen.code,
  };
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const webhookUrl = (process.env.SPIN_WEBHOOK_URL || '').trim();
  const SQUARE_BOOKING_URL = 'https://book.tuinailspa.ca';

  // =========================================================================
  // 1. XỬ LÝ KHI THỢ BẤM NÚT "STAFF: TAP TO REDEEM" TRONG EMAIL (GET)
  // =========================================================================
  if (req.method === 'GET') {
    const { action, email = '', phone = '', name = '', prize = '', code = '', confirm = '' } = req.query || {};

    if (action !== 'redeem') {
      return res.status(200).send('Tui Nail Spa Reward API is running.');
    }

    if (confirm !== 'yes') {
      const confirmUrl = `/api/spin-reward?action=redeem&confirm=yes&email=${encodeURIComponent(email)}&phone=${encodeURIComponent(phone)}&name=${encodeURIComponent(name)}&prize=${encodeURIComponent(prize)}&code=${encodeURIComponent(code)}`;
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      return res.status(200).send(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Staff Voucher Check | Tui Nail Spa</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; background: #fff1f2; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 20px; box-sizing: border-box; }
            .card { max-width: 420px; width: 100%; background: #ffffff; border: 2px solid #881337; border-radius: 20px; padding: 28px 22px; text-align: center; box-shadow: 0 15px 35px rgba(136,19,55,0.12); }
            .badge { display: inline-block; background: #ffe4e6; color: #9f1239; font-size: 11px; font-weight: 700; padding: 5px 12px; border-radius: 999px; text-transform: uppercase; margin-bottom: 12px; }
            h1 { font-size: 22px; color: #111827; margin: 0 0 10px; }
            .info { background: #f9fafb; border: 1px dashed #d1d5db; border-radius: 12px; padding: 14px; margin: 16px 0; font-size: 14px; color: #374151; line-height: 1.6; }
            .btn { display: block; width: 100%; background: #059669; color: #ffffff; font-weight: 700; font-size: 16px; text-decoration: none; padding: 15px; border-radius: 12px; box-sizing: border-box; margin-top: 16px; }
            .warn { font-size: 12px; color: #dc2626; margin-top: 12px; font-weight: 600; }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="badge">🔒 Tui Nail Spa Staff Only</div>
            <h1>Redeem Client Voucher?</h1>
            <div class="info">
              Client: <strong>${escapeHtml(name || email)}</strong><br/>
              Phone: <strong>${escapeHtml(phone)}</strong><br/>
              Gift: <strong style="color:#881337;">${escapeHtml(prize || 'Mystery Gift')}</strong><br/>
              Code: <strong>${escapeHtml(code)}</strong>
            </div>
            <a href="${confirmUrl}" class="btn">✓ STAFF: CONFIRM & MARK USED</a>
            <div class="warn">⚠️ Clients: Do NOT tap the green button above before your visit, or your voucher will be voided!</div>
          </div>
        </body>
        </html>
      `);
    }

    if (!webhookUrl) {
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      return res.status(200).send(`
        <!DOCTYPE html>
        <html><head><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
        <body style="font-family:sans-serif;text-align:center;padding:40px;background:#fef2f2;color:#991b1b;">
          <h2>⚠️ Missing SPIN_WEBHOOK_URL on Vercel</h2>
          <p>Please check your SPIN_WEBHOOK_URL environment variable in Vercel Settings.</p>
        </body></html>
      `);
    }

    try {
      const targetUrl = `${webhookUrl}?action=redeem&email=${encodeURIComponent(email)}&phone=${encodeURIComponent(phone)}`;
      const sheetRes = await fetch(targetUrl, { method: 'GET', redirect: 'follow' });
      const htmlText = await sheetRes.text();
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      return res.status(200).send(htmlText);
    } catch (err) {
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      return res.status(500).send(`<h3>Error connecting to Google Sheets: ${escapeHtml(err.message)}</h3>`);
    }
  }

  // =========================================================================
  // 2. XỬ LÝ KHI KHÁCH CHƠI GAME & NHẬN VOUCHER QUA EMAIL (POST)
  // =========================================================================
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    let body = req.body;
    if (typeof body === 'string') {
      body = JSON.parse(body);
    }
    const { name, email, phone, lang = 'fr', caslConsent, timestamp } = body || {};

    if (!name || !email || !phone) {
      return res.status(400).json({ error: 'Please fill in all required fields.' });
    }

    // Quay thưởng trực tiếp trên server để bảo mật và đồng bộ 1 nguồn duy nhất
    const { prize, code } = drawPrize(lang);

    // 2A. Kiểm tra trùng lặp & lưu dữ liệu sang Google Sheets
    if (webhookUrl) {
      const sheetRes = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          salon: 'Tui Nail Spa',
          name,
          email,
          phone,
          prize,
          code,
          caslConsent: caslConsent ? 'Yes' : 'No',
          timestamp,
        }),
      });

      const sheetData = await sheetRes.json().catch(() => ({}));
      if (sheetData.status === 'duplicate') {
        return res.status(409).json({
          error: sheetData.error || 'This email or phone number has already claimed a gift.',
        });
      }
    }

    const staffRedeemUrl = `https://www.tuinailspa.ca/api/spin-reward?action=redeem&email=${encodeURIComponent(email)}&phone=${encodeURIComponent(phone)}&name=${encodeURIComponent(name)}&prize=${encodeURIComponent(prize)}&code=${encodeURIComponent(code)}`;

    // 2B. Gửi Email Voucher qua Resend
    if (process.env.RESEND_API_KEY) {
      const emailRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY.trim()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'Tui Nail Spa <rewards@tuinailspa.ca>',
          to: [email],
          subject: `🎁 Your Tui Nail Spa Holiday Gift: ${prize} (Code: ${code})`,
          html: `
            <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 520px; margin: 0 auto; border: 1px solid #f3e8ee; border-radius: 16px; overflow: hidden; background-color: #ffffff;">
              <div style="background-color: #881337; padding: 24px; text-align: center; color: #ffffff;">
                <h1 style="margin: 0; font-size: 22px; letter-spacing: 0.5px;">TUI NAIL SPA</h1>
                <p style="margin: 6px 0 0; font-size: 13px; color: #fecdd3;">Holiday Mystery Bag Reward Voucher</p>
              </div>
              <div style="padding: 28px 24px; text-align: center; color: #1f2937;">
                <p style="font-size: 15px; margin-top: 0;">Hi <strong>${escapeHtml(name)}</strong>,</p>
                <p style="font-size: 14px; color: #4b5563; line-height: 1.5;">
                  Congratulations! Your complimentary gift is locked in and ready to redeem during your <strong>December 2026</strong> visit at Tui Nail Spa:
                </p>
                <div style="background-color: #fff1f2; border: 2px dashed #be123c; border-radius: 12px; padding: 20px; margin: 22px 0;">
                  <p style="margin: 0 0 6px; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #9f1239; font-weight: bold;">Your Reward</p>
                  <h2 style="margin: 0 0 10px; font-size: 22px; color: #111827;">${escapeHtml(prize)}</h2>
                  <p style="margin: 0 0 12px; font-size: 12px; font-weight: bold; color: #881337;">🗓️ Valid to redeem: Dec 1 – Dec 31, 2026</p>
                  <div style="display: inline-block; background-color: #ffffff; padding: 8px 18px; border-radius: 8px; border: 1px solid #fda4af;">
                    <span style="font-family: monospace; font-size: 18px; font-weight: bold; color: #881337; letter-spacing: 1.5px;">${escapeHtml(code)}</span>
                  </div>
                </div>
                <div style="margin: 24px 0;">
                  <a href="${SQUARE_BOOKING_URL}" target="_blank" style="display: inline-block; background-color: #111827; color: #ffffff; font-weight: bold; font-size: 14px; text-decoration: none; padding: 14px 28px; border-radius: 10px;">
                    Book Your December Appointment →
                  </a>
                </div>
                <div style="text-align: left; background-color: #f9fafb; padding: 14px 16px; border-radius: 10px; font-size: 12px; color: #4b5563; line-height: 1.6;">
                  <strong>How to redeem at the salon:</strong><br/>
                  - Book your appointment online via Square Appointments.<br/>
                  - Show this email at check-in (Issued to <strong>${escapeHtml(name)}</strong> • ${escapeHtml(phone)}).<br/>
                  - Claimed on: ${escapeHtml(timestamp)} • <strong>Redemption Period: Dec 1 – Dec 31, 2026</strong> (Limit 1 gift per client; cannot be combined with other promos).
                </div>
                <div style="margin-top: 22px; padding-top: 16px; border-top: 1px dashed #e5e7eb;">
                  <p style="margin: 0 0 8px; font-size: 11px; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.5px;">For Tui Nail Spa Staff Only (Do not tap before visit)</p>
                  <a href="${staffRedeemUrl}" target="_blank" style="display: inline-block; background-color: #f3f4f6; color: #374151; border: 1px solid #d1d5db; font-size: 12px; font-weight: bold; text-decoration: none; padding: 10px 18px; border-radius: 8px;">
                    ✓ Staff: Tap to Redeem & Mark Used
                  </a>
                </div>
              </div>
              <div style="background-color: #fdf2f8; padding: 14px; text-align: center; font-size: 11px; color: #6b7280;">
                Tui Nail Spa • <a href="https://tuinailspa.ca" style="color: #881337; text-decoration: none;">tuinailspa.ca</a>
              </div>
            </div>
          `,
        }),
      });

      if (!emailRes.ok) {
        const errText = await emailRes.text();
        return res.status(500).json({ error: 'Resend error: ' + errText });
      }
    }

    // Trả về prize và code để file HTML hiển thị đúng món quà vừa trúng
    return res.status(200).json({ success: true, prize, code });
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Server error' });
  }
};
