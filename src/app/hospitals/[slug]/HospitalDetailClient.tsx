'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { MapPin, Phone, Globe, Star, ShieldCheck, Stethoscope, UserCheck, HelpCircle, PhoneCall, ChevronRight, CheckCircle2, AlertCircle, Loader2, Sparkles, Building2, Send, Clock, Map, Image as ImageIcon, X, ExternalLink } from 'lucide-react';
import EnquiryModal from '@/components/ui/EnquiryModal';

interface HospitalDetailClientProps {
  hospital: any;
  initialServiceId?: number;
}

export default function HospitalDetailClient({ hospital, initialServiceId }: HospitalDetailClientProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'services' | 'doctors' | 'facilities' | 'gallery' | 'faqs' | 'map'>('overview');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedServiceId, setSelectedServiceId] = useState<number | undefined>(initialServiceId);
  const [activeGalleryIndex, setActiveGalleryIndex] = useState<number | null>(null);

  // Sidebar Inline Enquiry Form State
  const [sidebarName, setSidebarName] = useState('');
  const [sidebarPhone, setSidebarPhone] = useState('');
  const [sidebarEmail, setSidebarEmail] = useState('');
  const [sidebarCity, setSidebarCity] = useState('');
  const [sidebarServiceId, setSidebarServiceId] = useState<number | string>(initialServiceId || '');
  const [sidebarMessage, setSidebarMessage] = useState('');
  const [sidebarTime, setSidebarTime] = useState('Morning (9 AM - 12 PM)');

  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState(false);

  const isExhausted = (hospital.leadsRemaining || 0) <= 0;
  const hospitalServicesList = hospital.hospitalServices || [];
  const services = hospitalServicesList.map((hs: any) => hs.service).filter(Boolean);
  const doctors = hospital.doctors || [];
  const facilities = hospital.facilities || [];
  const faqs = hospital.faqs || [];
  const gallery = hospital.gallery || [
    'https://spcdn.shortpixel.ai/spio/ret_img,q_cdnize,to_auto,s_webp:avif/clinicbychoice.com/wp-content/uploads/2025/02/2902-1024x683.jpg',
    'https://spcdn.shortpixel.ai/spio/ret_img,q_cdnize,to_auto,s_webp:avif/clinicbychoice.com/wp-content/uploads/2025/02/about-img-6.jpg',
    'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?w=800&auto=format&fit=crop&q=80',
  ];

  const handleContactClick = (serviceId?: number) => {
    if (serviceId) setSelectedServiceId(serviceId);
    setIsModalOpen(true);
  };

  const handleSidebarSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormLoading(true);

    try {
      const res = await fetch('/api/enquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientName: sidebarName,
          phone: sidebarPhone,
          email: sidebarEmail,
          city: sidebarCity,
          serviceId: sidebarServiceId ? Number(sidebarServiceId) : (services[0]?.id || 1),
          hospitalId: hospital.id,
          message: sidebarMessage,
          preferredContactTime: sidebarTime,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error || 'Failed to submit enquiry.');
      } else {
        setFormSuccess(true);
        setSidebarName('');
        setSidebarPhone('');
        setSidebarEmail('');
        setSidebarCity('');
        setSidebarMessage('');
      }
    } catch {
      setFormError('Network error submitting enquiry.');
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <main className="flex-1 bg-slate-50 pb-20">
      {/* Top Breadcrumb Header */}
      <div className="bg-[#101828] text-white pt-6 pb-12 border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <nav className="text-xs text-gray-400 font-medium flex items-center space-x-2">
            <a href="/" className="hover:text-white transition-colors">Home</a>
            <span>/</span>
            <a href="/hospitals" className="hover:text-white transition-colors">Hospitals</a>
            <span>/</span>
            <span className="text-gray-300">{hospital.state || 'Punjab'}</span>
            <span>/</span>
            <span className="text-pink-400 font-bold">{hospital.name}</span>
          </nav>

          {/* Main Hospital Hero Card */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex flex-col sm:flex-row items-start space-y-4 sm:space-y-0 sm:space-x-6">
              {/* Logo Box */}
              <div className="relative w-28 h-28 bg-white rounded-3xl p-3 flex-shrink-0 flex items-center justify-center overflow-hidden shadow-2xl border-2 border-white/20">
                {hospital.logo ? (
                  <Image src={hospital.logo} alt={hospital.name} fill unoptimized className="object-contain p-2" />
                ) : (
                  <Building2 className="w-14 h-14 text-[#b02151]" />
                )}
              </div>

              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="bg-[#fd1d74] text-white text-xs font-extrabold px-3.5 py-1 rounded-full flex items-center shadow-xs">
                    <Star className="w-3.5 h-3.5 fill-current mr-1 text-yellow-300" />
                    {(hospital as any).googleRating || hospital.rating || 4.8} Verified Hospital
                  </span>
                  {(hospital as any).isNabhAccredited !== false && (
                    <span className="bg-slate-800/90 text-white text-xs font-bold px-3.5 py-1 rounded-full border border-slate-700 shadow-xs">
                      NABH Accredited
                    </span>
                  )}
                  {(hospital as any).isVerifiedPartner !== false && (
                    <span className="bg-[#045c43]/60 text-emerald-300 border border-emerald-600/50 text-xs font-extrabold px-3.5 py-1 rounded-full flex items-center shadow-xs">
                      <ShieldCheck className="w-3.5 h-3.5 mr-1" />
                      Verified Partner
                    </span>
                  )}
                </div>

                <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">{hospital.name}</h1>

                <p className="text-xs sm:text-sm text-gray-300 flex items-center font-medium">
                  <MapPin className="w-4 h-4 text-[#fd1d74] mr-1.5 flex-shrink-0" />
                  {hospital.address}, {hospital.city}, {hospital.state || 'Punjab'}
                </p>

                <div className="flex flex-wrap items-center gap-4 text-xs text-gray-300 pt-1 font-medium">
                  <span className="flex items-center"><Phone className="w-3.5 h-3.5 text-[#fd1d74] mr-1" /> {hospital.phone}</span>
                  {hospital.website && (
                    <a href={hospital.website} target="_blank" rel="noreferrer" className="text-pink-300 hover:underline flex items-center">
                      <Globe className="w-3.5 h-3.5 mr-1" /> Official Website
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* Header Call to Action */}
            <div className="w-full md:w-auto flex flex-col items-start md:items-end space-y-2.5">
              <button
                onClick={() => handleContactClick()}
                disabled={isExhausted}
                className={`w-full md:w-auto px-8 py-4 rounded-2xl text-sm font-extrabold uppercase tracking-wider transition-all shadow-2xl flex items-center justify-center space-x-2.5 cursor-pointer ${
                  isExhausted
                    ? 'bg-gray-800 text-gray-500 cursor-not-allowed border border-gray-700'
                    : 'bg-[#b02151] hover:bg-[#921941] text-white shadow-pink-900/40'
                }`}
              >
                <PhoneCall className="w-5 h-5" />
                <span>{isExhausted ? 'Enquiries Paused' : 'Book Direct Consultation'}</span>
              </button>

              <div className="text-[11px] text-gray-400 font-medium">
                ⚡ Priority Response • Direct Patient Coordinator Desk
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Sub-Header Tabs Bar */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center space-x-2 overflow-x-auto py-3 no-scrollbar text-xs font-extrabold uppercase tracking-wider text-gray-600">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-4 py-2.5 rounded-xl transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'overview' ? 'bg-pink-50 text-[#b02151] shadow-xs border border-pink-100' : 'hover:text-gray-900'
              }`}
            >
              Overview
            </button>

            <button
              onClick={() => setActiveTab('services')}
              className={`px-4 py-2.5 rounded-xl transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'services' ? 'bg-pink-50 text-[#b02151] shadow-xs border border-pink-100' : 'hover:text-gray-900'
              }`}
            >
              Medical Services ({hospitalServicesList.length || services.length})
            </button>

            <button
              onClick={() => setActiveTab('doctors')}
              className={`px-4 py-2.5 rounded-xl transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'doctors' ? 'bg-pink-50 text-[#b02151] shadow-xs border border-pink-100' : 'hover:text-gray-900'
              }`}
            >
              Doctors & Specialists ({doctors.length})
            </button>

            <button
              onClick={() => setActiveTab('gallery')}
              className={`px-4 py-2.5 rounded-xl transition-all whitespace-nowrap cursor-pointer flex items-center space-x-1 ${
                activeTab === 'gallery' ? 'bg-pink-50 text-[#b02151] shadow-xs border border-pink-100' : 'hover:text-gray-900'
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5 text-[#b02151] mr-1" />
              <span>Photo Gallery ({gallery.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('facilities')}
              className={`px-4 py-2.5 rounded-xl transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'facilities' ? 'bg-pink-50 text-[#b02151] shadow-xs border border-pink-100' : 'hover:text-gray-900'
              }`}
            >
              Facilities
            </button>

            <button
              onClick={() => setActiveTab('faqs')}
              className={`px-4 py-2.5 rounded-xl transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'faqs' ? 'bg-pink-50 text-[#b02151] shadow-xs border border-pink-100' : 'hover:text-gray-900'
              }`}
            >
              Patient FAQs
            </button>

            <button
              onClick={() => setActiveTab('map')}
              className={`px-4 py-2.5 rounded-xl transition-all whitespace-nowrap cursor-pointer flex items-center space-x-1 ${
                activeTab === 'map' ? 'bg-pink-50 text-[#b02151] shadow-xs border border-pink-100' : 'hover:text-gray-900'
              }`}
            >
              <Map className="w-3.5 h-3.5 text-[#b02151] mr-1" />
              <span>Location Map</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left 8 Columns: Main Tab Content */}
          <div className="lg:col-span-8 space-y-8">
            {/* Overview Section */}
            {(activeTab === 'overview' || activeTab === 'services') && (
              <section className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-gray-100 space-y-4">
                <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                  <h2 className="text-xl font-extrabold text-gray-900 flex items-center">
                    <ShieldCheck className="w-6 h-6 text-[#b02151] mr-2" />
                    About {hospital.name}
                  </h2>
                  <span className="text-xs font-bold text-[#b02151] bg-pink-50 px-3 py-1 rounded-full border border-pink-100">
                    NABH Accredited
                  </span>
                </div>
                <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-line font-medium">
                  {hospital.description}
                </p>
              </section>
            )}

            {/* Photo Gallery Grid Section */}
            {(activeTab === 'overview' || activeTab === 'gallery') && gallery.length > 0 && (
              <section className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-gray-100 space-y-5">
                <div className="border-b border-gray-100 pb-3 flex items-center justify-between">
                  <h2 className="text-xl font-extrabold text-gray-900 flex items-center">
                    <ImageIcon className="w-6 h-6 text-[#b02151] mr-2" />
                    Hospital Photo Gallery ({gallery.length})
                  </h2>
                  <span className="text-xs font-bold text-[#b02151] bg-pink-50 px-3 py-1 rounded-full border border-pink-100">
                    Infrastructure & Facilities
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {gallery.map((imgUrl: string, index: number) => (
                    <div
                      key={index}
                      onClick={() => setActiveGalleryIndex(index)}
                      className="relative group h-36 bg-gray-100 rounded-2xl overflow-hidden border border-gray-200 shadow-xs cursor-pointer"
                    >
                      <Image
                        src={imgUrl}
                        alt={`${hospital.name} Photo ${index + 1}`}
                        fill
                        unoptimized
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="text-xs font-bold text-white bg-[#b02151] px-3 py-1 rounded-full shadow-lg">
                          View Photo
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Offered Medical Services */}
            <section className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-gray-100 space-y-5">
              <div className="border-b border-gray-100 pb-3 flex items-center justify-between">
                <h2 className="text-xl font-extrabold text-gray-900 flex items-center">
                  <Stethoscope className="w-6 h-6 text-[#b02151] mr-2" />
                  Offered Medical Services & Treatments
                </h2>
                <span className="text-xs font-bold text-gray-500">
                  {hospitalServicesList.length || services.length} Active Specialties
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {hospitalServicesList.map((hs: any) => (
                  <div key={hs.id} className="p-5 bg-slate-50 border border-gray-200 rounded-2xl space-y-3 flex flex-col justify-between hover:shadow-md transition-all">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-extrabold text-[#b02151] bg-pink-50 border border-pink-100 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                          {hs.service?.category || 'Specialty'}
                        </span>
                        {hs.startingPrice && (
                          <span className="text-xs font-extrabold text-emerald-700">
                            From ₹{Number(hs.startingPrice).toLocaleString('en-IN')}
                          </span>
                        )}
                      </div>

                      <h3 className="font-extrabold text-gray-900 text-base">{hs.service?.name}</h3>
                      <p className="text-xs text-gray-600 leading-relaxed line-clamp-2">
                        {hs.description || hs.treatmentDetails || `Comprehensive surgical procedure and specialized clinical treatment at ${hospital.name}.`}
                      </p>
                    </div>

                    <button
                      onClick={() => handleContactClick(hs.serviceId)}
                      disabled={isExhausted}
                      className="text-xs font-extrabold text-[#b02151] hover:text-[#921941] flex items-center pt-2 border-t border-gray-200/60 cursor-pointer"
                    >
                      <span>Enquire for {hs.service?.name}</span>
                      <ChevronRight className="w-3.5 h-3.5 ml-1" />
                    </button>
                  </div>
                ))}
              </div>
            </section>

            {/* Doctors & Specialists */}
            {doctors.length > 0 && (
              <section className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-gray-100 space-y-5">
                <h2 className="text-xl font-extrabold text-gray-900 border-b border-gray-100 pb-3 flex items-center">
                  <UserCheck className="w-6 h-6 text-[#b02151] mr-2" />
                  Specialists & Medical Team
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {doctors.map((doc: any, idx: number) => (
                    <div key={idx} className="p-5 bg-slate-50 rounded-2xl border border-gray-200 flex items-start space-x-4">
                      <div className="w-14 h-14 rounded-2xl bg-[#b02151] text-white flex items-center justify-center font-extrabold text-xl flex-shrink-0 shadow-md">
                        {doc.name ? doc.name.replace('Dr.', '').trim()[0] : 'D'}
                      </div>
                      <div className="space-y-1">
                        <h4 className="font-extrabold text-gray-900 text-base">{doc.name}</h4>
                        <p className="text-xs text-[#b02151] font-bold">{doc.specialty || doc.qualification}</p>
                        {doc.qualification && <p className="text-xs text-gray-500 font-medium">{doc.qualification}</p>}
                        {doc.experience && <p className="text-xs text-gray-600 font-extrabold">{doc.experience} Experience</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Hospital Facilities & Amenities */}
            {facilities.length > 0 && (
              <section className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-gray-100 space-y-4">
                <h2 className="text-xl font-extrabold text-gray-900 border-b border-gray-100 pb-3 flex items-center">
                  <Sparkles className="w-6 h-6 text-[#b02151] mr-2" />
                  Hospital Facilities & Amenities
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {facilities.map((fac: string, idx: number) => (
                    <div key={idx} className="p-3.5 bg-pink-50/50 rounded-xl border border-pink-100 flex items-center text-xs font-extrabold text-gray-800">
                      <CheckCircle2 className="w-4 h-4 text-[#b02151] mr-2 flex-shrink-0" />
                      <span>{fac}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Location & Street Map */}
            <section className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-gray-100 space-y-4">
              <div className="border-b border-gray-100 pb-3 flex items-center justify-between">
                <h2 className="text-xl font-extrabold text-gray-900 flex items-center">
                  <MapPin className="w-6 h-6 text-[#b02151] mr-2" />
                  Hospital Address & Street Map
                </h2>
                <span className="text-xs font-bold text-gray-500">{hospital.city}, {hospital.state || 'Punjab'}</span>
              </div>

              <p className="text-xs text-gray-700 font-medium">
                <strong>Exact Address:</strong> {hospital.address}, {hospital.city}, {hospital.state || 'Punjab'}, India
              </p>

              <div className="rounded-2xl border border-gray-200 overflow-hidden h-64 w-full relative">
                <iframe
                  title="Hospital Google Map"
                  width="100%"
                  height="100%"
                  frameBorder="0"
                  scrolling="no"
                  src={`https://maps.google.com/maps?q=${encodeURIComponent(
                    `${hospital.name}, ${hospital.address}, ${hospital.city}`
                  )}&t=m&z=15&output=embed`}
                  className="w-full h-full border-0"
                />
              </div>
            </section>

            {/* FAQs */}
            {faqs.length > 0 && (
              <section className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-gray-100 space-y-4">
                <h2 className="text-xl font-extrabold text-gray-900 border-b border-gray-100 pb-3 flex items-center">
                  <HelpCircle className="w-6 h-6 text-[#b02151] mr-2" />
                  Frequently Asked Questions
                </h2>
                <div className="space-y-3">
                  {faqs.map((faq: any, index: number) => (
                    <div key={index} className="p-4 bg-slate-50 rounded-2xl border border-gray-200 space-y-1">
                      <h4 className="font-extrabold text-gray-900 text-sm">{faq.question}</h4>
                      <p className="text-xs text-gray-600 leading-relaxed font-medium">{faq.answer}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Right 4 Columns Sidebar: Live Patient Enquiry Form */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white p-6 rounded-3xl shadow-xl border border-gray-200 space-y-5 sticky top-20">
              <div className="border-b border-gray-100 pb-3">
                <span className="text-[10px] font-extrabold tracking-widest text-[#fd1d74] uppercase block mb-1">
                  DIRECT CONSULTATION
                </span>
                <h3 className="text-lg font-extrabold text-gray-900 flex items-center">
                  <Send className="w-5 h-5 text-[#b02151] mr-2" />
                  Instant Patient Enquiry
                </h3>
              </div>

              {formSuccess ? (
                <div className="p-6 bg-emerald-50 border border-emerald-200 text-center space-y-3 rounded-2xl">
                  <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
                  <h4 className="font-extrabold text-gray-900 text-base">Enquiry Sent!</h4>
                  <p className="text-xs text-gray-600 font-medium">
                    Your consultation query has been submitted directly to <strong>{hospital.name}</strong>.
                  </p>
                  <button
                    onClick={() => setFormSuccess(false)}
                    className="text-xs font-extrabold text-[#b02151] underline pt-2"
                  >
                    Submit Another Query
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSidebarSubmit} className="space-y-4">
                  {formError && (
                    <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center space-x-2">
                      <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                      <span>{formError}</span>
                    </div>
                  )}

                  <div>
                    <label className="block text-[11px] font-extrabold text-gray-700 uppercase mb-1">
                      Patient Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={sidebarName}
                      onChange={(e) => setSidebarName(e.target.value)}
                      placeholder="Your Full Name"
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:outline-none focus:border-[#fd1d74]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-extrabold text-gray-700 uppercase mb-1">
                        Phone *
                      </label>
                      <input
                        type="tel"
                        required
                        value={sidebarPhone}
                        onChange={(e) => setSidebarPhone(e.target.value)}
                        placeholder="+91 Mobile"
                        className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:outline-none focus:border-[#fd1d74]"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-extrabold text-gray-700 uppercase mb-1">
                        Email *
                      </label>
                      <input
                        type="email"
                        required
                        value={sidebarEmail}
                        onChange={(e) => setSidebarEmail(e.target.value)}
                        placeholder="your@email.com"
                        className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:outline-none focus:border-[#fd1d74]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-extrabold text-gray-700 uppercase mb-1">
                      Your City *
                    </label>
                    <input
                      type="text"
                      required
                      value={sidebarCity}
                      onChange={(e) => setSidebarCity(e.target.value)}
                      placeholder="e.g. Ludhiana, Jalandhar"
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:outline-none focus:border-[#fd1d74]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-extrabold text-gray-700 uppercase mb-1">
                      Medical Service Needed *
                    </label>
                    <select
                      required
                      value={sidebarServiceId}
                      onChange={(e) => setSidebarServiceId(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900 focus:outline-none focus:border-[#fd1d74] cursor-pointer"
                    >
                      <option value="" disabled>
                        Select Specialty ({services.length} Available)
                      </option>
                      {services.map((s: any) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-extrabold text-gray-700 uppercase mb-1">
                      Preferred Time
                    </label>
                    <select
                      value={sidebarTime}
                      onChange={(e) => setSidebarTime(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:outline-none focus:border-[#fd1d74]"
                    >
                      <option value="Morning (9 AM - 12 PM)">Morning (9 AM - 12 PM)</option>
                      <option value="Afternoon (12 PM - 4 PM)">Afternoon (12 PM - 4 PM)</option>
                      <option value="Evening (4 PM - 8 PM)">Evening (4 PM - 8 PM)</option>
                      <option value="Anytime">Anytime</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-extrabold text-gray-700 uppercase mb-1">
                      Message
                    </label>
                    <textarea
                      rows={2}
                      value={sidebarMessage}
                      onChange={(e) => setSidebarMessage(e.target.value)}
                      placeholder="Describe your treatment query..."
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:outline-none focus:border-[#fd1d74] resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={formLoading || isExhausted}
                    className="w-full py-3.5 bg-[#b02151] hover:bg-[#921941] text-white text-xs font-extrabold uppercase tracking-wider rounded-xl shadow-lg transition-all flex items-center justify-center space-x-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {formLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Sending Query...</span>
                      </>
                    ) : (
                      <span>Submit Query to Hospital</span>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Lightbox Photo Preview Modal */}
      {activeGalleryIndex !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
          <button
            onClick={() => setActiveGalleryIndex(null)}
            className="absolute top-6 right-6 p-3 rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors z-50 cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>

          <div className="relative max-w-4xl w-full h-[75vh] rounded-3xl overflow-hidden border border-white/20">
            <Image
              src={gallery[activeGalleryIndex]}
              alt={`${hospital.name} Gallery Photo`}
              fill
              unoptimized
              className="object-contain"
            />
          </div>

          <div className="absolute bottom-6 text-center text-white text-xs font-extrabold bg-black/60 px-4 py-2 rounded-full border border-white/20">
            Photo {activeGalleryIndex + 1} of {gallery.length} • {hospital.name}
          </div>
        </div>
      )}

      <EnquiryModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        hospitalId={hospital.id}
        hospitalName={hospital.name}
        defaultServiceId={selectedServiceId}
        servicesList={services}
      />
    </main>
  );
}
