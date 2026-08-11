import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';
import { Hospital, User, Notification } from '@/models';

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
    const hospital = await Hospital.findByPk(id);

    if (!hospital) {
      return NextResponse.json({ error: 'Hospital not found' }, { status: 404 });
    }

    await hospital.update({
      status: 'APPROVED',
      accountStatus: 'ACTIVE',
      rejectionReason: null,
    });

    // Ensure associated user is ACTIVE
    await User.update(
      { status: 'ACTIVE' },
      { where: { hospitalId: hospital.id } }
    );

    // Create Notification for Hospital
    await Notification.create({
      recipientType: 'HOSPITAL',
      recipientId: hospital.id,
      title: 'Hospital Account Approved',
      message: 'Your hospital registration has been approved! You can now log into your dashboard and purchase lead packages.',
      type: 'SYSTEM',
      isRead: false,
    });

    return NextResponse.json({ message: 'Hospital approved successfully', hospital });
  } catch (error) {
    console.error('Approve hospital error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
