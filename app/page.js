'use client';
import { signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function LoginPage() {
  const { data: session } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (session) router.push('/dashboard');
  }, [session]);

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#111', border: '1px solid #222', borderRadius: 20, padding: 40, textAlign: 'center', maxWidth: 360, width: '90%' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🎬</div>
        <div style={{ fontSize: 22, fontWeight: 800, color: '#fff', marginBottom: 8 }}>YouTube Editor</div>
        <div style={{ fontSize: 13, color: '#555', marginBottom: 32 }}>Title, Description aur Tags edit karo directly</div>
        <button onClick={() => signIn('google')}
          style={{ width: '100%', background: '#fff', color: '#111', border: 'none', borderRadius: 12, padding: '14px', fontSize: 14, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
          <img src="https://www.google.com/favicon.ico" width={18} height={18} />
          Google se Login karo
        </button>
      </div>
    </div>
  );
}
