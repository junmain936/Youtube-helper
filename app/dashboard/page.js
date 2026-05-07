'use client';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/');
    if (session) fetchVideos();
  }, [session, status]);

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  }

  async function fetchVideos() {
    setLoading(true);
    try {
      const res = await fetch('/api/youtube/videos', {
        headers: { Authorization: `Bearer ${session.accessToken}` }
      });
      const data = await res.json();
      setVideos(data.videos || []);
    } catch (e) {
      showToast('❌ Videos load nahi hue');
    }
    setLoading(false);
  }

  async function saveVideo() {
    setSaving(true);
    try {
      const res = await fetch('/api/youtube/update', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          videoId: editing.id,
          title: editing.title,
          description: editing.description,
          tags: editing.tags,
          categoryId: editing.categoryId,
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setVideos(v => v.map(vid => vid.id === editing.id ? { ...vid, ...editing } : vid));
      setEditing(null);
      showToast('✅ Saved!');
    } catch (e) {
      showToast('❌ ' + e.message);
    }
    setSaving(false);
  }

  if (status === 'loading' || loading) return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#555', fontSize: 14 }}>
      Loading...
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', color: '#eee', fontFamily: 'sans-serif' }}>
      {/* Topbar */}
      <div style={{ background: '#111', borderBottom: '1px solid #1e1e1e', padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ fontSize: 15, fontWeight: 800 }}>🎬 YouTube Editor</div>
        <button onClick={() => signOut({ callbackUrl: '/' })}
          style={{ background: 'none', border: '1px solid #333', color: '#666', borderRadius: 8, padding: '6px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
          Logout
        </button>
      </div>

      {/* Videos List */}
      <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 600, margin: '0 auto' }}>
        {videos.map(v => (
          <div key={v.id} style={{ background: '#111', border: '1px solid #1e1e1e', borderRadius: 14, padding: 14, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <img src={v.thumbnail} style={{ width: 90, height: 56, objectFit: 'cover', borderRadius: 8, flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#eee', marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v.title}</div>
              <div style={{ fontSize: 11, color: '#555', marginBottom: 8 }}>
                🏷️ {v.tags.length > 0 ? `${v.tags.length} tags` : 'No tags'}
              </div>
              <button onClick={() => setEditing({ ...v, tags: [...v.tags] })}
                style={{ background: '#1a1a1a', border: '1px solid #333', color: '#aaa', borderRadius: 8, padding: '6px 12px', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                ✏️ Edit
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Edit Modal */}
      {editing && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', zIndex: 1000, display: 'flex', alignItems: 'flex-end', padding: 16 }}>
          <div style={{ background: '#111', border: '1px solid #222', borderRadius: 20, padding: 20, width: '100%', maxHeight: '85vh', overflowY: 'auto' }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#fff', marginBottom: 16 }}>✏️ Edit Video</div>

            <div style={{ fontSize: 11, color: '#555', fontWeight: 700, marginBottom: 6 }}>TITLE</div>
            <input value={editing.title} onChange={e => setEditing(ed => ({ ...ed, title: e.target.value }))}
              style={{ width: '100%', background: '#1a1a1a', border: '1px solid #333', borderRadius: 10, padding: '10px 12px', color: '#eee', fontSize: 13, fontWeight: 600, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box', marginBottom: 14 }} />

            <div style={{ fontSize: 11, color: '#555', fontWeight: 700, marginBottom: 6 }}>DESCRIPTION</div>
            <textarea value={editing.description} onChange={e => setEditing(ed => ({ ...ed, description: e.target.value }))}
              rows={4}
              style={{ width: '100%', background: '#1a1a1a', border: '1px solid #333', borderRadius: 10, padding: '10px 12px', color: '#eee', fontSize: 13, fontWeight: 600, outline: 'none', resize: 'none', fontFamily: 'inherit', boxSizing: 'border-box', marginBottom: 14 }} />

            <div style={{ fontSize: 11, color: '#555', fontWeight: 700, marginBottom: 6 }}>TAGS (comma separated)</div>
            <textarea value={editing.tags.join(', ')} onChange={e => setEditing(ed => ({ ...ed, tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean) }))}
              rows={3}
              style={{ width: '100%', background: '#1a1a1a', border: '1px solid #333', borderRadius: 10, padding: '10px 12px', color: '#eee', fontSize: 13, fontWeight: 600, outline: 'none', resize: 'none', fontFamily: 'inherit', boxSizing: 'border-box', marginBottom: 20 }} />

            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={saveVideo} disabled={saving}
                style={{ flex: 2, background: saving ? '#111' : 'linear-gradient(135deg,#1a4a1a,#0d2a0d)', border: '1px solid #2a6a2a', color: saving ? '#444' : '#44bb66', borderRadius: 10, padding: '12px', fontSize: 13, fontWeight: 800, cursor: saving ? 'not-allowed' : 'pointer' }}>
                {saving ? 'Saving...' : '✅ Save to YouTube'}
              </button>
              <button onClick={() => setEditing(null)}
                style={{ flex: 1, background: '#111', border: '1px solid #333', color: '#666', borderRadius: 10, padding: '12px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', bottom: 30, left: '50%', transform: 'translateX(-50%)', background: '#222', border: '1px solid #333', color: '#eee', borderRadius: 10, padding: '10px 20px', fontSize: 13, fontWeight: 700, zIndex: 9999 }}>
          {toast}
        </div>
      )}
    </div>
  );
}
