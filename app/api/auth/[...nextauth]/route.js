import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      authorization: {
        params: {
          scope: 'openid email profile https://www.googleapis.com/auth/youtube.force-ssl',
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async jwt({ token, account }) {
      // Pehli baar login — save karo sab
      if (account) {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        token.expiresAt = account.expires_at; // 👈 yeh missing tha
        return token;
      }

      // Token abhi valid hai
      if (Date.now() < token.expiresAt * 1000) {
        return token;
      }

      // Token expire — refresh karo
      const res = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        body: new URLSearchParams({
          client_id: process.env.GOOGLE_CLIENT_ID,
          client_secret: process.env.GOOGLE_CLIENT_SECRET,
          grant_type: 'refresh_token',
          refresh_token: token.refreshToken,
        }),
      });

      const refreshed = await res.json();

      if (refreshed.error) {
        // Refresh bhi fail — user ko re-login karana hoga
        return { ...token, error: 'RefreshTokenError' };
      }

      return {
        ...token,
        accessToken: refreshed.access_token,
        expiresAt: Math.floor(Date.now() / 1000 + refreshed.expires_in),
      };
    },

    async session({ session, token }) {
      session.accessToken = token.accessToken;
      session.error = token.error; // frontend pe handle kar sakta hai
      return session;
    },
  },
});

export { handler as GET, handler as POST };
