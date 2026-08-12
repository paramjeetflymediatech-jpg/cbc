import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Hospital, IDoctor, IDoctorReview } from '@/models';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { hospitalId, doctorName, patientName, rating, comment } = body;

    if (!hospitalId || !doctorName || !patientName || !rating || !comment) {
      return NextResponse.json(
        { error: 'Hospital, doctor name, patient name, rating, and comment are required' },
        { status: 400 }
      );
    }

    await connectDB();

    const hospital = await Hospital.findByPk(hospitalId);
    if (!hospital) {
      return NextResponse.json({ error: 'Hospital not found' }, { status: 404 });
    }

    const doctors: IDoctor[] = JSON.parse(JSON.stringify(hospital.doctors || []));
    const doctorIndex = doctors.findIndex((d) => d.name.toLowerCase().trim() === doctorName.toLowerCase().trim());

    if (doctorIndex === -1) {
      return NextResponse.json({ error: 'Doctor not found at this hospital' }, { status: 404 });
    }

    const newReview: IDoctorReview = {
      id: `rev-${Date.now()}`,
      patientName: patientName.trim(),
      rating: Number(rating),
      comment: comment.trim(),
      date: new Date().toISOString(),
    };

    const currentReviews = doctors[doctorIndex].reviews || [];
    const updatedReviews = [newReview, ...currentReviews];

    // Compute average rating for doctor
    const totalRating = updatedReviews.reduce((sum, r) => sum + (r.rating || 5), 0);
    const avgRating = Math.round((totalRating / updatedReviews.length) * 10) / 10;

    doctors[doctorIndex].reviews = updatedReviews;
    doctors[doctorIndex].rating = avgRating;

    await hospital.update({ doctors });

    return NextResponse.json({
      message: 'Review submitted successfully',
      updatedDoctor: doctors[doctorIndex],
      doctors,
    });
  } catch (error) {
    console.error('Doctor review submission error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
