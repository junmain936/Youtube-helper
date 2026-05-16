// app/api/youtube/token/route.js

let cachedToken = null;
let tokenExpiresAt = 0;

export async function GET() {
  if (cachedToken && Date.now() < tokenExpiresAt - 60000) {
    return Response.json({ accessToken: cachedToken });
  }

  const refreshToken = process.env.YT_REFRESH_TOKEN;
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!refreshToken || !clientId || !clientSecret) {
    return Response.json(
      { error: `Missing env: ${!refreshToken ? 'YT_REFRESH_TOKEN ' : ''}${!clientId ? 'GOOGLE_CLIENT_ID ' : ''}${!clientSecret ? 'GOOGLE_CLIENT_SECRET' : ''}` },
      { status: 500 }
    );
  }

  try {
    const res = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
    });

    const data = await res.json();

    if (data.error) {
      return Response.json(
        { error: `Google OAuth error: ${data.error} — ${data.error_description}` },
        { status: 401 }
      );
    }

    cachedToken = data.access_token;
    tokenExpiresAt = Date.now() + data.expires_in * 1000;

    return Response.json({ accessToken: data.access_token });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
