// app/api/youtube/token/route.js
// Server-side token refresh - koi login nahi, env se refresh token leta hai

let cachedToken = null;
let tokenExpiresAt = 0;

export async function GET() {
  // Cache check - agar valid token hai to wahi return karo
  if (cachedToken && Date.now() < tokenExpiresAt - 60000) {
    return Response.json({ accessToken: cachedToken });
  }

  const refreshToken = process.env.YT_REFRESH_TOKEN;
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!refreshToken || !clientId || !clientSecret) {
    return Response.json(
      { error: 'Missing env vars: YT_REFRESH_TOKEN, GOOGLE_CLIENT_ID, or GOOGLE_CLIENT_SECRET' },
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
      return Response.json({ error: data.error_description || data.error }, { status: 401 });
    }

    // Cache the token
    cachedToken = data.access_token;
    tokenExpiresAt = Date.now() + data.expires_in * 1000;

    return Response.json({ accessToken: data.access_token });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
