import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';
import { Service } from '@/models';
import { cleanupOldImages } from '@/lib/fileCleanup';
import { Op } from 'sequelize';

export async function GET() {
  try {
    const authUser = await getAuthUser();
    if (!authUser || (authUser.role !== 'SUPER_ADMIN' && authUser.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    await connectDB();
    const services = await Service.findAll({
      include: [
        { model: Service, as: 'parent', required: false, attributes: ['id', 'name', 'slug'] },
        { model: Service, as: 'subServices', required: false, attributes: ['id', 'name', 'slug'] },
      ],
      order: [['name', 'ASC']],
    });
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

    const { name, slug, category, parentId, shortDescription, description, icon, image, seoTitle, seoDescription, faqs, status } = body;

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
      parentId: parentId ? Number(parentId) : null,
      shortDescription: shortDescription ? shortDescription.trim() : null,
      description: description ? description.trim() : null,
      icon: icon || null,
      image: image || null,
      seoTitle: seoTitle ? seoTitle.trim() : null,
      seoDescription: seoDescription ? seoDescription.trim() : null,
      faqs: Array.isArray(faqs) ? faqs : [],
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
    const { id, name, slug, category, parentId, shortDescription, description, icon, image, seoTitle, seoDescription, faqs, status } = body;

    if (!id) {
      return NextResponse.json({ error: 'Service ID is required' }, { status: 400 });
    }

    const service = await Service.findByPk(id);
    if (!service) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 });
    }

    let updatedSlug = service.slug;
    if (slug && slug.trim() !== '') {
      const formattedSlug = slug
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');

      if (formattedSlug !== service.slug) {
        const existing = await Service.findOne({
          where: {
            slug: formattedSlug,
            id: { [Op.ne]: id },
          },
        });
        if (existing) {
          return NextResponse.json({ error: 'Slug already in use by another service' }, { status: 400 });
        }
        updatedSlug = formattedSlug;
      }
    }

    if (image !== undefined && image !== service.image) {
      await cleanupOldImages(service.image, image);
    }
    if (icon !== undefined && icon !== service.icon) {
      await cleanupOldImages(service.icon, icon);
    }

    await service.update({
      name: name ? name.trim() : service.name,
      slug: updatedSlug,
      category: category !== undefined ? (category ? category.trim() : null) : service.category,
      parentId: parentId !== undefined ? (parentId ? Number(parentId) : null) : service.parentId,
      shortDescription: shortDescription !== undefined ? shortDescription : service.shortDescription,
      description: description !== undefined ? description : service.description,
      icon: icon !== undefined ? icon : service.icon,
      image: image !== undefined ? image : service.image,
      seoTitle: seoTitle !== undefined ? seoTitle : service.seoTitle,
      seoDescription: seoDescription !== undefined ? seoDescription : service.seoDescription,
      faqs: faqs !== undefined ? (Array.isArray(faqs) ? faqs : []) : service.faqs,
      status: status !== undefined ? status : service.status,
    });

    return NextResponse.json({ message: 'Service updated successfully', service });
  } catch (error) {
    console.error('Admin PUT service error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const authUser = await getAuthUser();
    if (!authUser || (authUser.role !== 'SUPER_ADMIN' && authUser.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    await connectDB();
    
    // Support either query param ?id=123 or JSON body { id: 123 }
    const url = new URL(req.url);
    const queryId = url.searchParams.get('id');
    let id = queryId ? Number(queryId) : null;

    if (!id) {
      try {
        const body = await req.json();
        if (body.id) id = Number(body.id);
      } catch {
        // Body parsing failed or empty
      }
    }

    if (!id) {
      return NextResponse.json({ error: 'Service ID is required' }, { status: 400 });
    }

    const service = await Service.findByPk(id);
    if (!service) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 });
    }

    if (service.image) {
      await cleanupOldImages(service.image, null);
    }
    if (service.icon) {
      await cleanupOldImages(service.icon, null);
    }

    // Set parentId = null for subservices referencing this service
    await Service.update({ parentId: null }, { where: { parentId: id } });

    await service.destroy();

    return NextResponse.json({ message: `Service "${service.name}" deleted successfully` });
  } catch (error) {
    console.error('Admin DELETE service error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
