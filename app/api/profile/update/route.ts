import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { db } from '@/lib/drizzle';
import { UsersTable } from '@/lib/models/users';
import { getCurrentUser } from '@/lib/utils/auth';

export async function PUT(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { username, email } = body;

    // Check if email is already taken by another user
    const existingUser = await db
      .select()
      .from(UsersTable)
      .where(eq(UsersTable.email, email))
      .limit(1);

    if (existingUser.length > 0 && existingUser[0].email !== user.email) {
      return NextResponse.json({ error: 'Email is already taken' }, { status: 400 });
    }

    // Update user profile
    await db
      .update(UsersTable)
      .set({
        username,
        email,
        updated_at: new Date(),
      })
      .where(eq(UsersTable.email, user.email));

    return NextResponse.json({ message: 'Profile updated successfully' });
  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}
