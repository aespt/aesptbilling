import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { AUTH_COOKIE_NAME } from '@/lib/utils/jwt';

// Function to verify JWT token
async function verifyToken(token: string) {
  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'your-secret-key-change-in-production');
    const { payload } = await jwtVerify(token, secret);
    return payload;
  } catch (error) {
    return null;
  }
}

export async function middleware(request: NextRequest) {
  // Get token from cookies
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  const isAuthenticated = token ? await verifyToken(token) : null;
  
  console.log('Middleware executing, isAuthenticated:', isAuthenticated);
  
  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    return NextResponse.redirect(new URL('/login', request.url))
  }
  
  // Continue with the request if authenticated
  return NextResponse.next();
}

// This middleware applies to all routes in the (auth) directory
export const config = {
  matcher: ['/dashboard/:path*', '/(features)/(auth)/:path*']
}; 