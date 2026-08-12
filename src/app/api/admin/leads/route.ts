import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';
import { Lead, Hospital, Service, LeadTransaction } from '@/models';
import { Op } from 'sequelize';

export async function GET() {
  try {
    const authUser = await getAuthUser();
    if (!authUser || (authUser.role !== 'SUPER_ADMIN' && authUser.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    await connectDB();

    // Auto-expire held UNASSIGNED leads older than 48 hours (2 days)
    const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);
    await Lead.update(
      { status: 'EXPIRED' },
      {
        where: {
          status: 'UNASSIGNED',
          createdAt: { [Op.lt]: fortyEightHoursAgo },
        },
      }
    );

    const hospitals = await Hospital.findAll({
      attributes: ['id', 'name', 'city', 'leadsRemaining', 'totalLeadsPurchased', 'totalLeadsUsed', 'status'],
      order: [['name', 'ASC']],
    });

    const leads = await Lead.findAll({
      include: [
        { model: Hospital, as: 'hospital', attributes: ['id', 'name', 'city'] },
        { model: Service, as: 'service', attributes: ['id', 'name', 'slug'] },
      ],
      order: [['createdAt', 'DESC']],
      limit: 500,
    });

    const leadTransactions = await LeadTransaction.findAll({
      include: [{ model: Hospital, as: 'hospital', attributes: ['id', 'name', 'city'] }],
      order: [['createdAt', 'DESC']],
      limit: 500,
    });

    return NextResponse.json({ hospitals, leads, leadTransactions });
  } catch (error) {
    console.error('Admin leads GET error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const authUser = await getAuthUser();
    if (!authUser || (authUser.role !== 'SUPER_ADMIN' && authUser.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const type = searchParams.get('type') || 'lead';

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    await connectDB();

    if (type === 'transaction') {
      const tx = await LeadTransaction.findByPk(id);
      if (!tx) return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
      await tx.destroy();
      return NextResponse.json({ message: 'Transaction deleted successfully' });
    } else {
      const lead = await Lead.findByPk(id);
      if (!lead) return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
      await lead.destroy();
      return NextResponse.json({ message: 'Lead deleted successfully' });
    }
  } catch (error) {
    console.error('Admin leads DELETE error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
