import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';
import { HospitalPackage, LeadPackage, Payment, Hospital, User } from '@/models';

function numberToWords(num: number): string {
  const a = [
    '', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ',
    'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen ',
  ];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const n = ('000000000' + Math.floor(num)).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
  if (!n) return 'Rupees';

  let str = '';
  str += Number(n[1]) !== 0 ? (a[Number(n[1])] || b[Number(n[1][0])] + ' ' + a[Number(n[1][1])]) + 'Crore ' : '';
  str += Number(n[2]) !== 0 ? (a[Number(n[2])] || b[Number(n[2][0])] + ' ' + a[Number(n[2][1])]) + 'Lakh ' : '';
  str += Number(n[3]) !== 0 ? (a[Number(n[3])] || b[Number(n[3][0])] + ' ' + a[Number(n[3][1])]) + 'Thousand ' : '';
  str += Number(n[4]) !== 0 ? (a[Number(n[4])] || b[Number(n[4][0])] + ' ' + a[Number(n[4][1])]) + 'Hundred ' : '';
  str +=
    Number(n[5]) !== 0
      ? (str !== '' ? 'and ' : '') + (a[Number(n[5])] || b[Number(n[5][0])] + ' ' + a[Number(n[5][1])])
      : '';

  return str ? `${str.trim()} Rupees Only` : 'Zero Rupees Only';
}

export async function GET(req: Request) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const subscriptionId = searchParams.get('subscriptionId');
    const paymentId = searchParams.get('paymentId');

    await connectDB();

    let subscription: any = null;

    if (subscriptionId) {
      subscription = await HospitalPackage.findByPk(Number(subscriptionId), {
        include: [
          { model: Hospital, as: 'hospital' },
          { model: LeadPackage, as: 'package' },
          { model: Payment, as: 'payment' },
        ],
      });
    } else if (paymentId) {
      const payment = await Payment.findByPk(Number(paymentId), {
        include: [{ model: LeadPackage, as: 'package' }],
      });
      if (payment) {
        subscription = await HospitalPackage.findOne({
          where: { paymentId: payment.id },
          include: [
            { model: Hospital, as: 'hospital' },
            { model: LeadPackage, as: 'package' },
            { model: Payment, as: 'payment' },
          ],
        });
      }
    }

    if (!subscription) {
      return NextResponse.json({ error: 'Invoice record not found' }, { status: 404 });
    }

    // Permission check
    if (authUser.role === 'HOSPITAL' && subscription.hospitalId !== authUser.hospitalId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const totalAmount = Number(subscription.purchasePrice || subscription.payment?.amount || subscription.package?.price || 0);
    // Base is 18% inclusive
    const baseAmount = Math.round((totalAmount / 1.18) * 100) / 100;
    const gstAmount = Math.round((totalAmount - baseAmount) * 100) / 100;
    const cgst = Math.round((gstAmount / 2) * 100) / 100;
    const sgst = Math.round((gstAmount / 2) * 100) / 100;

    const invoiceNumber = `CBC-INV-${new Date(subscription.purchasedAt || subscription.createdAt).getFullYear()}-${String(
      subscription.id
    ).padStart(5, '0')}`;

    const invoice = {
      invoiceNumber,
      invoiceDate: subscription.purchasedAt || subscription.createdAt,
      dueDate: subscription.purchasedAt || subscription.createdAt,
      status: 'PAID',
      seller: {
        companyName: 'ClinicByChoice Technologies Pvt. Ltd.',
        tagline: 'Healthcare & Patient Lead Acceleration Platform',
        address: 'Level 4, Cyber City, Sector 24, DLF Phase 3',
        city: 'Gurugram',
        state: 'Haryana',
        pincode: '122002',
        country: 'India',
        gstin: '06AAACC1234F1Z5',
        pan: 'AAACC1234F',
        supportEmail: 'billing@clinicbychoice.com',
        phone: '+91 98765 43210',
      },
      buyer: {
        hospitalId: subscription.hospitalId,
        hospitalName: subscription.hospital?.name || 'Hospital Partner',
        city: subscription.hospital?.city || 'India',
        state: subscription.hospital?.state || '',
        address: subscription.hospital?.address || '',
        email: subscription.hospital?.email || '',
        phone: subscription.hospital?.phone || '',
        gstin: subscription.hospital?.gstin || 'UNREGISTERED',
      },
      items: [
        {
          id: 1,
          sacCode: '998311',
          name: `${subscription.package?.name || 'Lead Top-up Package'} (${subscription.leadLimit || subscription.leadCount} Patient Leads)`,
          description: `Verified medical lead credit top-up for specialty patient inquiries. Includes instant SMS/Email notifications.`,
          quantity: subscription.leadLimit || subscription.leadCount || 1,
          unit: 'Leads',
          unitRate: Number(
            ((subscription.purchasePrice || totalAmount) / (subscription.leadLimit || 1)).toFixed(2)
          ),
          taxableAmount: baseAmount,
          gstRate: '18%',
          gstAmount,
          totalAmount,
        },
      ],
      pricing: {
        taxableAmount: baseAmount,
        cgstRate: '9%',
        cgstAmount: cgst,
        sgstRate: '9%',
        sgstAmount: sgst,
        igstRate: '0%',
        igstAmount: 0,
        totalGstAmount: gstAmount,
        totalAmount,
        amountInWords: numberToWords(totalAmount),
      },
      payment: {
        method: subscription.payment?.gateway || subscription.paymentMethod || 'PHONEPE / ONLINE',
        transactionId: subscription.payment?.merchantTransactionId || `TXN-ORD-${subscription.id}`,
        status: 'SUCCESS',
        paidAt: subscription.purchasedAt || subscription.createdAt,
      },
    };

    return NextResponse.json({ success: true, invoice });
  } catch (error) {
    console.error('Invoice GET error:', error);
    return NextResponse.json({ error: 'Server error generating invoice' }, { status: 500 });
  }
}
