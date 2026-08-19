import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { User, Hospital } from '@/models';
import { comparePassword, signToken } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    await connectDB();
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    const user = await User.findOne({ where: { email: email.toLowerCase().trim() } });
    if (!user) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const isValid = await comparePassword(password, user.passwordHash);
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    if (user.status !== 'ACTIVE') {
      return NextResponse.json({ error: 'Account is deactivated' }, { status: 403 });
    }

    // If hospital user, check hospital status
    if (user.role === 'HOSPITAL' && user.hospitalId) {
      const hospital = await Hospital.findByPk(user.hospitalId);
      if (!hospital) {
        return NextResponse.json({ error: 'Associated hospital record not found' }, { status: 404 });
      }
      if (hospital.status === 'PENDING') {
        return NextResponse.json(
          { error: 'Your hospital registration is currently under review by our team.' },
          { status: 403 }
        );
      }
      if (hospital.status === 'REJECTED') {
        return NextResponse.json(
          { error: `Registration rejected: ${hospital.rejectionReason || 'Contact support'}` },
          { status: 403 }
        );
      }
      if (hospital.status === 'SUSPENDED') {
        return NextResponse.json({ error: 'Hospital account has been suspended.' }, { status: 403 });
      }
    }

    // Attach all unlinked leads with this email to the user account
    const { Lead } = await import('@/models/Lead');
    await Lead.update(
      { userId: user.id },
      { where: { email: user.email.toLowerCase().trim(), userId: null } }
    );

    const tokenPayload = {
      userId: String(user.id),
      email: user.email,
      role: user.role,
      hospitalId: user.hospitalId ? String(user.hospitalId) : undefined,
      name: user.name,
    };

    const token = signToken(tokenPayload);

    const response = NextResponse.json({
      message: 'Login successful',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        hospitalId: user.hospitalId,
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
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Server error during authentication' }, { status: 500 });
  }
}
