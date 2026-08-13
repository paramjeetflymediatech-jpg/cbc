import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';
import { Hospital } from '@/models';

import { cleanupOldImages } from '@/lib/fileCleanup';
import { ensureLocationMasterExists, isIndiaLocation } from '@/lib/locationMaster';

export async function GET() {
  try {
    const authUser = await getAuthUser();
    if (!authUser || authUser.role !== 'HOSPITAL' || !authUser.hospitalId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const hospital = await Hospital.findByPk(authUser.hospitalId);
    if (!hospital) {
      return NextResponse.json({ error: 'Hospital not found' }, { status: 404 });
    }

    return NextResponse.json({ hospital });
  } catch (error) {
    console.error('Hospital profile GET error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const authUser = await getAuthUser();
    if (!authUser || authUser.role !== 'HOSPITAL' || !authUser.hospitalId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const body = await req.json();

    const hospital = await Hospital.findByPk(authUser.hospitalId);
    if (!hospital) {
      return NextResponse.json({ error: 'Hospital not found' }, { status: 404 });
    }

    const {
      name,
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
      googlePlaceId,
      rating,
    } = body;

    if (country && !isIndiaLocation(country)) {
      return NextResponse.json(
        { error: 'Only locations within India are allowed for hospital profiles.' },
        { status: 400 }
      );
    }

    // Auto-create missing State, District, and City in location master DB if location updated
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
      googlePlaceId: googlePlaceId !== undefined ? (googlePlaceId ? String(googlePlaceId).trim() : null) : hospital.googlePlaceId,
      rating: googleRating !== undefined ? Number(googleRating) : (rating !== undefined ? Number(rating) : hospital.rating),
    });

    return NextResponse.json({ message: 'Profile updated successfully', hospital });
  } catch (error) {
    console.error('Hospital profile PUT error:', error);
    return NextResponse.json({ error: 'Server error updating profile' }, { status: 500 });
  }
}
