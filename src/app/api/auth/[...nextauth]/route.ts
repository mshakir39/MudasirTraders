import { executeOperation } from '@/app/libs/executeOperation';
import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { cookies } from 'next/headers';
const handler = NextAuth({
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    }),
  ],

  callbacks: {
    async signIn({ user }) {
      if (user.email && user.email.endsWith('@mudasirtraders.com')) {
        await executeOperation('users', 'insertOne', user);
        cookies().set('userId', user?.id, {
          maxAge: 30 * 24 * 60 * 60,
        });
        return true;
      } else {
        return false;
      }
    },
    async redirect({ url, baseUrl }) {
      return baseUrl;
    },
    session: async ({ session, token }: any) => {
      if (session?.user) {
        session.user.id = token.sub;
      }
      return session;
    },

    //   jwt: async ({ token, user, account }) => {
    //     if (account && account.access_token) {
    //         token.accessToken = account.access_token // <-- adding the access_token here
    //     }
    //     return token
    // },
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60,
  },
});

export { handler as GET, handler as POST };
