import { NextResponse } from 'next/server';
import { connectDB, sequelize } from '@/lib/db';
import { Hospital, Lead, LeadTransaction, Notification, Service, User } from '@/models';
import { sendEnquiryEmail } from '@/lib/mailer';
import { verifyToken, hashPassword } from '@/lib/auth';
import { Op } from 'sequelize';
import crypto from 'crypto';

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

    const cleanEmail = email.toLowerCase().trim();
    const cleanName = patientName.trim();
    const cleanPhone = phone.trim();

    // 1. Find or create unique patient user account
    let patientUser = await User.findOne({ where: { email: cleanEmail } });
    if (!patientUser) {
      const generatedPassword = crypto.randomBytes(16).toString('hex');
      const passHash = await hashPassword(generatedPassword);
      patientUser = await User.create({
        name: cleanName,
        email: cleanEmail,
        passwordHash: passHash,
        role: 'PATIENT',
        phone: cleanPhone || null,
        status: 'ACTIVE',
      });
    } else if (cleanPhone && !patientUser.phone) {
      await patientUser.update({ phone: cleanPhone });
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
              userId: patientUser.id,
              patientName: cleanName,
              phone: cleanPhone,
              email: cleanEmail,
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
              description: `Patient enquiry from ${cleanName} (${cleanEmail})`,
            },
            { transaction }
          );

          await Notification.create(
            {
              recipientType: 'HOSPITAL',
              recipientId: Number(hospitalId),
              title: 'New Patient Service Enquiry Received',
              message: `New enquiry from ${cleanName} for your medical service.`,
              type: 'NEW_LEAD',
              isRead: false,
            },
            { transaction }
          );

          await transaction.commit();

          // Link any other existing unassigned leads for this email to this user
          await Lead.update(
            { userId: patientUser.id },
            { where: { email: cleanEmail, userId: null } }
          );

          // Send lead details email to BOTH Target Hospital AND Super Admin
          sendEnquiryEmail({
            patientName: cleanName,
            phone: cleanPhone,
            email: cleanEmail,
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
          userId: patientUser.id,
          patientName: cleanName,
          phone: cleanPhone,
          email: cleanEmail,
          city: city ? city.trim() : 'Service Enquiry (Zero Balance)',
          serviceId: serviceId ? Number(serviceId) : 1,
          hospitalId: Number(hospitalId),
          message: message ? message.trim() : null,
          preferredContactTime: preferredContactTime ? preferredContactTime.trim() : null,
          status: 'UNASSIGNED',
          notes: [{ content: 'Lead held: Hospital has 0 leads balance. Patient details restricted until package purchase.', author: 'System', createdAt: new Date().toISOString() }],
        });

        // Link any other existing unassigned leads for this email to this user
        await Lead.update(
          { userId: patientUser.id },
          { where: { email: cleanEmail, userId: null } }
        );

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
          patientName: cleanName,
          phone: cleanPhone,
          email: cleanEmail,
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
          userId: patientUser.id,
          patientName: cleanName,
          phone: cleanPhone,
          email: cleanEmail,
          city: city ? city.trim() : 'General Contact',
          serviceId: serviceId ? Number(serviceId) : 1,
          hospitalId: targetHospital ? targetHospital.id : 1,
          message: message ? message.trim() : null,
          preferredContactTime: preferredContactTime ? preferredContactTime.trim() : null,
          status: 'NEW',
          notes: [],
        });

        // Link any other existing unassigned leads for this email to this user
        await Lead.update(
          { userId: patientUser.id },
          { where: { email: cleanEmail, userId: null } }
        );
      } catch (leadErr) {
        console.warn('Fallback general lead creation error:', leadErr);
      }

      // Send email to Super Admin and Target Hospital (if found)
      sendEnquiryEmail({
        patientName: cleanName,
        phone: cleanPhone,
        email: cleanEmail,
        city: city ? city.trim() : 'General Contact',
        message: message ? message.trim() : '',
        ...(targetHospital ? { hospitalName: targetHospital.name, hospitalEmail: targetHospital.email } : {}),
      }).catch((err) => console.error('[MAILER] Async general contact email failed:', err));
    }

    return NextResponse.json(
      {
        message: 'Thank you for your message. Your enquiry has been submitted successfully.',
        userId: patientUser.id,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Enquiry submission error:', error);
    return NextResponse.json({ error: 'Server error processing enquiry.' }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    await connectDB();
    
    // Extract authorization header or cbc_token cookie
    const authHeader = req.headers.get('authorization');
    let token = '';
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else {
      // Check cookie
      const { cookies } = await import('next/headers');
      const cookieStore = await cookies();
      token = cookieStore.get('cbc_token')?.value || '';
    }

    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload || !payload.email) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    }

    const cleanEmail = payload.email.toLowerCase().trim();
    const userIdNum = payload.userId ? Number(payload.userId) : null;

    // Query leads for this user by userId OR email
    const whereCondition: any = {
      [Op.or]: [
        ...(userIdNum ? [{ userId: userIdNum }] : []),
        { email: cleanEmail },
      ],
    };

    const leads = await Lead.findAll({
      where: whereCondition,
      include: [
        {
          model: Hospital,
          as: 'hospital',
          attributes: ['id', 'name', 'city', 'location', 'address', 'image', 'phone', 'email', 'rating', 'specialties', 'isNabhAccredited', 'isVerifiedPartner'],
        },
        {
          model: Service,
          as: 'service',
          attributes: ['id', 'name', 'slug', 'category', 'image', 'icon'],
        },
      ],
      order: [['createdAt', 'DESC']],
    });

    return NextResponse.json({ leads });
  } catch (error) {
    console.error('Fetch enquiries error:', error);
    return NextResponse.json({ error: 'Server error fetching enquiries' }, { status: 500 });
  }
}
