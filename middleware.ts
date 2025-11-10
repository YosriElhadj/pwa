export { auth as middleware } from '@/lib/auth';

export const config = {
  // ✅ Protéger UNIQUEMENT les routes privées, pas les pages publiques
  matcher: [
    '/',
    '/recipes/:path*',
    '/ai-chef',
    '/fridge-scanner',
    '/pantry',
    '/discover',
  ],
};