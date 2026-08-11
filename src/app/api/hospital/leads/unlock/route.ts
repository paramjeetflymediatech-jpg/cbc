import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';
import { Lead, Hospital, LeadTransaction } from '@/models';
import { sequelize } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const authUser = await getAuthUser();
    if (!authUser || authUser.role !== 'HOSPITAL' || !authUser.hospitalId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const { leadId } = await req.json();

    if (!leadId) {
      return NextResponse.json({ error: 'Lead ID is required' }, { status: 400 });
    }

    const hospital = await Hospital.findByPk(authUser.hospitalId);
    if (!hospital) {
      return NextResponse.json({ error: 'Hospital not found' }, { status: 404 });
    }

    if (hospital.leadsRemaining <= 0) {
      return NextResponse.json(
        { error: 'Insufficient lead balance. Please purchase a Lead Package (25 leads = 25 contacts) to unlock this patient lead.' },
        { status: 400 }
      );
    }

    const lead = await Lead.findOne({
      where: { id: Number(leadId), hospitalId: authUser.hospitalId },
    });

    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    if (lead.status !== 'UNASSIGNED') {
      return NextResponse.json({ error: 'This lead is already unlocked' }, { status: 400 });
    }

    // Execute transaction: Deduct 1 lead (1 lead = 1 contact)
    const transaction = await sequelize.transaction();
    try {
      const balanceBefore = hospital.leadsRemaining;
      const balanceAfter = balanceBefore - 1;
      const totalUsedAfter = (hospital.totalLeadsUsed || 0) + 1;

      await hospital.update(
        {
          leadsRemaining: balanceAfter,
          totalLeadsUsed: totalUsedAfter,
        },
        { transaction }
      );

      await lead.update(
        {
          status: 'NEW',
          notes: [
            ...(lead.notes || []),
            {
              content: `Lead unlocked by hospital. 1 lead deducted. Remaining balance: ${balanceAfter}`,
              author: 'Hospital Admin',
              createdAt: new Date().toISOString(),
            },
          ],
        },
        { transaction }
      );

      await LeadTransaction.create(
        {
          hospitalId: hospital.id,
          leadId: lead.id,
          transactionType: 'LEAD_CONSUMED',
          leadAmount: -1,
          balanceBefore,
          balanceAfter,
          description: `Unlocked pending lead for patient ${lead.patientName}`,
        },
        { transaction }
      );

      await transaction.commit();

      return NextResponse.json({
        message: 'Lead unlocked successfully! 1 lead deducted.',
        lead,
        leadsRemaining: balanceAfter,
      });
    } catch (txErr) {
      await transaction.rollback();
      console.error('Lead unlock transaction error:', txErr);
      return NextResponse.json({ error: 'Failed to unlock lead' }, { status: 500 });
    }
  } catch (error) {
    console.error('Hospital lead unlock error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
