import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/drizzle';
import { UsersTable } from '@/lib/models/users';
import { verifyToken } from '@/lib/utils/jwt';
import { AUTH_COOKIE_NAME } from '@/lib/utils/jwt';
import { eq } from 'drizzle-orm';
import { TokenPayload } from '@/lib/schemas/authSchema';

export async function GET(request: NextRequest) {
  try {
    // Get token from cookies
    const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
    
    if (!token) {
      return NextResponse.json(
        { 
          authenticated: false,
          message: 'Not authenticated' 
        },
        { status: 401 }
      );
    }
    
    // Verify token
    const payload = verifyToken<TokenPayload>(token);
    
    if (!payload) {
      return NextResponse.json(
        { 
          authenticated: false,
          message: 'Invalid token' 
        },
        { status: 401 }
      );
    }
    
    // Get user from database
    const users = await db
      .select({
        id: UsersTable.id,
        username: UsersTable.username,
        email: UsersTable.email,
      })
      .from(UsersTable)
      .where(eq(UsersTable.id, payload.userId))
      .limit(1);
    
    const user = users[0];
    
    if (!user) {
      return NextResponse.json(
        { 
          authenticated: false,
          message: 'User not found' 
        },
        { status: 401 }
      );
    }
    
    // Return user data
    return NextResponse.json({
      authenticated: true,
      user
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    
    return NextResponse.json(
      { 
        authenticated: false,
        message: 'Internal server error' 
      },
      { status: 500 }
    );
  }
} 