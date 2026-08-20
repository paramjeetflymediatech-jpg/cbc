import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { ServiceLocation, Service } from '@/models';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const { id } = await params;
    const location = await ServiceLocation.findByPk(Number(id), {
      include: [{ model: Service, as: 'service', attributes: ['id', 'name', 'slug'] }],
    });

    if (!location) {
      return NextResponse.json({ error: 'Service Location record not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, location });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error fetching record' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const { id } = await params;
    const location = await ServiceLocation.findByPk(Number(id));

    if (!location) {
      return NextResponse.json({ error: 'Service Location record not found' }, { status: 404 });
    }

    const body = await req.json();
    const {
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

    let citySlug = location.citySlug;
    if (cityName && cityName.trim() !== '') {
      citySlug = cityName.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    }

    await location.update({
      cityName: cityName ? cityName.trim() : location.cityName,
      citySlug,
      stateName: stateName !== undefined ? stateName : location.stateName,
      serviceTitle: serviceTitle !== undefined ? serviceTitle : location.serviceTitle,
      shortDescription: shortDescription !== undefined ? shortDescription : location.shortDescription,
      description: description !== undefined ? description : location.description,
      seoTitle: seoTitle !== undefined ? seoTitle : location.seoTitle,
      seoDescription: seoDescription !== undefined ? seoDescription : location.seoDescription,
      seoKeywords: seoKeywords !== undefined ? seoKeywords : location.seoKeywords,
      faqs: faqs !== undefined ? faqs : location.faqs,
      status: status || location.status,
    });

    return NextResponse.json({ success: true, location });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error updating record' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const { id } = await params;
    const location = await ServiceLocation.findByPk(Number(id));

    if (!location) {
      return NextResponse.json({ error: 'Service Location record not found' }, { status: 404 });
    }

    await location.destroy();
    return NextResponse.json({ success: true, message: 'Service location record deleted successfully' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error deleting record' }, { status: 500 });
  }
}
