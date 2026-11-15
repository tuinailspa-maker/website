module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    let body = req.body;
    if (typeof body === 'string') {
      body = JSON.parse(body);
    }
    const { name, email, phone, prize, code, caslConsent, timestamp } = body || {};

    if (!name || !email || !phone || !prize) {
      return res.status(400).json({ error: 'Please fill in all required fields.' });
    }

    const SQUARE_BOOKING_URL =
      'https://book.squareup.com/appointments/3861otg2sucy9o/location/R73A64VPAR34X/services';

    // 1. Lưu dữ liệu khách hàng sang Google Sheets
    if (process.env.SPIN_WEBHOOK_URL) {
      try {
        await fetch(process.env.SPIN_WEBHOOK_URL, {
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
      } catch (sheetErr) {
        console.error('Google Sheets error:', sheetErr);
      }
    }

    // 2. Gửi Email Voucher qua Resend
    if (process.env.RESEND_API_KEY) {
      const emailRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'Tui Nail Spa <rewards@tuinailspa.ca>',
          to: [email],
          subject: `🎁 Your Tui Nail Spa Gift: ${prize} (Code: ${code})`,
          html: `
            <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 520px; margin: 0 auto; border: 1px solid #f3e8ee; border-radius: 16px; overflow: hidden; background-color: #ffffff;">
              <div style="background-color: #881337; padding: 24px; text-align: center; color: #ffffff;">
                <h1 style="margin: 0; font-size: 22px; letter-spacing: 0.5px;">TUI NAIL SPA</h1>
                <p style="margin: 6px 0 0; font-size: 13px; color: #fecdd3;">Official Mystery Bag Reward Voucher</p>
              </div>
              <div style="padding: 28px 24px; text-align: center; color: #1f2937;">
                <p style="font-size: 15px; margin-top: 0;">Hi <strong>${name}</strong>,</p>
                <p style="font-size: 14px; color: #4b5563; line-height: 1.5;">
                  Congratulations! Your complimentary gift is locked in and ready for your visit at Tui Nail Spa:
                </p>
                <div style="background-color: #fff1f2; border: 2px dashed #be123c; border-radius: 12px; padding: 20px; margin: 22px 0;">
                  <p style="margin: 0 0 6px; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #9f1239; font-weight: bold;">Your Reward</p>
                  <h2 style="margin: 0 0 12px; font-size: 22px; color: #111827;">${prize}</h2>
                  <div style="display: inline-block; background-color: #ffffff; padding: 8px 18px; border-radius: 8px; border: 1px solid #fda4af;">
                    <span style="font-family: monospace; font-size: 18px; font-weight: bold; color: #881337; letter-spacing: 1.5px;">${code}</span>
                  </div>
                </div>
                <div style="margin: 24px 0;">
                  <a href="${SQUARE_BOOKING_URL}" style="display: inline-block; background-color: #111827; color: #ffffff; font-weight: bold; font-size: 14px; text-decoration: none; padding: 14px 28px; border-radius: 10px;">
                    Book Your Appointment Now →
                  </a>
                </div>
                <div style="text-align: left; background-color: #f9fafb; padding: 14px 16px; border-radius: 10px; font-size: 12px; color: #4b5563; line-height: 1.6;">
                  <strong>How to redeem at the salon:</strong><br/>
                  • Book your appointment online via Square Appointments.<br/>
                  • Show this email at check-in (Issued to <strong>${name}</strong> • ${phone}).<br/>
                  • Claimed on: ${timestamp} (Valid within 14 days; cannot be combined with other promos).
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

    return res.status(200).json({ success: true });
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Server error' });
  }
};
