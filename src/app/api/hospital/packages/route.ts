import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { LeadPackage, HospitalPackage, Payment } from '@/models';
import { getAuthUser } from '@/lib/auth';

export async function GET() {
  try {
    const authUser = await getAuthUser();
    if (!authUser || authUser.role !== 'HOSPITAL' || !authUser.hospitalId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const packages = await LeadPackage.findAll({
      where: { status: 'ACTIVE' },
      order: [['price', 'ASC']],
    });

    const activePackages = await HospitalPackage.findAll({
      where: { hospitalId: authUser.hospitalId },
      include: [
        { model: LeadPackage, as: 'package' },
        { model: Payment, as: 'payment' },
      ],
      order: [['purchasedAt', 'DESC']],
    });

    const recentPayments = await Payment.findAll({
      where: { hospitalId: authUser.hospitalId },
      include: [{ model: LeadPackage, as: 'package' }],
      order: [['createdAt', 'DESC']],
      limit: 10,
    });

    return NextResponse.json({ packages, activePackages, recentPayments });
  } catch (error) {
    console.error('Fetch packages error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
