import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import FAQSection from '@/components/ui/FAQSection'; 
import HomeContactSection from '@/components/ui/HomeContactSection';
import DoctorTestimonialCarousel from '@/components/ui/DoctorTestimonialCarousel';
import { Stethoscope, Building2, FileText, Users, Clock, CheckCircle2 } from 'lucide-react';
import { connectDB } from '@/lib/db';
import { Service, Hospital, HospitalService, Testimonial } from '@/models';

export const dynamic = 'force-dynamic';

import { getPageMetadata } from '@/lib/seo';

export async function generateMetadata() {
  return await getPageMetadata(
    '/about-us',
    'About Us - Clinic By Choice',
    'Learn about Clinic By Choice, India premier medical marketplace connecting patients with accredited hospitals.'
  );
}

async function getData() {
  try {
    const db = await connectDB();
    if (!db) return { services: [], hospitals: [], testimonials: [] };

    const services = await Service.findAll({
      where: { status: 'ACTIVE' },
      order: [['name', 'ASC']],
    });

    const hospitals = await Hospital.findAll({
      where: { status: 'APPROVED', accountStatus: 'ACTIVE' },
      include: [
        {
          model: HospitalService,
          as: 'hospitalServices',
          where: { status: 'ACTIVE' },
          required: false,
          include: [{ model: Service, as: 'service', attributes: ['name', 'slug'] }],
        },
      ],
      order: [['isFeatured', 'DESC'], ['rating', 'DESC']],
      limit: 6,
    });

    const testimonials = await Testimonial.findAll({
      where: { status: 'ACTIVE' },
      order: [['orderIndex', 'ASC'], ['createdAt', 'DESC']],
    });

    return {
      services: JSON.parse(JSON.stringify(services)),
      hospitals: JSON.parse(JSON.stringify(hospitals)),
      testimonials: JSON.parse(JSON.stringify(testimonials)),
    };
  } catch {
    return { services: [], hospitals: [], testimonials: [] };
  }
}

const defaultTestimonials = [
  {
    quote: '"Registering for Clinic By Choice has done my practice wonders! Patients who would not have found me or my clinic now seek an appointment with us! It has also helped in providing a summary of all the services we offer! So, a number of patients who want any particular service can tell if that is available or not!"',
    doctorName: 'Dr Bikramjit Singh Dhillon',
    hospitalInfo: 'Ludhiana Dental Centre –',
    image: '/images/indus-1.jpg',
  },
  {
    quote: '"Ever since we listed the clinic on Clinic By Choice, we have observed an increased interest and footfall! There are patients from different states seeking treatment from us – people who would not have found us without the help of Clinic By Choice! The best place to list your service if you are offering any specialised treatment!."',
    doctorName: 'Dr. Vijay Kumar',
    hospitalInfo: 'VJ’s Clinics',
    image: '/images/indus-2.jpg',
  },
  {
    quote: '"Putting the service we provide in our clinic on Clinic By Choice has been such a wonderful decision! I have definitely seen the increased patient intake as well as overall interest in our clinic. Good to be providing service to people who need it... Clinic By Choice has increased our patient prospects."',
    doctorName: 'Dr Rajinder Singh',
    hospitalInfo: 'Kalyan Hospital',
    image: '/images/indus-3.jpg',
  },
];

