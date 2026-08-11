import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';
import { Lead, Service, Hospital } from '@/models';
import { Op } from 'sequelize';

export async function GET(req: Request) {
  try {
    const authUser = await getAuthUser();
    if (!authUser || authUser.role !== 'HOSPITAL' || !authUser.hospitalId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const hospital = await Hospital.findByPk(authUser.hospitalId, {
      attributes: ['id', 'name', 'leadsRemaining'],
    });

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

    const { searchParams } = new URL(req.url);

    const status = searchParams.get('status');
    const search = searchParams.get('search');

    const where: any = {
      hospitalId: authUser.hospitalId,
    };

    if (status) {
      where.status = status;
    }

    if (search) {
      where[Op.or] = [
        { patientName: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
        { phone: { [Op.like]: `%${search}%` } },
        { city: { [Op.like]: `%${search}%` } },
      ];
    }

    const rawLeads = await Lead.findAll({
      where,
      include: [{ model: Service, as: 'service', attributes: ['id', 'name', 'slug'] }],
      order: [['createdAt', 'DESC']],
    });

    // Mask contact details for UNASSIGNED held leads (0 balance)
    const leads = rawLeads.map((l: any) => {
      const leadJson = l.toJSON();
      if (leadJson.status === 'UNASSIGNED') {
        const phone = leadJson.phone || '';
        const email = leadJson.email || '';

        // Calculate hours remaining before 48-hour expiration
        const createdMs = new Date(leadJson.createdAt).getTime();
        const expiresMs = createdMs + 48 * 60 * 60 * 1000;
        const hoursLeft = Math.max(0, Math.floor((expiresMs - Date.now()) / (1000 * 60 * 60)));

        leadJson.phone = phone.length > 4 ? `XXXXXX${phone.slice(-4)}` : 'XXXXXX****';
        leadJson.email = email.includes('@') ? `${email[0]}***@${email.split('@')[1]}` : 'hidden***@mail.com';
        leadJson.patientName = `${leadJson.patientName} (Locked - Expires in ${hoursLeft}h)`;
      }
      return leadJson;
    });

    return NextResponse.json({ leads, hospital });
  } catch (error) {
    console.error('Hospital leads GET error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const authUser = await getAuthUser();
    if (!authUser || authUser.role !== 'HOSPITAL' || !authUser.hospitalId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const { leadId, status } = await req.json();

    if (!leadId || !status) {
      return NextResponse.json({ error: 'Lead ID and status are required' }, { status: 400 });
    }

    const lead = await Lead.findOne({
      where: { id: Number(leadId), hospitalId: authUser.hospitalId },
    });

    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    if (lead.status === 'UNASSIGNED' || lead.status === 'EXPIRED') {
      return NextResponse.json(
        { error: 'Cannot update status of a locked or expired lead. Please purchase a lead package to unlock contact details.' },
        { status: 400 }
      );
    }

    await lead.update({ status });
    return NextResponse.json({ message: 'Lead status updated', lead });
  } catch (error) {
    console.error('Hospital lead update error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
