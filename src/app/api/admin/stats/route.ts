import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';
import { Hospital, Lead, Payment, LeadPackage, Service } from '@/models';

export async function GET() {
  try {
    const authUser = await getAuthUser();
    if (!authUser || (authUser.role !== 'SUPER_ADMIN' && authUser.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    await connectDB();

    const totalHospitals = await Hospital.count();
    const pendingHospitals = await Hospital.count({ where: { status: 'PENDING' } });
    const approvedHospitals = await Hospital.count({ where: { status: 'APPROVED' } });
    const totalLeads = await Lead.count();
    const activePackagesCount = await LeadPackage.count({ where: { status: 'ACTIVE' } });
    const activeServicesCount = await Service.count({ where: { status: 'ACTIVE' } });

    const totalRevenueSum = await Payment.sum('amount', { where: { status: 'SUCCESS' } });

    // Recent 5 leads
    const recentLeads = await Lead.findAll({
      include: [
        { model: Hospital, as: 'hospital', attributes: ['name'] },
        { model: Service, as: 'service', attributes: ['name'] },
      ],
      order: [['createdAt', 'DESC']],
      limit: 5,
    });

    // Recent 5 payments
    const recentPayments = await Payment.findAll({
      where: { status: 'SUCCESS' },
      include: [{ model: Hospital, as: 'hospital', attributes: ['name'] }],
      order: [['createdAt', 'DESC']],
      limit: 5,
    });

    return NextResponse.json({
      stats: {
        totalHospitals,
        pendingHospitals,
        approvedHospitals,
        totalLeads,
        totalRevenue: totalRevenueSum || 0,
        activePackagesCount,
        activeServicesCount,
      },
      recentLeads,
      recentPayments,
    });
  } catch (error) {
    console.error('Admin stats GET error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