export default async function AboutUsPage() {
  const { services, hospitals, testimonials } = await getData();
  const { getPageSchemaMarkup } = await import('@/lib/seo');
  const schemaMarkup = await getPageSchemaMarkup('/about-us');

  // 1. Admin Managed Testimonials from Testimonial DB Table
  const adminDbCards = (testimonials || []).map((t: any) => ({
    quote: `"${t.quote.replace(/^"|"$/g, '').trim()}"`,
    doctorName: t.doctorName,
    hospitalInfo: t.hospitalInfo,
    image: t.image || '/images/indus-1.jpg',
  }));

  // 2. Featured Hospital Doctors marked as showOnHomepage: true in admin panel
  const featuredDoctorCards = (hospitals || []).flatMap((h: any) => {
    if (h.doctors && Array.isArray(h.doctors)) {
      return h.doctors
        .filter((doc: any) => doc.showOnHomepage === true)
        .map((doc: any) => ({
          quote: `"${(doc.about || 'Listing our practice on Clinic By Choice has helped us connect with patients seeking specialized medical care.').replace(/^"|"$/g, '').trim()}"`,
          doctorName: doc.name,
          hospitalInfo: `${h.name} – ${h.city}`,
          image: doc.image || h.logo || '/images/indus-1.jpg',
        }));
    }
    return [];
  });

  const combinedTestimonials = [...adminDbCards, ...featuredDoctorCards];

  const doctorTestimonials = combinedTestimonials.length > 0 ? combinedTestimonials : defaultTestimonials;

  return (
    <div className="min-h-screen flex flex-col bg-white text-gray-900">
      <Header />

      {/* About Us Hero Banner matching screenshot */}
      <section className="relative min-h-[350px] sm:min-h-[420px] flex items-center justify-center bg-[#101828] text-white overflow-hidden">
        <Image
          src="/images/about-banner.jpg"
          alt="Ambulance background"
          fill
          priority
          className="object-cover object-center brightness-75"
        />
        <div className="absolute inset-0 bg-black/40"></div>

        <div className="relative z-10 text-center px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold text-white tracking-tight drop-shadow-xl">
            About Us
          </h1>
        </div>
      </section>

      {/* Creating Medical Connections Section matching exact screenshot */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
            {/* Left Main Copy */}
            <div className="lg:col-span-6 space-y-6">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900 leading-tight">
                Creating Medical Connections. Ensuring Excellent Care
              </h2>

              <p className="text-gray-700 text-base sm:text-lg leading-relaxed font-medium">
                Clinic By Choice is a one-stop platform for medical providers and healthcare seekers to find the right connections for optimal healthcare procedures. Our aim is to help medical healthcare providers meet patients from all across the world. Our services enable patients to seamlessly search, compare and book a meeting with reputable and credible healthcare facilities, streamlining the process of accessing optimal healthcare services. By collaborating with the leading healthcare providers, hospitals and clinics, we bring an array of options for patients of medical tourism in India to seek treatments from the facilities of their choice.
              </p>
            </div>

            {/* Right Side Framed Image matching screenshot */}
            <div className="lg:col-span-6 flex justify-center lg:justify-end">
              <div className="relative p-3">
                {/* Top-Right and Bottom-Left Pink Frame Accents */}
                <div className="absolute -top-3 -right-3 w-28 h-28 bg-[#fd1d74] rounded-tr-3xl -z-10"></div>
                <div className="absolute -bottom-3 -left-3 w-28 h-28 bg-[#fd1d74] rounded-bl-3xl -z-10"></div>

                <div className="relative rounded-3xl overflow-hidden shadow-2xl border-4 border-white">
                  <Image
                    src="/images/about-img-1.jpg"
                    alt="Doctor caring for patient"
                    width={600}
                    height={420}
                    className="object-cover w-full h-[360px] sm:h-[440px]"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 4 Checkmark Items List matching screenshot */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
            {/* Item 1 */}
            <div className="flex items-start space-x-4">
              <CheckCircle2 className="w-7 h-7 text-[#fd1d74] fill-pink-50 flex-shrink-0 mt-1" />
              <div className="space-y-1">
                <h3 className="text-lg sm:text-xl font-extrabold text-gray-900">
                  Benefits of Choosing ClinicbyChoice
                </h3>
                <p className="text-gray-600 text-sm sm:text-base font-medium leading-relaxed">
                  Choosing Clinicbychoice brings a number of benefits to patients in medical tourism in India.
                </p>
              </div>
            </div>

            {/* Item 2 */}
            <div className="flex items-start space-x-4">
              <CheckCircle2 className="w-7 h-7 text-[#fd1d74] fill-pink-50 flex-shrink-0 mt-1" />
              <div className="space-y-1">
                <h3 className="text-lg sm:text-xl font-extrabold text-gray-900">
                  Collaboration with Top Medical Facilities
                </h3>
                <p className="text-gray-600 text-sm sm:text-base font-medium leading-relaxed">
                  Clinicbychoice collaborates with top medical institutes/hospitals and clinics all over India, ensuring patients are tapping into trustworthy and reliable healthcare services.
                </p>
              </div>
            </div>

            {/* Item 3 */}
            <div className="flex items-start space-x-4">
              <CheckCircle2 className="w-7 h-7 text-[#fd1d74] fill-pink-50 flex-shrink-0 mt-1" />
              <div className="space-y-1">
                <h3 className="text-lg sm:text-xl font-extrabold text-gray-900">
                  Creating Connections All Over the World
                </h3>
                <p className="text-gray-600 text-sm sm:text-base font-medium leading-relaxed">
                  Our services allow medical care providers to connect with healthcare seekers from all around the world, promote medical tourism in India, and enable patients to get optimal healthcare.
                </p>
              </div>
            </div>

            {/* Item 4 */}
            <div className="flex items-start space-x-4">
              <CheckCircle2 className="w-7 h-7 text-[#fd1d74] fill-pink-50 flex-shrink-0 mt-1" />
              <div className="space-y-1">
                <h3 className="text-lg sm:text-xl font-extrabold text-gray-900">
                  Streamlined Access
                </h3>
                <p className="text-gray-600 text-sm sm:text-base font-medium leading-relaxed">
                  Clinicbychoice is a one-stop platform for medical providers and healthcare seekers to indulge in a streamlined medical procedure with our user-friendly website.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Highlight the Specialised Treatment Procedures & Doctor Testimonials Carousel Section */}
      <section className="py-20 bg-[#f4f7fc]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-6xl mx-auto space-y-4">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900 leading-tight">
              Highlight the Specialised Treatment Procedures with{' '}
              <span className="text-[#fd1d74] block sm:inline">Clinic By Choice!</span>
            </h2>
            <p className="text-gray-600 text-base sm:text-lg leading-relaxed font-medium max-w-6xl mx-auto">
              Stand out among the crowd by listing your hospital or clinic on our platform. We are aiming to streamline the access and availability of treatment for any patient seeking answers. Clinic By Choice will help connect specialised healthcare providers to medical tourism patients in India.
            </p>
          </div>

          {/* Interactive Doctor Testimonials Carousel */}
          <DoctorTestimonialCarousel testimonials={doctorTestimonials} />
        </div>
      </section>

      {/* Our Mission Banner Section matching screenshot */}
      <section
        className="relative py-20 sm:py-28 bg-[#101828] bg-cover bg-top bg-no-repeat   text-white overflow-hidden flex items-center justify-center"
        style={{ backgroundImage: "linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.6)), url('/images/mission-bg.jpg')" }}
      >
        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight drop-shadow-md">
            Our Mission
          </h2>

          <p className="text-gray-100 text-base sm:text-lg leading-relaxed max-w-6xl mx-auto font-medium drop-shadow-md">
            Our primary mission is to streamline the access for both medical facilities and patients of <strong className="text-white font-extrabold">medical tourism in India</strong> to find a perfect match for the healthcare procedure, ensuring excellent services and outstanding results.
          </p>

          <div className="pt-2 flex justify-center">
            <Link
              href="/contact-us"
              className="bg-[#fd1d74] hover:bg-[#e01968] text-white font-extrabold text-sm sm:text-base px-8 py-3.5 rounded-full uppercase tracking-wider transition-all shadow-xl"
            >
              Contact us
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ's Pink Accordion Section */}
      <FAQSection />

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
