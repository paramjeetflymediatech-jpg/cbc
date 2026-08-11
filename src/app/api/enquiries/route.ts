import { NextResponse } from 'next/server';
import { connectDB, sequelize } from '@/lib/db';
import { Hospital, Lead, LeadTransaction, Notification } from '@/models';
import { QueryTypes } from 'sequelize';
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
        const transaction = await sequelize.transaction();

        try {
          const [updateResult]: any = await sequelize.query(
            `UPDATE hospitals 
             SET leadsRemaining = leadsRemaining - 1, totalLeadsUsed = totalLeadsUsed + 1 
             WHERE id = :hId AND leadsRemaining > 0 AND status = 'APPROVED' AND accountStatus = 'ACTIVE'`,
            {
              replacements: { hId: hospitalId },
              type: QueryTypes.UPDATE,
              transaction,
            }
          );

          const affectedRows = updateResult?.affectedRows || updateResult;
          if (affectedRows && affectedRows > 0) {
            const updatedHospital = await Hospital.findByPk(hospitalId, { transaction });
            const newRemaining = updatedHospital ? updatedHospital.leadsRemaining : targetHospital.leadsRemaining - 1;
            const balanceBefore = newRemaining + 1;

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
                balanceAfter: newRemaining,
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
          } else {
            await transaction.rollback();
          }
        } catch (txErr) {
          await transaction.rollback();
          console.error('Transaction rollback during enquiry lead deduction:', txErr);
        }
      } else {
        // Hospital HAS ZERO lead balance -> DO NOT send patient details or email to hospital
        // Save lead for Super Admin review
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

        // Send email ONLY to Super Admin (with notice that hospital balance is 0)
        sendEnquiryEmail({
          patientName: patientName.trim(),
          phone: phone.trim(),
          email: email.trim(),
          city: city ? city.trim() : 'Service Enquiry (Zero Balance)',
          message: `[Zero Lead Balance Alert: ${targetHospital.name} has 0 leads. Patient lead held for admin review] ${message || ''}`,
          hospitalName: `${targetHospital.name} (0 Leads Remaining)`,
        }).catch((err) => console.error('[MAILER] Async admin-only enquiry email failed:', err));
      }
    } else {
      // General Contact Form -> Send ONLY to Super Admin
      try {
        await Lead.create({
          patientName: patientName.trim(),
          phone: phone.trim(),
          email: email.trim(),
          city: city ? city.trim() : 'General Contact',
          serviceId: serviceId ? Number(serviceId) : 1,
          hospitalId: 1,
          message: message ? message.trim() : null,
          preferredContactTime: preferredContactTime ? preferredContactTime.trim() : null,
          status: 'NEW',
          notes: [],
        });
      } catch (leadErr) {
        console.warn('Fallback general lead creation error:', leadErr);
      }

      // Send email ONLY to Super Admin
      sendEnquiryEmail({
        patientName: patientName.trim(),
        phone: phone.trim(),
        email: email.trim(),
        city: city ? city.trim() : 'General Contact',
        message: message ? message.trim() : '',
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
