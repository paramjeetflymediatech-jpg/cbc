import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { User } from '@/models';
import { hashPassword, signToken } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    await connectDB();
    const { name, email, password, phone } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Name, email, and password are required' }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();

    // Check duplicate user email
    const existingUser = await User.findOne({ where: { email: cleanEmail } });
    if (existingUser) {
      return NextResponse.json({ error: 'An account with this email already exists.' }, { status: 400 });
    }

    const passHash = await hashPassword(password);
    const user = await User.create({
      name: name.trim(),
      email: cleanEmail,
      passwordHash: passHash,
      role: 'PATIENT',
      phone: phone ? phone.trim() : null,
      status: 'ACTIVE',
    });

    const tokenPayload = {
      userId: String(user.id),
      email: user.email,
      role: user.role,
      name: user.name,
    };

    const token = signToken(tokenPayload);

    const response = NextResponse.json({
      message: 'Registration successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
      },
    });

    response.cookies.set({
      name: 'cbc_token',
      value: token,
      httpOnly: true,
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      sameSite: 'lax',
    });

    return response;
  } catch (error) {
    console.error('Registration API error:', error);
    return NextResponse.json({ error: 'Server error during registration' }, { status: 500 });
  }
}
