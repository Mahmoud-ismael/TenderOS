import { getSystemSettings } from '@/lib/data/notifications';

export interface EmailPayload {
  to?: string;
  subject: string;
  headline: string;
  body: string;
  actionText?: string;
  actionUrl?: string;
  severity?: 'info' | 'warning' | 'critical' | 'success';
}

/**
 * Dispatches an email notification via Resend API or logs dispatch details.
 */
export async function sendEmailNotification(
  payload: EmailPayload
): Promise<{ success: boolean; simulated?: boolean; error?: string }> {
  const settings = await getSystemSettings();

  if (!settings.email_notifications_enabled) {
    return { success: true, simulated: true };
  }

  const recipient = payload.to || settings.notification_email || 'tenders@hisako.co.ke';
  const apiKey = settings.resend_api_key || process.env.RESEND_API_KEY;

  const severityColor =
    payload.severity === 'critical'
      ? '#ef4444'
      : payload.severity === 'warning'
      ? '#f59e0b'
      : payload.severity === 'success'
      ? '#10b981'
      : '#06b6d4';

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #09090b; color: #f4f4f5; margin: 0; padding: 24px; }
    .container { max-width: 600px; margin: 0 auto; background-color: #18181b; border: 1px solid #27272a; border-radius: 12px; padding: 32px; }
    .badge { display: inline-block; padding: 4px 10px; border-radius: 9999px; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; background-color: ${severityColor}20; color: ${severityColor}; border: 1px solid ${severityColor}40; margin-bottom: 16px; }
    h1 { font-size: 20px; font-weight: 700; color: #ffffff; margin-top: 0; margin-bottom: 12px; }
    p { font-size: 14px; line-height: 1.6; color: #a1a1aa; margin: 0 0 20px 0; }
    .action-btn { display: inline-block; background-color: #0891b2; color: #ffffff; text-decoration: none; padding: 10px 20px; border-radius: 6px; font-size: 13px; font-weight: 600; }
    .footer { margin-top: 32px; padding-top: 20px; border-top: 1px solid #27272a; font-size: 11px; color: #71717a; }
  </style>
</head>
<body>
  <div class="container">
    <div class="badge">${payload.severity || 'Tender Alert'}</div>
    <h1>${payload.headline}</h1>
    <p>${payload.body}</p>
    ${
      payload.actionUrl
        ? `<p><a href="${payload.actionUrl}" class="action-btn">${payload.actionText || 'View in TenderOS'} →</a></p>`
        : ''
    }
    <div class="footer">
      Sent by TenderOS · Single-Operator Public Procurement Agent for Hisako Tech Solutions Ltd.
    </div>
  </div>
</body>
</html>
`;

  if (!apiKey) {
    console.log(
      `[TenderOS Email Simulated] To: ${recipient} | Subject: ${payload.subject} | Headline: ${payload.headline}`
    );
    return { success: true, simulated: true };
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: 'TenderOS Alerts <notifications@tenderos.hisako.co.ke>',
        to: recipient,
        subject: payload.subject,
        html: htmlContent,
      }),
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson.message || `Resend HTTP error ${res.status}`);
    }

    return { success: true };
  } catch (error: any) {
    console.warn('Resend email dispatch error:', error.message);
    return { success: false, error: error.message };
  }
}
