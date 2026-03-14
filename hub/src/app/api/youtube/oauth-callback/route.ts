import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code');
  const error = request.nextUrl.searchParams.get('error');

  if (error) {
    return new NextResponse(
      `<html><body style="font-family:system-ui;background:#0f172a;color:#fff;padding:40px;">
        <h1 style="color:#ef4444;">❌ OAuth Error</h1>
        <p>${error}</p>
        <a href="/" style="color:#60a5fa;">← Back to Hub</a>
      </body></html>`,
      { headers: { 'Content-Type': 'text/html' } }
    );
  }

  if (!code) {
    return new NextResponse(
      `<html><body style="font-family:system-ui;background:#0f172a;color:#fff;padding:40px;">
        <h1 style="color:#f59e0b;">⚠️ No code received</h1>
        <p>No authorization code was provided.</p>
        <a href="/" style="color:#60a5fa;">← Back to Hub</a>
      </body></html>`,
      { headers: { 'Content-Type': 'text/html' } }
    );
  }

  try {
    const oauth2Client = new google.auth.OAuth2(
      process.env.YOUTUBE_CLIENT_ID,
      process.env.YOUTUBE_CLIENT_SECRET,
      `${request.nextUrl.origin}/api/youtube/oauth-callback`
    );

    const { tokens } = await oauth2Client.getToken(code);

    return new NextResponse(
      `<html><body style="font-family:system-ui;background:#0f172a;color:#fff;padding:40px;">
        <h1 style="color:#22c55e;">✅ YouTube OAuth Success!</h1>
        <p>Copy the refresh token below and add it to your <code>.env.local</code>:</p>
        <div style="background:#1e293b;padding:16px;border-radius:8px;margin:20px 0;word-break:break-all;">
          <strong>YOUTUBE_REFRESH_TOKEN=</strong><br/>
          <code style="color:#34d399;font-size:14px;">${tokens.refresh_token || 'N/A (no refresh token returned - try again with prompt=consent)'}</code>
        </div>
        <p style="color:#94a3b8;font-size:14px;">Access token expires: ${tokens.expiry_date ? new Date(tokens.expiry_date).toISOString() : 'N/A'}</p>
        <p style="margin-top:20px;">After adding the token, restart the dev server.</p>
        <a href="/" style="color:#60a5fa;">← Back to Hub</a>
      </body></html>`,
      { headers: { 'Content-Type': 'text/html' } }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return new NextResponse(
      `<html><body style="font-family:system-ui;background:#0f172a;color:#fff;padding:40px;">
        <h1 style="color:#ef4444;">❌ Token Exchange Failed</h1>
        <p>${message}</p>
        <a href="/" style="color:#60a5fa;">← Back to Hub</a>
      </body></html>`,
      { headers: { 'Content-Type': 'text/html' } }
    );
  }
}
