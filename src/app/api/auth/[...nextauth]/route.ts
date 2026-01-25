import { connectToMongoDB } from '@/app/libs/connectToMongoDB';
import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { DefaultSession } from 'next-auth';
import { MongoClient, Db } from 'mongodb';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email?: string | null;
    } & DefaultSession['user'];
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    userId?: string;
    email?: string | null;
    accessToken?: string;
  }
}

const handler = NextAuth({
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    }),
  ],

  callbacks: {
    async signIn({ user, account, profile }) {
      try {
        if (user.email && user.email.endsWith('@mudasirtraders.com')) {
          // Store user in database directly with error handling
          try {
            const db = await connectToMongoDB();
            if (db) {
              const collection = db.collection('users');
              
              // Check if user already exists
              const existingUser = await collection.findOne({ email: user.email });
              
              if (!existingUser) {
                // Insert new user
                await collection.insertOne({
                  email: user.email,
                  name: user.name,
                  image: user.image,
                  provider: account?.provider,
                  providerId: account?.providerAccountId,
                  createdAt: new Date(),
                });
              }
            }
          } catch (dbError) {
            console.warn('Database operation failed, but allowing sign-in:', dbError);
            // Continue with sign-in even if database fails
          }
          return true;
        } else {
          // Return a specific error URL for unauthorized domains
          return '/auth/error?error=AccessDenied&message=Only @mudasirtraders.com emails are allowed';
        }
      } catch (error) {
        console.error('SignIn error:', error);
        // Allow sign in even if database operation fails, but log the error
        if (user.email && user.email.endsWith('@mudasirtraders.com')) {
          return true;
        }
        return false;
      }
    },

    async jwt({ token, user, account }) {
      // Store user ID in JWT token instead of cookies
      if (user) {
        token.userId = user.id;
        token.email = user.email;
      }
      if (account?.access_token) {
        token.accessToken = account.access_token;
      }
      return token;
    },

    async session({ session, token }) {
      // Pass user ID from token to session without database dependency
      if (session?.user && token) {
        session.user.id = (token.sub || token.userId || '') as string;
        session.user.email = token.email || undefined;
      }
      return session;
    },

    async redirect({ url, baseUrl }) {
      // Handle redirects properly
      if (url.startsWith('/')) return `${baseUrl}${url}`;
      if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    },
  },

  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },

  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  // Add fallback for session errors
  logger: {
    error: (code, metadata) => {
      console.error('NextAuth error:', { code, metadata });
    },
    warn: (code) => {
      console.warn('NextAuth warning:', code);
    },
    debug: (code, metadata) => {
      console.debug('NextAuth debug:', { code, metadata });
    },
  },

  // Add debug for production troubleshooting
  debug: process.env.NODE_ENV === 'development',

  // Add error handling
  events: {
    async signIn({ user, account, profile, isNewUser }) {
      console.log('User signed in:', user.email);
    },
    async signOut({ session, token }) {
      console.log('User signed out');
    },
    async createUser({ user }) {
      console.log('New user created:', user.email);
    },
    async session({ session, token }) {
      // This runs whenever a session is checked
      console.log('Session checked for:', session.user?.email);
    },
  },
});

export { handler as GET, handler as POST };
