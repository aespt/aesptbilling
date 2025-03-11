import { NextRequest, NextResponse } from 'next/server';
import { loginUser, AuthError } from '@/lib/services/authService';
import { LoginSchema } from '@/lib/schemas/authSchema';
import { AUTH_COOKIE_NAME, REFRESH_COOKIE_NAME, getAccessTokenCookieConfig, getRefreshTokenCookieConfig } from '@/lib/utils/jwt';

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    
    // Validate request body against schema
    const validationResult = LoginSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Validation error', 
          details: validationResult.error.format() 
        }, 
        { status: 400 }
      );
    }
    
    // Extract validated data
    const { email, password, rememberMe = false } = validationResult.data;
    
    // Attempt login
    const loginResult = await loginUser(email, password);
    
    // Create response
    const response = NextResponse.json({
      success: true,
      user: loginResult.user
    });
    
    // Set access token cookie
    response.cookies.set({
      name: AUTH_COOKIE_NAME,
      value: loginResult.accessToken,
      ...getAccessTokenCookieConfig(rememberMe)
    });
    
    // Set refresh token cookie
    response.cookies.set({
      name: REFRESH_COOKIE_NAME,
      value: loginResult.refreshToken,
      ...getRefreshTokenCookieConfig(rememberMe)
    });
    
    return response;
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message },
        { status: 401 }
      );
    }
    
    console.error('Login API error:', error);
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 