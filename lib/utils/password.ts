import bcrypt from 'bcryptjs';

// Number of salt rounds for bcrypt hashing
const SALT_ROUNDS = 10;

/**
 * Hash a password
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(SALT_ROUNDS);
  return bcrypt.hash(password, salt);
}

/**
 * Compare a password with a hash
 */
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
} 