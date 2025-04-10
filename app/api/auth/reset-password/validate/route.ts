import { eq, and, gt } from 'drizzle-orm';
import { type NextRequest, NextResponse } from 'next/server';

import { db } from '../../../../../lib/drizzle';
import type { User } from '../../../../../lib/drizzle';
import { UsersTable } from '../../../../../lib/models/users';

/**
 * Validate a password reset token
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 });
    }

    // Find the user by token
    const user = await db
      .select()
      .from(UsersTable)
      .where(
        and(
          eq(UsersTable.password_reset_token, token),
          gt(UsersTable.token_expiration, new Date()) // Token is not expired
        )
      )
      .limit(1)
      .then((users: User[]) => users[0] || null);

    if (!user) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 400 });
    }

    return NextResponse.json({ valid: true }, { status: 200 });
  } catch (error) {
    console.error('Error validating token:', error);
    return NextResponse.json(
      { error: 'An error occurred while validating the token' },
      { status: 500 }
    );
  }
}
