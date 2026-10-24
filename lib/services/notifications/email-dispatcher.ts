import { getSystemSettings } from '@/lib/data/notifications';

export interface EmailPayload {
  to?: string;
  subject: string;
  headline: string;
  body: string;
  actionText?: string;
  actionUrl?: string;
  tenderUrl?: string;
  severity?: 'info' | 'warning' | 'critical' | 'success';
}

/**
 * Dispatches an email notification via Resend API with verified sender and tender addenda links.
 */
export async function sendEmailNotification(
  payload: EmailPayload
): Promise<{ success: boolean; simulated?: boolean; error?: string }> {
  const settings = await getSystemSettings();

  if (!settings.email_notifications_enabled) {
    return { success: true, simulated: true };
  }

  const recipient =
    payload.to ||
    process.env.NOTIFICATION_EMAIL ||
    settings.notification_email ||
    'ismail@hisako.eu';

  const apiKey = settings.resend_api_key || process.env.RESEND_API_KEY;
  const fromEmail =
    process.env.RESEND_FROM_EMAIL ||
    'TenderOS Alerts <alerts@updates.zetafo.com>';

  const appBaseUrl =
    process.env.NEXT_PUBLIC_APP_URL || 'https://hammadhy.vercel.app';

  // Format absolute action URL
  const fullActionUrl = payload.actionUrl
    ? payload.actionUrl.startsWith('http')
      ? payload.actionUrl
      : `${appBaseUrl.replace(/\/$/, '')}${payload.actionUrl.startsWith('/') ? '' : '/'}${payload.actionUrl}`
    : undefined;

  // Format tender link
  const fullTenderUrl = payload.tenderUrl
    ? payload.tenderUrl.startsWith('http')
      ? payload.tenderUrl
      : `https://${payload.tenderUrl}`
    : undefined;

  const severityColor =
    payload.severity === 'critical'
      ? '#ef4444'
      : payload.severity === 'warning'
      ? '#f59e0b'
      : payload.severity === 'success'
      ? '#10b981'
      : '#9333ea';

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #090a0f; color: #f4f4f5; margin: 0; padding: 24px; }
    .container { max-width: 620px; margin: 0 auto; background-color: #121318; border: 1px solid #27272a; border-radius: 12px; padding: 32px; box-shadow: 0 4px 20px rgba(0,0,0,0.5); }
    .badge { display: inline-block; padding: 4px 10px; border-radius: 9999px; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; background-color: ${severityColor}25; color: ${severityColor}; border: 1px solid ${severityColor}50; margin-bottom: 16px; }
    h1 { font-size: 20px; font-weight: 700; color: #ffffff; margin-top: 0; margin-bottom: 14px; line-height: 1.3; }
    p { font-size: 14px; line-height: 1.6; color: #d4d4d8; margin: 0 0 18px 0; }
    
    .tender-link-box { background-color: #1a1726; border: 1px solid #7c3aed50; border-radius: 8px; padding: 16px; margin: 20px 0; }
    .tender-link-title { font-size: 11px; font-weight: 700; text-transform: uppercase; color: #c4b5fd; margin-bottom: 6px; letter-spacing: 0.05em; }
    .tender-link-desc { font-size: 12px; color: #a1a1aa; margin: 0 0 12px 0; line-height: 1.5; }
    .tender-btn { display: inline-block; background-color: #7c3aed; color: #ffffff !important; text-decoration: none; padding: 9px 16px; border-radius: 6px; font-size: 12px; font-weight: 600; }
    
    .action-row { margin-top: 24px; padding-top: 18px; border-top: 1px solid #27272a; }
    .action-btn { display: inline-block; background-color: #27272a; border: 1px solid #3f3f46; color: #ffffff !important; text-decoration: none; padding: 9px 18px; border-radius: 6px; font-size: 12px; font-weight: 600; }
    .footer { margin-top: 32px; padding-top: 20px; border-top: 1px solid #27272a; font-size: 11px; color: #71717a; line-height: 1.5; }
  </style>
</head>
<body>
  <div class="container">
    <div class="badge">${payload.severity || 'Tender Alert'}</div>
    <h1>${payload.headline}</h1>
    <p>${payload.body}</p>

    ${
      fullTenderUrl
        ? `
    <div class="tender-link-box">
      <div class="tender-link-title">Official Government Tender & Addenda Notice</div>
      <p class="tender-link-desc">
        Click below to verify official tender documents, published addendums, corrigenda, or special pre-bid instructions directly on the government portal:
      </p>
      <a href="${fullTenderUrl}" target="_blank" rel="noopener noreferrer" class="tender-btn">
        📄 View Official Tender Notice & Addenda ↗
      </a>
    </div>
        `
        : ''
    }

    ${
      fullActionUrl
        ? `
    <div class="action-row">
      <a href="${fullActionUrl}" class="action-btn">
        ${payload.actionText || 'Open in TenderOS Workspace'} →
      </a>
    </div>
        `
        : ''
    }

    <div class="footer">
      Sent by <strong>TenderOS by Hisako</strong> · Automated Public Procurement Intelligence for Hisako Tech Solutions Ltd.<br>
      Recipient: ${recipient}
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
        from: fromEmail,
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
