// src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('auth_token')?.value;
  const { pathname } = request.nextUrl;

  // Rotas públicas que não exigem autenticação
  const publicPaths = ['/', '/register', '/verify-email', '/forgot-password', '/reset-password'];
  const isPublicPath = publicPaths.includes(pathname);

  // Se o usuário está tentando acessar uma rota pública
  if (isPublicPath) {
    // Se ele tem um token (está logado), redirecione para o dashboard
    if (token) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  } else {
    // Se o usuário está tentando acessar uma rota protegida (não pública)
    // E não tem um token, redirecione para o login
    if (!token) {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  return NextResponse.next();
}

// Define quais rotas serão interceptadas pelo middleware
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
