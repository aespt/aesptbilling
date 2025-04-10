import { sign, verify } from 'jsonwebtoken';

import { type TokenPayload } from '../schemas/authSchema';

// Environment variables for JWT configuration
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export const AUTH_COOKIE_NAME = 'aespt_auth_token';
export const REFRESH_COOKIE_NAME = 'aespt_refresh_token';

/**
 * Generate a JWT token for the user
 */
export function generateToken(payload: TokenPayload): string {
  return sign(payload, JWT_SECRET);
}

/**
 * Generate a refresh token for the user
 */
export function generateRefreshToken(userId: number): string {
  return sign({ userId }, JWT_SECRET);
}

/**
 * Verify JWT token
 */
export function verifyToken<T>(token: string): T | null {
  try {
    return verify(token, JWT_SECRET) as T;
  } catch {
    return null;
  }
}

/**
 * Get cookie configuration for access token
 */
export function getAccessTokenCookieConfig(rememberMe: boolean = false) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict' as const,
    path: '/',
    maxAge: rememberMe ? 60 * 60 * 24 : undefined, // 1 day if remember me, session otherwise
  };
}

/**
 * Get cookie configuration for refresh token
 */
export function getRefreshTokenCookieConfig(rememberMe: boolean = false) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict' as const,
    path: '/',
    maxAge: rememberMe ? 60 * 60 * 24 * 7 : 60 * 60 * 24, // 7 days if remember me, 1 day otherwise
  };
}
