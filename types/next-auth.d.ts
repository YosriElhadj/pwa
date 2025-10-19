import 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      name: string;
      email: string;
    };
    accessToken?: string; // Ajouter le token à la session
  }

  interface User {
    id: string;
    name: string;
    email: string;
    accessToken?: string; // Ajouter le token
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    email: string;
    name: string;
    accessToken?: string; // Ajouter le token au JWT
  }
}