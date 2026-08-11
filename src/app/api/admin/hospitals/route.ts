import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { getAuthUser, hashPassword } from '@/lib/auth';
import { Hospital, User, Service, initAssociations } from '@/models';
import { Op } from 'sequelize';

export async function GET(req: Request) {
  try {
    const authUser = await getAuthUser();
    if (!authUser || (authUser.role !== 'SUPER_ADMIN' && authUser.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized admin access' }, { status: 403 });
    }

    await connectDB();
    initAssociations();

    const { searchParams } = new URL(req.url);

    const status = searchParams.get('status');
    const search = searchParams.get('search');

    const where: any = {};
    if (status) {
      where.status = status;
    }
    if (search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { city: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
      ];
    }

    const hospitals = await Hospital.findAll({
      where,
      include: [
        {
          model: Service,
          as: 'services',
          through: { attributes: [] },
          required: false,
        },
      ],
      order: [['createdAt', 'DESC']],
    });

    return NextResponse.json({ hospitals });
  } catch (error) {
    console.error('Admin hospitals GET error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const authUser = await getAuthUser();
    if (!authUser || (authUser.role !== 'SUPER_ADMIN' && authUser.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized admin access' }, { status: 403 });
    }

    await connectDB();
    initAssociations();

    const body = await req.json();

    const {
      name,
      email,
      phone,
      password,
      city,
      state,
      address,
      website,
      description,
      leadsRemaining,
      status,
    } = body;

    if (!name || !email || !phone || !password || !city || !address) {
      return NextResponse.json({ error: 'Hospital Name, Email, Phone, Password, City and Address are required.' }, { status: 400 });
    }

    const existingUser = await User.findOne({ where: { email: email.toLowerCase().trim() } });
    if (existingUser) {
      return NextResponse.json({ error: 'An account with this email already exists.' }, { status: 400 });
    }

    let baseSlug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
    if (!baseSlug) baseSlug = 'clinic';

    let slug = baseSlug;
    let count = 1;
    while (await Hospital.findOne({ where: { slug } })) {
      slug = `${baseSlug}-${count++}`;
    }

    const initialLeads = leadsRemaining ? Number(leadsRemaining) : 50;

    const hospital = await Hospital.create({
      name: name.trim(),
      slug,
      email: email.toLowerCase().trim(),
      phone: phone.trim(),
      website: website ? website.trim() : null,
      address: address.trim(),
      city: city.trim(),
      state: state ? state.trim() : 'Maharashtra',
      country: 'India',
      description: description ? description.trim() : 'Accredited multi-specialty hospital providing quality healthcare services.',
      status: status || 'APPROVED',
      accountStatus: 'ACTIVE',
      leadsRemaining: initialLeads,
      totalLeadsPurchased: initialLeads,
      totalLeadsUsed: 0,
      doctors: [],
      facilities: [],
      faqs: [],
      rating: 4.9,
      isFeatured: true,
    });

    const passHash = await hashPassword(password);
    await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      passwordHash: passHash,
      role: 'HOSPITAL',
      hospitalId: hospital.id,
      phone: phone.trim(),
      status: 'ACTIVE',
    });

    return NextResponse.json({ message: 'Hospital created successfully', hospital }, { status: 201 });
  } catch (error) {
    console.error('Admin POST hospital error:', error);
    return NextResponse.json({ error: 'Server error creating hospital' }, { status: 500 });
  }
}
