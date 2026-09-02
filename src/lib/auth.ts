import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { cookies, headers } from 'next/headers';

const JWT_SECRET = process.env.JWT_SECRET || 'cbc_super_secret_jwt_key_2026';

export interface TokenPayload {
  userId: string;
  email: string;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'HOSPITAL' | 'PATIENT';
  hospitalId?: string;
  name: string;
}

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function signToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch {
    return null;
  }
}

export async function getAuthUser(): Promise<TokenPayload | null> {
  try {
    // 1. Try session cookie first
    const cookieStore = await cookies();
    let token = cookieStore.get('cbc_token')?.value;

    // 2. If no cookie, try Authorization header (used by mobile app API client)
    if (!token) {
      const headerList = await headers();
      const authHeader = headerList.get('authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7).trim();
      }
    }

    if (!token) return null;
    return verifyToken(token);
  } catch {
    return null;
  }
}
