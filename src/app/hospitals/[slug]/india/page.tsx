import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import HospitalCard from '@/components/ui/HospitalCard';
import FilterBar from '@/components/ui/FilterBar';
import { connectDB } from '@/lib/db';
import { Service, Hospital, HospitalService } from '@/models';
import { Op } from 'sequelize';
import { Stethoscope, ChevronRight, Layers } from 'lucide-react';

import { getLocationsData } from '@/lib/locations';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ state?: string; district?: string; city?: string; search?: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const path = `/hospitals/${slug.toLowerCase()}/india`;
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

function parseAlternatingSections(html: string) {
  if (!html) return null;

  const imgRegex = /<img\b([^>]*)>/gi;
  const sections: { text: string; imgAttrsStr: string | null }[] = [];
  
  let lastIndex = 0;
  let match;
  
  while ((match = imgRegex.exec(html)) !== null) {
    const textBlock = html.substring(lastIndex, match.index).trim();
    const imgAttrsStr = match[1];
    
    sections.push({
      text: textBlock,
      imgAttrsStr: imgAttrsStr,
    });
    
    lastIndex = imgRegex.lastIndex;
  }
  
  const remainingText = html.substring(lastIndex).trim();
  if (remainingText || sections.length === 0) {
    sections.push({
      text: remainingText,
      imgAttrsStr: null,
    });
  }
  
  return sections;
}

