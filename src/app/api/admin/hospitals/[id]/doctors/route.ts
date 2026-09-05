import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';
import { Hospital, IDoctor } from '@/models';
import { cleanupOldImages } from '@/lib/fileCleanup';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await getAuthUser();
    if (!authUser || (authUser.role !== 'SUPER_ADMIN' && authUser.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized admin access' }, { status: 403 });
    }

    const { id } = await params;
    const hospitalId = Number(id);
    if (!hospitalId) {
      return NextResponse.json({ doctors: [] });
    }

    await connectDB();
    const hospital = await Hospital.findByPk(hospitalId);
    if (!hospital) {
      return NextResponse.json({ doctors: [] });
    }

    let docs = hospital.doctors;
    if (typeof docs === 'string') {
      try {
        docs = JSON.parse(docs);
      } catch {
        docs = [];
      }
    }

    return NextResponse.json({ doctors: Array.isArray(docs) ? docs : [] });
  } catch (error) {
    console.error('Super Admin GET hospital doctors error:', error);
    return NextResponse.json({ doctors: [] });
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await getAuthUser();
    if (!authUser || (authUser.role !== 'SUPER_ADMIN' && authUser.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized admin access' }, { status: 403 });
    }

    const { id } = await params;
    const hospitalId = Number(id);
    if (!hospitalId) {
      return NextResponse.json({ error: 'Invalid hospital ID' }, { status: 400 });
    }

    await connectDB();
    const hospital = await Hospital.findByPk(hospitalId);
    if (!hospital) {
      return NextResponse.json({ error: 'Hospital not found' }, { status: 404 });
    }

    const body = await req.json();
    const { name, qualification, specialty, experience, image, about, treatments, showOnHomepage, rating } = body;

    if (!name || !specialty) {
      return NextResponse.json({ error: 'Doctor Name and Specialty are required.' }, { status: 400 });
    }

    const currentDoctors: IDoctor[] = hospital.doctors || [];

    const parsedTreatments = Array.isArray(treatments)
      ? treatments.map((t: string) => String(t).trim()).filter(Boolean)
      : typeof treatments === 'string'
      ? treatments.split(',').map((t) => t.trim()).filter(Boolean)
      : [];

    const newDoctor: IDoctor = {
      name: name.trim(),
      specialty: specialty.trim(),
      qualification: qualification ? qualification.trim() : '',
      experience: experience ? experience.trim() : '',
      image: image || '',
      about: about ? about.trim() : '',
      treatments: parsedTreatments,
      showOnHomepage: Boolean(showOnHomepage),
      rating: rating !== undefined && rating !== '' ? Number(rating) : undefined,
    };

    const updatedDoctors = [...currentDoctors, newDoctor];

    await hospital.update({ doctors: updatedDoctors });

    return NextResponse.json(
      {
        message: 'Doctor added successfully',
        doctors: updatedDoctors,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Super Admin POST hospital doctor error:', error);
    return NextResponse.json({ error: 'Server error adding doctor' }, { status: 500 });
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

    const { id } = await params;
    const hospitalId = Number(id);
    if (!hospitalId) {
      return NextResponse.json({ error: 'Invalid hospital ID' }, { status: 400 });
    }

    await connectDB();
    const hospital = await Hospital.findByPk(hospitalId);
    if (!hospital) {
      return NextResponse.json({ error: 'Hospital not found' }, { status: 404 });
    }

    const body = await req.json();
    const { index, name, qualification, specialty, experience, image, about, treatments, showOnHomepage, rating } = body;

    if (index === undefined || index === null || typeof index !== 'number') {
      return NextResponse.json({ error: 'Doctor index is required.' }, { status: 400 });
    }

    const currentDoctors: IDoctor[] = [...(hospital.doctors || [])];

    if (index < 0 || index >= currentDoctors.length) {
      return NextResponse.json({ error: 'Invalid doctor index.' }, { status: 404 });
    }

    const oldDoctor = currentDoctors[index];

    // Cleanup old doctor image if replaced
    if (image !== undefined && image !== oldDoctor.image) {
      await cleanupOldImages(oldDoctor.image, image);
    }

    const parsedTreatments =
      treatments !== undefined
        ? Array.isArray(treatments)
          ? treatments.map((t: string) => String(t).trim()).filter(Boolean)
          : typeof treatments === 'string'
          ? treatments.split(',').map((t) => t.trim()).filter(Boolean)
          : []
        : oldDoctor.treatments;

    currentDoctors[index] = {
      name: name ? name.trim() : oldDoctor.name,
      specialty: specialty ? specialty.trim() : oldDoctor.specialty,
      qualification: qualification !== undefined ? qualification.trim() : oldDoctor.qualification,
      experience: experience !== undefined ? experience.trim() : oldDoctor.experience,
      image: image !== undefined ? image : oldDoctor.image,
      about: about !== undefined ? about.trim() : oldDoctor.about,
      treatments: parsedTreatments,
      showOnHomepage: showOnHomepage !== undefined ? Boolean(showOnHomepage) : oldDoctor.showOnHomepage,
      rating: rating !== undefined && rating !== '' ? Number(rating) : oldDoctor.rating,
      reviews: oldDoctor.reviews,
    };

    await hospital.update({ doctors: currentDoctors });

    return NextResponse.json({
      message: 'Doctor updated successfully',
      doctors: currentDoctors,
    });
  } catch (error) {
    console.error('Super Admin PUT hospital doctor error:', error);
    return NextResponse.json({ error: 'Server error updating doctor' }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await getAuthUser();
    if (!authUser || (authUser.role !== 'SUPER_ADMIN' && authUser.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized admin access' }, { status: 403 });
    }

    const { id } = await params;
    const hospitalId = Number(id);
    if (!hospitalId) {
      return NextResponse.json({ error: 'Invalid hospital ID' }, { status: 400 });
    }

    await connectDB();
    const hospital = await Hospital.findByPk(hospitalId);
    if (!hospital) {
      return NextResponse.json({ error: 'Hospital not found' }, { status: 404 });
    }

    const { searchParams } = new URL(req.url);
    const indexStr = searchParams.get('index');

    if (indexStr === null) {
      return NextResponse.json({ error: 'Doctor index is required.' }, { status: 400 });
    }

    const index = Number(indexStr);
    const currentDoctors: IDoctor[] = [...(hospital.doctors || [])];

    if (index < 0 || index >= currentDoctors.length) {
      return NextResponse.json({ error: 'Invalid doctor index.' }, { status: 404 });
    }

    const [deletedDoctor] = currentDoctors.splice(index, 1);

    if (deletedDoctor?.image) {
      await cleanupOldImages(deletedDoctor.image, null);
    }

    await hospital.update({ doctors: currentDoctors });

    return NextResponse.json({
      message: 'Doctor removed successfully',
      doctors: currentDoctors,
    });
  } catch (error) {
    console.error('Super Admin DELETE hospital doctor error:', error);
    return NextResponse.json({ error: 'Server error removing doctor' }, { status: 500 });
  }
}
