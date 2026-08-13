import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Service } from '@/models';

export async function GET() {
  try {
    await connectDB();
    const services = await Service.findAll({
      where: { status: 'ACTIVE' },
      include: [
        {
          model: Service,
          as: 'subServices',
          where: { status: 'ACTIVE' },
          required: false,
        },
        {
          model: Service,
          as: 'parent',
          required: false,
        },
      ],
      order: [
        ['name', 'ASC'],
        [{ model: Service, as: 'subServices' }, 'name', 'ASC'],
      ],
    });
    return NextResponse.json({ services });
  } catch (error) {
    console.error('Fetch services error:', error);
    return NextResponse.json({ error: 'Failed to fetch services' }, { status: 500 });
  }
}
