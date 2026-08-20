import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import HospitalCard from '@/components/ui/HospitalCard';
import FilterBar from '@/components/ui/FilterBar';
import { connectDB } from '@/lib/db';
import { Service, Hospital, HospitalService, ServiceLocation } from '@/models';
import { Op } from 'sequelize';
import {
  Stethoscope,
  ChevronRight,
  HelpCircle,
  MapPin,
  Building2,
  ShieldCheck,
  PhoneCall,
  Calendar,
  CheckCircle,
  ExternalLink,
} from 'lucide-react';
import { getLocationsData } from '@/lib/locations';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ slug: string; city: string }>;
  searchParams: Promise<{ state?: string; district?: string; city?: string; search?: string }>;
}

function formatCityName(citySlug: string): string {
  if (!citySlug) return '';
  const decoded = decodeURIComponent(citySlug).toLowerCase().replace(/-/g, ' ');
  return decoded
    .split(' ')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

export async function generateMetadata({ params }: PageProps) {
  const { slug, city: cityParam } = await params;
  const cityName = formatCityName(cityParam);
  const path = `/hospitals/${slug.toLowerCase()}/${cityParam.toLowerCase()}`;

  try {
    const db = await connectDB();
    if (!db) return { title: `Clinic By Choice - ${cityName}` };

    // Check custom SEO override
    const { SeoMetadata, ServiceLocation, Service } = await import('@/models');
    const customSeo = await SeoMetadata.findOne({ where: { path } });
    if (customSeo) {
      const { buildMetadataFromRecord } = await import('@/lib/seo');
      return buildMetadataFromRecord(customSeo);
    }

    const service = await Service.findOne({ where: { slug: slug.toLowerCase() } });
    const serviceName = service ? service.name : formatCityName(slug);

    if (service) {
      const serviceLocation = await ServiceLocation.findOne({
        where: {
          serviceId: service.id,
          citySlug: cityParam.toLowerCase(),
          status: 'ACTIVE',
        },
      });

      if (serviceLocation) {
        if (serviceLocation.seoTitle) {
          return {
            title: serviceLocation.seoTitle,
            description:
              serviceLocation.seoDescription ||
              `Find top accredited ${serviceName} hospitals, clinics, and doctors in ${cityName}.`,
            keywords: serviceLocation.seoKeywords || `${serviceName.toLowerCase()} in ${cityName.toLowerCase()}`,
            alternates: {
              canonical: `https://clinicbychoice.com/hospitals/${slug.toLowerCase()}/${cityParam.toLowerCase()}`,
            },
            openGraph: {
              title: serviceLocation.seoTitle,
              description: serviceLocation.seoDescription || `Find top accredited ${serviceName} hospitals in ${cityName}.`,
              url: `https://clinicbychoice.com/hospitals/${slug.toLowerCase()}/${cityParam.toLowerCase()}`,
            },
          };
        }

        if (serviceLocation.serviceTitle) {
          return {
            title: `${serviceLocation.serviceTitle} | Clinic By Choice`,
            description:
              serviceLocation.seoDescription ||
              serviceLocation.shortDescription ||
              `Find top accredited ${serviceName} hospitals, clinics, and doctors in ${cityName}.`,
            keywords: serviceLocation.seoKeywords || `${serviceName.toLowerCase()} in ${cityName.toLowerCase()}`,
            alternates: {
              canonical: `https://clinicbychoice.com/hospitals/${slug.toLowerCase()}/${cityParam.toLowerCase()}`,
            },
            openGraph: {
              title: serviceLocation.serviceTitle,
              description:
                serviceLocation.seoDescription ||
                serviceLocation.shortDescription ||
                `Find top accredited ${serviceName} hospitals in ${cityName}.`,
              url: `https://clinicbychoice.com/hospitals/${slug.toLowerCase()}/${cityParam.toLowerCase()}`,
            },
          };
        }
      }
    }

    return {
      title: `${serviceName} in ${cityName} - Top Hospitals & Specialists | Clinic By Choice`,
      description: `Find top accredited ${serviceName} hospitals, clinics, and expert doctors in ${cityName}. Compare hospital facilities, doctor consultations, and book appointments.`,
      keywords: `${serviceName.toLowerCase()} in ${cityName.toLowerCase()}, ${serviceName.toLowerCase()} hospital ${cityName.toLowerCase()}, best ${serviceName.toLowerCase()} clinic ${cityName.toLowerCase()}, doctors in ${cityName.toLowerCase()}`,
      alternates: {
        canonical: `https://clinicbychoice.com/hospitals/${slug.toLowerCase()}/${cityParam.toLowerCase()}`,
      },
      openGraph: {
        title: `${serviceName} in ${cityName} - Top Hospitals & Doctors`,
        description: `Find top accredited ${serviceName} hospitals and specialist doctors in ${cityName}.`,
        url: `https://clinicbychoice.com/hospitals/${slug.toLowerCase()}/${cityParam.toLowerCase()}`,
      },
    };
  } catch {
    return { title: `${cityName} Hospitals | Clinic By Choice` };
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

export default async function CityServiceDetailPage({ params, searchParams }: PageProps) {
  const { slug, city: cityParam } = await params;
  const { search } = await searchParams;

  const cityName = formatCityName(cityParam);

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

  // Fetch custom database ServiceLocation content for this city + service
  const serviceLocation = await ServiceLocation.findOne({
    where: {
      serviceId: service.id,
      citySlug: cityParam.toLowerCase(),
      status: 'ACTIVE',
    },
  });

  const subServices = service.subServices || [];
  const parentService = service.parent;

  // Target service IDs for query
  const targetServiceIds: number[] = [service.id];
  if (subServices.length > 0) {
    subServices.forEach((sub) => targetServiceIds.push(sub.id));
  } else if (service.parentId) {
    targetServiceIds.push(service.parentId);
  }

  // 1. Query ALL active hospitals offering this service across India to compute available cities and counts
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

  // 2. Query hospitals ONLY inside the current selected city
  const hospitalWhere: any = {
    status: 'APPROVED',
    accountStatus: 'ACTIVE',
    [Op.or]: [
      { city: { [Op.like]: `%${cityName}%` } },
      { district: { [Op.like]: `%${cityName}%` } },
      { address: { [Op.like]: `%${cityName}%` } },
    ],
  };

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

  const cityHospitalServices = await HospitalService.findAll({
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

  // Deduplicate hospitals in current city
  const uniqueHospitalsMap = new Map<number, any>();
  cityHospitalServices.forEach((hs: any) => {
    if (hs.hospital && !uniqueHospitalsMap.has(hs.hospital.id)) {
      uniqueHospitalsMap.set(hs.hospital.id, hs.hospital);
    }
  });

  const hospitals = Array.from(uniqueHospitalsMap.values());

  // Dynamic city-specific FAQs
  const defaultCityFaqs = [
    {
      question: `Which are the best ${service.name} hospitals in ${cityName}?`,
      answer: `The best ${service.name} hospitals in ${cityName} feature accredited surgical facilities, experienced specialists, state-of-the-art diagnostic units, and personalized patient care.`,
    },
    {
      question: `How can I book an appointment for ${service.name} in ${cityName}?`,
      answer: `You can directly submit an appointment inquiry through the hospital cards or contact our medical helpline at +91-81462-69537 for free case evaluation in ${cityName}.`,
    },
    {
      question: `Does Clinic By Choice provide free second opinions in ${cityName}?`,
      answer: `Yes, Clinic By Choice offers complimentary second opinions from senior specialist doctors in ${cityName} and across India.`,
    },
  ];

  const allFaqs =
    serviceLocation?.faqs && Array.isArray(serviceLocation.faqs) && serviceLocation.faqs.length > 0
      ? serviceLocation.faqs
      : service.faqs && Array.isArray(service.faqs) && service.faqs.length > 0
      ? service.faqs
      : defaultCityFaqs;

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />

      {/* Header Banner */}
      <div className="bg-[#101828] text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
          {/* Breadcrumbs */}
          <nav className="flex items-center flex-wrap gap-2 text-xs font-semibold text-pink-300">
            <Link href="/" className="hover:underline">
              Home
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-gray-500" />
            <Link href="/service" className="hover:underline">
              Services
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-gray-500" />
            <Link href={`/hospitals/${service.slug}/india`} className="hover:underline">
              {service.name} in India
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-gray-500" />
            <span className="text-white font-bold">{cityName}</span>
          </nav>

          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#ec2c6c] bg-pink-500/10 px-3 py-1 rounded-full border border-pink-500/20">
              {service.category || 'Specialty Care'}
            </span>
            <span className="inline-flex items-center space-x-1 text-xs font-bold uppercase tracking-wider text-emerald-300 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
              <MapPin className="w-3 h-3" />
              <span>{cityName}</span>
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white leading-tight">
            {serviceLocation?.serviceTitle || `${service.name} in ${cityName}`}
          </h1>

          <p className="text-gray-300 text-sm sm:text-base max-w-3xl leading-relaxed font-medium">
            {serviceLocation?.shortDescription ||
              `Find top accredited hospitals, specialized clinics, and experienced doctors for ${service.name} in ${cityName}. Compare facilities and book appointments.`}
          </p>

          {/* Filter Bar */}
          <FilterBar
            basePath={`/hospitals/${service.slug}/${cityParam}`}
            states={states}
            districts={districts}
            cities={cities}
            locationsMap={locationsMap}
            stateDistrictMap={stateDistrictMap}
            districtCityMap={districtCityMap}
            currentState=""
            currentDistrict=""
            currentCity={cityName}
            currentSearch={search || ''}
          />
        </div>
      </div>

      {/* Main 2-Column Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-1 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* LEFT COLUMN: Hospital Cards, Clinical Description, FAQs (8 Columns) */}
          <div className="lg:col-span-8 space-y-8">
            {/* Results Header Count */}
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <h2 className="text-xl font-black text-gray-900">
                  {hospitals.length > 0
                    ? `Showing ${hospitals.length} Verified Hospital(s) in ${cityName}`
                    : `Hospitals in ${cityName}`}
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Multi-specialty centers offering {service.name} in {cityName}
                </p>
              </div>

              {search && (
                <Link
                  href={`/hospitals/${service.slug}/${cityParam}`}
                  className="text-xs font-bold text-[#ec2c6c] hover:underline"
                >
                  Clear Search
                </Link>
              )}
            </div>

            {/* Hospitals List */}
            {hospitals.length > 0 ? (
              <div className="space-y-6">
                {hospitals.map((h: any) => (
                  <HospitalCard key={h.id} hospital={JSON.parse(JSON.stringify(h))} defaultServiceId={service.id} />
                ))}
              </div>
            ) : (
              <div className="text-center py-14 bg-gray-50 rounded-3xl space-y-4 border border-dashed border-gray-200 p-8">
                <Stethoscope className="w-12 h-12 text-gray-400 mx-auto" />
                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-gray-800">
                    No Direct Hospital Listed Yet in {cityName} for {service.name}
                  </h3>
                  <p className="text-sm text-gray-500 max-w-lg mx-auto">
                    We are actively onboarding more partner hospitals in <strong>{cityName}</strong>. You can browse hospitals offering {service.name} in other cities with active facilities.
                  </p>
                </div>

                <div className="pt-2 flex flex-wrap justify-center gap-3">
                  <Link
                    href={`/hospitals/${service.slug}/india`}
                    className="bg-[#ec2c6c] text-white text-xs font-bold px-5 py-2.5 rounded-xl hover:bg-[#d41f5a] transition-all shadow-xs"
                  >
                    View All India ({totalAllIndiaHospitals})
                  </Link>
                  <Link
                    href="/contact-us"
                    className="bg-white border border-gray-200 text-gray-700 text-xs font-bold px-5 py-2.5 rounded-xl hover:bg-gray-100 transition-all shadow-xs"
                  >
                    Request Assistance in {cityName}
                  </Link>
                </div>
              </div>
            )}

            {/* Dynamic City-Specific Description Content Section */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xs border border-gray-100 space-y-4">
              <div className="text-gray-700 space-y-4 leading-relaxed text-sm sm:text-base font-normal">
                {/* Custom Database City Description if present */}
                {serviceLocation?.description ? (
                  <article
                    className="prose prose-lg max-w-none text-gray-800 space-y-4 leading-relaxed font-normal
                      [&_*]:max-w-full [&_*]:break-words
                      [&_h2]:text-2xl sm:[&_h2]:text-3xl [&_h2]:font-extrabold [&_h2]:text-[#101828] [&_h2]:mt-6 [&_h2]:mb-3
                      [&_h3]:text-lg sm:[&_h3]:text-xl [&_h3]:font-bold [&_h3]:text-[#ec2c6c] [&_h3]:mt-4 [&_h3]:mb-2
                      [&_p]:text-gray-700 [&_p]:leading-relaxed [&_p]:text-base [&_p]:mb-3
                      [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:space-y-1.5 [&_ul]:mb-3 [&_li]:text-gray-700
                      [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:space-y-1.5 [&_ol]:mb-3"
                    dangerouslySetInnerHTML={{ __html: cleanEditorHtml(serviceLocation.description) }}
                  />
                ) : (
                  <>
                    <h3 className="text-lg font-black text-gray-900">
                      About {service.name} Care in {cityName}
                    </h3>
                    <p>
                      Patients seeking <strong>{service.name}</strong> in <strong>{cityName}</strong> have access to qualified specialists, advanced diagnostics, and dedicated clinical facilities. Compare hospital accreditation, doctor profiles, and treatment capabilities to make an informed healthcare choice.
                    </p>
                    <p>
                      At <strong>Clinic By Choice</strong>, we assist patients in finding verified hospitals, booking appointments with leading consultants, and securing free second opinions.
                    </p>
                  </>
                )}

                {/* Inherited Service Details if available and no custom city desc */}
                {!serviceLocation?.description && service.description && (() => {
                  const cleanedHtml = cleanEditorHtml(service.description);
                  if (cleanedHtml.replace(/<[^>]*>/g, '').trim().length === 0) return null;
                  return (
                    <div className="pt-4 border-t border-gray-100">
                      <h4 className="text-base font-bold text-gray-900 mb-2">Service Overview</h4>
                      <article
                        className="prose prose-sm max-w-none text-gray-700 space-y-3 leading-relaxed"
                        dangerouslySetInnerHTML={{ __html: cleanedHtml }}
                      />
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* City FAQs Section */}
            {allFaqs.length > 0 && (
              <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xs border border-gray-100 space-y-4">
                <div className="border-b border-gray-100 pb-3">
                  <div className="flex items-center space-x-1.5 text-xs font-bold uppercase tracking-wider text-[#ec2c6c] mb-1">
                    <HelpCircle className="w-4 h-4" />
                    <span>Frequently Asked Questions</span>
                  </div>
                  <h3 className="text-xl font-black text-[#101828]">
                    FAQs on {service.name} in {cityName}
                  </h3>
                </div>

                <div className="space-y-3">
                  {allFaqs.map((faq: any, idx: number) => (
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

          {/* RIGHT COLUMN: Only Locations With Available Hospitals + Consultation Box (4 Columns) */}
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
                    className="flex items-center justify-between p-2.5 rounded-xl text-xs font-bold border border-gray-100 hover:border-pink-200 hover:bg-pink-50/50 text-gray-800 transition-all group"
                  >
                    <span className="flex items-center space-x-2">
                      <span>🇮🇳 All India</span>
                    </span>
                    <span className="bg-gray-100 group-hover:bg-[#ec2c6c] group-hover:text-white text-gray-600 text-[11px] px-2 py-0.5 rounded-full font-bold transition-colors">
                      {totalAllIndiaHospitals}
                    </span>
                  </Link>

                  {/* Cities where hospitals are actually available */}
                  {availableCities.map((c) => {
                    const isCurrent = c.citySlug === cityParam.toLowerCase();
                    return (
                      <Link
                        key={c.citySlug}
                        href={`/hospitals/${service.slug}/${c.citySlug}`}
                        className={`flex items-center justify-between p-2.5 rounded-xl text-xs font-bold border transition-all ${
                          isCurrent
                            ? 'bg-[#ec2c6c] text-white border-[#ec2c6c] shadow-xs'
                            : 'bg-white hover:bg-pink-50/50 hover:border-pink-200 text-gray-800 border-gray-100'
                        }`}
                      >
                        <span className="flex items-center space-x-2 truncate">
                          <MapPin className={`w-3.5 h-3.5 flex-shrink-0 ${isCurrent ? 'text-white' : 'text-[#ec2c6c]'}`} />
                          <span className="truncate">{c.cityName}</span>
                        </span>
                        <span
                          className={`text-[11px] px-2 py-0.5 rounded-full font-bold ml-2 flex-shrink-0 ${
                            isCurrent
                              ? 'bg-white/20 text-white'
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {c.count} {c.count === 1 ? 'Hospital' : 'Hospitals'}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Quick Free Consultation Card */}
            <div className="bg-gradient-to-br from-[#101828] to-[#1e293b] text-white rounded-3xl p-6 shadow-xl space-y-4 relative overflow-hidden">
              <div className="space-y-1">
                <span className="text-[10px] font-extrabold text-[#fd1d74] uppercase tracking-wider">
                  Free Case Assistance
                </span>
                <h4 className="text-lg font-black text-white leading-tight">
                  Need Help Finding a Doctor in {cityName}?
                </h4>
                <p className="text-xs text-gray-300 leading-relaxed">
                  Our medical coordinators will help you compare hospital estimates and schedule senior consultant appointments.
                </p>
              </div>

              <div className="space-y-2 pt-1 border-t border-gray-800 text-xs text-gray-300">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                  <span>100% Free Second Opinion</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                  <span>Zero Waiting Time Booking</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                  <span>Transparent Cost Estimates</span>
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

      {/* Structured Data Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'MedicalWebPage',
            name: `${service.name} in ${cityName}`,
            description: `Top accredited ${service.name} hospitals, clinics, and specialists in ${cityName}.`,
            url: `https://clinicbychoice.com/hospitals/${service.slug}/${cityParam}`,
            about: {
              '@type': 'MedicalSpecialty',
              name: service.name,
            },
            spatialCoverage: {
              '@type': 'Place',
              name: cityName,
            },
          }),
        }}
      />

      {/* FAQPage Structured Data Schema */}
      {allFaqs.length > 0 && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'FAQPage',
              mainEntity: allFaqs.map((f: any) => ({
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
