import { NextResponse } from 'next/server';
import { connectDB, sequelize } from '@/lib/db';
import { Hospital, Lead, LeadTransaction, Notification, Service, User } from '@/models';
import { sendEnquiryEmail, sendPatientCredentialsEmail } from '@/lib/mailer';
import { verifyToken, signToken, hashPassword } from '@/lib/auth';
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

    // Check if requester is already authenticated via cookie or Bearer token
    const authHeader = req.headers.get('authorization');
    let token = '';
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else {
      const { cookies } = await import('next/headers');
      const cookieStore = await cookies();
      token = cookieStore.get('cbc_token')?.value || '';
    }

    let authPayload: any = null;
    if (token) {
      authPayload = verifyToken(token);
    }

    const isVerifiedAuth = authPayload && authPayload.email && authPayload.email.toLowerCase().trim() === cleanEmail;

    // Check if user account already exists in DB
    const existingUser = await User.findOne({ where: { email: cleanEmail } });

    // If account already exists but user is NOT authenticated with this email -> Require Login!
    if (existingUser && !isVerifiedAuth) {
      return NextResponse.json(
        {
          requireLogin: true,
          error: 'An account with this email already exists. Please log in to securely submit and link your enquiry.',
          email: cleanEmail,
        },
        { status: 409 }
      );
    }

    let patientUser = existingUser;
    let isNewUserCreated = false;
    let plainGeneratedPassword = '';

    // If new user, create their account with a clear readable password
    if (!patientUser) {
      plainGeneratedPassword = `CBC-${Math.floor(100000 + Math.random() * 900000)}`;
      const passHash = await hashPassword(plainGeneratedPassword);
      patientUser = await User.create({
        name: cleanName,
        email: cleanEmail,
        passwordHash: passHash,
        role: 'PATIENT',
        phone: cleanPhone || null,
        status: 'ACTIVE',
      });
      isNewUserCreated = true;
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
            {
              where: {
                email: cleanEmail,
                [Op.or]: [{ userId: null }, { userId: { [Op.ne]: patientUser.id } }],
              },
            }
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
          notes: [
            {
              content: 'Lead held: Hospital has 0 leads balance. Patient details restricted until package purchase.',
              author: 'System',
              createdAt: new Date().toISOString(),
            },
          ],
        });

        // Link any other existing unassigned leads for this email to this user
        await Lead.update(
          { userId: patientUser.id },
          {
            where: {
              email: cleanEmail,
              [Op.or]: [{ userId: null }, { userId: { [Op.ne]: patientUser.id } }],
            },
          }
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
      // General Contact Form or Direct Platform Enquiry -> Assign to Super Admin / platform
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
          {
            where: {
              email: cleanEmail,
              [Op.or]: [{ userId: null }, { userId: { [Op.ne]: patientUser.id } }],
            },
          }
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

    // Send account credentials email to newly registered patient
    if (isNewUserCreated && plainGeneratedPassword) {
      sendPatientCredentialsEmail({
        patientName: cleanName,
        email: cleanEmail,
        password: plainGeneratedPassword,
        hospitalName: targetHospital?.name,
      }).catch((err) => console.error('[MAILER] Async patient credentials email failed:', err));
    }

    const response = NextResponse.json(
      {
        message: 'Thank you for your message. Your enquiry has been submitted successfully.',
        userId: patientUser.id,
        userEmail: cleanEmail,
        isNewUser: isNewUserCreated,
      },
      { status: 201 }
    );

    // Auto-login the newly created patient
    if (isNewUserCreated) {
      const token = signToken({
        userId: String(patientUser.id),
        email: patientUser.email,
        role: patientUser.role,
        name: patientUser.name,
      });

      response.cookies.set({
        name: 'cbc_token',
        value: token,
        httpOnly: true,
        path: '/',
        maxAge: 60 * 60 * 24 * 7,
        sameSite: 'lax',
      });
    }

    return response;
  } catch (error) {
    console.error('Enquiry submission error:', error);
    return NextResponse.json({ error: 'Server error processing enquiry.' }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const emailParam = searchParams.get('email');

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

    let cleanEmail = '';
    let userIdNum: number | null = null;

    if (token) {
      const payload = verifyToken(token);
      if (payload && payload.email) {
        cleanEmail = payload.email.toLowerCase().trim();
        userIdNum = payload.userId ? Number(payload.userId) : null;
      }
    }

    if (!cleanEmail && emailParam) {
      cleanEmail = emailParam.toLowerCase().trim();
      const user = await User.findOne({ where: { email: cleanEmail } });
      if (user) {
        userIdNum = user.id;
      }
    }

    if (!cleanEmail && !userIdNum) {
      return NextResponse.json({ error: 'Authentication or email required' }, { status: 401 });
    }

    // Query leads for this user by userId OR email (excluding enquiries deleted/hidden by patient)
    const whereCondition: any = {
      [Op.or]: [
        ...(userIdNum ? [{ userId: userIdNum }] : []),
        ...(cleanEmail ? [{ email: cleanEmail }] : []),
      ],
      [Op.and]: [
        {
          [Op.or]: [{ deletedByUser: false }, { deletedByUser: null as any }],
        },
      ],
    };

    const leads = await Lead.findAll({
      where: whereCondition,
      include: [
        {
          model: Hospital,
          as: 'hospital',
          attributes: [
            'id',
            'name',
            'slug',
            'city',
            'state',
            'district',
            'address',
            'logo',
            'coverImage',
            'phone',
            'email',
            'rating',
            'isNabhAccredited',
            'isVerifiedPartner',
          ],
        },
        {
          model: Service,
          as: 'service',
          attributes: ['id', 'name', 'slug', 'category', 'image', 'icon'],
        },
      ],
      order: [['createdAt', 'DESC']],
    });

    return NextResponse.json({
      success: true,
      total: leads.length,
      userId: userIdNum,
      email: cleanEmail,
      leads,
    });
  } catch (error) {
    console.error('Fetch enquiries error:', error);
    return NextResponse.json({ error: 'Server error fetching enquiries' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    await connectDB();

    const authHeader = req.headers.get('authorization');
    let token = '';
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else {
      const { cookies } = await import('next/headers');
      const cookieStore = await cookies();
      token = cookieStore.get('cbc_token')?.value || '';
    }

    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload || (!payload.userId && !payload.email)) {
      return NextResponse.json({ error: 'Invalid or expired authentication token' }, { status: 401 });
    }

    const cleanEmail = (payload.email || '').toLowerCase().trim();
    const userIdNum = payload.userId ? Number(payload.userId) : 0;
    const userRole = payload.role;

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const hospitalId = searchParams.get('hospitalId');

    // Delete single lead by ID (only soft-deleted for user side, hospital & super admin keep record)
    if (id) {
      const lead = await Lead.findByPk(id);
      if (!lead) {
        return NextResponse.json({ error: 'Enquiry not found' }, { status: 404 });
      }

      // Check ownership
      if (
        userRole !== 'SUPER_ADMIN' &&
        userRole !== 'ADMIN' &&
        lead.userId !== userIdNum &&
        lead.email.toLowerCase().trim() !== cleanEmail
      ) {
        return NextResponse.json({ error: 'Unauthorized to delete this enquiry' }, { status: 403 });
      }

      // Only soft delete from user dashboard so hospital & admin still have it
      await lead.update({ deletedByUser: true });
      return NextResponse.json({ success: true, message: 'Enquiry removed from your patient panel' });
    }

    // Delete all leads for a hospital for this user (only soft-deleted for user side)
    if (hospitalId) {
      const whereCondition: any = {
        hospitalId: Number(hospitalId),
        [Op.or]: [
          ...(userIdNum ? [{ userId: userIdNum }] : []),
          ...(cleanEmail ? [{ email: cleanEmail }] : []),
        ],
      };

      const [updatedCount] = await Lead.update({ deletedByUser: true }, { where: whereCondition });
      return NextResponse.json({
        success: true,
        message: `Removed ${updatedCount} enquiry(s) from your patient panel.`,
        deletedCount: updatedCount,
      });
    }

    return NextResponse.json({ error: 'Missing enquiry id or hospitalId parameter' }, { status: 400 });
  } catch (error) {
    console.error('Delete enquiry error:', error);
    return NextResponse.json({ error: 'Server error deleting enquiry' }, { status: 500 });
  }
}


