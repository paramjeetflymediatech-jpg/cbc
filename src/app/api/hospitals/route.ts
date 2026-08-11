import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Hospital, Service, HospitalService } from '@/models';
import { Op } from 'sequelize';

export async function GET(req: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);

    const serviceSlug = searchParams.get('service');
    const city = searchParams.get('city');
    const search = searchParams.get('search');

    const whereCondition: any = {
      status: 'APPROVED',
      accountStatus: 'ACTIVE',
    };

    if (city) {
      whereCondition.city = { [Op.like]: `%${city}%` };
    }

    if (search) {
      whereCondition[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { city: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } },
      ];
    }

    let hospitalInclude: any[] = [
      {
        model: HospitalService,
        as: 'hospitalServices',
        where: { status: 'ACTIVE' },
        required: false,
        include: [
          {
            model: Service,
            as: 'service',
            attributes: ['id', 'name', 'slug'],
          },
        ],
      },
    ];

    if (serviceSlug) {
      const targetService = await Service.findOne({ where: { slug: serviceSlug, status: 'ACTIVE' } });
      if (targetService) {
        hospitalInclude = [
          {
            model: HospitalService,
            as: 'hospitalServices',
            where: { serviceId: targetService.id, status: 'ACTIVE' },
            required: true,
            include: [
              {
                model: Service,
                as: 'service',
                attributes: ['id', 'name', 'slug'],
              },
            ],
          },
        ];
      }
    }

    const hospitals = await Hospital.findAll({
      where: whereCondition,
      include: hospitalInclude,
      order: [['isFeatured', 'DESC'], ['rating', 'DESC'], ['createdAt', 'DESC']],
    });

    return NextResponse.json({ hospitals });
  } catch (error) {
    console.error('Fetch hospitals error:', error);
    return NextResponse.json({ error: 'Failed to fetch hospitals' }, { status: 500 });
  }
}
