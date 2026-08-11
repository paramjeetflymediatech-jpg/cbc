import { NextResponse } from 'next/server';
import { connectDB, sequelize } from '@/lib/db';
import { Hospital, Lead, LeadTransaction, Notification } from '@/models';
import { sendEnquiryEmail } from '@/lib/mailer';

export async function POST(req: Request) {
  try {
    await connectDB();
    const body = await req.json();

    const {
      patientName,
      phone,
      email,
      city,
      serviceId,
      hospitalId,
      message,
      preferredContactTime,
      isGeneralContact,
    } = body;

    if (!patientName || !phone || !email) {
      return NextResponse.json({ error: 'Please fill in all required enquiry fields.' }, { status: 400 });
    }

    let targetHospital = null;
    if (hospitalId && !isGeneralContact) {
      targetHospital = await Hospital.findByPk(hospitalId);
    }

    // Specific Hospital Service Enquiry
    if (targetHospital && targetHospital.status === 'APPROVED' && targetHospital.accountStatus === 'ACTIVE') {
      const hasLeadBalance = targetHospital.leadsRemaining > 0;

      if (hasLeadBalance) {
        // Hospital HAS lead balance -> Deduct lead, create transaction, notify hospital & admin
        const balanceBefore = targetHospital.leadsRemaining;
        const balanceAfter = balanceBefore - 1;
        const totalUsedAfter = (targetHospital.totalLeadsUsed || 0) + 1;

        const transaction = await sequelize.transaction();

        try {
          await targetHospital.update(
            {
              leadsRemaining: balanceAfter,
              totalLeadsUsed: totalUsedAfter,
            },
            { transaction }
          );

          const lead = await Lead.create(
            {
              patientName: patientName.trim(),
              phone: phone.trim(),
              email: email.trim(),
              city: city ? city.trim() : 'Service Enquiry',
              serviceId: serviceId ? Number(serviceId) : 1,
              hospitalId: Number(hospitalId),
              message: message ? message.trim() : null,
              preferredContactTime: preferredContactTime ? preferredContactTime.trim() : null,
              status: 'NEW',
              notes: [],
            },
            { transaction }
          );

          await LeadTransaction.create(
            {
              hospitalId: Number(hospitalId),
              leadId: lead.id,
              transactionType: 'LEAD_CONSUMED',
              leadAmount: -1,
              balanceBefore,
              balanceAfter,
              description: `Patient enquiry from ${patientName} (${email})`,
            },
            { transaction }
          );

          await Notification.create(
            {
              recipientType: 'HOSPITAL',
              recipientId: Number(hospitalId),
              title: 'New Patient Service Enquiry Received',
              message: `New enquiry from ${patientName} for your medical service.`,
              type: 'NEW_LEAD',
              isRead: false,
            },
            { transaction }
          );

          await transaction.commit();

          // Send lead details email to BOTH Target Hospital AND Super Admin
          sendEnquiryEmail({
            patientName: patientName.trim(),
            phone: phone.trim(),
            email: email.trim(),
            city: city ? city.trim() : 'Service Enquiry',
            message: message ? message.trim() : '',
            hospitalName: targetHospital.name,
            hospitalEmail: targetHospital.email,
          }).catch((err) => console.error('[MAILER] Async service enquiry email failed:', err));
        } catch (txErr) {
          await transaction.rollback();
          console.error('Transaction rollback during enquiry lead deduction:', txErr);
          return NextResponse.json({ error: 'Transaction error processing enquiry.' }, { status: 500 });
        }
      } else {
        // Hospital HAS ZERO lead balance -> Save lead for Super Admin review
        await Lead.create({
          patientName: patientName.trim(),
          phone: phone.trim(),
          email: email.trim(),
          city: city ? city.trim() : 'Service Enquiry (Zero Balance)',
          serviceId: serviceId ? Number(serviceId) : 1,
          hospitalId: Number(hospitalId),
          message: message ? message.trim() : null,
          preferredContactTime: preferredContactTime ? preferredContactTime.trim() : null,
          status: 'UNASSIGNED',
          notes: [{ content: 'Lead held: Hospital has 0 leads balance. Patient details restricted until package purchase.', author: 'System', createdAt: new Date().toISOString() }],
        });

        // Notify Hospital about pending lead locked due to zero balance
        await Notification.create({
          recipientType: 'HOSPITAL',
          recipientId: Number(hospitalId),
          title: 'Pending Patient Enquiry (Package Required)',
          message: 'You received a new patient enquiry, but your lead balance is 0. Purchase a Lead Package to unlock patient contact details.',
          type: 'PACKAGE_EXPIRED',
          isRead: false,
        });

        // Send email notification to BOTH Target Hospital AND Super Admin
        sendEnquiryEmail({
          patientName: patientName.trim(),
          phone: phone.trim(),
          email: email.trim(),
          city: city ? city.trim() : 'Service Enquiry',
          message: message ? message.trim() : '',
          hospitalName: targetHospital.name,
          hospitalEmail: targetHospital.email,
        }).catch((err) => console.error('[MAILER] Async enquiry email failed:', err));
      }
    } else {
      // General Contact Form or Unapproved Hospital -> Send to Super Admin and Hospital if available
      try {
        await Lead.create({
          patientName: patientName.trim(),
          phone: phone.trim(),
          email: email.trim(),
          city: city ? city.trim() : 'General Contact',
          serviceId: serviceId ? Number(serviceId) : 1,
          hospitalId: targetHospital ? targetHospital.id : 1,
          message: message ? message.trim() : null,
          preferredContactTime: preferredContactTime ? preferredContactTime.trim() : null,
          status: 'NEW',
          notes: [],
        });
      } catch (leadErr) {
        console.warn('Fallback general lead creation error:', leadErr);
      }

      // Send email to Super Admin and Target Hospital (if found)
      sendEnquiryEmail({
        patientName: patientName.trim(),
        phone: phone.trim(),
        email: email.trim(),
        city: city ? city.trim() : 'General Contact',
        message: message ? message.trim() : '',
        ...(targetHospital ? { hospitalName: targetHospital.name, hospitalEmail: targetHospital.email } : {}),
      }).catch((err) => console.error('[MAILER] Async general contact email failed:', err));
    }

    return NextResponse.json(
      {
        message: 'Thank you for your message. Your enquiry has been submitted successfully.',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Enquiry submission error:', error);
    return NextResponse.json({ error: 'Server error processing enquiry.' }, { status: 500 });
  }
}
