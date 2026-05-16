'use client';
import { useState } from 'react';

function auditScore(title, description, tags) {
  let score = 0;
  const issues = [];
  const good = [];

  if (title.length >= 40 && title.length <= 70) { score += 25; good.push('Title length perfect (40-70 chars)'); }
  else if (title.length > 0 && title.length < 40) { score += 10; issues.push(`Title too short (${title.length} chars, aim 40-70)`); }
  else if (title.length > 70) { score += 15; issues.push(`Title too long (${title.length} chars, aim 40-70)`); }
  else { issues.push('Title is empty'); }

  if (description.length >= 200) { score += 25; good.push('Description is detailed (200+ chars)'); }
  else if (description.length >= 100) { score += 15; issues.push('Description could be longer (aim 200+ chars)'); }
  else if (description.length > 0) { score += 5; issues.push(`Description too short (${description.length} chars, aim 200+)`); }
  else { issues.push('Description is empty'); }

  if (tags.length >= 8) { score += 25; good.push(`Good number of tags (${tags.length})`); }
  else if (tags.length >= 4) { score += 15; issues.push(`Add more tags (${tags.length}/8+ recommended)`); }
  else if (tags.length > 0) { score += 5; issues.push(`Very few tags (${tags.length}, add at least 8)`); }
  else { issues.push('No tags — add at least 8 tags'); }

  const titleWords = title.toLowerCase().split(/\s+/).filter(w => w.length > 3);
  const tagWords = tags.map(t => t.toLowerCase());
  const matched = titleWords.filter(w => tagWords.some(t => t.includes(w)));
  if (matched.length >= 2) { score += 15; good.push('Title keywords found in tags'); }
  else { score += 5; issues.push('Add title keywords in tags too'); }

  if (description.includes('http') || description.includes('www')) { score += 5; good.push('Description has links'); }
  else { issues.push('Add links in description (socials, website)'); }

  if (description.match(/\d+:\d+/)) { score += 5; good.push('Timestamps in description'); }

  return { score: Math.min(score, 100), issues, good };
}

function ScoreRing({ score }) {
  const color = score >= 75 ? '#22c55e' : score >= 50 ? '#f59e0b' : '#ef4444';
  const label = score >= 75 ? 'Great' : score >= 50 ? 'Fair' : 'Poor';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
      <div style={{
        width: 80, height: 80, borderRadius: '50%',
        background: `conic-gradient(${color} ${score * 3.6}deg, #1e1e1e 0deg)`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: `0 0 20px ${color}44`
      }}>
        <div style={{ width: 62, height: 62, borderRadius: '50%', background: '#111', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: 18, fontWeight: 900, color }}>{score}</span>
          <span style={{ fontSize: 9, color: '#555', fontWeight: 700 }}>/100</span>
        </div>
      </div>
      <span style={{ fontSize: 11, fontWeight: 800, color }}>{label}</span>
    </div>
  );
}

