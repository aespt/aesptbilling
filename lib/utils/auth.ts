import { cookies } from 'next/headers';

import type { TokenPayload } from '../schemas/authSchema';

import { AUTH_COOKIE_NAME, verifyToken } from './jwt';

/**
 * Get the current user from server components
 */
export async function getCurrentUser(): Promise<TokenPayload | null> {
  try {
    const cookiesList = await cookies();
    const token = cookiesList.get(AUTH_COOKIE_NAME)?.value;

    if (!token) {
      return null;
    }

    return verifyToken<TokenPayload>(token);
  } catch {
    return null;
  }
}
