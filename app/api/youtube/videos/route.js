import { getAccessToken } from '@/lib/getAccessToken';

export async function GET() {
  try {
    const accessToken = await getAccessToken();

    const channelRes = await fetch(
      'https://www.googleapis.com/youtube/v3/channels?part=contentDetails&mine=true',
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    const channelData = await channelRes.json();
    if (channelData.error) throw new Error(channelData.error.message);

    const uploadsId = channelData.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;
    if (!uploadsId) return Response.json({ error: 'Channel not found' }, { status: 404 });

    const playlistRes = await fetch(
      `https://www.googleapis.com/youtube/v3/playlistItems?part=contentDetails&playlistId=${uploadsId}&maxResults=5`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    const playlistData = await playlistRes.json();
    const videoIds = playlistData.items?.map(i => i.contentDetails.videoId).join(',');
    if (!videoIds) return Response.json({ videos: [] });

    const videosRes = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=snippet,status,statistics&id=${videoIds}`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    const videosData = await videosRes.json();

    const videos = videosData.items?.map(v => ({
      id: v.id,
      title: v.snippet.title,
      description: v.snippet.description,
      tags: v.snippet.tags || [],
      thumbnail: v.snippet.thumbnails?.medium?.url || v.snippet.thumbnails?.high?.url || '',
      categoryId: v.snippet.categoryId,
      privacyStatus: v.status?.privacyStatus,
      viewCount: v.statistics?.viewCount || '0',
      likeCount: v.statistics?.likeCount || '0',
      commentCount: v.statistics?.commentCount || '0',
      publishedAt: v.snippet.publishedAt,
    })) || [];

    return Response.json({ videos });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
