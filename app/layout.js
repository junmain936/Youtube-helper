import { getServerSession } from 'next-auth';
import SessionProvider from './SessionProvider';

export default async function RootLayout({ children }) {
  const session = await getServerSession();
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0 }}>
        <SessionProvider session={session}>
          {children}
        </SessionProvider>
      </body>
    </html>
  );
}
