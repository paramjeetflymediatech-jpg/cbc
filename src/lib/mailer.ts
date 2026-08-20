import nodemailer from 'nodemailer';

const SMTP_HOST = process.env.SMTP_HOST || 'smtp.gmail.com';
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '587', 10);
const SMTP_USER = process.env.SMTP_USER || '';
const SMTP_PASS = process.env.SMTP_PASS || '';
const SMTP_FROM = process.env.SMTP_FROM || `"Clinic By Choice" <${SMTP_USER || 'info@clinicbychoice.com'}>`;

export const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: SMTP_PORT,
  secure: SMTP_PORT === 465,
  auth: SMTP_USER && SMTP_PASS ? {
    user: SMTP_USER,
    pass: SMTP_PASS,
  } : undefined,
});

export interface SendEmailOptions {
  to?: string | string[];
  bcc?: string | string[];
  subject: string;
  html: string;
  text?: string;
}

function parseRecipients(recipients?: string | string[]): string[] {
  if (!recipients) return [];
  if (Array.isArray(recipients)) {
    return recipients.flatMap((r) => r.split(',')).map((r) => r.trim()).filter(Boolean);
  }
  return recipients.split(',').map((r) => r.trim()).filter(Boolean);
}

function getLogoUrl() {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (appUrl && !appUrl.includes('localhost')) {
    return `${appUrl}/images/logoblac.png`;
  }
  // Universal CDN hosted black logo fallback
  return 'https://spcdn.shortpixel.ai/spio/ret_img,q_cdnize,to_auto,s_webp:avif/clinicbychoice.com/wp-content/uploads/2025/02/logocbc.png';
}

