import { db } from '../drizzle';
import { UsersTable } from '../models/users';
import { hashPassword, verifyPassword } from '../utils/password';
import { eq } from 'drizzle-orm';
import { generateToken, generateRefreshToken } from '../utils/jwt';
import { type TokenPayload } from '../schemas/authSchema';

export class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthError';
  }
}

export interface LoginResult {
  user: {
    id: number;
    username: string;
    email: string;
  };
  accessToken: string;
  refreshToken: string;
}

/**
 * Login a user with email and password
 */
export async function loginUser(email: string, password: string): Promise<LoginResult> {
  try {

    // Find the user by email
    const users = await db
      .select()
      .from(UsersTable)
      .where(eq(UsersTable.email, email))
      .limit(1);
    
    const user = users[0];
    
    // Check if user exists
    if (!user) {
      throw new AuthError('Invalid email or password');
    }
    
    // Verify the password
    const isPasswordValid = await verifyPassword(password, user.password_hash);
    
    if (!isPasswordValid) {
      throw new AuthError('Invalid email or password');
    }
    
    // Generate JWT token payload
    const tokenPayload: TokenPayload = {
      userId: user.id,
      email: user.email,
      username: user.username,
    };
    
    // Generate tokens
    const accessToken = generateToken(tokenPayload);
    const refreshToken = generateRefreshToken(user.id);
    
    return {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
      },
      accessToken,
      refreshToken,
    };
  } catch (error) {
    if (error instanceof AuthError) {
      throw error;
    }
    
    console.error('Login error:', error);
    throw new AuthError('Authentication failed');
  }
} 