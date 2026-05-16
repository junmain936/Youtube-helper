// app/api/youtube/update/route.js

async function getAccessToken() {
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  const res = await fetch(`${baseUrl}/api/youtube/token`);
  const data = await res.json();
  if (data.error) throw new Error(data.error);
  return data.accessToken;
}

export async function POST(req) {
  try {
    const { videoId, title, description, tags, categoryId } = await req.json();
    const accessToken = await getAccessToken();

    const res = await fetch(
      'https://www.googleapis.com/youtube/v3/videos?part=snippet',
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: videoId,
          snippet: {
            title,
            description,
            tags,
            categoryId: categoryId || '27',
          },
        }),
      }
    );
    const data = await res.json();
    if (data.error) throw new Error(data.error.message);
    return Response.json({ success: true });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
