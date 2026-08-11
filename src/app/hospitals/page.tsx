import React from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import HospitalCard from '@/components/ui/HospitalCard';
import FilterBar from '@/components/ui/FilterBar';
import { connectDB } from '@/lib/db';
import { Hospital, Service, HospitalService } from '@/models';
import { Op } from 'sequelize';

export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams: Promise<{ state?: string; city?: string; search?: string; service?: string }>;
}

const INDIAN_STATES = [
  'Maharashtra',
  'Delhi NCR',
  'Karnataka',
  'Tamil Nadu',
  'Telangana',
  'Gujarat',
  'Kerala',
  'West Bengal',
  'Punjab',
];

const INDIAN_CITIES = [
  'Mumbai',
  'Delhi',
  'Gurgaon',
  'Noida',
  'Bangalore',
  'Chennai',
  'Hyderabad',
  'Ahmedabad',
  'Kochi',
  'Kolkata',
  'Mohali',
];

export const metadata = {
  title: 'Approved Hospitals Directory - Clinic By Choice',
  description: 'Search top accredited hospitals and clinics in India by State, City, and Medical Specialty on Clinic By Choice.',
};

export default async function HospitalsPage({ searchParams }: PageProps) {
  const { state, city, search, service: serviceSlug } = await searchParams;
  const db = await connectDB();

  let parsedHospitals: any[] = [];
  let allServices: any[] = [];

  if (db) {
    const services = await Service.findAll({ where: { status: 'ACTIVE' }, order: [['name', 'ASC']] });
    allServices = JSON.parse(JSON.stringify(services));

    const whereCondition: any = {
      status: 'APPROVED',
      accountStatus: 'ACTIVE',
    };

    if (state && state.trim() !== '') {
      whereCondition.state = { [Op.like]: `%${state.trim()}%` };
    }

    if (city && city.trim() !== '') {
      whereCondition.city = { [Op.like]: `%${city.trim()}%` };
    }

    if (search && search.trim() !== '') {
      whereCondition[Op.or] = [
        { name: { [Op.like]: `%${search.trim()}%` } },
        { city: { [Op.like]: `%${search.trim()}%` } },
        { description: { [Op.like]: `%${search.trim()}%` } },
      ];
    }

    let hospitalInclude: any[] = [
      {
        model: HospitalService,
        as: 'hospitalServices',
        where: { status: 'ACTIVE' },
        required: false,
        include: [{ model: Service, as: 'service', attributes: ['name', 'slug'] }],
      },
    ];

    if (serviceSlug && serviceSlug.trim() !== '') {
      const targetService = await Service.findOne({ where: { slug: serviceSlug.trim(), status: 'ACTIVE' } });
      if (targetService) {
        hospitalInclude = [
          {
            model: HospitalService,
            as: 'hospitalServices',
            where: { serviceId: targetService.id, status: 'ACTIVE' },
            required: true,
            include: [{ model: Service, as: 'service', attributes: ['name', 'slug'] }],
          },
        ];
      }
    }

    const hospitals = await Hospital.findAll({
      where: whereCondition,
      include: hospitalInclude,
      order: [['isFeatured', 'DESC'], ['rating', 'DESC'], ['createdAt', 'DESC']],
    });

    parsedHospitals = JSON.parse(JSON.stringify(hospitals));
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />

      <div className="bg-[#101828] text-white py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
          <span className="text-xs font-bold uppercase tracking-wider text-[#ec2c6c] bg-pink-500/10 px-3 py-1 rounded-full border border-pink-500/20">
            Marketplace Directory
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold">Find Accredited Hospitals & Clinics</h1>

          {/* Instant Auto-Submit FilterBar onSelect */}
          <FilterBar
            basePath="/hospitals"
            states={INDIAN_STATES}
            cities={INDIAN_CITIES}
            services={allServices}
            currentState={state || ''}
            currentCity={city || ''}
            currentSearch={search || ''}
            currentService={serviceSlug || ''}
            showSpecialtySelect={true}
          />
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex-1">
        <div className="space-y-6">
          <div className="flex justify-between items-center border-b border-gray-100 pb-3">
            <p className="text-sm font-semibold text-gray-600">
              Found <strong className="text-gray-900">{parsedHospitals.length}</strong> verified hospital(s)
            </p>
            {(state || city || search || serviceSlug) && (
              <a href="/hospitals" className="text-xs font-bold text-[#ec2c6c] hover:underline">
                Clear Filters
              </a>
            )}
          </div>

          {parsedHospitals.length > 0 ? (
            parsedHospitals.map((h: any) => <HospitalCard key={h.id} hospital={h} />)
          ) : (
            <div className="text-center py-16 bg-gray-50 rounded-2xl space-y-3 border border-dashed border-gray-200">
              <h3 className="text-lg font-bold text-gray-800">No Hospitals Found</h3>
              <p className="text-sm text-gray-500 max-w-md mx-auto">
                No active hospitals matched your selected state, city, or specialty filters. Try selecting a different option in the dropdown filters above.
              </p>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
