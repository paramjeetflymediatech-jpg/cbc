import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { User, Lead } from '@/models';
import { hashPassword } from '@/lib/auth';
import { sendPasswordResetEmail } from '@/lib/mailer';

export async function POST(req: Request) {
  try {
    await connectDB();
    const body = await req.json();
    const { email } = body;

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();
    let user = await User.findOne({ where: { email: cleanEmail } });

    // If user account does not exist, check if patient submitted any Lead enquiries under this email
    if (!user) {
      const existingLead = await Lead.findOne({
        where: { email: cleanEmail },
        order: [['createdAt', 'DESC']],
      });

      if (existingLead) {
        // Auto-create User account for this patient
        const initialPassword = `CBC-${Math.floor(100000 + Math.random() * 900000)}`;
        const initialPassHash = await hashPassword(initialPassword);

        user = await User.create({
          name: existingLead.patientName || 'Patient',
          email: cleanEmail,
          passwordHash: initialPassHash,
          role: 'PATIENT',
          phone: existingLead.phone || null,
          city: existingLead.city || null,
          status: 'ACTIVE',
        });

        // Link existing leads to this new user
        await Lead.update({ userId: user.id }, { where: { email: cleanEmail, userId: null as any } });
      }
    }

    if (!user) {
      return NextResponse.json(
        {
          error: `No account found with ${cleanEmail}. Please check the spelling or submit a consultation inquiry to get started.`,
        },
        { status: 404 }
      );
    }

    if (user.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: 'This account is currently deactivated. Please contact support.' },
        { status: 403 }
      );
    }

    // Generate readable temporary password
    const tempPassword = `CBC-${Math.floor(100000 + Math.random() * 900000)}`;
    const passHash = await hashPassword(tempPassword);

    await user.update({ passwordHash: passHash });

    // Send email with new password
    const mailResult = await sendPasswordResetEmail({
      name: user.name || 'User',
      email: user.email,
      newPassword: tempPassword,
    });

    if (!mailResult.success) {
      console.error('Password reset email sending failed:', mailResult.error);
      return NextResponse.json(
        {
          error: 'Unable to deliver the password reset email right now. Please try again in a few moments or contact support.',
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `A new temporary password has been successfully sent to ${user.email}. Please check your inbox (and spam folder) to log in.`,
    });
  } catch (error) {
    console.error('Forgot password API error:', error);
    return NextResponse.json(
      { error: 'Server error processing password reset request.' },
      { status: 500 }
    );
  }
}
