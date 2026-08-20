import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { User } from '@/models';
import { hashPassword } from '@/lib/auth';
import { sendPasswordResetEmail } from '@/lib/mailer';

export async function POST(req: Request) {
  try {
    await connectDB();
    const { email } = await req.json();

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Please provide a valid email address' }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();
    const user = await User.findOne({ where: { email: cleanEmail } });

    if (!user) {
      // For security and privacy, respond politely
      return NextResponse.json(
        {
          success: true,
          message: 'If an account exists with this email address, password reset instructions have been sent.',
        },
        { status: 200 }
      );
    }

    if (user.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: 'This account is currently deactivated. Please contact support.' },
        { status: 403 }
      );
    }

    // Generate clean, readable temporary password
    const tempPassword = `CBC-${Math.floor(100000 + Math.random() * 900000)}`;
    const passHash = await hashPassword(tempPassword);

    await user.update({ passwordHash: passHash });

    // Send email with new password
    await sendPasswordResetEmail({
      name: user.name,
      email: user.email,
      newPassword: tempPassword,
    });

    return NextResponse.json({
      success: true,
      message: 'A new temporary password has been sent to your email. Please check your inbox (and spam folder) to log in.',
    });
  } catch (error) {
    console.error('Forgot password API error:', error);
    return NextResponse.json({ error: 'Server error processing password reset request.' }, { status: 500 });
  }
}