export async function sendEmail(options: SendEmailOptions) {
  try {
    const toRecipients = parseRecipients(options.to);
    const bccRecipients = parseRecipients(options.bcc);

    const toField = toRecipients.length > 0 ? toRecipients.join(', ') : SMTP_FROM;
    const bccField = bccRecipients.length > 0 ? bccRecipients.join(', ') : undefined;

    if (!SMTP_USER || !SMTP_PASS) {
      console.log('[MAILER] SMTP_USER and SMTP_PASS not set. Email logged locally:', {
        to: toField,
        bcc: bccField,
        subject: options.subject,
      });
      return { success: true, simulated: true };
    }

    // For Gmail SMTP, envelope from must match authenticated account to pass SPF & avoid spam filtering
    const isGmail = SMTP_HOST.toLowerCase().includes('gmail.com');
    const effectiveFrom = isGmail && SMTP_USER ? `"Clinic By Choice" <${SMTP_USER}>` : SMTP_FROM;

    const info = await transporter.sendMail({
      from: effectiveFrom,
      replyTo: 'info@clinicbychoice.com',
      to: toField,
      bcc: bccField,
      subject: options.subject,
      text: options.text || options.html.replace(/<[^>]+>/g, ''),
      html: options.html,
    });

    console.log('[MAILER] Email sent successfully to:', toField, 'BCC:', bccField, 'MessageId:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('[MAILER] Error sending email:', error);
    return { success: false, error };
  }
}

/**
 * Send Patient Enquiry Email Notification with Black Logo Header via BCC
 */
export async function sendEnquiryEmail({
  patientName,
  phone,
  email,
  city,
  message,
  hospitalName,
  hospitalEmail,
}: {
  patientName: string;
  phone: string;
  email: string;
  city?: string;
  message?: string;
  hospitalName?: string;
  hospitalEmail?: string;
}) {
  const adminRecipients = parseRecipients(
    process.env.SUPER_ADMIN_EMAIL || process.env.ADMIN_EMAIL || SMTP_USER || 'info@clinicbychoice.com'
  );

  const hospitalRecipients = hospitalEmail ? parseRecipients(hospitalEmail) : [];
  const allRecipients = Array.from(new Set([...adminRecipients, ...hospitalRecipients]));

  const cleanCity = city ? city.trim() : '';
  const isInternalPlaceholder = ['Home Contact Form', 'Contact Us Page', 'General Contact', 'Service Enquiry', 'General', 'N/A', ''].includes(cleanCity);
  const showCity = Boolean(cleanCity && !isInternalPlaceholder);
  const logoUrl = getLogoUrl();

  const html = `
    <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 0; border: 1px solid #e5e7eb; border-radius: 16px; overflow: hidden; background-color: #ffffff; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
      
      <!-- Header with Black Logo Badge -->
      <div style="background: linear-gradient(90deg, rgb(180 58 173) 0%, rgb(253 29 116) 50%, rgb(252 69 214) 100%); padding: 28px 24px; text-align: center;">
        <div style="background-color: rgba(255, 255, 255, 0.98); padding: 10px 22px; border-radius: 14px; display: inline-block; margin-bottom: 16px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);">
          <img src="${logoUrl}" alt="Clinic By Choice Logo" style="max-height: 48px; width: auto; display: block; margin: 0 auto;" />
        </div>
        <h2 style="color: #ffffff; margin: 0; font-size: 20px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px;">New Patient Enquiry Received</h2>
      </div>

      <!-- Main Email Content -->
      <div style="padding: 28px 24px; background-color: #ffffff;">
        <p style="font-size: 15px; color: #374151; margin-top: 0; line-height: 1.6;">
          A new consultation request has been submitted on <strong>Clinic By Choice</strong>:
        </p>
        
        <table style="width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 14px;">
          ${hospitalName ? `
          <tr style="border-bottom: 1px solid #f3f4f6;">
            <td style="padding: 10px 0; font-weight: 700; color: #6b7280; width: 140px;">Selected Hospital:</td>
            <td style="padding: 10px 0; color: #111827; font-weight: 800;">${hospitalName}</td>
          </tr>` : ''}
          <tr style="border-bottom: 1px solid #f3f4f6;">
            <td style="padding: 10px 0; font-weight: 700; color: #6b7280; width: 140px;">Patient Name:</td>
            <td style="padding: 10px 0; color: #111827; font-weight: 700;">${patientName}</td>
          </tr>
          <tr style="border-bottom: 1px solid #f3f4f6;">
            <td style="padding: 10px 0; font-weight: 700; color: #6b7280;">Mobile Number:</td>
            <td style="padding: 10px 0; color: #111827; font-weight: 700;">${phone}</td>
          </tr>
          <tr style="border-bottom: 1px solid #f3f4f6;">
            <td style="padding: 10px 0; font-weight: 700; color: #6b7280;">Email Address:</td>
            <td style="padding: 10px 0; color: #111827;">${email}</td>
          </tr>
          ${showCity ? `
          <tr style="border-bottom: 1px solid #f3f4f6;">
            <td style="padding: 10px 0; font-weight: 700; color: #6b7280;">City / Location:</td>
            <td style="padding: 10px 0; color: #111827;">${cleanCity}</td>
          </tr>` : ''}
          ${message ? `
          <tr>
            <td style="padding: 10px 0; font-weight: 700; color: #6b7280; vertical-align: top;">Message:</td>
            <td style="padding: 10px 0; color: #111827; line-height: 1.6;">${message}</td>
          </tr>` : ''}
        </table>

        <!-- Footer Banner CTA -->
        <div style="margin-top: 28px; padding: 16px; background-color: #fdf2f8; border-left: 4px solid #fd1d74; border-radius: 8px;">
          <p style="margin: 0; font-size: 13px; color: #9d174d; font-weight: 600;">
            Log in to your Admin/Hospital Dashboard to view and manage this patient enquiry.
          </p>
        </div>
      </div>

      <!-- Footer Bar -->
      <div style="background-color: #f9fafb; padding: 16px; text-align: center; border-top: 1px solid #f3f4f6; font-size: 12px; color: #9ca3af;">
        Copyright © 2026 Clinic By Choice. All rights reserved.
      </div>
    </div>
  `;

  return sendEmail({
    bcc: allRecipients,
    subject: `New Patient Enquiry: ${patientName} (${phone})${hospitalName ? ` - ${hospitalName}` : ''}`,
    html,
  });
}

/**
 * Send Hospital Onboarding Registration Email with Black Logo Header via BCC
 */
export async function sendHospitalRegistrationEmail({
  hospitalName,
  email,
  phone,
  city,
}: {
  hospitalName: string;
  email: string;
  phone: string;
  city: string;
}) {
  const adminRecipients = parseRecipients(
    process.env.SUPER_ADMIN_EMAIL || process.env.ADMIN_EMAIL || SMTP_USER || 'info@clinicbychoice.com'
  );
  const allRecipients = Array.from(new Set([...adminRecipients, email.trim()]));
  const logoUrl = getLogoUrl();

  const html = `
    <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 0; border: 1px solid #e5e7eb; border-radius: 16px; overflow: hidden; background-color: #ffffff; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
      
      <!-- Header with Black Logo Badge -->
      <div style="background: linear-gradient(90deg, rgb(180 58 173) 0%, rgb(253 29 116) 50%, rgb(252 69 214) 100%); padding: 28px 24px; text-align: center;">
        <div style="background-color: rgba(255, 255, 255, 0.98); padding: 10px 22px; border-radius: 14px; display: inline-block; margin-bottom: 16px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);">
          <img src="${logoUrl}" alt="Clinic By Choice Logo" style="max-height: 48px; width: auto; display: block; margin: 0 auto;" />
        </div>
        <h2 style="color: #ffffff; margin: 0; font-size: 20px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px;">Hospital Onboarding Registration</h2>
      </div>

      <!-- Main Content -->
      <div style="padding: 28px 24px; background-color: #ffffff;">
        <p style="font-size: 15px; color: #374151; margin-top: 0; line-height: 1.6;">
          A new hospital has submitted registration on <strong>Clinic By Choice</strong>:
        </p>
        
        <table style="width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 14px;">
          <tr style="border-bottom: 1px solid #f3f4f6;">
            <td style="padding: 10px 0; font-weight: 700; color: #6b7280; width: 140px;">Hospital Name:</td>
            <td style="padding: 10px 0; color: #111827; font-weight: 800;">${hospitalName}</td>
          </tr>
          <tr style="border-bottom: 1px solid #f3f4f6;">
            <td style="padding: 10px 0; font-weight: 700; color: #6b7280;">Official Email:</td>
            <td style="padding: 10px 0; color: #111827;">${email}</td>
          </tr>
          <tr style="border-bottom: 1px solid #f3f4f6;">
            <td style="padding: 10px 0; font-weight: 700; color: #6b7280;">Phone Number:</td>
            <td style="padding: 10px 0; color: #111827;">${phone}</td>
          </tr>
          <tr style="border-bottom: 1px solid #f3f4f6;">
            <td style="padding: 10px 0; font-weight: 700; color: #6b7280;">City:</td>
            <td style="padding: 10px 0; color: #111827;">${city}</td>
          </tr>
        </table>

        <!-- Footer Banner CTA -->
        <div style="margin-top: 28px; padding: 16px; background-color: #fdf2f8; border-left: 4px solid #fd1d74; border-radius: 8px;">
          <p style="margin: 0; font-size: 13px; color: #9d174d; font-weight: 600;">
            Review and approve this hospital account from the Super Admin Portal.
          </p>
        </div>
      </div>

      <!-- Footer Bar -->
      <div style="background-color: #f9fafb; padding: 16px; text-align: center; border-top: 1px solid #f3f4f6; font-size: 12px; color: #9ca3af;">
        Copyright © 2026 Clinic By Choice. All rights reserved.
      </div>
    </div>
  `;

  return sendEmail({
    bcc: allRecipients,
    subject: `Hospital Onboarding Received: ${hospitalName}`,
    html,
  });
}

/**
 * Send Lead Package Purchase Confirmation Email with Black Logo Header via BCC
 */
export async function sendPackagePurchaseEmail({
  hospitalName,
  hospitalEmail,
  packageName,
  leadCount,
  amountPaid,
  transactionId,
  newBalance,
}: {
  hospitalName: string;
  hospitalEmail: string;
  packageName: string;
  leadCount: number;
  amountPaid: number;
  transactionId: string;
  newBalance: number;
}) {
  const adminRecipients = parseRecipients(
    process.env.SUPER_ADMIN_EMAIL || process.env.ADMIN_EMAIL || SMTP_USER || 'info@clinicbychoice.com'
  );
  const hospitalRecipients = hospitalEmail ? parseRecipients(hospitalEmail) : [];
  const allRecipients = Array.from(new Set([...adminRecipients, ...hospitalRecipients]));
  const logoUrl = getLogoUrl();

  const html = `
    <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 0; border: 1px solid #e5e7eb; border-radius: 16px; overflow: hidden; background-color: #ffffff; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
      
      <!-- Header with Black Logo Badge -->
      <div style="background: linear-gradient(90deg, rgb(180 58 173) 0%, rgb(253 29 116) 50%, rgb(252 69 214) 100%); padding: 28px 24px; text-align: center;">
        <div style="background-color: rgba(255, 255, 255, 0.98); padding: 10px 22px; border-radius: 14px; display: inline-block; margin-bottom: 16px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);">
          <img src="${logoUrl}" alt="Clinic By Choice Logo" style="max-height: 48px; width: auto; display: block; margin: 0 auto;" />
        </div>
        <h2 style="color: #ffffff; margin: 0; font-size: 20px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px;">Lead Package Purchase Confirmed</h2>
      </div>

      <!-- Main Content -->
      <div style="padding: 28px 24px; background-color: #ffffff;">
        <p style="font-size: 15px; color: #374151; margin-top: 0; line-height: 1.6;">
          Payment confirmed! Your hospital account on <strong>Clinic By Choice</strong> has been credited with new patient leads.
        </p>
        
        <table style="width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 14px;">
          <tr style="border-bottom: 1px solid #f3f4f6;">
            <td style="padding: 10px 0; font-weight: 700; color: #6b7280; width: 150px;">Hospital Name:</td>
            <td style="padding: 10px 0; color: #111827; font-weight: 800;">${hospitalName}</td>
          </tr>
          <tr style="border-bottom: 1px solid #f3f4f6;">
            <td style="padding: 10px 0; font-weight: 700; color: #6b7280;">Package Purchased:</td>
            <td style="padding: 10px 0; color: #111827; font-weight: 700;">${packageName}</td>
          </tr>
          <tr style="border-bottom: 1px solid #f3f4f6;">
            <td style="padding: 10px 0; font-weight: 700; color: #6b7280;">Leads Credited:</td>
            <td style="padding: 10px 0; color: #059669; font-weight: 800;">+${leadCount} Leads</td>
          </tr>
          <tr style="border-bottom: 1px solid #f3f4f6;">
            <td style="padding: 10px 0; font-weight: 700; color: #6b7280;">New Total Balance:</td>
            <td style="padding: 10px 0; color: #111827; font-weight: 800;">${newBalance} Leads Available</td>
          </tr>
          <tr style="border-bottom: 1px solid #f3f4f6;">
            <td style="padding: 10px 0; font-weight: 700; color: #6b7280;">Amount Paid:</td>
            <td style="padding: 10px 0; color: #111827; font-weight: 700;">₹${amountPaid.toLocaleString('en-IN')}</td>
          </tr>
          <tr style="border-bottom: 1px solid #f3f4f6;">
            <td style="padding: 10px 0; font-weight: 700; color: #6b7280;">Transaction ID:</td>
            <td style="padding: 10px 0; color: #4b5563; font-family: monospace;">${transactionId}</td>
          </tr>
        </table>

        <!-- Footer Banner CTA -->
        <div style="margin-top: 28px; padding: 16px; background-color: #ecfdf5; border-left: 4px solid #10b981; border-radius: 8px;">
          <p style="margin: 0; font-size: 13px; color: #065f46; font-weight: 600;">
            Log in to your hospital dashboard to view unlocked patient leads and start contacting patients immediately.
          </p>
        </div>
      </div>

      <!-- Footer Bar -->
      <div style="background-color: #f9fafb; padding: 16px; text-align: center; border-top: 1px solid #f3f4f6; font-size: 12px; color: #9ca3af;">
        Copyright © 2026 Clinic By Choice. All rights reserved.
      </div>
    </div>
  `;

  return sendEmail({
    bcc: allRecipients,
    subject: `Package Purchased (${leadCount} Leads): ${packageName} - ${hospitalName}`,
    html,
  });
}

/**
 * Send Patient Account Credentials & Welcome Email
 */
export async function sendPatientCredentialsEmail({
  patientName,
  email,
  password,
  hospitalName,
}: {
  patientName: string;
  email: string;
  password: string;
  hospitalName?: string;
}) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://clinicbychoice.com';
  const loginUrl = `${appUrl}/login?email=${encodeURIComponent(email)}`;
  const logoUrl = getLogoUrl();

  const html = `
    <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 0; border: 1px solid #e5e7eb; border-radius: 16px; overflow: hidden; background-color: #ffffff; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
      
      <!-- Header with Black Logo Badge -->
      <div style="background: linear-gradient(90deg, rgb(180 58 173) 0%, rgb(253 29 116) 50%, rgb(252 69 214) 100%); padding: 28px 24px; text-align: center;">
        <div style="background-color: rgba(255, 255, 255, 0.98); padding: 10px 22px; border-radius: 14px; display: inline-block; margin-bottom: 16px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);">
          <img src="${logoUrl}" alt="Clinic By Choice Logo" style="max-height: 48px; width: auto; display: block; margin: 0 auto;" />
        </div>
        <h2 style="color: #ffffff; margin: 0; font-size: 20px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px;">Welcome to Clinic By Choice</h2>
      </div>

      <!-- Main Email Content -->
      <div style="padding: 28px 24px; background-color: #ffffff;">
        <p style="font-size: 15px; color: #374151; margin-top: 0; line-height: 1.6;">
          Dear <strong>${patientName}</strong>,
        </p>
        <p style="font-size: 14px; color: #4b5563; line-height: 1.6;">
          Thank you for submitting your medical enquiry${hospitalName ? ` to <strong>${hospitalName}</strong>` : ''} on <strong>Clinic By Choice</strong>.
        </p>
        <p style="font-size: 14px; color: #4b5563; line-height: 1.6;">
          A dedicated account has been automatically created for you so you can securely track all your queries, receive updates from hospital coordinators, and manage your consultations in one place.
        </p>

        <!-- Credentials Box -->
        <div style="margin: 24px 0; padding: 20px; background-color: #fdf2f8; border: 1px solid #fbcfe8; border-radius: 12px;">
          <h4 style="margin: 0 0 12px 0; color: #be185d; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 800;">
            Your Login Credentials
          </h4>
          <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
            <tr>
              <td style="padding: 6px 0; font-weight: 700; color: #6b7280; width: 120px;">Email / User ID:</td>
              <td style="padding: 6px 0; color: #111827; font-weight: 700;">${email}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; font-weight: 700; color: #6b7280;">Password:</td>
              <td style="padding: 6px 0; color: #be185d; font-weight: 800; font-family: monospace; font-size: 16px;">${password}</td>
            </tr>
          </table>
        </div>

        <!-- Action Button -->
        <div style="text-align: center; margin: 28px 0 20px 0;">
          <a href="${loginUrl}" style="display: inline-block; background: linear-gradient(90deg, #fd1d74 0%, #b02151 100%); color: #ffffff; text-decoration: none; padding: 12px 32px; border-radius: 9999px; font-weight: 800; font-size: 14px; box-shadow: 0 4px 12px rgba(253, 29, 116, 0.3);">
            Log In to Your Account
          </a>
        </div>

        <p style="font-size: 12px; color: #9ca3af; text-align: center; margin-top: 16px; line-height: 1.5;">
          For security, you can change your password anytime after logging in.
        </p>
      </div>

      <!-- Footer Bar -->
      <div style="background-color: #f9fafb; padding: 16px; text-align: center; border-top: 1px solid #f3f4f6; font-size: 12px; color: #9ca3af;">
        Copyright © 2026 Clinic By Choice. All rights reserved.
      </div>
    </div>
  `;

  return sendEmail({
    to: email.trim(),
    subject: `Your Clinic By Choice Account Credentials & Enquiry Confirmation`,
    html,
  });
}

