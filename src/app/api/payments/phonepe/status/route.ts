import { NextResponse } from 'next/server';
import { connectDB, sequelize } from '@/lib/db';
import { Payment, Hospital, LeadPackage, HospitalPackage, LeadTransaction, Notification } from '@/models';
import { verifyPhonePeStatus } from '@/lib/phonepe';
import { sendPackagePurchaseEmail } from '@/lib/mailer';
import { getAuthUser } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const urlObj = new URL(req.url);
    const merchantTransactionId =
      urlObj.searchParams.get('merchantTransactionId') ||
      urlObj.searchParams.get('transactionId') ||
      urlObj.searchParams.get('orderId');

    if (!merchantTransactionId) {
      return NextResponse.json({ error: 'merchantTransactionId is required' }, { status: 400 });
    }

    await connectDB();

    const paymentRecord = await Payment.findOne({
      where: { merchantTransactionId },
    });

    if (!paymentRecord) {
      return NextResponse.json({ error: 'Payment record not found' }, { status: 404 });
    }

    // Verify hospital ownership if requester is a hospital
    if (authUser.role === 'HOSPITAL' && Number(authUser.hospitalId) !== Number(paymentRecord.hospitalId)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // If already SUCCESS in DB, fetch the subscription and return
    if (paymentRecord.status === 'SUCCESS') {
      const sub = await HospitalPackage.findOne({
        where: { paymentId: paymentRecord.id },
      });
      const hospital = await Hospital.findByPk(paymentRecord.hospitalId);

      return NextResponse.json({
        success: true,
        status: 'SUCCESS',
        payment: paymentRecord,
        subscriptionId: sub?.id,
        balance: hospital?.leadsRemaining ?? 0,
      });
    }

    // Check with PhonePe Gateway
    const phonepeStatus = await verifyPhonePeStatus(merchantTransactionId);
    const isSuccess =
      phonepeStatus.state === 'COMPLETED' ||
      phonepeStatus.code === 'PAYMENT_SUCCESS' ||
      phonepeStatus.data?.paymentState === 'COMPLETED' ||
      phonepeStatus.data?.state === 'COMPLETED';

    if (isSuccess) {
      // Process fulfillment inside DB Transaction
      const transaction = await sequelize.transaction();

      try {
        const leadPkg = await LeadPackage.findByPk(paymentRecord.packageId, { transaction });
        const hospital = await Hospital.findByPk(paymentRecord.hospitalId, { transaction });

        if (!leadPkg || !hospital) {
          await transaction.rollback();
          return NextResponse.json({ error: 'Package or hospital not found' }, { status: 404 });
        }

        const addedLeads = leadPkg.leadCount;
        const balanceBefore = hospital.leadsRemaining;
        const balanceAfter = balanceBefore + addedLeads;

        // Update payment record
        await paymentRecord.update(
          {
            status: 'SUCCESS',
            providerReferenceId:
              phonepeStatus.transactionId || phonepeStatus.data?.transactionId || `PAY_${Date.now()}`,
            rawResponse: phonepeStatus,
          },
          { transaction }
        );

        // Update hospital balance
        await hospital.update(
          {
            leadsRemaining: balanceAfter,
            totalLeadsPurchased: (hospital.totalLeadsPurchased || 0) + addedLeads,
          },
          { transaction }
        );

        // Create subscription
        const expiresAt = leadPkg.validityDays
          ? new Date(Date.now() + leadPkg.validityDays * 24 * 60 * 60 * 1000)
          : null;

        const sub = await HospitalPackage.create(
          {
            hospitalId: hospital.id,
            packageId: leadPkg.id,
            leadLimit: addedLeads,
            leadsUsed: 0,
            leadsRemaining: addedLeads,
            purchasePrice: leadPkg.price,
            currency: leadPkg.currency || 'INR',
            paymentId: paymentRecord.id,
            status: 'ACTIVE',
            purchasedAt: new Date(),
            expiresAt,
          },
          { transaction }
        );

        // Audit log
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

        // Notifications
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

        await transaction.commit();

        sendPackagePurchaseEmail({
          hospitalName: hospital.name,
          hospitalEmail: hospital.email,
          packageName: leadPkg.name,
          leadCount: addedLeads,
          amountPaid: leadPkg.price,
          transactionId: merchantTransactionId,
          newBalance: balanceAfter,
        }).catch((err) => console.error('[MAILER] Async email error:', err));

        return NextResponse.json({
          success: true,
          status: 'SUCCESS',
          addedLeads,
          balance: balanceAfter,
          payment: paymentRecord,
          subscriptionId: sub.id,
        });
      } catch (err) {
        await transaction.rollback();
        console.error('Status verification fulfillment error:', err);
        return NextResponse.json({ error: 'Fulfillment error' }, { status: 500 });
      }
    } else if (
      phonepeStatus.state === 'FAILED' ||
      phonepeStatus.code === 'PAYMENT_ERROR' ||
      phonepeStatus.code === 'PAYMENT_DECLINED'
    ) {
      await paymentRecord.update({
        status: 'FAILED',
        rawResponse: phonepeStatus,
      });

      return NextResponse.json({
        success: false,
        status: 'FAILED',
        message: phonepeStatus.message || 'Payment failed or was declined',
      });
    }

    return NextResponse.json({
      success: true,
      status: paymentRecord.status,
      payment: paymentRecord,
    });
  } catch (error) {
    console.error('PhonePe status check error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
