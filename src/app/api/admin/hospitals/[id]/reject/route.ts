import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';
import { Hospital } from '@/models';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const authUser = await getAuthUser();

    if (!authUser || (authUser.role !== 'SUPER_ADMIN' && authUser.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized admin access' }, { status: 403 });
    }

    await connectDB();
    const { rejectionReason } = await req.json();

    if (!rejectionReason) {
      return NextResponse.json({ error: 'Rejection reason is required' }, { status: 400 });
    }

    const hospital = await Hospital.findByPk(id);
    if (!hospital) {
      return NextResponse.json({ error: 'Hospital not found' }, { status: 404 });
    }

    await hospital.update({
      status: 'REJECTED',
      rejectionReason: rejectionReason.trim(),
    });

    return NextResponse.json({ message: 'Hospital registration rejected', hospital });
  } catch (error) {
    console.error('Reject hospital error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
