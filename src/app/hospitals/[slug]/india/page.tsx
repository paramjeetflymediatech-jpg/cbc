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
import { Stethoscope, ChevronRight, Layers, HelpCircle } from 'lucide-react';

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

/**
 * Sanitizes rich text / HTML content before rendering.
 * Strips hardcoded inline heights and container constraints that get copied
 * from external page builders (like Elementor or WordPress).
 */
function cleanEditorHtml(html?: string): string {
  if (!html) return '';
  return html
    // Remove fixed inline heights (e.g., height: 51px; height: 110.391px;)
    .replace(/height\s*:\s*[\d.]+(?:px|rem|em|vh|pt);?/gi, '')
    // Remove hardcoded line-heights that conflict with responsive font sizes
    .replace(/line-height\s*:\s*[\d.]+(?:px|pt);?/gi, '')
    // Remove fixed container width overrides (e.g. width: 88%;)
    .replace(/width\s*:\s*\d+%;?/gi, '')
    .trim();
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
            if (!service.description) return null;
            const cleanedHtml = cleanEditorHtml(service.description);
            const hasText = cleanedHtml.replace(/<[^>]*>/g, '').trim().length > 0;
            if (!hasText) return null;

            return (
              <div className="bg-white rounded-3xl p-6 sm:p-10 lg:p-12 shadow-sm border border-gray-100 mt-12 w-full overflow-hidden">
                <article
                  className="prose prose-lg max-w-none text-gray-800 space-y-6 leading-relaxed font-normal
                    [&_*]:max-w-full [&_*]:break-words
                    [&_div]:h-auto! [&_div]:min-h-0! [&_div]:max-h-none! [&_div]:w-auto!
                    [&_h2]:text-2xl sm:[&_h2]:text-3xl [&_h2]:font-extrabold [&_h2]:text-[#101828] [&_h2]:mt-8 [&_h2]:mb-4 [&_h2]:border-b [&_h2]:border-pink-100 [&_h2]:pb-2.5
                    [&_h3]:text-xl sm:[&_h3]:text-2xl [&_h3]:font-bold [&_h3]:text-[#ec2c6c] [&_h3]:mt-6 [&_h3]:mb-3
                    [&_p]:text-gray-700 [&_p]:leading-relaxed [&_p]:text-base [&_p]:mb-4
                    [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:space-y-2 [&_ul]:mb-4 [&_li]:text-gray-700
                    [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:space-y-2 [&_ol]:mb-4
                    [&_blockquote]:border-l-4 [&_blockquote]:border-[#ec2c6c] [&_blockquote]:bg-pink-50/60 [&_blockquote]:p-4 [&_blockquote]:rounded-r-2xl [&_blockquote]:italic [&_blockquote]:font-medium [&_blockquote]:text-gray-800
                    [&_img]:max-w-full [&_img]:h-auto [&_img]:rounded-2xl [&_img]:my-6 [&_img]:shadow-md [&_img]:mx-auto [&_img]:block"
                  dangerouslySetInnerHTML={{ __html: cleanedHtml }}
                />
              </div>
            );
          })()}
          {/* Service FAQs Section */}
          {service.faqs && Array.isArray(service.faqs) && service.faqs.length > 0 && (
            <div className="bg-white rounded-3xl p-6 sm:p-10 lg:p-12 shadow-sm border border-gray-100 mt-12 w-full space-y-6">
              <div className="border-b border-gray-100 pb-4">
                <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-[#ec2c6c] mb-1">
                  <HelpCircle className="w-4 h-4" />
                  <span>Frequently Asked Questions</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-[#101828]">
                  FAQs about {service.name} Care & Treatments
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Common questions and answers regarding procedures, doctor consultation, and recovery.
                </p>
              </div>

              <div className="space-y-4">
                {service.faqs.map((faq: any, idx: number) => (
                  <details
                    key={idx}
                    className="group bg-gray-50/70 hover:bg-pink-50/40 rounded-2xl border border-gray-200/80 p-5 transition-all open:bg-white open:shadow-sm open:border-pink-200"
                  >
                    <summary className="font-extrabold text-sm sm:text-base text-gray-900 cursor-pointer list-none flex items-center justify-between gap-4 select-none">
                      <span className="flex items-center space-x-2.5">
                        <span className="text-[#ec2c6c] font-black text-xs sm:text-sm">Q{idx + 1}.</span>
                        <span>{faq.question}</span>
                      </span>
                      <span className="text-gray-400 group-open:rotate-180 group-open:text-[#ec2c6c] transition-transform flex-shrink-0 text-sm">
                        ▼
                      </span>
                    </summary>
                    <div className="mt-3.5 pt-3.5 border-t border-gray-100 text-sm text-gray-700 leading-relaxed pl-6 sm:pl-7">
                      {faq.answer}
                    </div>
                  </details>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />

      {/* SEO Schema Markup */}
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

      {/* FAQPage Structured Data Schema */}
      {service.faqs && Array.isArray(service.faqs) && service.faqs.length > 0 && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'FAQPage',
              mainEntity: service.faqs.map((f: any) => ({
                '@type': 'Question',
                name: f.question,
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: f.answer,
                },
              })),
            }),
          }}
        />
      )}
    </div>
  );
}
