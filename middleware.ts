import { jwtVerify } from 'jose';
import { type NextRequest, NextResponse } from 'next/server';

import { AUTH_COOKIE_NAME } from '@/lib/utils/jwt';

// Function to verify JWT token
async function verifyToken(token: string) {
  try {
    const secret = new TextEncoder().encode(
      process.env.JWT_SECRET || 'your-secret-key-change-in-production'
    );
    const { payload } = await jwtVerify(token, secret);
    return payload;
  } catch {
    return null;
  }
}

export async function middleware(request: NextRequest) {
  // Check if the path should be protected
  const { pathname } = request.nextUrl;

  // Skip middleware for public routes and API routes
  if (
    pathname.startsWith('/_next') ||
    pathname.includes('/api/') ||
    pathname.includes('/(features)/(unauth)/')
  ) {
    return NextResponse.next();
  }

  // Get token from cookies
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  const isAuthenticated = token ? await verifyToken(token) : null;

  // Check if this is a protected route
  const isProtectedRoute =
    pathname.includes('/(features)/(auth)/') || pathname.startsWith('/dashboard');

  // If it's a protected route and user is not authenticated, redirect to login
  if (isProtectedRoute && !isAuthenticated) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Continue with the request
  return NextResponse.next();
}

// Apply middleware to all routes
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
};
