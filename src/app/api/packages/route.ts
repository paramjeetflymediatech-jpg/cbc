import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { LeadPackage } from '@/models';

export async function GET() {
  try {
    await connectDB();

    const packages = await LeadPackage.findAll({
      where: { status: 'ACTIVE' },
      order: [['price', 'ASC']],
    });

    return NextResponse.json({
      success: true,
      packages,
    });
  } catch (error) {
    console.error('Fetch public packages error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch packages',
        packages: [
          {
            id: 1,
            name: 'Starter Clinic Pack',
            leadCount: 10,
            price: 3000,
            currency: 'INR',
            validityDays: 30,
            description: 'Ideal for specialized clinics and individual specialists starting out with verified patient enquiries.',
            status: 'ACTIVE',
          },
          {
            id: 2,
            name: 'Growth Care Pack',
            leadCount: 30,
            price: 8000,
            currency: 'INR',
            validityDays: 60,
            description: 'Perfect for established specialty centers looking to scale patient consultations and OPD footfall.',
            status: 'ACTIVE',
          },
          {
            id: 3,
            name: 'Super Specialty Pro',
            leadCount: 50,
            price: 13000,
            currency: 'INR',
            validityDays: 90,
            description: 'Designed for multi-specialty hospitals and tertiary care facilities with high surgical and OPD demand.',
            status: 'ACTIVE',
          },
        ],
      },
      { status: 200 }
    );
  }
}
