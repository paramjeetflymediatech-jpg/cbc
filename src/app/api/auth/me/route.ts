import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { User, Hospital } from '@/models';

export async function GET() {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    await connectDB();
    const user = await User.findByPk(authUser.userId, {
      attributes: { exclude: ['passwordHash'] },
    });

    if (!user) {
      return NextResponse.json({ user: null }, { status: 404 });
    }

    let hospital = null;
    if (user.hospitalId) {
      hospital = await Hospital.findByPk(user.hospitalId);
    }

    return NextResponse.json({ user, hospital });
  } catch (error) {
    console.error('Auth me error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
