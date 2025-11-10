import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Liste des chemins publics qui ne nécessitent PAS d'authentification
  const publicPaths = [
    '/login',
    '/register',
    '/discover',
    '/api/auth',
  ];

  // Liste des extensions de fichiers statiques à ignorer
  const staticExtensions = [
    '.js',
    '.css',
    '.woff',
    '.woff2',
    '.ttf',
    '.otf',
    '.png',
    '.jpg',
    '.jpeg',
    '.gif',
    '.svg',
    '.ico',
    '.json',
  ];

  // Vérifier si c'est un chemin public
  const isPublicPath = publicPaths.some(path => pathname.startsWith(path));

  // Vérifier si c'est un fichier statique
  const isStaticFile = staticExtensions.some(ext => pathname.endsWith(ext)) || 
                        pathname.startsWith('/_next') ||
                        pathname.startsWith('/icons') ||
                        pathname === '/manifest.json' ||
                        pathname === '/sw.js' ||
                        pathname.startsWith('/workbox-');

  // Ne pas appliquer l'authentification aux chemins publics et fichiers statiques
  if (isPublicPath || isStaticFile) {
    return NextResponse.next();
  }

  // Vérifier l'authentification pour les autres routes
  const session = await auth();

  if (!session) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match toutes les routes sauf:
     * - API routes internes de Next.js
     * - Fichiers statiques
     */
    '/((?!api/|_next/static|_next/image|favicon.ico).*)',
  ],
};