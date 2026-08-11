import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';
import { LeadPackage, Payment, Hospital } from '@/models';
import { initiatePhonePePayment } from '@/lib/phonepe';

export async function POST(req: Request) {
  try {
    const authUser = await getAuthUser();
    if (!authUser || authUser.role !== 'HOSPITAL' || !authUser.hospitalId) {
      return NextResponse.json({ error: 'Unauthorized hospital access' }, { status: 401 });
    }

    await connectDB();
    const { packageId } = await req.json();

    if (!packageId) {
      return NextResponse.json({ error: 'Package ID is required' }, { status: 400 });
    }

    const leadPkg = await LeadPackage.findByPk(packageId);
    if (!leadPkg || leadPkg.status !== 'ACTIVE') {
      return NextResponse.json({ error: 'Selected lead package is unavailable' }, { status: 404 });
    }

    const hospital = await Hospital.findByPk(authUser.hospitalId);
    if (!hospital) {
      return NextResponse.json({ error: 'Hospital record not found' }, { status: 404 });
    }

    const merchantTransactionId = `CBC_TXN_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const redirectUrl = `${appUrl}/api/payments/phonepe/callback`;
    const callbackUrl = `${appUrl}/api/payments/phonepe/callback`;

    // Create pending Payment record in MySQL
    const paymentRecord = await Payment.create({
      hospitalId: Number(authUser.hospitalId),
      packageId: Number(leadPkg.id),
      amount: Number(leadPkg.price),
      currency: leadPkg.currency || 'INR',
      gateway: 'PHONEPE',
      merchantTransactionId,
      status: 'PENDING',
    });

    // Initiate PhonePe Gateway Order
    const phonepeRes = await initiatePhonePePayment({
      merchantTransactionId,
      amount: Number(leadPkg.price),
      hospitalId: Number(authUser.hospitalId),
      packageId: Number(leadPkg.id),
      redirectUrl,
      callbackUrl,
      userPhone: hospital.phone,
    });

    if (phonepeRes.success && phonepeRes.url) {
      return NextResponse.json({
        success: true,
        redirectUrl: phonepeRes.url,
        paymentId: paymentRecord.id,
        merchantTransactionId,
      });
    } else {
      return NextResponse.json(
        { error: phonepeRes.message || 'Failed to initiate PhonePe payment order' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('PhonePe order initiation error:', error);
    return NextResponse.json({ error: 'Server error initiating payment' }, { status: 500 });
  }
}
