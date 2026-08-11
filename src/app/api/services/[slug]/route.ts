import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Service } from '@/models';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    await connectDB();

    const service = await Service.findOne({
      where: { slug: slug.toLowerCase(), status: 'ACTIVE' },
    });

    if (!service) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 });
    }

    return NextResponse.json({ service });
  } catch (error) {
    console.error('Fetch service slug error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