export default async function ServiceDetailPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const { state, district, city, search } = await searchParams;

  const db = await connectDB();
  const { getPageSchemaMarkup } = await import('@/lib/seo');
  const schemaMarkup = await getPageSchemaMarkup(`/hospitals/${slug.toLowerCase()}/india`);
  if (!db) notFound();

  const { states, districts, cities, locationsMap, stateDistrictMap, districtCityMap } = await getLocationsData();

  const service = await Service.findOne({
    where: { slug: slug.toLowerCase(), status: 'ACTIVE' },
    include: [
      {
        model: Service,
        as: 'parent',
        required: false,
      },
      {
        model: Service,
        as: 'subServices',
        where: { status: 'ACTIVE' },
        required: false,
      },
    ],
  });

  if (!service) {
    notFound();
  }

  const subServices = service.subServices || [];
  const parentService = service.parent;

  // Determine target service IDs to query hospitals
  const targetServiceIds: number[] = [service.id];
  if (subServices.length > 0) {
    subServices.forEach((sub) => targetServiceIds.push(sub.id));
  } else if (service.parentId) {
    targetServiceIds.push(service.parentId);
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

  // Find hospitals offering this service or related subservices/parent service
  const hospitalServices = await HospitalService.findAll({
    where: { serviceId: { [Op.in]: targetServiceIds }, status: 'ACTIVE' },
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

  // Deduplicate hospitals by ID
  const uniqueHospitalsMap = new Map<number, any>();
  hospitalServices.forEach((hs: any) => {
    if (hs.hospital && !uniqueHospitalsMap.has(hs.hospital.id)) {
      uniqueHospitalsMap.set(hs.hospital.id, hs.hospital);
    }
  });

  const hospitals = Array.from(uniqueHospitalsMap.values());

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />

      {/* Header Banner */}
      <div className="bg-[#101828] text-white py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
          {/* Breadcrumb if parent service exists */}
          {parentService && (
            <nav className="flex items-center space-x-2 text-xs font-semibold text-pink-300 mb-2">
              <Link href="/service" className="hover:underline">
                Services
              </Link>
              <ChevronRight className="w-3.5 h-3.5" />
              <Link href={`/hospitals/${parentService.slug}/india`} className="hover:underline">
                {parentService.name}
              </Link>
              <ChevronRight className="w-3.5 h-3.5" />
              <span className="text-white">{service.name}</span>
            </nav>
          )}

          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#ec2c6c] bg-pink-500/10 px-3 py-1 rounded-full border border-pink-500/20">
              {service.category || 'Specialty Care'}
            </span>
            {parentService && (
              <span className="text-xs font-bold uppercase tracking-wider text-amber-300 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
                Sub-Service
              </span>
            )}
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold">{service.name} Hospitals & Clinics</h1>
          <p className="text-gray-300 text-sm max-w-3xl leading-relaxed">
            {service.shortDescription || `Find top accredited hospitals in India offering specialized ${service.name} care.`}
          </p>

          {/* Sub-Services Cards / Pills section if main service has sub-services */}
          {subServices.length > 0 && (
            <div className="pt-4 border-t border-gray-800 space-y-3">
              <div className="flex items-center space-x-2 text-xs font-bold uppercase text-pink-400 tracking-wider">
                <Layers className="w-4 h-4" />
                <span>Specialized Sub-Services & Treatments ({subServices.length})</span>
              </div>

              <div className="flex flex-wrap gap-2.5">
                {subServices.map((sub: any) => (
                  <Link
                    key={sub.id}
                    href={`/hospitals/${sub.slug}/india`}
                    className="inline-flex items-center space-x-1.5 bg-white/10 hover:bg-[#fd1d74] text-white text-xs font-bold px-3.5 py-2 rounded-xl border border-white/20 transition-all hover:scale-105 shadow-xs"
                  >
                    <span>{sub.name}</span>
                    <ChevronRight className="w-3.5 h-3.5 text-pink-300" />
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Instant Auto-Submit FilterBar onSelect */}
          <FilterBar
            basePath={`/hospitals/${service.slug}/india`}
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
                href={`/hospitals/${service.slug}/india`}
                className="text-xs font-bold text-[#ec2c6c] hover:underline"
              >
                Clear Filters
              </a>
            )}
          </div>

          {hospitals.length > 0 ? (
            hospitals.map((h: any) => (
              <HospitalCard key={h.id} hospital={JSON.parse(JSON.stringify(h))} defaultServiceId={service.id} />
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

          {/* Service Full Description Content Section */}
          {(() => {
            const sections = parseAlternatingSections(service.description || '');
            if (!sections) return null;

            return (
              <div className="space-y-12 mt-12 w-full">
                {sections.map((section, idx) => {
                  const isEven = idx % 2 === 0;

                  // If there is no image in this section, render it full width
                  if (!section.imgAttrsStr) {
                    // Check if the text is actually empty to prevent rendering empty boxes
                    const hasText = section.text.replace(/<[^>]*>/g, '').trim().length > 0;
                    if (!hasText) return null;

                    return (
                      <div key={idx} className="bg-white rounded-3xl p-6 sm:p-10 shadow-md border border-gray-100 w-full">
                        <article
                          className="prose prose-lg max-w-none text-gray-800 space-y-6 leading-relaxed font-normal
                            [&_h2]:text-2xl [&_h2]:font-extrabold [&_h2]:text-gray-900 [&_h2]:mt-6 [&_h2]:mb-4 [&_h2]:border-b [&_h2]:border-pink-100 [&_h2]:pb-2 [&_h2]:text-[#101828]
                            [&_h3]:text-xl [&_h3]:font-bold [&_h3]:text-[#ec2c6c] [&_h3]:mt-5 [&_h3]:mb-3
                            [&_p]:text-gray-700 [&_p]:leading-relaxed [&_p]:text-[#344054]
                            [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:space-y-2 [&_li]:text-gray-700
                            [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:space-y-2"
                          dangerouslySetInnerHTML={{ __html: section.text }}
                        />
                      </div>
                    );
                  }

                  // Parse image src and alt attributes
                  const srcMatch = /src\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i.exec(section.imgAttrsStr);
                  const src = srcMatch ? (srcMatch[1] ?? srcMatch[2] ?? srcMatch[3]) : '';
                  const altMatch = /alt\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i.exec(section.imgAttrsStr);
                  const alt = altMatch ? (altMatch[1] ?? altMatch[2] ?? altMatch[3]) : '';

                  const hasText = section.text.replace(/<[^>]*>/g, '').trim().length > 0;

                  return (
                    <div
                      key={idx}
                      className="bg-white rounded-3xl p-6 sm:p-10 shadow-md border border-gray-100 w-full grid grid-cols-1 lg:grid-cols-12 gap-10 items-center"
                    >
                      {/* Image Column (col-span-5) */}
                      {src && (
                        <div
                          className={`lg:col-span-5 relative min-h-[320px] lg:min-h-[420px] rounded-2xl overflow-hidden bg-gray-50 flex items-center justify-center ${
                            isEven ? 'lg:order-first' : 'lg:order-last'
                          }`}
                        >
                          <img
                            src={src}
                            alt={alt || 'Service illustration'}
                            className="w-full h-full object-contain absolute inset-0 p-2"
                          />
                        </div>
                      )}

                      {/* Text Column (col-span-7) */}
                      <div
                        className={`flex flex-col justify-center ${
                          src ? 'lg:col-span-7' : 'lg:col-span-12'
                        }`}
                      >
                        {hasText ? (
                          <article
                            className="prose prose-lg max-w-none text-gray-800 space-y-6 leading-relaxed font-normal
                              [&_h2]:text-2xl [&_h2]:font-extrabold [&_h2]:text-gray-900 [&_h2]:mt-6 [&_h2]:mb-4 [&_h2]:border-b [&_h2]:border-pink-100 [&_h2]:pb-2 [&_h2]:text-[#101828]
                              [&_h3]:text-xl [&_h3]:font-bold [&_h3]:text-[#ec2c6c] [&_h3]:mt-5 [&_h3]:mb-3
                              [&_p]:text-gray-700 [&_p]:leading-relaxed [&_p]:text-[#344054]
                              [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:space-y-2 [&_li]:text-gray-700
                              [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:space-y-2"
                            dangerouslySetInnerHTML={{ __html: section.text }}
                          />
                        ) : (
                          <div className="text-gray-400 italic text-sm">
                            Platform details.
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>
      </main>

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
