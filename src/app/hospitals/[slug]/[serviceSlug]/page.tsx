import React from 'react';
import { notFound } from 'next/navigation';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import HospitalDetailClient from '../HospitalDetailClient';
import { connectDB } from '@/lib/db';
import { Hospital, Service, HospitalService } from '@/models';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ slug: string; serviceSlug: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { slug, serviceSlug } = await params;
  try {
    const db = await connectDB();
    if (!db) return { title: 'Clinic By Choice' };
    const hospital = await Hospital.findOne({ where: { slug: slug.toLowerCase() } });
    const service = await Service.findOne({ where: { slug: serviceSlug.toLowerCase() } });

    if (!hospital || !service) return { title: 'Clinic By Choice' };
    return {
      title: `${service.name} at ${hospital.name}, ${hospital.city} - Clinic By Choice`,
      description: `Book consultation for ${service.name} at ${hospital.name} in ${hospital.city}. Accredited healthcare facilities.`,
    };
  } catch {
    return { title: 'Clinic By Choice' };
  }
}

export default async function HospitalServiceDetailPage({ params }: PageProps) {
  const { slug, serviceSlug } = await params;
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

  const service = await Service.findOne({ where: { slug: serviceSlug.toLowerCase(), status: 'ACTIVE' } });

  if (!hospital || !service) {
    notFound();
  }

  const parsedHospital = JSON.parse(JSON.stringify(hospital));

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />
      <div className="bg-pink-50 text-gray-900 py-4 px-8 border-b border-pink-100">
        <div className="max-w-7xl mx-auto text-xs font-bold uppercase tracking-wider text-[#ec2c6c]">
          Selected Specialty Treatment: {service.name}
        </div>
      </div>
      <HospitalDetailClient hospital={parsedHospital} initialServiceId={service.id} />
      <Footer />
    </div>
  );
}
