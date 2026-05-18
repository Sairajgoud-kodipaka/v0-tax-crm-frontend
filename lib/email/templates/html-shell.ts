export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Shared HTML + plain-text footer for all transactional case emails. */
export function buildEmailBodies(params: {
  notificationTitle: string;
  notificationBody: string;
  portalUrl: string;
}): { text: string; html: string } {
  const { notificationTitle: title, notificationBody: body, portalUrl } = params;
  const text = [title, '', body || '', '', `Open your portal: ${portalUrl}`].join('\n');
  const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/></head>
<body style="margin:0;padding:24px;background:#f4fbfa;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;color:#0f172a;line-height:1.5;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:8px;border:1px solid #e2e8f0;overflow:hidden;">
    <tr><td style="padding:20px 24px;background:#0b5c6f;color:#ffffff;font-size:16px;font-weight:600;">Taxfiley</td></tr>
    <tr><td style="padding:24px;">
      <p style="margin:0 0 12px;font-size:18px;font-weight:600;color:#0f172a;">${escapeHtml(title)}</p>
      ${body ? `<p style="margin:0 0 20px;font-size:15px;color:#334155;">${escapeHtml(body)}</p>` : ''}
      <a href="${escapeHtml(portalUrl)}" style="display:inline-block;padding:10px 18px;background:#0b5c6f;color:#ffffff;text-decoration:none;border-radius:6px;font-size:14px;font-weight:600;">Open in portal</a>
      <p style="margin:24px 0 0;font-size:12px;color:#64748b;">If the button does not work, copy this link:<br/><span style="word-break:break-all;">${escapeHtml(portalUrl)}</span></p>
    </td></tr>
  </table>
  <p style="max-width:560px;margin:16px auto 0;text-align:center;font-size:11px;color:#94a3b8;">You are receiving this because of activity on your Taxfiley account.</p>
</body>
</html>`;
  return { text, html };
}
