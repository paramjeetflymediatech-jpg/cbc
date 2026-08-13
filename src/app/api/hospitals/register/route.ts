import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Hospital, User, HospitalService } from '@/models';
import { hashPassword } from '@/lib/auth';
import { sendHospitalRegistrationEmail } from '@/lib/mailer';
import { ensureLocationMasterExists, isIndiaLocation } from '@/lib/locationMaster';

export async function POST(req: Request) {
  try {
    await connectDB();
    const body = await req.json();

    const {
      hospitalName,
      email,
      phone,
      website,
      address,
      city,
      district,
      state,
      country,
      description,
      logo,
      gallery,
      contactPersonName,
      contactPersonEmail,
      contactPersonPhone,
      password,
      services, // array of serviceIds
    } = body;

    if (!hospitalName || !email || !phone || !address || !city || !description || !password) {
      return NextResponse.json(
        { error: 'Missing required hospital registration fields' },
        { status: 400 }
      );
    }

    if (!isIndiaLocation(country)) {
      return NextResponse.json(
        { error: 'Only locations within India are allowed for hospital registration.' },
        { status: 400 }
      );
    }

    // Auto-create missing State, District, and City in location master DB
    await ensureLocationMasterExists({ state: state || 'Maharashtra', district, city });

    // Check duplicate hospital email or user email
    const existingUser = await User.findOne({ where: { email: email.toLowerCase().trim() } });
    if (existingUser) {
      return NextResponse.json({ error: 'An account with this email already exists.' }, { status: 400 });
    }

    // Generate slug
    let baseSlug = hospitalName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
    if (!baseSlug) baseSlug = 'clinic';

    let slug = baseSlug;
    let count = 1;
    while (await Hospital.findOne({ where: { slug } })) {
      slug = `${baseSlug}-${count++}`;
    }

    const hospital = await Hospital.create({
      name: hospitalName,
      slug,
      email: email.toLowerCase().trim(),
      phone: phone.trim(),
      website: website ? website.trim() : null,
      address: address.trim(),
      city: city.trim(),
      district: district ? district.trim() : null,
      state: state ? state.trim() : 'India',
      country: country ? country.trim() : 'India',
      description: description.trim(),
      logo: logo || null,
      gallery: Array.isArray(gallery) ? gallery : [],
      contactPersonName: contactPersonName || null,
      contactPersonEmail: contactPersonEmail || null,
      contactPersonPhone: contactPersonPhone || null,
      status: 'PENDING',
      accountStatus: 'ACTIVE',
      leadsRemaining: 0,
      totalLeadsPurchased: 0,
      totalLeadsUsed: 0,
      doctors: [],
      facilities: [],
      faqs: [],
      rating: 4.8,
      isFeatured: false,
      isNabhAccredited: false,
      isVerifiedPartner: false,
    });

    const passHash = await hashPassword(password);
    await User.create({
      name: contactPersonName || hospitalName,
      email: email.toLowerCase().trim(),
      passwordHash: passHash,
      role: 'HOSPITAL',
      hospitalId: hospital.id,
      phone: phone.trim(),
      status: 'ACTIVE',
    });

    // Link selected services
    if (Array.isArray(services) && services.length > 0) {
      for (const serviceId of services) {
        await HospitalService.create({
          hospitalId: hospital.id,
          serviceId: Number(serviceId),
          status: 'ACTIVE',
        });
      }
    }

    // Trigger Nodemailer Email Notification (Asynchronous)
    sendHospitalRegistrationEmail({
      hospitalName: hospitalName.trim(),
      email: email.toLowerCase().trim(),
      phone: phone.trim(),
      city: city.trim(),
    }).catch((err) => console.error('[MAILER] Async hospital registration email failed:', err));

    return NextResponse.json(
      {
        message: 'Your registration has been submitted successfully. Our team will review your hospital information.',
        hospitalId: hospital.id,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Hospital registration error:', error);
    return NextResponse.json({ error: 'Server error during hospital registration' }, { status: 500 });
  }
}
