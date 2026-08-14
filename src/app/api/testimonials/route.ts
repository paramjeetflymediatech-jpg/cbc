import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';
import { Testimonial } from '@/models';

export async function GET(req: Request) {
  try {
    await connectDB();
    await Testimonial.sync();
    const { searchParams } = new URL(req.url);
    const adminMode = searchParams.get('admin') === 'true';

    if (adminMode) {
      const authUser = await getAuthUser();
      if (!authUser || (authUser.role !== 'SUPER_ADMIN' && authUser.role !== 'ADMIN')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      const testimonials = await Testimonial.findAll({
        order: [['orderIndex', 'ASC'], ['createdAt', 'DESC']],
      });
      return NextResponse.json({ testimonials });
    }

    // Public GET: Fetch ACTIVE testimonials only
    const testimonials = await Testimonial.findAll({
      where: { status: 'ACTIVE' },
      order: [['orderIndex', 'ASC'], ['createdAt', 'DESC']],
    });

    return NextResponse.json({ testimonials });
  } catch (error) {
    console.error('GET testimonials error:', error);
    return NextResponse.json({ error: 'Server error fetching testimonials' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const authUser = await getAuthUser();
    if (!authUser || (authUser.role !== 'SUPER_ADMIN' && authUser.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    await Testimonial.sync();
    const body = await req.json();
    const { doctorName, hospitalInfo, quote, image, rating, status, orderIndex } = body;

    if (!doctorName || !hospitalInfo || !quote) {
      return NextResponse.json(
        { error: 'Doctor Name, Hospital Info, and Testimonial Quote are required.' },
        { status: 400 }
      );
    }

    const newTestimonial = await Testimonial.create({
      doctorName: String(doctorName).trim(),
      hospitalInfo: String(hospitalInfo).trim(),
      quote: String(quote).trim(),
      image: image ? String(image).trim() : null,
      rating: rating ? Number(rating) : 5.0,
      status: status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE',
      orderIndex: orderIndex !== undefined ? Number(orderIndex) : 0,
    });

    return NextResponse.json(
      { message: 'Testimonial created successfully', testimonial: newTestimonial },
      { status: 201 }
    );
  } catch (error) {
    console.error('POST testimonial error:', error);
    return NextResponse.json({ error: 'Server error creating testimonial' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const authUser = await getAuthUser();
    if (!authUser || (authUser.role !== 'SUPER_ADMIN' && authUser.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    await Testimonial.sync();
    const body = await req.json();
    const { id, doctorName, hospitalInfo, quote, image, rating, status, orderIndex } = body;

    if (!id) {
      return NextResponse.json({ error: 'Testimonial ID is required.' }, { status: 400 });
    }

    const testimonial = await Testimonial.findByPk(id);
    if (!testimonial) {
      return NextResponse.json({ error: 'Testimonial not found' }, { status: 404 });
    }

    await testimonial.update({
      doctorName: doctorName ? String(doctorName).trim() : testimonial.doctorName,
      hospitalInfo: hospitalInfo ? String(hospitalInfo).trim() : testimonial.hospitalInfo,
      quote: quote ? String(quote).trim() : testimonial.quote,
      image: image !== undefined ? (image ? String(image).trim() : null) : testimonial.image,
      rating: rating !== undefined ? Number(rating) : testimonial.rating,
      status: status !== undefined ? status : testimonial.status,
      orderIndex: orderIndex !== undefined ? Number(orderIndex) : testimonial.orderIndex,
    });

    return NextResponse.json({ message: 'Testimonial updated successfully', testimonial });
  } catch (error) {
    console.error('PUT testimonial error:', error);
    return NextResponse.json({ error: 'Server error updating testimonial' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const authUser = await getAuthUser();
    if (!authUser || (authUser.role !== 'SUPER_ADMIN' && authUser.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    await Testimonial.sync();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Testimonial ID is required.' }, { status: 400 });
    }

    const testimonial = await Testimonial.findByPk(id);
    if (!testimonial) {
      return NextResponse.json({ error: 'Testimonial not found' }, { status: 404 });
    }

    await testimonial.destroy();
    return NextResponse.json({ message: 'Testimonial deleted successfully' });
  } catch (error) {
    console.error('DELETE testimonial error:', error);
    return NextResponse.json({ error: 'Server error deleting testimonial' }, { status: 500 });
  }
}
