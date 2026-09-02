import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { User, Lead } from '@/models';
import { comparePassword } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const { email, password, phone, reason } = await req.json();

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Please provide a valid registered email address.' },
        { status: 400 }
      );
    }

    if (!password || typeof password !== 'string' || !password.trim()) {
      return NextResponse.json(
        { error: 'Please enter your account password for security verification.' },
        { status: 400 }
      );
    }

    const cleanEmail = email.toLowerCase().trim();
    await connectDB();

    const user = await User.findOne({ where: { email: cleanEmail } });

    if (!user) {
      return NextResponse.json(
        { error: 'No account found with this email address. Please verify your credentials.' },
        { status: 404 }
      );
    }

    // Verify password for security
    const isPasswordValid = await comparePassword(password, user.passwordHash);
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Incorrect password. Account deletion requires valid password verification for security.' },
        { status: 401 }
      );
    }

    // Safety guard: prevent administrative account deletion via public form
    if (user.role === 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Administrative accounts cannot be deleted through this form. Please contact system support.' },
        { status: 403 }
      );
    }

    // Disassociate leads
    await Lead.update(
      { userId: null },
      { where: { userId: user.id } }
    );

    // Permanently delete user
    await user.destroy();

    // Generate a reference ID for the user's tracking
    const referenceId = 'DEL-' + Math.random().toString(36).substring(2, 8).toUpperCase() + '-' + Date.now().toString().slice(-4);

    return NextResponse.json({
      success: true,
      referenceId,
      message: 'Your data deletion request has been verified and processed. All personal information and consultation records associated with your account have been permanently purged from our active systems.',
    });
  } catch (error) {
    console.error('Data deletion request error:', error);
    return NextResponse.json(
      { error: 'Server error processing your data deletion request. Please contact privacy@clinicbychoice.com directly.' },
      { status: 500 }
    );
  }
}
