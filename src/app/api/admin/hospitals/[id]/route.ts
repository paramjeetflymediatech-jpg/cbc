import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';
import { Hospital, User, HospitalService, Lead, LeadTransaction, Notification } from '@/models';
import { cleanupOldImages } from '@/lib/fileCleanup';
import { ensureLocationMasterExists, isIndiaLocation } from '@/lib/locationMaster';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await getAuthUser();
    if (!authUser || (authUser.role !== 'SUPER_ADMIN' && authUser.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized admin access' }, { status: 403 });
    }

    await connectDB();
    const { id } = await params;
    const hospital = await Hospital.findByPk(Number(id));

    if (!hospital) {
      return NextResponse.json({ error: 'Hospital not found' }, { status: 404 });
    }

    return NextResponse.json({ hospital });
  } catch (error) {
    console.error('Get admin hospital error:', error);
    return NextResponse.json({ error: 'Server error fetching hospital.' }, { status: 500 });
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await getAuthUser();
    if (!authUser || (authUser.role !== 'SUPER_ADMIN' && authUser.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized admin access' }, { status: 403 });
    }

    await connectDB();
    const { id } = await params;
    const hospitalId = Number(id);

    const hospital = await Hospital.findByPk(hospitalId);
    if (!hospital) {
      return NextResponse.json({ error: 'Hospital not found' }, { status: 404 });
    }

    const body = await req.json();

    const {
      name,
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
      coverImage,
      gallery,
      contactPersonName,
      contactPersonEmail,
      contactPersonPhone,
      doctors,
      facilities,
      faqs,
      isNabhAccredited,
      isVerifiedPartner,
      googleRating,
      googleReviewsCount,
      rating,
      leadsRemaining,
      status,
      accountStatus,
    } = body;

    if (country && !isIndiaLocation(country)) {
      return NextResponse.json(
        { error: 'Only locations within India are allowed.' },
        { status: 400 }
      );
    }

    const updatedState = state || hospital.state;
    const updatedCity = city || hospital.city;
    const updatedDistrict = district !== undefined ? district : hospital.district;
    if (updatedState && updatedCity) {
      await ensureLocationMasterExists({ state: updatedState, district: updatedDistrict, city: updatedCity });
    }
    if (logo !== undefined && logo !== hospital.logo) {
      await cleanupOldImages(hospital.logo, logo);
    }
    if (coverImage !== undefined && coverImage !== hospital.coverImage) {
      await cleanupOldImages(hospital.coverImage, coverImage);
    }
    if (gallery !== undefined && Array.isArray(gallery)) {
      await cleanupOldImages(hospital.gallery, gallery);
    }

    await hospital.update({
      name: name ? name.trim() : hospital.name,
      email: email ? email.toLowerCase().trim() : hospital.email,
      phone: phone ? phone.trim() : hospital.phone,
      website: website !== undefined ? website : hospital.website,
      address: address ? address.trim() : hospital.address,
      city: city ? city.trim() : hospital.city,
      district: district !== undefined ? district : hospital.district,
      state: state !== undefined ? state : hospital.state,
      country: country !== undefined ? country : hospital.country,
      description: description ? description.trim() : hospital.description,
      logo: logo !== undefined ? logo : hospital.logo,
      coverImage: coverImage !== undefined ? coverImage : hospital.coverImage,
      gallery: gallery !== undefined ? gallery : hospital.gallery,
      contactPersonName: contactPersonName !== undefined ? contactPersonName : hospital.contactPersonName,
      contactPersonEmail: contactPersonEmail !== undefined ? contactPersonEmail : hospital.contactPersonEmail,
      contactPersonPhone: contactPersonPhone !== undefined ? contactPersonPhone : hospital.contactPersonPhone,
      doctors: doctors !== undefined ? doctors : hospital.doctors,
      facilities: facilities !== undefined ? facilities : hospital.facilities,
      faqs: faqs !== undefined ? faqs : hospital.faqs,
      isNabhAccredited: isNabhAccredited !== undefined ? Boolean(isNabhAccredited) : hospital.isNabhAccredited,
      isVerifiedPartner: isVerifiedPartner !== undefined ? Boolean(isVerifiedPartner) : hospital.isVerifiedPartner,
      googleRating: googleRating !== undefined ? Number(googleRating) : (hospital.googleRating || hospital.rating || 4.8),
      googleReviewsCount: googleReviewsCount !== undefined ? Number(googleReviewsCount) : hospital.googleReviewsCount,
      rating: googleRating !== undefined ? Number(googleRating) : (rating !== undefined ? Number(rating) : hospital.rating),
      leadsRemaining: leadsRemaining !== undefined ? Number(leadsRemaining) : hospital.leadsRemaining,
      status: status !== undefined ? status : hospital.status,
      accountStatus: accountStatus !== undefined ? accountStatus : hospital.accountStatus,
    });

    // Also sync email/name in User table if email or name changed
    if (email || name) {
      await User.update(
        {
          ...(email ? { email: email.toLowerCase().trim() } : {}),
          ...(name ? { name: name.trim() } : {}),
          ...(phone ? { phone: phone.trim() } : {}),
        },
        { where: { hospitalId } }
      );
    }

    return NextResponse.json({
      message: 'Hospital profile updated successfully by Super Admin.',
      hospital,
    });
  } catch (error) {
    console.error('Update admin hospital error:', error);
    return NextResponse.json({ error: 'Server error updating hospital profile.' }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await getAuthUser();
    if (!authUser || (authUser.role !== 'SUPER_ADMIN' && authUser.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized: Only Super Admin can delete hospitals.' }, { status: 403 });
    }

    await connectDB();
    const { id } = await params;
    const hospitalId = Number(id);

    const hospital = await Hospital.findByPk(hospitalId);
    if (!hospital) {
      return NextResponse.json({ error: 'Hospital not found' }, { status: 404 });
    }

    // Cascade purge associated records
    await User.destroy({ where: { hospitalId } });
    await HospitalService.destroy({ where: { hospitalId } });
    await Lead.destroy({ where: { hospitalId } });
    await LeadTransaction.destroy({ where: { hospitalId } });
    await Notification.destroy({ where: { recipientType: 'HOSPITAL', recipientId: hospitalId } });

    // Clean up local photo files
    await cleanupOldImages(hospital.logo, null);
    await cleanupOldImages(hospital.coverImage, null);
    await cleanupOldImages(hospital.gallery, null);

    // Permanently Delete Hospital Record
    await hospital.destroy();

    return NextResponse.json({
      message: `Hospital "${hospital.name}" and all associated leads and user accounts have been permanently deleted.`,
    });
  } catch (error) {
    console.error('Delete hospital error:', error);
    return NextResponse.json({ error: 'Server error deleting hospital.' }, { status: 500 });
  }
}
