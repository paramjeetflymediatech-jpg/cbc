import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import FAQSection from '@/components/ui/FAQSection';
import HomeContactSection from '@/components/ui/HomeContactSection';
import DoctorTestimonialCarousel from '@/components/ui/DoctorTestimonialCarousel';
import { connectDB } from '@/lib/db';
import { Service, Hospital, HospitalService, BlogPost, Testimonial } from '@/models';
import { Search, ShieldCheck, Award, Stethoscope, Building2, FileText, Users, Clock, ArrowRight, Calendar } from 'lucide-react';
import { getPageMetadata } from '@/lib/seo';

export const dynamic = 'force-dynamic';

export async function generateMetadata() {
  return await getPageMetadata(
    '/',
    'Clinic By Choice - Premier Healthcare & Medical Tourism Platform in India',
    'Find top accredited hospitals, clinics, and verified medical specialists across India. Compare packages, book consultations, and access premium medical care.'
  );
}

async function getData() {
  try {
    const db = await connectDB();
    if (!db) return { services: [], hospitals: [], blogs: [], testimonials: [] };

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

    const blogs = await BlogPost.findAll({
      where: { status: 'PUBLISHED' },
      order: [['publishedAt', 'DESC']],
      limit: 3,
    });

    const testimonials = await Testimonial.findAll({
      where: { status: 'ACTIVE' },
      order: [['orderIndex', 'ASC'], ['createdAt', 'DESC']],
    });

    return {
      services: JSON.parse(JSON.stringify(services)),
      hospitals: JSON.parse(JSON.stringify(hospitals)),
      blogs: JSON.parse(JSON.stringify(blogs)),
      testimonials: JSON.parse(JSON.stringify(testimonials)),
    };
  } catch {
    return { services: [], hospitals: [], blogs: [], testimonials: [] };
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

export default async function HomePage() {
  const { services, hospitals, blogs, testimonials } = await getData();
  const { getPageSchemaMarkup } = await import('@/lib/seo');
  const schemaMarkup = await getPageSchemaMarkup('/');

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

      {/* Hero Banner Section matching exact screenshot */}
      <section className="relative min-h-[620px] lg:min-h-[700px] flex items-center bg-[#101828] text-white py-20 lg:py-28 overflow-hidden">
        {/* Background Video */}
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover z-0 brightness-90"
        >
          <source src="/videos/hero-bg.mp4" type="video/mp4" />
        </video>

        {/* Balanced Overlay for Text Contrast */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/40 to-black/55 z-0"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full">
          <div className="max-w-5xl mx-auto text-center space-y-6 flex flex-col items-center">
            {/* Top Sub-Headline matching screenshot */}
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white drop-shadow-md">
              Find The Right
            </h1>

            {/* Solid White Badge Headline matching screenshot */}
            <div className="bg-white px-6 py-3 sm:px-10 sm:py-4 rounded-md shadow-2xl inline-block my-1">
              <h2 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-gray-900">
                Health care with <span className="text-[#fd1d74]">Clinic By Choice</span>
              </h2>
            </div>

            {/* Paragraph Text matching screenshot */}
            <p className="text-gray-100 text-base sm:text-lg lg:text-xl leading-relaxed max-w-4xl font-medium drop-shadow-md mx-auto">
              With our state-of-the-art filtering system, you can find the right healthcare clinic in India for any of your ailments. Gone are the days of being overwhelmed by the sheer number of possibilities, Clinic by Choice ensures that you are able to find the perfect clinic as per your needs and requirements!
            </p>

            {/* Action VISIT NOW Button matching screenshot */}
            <div className="pt-2 flex justify-center w-full">
              <Link
                href="/contact-us"
                className="bg-[#fd1d74] text-white text-base sm:text-lg py-3.5 px-10 font-extrabold tracking-wider uppercase shadow-xl rounded-md hover:bg-[#e01968] transition-all"
              >
                VISIT NOW
              </Link>
            </div>

            {/* Main Quick Search Bar */}
            <form action="/hospital" method="GET" className="bg-white/95 backdrop-blur-md p-2.5 rounded-3xl sm:rounded-full shadow-2xl flex flex-col sm:flex-row items-center gap-2 w-full max-w-2xl mt-6 border border-white/30">
              <div className="flex items-center space-x-2 px-4 py-2 w-full sm:w-auto flex-1">
                <Search className="w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  name="search"
                  placeholder="Search doctor, hospital or specialty..."
                  className="w-full text-base text-gray-900 bg-transparent focus:outline-none placeholder-gray-500 font-medium"
                />
              </div>
              <button
                type="submit"
                className="bg-[#fd1d74] hover:bg-[#e01968] text-white w-full sm:w-auto px-8 py-3.5 text-sm font-extrabold uppercase tracking-wider rounded-full transition-colors"
              >
                Search Now
              </button>
            </form>

            <div className="flex flex-wrap items-center justify-center gap-6 pt-2 text-sm font-bold text-gray-100 drop-shadow-md">
              <span className="flex items-center"><ShieldCheck className="w-5 h-5 text-[#fd1d74] mr-1.5" /> NABH Accredited Hospitals</span>
              <span className="flex items-center"><Award className="w-5 h-5 text-[#fd1d74] mr-1.5" /> Direct Consultation Choice</span>
            </div>
          </div>
        </div>
      </section>

      {/* Treatment Info Section */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900">Treatment</h2>
          <p className="text-gray-700 text-lg sm:text-xl leading-relaxed max-w-5xl mx-auto font-medium">
            Clinic By Choice aims to provide information regarding a number of different clinics that offer different, specialised treatment facilities. A clinic listed on our platform becomes easily accessible to anyone seeking treatment with the rampantly increasing medical tourism in India. By listing your medical speciality on our service, we will act as an intermediary to connect your clinic to the patient who needs your help.
          </p>
        </div>
      </section>

      {/* Treatments & Specialties Section */}
      <section id="specialties" className="pb-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="text-center max-w-4xl mx-auto">
            <h2 className="text-4xl sm:text-5xl font-extrabold text-gray-900">Explore Medical Specialties</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-4.5">
            {services.map((svc: any) => (
              <Link
                key={svc.id}
                href={`/hospitals/${svc.slug}/india`}
                className="flex items-center text-base sm:text-lg font-bold text-gray-800 hover:text-[#fd1d74] transition-colors py-1.5 group"
              >
                <span className="text-[#fd1d74] font-black text-lg mr-3 group-hover:translate-x-1 transition-transform select-none">
                  »
                </span>
                <span className="truncate">{svc.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Make the Informed Choice Section */}
      <section className="py-20 bg-white border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left Overlapping Images Visual */}
            <div className="relative pb-10 sm:pb-12">
              <div className="relative w-4/5 rounded-3xl overflow-hidden shadow-xl border-4 border-white">
                <Image
                  src="/images/about-img-6.jpg"
                  alt="Nurse and patient care"
                  width={600}
                  height={450}
                  className="object-cover w-full h-[340px] sm:h-[420px]"
                />
              </div>
              <div className="absolute bottom-0 right-0 w-3/4 sm:w-2/3 rounded-3xl overflow-hidden shadow-2xl border-4 border-white">
                <Image
                  src="/images/about-img-2902.jpg"
                  alt="Doctor patient examination"
                  width={500}
                  height={350}
                  className="object-cover w-full h-[200px] sm:h-[250px]"
                />
              </div>
            </div>

            {/* Right Side Content matching exact screenshot */}
            <div className="space-y-6 lg:pl-4">
              <span className="text-base sm:text-lg font-bold text-[#fd1d74] block">
                Make the Informed Choice!
              </span>

              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900 leading-tight">
                Make Your Life Easier by Maintaining Smart Health
              </h2>

              <p className="text-gray-600 text-base sm:text-lg leading-relaxed font-medium">
                More often than not, people tend not to pay attention to their own health. It can be intimidating at times to even entertain the possibility of seeking help. One cannot deny that maintaining our health is perhaps one of the primary goals one has to prioritise. With the help of Clinic by Choice, you can make sure you find a reliable healthcare provider.
              </p>

              <div className="space-y-6 pt-2">
                {/* Feature 1 */}
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 rounded-full bg-[#12b886] text-white flex items-center justify-center flex-shrink-0 shadow-md mt-1">
                    <Stethoscope className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg sm:text-xl font-extrabold text-gray-900">Qualified Doctors Only</h3>
                    <p className="text-sm sm:text-base text-gray-600 font-medium mt-0.5">
                      With our enhanced list of healthcare providers, you can make sure to find a reliable and qualified choice.
                    </p>
                  </div>
                </div>

                {/* Feature 2 */}
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 rounded-full bg-[#38d9a9] text-white flex items-center justify-center flex-shrink-0 shadow-md mt-1">
                    <Building2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg sm:text-xl font-extrabold text-gray-900">Explore Emergency Option</h3>
                    <p className="text-sm sm:text-base text-gray-600 font-medium mt-0.5">
                      If you are experiencing an emergency, our listed doctors can and will do everything they can to help you
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3 Overlapping Feature Cards & Contact Us Banner Section */}
      <section className="relative bg-[#b02151] text-white pt-24 pb-20 mt-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* 3 Overlapping White Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 -mt-48 sm:-mt-52 mb-16 relative z-20">
            {/* Card 1 */}
            <div className="bg-white text-gray-900 p-8 sm:p-10 rounded-2xl shadow-xl border border-gray-100 flex flex-col space-y-4">
              <div className="w-14 h-14 rounded-xl bg-pink-50 text-[#fd1d74] flex items-center justify-center flex-shrink-0">
                <FileText className="w-8 h-8" />
              </div>
              <h3 className="text-xl sm:text-2xl font-extrabold text-gray-900">Contact Our Doctors</h3>
              <p className="text-sm sm:text-base text-gray-600 font-medium leading-relaxed">
                If you have any medical concerns, be it exploring your options or taking an appointment – you can contact our doctors.
              </p>
            </div>

            {/* Card 2 */}
            <div className="bg-white text-gray-900 p-8 sm:p-10 rounded-2xl shadow-xl border border-gray-100 flex flex-col space-y-4">
              <div className="w-14 h-14 rounded-xl bg-pink-50 text-[#fd1d74] flex items-center justify-center flex-shrink-0">
                <Users className="w-8 h-8" />
              </div>
              <h3 className="text-xl sm:text-2xl font-extrabold text-gray-900">Family Health Options</h3>
              <p className="text-sm sm:text-base text-gray-600 font-medium leading-relaxed">
                You can also easily explore the family health options through Clinic by Choice – make sure that everyone at home is healthy!
              </p>
            </div>

            {/* Card 3 */}
            <div className="bg-white text-gray-900 p-8 sm:p-10 rounded-2xl shadow-xl border border-gray-100 flex flex-col space-y-4">
              <div className="w-14 h-14 rounded-xl bg-pink-50 text-[#fd1d74] flex items-center justify-center flex-shrink-0">
                <Clock className="w-8 h-8" />
              </div>
              <h3 className="text-xl sm:text-2xl font-extrabold text-gray-900">24-Hours Service</h3>
              <p className="text-sm sm:text-base text-gray-600 font-medium leading-relaxed">
                Illnesses do not work by the clock. If you are experiencing an emergency, you can find an emergency option to seek treatment.
              </p>
            </div>
          </div>

          {/* Contact Us Bottom Row */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 pt-4">
            <div className="space-y-2 max-w-2xl">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white">
                Don't Hesitate To Contact us
              </h2>
              <p className="text-gray-100 text-base sm:text-lg font-medium">
                If you have any questions or you want to book an appointment, Clinic by Choice is always here to help you!
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <Link
                href="/contact-us"
                className="bg-white text-gray-900 font-extrabold text-xs sm:text-sm px-7 py-3.5 rounded-lg uppercase tracking-wider shadow-md hover:bg-gray-100 transition-colors"
              >
                BOOK APPOINTMENT
              </Link>
              <Link
                href="/get-listed"
                className="border-2 border-white/80 text-white font-extrabold text-xs sm:text-sm px-7 py-3.5 rounded-lg uppercase tracking-wider hover:bg-white/10 transition-colors"
              >
                VISIT NOW
              </Link>
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

      {/* Have questions? Get in touch! Contact Section */}
      <HomeContactSection />

      {/* Latest Health Articles & Medical Blogs Section */}
      {blogs && blogs.length > 0 && (
        <section className="py-20 bg-gray-50 border-t border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div className="space-y-3">
                <span className="text-xs font-bold text-[#fd1d74] uppercase tracking-wider bg-pink-100 px-3.5 py-1 rounded-full">
                  Medical Articles & Health Insights
                </span>
                <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900">
                  Latest Health & Surgical Procedure Guides
                </h2>
                <p className="text-gray-600 text-sm sm:text-base max-w-2xl font-medium">
                  Stay informed with clinical breakdowns, patient recovery tips, and expert surgical advice from top doctors in India.
                </p>
              </div>

              <Link
                href="/blog"
                className="inline-flex items-center space-x-2 text-sm font-extrabold text-[#fd1d74] hover:text-[#d41f5a] transition-all hover:translate-x-1"
              >
                <span>View All Articles</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {blogs.map((b: any) => (
                <article
                  key={b.id}
                  className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-md hover:shadow-xl transition-all duration-300 flex flex-col group"
                >
                  <Link href={`/blog/${b.slug}`} className="relative h-48 w-full bg-gray-100 block overflow-hidden">
                    <Image
                      src={
                        b.image ||
                        'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=800&q=80'
                      }
                      alt={b.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-3 left-3">
                      <span className="bg-[#101828]/80 backdrop-blur-xs text-white text-[11px] font-bold px-3 py-1 rounded-full border border-white/20">
                        {b.category || 'Health'}
                      </span>
                    </div>
                  </Link>

                  <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-2.5">
                      <div className="flex items-center space-x-3 text-xs font-semibold text-gray-400">
                        <span className="flex items-center space-x-1">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>
                            {b.publishedAt
                              ? new Date(b.publishedAt).toLocaleDateString(undefined, {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric',
                                })
                              : 'Recent'}
                          </span>
                        </span>
                        <span>•</span>
                        <span className="flex items-center space-x-1">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{b.readTime || '5 min'}</span>
                        </span>
                      </div>

                      <Link href={`/blog/${b.slug}`}>
                        <h3 className="text-lg font-bold text-gray-900 group-hover:text-[#fd1d74] transition-colors leading-snug line-clamp-2">
                          {b.title}
                        </h3>
                      </Link>

                      <p className="text-gray-600 text-xs leading-relaxed line-clamp-3">
                        {b.excerpt || 'Read full medical details and expert procedure breakdowns.'}
                      </p>
                    </div>

                    <div className="pt-4 border-t border-gray-100 flex items-center justify-between text-xs">
                      <span className="font-semibold text-gray-700 truncate max-w-[150px]">
                        {b.author || 'Clinic By Choice'}
                      </span>

                      <Link
                        href={`/blog/${b.slug}`}
                        className="font-extrabold text-[#fd1d74] flex items-center space-x-1 hover:translate-x-1 transition-transform"
                      >
                        <span>Read More</span>
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

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
