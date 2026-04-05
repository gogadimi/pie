import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

// Define public routes
const isPublicRoute = createRouteMatcher([
  '/',
  '/pricing',
  '/signup(.*)',
  '/login(.*)',
  '/api/health',
  '/api/webhooks/stripe',
]);

export default clerkMiddleware(async (auth, req) => {
  // Allow public routes (no auth required)
  if (isPublicRoute(req)) {
    return NextResponse.next();
  }

  // In development, allow access without auth for testing
  if (process.env.NODE_ENV === 'development') {
    return NextResponse.next();
  }

  // For all other routes, require authentication
  const { userId } = await auth();
  if (!userId) {
    // Redirect to sign-in
    const signInUrl = new URL('/login', req.url);
    signInUrl.searchParams.set('redirect_url', req.url);
    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: ['/((?!.*\\..*|_next).*)', '/', '/(api|trpc)(.*)'],
};
