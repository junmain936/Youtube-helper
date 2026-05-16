// app/api/youtube/video/route.js
// Session nahi chahiye - server side se apna token leta hai

async function getAccessToken() {
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  const res = await fetch(`${baseUrl}/api/youtube/token`);
  const data = await res.json();
  if (data.error) throw new Error(data.error);
  return data.accessToken;
}

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const videoUrl = searchParams.get('url');
  if (!videoUrl) return Response.json({ error: 'No URL' }, { status: 400 });

  let videoId = null;
  try {
    const u = new URL(videoUrl);
    if (u.hostname.includes('youtu.be')) {
      videoId = u.pathname.slice(1);
    } else {
      videoId = u.searchParams.get('v');
    }
  } catch (e) {
    return Response.json({ error: 'Invalid URL' }, { status: 400 });
  }

  if (!videoId) return Response.json({ error: 'Video ID not found in URL' }, { status: 400 });

  try {
    const accessToken = await getAccessToken();

    const res = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=snippet,status,statistics&id=${videoId}`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    const data = await res.json();
    if (data.error) throw new Error(data.error.message);

    const v = data.items?.[0];
    if (!v) return Response.json({ error: 'Video not found' }, { status: 404 });

    return Response.json({
      video: {
        id: v.id,
        title: v.snippet.title,
        description: v.snippet.description,
        tags: v.snippet.tags || [],
        thumbnail: v.snippet.thumbnails?.maxres?.url || v.snippet.thumbnails?.high?.url || '',
        categoryId: v.snippet.categoryId,
        privacyStatus: v.status?.privacyStatus,
        viewCount: v.statistics?.viewCount || '0',
        likeCount: v.statistics?.likeCount || '0',
        commentCount: v.statistics?.commentCount || '0',
        publishedAt: v.snippet.publishedAt,
      }
    });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
