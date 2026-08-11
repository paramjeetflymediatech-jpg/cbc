import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';
import { Service } from '@/models';

export async function GET() {
  try {
    const authUser = await getAuthUser();
    if (!authUser || (authUser.role !== 'SUPER_ADMIN' && authUser.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    await connectDB();
    const services = await Service.findAll({ order: [['name', 'ASC']] });
    return NextResponse.json({ services });
  } catch (error) {
    console.error('Admin GET services error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const authUser = await getAuthUser();
    if (!authUser || (authUser.role !== 'SUPER_ADMIN' && authUser.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    await connectDB();
    const body = await req.json();

    const { name, slug, category, shortDescription, description, icon, image, seoTitle, seoDescription, status } = body;

    if (!name) {
      return NextResponse.json({ error: 'Service name is required' }, { status: 400 });
    }

    const generatedSlug = (slug || name)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');

    const existing = await Service.findOne({ where: { slug: generatedSlug } });
    if (existing) {
      return NextResponse.json({ error: 'Service slug already exists' }, { status: 400 });
    }

    const service = await Service.create({
      name: name.trim(),
      slug: generatedSlug,
      category: category ? category.trim() : null,
      shortDescription: shortDescription ? shortDescription.trim() : null,
      description: description ? description.trim() : null,
      icon: icon || null,
      image: image || null,
      seoTitle: seoTitle ? seoTitle.trim() : null,
      seoDescription: seoDescription ? seoDescription.trim() : null,
      status: status || 'ACTIVE',
    });

    return NextResponse.json({ message: 'Service created successfully', service }, { status: 201 });
  } catch (error) {
    console.error('Admin POST service error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const authUser = await getAuthUser();
    if (!authUser || (authUser.role !== 'SUPER_ADMIN' && authUser.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    await connectDB();
    const body = await req.json();
    const { id, name, category, shortDescription, description, icon, image, seoTitle, seoDescription, status } = body;

    if (!id) {
      return NextResponse.json({ error: 'Service ID is required' }, { status: 400 });
    }

    const service = await Service.findByPk(id);
    if (!service) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 });
    }

    await service.update({
      name: name ? name.trim() : service.name,
      category: category !== undefined ? category : service.category,
      shortDescription: shortDescription !== undefined ? shortDescription : service.shortDescription,
      description: description !== undefined ? description : service.description,
      icon: icon !== undefined ? icon : service.icon,
      image: image !== undefined ? image : service.image,
      seoTitle: seoTitle !== undefined ? seoTitle : service.seoTitle,
      seoDescription: seoDescription !== undefined ? seoDescription : service.seoDescription,
      status: status !== undefined ? status : service.status,
    });

    return NextResponse.json({ message: 'Service updated successfully', service });
  } catch (error) {
    console.error('Admin PUT service error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
