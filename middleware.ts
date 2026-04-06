import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Check if user is authenticated via sessionStorage (we'll do this in the client)
  // For now, just redirect unauthenticated users to login
  const isAuthRoute = pathname.startsWith('/(auth)') || pathname.startsWith('/login');
  
  if (!isAuthRoute && pathname !== '/') {
    // In a real app, we'd check the session/cookie here
    // For now, let the client-side handling manage this
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
