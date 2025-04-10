import * as crypto from 'crypto';

import { eq } from 'drizzle-orm';
import { type NextRequest, NextResponse } from 'next/server';

import { db } from '../../../../lib/drizzle';
import type { User } from '../../../../lib/drizzle';
import { UsersTable } from '../../../../lib/models/users';
import { generatePasswordResetEmail, sendEmail } from '../../../../lib/utils/mailer';

/**
 * Handles the forgot password request
 * Generates a reset token, saves it to the user record, and sends an email
 */
export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Find the user by email
    const user = await db
      .select()
      .from(UsersTable)
      .where(eq(UsersTable.email, email))
      .limit(1)
      .then((users: User[]) => users[0] || null);

    // If user not found, still return success to prevent email enumeration attacks
    if (!user) {
      return NextResponse.json(
        { message: 'If your email is registered, you will receive a password reset link' },
        { status: 200 }
      );
    }

    // Generate a random token
    const token = crypto.randomBytes(32).toString('hex');

    // Set token expiration (7 days from now)
    const tokenExpiration = new Date();
    tokenExpiration.setDate(tokenExpiration.getDate() + 7);

    // Save the token to the user's record
    await db
      .update(UsersTable)
      .set({
        password_reset_token: token,
        token_expiration: tokenExpiration,
        updated_at: new Date(),
      })
      .where(eq(UsersTable.id, user.id));

    // Send the reset email
    const emailOptions = generatePasswordResetEmail(email, token);
    await sendEmail(emailOptions);

    return NextResponse.json(
      { message: 'If your email is registered, you will receive a password reset link' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in forgot password:', error);
    return NextResponse.json(
      { error: 'An error occurred while processing your request' },
      { status: 500 }
    );
  }
}
