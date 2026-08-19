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
import {
  Stethoscope,
  ChevronRight,
  Layers,
  HelpCircle,
  MapPin,
  Building2,
  ShieldCheck,
  PhoneCall,
  CheckCircle,
} from 'lucide-react';
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
    if (!db) return { title: 'Clinic By Choice - Hospitals' };

    // Check custom SEO override
    const { SeoMetadata } = await import('@/models/SeoMetadata');
    const customSeo = await SeoMetadata.findOne({ where: { path } });
    if (customSeo) {
      const { buildMetadataFromRecord } = await import('@/lib/seo');
      return buildMetadataFromRecord(customSeo);
    }

    const service = await Service.findOne({ where: { slug: slug.toLowerCase() } });
    if (!service) return { title: 'Hospitals | Clinic By Choice' };

    const title = service.seoTitle || `${service.name} Hospitals & Clinics in India | Clinic By Choice`;
    const description =
      service.seoDescription ||
      `Find top accredited hospitals in India offering specialized ${service.name} care. Compare facilities, check doctor profiles, and get free medical second opinions.`;

    return {
      title,
      description,
      keywords: `${service.name.toLowerCase()} hospital india, best ${service.name.toLowerCase()} clinic, doctors in india`,
      alternates: {
        canonical: `https://clinicbychoice.com/hospitals/${service.slug.toLowerCase()}/india`,
      },
      openGraph: {
        title,
        description,
        url: `https://clinicbychoice.com/hospitals/${service.slug.toLowerCase()}/india`,
      },
    };
  } catch {
    return { title: 'Hospitals | Clinic By Choice' };
  }
}

/**
 * Sanitizes rich text / HTML content before rendering.
 */
function cleanEditorHtml(html?: string): string {
  if (!html) return '';
  return html
    .replace(/height\s*:\s*[\d.]+(?:px|rem|em|vh|pt);?/gi, '')
    .replace(/line-height\s*:\s*[\d.]+(?:px|pt);?/gi, '')
    .replace(/width\s*:\s*\d+%;?/gi, '')
    .trim();
}

export default async function ServiceHospitalsIndiaPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const { state, district, city, search } = await searchParams;

  const db = await connectDB();
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

  // Target service IDs for query
  const targetServiceIds: number[] = [service.id];
  if (subServices.length > 0) {
    subServices.forEach((sub) => targetServiceIds.push(sub.id));
  } else if (service.parentId) {
    targetServiceIds.push(service.parentId);
  }

  // 1. Query ALL active hospitals offering this service across India to calculate available cities and hospital counts
  const allHospitalsForService = await HospitalService.findAll({
    where: { serviceId: { [Op.in]: targetServiceIds }, status: 'ACTIVE' },
    include: [
      {
        model: Hospital,
        as: 'hospital',
        where: {
          status: 'APPROVED',
          accountStatus: 'ACTIVE',
        },
        attributes: ['id', 'name', 'city', 'state', 'district'],
      },
    ],
  });

  // Calculate unique hospitals and count only for cities that actually have hospitals
  const cityCountMap = new Map<string, { cityName: string; citySlug: string; stateName?: string; count: number }>();
  const seenAllIndiaIds = new Set<number>();

  allHospitalsForService.forEach((hs: any) => {
    const h = hs.hospital;
    if (h && !seenAllIndiaIds.has(h.id)) {
      seenAllIndiaIds.add(h.id);
      if (h.city && h.city.trim() !== '') {
        const rawCity = h.city.trim();
        const cSlug = rawCity.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        if (!cityCountMap.has(cSlug)) {
          cityCountMap.set(cSlug, {
            cityName: rawCity,
            citySlug: cSlug,
            stateName: h.state,
            count: 1,
          });
        } else {
          cityCountMap.get(cSlug)!.count += 1;
        }
      }
    }
  });

  const availableCities = Array.from(cityCountMap.values()).sort((a, b) => b.count - a.count);
  const totalAllIndiaHospitals = seenAllIndiaIds.size;

  // 2. Filter conditions based on user search parameters
  const hospitalWhere: any = {
    status: 'APPROVED',
    accountStatus: 'ACTIVE',
  };

  if (state && state.trim() !== '') {
    hospitalWhere.state = { [Op.like]: `%${state.trim()}%` };
  }
  if (district && district.trim() !== '') {
    hospitalWhere.district = { [Op.like]: `%${district.trim()}%` };
  }
  if (city && city.trim() !== '') {
    hospitalWhere.city = { [Op.like]: `%${city.trim()}%` };
  }
  if (search && search.trim() !== '') {
    hospitalWhere[Op.and] = [
      {
        [Op.or]: [
          { name: { [Op.like]: `%${search.trim()}%` } },
          { description: { [Op.like]: `%${search.trim()}%` } },
        ],
      },
    ];
  }

  // Query filtered hospitals
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
      <div className="bg-[#101828] text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
          {/* Breadcrumb if parent service exists */}
          {parentService && (
            <nav className="flex items-center space-x-2 text-xs font-semibold text-pink-300">
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

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white leading-tight">
            {service.name} Hospitals in India
          </h1>
          <p className="text-gray-300 text-sm sm:text-base max-w-3xl leading-relaxed font-medium">
            {service.shortDescription ||
              `Find top accredited hospitals in India offering specialized ${service.name} care. Compare facilities and book appointments.`}
          </p>

          {/* Sub-Services Pills section if main service has sub-services */}
          {subServices.length > 0 && (
            <div className="pt-2 border-t border-gray-800 space-y-2">
              <div className="flex items-center space-x-2 text-xs font-bold uppercase text-pink-400 tracking-wider">
                <Layers className="w-3.5 h-3.5" />
                <span>Specialized Sub-Services ({subServices.length}):</span>
              </div>

              <div className="flex flex-wrap gap-2">
                {subServices.map((sub: any) => (
                  <Link
                    key={sub.id}
                    href={`/hospitals/${sub.slug}/india`}
                    className="inline-flex items-center space-x-1.5 bg-white/10 hover:bg-[#fd1d74] text-white text-xs font-bold px-3 py-1.5 rounded-full border border-white/15 transition-all hover:scale-105"
                  >
                    <span>{sub.name}</span>
                    <ChevronRight className="w-3 h-3 text-pink-300" />
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

      {/* Main 2-Column Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-1 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* LEFT COLUMN: Hospitals List, Description & FAQs (8 Columns) */}
          <div className="lg:col-span-8 space-y-8">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <h2 className="text-xl font-black text-gray-900">
                  Showing {hospitals.length} Verified Hospital(s) offering {service.name}
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Accredited medical centers with senior consultants across India
                </p>
              </div>
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
              <div className="space-y-6">
                {hospitals.map((h: any) => (
                  <HospitalCard key={h.id} hospital={JSON.parse(JSON.stringify(h))} defaultServiceId={service.id} />
                ))}
              </div>
            ) : (
              <div className="text-center py-16 bg-gray-50 rounded-3xl space-y-3 border border-dashed border-gray-200 p-8">
                <Stethoscope className="w-12 h-12 text-gray-400 mx-auto" />
                <h3 className="text-lg font-bold text-gray-800">No Hospitals Found Matching Criteria</h3>
                <p className="text-sm text-gray-500 max-w-md mx-auto">
                  No active hospitals offering <strong>{service.name}</strong> were found matching your current filter. Try selecting All India or another city from the right sidebar.
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
                <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xs border border-gray-100 space-y-4">
                  <h3 className="text-xl font-black text-gray-900">
                    Comprehensive {service.name} Clinical Guide
                  </h3>
                  <article
                    className="prose prose-lg max-w-none text-gray-800 space-y-4 leading-relaxed font-normal
                      [&_*]:max-w-full [&_*]:break-words
                      [&_h2]:text-2xl sm:[&_h2]:text-3xl [&_h2]:font-extrabold [&_h2]:text-[#101828] [&_h2]:mt-6 [&_h2]:mb-3
                      [&_h3]:text-lg sm:[&_h3]:text-xl [&_h3]:font-bold [&_h3]:text-[#ec2c6c] [&_h3]:mt-4 [&_h3]:mb-2
                      [&_p]:text-gray-700 [&_p]:leading-relaxed [&_p]:text-base [&_p]:mb-3
                      [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:space-y-1.5 [&_ul]:mb-3 [&_li]:text-gray-700
                      [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:space-y-1.5 [&_ol]:mb-3"
                    dangerouslySetInnerHTML={{ __html: cleanedHtml }}
                  />
                </div>
              );
            })()}

            {/* Service FAQs Section */}
            {service.faqs && Array.isArray(service.faqs) && service.faqs.length > 0 && (
              <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xs border border-gray-100 space-y-4">
                <div className="border-b border-gray-100 pb-3">
                  <div className="flex items-center space-x-1.5 text-xs font-bold uppercase tracking-wider text-[#ec2c6c] mb-1">
                    <HelpCircle className="w-4 h-4" />
                    <span>Frequently Asked Questions</span>
                  </div>
                  <h3 className="text-xl font-black text-[#101828]">
                    FAQs about {service.name} Care
                  </h3>
                </div>

                <div className="space-y-3">
                  {service.faqs.map((faq: any, idx: number) => (
                    <details
                      key={idx}
                      className="group bg-gray-50/70 hover:bg-pink-50/30 rounded-2xl border border-gray-200/80 p-4 transition-all open:bg-white open:shadow-xs open:border-pink-200"
                    >
                      <summary className="font-extrabold text-sm text-gray-900 cursor-pointer list-none flex items-center justify-between gap-3 select-none">
                        <span className="flex items-center space-x-2">
                          <span className="text-[#ec2c6c] font-black text-xs">Q{idx + 1}.</span>
                          <span>{faq.question}</span>
                        </span>
                        <span className="text-gray-400 group-open:rotate-180 group-open:text-[#ec2c6c] transition-transform flex-shrink-0 text-xs">
                          ▼
                        </span>
                      </summary>
                      <div className="mt-3 pt-3 border-t border-gray-100 text-xs sm:text-sm text-gray-700 leading-relaxed pl-5">
                        {faq.answer}
                      </div>
                    </details>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* RIGHT COLUMN: Available Locations Only + Free Consultation (4 Columns) */}
          <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-24">
            {/* AVAILABLE CITIES ONLY (Shows ONLY cities where hospitals are available for this service) */}
            {availableCities.length > 0 && (
              <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-xs space-y-4">
                <div className="border-b border-gray-100 pb-3">
                  <div className="flex items-center space-x-1.5 text-[11px] font-extrabold uppercase tracking-wider text-[#ec2c6c]">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>Locations With Hospitals</span>
                  </div>
                  <h3 className="text-base font-black text-gray-900 mt-0.5">
                    Available in {availableCities.length} Cities
                  </h3>
                </div>

                <div className="space-y-1.5 max-h-[420px] overflow-y-auto pr-1">
                  {/* All India Option */}
                  <Link
                    href={`/hospitals/${service.slug}/india`}
                    className="flex items-center justify-between p-2.5 rounded-xl text-xs font-bold border border-[#ec2c6c] bg-[#ec2c6c] text-white shadow-xs"
                  >
                    <span className="flex items-center space-x-2">
                      <span>🇮🇳 All India</span>
                    </span>
                    <span className="bg-white/20 text-white text-[11px] px-2 py-0.5 rounded-full font-bold">
                      {totalAllIndiaHospitals}
                    </span>
                  </Link>

                  {/* Cities where hospitals are actually available */}
                  {availableCities.map((c) => (
                    <Link
                      key={c.citySlug}
                      href={`/hospitals/${service.slug}/${c.citySlug}`}
                      className="flex items-center justify-between p-2.5 rounded-xl text-xs font-bold border border-gray-100 bg-white hover:bg-pink-50/50 hover:border-pink-200 text-gray-800 transition-all group"
                    >
                      <span className="flex items-center space-x-2 truncate">
                        <MapPin className="w-3.5 h-3.5 text-[#ec2c6c] flex-shrink-0" />
                        <span className="truncate">{c.cityName}</span>
                      </span>
                      <span className="text-[11px] px-2 py-0.5 rounded-full font-bold ml-2 flex-shrink-0 bg-gray-100 group-hover:bg-[#ec2c6c] group-hover:text-white text-gray-600 transition-colors">
                        {c.count} {c.count === 1 ? 'Hospital' : 'Hospitals'}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Quick Free Consultation Card */}
            <div className="bg-gradient-to-br from-[#101828] to-[#1e293b] text-white rounded-3xl p-6 shadow-xl space-y-4 relative overflow-hidden">
              <div className="space-y-1">
                <span className="text-[10px] font-extrabold text-[#fd1d74] uppercase tracking-wider">
                  Free Consultation
                </span>
                <h4 className="text-lg font-black text-white leading-tight">
                  Need Help Choosing the Best {service.name} Hospital?
                </h4>
                <p className="text-xs text-gray-300 leading-relaxed">
                  Our care specialists provide unbiased guidance, treatment quotes, and direct doctor consultations.
                </p>
              </div>

              <div className="space-y-2 pt-1 border-t border-gray-800 text-xs text-gray-300">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                  <span>Verified NABH/JCI Accredited Centers</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                  <span>Free Second Opinion from Experts</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                  <span>Zero Consultation & Booking Fees</span>
                </div>
              </div>

              <div className="pt-2 space-y-2">
                <Link
                  href="/contact-us"
                  className="block text-center w-full bg-[#fd1d74] hover:bg-[#d41f5a] text-white font-black py-3 px-4 rounded-xl text-xs shadow-md transition-all hover:scale-102"
                >
                  Book Free Consultation
                </Link>
                <a
                  href="tel:+918146269537"
                  className="flex items-center justify-center space-x-1.5 text-center w-full bg-white/10 hover:bg-white/20 text-white font-bold py-2.5 px-4 rounded-xl text-xs border border-white/15 transition-all"
                >
                  <PhoneCall className="w-3.5 h-3.5 text-pink-400" />
                  <span>Call: +91-81462-69537</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
