import { cookies } from 'next/headers';
import { verifyToken } from './jwt';
import { TokenPayload } from '../schemas/authSchema';
import { AUTH_COOKIE_NAME } from './jwt';

/**
 * Get the current user from server components
 */
export function getCurrentUser(): TokenPayload | null {
  try {
    const cookiesList = cookies();
    const token = cookiesList.get(AUTH_COOKIE_NAME)?.value;
    
    if (!token) {
      return null;
    }
    
    return verifyToken<TokenPayload>(token);
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
} 