import React from 'react';
import { notFound } from 'next/navigation';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import HospitalCard from '@/components/ui/HospitalCard';
import FilterBar from '@/components/ui/FilterBar';
import { connectDB } from '@/lib/db';
import { Service, Hospital, HospitalService } from '@/models';
import { Op } from 'sequelize';
import { Stethoscope } from 'lucide-react';

import { getLocationsData } from '@/lib/locations';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ state?: string; district?: string; city?: string; search?: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  try {
    const db = await connectDB();
    if (!db) return { title: 'Clinic By Choice' };
    const service = await Service.findOne({ where: { slug: slug.toLowerCase() } });
    if (!service) return { title: 'Service Not Found - Clinic By Choice' };
    return {
      title: service.seoTitle || `${service.name} Hospitals & Doctors in India - Clinic By Choice`,
      description: service.seoDescription || `Find top accredited hospitals offering ${service.name} treatments in India.`,
    };
  } catch {
    return { title: 'Clinic By Choice' };
  }
}

export default async function ServiceDetailPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const { state, district, city, search } = await searchParams;

  const db = await connectDB();
  if (!db) notFound();

  const { states, districts, cities, locationsMap, stateDistrictMap, districtCityMap } = await getLocationsData();

  const service = await Service.findOne({
    where: { slug: slug.toLowerCase(), status: 'ACTIVE' },
  });

  if (!service) {
    notFound();
  }

  // Filter hospital condition
  const hospitalWhere: any = {
    status: 'APPROVED',
    accountStatus: 'ACTIVE',
  };

  if (state && state.trim() !== '') {
    hospitalWhere.state = { [Op.like]: `%${state.trim()}%` };
  }

  if (district && district.trim() !== '') {
    hospitalWhere[Op.or] = [
      { district: { [Op.like]: `%${district.trim()}%` } },
      { city: { [Op.like]: `%${district.trim()}%` } },
    ];
  }

  if (city && city.trim() !== '') {
    hospitalWhere.city = { [Op.like]: `%${city.trim()}%` };
  }

  if (search && search.trim() !== '') {
    hospitalWhere[Op.or] = [
      { name: { [Op.like]: `%${search.trim()}%` } },
      { city: { [Op.like]: `%${search.trim()}%` } },
      { description: { [Op.like]: `%${search.trim()}%` } },
    ];
  }

  // Find only hospitals offering this specific service
  const hospitalServices = await HospitalService.findAll({
    where: { serviceId: service.id, status: 'ACTIVE' },
    include: [
      {
        model: Hospital,
        as: 'hospital',
        where: hospitalWhere,
        include: [
          {
            model: HospitalService,
            as: 'hospitalServices',
            where: { status: 'ACTIVE' },
            required: false,
            include: [{ model: Service, as: 'service', attributes: ['name', 'slug'] }],
          },
        ],
      },
    ],
  });

  const hospitals = hospitalServices
    .map((hs: any) => hs.hospital)
    .filter(Boolean);

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />

      {/* Header Banner */}
      <div className="bg-[#101828] text-white py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
          <span className="text-xs font-bold uppercase tracking-wider text-[#ec2c6c] bg-pink-500/10 px-3 py-1 rounded-full border border-pink-500/20">
            {service.category || 'Specialty Care'}
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold">{service.name} Hospitals & Clinics</h1>
          <p className="text-gray-300 text-sm max-w-3xl leading-relaxed">
            {service.description || service.shortDescription || `Find top accredited hospitals in India offering specialized ${service.name} care.`}
          </p>

          {/* Instant Auto-Submit FilterBar onSelect */}
          <FilterBar
            basePath={`/services/${service.slug}`}
            states={states}
            districts={districts}
            cities={cities}
            locationsMap={locationsMap}
            stateDistrictMap={stateDistrictMap}
            districtCityMap={districtCityMap}
            currentState={state || ''}
            currentDistrict={district || ''}
            currentCity={city || ''}
            currentSearch={search || ''}
          />
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 flex-1">
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-gray-100 pb-4">
            <h2 className="text-xl font-bold text-gray-900">
              Showing {hospitals.length} Verified Hospital(s) offering {service.name}
            </h2>
            {(state || city || search) && (
              <a
                href={`/services/${service.slug}`}
                className="text-xs font-bold text-[#ec2c6c] hover:underline"
              >
                Clear Filters
              </a>
            )}
          </div>

          {hospitals.length > 0 ? (
            hospitals.map((h: any) => (
              <HospitalCard key={h.id} hospital={JSON.parse(JSON.stringify(h))} />
            ))
          ) : (
            <div className="text-center py-16 bg-gray-50 rounded-2xl space-y-3 border border-dashed border-gray-200">
              <Stethoscope className="w-12 h-12 text-gray-400 mx-auto" />
              <h3 className="text-lg font-bold text-gray-800">No Hospitals Found Matching Criteria</h3>
              <p className="text-sm text-gray-500 max-w-md mx-auto">
                No active hospitals offering <strong>{service.name}</strong> were found in the selected location. Try selecting a different State or City in the filter above.
              </p>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
