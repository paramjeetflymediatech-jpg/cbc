import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';
import { Hospital, User, HospitalService, Lead, LeadTransaction, Notification } from '@/models';

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await getAuthUser();
    if (!authUser || (authUser.role !== 'SUPER_ADMIN' && authUser.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized: Only Super Admin can delete hospitals.' }, { status: 403 });
    }

    await connectDB();
    const { id } = await params;
    const hospitalId = Number(id);

    const hospital = await Hospital.findByPk(hospitalId);
    if (!hospital) {
      return NextResponse.json({ error: 'Hospital not found' }, { status: 404 });
    }

    // Cascade purge associated records
    await User.destroy({ where: { hospitalId } });
    await HospitalService.destroy({ where: { hospitalId } });
    await Lead.destroy({ where: { hospitalId } });
    await LeadTransaction.destroy({ where: { hospitalId } });
    await Notification.destroy({ where: { recipientType: 'HOSPITAL', recipientId: hospitalId } });

    // Permanently Delete Hospital Record
    await hospital.destroy();

    return NextResponse.json({
      message: `Hospital "${hospital.name}" and all associated leads and user accounts have been permanently deleted.`,
    });
  } catch (error) {
    console.error('Delete hospital error:', error);
    return NextResponse.json({ error: 'Server error deleting hospital.' }, { status: 500 });
  }
}
