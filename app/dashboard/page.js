'use client';
import { useState, useEffect } from 'react';

// ── helpers ──────────────────────────────────────────────
function fmt(n) { return parseInt(n || 0).toLocaleString(); }

function timeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const d = Math.floor(diff / 86400000);
  if (d === 0) return 'Today';
  if (d === 1) return 'Yesterday';
  if (d < 30) return `${d}d ago`;
  const m = Math.floor(d / 30);
  if (m < 12) return `${m}mo ago`;
  return `${Math.floor(m / 12)}y ago`;
}

function auditScore(title, description, tags) {
  let score = 0;
  const issues = [];
  const good = [];

  if (title.length >= 40 && title.length <= 70) { score += 25; good.push('Title length perfect (40-70 chars)'); }
  else if (title.length > 0 && title.length < 40) { score += 10; issues.push(`Title too short (${title.length} chars, aim 40-70)`); }
  else if (title.length > 70) { score += 15; issues.push(`Title too long (${title.length} chars, aim 40-70)`); }
  else { issues.push('Title is empty'); }

  if (description.length >= 200) { score += 25; good.push('Description is detailed (200+ chars)'); }
  else if (description.length >= 100) { score += 15; issues.push('Description could be longer (aim 200+)'); }
  else if (description.length > 0) { score += 5; issues.push(`Description too short (${description.length} chars)`); }
  else { issues.push('Description is empty'); }

  if (tags.length >= 8) { score += 25; good.push(`Good number of tags (${tags.length})`); }
  else if (tags.length >= 4) { score += 15; issues.push(`Add more tags (${tags.length}/8+ recommended)`); }
  else if (tags.length > 0) { score += 5; issues.push(`Very few tags (${tags.length})`); }
  else { issues.push('No tags — add at least 8'); }

  const titleWords = title.toLowerCase().split(/\s+/).filter(w => w.length > 3);
  const tagWords = tags.map(t => t.toLowerCase());
  const matched = titleWords.filter(w => tagWords.some(t => t.includes(w)));
  if (matched.length >= 2) { score += 15; good.push('Title keywords in tags ✓'); }
  else { issues.push('Add title keywords in tags too'); }

  if (description.includes('http') || description.includes('www')) { score += 5; good.push('Links in description'); }
  if (description.match(/\d+:\d+/)) { score += 5; good.push('Timestamps present'); }

  return { score: Math.min(score, 100), issues, good };
}

// ── Score Ring ───────────────────────────────────────────
function ScoreRing({ score }) {
  const color = score >= 75 ? '#22c55e' : score >= 50 ? '#f59e0b' : '#ef4444';
  const label = score >= 75 ? 'Great' : score >= 50 ? 'Fair' : 'Poor';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
      <div style={{
        width: 72, height: 72, borderRadius: '50%',
        background: `conic-gradient(${color} ${score * 3.6}deg, #1e1e1e 0deg)`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: `0 0 16px ${color}44`,
      }}>
        <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#111', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: 16, fontWeight: 900, color }}>{score}</span>
          <span style={{ fontSize: 8, color: '#555', fontWeight: 700 }}>/100</span>
        </div>
      </div>
      <span style={{ fontSize: 10, fontWeight: 800, color }}>{label}</span>
    </div>
  );
}

