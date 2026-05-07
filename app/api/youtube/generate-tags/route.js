// app/api/youtube/generate-tags/route.js
import { NextResponse } from 'next/server';

export async function POST(req) {
  const { title, description } = await req.json();

  if (!title && !description) {
    return NextResponse.json({ error: 'Title or description required' }, { status: 400 });
  }

  const prompt = `You are a YouTube SEO expert. Generate exactly 20 highly relevant, trending, and search-optimized YouTube tags for the following video.

Video Title: ${title}
Video Description: ${description?.slice(0, 500) || 'Not provided'}

Rules:
- Mix short (1-2 words) and long-tail (3-5 words) tags
- Include trending variations and related search terms
- Tags should have high search volume on YouTube
- No hashtags, no # symbol
- Return ONLY a JSON array of strings, nothing else
- Example: ["tag one", "tag two", "tag three"]

Return ONLY the JSON array, no explanation.`;

  try {
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
        'X-Title': 'YT Audit',
      },
      body: JSON.stringify({
        model: 'mistralai/mistral-7b-instruct',  // fast + free tier available
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    const data = await res.json();

    if (data.error) throw new Error(data.error.message || 'OpenRouter error');

    const rawText = data.choices?.[0]?.message?.content?.trim();

    // Safe JSON parse
    const jsonMatch = rawText.match(/\[[\s\S]*\]/);
    if (!jsonMatch) throw new Error('Invalid response format from AI');

    const tags = JSON.parse(jsonMatch[0]);

    if (!Array.isArray(tags)) throw new Error('Tags not in array format');

    return NextResponse.json({ tags: tags.slice(0, 20) });

  } catch (e) {
    console.error('Generate tags error:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
