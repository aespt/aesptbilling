import { NextResponse } from 'next/server';

import { AUTH_COOKIE_NAME, REFRESH_COOKIE_NAME } from '@/lib/utils/jwt';

export async function POST() {
  try {
    // Create a response
    const response = NextResponse.json({
      success: true,
      message: 'Logged out successfully',
    });

    // Clear auth cookies
    response.cookies.delete(AUTH_COOKIE_NAME);
    response.cookies.delete(REFRESH_COOKIE_NAME);

    return response;
  } catch (error) {
    console.error('Logout API error:', error);

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