/**
 * Send Password Reset Email with New Temporary Password
 */
export async function sendPasswordResetEmail({
  name,
  email,
  newPassword,
}: {
  name: string;
  email: string;
  newPassword: string;
}) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://clinicbychoice.com';
  const loginUrl = `${appUrl}/login?email=${encodeURIComponent(email)}`;
  const logoUrl = getLogoUrl();

  const html = `
    <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 0; border: 1px solid #e5e7eb; border-radius: 16px; overflow: hidden; background-color: #ffffff; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
      
      <!-- Header with Black Logo Badge -->
      <div style="background: linear-gradient(90deg, rgb(180 58 173) 0%, rgb(253 29 116) 50%, rgb(252 69 214) 100%); padding: 28px 24px; text-align: center;">
        <div style="background-color: rgba(255, 255, 255, 0.98); padding: 10px 22px; border-radius: 14px; display: inline-block; margin-bottom: 16px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);">
          <img src="${logoUrl}" alt="Clinic By Choice Logo" style="max-height: 48px; width: auto; display: block; margin: 0 auto;" />
        </div>
        <h2 style="color: #ffffff; margin: 0; font-size: 20px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px;">Password Reset Request</h2>
      </div>

      <!-- Main Email Content -->
      <div style="padding: 28px 24px; background-color: #ffffff;">
        <p style="font-size: 15px; color: #374151; margin-top: 0; line-height: 1.6;">
          Dear <strong>${name || 'User'}</strong>,
        </p>
        <p style="font-size: 14px; color: #4b5563; line-height: 1.6;">
          We received a request to reset your password for your <strong>Clinic By Choice</strong> account.
        </p>
        <p style="font-size: 14px; color: #4b5563; line-height: 1.6;">
          A new temporary password has been generated for your account:
        </p>

        <!-- Credentials Box -->
        <div style="margin: 24px 0; padding: 20px; background-color: #fdf2f8; border: 1px solid #fbcfe8; border-radius: 12px;">
          <h4 style="margin: 0 0 12px 0; color: #be185d; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 800;">
            Your New Login Credentials
          </h4>
          <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
            <tr>
              <td style="padding: 6px 0; font-weight: 700; color: #6b7280; width: 120px;">Email / User ID:</td>
              <td style="padding: 6px 0; color: #111827; font-weight: 700;">${email}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; font-weight: 700; color: #6b7280;">New Password:</td>
              <td style="padding: 6px 0; color: #be185d; font-weight: 800; font-family: monospace; font-size: 16px;">${newPassword}</td>
            </tr>
          </table>
        </div>

        <!-- Action Button -->
        <div style="text-align: center; margin: 28px 0 20px 0;">
          <a href="${loginUrl}" style="display: inline-block; background: linear-gradient(90deg, #fd1d74 0%, #b02151 100%); color: #ffffff; text-decoration: none; padding: 12px 32px; border-radius: 9999px; font-weight: 800; font-size: 14px; box-shadow: 0 4px 12px rgba(253, 29, 116, 0.3);">
            Log In Now
          </a>
        </div>

        <p style="font-size: 12px; color: #9ca3af; text-align: center; margin-top: 16px; line-height: 1.5;">
          If you did not request this password reset, please contact support or log in immediately to secure your account.
        </p>
      </div>

      <!-- Footer Bar -->
      <div style="background-color: #f9fafb; padding: 16px; text-align: center; border-top: 1px solid #f3f4f6; font-size: 12px; color: #9ca3af;">
        Copyright © 2026 Clinic By Choice. All rights reserved.
      </div>
    </div>
  `;

  return sendEmail({
    to: email.trim(),
    subject: `Password Reset Request - Clinic By Choice`,
    html,
  });
}

