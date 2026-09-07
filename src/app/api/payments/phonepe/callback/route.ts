import { NextResponse } from 'next/server';
import { connectDB, sequelize } from '@/lib/db';
import { Payment, Hospital, LeadPackage, HospitalPackage, LeadTransaction, Notification } from '@/models';
import { verifyPhonePeStatus } from '@/lib/phonepe';
import { sendPackagePurchaseEmail } from '@/lib/mailer';
import { getAuthUser } from '@/lib/auth';
import { Op } from 'sequelize';

export async function POST(req: Request) {
  return handleCallback(req);
}

export async function GET(req: Request) {
  return handleCallback(req);
}

async function handleCallback(req: Request) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  try {
    await connectDB();
    const urlObj = new URL(req.url);

    let merchantTransactionId =
      urlObj.searchParams.get('merchantTransactionId') ||
      urlObj.searchParams.get('merchantOrderId') ||
      urlObj.searchParams.get('transactionId') ||
      urlObj.searchParams.get('orderId') ||
      urlObj.searchParams.get('id');

    let code = urlObj.searchParams.get('code') || urlObj.searchParams.get('state');

    // If POST from PhonePe webhook or form post
    if (req.method === 'POST') {
      const contentType = req.headers.get('content-type') || '';
      if (contentType.includes('application/x-www-form-urlencoded') || contentType.includes('multipart/form-data')) {
        try {
          const formData = await req.formData();
          const bodyMerchantTxnId =
            formData.get('merchantTransactionId')?.toString() ||
            formData.get('merchantOrderId')?.toString() ||
            formData.get('transactionId')?.toString();
          const bodyCode = formData.get('code')?.toString() || formData.get('state')?.toString();
          const rawResponse = formData.get('response')?.toString();

          if (bodyMerchantTxnId) merchantTransactionId = bodyMerchantTxnId;
          if (bodyCode) code = bodyCode;

          if (rawResponse) {
            try {
              const decoded = JSON.parse(Buffer.from(rawResponse, 'base64').toString('utf-8'));
              if (decoded?.data?.merchantTransactionId) merchantTransactionId = decoded.data.merchantTransactionId;
              if (decoded?.data?.merchantOrderId) merchantTransactionId = decoded.data.merchantOrderId;
              if (decoded?.code) code = decoded.code;
            } catch (b64Err) {
              console.warn('Could not decode base64 PhonePe response:', b64Err);
            }
          }
        } catch {
          // form parsing fallback
        }
      } else if (contentType.includes('application/json')) {
        try {
          const jsonBody = await req.json();
          if (jsonBody?.merchantTransactionId) merchantTransactionId = jsonBody.merchantTransactionId;
          if (jsonBody?.merchantOrderId) merchantTransactionId = jsonBody.merchantOrderId;
          if (jsonBody?.data?.merchantTransactionId) merchantTransactionId = jsonBody.data.merchantTransactionId;
          if (jsonBody?.code) code = jsonBody.code;

          if (jsonBody?.response) {
            try {
              const decoded = JSON.parse(Buffer.from(jsonBody.response, 'base64').toString('utf-8'));
              if (decoded?.data?.merchantTransactionId) merchantTransactionId = decoded.data.merchantTransactionId;
              if (decoded?.data?.merchantOrderId) merchantTransactionId = decoded.data.merchantOrderId;
              if (decoded?.code) code = decoded.code;
            } catch (b64Err) {
              console.warn('Could not decode base64 PhonePe json response:', b64Err);
            }
          }
        } catch {
          // json body parsing fallback
        }
      }
    }

    // Smart fallback: If transaction ID not found, check the most recent pending payment
    if (!merchantTransactionId) {
      try {
        const authUser = await getAuthUser();
        if (authUser?.hospitalId) {
          const latestPending = await Payment.findOne({
            where: {
              hospitalId: authUser.hospitalId,
              status: 'PENDING',
              createdAt: {
                [Op.gte]: new Date(Date.now() - 60 * 60 * 1000), // last 60 minutes
              },
            },
            order: [['createdAt', 'DESC']],
          });

          if (latestPending) {
            merchantTransactionId = latestPending.merchantTransactionId;
          }
        }
      } catch (authErr) {
        console.warn('Auth user lookup in callback fallback:', authErr);
      }
    }

    if (!merchantTransactionId) {
      return NextResponse.redirect(`${appUrl}/hospital/packages?error=missing_transaction_id`);
    }

    const paymentRecord = await Payment.findOne({
      where: { merchantTransactionId },
    });

    if (!paymentRecord) {
      return NextResponse.redirect(`${appUrl}/hospital/packages?error=payment_record_not_found`);
    }

    // Prevent duplicate processing
    if (paymentRecord.status === 'SUCCESS') {
      return NextResponse.redirect(`${appUrl}/hospital/packages?status=already_successful`);
    }

    // Verify status with PhonePe
    const phonepeStatus = await verifyPhonePeStatus(merchantTransactionId);
    const isSuccess =
      code === 'PAYMENT_SUCCESS' ||
      phonepeStatus.state === 'COMPLETED' ||
      phonepeStatus.code === 'PAYMENT_SUCCESS' ||
      phonepeStatus.data?.paymentState === 'COMPLETED';

    if (!isSuccess) {
      await paymentRecord.update({
        status: 'FAILED',
        rawResponse: phonepeStatus,
      });
      return NextResponse.redirect(`${appUrl}/hospital/packages?error=payment_failed`);
    }

    // Process payment success inside DB Transaction
    const transaction = await sequelize.transaction();

    try {
      const leadPkg = await LeadPackage.findByPk(paymentRecord.packageId, { transaction });
      const hospital = await Hospital.findByPk(paymentRecord.hospitalId, { transaction });

      if (!leadPkg || !hospital) {
        await transaction.rollback();
        return NextResponse.redirect(`${appUrl}/hospital/packages?error=package_or_hospital_not_found`);
      }

      const addedLeads = leadPkg.leadCount;
      const balanceBefore = hospital.leadsRemaining;
      const balanceAfter = balanceBefore + addedLeads;

      // Update payment record
      await paymentRecord.update(
        {
          status: 'SUCCESS',
          providerReferenceId: phonepeStatus.transactionId || phonepeStatus.data?.transactionId || `PAY_${Date.now()}`,
          rawResponse: phonepeStatus,
        },
        { transaction }
      );

      // Atomically add leads to hospital balance (Adds to existing balance!)
      await hospital.update(
        {
          leadsRemaining: balanceAfter,
          totalLeadsPurchased: hospital.totalLeadsPurchased + addedLeads,
        },
        { transaction }
      );

      // Create HospitalPackage subscription record
      const expiresAt = leadPkg.validityDays
        ? new Date(Date.now() + leadPkg.validityDays * 24 * 60 * 60 * 1000)
        : null;

      await HospitalPackage.create(
        {
          hospitalId: hospital.id,
          packageId: leadPkg.id,
          leadLimit: addedLeads,
          leadsUsed: 0,
          leadsRemaining: addedLeads,
          purchasePrice: leadPkg.price,
          currency: leadPkg.currency,
          paymentId: paymentRecord.id,
          status: 'ACTIVE',
          purchasedAt: new Date(),
          expiresAt,
        },
        { transaction }
      );

      // Create Lead Transaction audit log
      await LeadTransaction.create(
        {
          hospitalId: hospital.id,
          packageId: leadPkg.id,
          transactionType: 'PACKAGE_PURCHASE',
          leadAmount: addedLeads,
          balanceBefore,
          balanceAfter,
          description: `Purchased ${leadPkg.name} (${addedLeads} leads)`,
        },
        { transaction }
      );

      // Create Notification for Hospital
      await Notification.create(
        {
          recipientType: 'HOSPITAL',
          recipientId: hospital.id,
          title: 'Lead Package Purchased Successfully',
          message: `Your account has been credited with ${addedLeads} leads. Current balance: ${balanceAfter} leads.`,
          type: 'PACKAGE_PURCHASED',
          isRead: false,
        },
        { transaction }
      );

      // Create Notification for Admin
      await Notification.create(
        {
          recipientType: 'ADMIN',
          title: 'Package Purchase',
          message: `${hospital.name} purchased ${leadPkg.name} for ₹${leadPkg.price}.`,
          type: 'PACKAGE_PURCHASED',
          isRead: false,
        },
        { transaction }
      );

      await transaction.commit();

      // Trigger Email Notification (Asynchronous)
      sendPackagePurchaseEmail({
        hospitalName: hospital.name,
        hospitalEmail: hospital.email,
        packageName: leadPkg.name,
        leadCount: addedLeads,
        amountPaid: leadPkg.price,
        transactionId: merchantTransactionId,
        newBalance: balanceAfter,
      }).catch((err) => console.error('[MAILER] Async package purchase email failed:', err));

      return NextResponse.redirect(
        `${appUrl}/hospital/packages?status=success&added=${addedLeads}&balance=${balanceAfter}`
      );
    } catch (dbErr) {
      await transaction.rollback();
      console.error('Payment callback DB error:', dbErr);
      return NextResponse.redirect(`${appUrl}/hospital/packages?error=fulfillment_failed`);
    }
  } catch (error) {
    console.error('PhonePe callback handler error:', error);
    return NextResponse.redirect(`${appUrl}/hospital/packages?error=server_error`);
  }
}
