import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { UsersTable } from "@/lib/models/users";
import { eq } from "drizzle-orm";
import { getCurrentUser } from "@/lib/utils/auth";
import bcrypt from "bcrypt";

export async function PUT(request: Request) {
  try {
    const user = getCurrentUser();
    if (!user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { oldPassword, newPassword } = body;

    // Get current user from database
    const dbUser = await db
      .select()
      .from(UsersTable)
      .where(eq(UsersTable.email, user.email))
      .limit(1);

    if (!dbUser.length) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Verify old password
    const isValidPassword = await bcrypt.compare(
      oldPassword,
      dbUser[0].password_hash
    );

    if (!isValidPassword) {
      return NextResponse.json(
        { error: "Current password is incorrect" },
        { status: 400 }
      );
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update password
    await db
      .update(UsersTable)
      .set({
        password_hash: hashedPassword,
        updated_at: new Date(),
      })
      .where(eq(UsersTable.email, user.email));

    return NextResponse.json({ message: "Password updated successfully" });
  } catch (error) {
    console.error("Password change error:", error);
    return NextResponse.json(
      { error: "Failed to change password" },
      { status: 500 }
    );
  }
} 