// ── Video Card ───────────────────────────────────────────
function VideoCard({ video, onClick }) {
  return (
    <div onClick={() => onClick(video)}
      style={{
        background: '#111', border: '1px solid #1a1a1a', borderRadius: 14,
        overflow: 'hidden', cursor: 'pointer', transition: 'border-color 0.2s',
        marginBottom: 12,
      }}
      onMouseEnter={e => e.currentTarget.style.borderColor = '#333'}
      onMouseLeave={e => e.currentTarget.style.borderColor = '#1a1a1a'}
    >
      {/* Thumbnail */}
      <div style={{ position: 'relative' }}>
        <img src={video.thumbnail} alt={video.title}
          style={{ width: '100%', aspectRatio: '16/9', objectFit: 'cover', display: 'block' }} />
        <div style={{
          position: 'absolute', top: 8, right: 8,
          background: video.privacyStatus === 'public' ? '#22c55e22' : '#f59e0b22',
          border: `1px solid ${video.privacyStatus === 'public' ? '#22c55e55' : '#f59e0b55'}`,
          color: video.privacyStatus === 'public' ? '#22c55e' : '#f59e0b',
          borderRadius: 6, padding: '2px 8px', fontSize: 10, fontWeight: 800,
        }}>
          {video.privacyStatus === 'public' ? '🌐 Public' : '🔒 Private'}
        </div>
        <div style={{
          position: 'absolute', bottom: 8, right: 8,
          background: '#000000cc', color: '#fff',
          borderRadius: 4, padding: '2px 6px', fontSize: 10, fontWeight: 700,
        }}>
          {timeAgo(video.publishedAt)}
        </div>
      </div>

      {/* Info */}
      <div style={{ padding: '10px 12px' }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#eee', marginBottom: 8, lineHeight: 1.3,
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {video.title}
        </div>
        <div style={{ display: 'flex', gap: 14 }}>
          <Stat label="VIEWS" value={fmt(video.viewCount)} />
          <Stat label="LIKES" value={fmt(video.likeCount)} />
          <Stat label="COMMENTS" value={fmt(video.commentCount)} />
          <Stat label="TAGS" value={video.tags.length} color={video.tags.length >= 8 ? '#22c55e' : '#f59e0b'} />
        </div>
      </div>

      {/* Edit hint */}
      <div style={{ padding: '8px 12px', borderTop: '1px solid #1a1a1a', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
        <span style={{ fontSize: 11, color: '#444', fontWeight: 700 }}>✏️ Tap to edit title, description & tags</span>
      </div>
    </div>
  );
}

function Stat({ label, value, color }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 13, fontWeight: 800, color: color || '#fff' }}>{value}</div>
      <div style={{ fontSize: 9, color: '#444', fontWeight: 700 }}>{label}</div>
    </div>
  );
}

// ── Save Button ──────────────────────────────────────────
function SaveBtn({ saving, saved, onClick, label = 'Save to YouTube' }) {
  return (
    <button onClick={onClick} disabled={saving}
      style={{
        flex: 1, padding: '9px', borderRadius: 10, fontSize: 11, fontWeight: 800,
        cursor: saving ? 'not-allowed' : 'pointer', border: 'none',
        background: saved ? '#14532d' : '#1a1a1a',
        color: saved ? '#22c55e' : saving ? '#444' : '#888',
        transition: 'all 0.2s',
      }}>
      {saved ? '✅ Saved!' : saving ? 'Saving...' : label}
    </button>
  );
}

// ── Regen Button ─────────────────────────────────────────
function RegenBtn({ loading, onClick, label }) {
  return (
    <button onClick={onClick} disabled={loading}
      style={{
        flex: 1, padding: '9px', borderRadius: 10, fontSize: 11, fontWeight: 800,
        cursor: loading ? 'not-allowed' : 'pointer',
        border: '1px solid #7c3aed44',
        background: loading ? '#1a1a1a' : '#1a0a2e',
        color: loading ? '#444' : '#a78bfa',
        transition: 'all 0.2s',
      }}>
      {loading ? '✨ Generating...' : `✨ ${label}`}
    </button>
  );
}

