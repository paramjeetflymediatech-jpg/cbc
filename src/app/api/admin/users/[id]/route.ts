import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';
import { User, Hospital, Lead, Service } from '@/models';
import { Op } from 'sequelize';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authUser = await getAuthUser();
    if (!authUser || (authUser.role !== 'SUPER_ADMIN' && authUser.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 403 });
    }

    await connectDB();
    const { id } = await params;
    const userId = Number(id);

    if (!userId || isNaN(userId)) {
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 });
    }

    const user = await User.findByPk(userId, {
      attributes: [
        'id',
        'name',
        'email',
        'role',
        'hospitalId',
        'phone',
        'avatar',
        'address',
        'city',
        'state',
        'pincode',
        'status',
        'createdAt',
        'updatedAt',
      ],
      include: [
        {
          model: Hospital,
          as: 'hospital',
          attributes: [
            'id',
            'name',
            'slug',
            'city',
            'state',
            'district',
            'address',
            'phone',
            'email',
            'rating',
            'leadsRemaining',
            'totalLeadsPurchased',
            'totalLeadsUsed',
            'status',
            'accountStatus',
          ],
          required: false,
        },
      ],
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Fetch all enquiries associated with this user (by userId OR user email)
    const cleanEmail = user.email.toLowerCase().trim();
    const leads = await Lead.findAll({
      where: {
        [Op.or]: [{ userId: user.id }, { email: cleanEmail }],
      },
      include: [
        {
          model: Hospital,
          as: 'hospital',
          attributes: [
            'id',
            'name',
            'slug',
            'city',
            'state',
            'district',
            'address',
            'logo',
            'coverImage',
            'phone',
            'email',
            'rating',
            'isNabhAccredited',
            'isVerifiedPartner',
          ],
        },
        {
          model: Service,
          as: 'service',
          attributes: ['id', 'name', 'slug', 'category', 'image', 'icon'],
        },
      ],
      order: [['createdAt', 'DESC']],
    });

    // Group unique contacted hospitals for this user
    const hospitalMap = new Map<number | string, any>();
    leads.forEach((l: any) => {
      if (l.hospital) {
        const hId = l.hospital.id;
        if (!hospitalMap.has(hId)) {
          hospitalMap.set(hId, {
            ...(typeof l.hospital.toJSON === 'function' ? l.hospital.toJSON() : l.hospital),
            enquiryCount: 1,
            lastEnquiryDate: l.createdAt,
          });
        } else {
          hospitalMap.get(hId).enquiryCount += 1;
        }
      }
    });

    const contactedHospitals = Array.from(hospitalMap.values());

    return NextResponse.json({
      success: true,
      user,
      leads,
      contactedHospitals,
      stats: {
        totalEnquiries: leads.length,
        totalHospitalsContacted: contactedHospitals.length,
        activeEnquiries: leads.filter((l) => ['NEW', 'CONTACTED', 'IN_PROGRESS'].includes(l.status)).length,
        convertedEnquiries: leads.filter((l) => l.status === 'CONVERTED').length,
      },
    });
  } catch (error) {
    console.error('Admin user detail GET error:', error);
    return NextResponse.json({ error: 'Server error retrieving user details' }, { status: 500 });
  }
}
