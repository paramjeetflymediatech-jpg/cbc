import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';
import { Hospital } from '@/models';

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
    } = body;

    await hospital.update({
      name: name ? name.trim() : hospital.name,
      phone: phone ? phone.trim() : hospital.phone,
      website: website !== undefined ? website : hospital.website,
      address: address ? address.trim() : hospital.address,
      city: city ? city.trim() : hospital.city,
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
    });

    return NextResponse.json({ message: 'Profile updated successfully', hospital });
  } catch (error) {
    console.error('Hospital profile PUT error:', error);
    return NextResponse.json({ error: 'Server error updating profile' }, { status: 500 });
  }
}
