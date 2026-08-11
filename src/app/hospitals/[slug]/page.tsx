import React from 'react';
import { notFound } from 'next/navigation';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import HospitalDetailClient from './HospitalDetailClient';
import { connectDB } from '@/lib/db';
import { Hospital, Service, HospitalService } from '@/models';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  try {
    const db = await connectDB();
    if (!db) return { title: 'Clinic By Choice' };
    const hospital = await Hospital.findOne({ where: { slug: slug.toLowerCase() } });
    if (!hospital) return { title: 'Hospital Not Found - Clinic By Choice' };
    return {
      title: `${hospital.name}, ${hospital.city} - Clinic By Choice`,
      description: hospital.description.slice(0, 160),
    };
  } catch {
    return { title: 'Clinic By Choice' };
  }
}

export default async function HospitalDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const db = await connectDB();
  if (!db) notFound();

  const hospital = await Hospital.findOne({
    where: { slug: slug.toLowerCase(), status: 'APPROVED', accountStatus: 'ACTIVE' },
    include: [
      {
        model: HospitalService,
        as: 'hospitalServices',
        where: { status: 'ACTIVE' },
        required: false,
        include: [{ model: Service, as: 'service' }],
      },
    ],
  });

  if (!hospital) {
    notFound();
  }

  const parsedHospital = JSON.parse(JSON.stringify(hospital));

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />
      <HospitalDetailClient hospital={parsedHospital} />
      <Footer />
    </div>
  );
}
