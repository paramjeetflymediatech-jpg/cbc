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
            name: 'Starter Hospital Pack',
            leadCount: 25,
            price: 4999,
            currency: 'INR',
            validityDays: 30,
            description: 'Ideal for specialized clinics and boutique medical centers starting out with digital patient enquiries.',
            status: 'ACTIVE',
          },
          {
            id: 2,
            name: 'Growth Care Pack',
            leadCount: 50,
            price: 8999,
            currency: 'INR',
            validityDays: 60,
            description: 'Perfect for established multi-specialty hospitals looking to scale patient consultations and OPD footfall.',
            status: 'ACTIVE',
          },
          {
            id: 3,
            name: 'Super Specialty Pro',
            leadCount: 100,
            price: 15999,
            currency: 'INR',
            validityDays: 90,
            description: 'Designed for large hospital networks and tertiary care facilities with dedicated coordination teams.',
            status: 'ACTIVE',
          },
          {
            id: 4,
            name: 'Enterprise Healthcare Max',
            leadCount: 250,
            price: 34999,
            currency: 'INR',
            validityDays: 180,
            description: 'Maximum reach and volume with premium featured placement and VIP patient lead routing.',
            status: 'ACTIVE',
          },
        ],
      },
      { status: 200 }
    );
  }
}