export default function Dashboard() {
  const [url, setUrl] = useState('');
  const [video, setVideo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');

  const [saving, setSaving] = useState({ title: false, description: false, tags: false });
  const [saved, setSaved] = useState({ title: false, description: false, tags: false });
  const [generatingTags, setGeneratingTags] = useState(false);
  const [aiTags, setAiTags] = useState([]);

  const [toast, setToast] = useState('');
  const [optimizingDesc, setOptimizingDesc] = useState(false);
  const [aiDescription, setAiDescription] = useState('');

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  }

  async function fetchVideo() {
    if (!url.trim()) return;
    setLoading(true);
    setError('');
    setVideo(null);
    setAiTags([]);
    try {
      const res = await fetch(`/api/youtube/video?url=${encodeURIComponent(url)}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setVideo(data.video);
      setTitle(data.video.title);
      setDescription(data.video.description);
      setTags(data.video.tags.join(', '));
    } catch (e) {
      setError(e.message);
    }
    setLoading(false);
  }

  async function optimizeDescription() {
    setOptimizingDesc(true);
    setAiDescription('');
    try {
      const res = await fetch('/api/youtube/optimize-description', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setAiDescription(data.description);
    } catch (e) {
      showToast('❌ ' + e.message);
    }
    setOptimizingDesc(false);
  }

  async function generateTags() {
    setGeneratingTags(true);
    setAiTags([]);
    try {
      const res = await fetch('/api/youtube/generate-tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setAiTags(data.tags);
    } catch (e) {
      showToast('❌ ' + e.message);
    }
    setGeneratingTags(false);
  }

  function applyAiTags() {
    const current = tags.split(',').map(t => t.trim()).filter(Boolean);
    const merged = [...new Set([...current, ...aiTags])];
    setTags(merged.join(', '));
    setAiTags([]);
    showToast('✅ Tags applied!');
  }

  function replaceWithAiTags() {
    setTags(aiTags.join(', '));
    setAiTags([]);
    showToast('✅ Tags replaced!');
  }

  async function saveField(field) {
    setSaving(s => ({ ...s, [field]: true }));
    try {
      const currentTags = tags.split(',').map(t => t.trim()).filter(Boolean);
      const payload = {
        videoId: video.id,
        title: field === 'title' ? title : video.title,
        description: field === 'description' ? description : video.description,
        tags: field === 'tags' ? currentTags : video.tags,
        categoryId: video.categoryId,
      };
      if (field === 'title') setVideo(v => ({ ...v, title }));
      if (field === 'description') setVideo(v => ({ ...v, description }));
      if (field === 'tags') setVideo(v => ({ ...v, tags: currentTags }));

      const res = await fetch('/api/youtube/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setSaved(s => ({ ...s, [field]: true }));
      setTimeout(() => setSaved(s => ({ ...s, [field]: false })), 2000);
      showToast(`✅ ${field.charAt(0).toUpperCase() + field.slice(1)} saved!`);
    } catch (e) {
      showToast('❌ ' + e.message);
    }
    setSaving(s => ({ ...s, [field]: false }));
  }

  const tagList = tags.split(',').map(t => t.trim()).filter(Boolean);
  const audit = video ? auditScore(title, description, tagList) : null;

  return (
    <div style={{ minHeight: '100vh', background: '#080808', color: '#eee', fontFamily: "'DM Sans', sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;600;700;800;900&display=swap" rel="stylesheet" />

      {/* Header */}
      <div style={{ background: '#0e0e0e', borderBottom: '1px solid #1a1a1a', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 28, height: 28, background: '#ff0000', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}>▶</div>
          <span style={{ fontSize: 14, fontWeight: 800, color: '#fff' }}>YT Audit</span>
        </div>
      </div>

      <div style={{ padding: '20px 16px', maxWidth: 600, margin: '0 auto' }}>

        {/* URL Input */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 11, color: '#444', fontWeight: 700, marginBottom: 8, letterSpacing: '0.08em' }}>YOUTUBE VIDEO URL</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              value={url}
              onChange={e => setUrl(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && fetchVideo()}
              placeholder="https://youtube.com/watch?v=..."
              style={{ flex: 1, background: '#111', border: '1px solid #1e1e1e', borderRadius: 10, padding: '12px 14px', color: '#eee', fontSize: 13, outline: 'none', fontFamily: 'inherit' }}
            />
            <button onClick={fetchVideo} disabled={loading || !url.trim()}
              style={{ background: loading ? '#111' : '#ff0000', border: 'none', borderRadius: 10, padding: '12px 18px', color: '#fff', fontSize: 13, fontWeight: 800, cursor: loading ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap', opacity: !url.trim() ? 0.4 : 1 }}>
              {loading ? '...' : 'Fetch'}
            </button>
          </div>
          {error && <div style={{ marginTop: 8, fontSize: 12, color: '#ef4444' }}>❌ {error}</div>}
        </div>

        {video && (
          <>
            {/* Thumbnail + Stats */}
            <div style={{ background: '#111', border: '1px solid #1a1a1a', borderRadius: 14, overflow: 'hidden', marginBottom: 16 }}>
              <img src={video.thumbnail} style={{ width: '100%', aspectRatio: '16/9', objectFit: 'cover', display: 'block' }} />
              <div style={{ padding: '12px 14px', display: 'flex', gap: 16 }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 15, fontWeight: 800, color: '#fff' }}>{parseInt(video.viewCount).toLocaleString()}</div>
                  <div style={{ fontSize: 10, color: '#444', fontWeight: 700 }}>VIEWS</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 15, fontWeight: 800, color: '#fff' }}>{parseInt(video.likeCount).toLocaleString()}</div>
                  <div style={{ fontSize: 10, color: '#444', fontWeight: 700 }}>LIKES</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 15, fontWeight: 800, color: '#fff' }}>{parseInt(video.commentCount).toLocaleString()}</div>
                  <div style={{ fontSize: 10, color: '#444', fontWeight: 700 }}>COMMENTS</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 15, fontWeight: 800, color: video.privacyStatus === 'public' ? '#22c55e' : '#f59e0b' }}>
                    {video.privacyStatus === 'public' ? '🌐' : '🔒'}
                  </div>
                  <div style={{ fontSize: 10, color: '#444', fontWeight: 700 }}>{(video.privacyStatus || '').toUpperCase()}</div>
                </div>
              </div>
            </div>

            {/* Audit Score */}
            <div style={{ background: '#111', border: '1px solid #1a1a1a', borderRadius: 14, padding: 16, marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 14 }}>
                <ScoreRing score={audit.score} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: '#fff', marginBottom: 4 }}>SEO Audit Score</div>
                  <div style={{ fontSize: 11, color: '#444' }}>Live — updates as you edit</div>
                </div>
              </div>
              {audit.issues.map((issue, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 6, marginBottom: 5 }}>
                  <span style={{ color: '#ef4444', fontSize: 11, marginTop: 1 }}>✗</span>
                  <span style={{ fontSize: 11, color: '#888' }}>{issue}</span>
                </div>
              ))}
              {audit.good.map((g, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 6, marginBottom: 5 }}>
                  <span style={{ color: '#22c55e', fontSize: 11, marginTop: 1 }}>✓</span>
                  <span style={{ fontSize: 11, color: '#666' }}>{g}</span>
                </div>
              ))}
            </div>

            {/* Title */}
            <div style={cardStyle}>
              <div style={cardHeader}>
                <span style={labelStyle}>TITLE</span>
                <span style={{ fontSize: 10, fontWeight: 700, color: title.length >= 40 && title.length <= 70 ? '#22c55e' : '#f59e0b' }}>{title.length} chars</span>
              </div>
              <input value={title} onChange={e => setTitle(e.target.value)} style={inputStyle} />
              <SaveBtn saving={saving.title} saved={saved.title} onClick={() => saveField('title')} />
            </div>

            {/* Description */}
            <div style={cardStyle}>
              <div style={cardHeader}>
                <span style={labelStyle}>DESCRIPTION</span>
                <span style={{ fontSize: 10, fontWeight: 700, color: description.length >= 200 ? '#22c55e' : '#f59e0b' }}>{description.length} chars</span>
              </div>
              <textarea value={description} onChange={e => setDescription(e.target.value)} rows={5} style={{ ...inputStyle, resize: 'vertical' }} />
              <button onClick={optimizeDescription} disabled={optimizingDesc}
                style={{
                  width: '100%', padding: '10px', borderRadius: 10, fontSize: 12, fontWeight: 800,
                  cursor: optimizingDesc ? 'not-allowed' : 'pointer', border: '1px solid #7c3aed44',
                  background: optimizingDesc ? '#1a1a1a' : '#1a0a2e',
                  color: optimizingDesc ? '#444' : '#a78bfa',
                  marginBottom: 8,
                }}>
                {optimizingDesc ? '✨ Optimizing...' : '✨ AI Optimize Description'}
              </button>

              {aiDescription && (
                <div style={{ background: '#0e0a1a', border: '1px solid #7c3aed33', borderRadius: 10, padding: 12, marginBottom: 10 }}>
                  <div style={{ fontSize: 10, color: '#7c3aed', fontWeight: 800, marginBottom: 8 }}>AI OPTIMIZED DESCRIPTION</div>
                  <div style={{ fontSize: 12, color: '#888', whiteSpace: 'pre-wrap', marginBottom: 10, maxHeight: 150, overflowY: 'auto' }}>
                    {aiDescription}
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => { setDescription(aiDescription); setAiDescription(''); showToast('✅ Applied!'); }}
                      style={{ flex: 1, padding: '8px', borderRadius: 8, fontSize: 11, fontWeight: 800, cursor: 'pointer', border: '1px solid #7c3aed44', background: '#1a0a2e', color: '#a78bfa' }}>
                      ✓ Apply
                    </button>
                    <button onClick={() => setAiDescription('')}
                      style={{ flex: 1, padding: '8px', borderRadius: 8, fontSize: 11, fontWeight: 800, cursor: 'pointer', border: '1px solid #333', background: '#1a1a1a', color: '#555' }}>
                      ✕ Dismiss
                    </button>
                  </div>
                </div>
              )}
              <SaveBtn saving={saving.description} saved={saved.description} onClick={() => saveField('description')} />
            </div>

            {/* Tags */}
            <div style={cardStyle}>
              <div style={cardHeader}>
                <span style={labelStyle}>TAGS</span>
                <span style={{ fontSize: 10, fontWeight: 700, color: tagList.length >= 8 ? '#22c55e' : '#f59e0b' }}>{tagList.length} tags</span>
              </div>

              <textarea value={tags} onChange={e => setTags(e.target.value)} rows={3} placeholder="tag1, tag2, tag3..." style={{ ...inputStyle, resize: 'none' }} />

              {tagList.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
                  {tagList.map((t, i) => (
                    <span key={i} style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', color: '#888', borderRadius: 6, padding: '3px 8px', fontSize: 11, fontWeight: 600 }}>
                      {t}
                    </span>
                  ))}
                </div>
              )}

              <button onClick={generateTags} disabled={generatingTags}
                style={{
                  width: '100%', padding: '10px', borderRadius: 10, fontSize: 12, fontWeight: 800,
                  cursor: generatingTags ? 'not-allowed' : 'pointer', border: '1px solid #7c3aed44',
                  background: generatingTags ? '#1a1a1a' : '#1a0a2e',
                  color: generatingTags ? '#444' : '#a78bfa',
                  marginBottom: 8, transition: 'all 0.2s',
                }}>
                {generatingTags ? '✨ Generating SEO Tags...' : '✨ AI Generate Tags'}
              </button>

              {aiTags.length > 0 && (
                <div style={{ background: '#0e0a1a', border: '1px solid #7c3aed33', borderRadius: 10, padding: 12, marginBottom: 10 }}>
                  <div style={{ fontSize: 10, color: '#7c3aed', fontWeight: 800, marginBottom: 8, letterSpacing: '0.06em' }}>AI SUGGESTED TAGS ({aiTags.length})</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
                    {aiTags.map((t, i) => (
                      <span key={i} style={{ background: '#1a0a2e', border: '1px solid #7c3aed44', color: '#a78bfa', borderRadius: 6, padding: '3px 8px', fontSize: 11, fontWeight: 600 }}>
                        {t}
                      </span>
                    ))}
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={applyAiTags}
                      style={{ flex: 1, padding: '8px', borderRadius: 8, fontSize: 11, fontWeight: 800, cursor: 'pointer', border: '1px solid #7c3aed44', background: '#1a0a2e', color: '#a78bfa' }}>
                      + Merge with existing
                    </button>
                    <button onClick={replaceWithAiTags}
                      style={{ flex: 1, padding: '8px', borderRadius: 8, fontSize: 11, fontWeight: 800, cursor: 'pointer', border: '1px solid #7c3aed44', background: '#2a0a1e', color: '#f472b6' }}>
                      Replace all
                    </button>
                  </div>
                </div>
              )}

              <SaveBtn saving={saving.tags} saved={saved.tags} onClick={() => saveField('tags')} />
            </div>
          </>
        )}
      </div>

      {toast && (
        <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', background: '#1a1a1a', border: '1px solid #2a2a2a', color: '#eee', borderRadius: 10, padding: '10px 20px', fontSize: 12, fontWeight: 700, zIndex: 9999, whiteSpace: 'nowrap' }}>
          {toast}
        </div>
      )}
    </div>
  );
}

const inputStyle = {
  width: '100%', background: '#0e0e0e', border: '1px solid #222', borderRadius: 10,
  padding: '10px 12px', color: '#eee', fontSize: 13, fontWeight: 600, outline: 'none',
  fontFamily: 'inherit', boxSizing: 'border-box', marginBottom: 10,
};
const cardStyle = { background: '#111', border: '1px solid #1a1a1a', borderRadius: 14, padding: 14, marginBottom: 12 };
const cardHeader = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 };
const labelStyle = { fontSize: 10, color: '#444', fontWeight: 800, letterSpacing: '0.08em' };

function SaveBtn({ saving, saved, onClick }) {
  return (
    <button onClick={onClick} disabled={saving}
      style={{
        width: '100%', padding: '10px', borderRadius: 10, fontSize: 12, fontWeight: 800,
        cursor: saving ? 'not-allowed' : 'pointer', border: 'none',
        background: saved ? '#14532d' : '#1a1a1a',
        color: saved ? '#22c55e' : saving ? '#444' : '#888',
        transition: 'all 0.2s',
      }}>
      {saved ? '✅ Saved!' : saving ? 'Saving...' : 'Save to YouTube'}
    </button>
  );
}
