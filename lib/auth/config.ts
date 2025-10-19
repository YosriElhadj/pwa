import type { NextAuthConfig } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export const authConfig: NextAuthConfig = {
  pages: {
    signIn: '/login',
  },
  providers: [
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          // Appeler le backend NestJS pour login
          const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password,
            }),
          });

          if (!response.ok) {
            return null;
          }

          const data = await response.json();
          
          // data contient : { access_token, user: { id, email, name } }
          return {
            id: data.user.id,
            email: data.user.email,
            name: data.user.name,
            accessToken: data.access_token, // IMPORTANT : On stocke le token JWT
          };
        } catch (error) {
          console.error('Auth error:', error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnAuthPage = nextUrl.pathname.startsWith('/login') || nextUrl.pathname.startsWith('/register');
      
      if (isOnAuthPage) {
        if (isLoggedIn) return Response.redirect(new URL('/', nextUrl));
        return true;
      }
      
      return isLoggedIn;
    },
    async jwt({ token, user }) {
      // Lors du premier login, user contient les données de authorize()
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.accessToken = (user as any).accessToken; // Stocker le JWT du backend
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.name = token.name as string;
        (session as any).accessToken = token.accessToken; // Ajouter le token à la session
      }
      return session;
    },
  },
  session: {
    strategy: 'jwt',
    maxAge: 7 * 24 * 60 * 60, // 7 jours (comme le JWT backend)
  },
  secret: process.env.NEXTAUTH_SECRET,
};