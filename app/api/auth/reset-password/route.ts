import { NextRequest, NextResponse } from 'next/server';
// Import using relative paths - more reliable than aliases in some cases
import { db } from '../../../../lib/db';
import { eq, and, gt } from 'drizzle-orm';
import { UsersTable } from '../../../../lib/models/users';
import bcrypt from 'bcrypt';
import { User } from '../../../../lib/drizzle';

/**
 * Reset a password using a valid token
 */
export async function POST(request: NextRequest) {
  try {
    const { token, password } = await request.json();

    if (!token || !password) {
      return NextResponse.json(
        { error: 'Token and password are required' },
        { status: 400 }
      );
    }

    // Find the user by token
    const user = await db
      .select()
      .from(UsersTable)
      .where(
        and(
          eq(UsersTable.password_reset_token, token),
          gt(UsersTable.token_expiration as any, new Date()) // Token is not expired
        )
      )
      .limit(1)
      .then((users: User[]) => users[0] || null);

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 400 }
      );
    }

    // Hash the new password
    const saltRounds = 10;
    const password_hash = await bcrypt.hash(password, saltRounds);

    // Update the user's password and clear the reset token
    await db
      .update(UsersTable)
      .set({
        password_hash,
        password_reset_token: null,
        token_expiration: null,
        updated_at: new Date(),
      })
      .where(eq(UsersTable.id, user.id));

    return NextResponse.json(
      { message: 'Password has been reset successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error resetting password:', error);
    return NextResponse.json(
      { error: 'An error occurred while resetting your password' },
      { status: 500 }
    );
  }
} 