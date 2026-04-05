import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Simple locale detection middleware
// Stores locale preference in cookie, no URL prefix needed
export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  
  // Check for existing locale cookie
  const localeCookie = request.cookies.get('NEXT_LOCALE');
  if (!localeCookie) {
    // Detect from Accept-Language header
    const acceptLang = request.headers.get('accept-language') || '';
    const locale = acceptLang.startsWith('mk') ? 'mk' : 'en';
    response.cookies.set('NEXT_LOCALE', locale, {
      maxAge: 365 * 24 * 60 * 60,
      path: '/',
    });
  }
  
  return response;
}

export const config = {
  matcher: ['/((?!api|_next|.*\..*).*)'],
};
