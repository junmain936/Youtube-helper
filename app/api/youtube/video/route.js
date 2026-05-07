export async function GET(req) {
  const authHeader = req.headers.get('authorization');
  const accessToken = authHeader?.replace('Bearer ', '');
  if (!accessToken) return Response.json({ error: 'No token' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const videoUrl = searchParams.get('url');
  if (!videoUrl) return Response.json({ error: 'No URL' }, { status: 400 });

  // Extract video ID from URL
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