// ── Edit Panel ───────────────────────────────────────────
function EditPanel({ video, onClose, onSaved, showToast }) {
  const [title, setTitle] = useState(video.title);
  const [description, setDescription] = useState(video.description);
  const [tags, setTags] = useState(video.tags.join(', '));

  const [saving, setSaving] = useState({ title: false, description: false, tags: false });
  const [saved, setSaved] = useState({ title: false, description: false, tags: false });
  const [regen, setRegen] = useState({ title: false, description: false, tags: false });

  const [aiTitle, setAiTitle] = useState('');
  const [aiDescription, setAiDescription] = useState('');
  const [aiTags, setAiTags] = useState([]);

  const tagList = tags.split(',').map(t => t.trim()).filter(Boolean);
  const audit = auditScore(title, description, tagList);

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
      onSaved(field, field === 'title' ? title : field === 'description' ? description : tags.split(',').map(t => t.trim()).filter(Boolean));
    } catch (e) {
      showToast('❌ ' + e.message);
    }
    setSaving(s => ({ ...s, [field]: false }));
  }

  async function regenTitle() {
    setRegen(r => ({ ...r, title: true }));
    setAiTitle('');
    try {
      const res = await fetch('/api/youtube/generate-title', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setAiTitle(data.title);
    } catch (e) {
      showToast('❌ ' + e.message);
    }
    setRegen(r => ({ ...r, title: false }));
  }

  async function regenDescription() {
    setRegen(r => ({ ...r, description: true }));
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
    setRegen(r => ({ ...r, description: false }));
  }

  async function regenTags() {
    setRegen(r => ({ ...r, tags: true }));
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
    setRegen(r => ({ ...r, tags: false }));
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', flexDirection: 'column', background: '#080808' }}>
      {/* Header */}
      <div style={{ background: '#0e0e0e', borderBottom: '1px solid #1a1a1a', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
        <button onClick={onClose}
          style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', color: '#aaa', borderRadius: 8, padding: '6px 12px', fontSize: 13, fontWeight: 800, cursor: 'pointer' }}>
          ← Back
        </button>
        <span style={{ fontSize: 13, fontWeight: 800, color: '#fff', flex: 1,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {video.title}
        </span>
      </div>

      {/* Scrollable content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px', maxWidth: 600, margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>

        {/* Thumbnail small */}
        <img src={video.thumbnail} style={{ width: '100%', aspectRatio: '16/9', objectFit: 'cover', borderRadius: 12, marginBottom: 14 }} />

        {/* Audit */}
        <div style={{ background: '#111', border: '1px solid #1a1a1a', borderRadius: 14, padding: 14, marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 12 }}>
            <ScoreRing score={audit.score} />
            <div>
              <div style={{ fontSize: 13, fontWeight: 800, color: '#fff', marginBottom: 2 }}>SEO Score</div>
              <div style={{ fontSize: 11, color: '#444' }}>Live — updates as you edit</div>
            </div>
          </div>
          {audit.issues.map((issue, i) => (
            <div key={i} style={{ display: 'flex', gap: 6, marginBottom: 4 }}>
              <span style={{ color: '#ef4444', fontSize: 11 }}>✗</span>
              <span style={{ fontSize: 11, color: '#888' }}>{issue}</span>
            </div>
          ))}
          {audit.good.map((g, i) => (
            <div key={i} style={{ display: 'flex', gap: 6, marginBottom: 4 }}>
              <span style={{ color: '#22c55e', fontSize: 11 }}>✓</span>
              <span style={{ fontSize: 11, color: '#666' }}>{g}</span>
            </div>
          ))}
        </div>

        {/* ── TITLE ── */}
        <div style={cardStyle}>
          <div style={cardHeader}>
            <span style={labelStyle}>TITLE</span>
            <span style={{ fontSize: 10, fontWeight: 700, color: title.length >= 40 && title.length <= 70 ? '#22c55e' : '#f59e0b' }}>{title.length} chars</span>
          </div>
          <input value={title} onChange={e => setTitle(e.target.value)} style={inputStyle} />

          {/* AI suggested title */}
          {aiTitle && (
            <div style={aiBoxStyle}>
              <div style={aiLabelStyle}>AI SUGGESTED TITLE</div>
              <div style={{ fontSize: 13, color: '#eee', fontWeight: 600, marginBottom: 10 }}>{aiTitle}</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => { setTitle(aiTitle); setAiTitle(''); showToast('✅ Applied!'); }}
                  style={aiApplyBtn}>✓ Apply</button>
                <button onClick={() => setAiTitle('')} style={aiDismissBtn}>✕</button>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: 8 }}>
            <RegenBtn loading={regen.title} onClick={regenTitle} label="Regen Title" />
            <SaveBtn saving={saving.title} saved={saved.title} onClick={() => saveField('title')} />
          </div>
        </div>

        {/* ── DESCRIPTION ── */}
        <div style={cardStyle}>
          <div style={cardHeader}>
            <span style={labelStyle}>DESCRIPTION</span>
            <span style={{ fontSize: 10, fontWeight: 700, color: description.length >= 200 ? '#22c55e' : '#f59e0b' }}>{description.length} chars</span>
          </div>
          <textarea value={description} onChange={e => setDescription(e.target.value)} rows={5}
            style={{ ...inputStyle, resize: 'vertical' }} />

          {aiDescription && (
            <div style={aiBoxStyle}>
              <div style={aiLabelStyle}>AI OPTIMIZED DESCRIPTION</div>
              <div style={{ fontSize: 12, color: '#888', whiteSpace: 'pre-wrap', marginBottom: 10, maxHeight: 140, overflowY: 'auto' }}>
                {aiDescription}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => { setDescription(aiDescription); setAiDescription(''); showToast('✅ Applied!'); }}
                  style={aiApplyBtn}>✓ Apply</button>
                <button onClick={() => setAiDescription('')} style={aiDismissBtn}>✕</button>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: 8 }}>
            <RegenBtn loading={regen.description} onClick={regenDescription} label="Regen Desc" />
            <SaveBtn saving={saving.description} saved={saved.description} onClick={() => saveField('description')} />
          </div>
        </div>

        {/* ── TAGS ── */}
        <div style={cardStyle}>
          <div style={cardHeader}>
            <span style={labelStyle}>TAGS</span>
            <span style={{ fontSize: 10, fontWeight: 700, color: tagList.length >= 8 ? '#22c55e' : '#f59e0b' }}>{tagList.length} tags</span>
          </div>
          <textarea value={tags} onChange={e => setTags(e.target.value)} rows={3}
            placeholder="tag1, tag2, tag3..." style={{ ...inputStyle, resize: 'none' }} />

          {tagList.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
              {tagList.map((t, i) => (
                <span key={i} style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', color: '#888', borderRadius: 6, padding: '3px 8px', fontSize: 11, fontWeight: 600 }}>
                  {t}
                </span>
              ))}
            </div>
          )}

          {aiTags.length > 0 && (
            <div style={aiBoxStyle}>
              <div style={aiLabelStyle}>AI SUGGESTED TAGS ({aiTags.length})</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
                {aiTags.map((t, i) => (
                  <span key={i} style={{ background: '#1a0a2e', border: '1px solid #7c3aed44', color: '#a78bfa', borderRadius: 6, padding: '3px 8px', fontSize: 11, fontWeight: 600 }}>
                    {t}
                  </span>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => {
                  const cur = tags.split(',').map(t => t.trim()).filter(Boolean);
                  setTags([...new Set([...cur, ...aiTags])].join(', '));
                  setAiTags([]); showToast('✅ Merged!');
                }} style={aiApplyBtn}>+ Merge</button>
                <button onClick={() => { setTags(aiTags.join(', ')); setAiTags([]); showToast('✅ Replaced!'); }}
                  style={{ ...aiApplyBtn, background: '#2a0a1e', color: '#f472b6', border: '1px solid #f472b633' }}>Replace</button>
                <button onClick={() => setAiTags([])} style={aiDismissBtn}>✕</button>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: 8 }}>
            <RegenBtn loading={regen.tags} onClick={regenTags} label="Regen Tags" />
            <SaveBtn saving={saving.tags} saved={saved.tags} onClick={() => saveField('tags')} />
          </div>
        </div>

      </div>
    </div>
  );
}

// ── Main Dashboard ───────────────────────────────────────
export default function Dashboard() {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState(null);
  const [toast, setToast] = useState('');

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  }

  useEffect(() => {
    async function fetchVideos() {
      try {
        const res = await fetch('/api/youtube/videos');
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        setVideos(data.videos);
      } catch (e) {
        setError(e.message);
      }
      setLoading(false);
    }
    fetchVideos();
  }, []);

  function handleSaved(videoId, field, value) {
    setVideos(vs => vs.map(v => {
      if (v.id !== videoId) return v;
      if (field === 'title') return { ...v, title: value };
      if (field === 'description') return { ...v, description: value };
      if (field === 'tags') return { ...v, tags: value };
      return v;
    }));
  }

  if (selected) {
    return (
      <>
        <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;600;700;800;900&display=swap" rel="stylesheet" />
        <EditPanel
          video={selected}
          onClose={() => setSelected(null)}
          onSaved={(field, value) => handleSaved(selected.id, field, value)}
          showToast={showToast}
        />
        {toast && <Toast msg={toast} />}
      </>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#080808', color: '#eee', fontFamily: "'DM Sans', sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;600;700;800;900&display=swap" rel="stylesheet" />

      {/* Header */}
      <div style={{ background: '#0e0e0e', borderBottom: '1px solid #1a1a1a', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 8, position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ width: 28, height: 28, background: '#ff0000', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}>▶</div>
        <span style={{ fontSize: 14, fontWeight: 800, color: '#fff' }}>YT Audit</span>
        <span style={{ fontSize: 11, color: '#333', marginLeft: 4 }}>Last 5 Videos</span>
      </div>

      <div style={{ padding: '16px', maxWidth: 600, margin: '0 auto' }}>
        {loading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[1,2,3].map(i => (
              <div key={i} style={{ background: '#111', borderRadius: 14, overflow: 'hidden', border: '1px solid #1a1a1a' }}>
                <div style={{ aspectRatio: '16/9', background: '#1a1a1a' }} />
                <div style={{ padding: 12 }}>
                  <div style={{ height: 14, background: '#1a1a1a', borderRadius: 6, marginBottom: 8 }} />
                  <div style={{ height: 10, background: '#1a1a1a', borderRadius: 6, width: '60%' }} />
                </div>
              </div>
            ))}
          </div>
        )}

        {error && (
          <div style={{ background: '#1a0a0a', border: '1px solid #ef444433', borderRadius: 12, padding: 16, textAlign: 'center' }}>
            <div style={{ fontSize: 24, marginBottom: 8 }}>⚠️</div>
            <div style={{ fontSize: 13, color: '#ef4444', fontWeight: 700 }}>{error}</div>
          </div>
        )}

        {!loading && !error && videos.map(video => (
          <VideoCard key={video.id} video={video} onClick={setSelected} />
        ))}

        {!loading && !error && videos.length === 0 && (
          <div style={{ textAlign: 'center', padding: 40, color: '#444' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
            <div style={{ fontSize: 14, fontWeight: 700 }}>No videos found</div>
          </div>
        )}
      </div>

      {toast && <Toast msg={toast} />}
    </div>
  );
}

function Toast({ msg }) {
  return (
    <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', background: '#1a1a1a', border: '1px solid #2a2a2a', color: '#eee', borderRadius: 10, padding: '10px 20px', fontSize: 12, fontWeight: 700, zIndex: 9999, whiteSpace: 'nowrap' }}>
      {msg}
    </div>
  );
}

// ── Styles ───────────────────────────────────────────────
const inputStyle = {
  width: '100%', background: '#0e0e0e', border: '1px solid #222', borderRadius: 10,
  padding: '10px 12px', color: '#eee', fontSize: 13, fontWeight: 600, outline: 'none',
  fontFamily: 'inherit', boxSizing: 'border-box', marginBottom: 10,
};
const cardStyle = { background: '#111', border: '1px solid #1a1a1a', borderRadius: 14, padding: 14, marginBottom: 12 };
const cardHeader = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 };
const labelStyle = { fontSize: 10, color: '#444', fontWeight: 800, letterSpacing: '0.08em' };
const aiBoxStyle = { background: '#0e0a1a', border: '1px solid #7c3aed33', borderRadius: 10, padding: 12, marginBottom: 10 };
const aiLabelStyle = { fontSize: 10, color: '#7c3aed', fontWeight: 800, marginBottom: 8, letterSpacing: '0.06em' };
const aiApplyBtn = { flex: 1, padding: '7px', borderRadius: 8, fontSize: 11, fontWeight: 800, cursor: 'pointer', border: '1px solid #7c3aed44', background: '#1a0a2e', color: '#a78bfa' };
const aiDismissBtn = { padding: '7px 12px', borderRadius: 8, fontSize: 11, fontWeight: 800, cursor: 'pointer', border: '1px solid #333', background: '#1a1a1a', color: '#555' };
