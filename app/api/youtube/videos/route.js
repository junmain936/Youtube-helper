// app/api/youtube/videos/route.js

async function getAccessToken() {
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  const res = await fetch(`${baseUrl}/api/youtube/token`);
  const data = await res.json();
  if (data.error) throw new Error(data.error);
  return data.accessToken;
}

export async function GET(req) {
  try {
    const accessToken = await getAccessToken();

    const channelRes = await fetch(
      'https://www.googleapis.com/youtube/v3/channels?part=contentDetails&mine=true',
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    const channelData = await channelRes.json();
    const uploadsId = channelData.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;
    if (!uploadsId) return Response.json({ error: 'Channel not found' }, { status: 404 });

    const playlistRes = await fetch(
      `https://www.googleapis.com/youtube/v3/playlistItems?part=contentDetails&playlistId=${uploadsId}&maxResults=50`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    const playlistData = await playlistRes.json();
    const videoIds = playlistData.items?.map(i => i.contentDetails.videoId).join(',');
    if (!videoIds) return Response.json({ videos: [] });

    const videosRes = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=snippet,status&id=${videoIds}`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    const videosData = await videosRes.json();

    const videos = videosData.items?.map(v => ({
      id: v.id,
      title: v.snippet.title,
      description: v.snippet.description,
      tags: v.snippet.tags || [],
      thumbnail: v.snippet.thumbnails?.medium?.url || '',
      categoryId: v.snippet.categoryId,
      privacyStatus: v.status?.privacyStatus,
    })) || [];

    return Response.json({ videos });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
