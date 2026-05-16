// app/api/debug/route.js
// TEMPORARY - debugging ke baad delete karna

export async function GET() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const refreshToken = process.env.YT_REFRESH_TOKEN;

  // Env check
  const envCheck = {
    clientId: clientId ? clientId.slice(0, 20) + '...' : 'MISSING',
    clientSecret: clientSecret ? clientSecret.slice(0, 10) + '...' : 'MISSING',
    refreshToken: refreshToken ? refreshToken.slice(0, 20) + '...' : 'MISSING',
  };

  // Google token call
  let tokenResult = null;
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
    tokenResult = await res.json();
  } catch (e) {
    tokenResult = { fetchError: e.message };
  }

  return Response.json({ envCheck, tokenResult });
}
