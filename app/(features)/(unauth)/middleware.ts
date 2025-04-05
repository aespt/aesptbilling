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
  // Get token from cookies
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  const isAuthenticated = token ? await verifyToken(token) : null;

  // If authenticated, redirect to dashboard
  if (isAuthenticated) {
    return NextResponse.redirect(new URL('/(features)/(auth)/dashboard', request.url));
  }

  // Continue with the request if not authenticated
  return NextResponse.next();
}

// This middleware applies to all routes in the (unauth) directory
export const config = {
  matcher: ['/(features)/(unauth)/:path*'],
};
