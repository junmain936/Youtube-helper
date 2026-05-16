// app/api/youtube/generate-title/route.js

const OPENROUTER_KEYS = [
  process.env.OPENROUTER_KEY_1,
  process.env.OPENROUTER_KEY_2,
  process.env.OPENROUTER_KEY_3,
].filter(Boolean);

async function callOpenRouter(prompt) {
  let lastError = null;
  for (let i = 0; i < OPENROUTER_KEYS.length; i++) {
    try {
      const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENROUTER_KEYS[i]}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
          'X-Title': 'YT Audit',
        },
        body: JSON.stringify({
          model: 'openai/gpt-4o-mini',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.8,
          max_tokens: 100,
        }),
      });
      const data = await res.json();
      if (data.error?.code === 429) { lastError = new Error('Rate limited'); continue; }
      if (data.error) throw new Error(data.error.message);
      return data;
    } catch (e) {
      lastError = e;
      continue;
    }
  }
  throw lastError || new Error('All API keys exhausted');
}

export async function POST(req) {
  const { title, description } = await req.json();
  if (!title) return Response.json({ error: 'Title required' }, { status: 400 });

  const prompt = `You are a YouTube SEO expert. Generate ONE highly optimized YouTube video title.

Current Title: ${title}
Description: ${description?.slice(0, 300) || 'Not provided'}

Rules:
- Between 40-70 characters
- Include power words and emotional triggers
- SEO optimized with relevant keywords
- Engaging and click-worthy
- Return ONLY the title text, nothing else, no quotes, no explanation`;

  try {
    const data = await callOpenRouter(prompt);
    const newTitle = data.choices?.[0]?.message?.content?.trim().replace(/^["']|["']$/g, '');
    if (!newTitle) throw new Error('No response from AI');
    return Response.json({ title: newTitle });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
