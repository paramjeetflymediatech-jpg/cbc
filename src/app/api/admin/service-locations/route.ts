import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { ServiceLocation, Service } from '@/models';
import { Op } from 'sequelize';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const serviceId = searchParams.get('serviceId');
    const city = searchParams.get('city');
    const search = searchParams.get('search');
    const countsOnly = searchParams.get('countsOnly') === 'true';

    const where: any = {};
    if (serviceId && serviceId !== 'ALL' && serviceId.trim() !== '') {
      where.serviceId = Number(serviceId);
    }
    if (city && city.trim() !== '') {
      where.citySlug = city.toLowerCase().replace(/\s+/g, '-');
    }
    if (search && search.trim() !== '') {
      const q = search.trim();
      where[Op.or] = [
        { cityName: { [Op.like]: `%${q}%` } },
        { serviceSlug: { [Op.like]: `%${q}%` } },
        { serviceTitle: { [Op.like]: `%${q}%` } },
        { stateName: { [Op.like]: `%${q}%` } },
      ];
    }

    // Fast counts only
    if (countsOnly) {
      const total = await ServiceLocation.count();
      return NextResponse.json({ success: true, total });
    }

    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.max(1, Math.min(100, parseInt(searchParams.get('limit') || '20', 10)));
    const offset = (page - 1) * limit;

    const { count, rows: locations } = await ServiceLocation.findAndCountAll({
      where,
      include: [
        {
          model: Service,
          as: 'service',
          attributes: ['id', 'name', 'slug', 'category'],
          required: false,
        },
      ],
      order: [['cityName', 'ASC'], ['updatedAt', 'DESC']],
      limit,
      offset,
    });

    return NextResponse.json({
      success: true,
      locations,
      total: count,
      page,
      limit,
      totalPages: Math.ceil(count / limit),
    });
  } catch (error: any) {
    console.error('Error fetching service locations:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch service locations' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();
    const {
      serviceId,
      cityName,
      stateName,
      serviceTitle,
      shortDescription,
      description,
      seoTitle,
      seoDescription,
      seoKeywords,
      faqs,
      status,
    } = body;

    if (!serviceId || !cityName) {
      return NextResponse.json({ error: 'Service and City Name are required' }, { status: 400 });
    }

    const service = await Service.findByPk(Number(serviceId));
    if (!service) {
      return NextResponse.json({ error: 'Selected service does not exist' }, { status: 404 });
    }

    const citySlug = cityName.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    // Upsert or create
    const [record, created] = await ServiceLocation.findOrCreate({
      where: {
        serviceId: service.id,
        citySlug,
      },
      defaults: {
        serviceId: service.id,
        serviceSlug: service.slug,
        cityName: cityName.trim(),
        citySlug,
        stateName: stateName || null,
        serviceTitle: serviceTitle || `${service.name} in ${cityName.trim()}`,
        shortDescription: shortDescription || null,
        description: description || null,
        seoTitle: seoTitle || null,
        seoDescription: seoDescription || null,
        seoKeywords: seoKeywords || null,
        faqs: faqs && Array.isArray(faqs) ? faqs : [],
        status: status || 'ACTIVE',
      },
    });

    if (!created) {
      await record.update({
        serviceSlug: service.slug,
        stateName: stateName || record.stateName,
        serviceTitle: serviceTitle || record.serviceTitle || `${service.name} in ${cityName.trim()}`,
        shortDescription: shortDescription !== undefined ? shortDescription : record.shortDescription,
        description: description !== undefined ? description : record.description,
        seoTitle: seoTitle !== undefined ? seoTitle : record.seoTitle,
        seoDescription: seoDescription !== undefined ? seoDescription : record.seoDescription,
        seoKeywords: seoKeywords !== undefined ? seoKeywords : record.seoKeywords,
        faqs: faqs && Array.isArray(faqs) ? faqs : record.faqs,
        status: status || record.status,
      });
    }

    return NextResponse.json({ success: true, location: record, created });
  } catch (error: any) {
    console.error('Error creating/updating service location:', error);
    return NextResponse.json({ error: error.message || 'Failed to save service location' }, { status: 500 });
  }
}
