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
  const path = `/hospital/${slug.toLowerCase()}`;
  try {
    const db = await connectDB();
    if (!db) return { title: 'Clinic By Choice' };

    // Check custom SEO override first
    const { SeoMetadata } = await import('@/models/SeoMetadata');
    const customSeo = await SeoMetadata.findOne({ where: { path } });
    if (customSeo) {
      const { buildMetadataFromRecord } = await import('@/lib/seo');
      return buildMetadataFromRecord(customSeo);
    }

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
  const { getPageSchemaMarkup } = await import('@/lib/seo');
  const schemaMarkup = await getPageSchemaMarkup(`/hospital/${slug.toLowerCase()}`);
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

  const hospitalSchema = {
    "@context": "https://schema.org",
    "@type": "MedicalClinic",
    "name": hospital.name,
    "description": hospital.description?.substring(0, 200),
    "image": hospital.logo || hospital.coverImage ? [(hospital.logo || hospital.coverImage)] : [],
    "url": `https://clinicbychoice.com/hospital/${hospital.slug}`,
    "address": {
      "@type": "PostalAddress",
      "addressLocality": hospital.city || "",
      "addressCountry": "IN"
    },
    "medicalSpecialty": (hospital as any).hospitalServices?.map((hs: any) => hs.service?.name).filter(Boolean) || []
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(hospitalSchema) }} />
      <Header />
      <HospitalDetailClient hospital={parsedHospital} />
      <Footer />

      {schemaMarkup && (
        schemaMarkup.includes('<script') ? (
          <span dangerouslySetInnerHTML={{ __html: schemaMarkup }} />
        ) : (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: schemaMarkup }}
          />
        )
      )}
    </div>
  );
}
