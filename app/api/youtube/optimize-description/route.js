import { NextResponse } from 'next/server';

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
          model: 'mistralai/mistral-7b-instruct',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.7,
          max_tokens: 1000,
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

  const prompt = `You are a YouTube SEO expert. Enhance this YouTube video description to maximize SEO score and viewer engagement.

Video Title: ${title}
Current Description: ${description}

Rules:
- Keep the original meaning and content intact
- Make it at least 200 characters long
- Add relevant keywords naturally
- Add a placeholder timestamps section like:
  00:00 Introduction
  (add 3-4 relevant timestamp placeholders based on title)
- Add a call to action (like, subscribe, comment)
- Add placeholder social links section like:
  🔗 Follow us:
  Twitter: https://twitter.com/yourchannel
  Instagram: https://instagram.com/yourchannel
- Use emojis for readability
- Return ONLY the enhanced description text, nothing else, no explanation`;

  try {
    const data = await callOpenRouter(prompt);
    const optimized = data.choices?.[0]?.message?.content?.trim();
    if (!optimized) throw new Error('No response from AI');
    return NextResponse.json({ description: optimized });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
