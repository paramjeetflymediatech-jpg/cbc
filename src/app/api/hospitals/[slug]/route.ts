import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Hospital, Service, HospitalService } from '@/models';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    await connectDB();

    const hospital = await Hospital.findOne({
      where: {
        slug: slug.toLowerCase(),
        status: 'APPROVED',
        accountStatus: 'ACTIVE',
      },
      include: [
        {
          model: HospitalService,
          as: 'hospitalServices',
          where: { status: 'ACTIVE' },
          required: false,
          include: [
            {
              model: Service,
              as: 'service',
            },
          ],
        },
      ],
    });

    if (!hospital) {
      return NextResponse.json({ error: 'Hospital not found or not active' }, { status: 404 });
    }

    return NextResponse.json({ hospital });
  } catch (error) {
    console.error('Fetch hospital slug error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
