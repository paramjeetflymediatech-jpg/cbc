'use client';

import React, { useState, useRef } from 'react';
import Image from 'next/image';
import { MapPin, Phone, Globe, Star, ShieldCheck, Stethoscope, UserCheck, HelpCircle, PhoneCall, ChevronRight, CheckCircle2, AlertCircle, Loader2, Sparkles, Building2, Send, Clock, Map, Image as ImageIcon, X, ExternalLink, Tag } from 'lucide-react';
import EnquiryModal from '@/components/ui/EnquiryModal';

interface HospitalDetailClientProps {
  hospital: any;
  initialServiceId?: number;
}

export default function HospitalDetailClient({ hospital, initialServiceId }: HospitalDetailClientProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'services' | 'doctors' | 'facilities' | 'gallery' | 'faqs' | 'map' | 'reviews'>('overview');
  const [googleReviews, setGoogleReviews] = useState<any[]>(hospital.googleReviews || []);
  const [isSyncingReviews, setIsSyncingReviews] = useState(false);
  const [syncedRating, setSyncedRating] = useState<number>(hospital.googleRating || hospital.rating || 4.8);
  const [syncedReviewsCount, setSyncedReviewsCount] = useState<number>(hospital.googleReviewsCount || 0);
  const [visibleReviewsCount, setVisibleReviewsCount] = useState<number>(3);

  const handleSyncGoogleReviews = async () => {
    setIsSyncingReviews(true);
    try {
      const res = await fetch('/api/hospital/fetch-google-rating', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hospitalId: hospital.id, query: `${hospital.name} ${hospital.city}` }),
      });
      const data = await res.json();
      if (data.googleReviews) {
        setGoogleReviews(data.googleReviews);
        setSyncedRating(data.googleRating || 4.8);
        setSyncedReviewsCount(data.googleReviewsCount || 0);
        alert('Google Reviews and ratings synced successfully!');
      } else {
        alert(data.message || 'Ratings synced, but no reviews were returned.');
      }
    } catch (err) {
      console.error(err);
      alert('Failed to sync Google Reviews. Please ensure you are logged in.');
    } finally {
      setIsSyncingReviews(false);
    }
  };

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedServiceId, setSelectedServiceId] = useState<number | undefined>(initialServiceId);
  const [selectedOfferedServiceId, setSelectedOfferedServiceId] = useState<number | null>(null);
  const [modalInitialMessage, setModalInitialMessage] = useState('');
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

  // Doctor Review Modal State
  const [doctorsList, setDoctorsList] = useState<any[]>(hospital.doctors || []);
  const [activeDoctorModal, setActiveDoctorModal] = useState<any | null>(null);
  const [patientReviewerName, setPatientReviewerName] = useState('');
  const [patientRating, setPatientRating] = useState(5);
  const [patientComment, setPatientComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState('');
  const [reviewSuccess, setReviewSuccess] = useState('');

  const reviewsSectionRef = useRef<HTMLDivElement>(null);
  const reviewsListRef = useRef<HTMLDivElement>(null);

  const handleDoctorReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeDoctorModal || !patientReviewerName.trim() || !patientComment.trim()) {
      setReviewError('Please provide your name and review comments.');
      return;
    }

    setSubmittingReview(true);
    setReviewError('');
    setReviewSuccess('');

    try {
      const res = await fetch('/api/doctor-review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hospitalId: hospital.id,
          doctorName: activeDoctorModal.name,
          patientName: patientReviewerName,
          rating: patientRating,
          comment: patientComment,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setReviewSuccess('Thank you! Your patient review has been posted.');
        const newReviewObj = {
          id: Date.now(),
          patientName: patientReviewerName,
          rating: patientRating,
          comment: patientComment,
          date: new Date().toISOString(),
          isNew: true,
        };

        setPatientReviewerName('');
        setPatientComment('');
        setPatientRating(5);

        // Update active doctor modal state live
        if (activeDoctorModal) {
          const existingReviews = activeDoctorModal.reviews || [];
          const updatedReviews = [newReviewObj, ...existingReviews];
          const avgRating = (updatedReviews.reduce((sum: number, r: any) => sum + (r.rating || 5), 0) / updatedReviews.length).toFixed(1);
          const updatedDoc = {
            ...activeDoctorModal,
            reviews: updatedReviews,
            rating: Number(avgRating),
          };
          setActiveDoctorModal(updatedDoc);
          setDoctorsList((prev) => prev.map((d: any) => d.name === activeDoctorModal.name ? updatedDoc : d));
        }

        if (data.doctors) {
          setDoctorsList(data.doctors);
        }

        // Immediately scroll to the newly added review in the list below
        setTimeout(() => {
          if (reviewsSectionRef.current) {
            reviewsSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
          if (reviewsListRef.current) {
            reviewsListRef.current.scrollTop = 0;
          }
        }, 150);
      } else {
        setReviewError(data.error || 'Failed to submit review.');
      }
    } catch {
      setReviewError('An unexpected error occurred while posting your review.');
    } finally {
      setSubmittingReview(false);
    }
  };

  const isExhausted = (hospital.leadsRemaining || 0) <= 0;
  const hospitalServicesList = hospital.hospitalServices || [];
  const services = hospitalServicesList.map((hs: any) => hs.service).filter(Boolean);
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
    setModalInitialMessage('');
    setIsModalOpen(true);
  };

  const handleSubServiceClick = (serviceId?: number, subName?: string) => {
    if (serviceId) setSelectedServiceId(serviceId);
    if (subName) {
      setModalInitialMessage(`Interested in ${subName} procedure at ${hospital.name}.`);
    } else {
      setModalInitialMessage('');
    }
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
            <span className="text-gray-300">{hospital.city || 'City'}</span>
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
                  {Boolean((hospital as any).isNabhAccredited) && (
                    <span className="bg-slate-800/90 text-white text-xs font-bold px-3.5 py-1 rounded-full border border-slate-700 shadow-xs">
                      NABH Accredited
                    </span>
                  )}
                  {Boolean((hospital as any).isVerifiedPartner) && (
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
                className={`w-full md:w-auto px-8 py-4 rounded-2xl text-sm font-extrabold uppercase tracking-wider transition-all shadow-2xl flex items-center justify-center space-x-2.5 cursor-pointer ${isExhausted
                    ? 'bg-gray-800 text-gray-500 cursor-not-allowed border border-gray-700'
                    : 'bg-[#b02151] hover:bg-[#921941] text-white shadow-pink-900/40'
                  }`}
              >
                <PhoneCall className="w-5 h-5" />
                <span>{isExhausted ? 'Enquiries Paused' : 'Book Direct Consultation'}</span>
              </button>

              <div className="text-xs text-pink-200 font-bold">
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
              className={`px-4 py-2.5 rounded-xl transition-all whitespace-nowrap cursor-pointer ${activeTab === 'overview' ? 'bg-pink-50 text-[#b02151] shadow-xs border border-pink-100' : 'hover:text-gray-900'
                }`}
            >
              Overview
            </button>

            <button
              onClick={() => setActiveTab('services')}
              className={`px-4 py-2.5 rounded-xl transition-all whitespace-nowrap cursor-pointer ${activeTab === 'services' ? 'bg-pink-50 text-[#b02151] shadow-xs border border-pink-100' : 'hover:text-gray-900'
                }`}
            >
              Medical Services ({hospitalServicesList.length || services.length})
            </button>

            <button
              onClick={() => setActiveTab('doctors')}
              className={`px-4 py-2.5 rounded-xl transition-all whitespace-nowrap cursor-pointer ${activeTab === 'doctors' ? 'bg-pink-50 text-[#b02151] shadow-xs border border-pink-100' : 'hover:text-gray-900'
                }`}
            >
              Doctors & Specialists ({doctorsList.length})
            </button>

            <button
              onClick={() => setActiveTab('gallery')}
              className={`px-4 py-2.5 rounded-xl transition-all whitespace-nowrap cursor-pointer flex items-center space-x-1 ${activeTab === 'gallery' ? 'bg-pink-50 text-[#b02151] shadow-xs border border-pink-100' : 'hover:text-gray-900'
                }`}
            >
              <ImageIcon className="w-3.5 h-3.5 text-[#b02151] mr-1" />
              <span>Photo Gallery ({gallery.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('facilities')}
              className={`px-4 py-2.5 rounded-xl transition-all whitespace-nowrap cursor-pointer ${activeTab === 'facilities' ? 'bg-pink-50 text-[#b02151] shadow-xs border border-pink-100' : 'hover:text-gray-900'
                }`}
            >
              Facilities
            </button>

            <button
              onClick={() => setActiveTab('faqs')}
              className={`px-4 py-2.5 rounded-xl transition-all whitespace-nowrap cursor-pointer ${activeTab === 'faqs' ? 'bg-pink-50 text-[#b02151] shadow-xs border border-pink-100' : 'hover:text-gray-900'
                }`}
            >
              Patient FAQs
            </button>

            <button
              onClick={() => setActiveTab('map')}
              className={`px-4 py-2.5 rounded-xl transition-all whitespace-nowrap cursor-pointer flex items-center space-x-1 ${activeTab === 'map' ? 'bg-pink-50 text-[#b02151] shadow-xs border border-pink-100' : 'hover:text-gray-900'
                }`}
            >
              <Map className="w-3.5 h-3.5 text-[#b02151] mr-1" />
              <span>Location Map</span>
            </button>

            <button
              onClick={() => setActiveTab('reviews')}
              className={`px-4 py-2.5 rounded-xl transition-all whitespace-nowrap cursor-pointer flex items-center space-x-1 ${activeTab === 'reviews' ? 'bg-pink-50 text-[#b02151] shadow-xs border border-pink-100' : 'hover:text-gray-900'
                }`}
            >
              <Star className="w-3.5 h-3.5 text-[#b02151] mr-1" />
              <span>Reviews ({googleReviews.length || syncedReviewsCount || 0})</span>
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
            {/* Overview Section (About Hospital) */}
            {activeTab === 'overview' && (
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
                <div
                  className="prose max-w-none text-gray-700 text-sm leading-relaxed font-medium space-y-3
                    [&_h2]:text-xl [&_h2]:font-extrabold [&_h2]:text-gray-900 [&_h2]:mt-4 [&_h2]:mb-2 [&_h2]:border-b [&_h2]:border-pink-100 [&_h2]:pb-1
                    [&_h3]:text-lg [&_h3]:font-bold [&_h3]:text-[#b02151] [&_h3]:mt-3 [&_h3]:mb-1
                    [&_p]:mb-2 [&_p]:leading-relaxed
                    [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1
                    [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:space-y-1
                    [&_blockquote]:border-l-4 [&_blockquote]:border-[#b02151] [&_blockquote]:bg-pink-50/60 [&_blockquote]:p-3 [&_blockquote]:rounded-r-xl [&_blockquote]:italic
                    [&_img]:max-w-full [&_img]:h-auto [&_img]:rounded-xl [&_img]:my-3"
                  dangerouslySetInnerHTML={{ __html: hospital.description }}
                />
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
            {(activeTab === 'overview' || activeTab === 'services') && (hospital.hospitalServices || []).length > 0 && (() => {
              const hospitalServicesList = hospital.hospitalServices || [];

              return (
                <section className="bg-white p-5 sm:p-8 rounded-3xl shadow-sm border border-gray-100 space-y-6">
                  <div className="border-b border-gray-100 pb-4 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="p-2.5 bg-pink-50 rounded-2xl border border-pink-100">
                        <Stethoscope className="w-6 h-6 text-[#b02151]" />
                      </div>
                      <div>
                        <h2 className="text-lg sm:text-xl font-black text-gray-900">
                          Offered Medical Services & Treatments
                        </h2>
                        <p className="text-xs text-gray-500 font-medium mt-0.5">
                          Tap any medical service below to view its sub-services
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Accordion Services List (Sub-services expand directly below each service) */}
                  <div className="space-y-3">
                    {hospitalServicesList.map((hs: any, index: number) => {
                      // Default first service to open if no selection made
                      const isExpanded = selectedOfferedServiceId !== null
                        ? selectedOfferedServiceId === hs.id
                        : index === 0;

                      const subList = hs.subServices
                        ? hs.subServices.split(',').map((s: string) => s.trim()).filter(Boolean)
                        : [];

                      return (
                        <div
                          key={hs.id}
                          className="border border-gray-200/90 rounded-2xl overflow-hidden transition-all shadow-2xs"
                        >
                          {/* Service Header / Button */}
                          <button
                            type="button"
                            onClick={() => setSelectedOfferedServiceId(isExpanded ? 0 : hs.id)}
                            className={`w-full p-3.5 sm:p-4 text-left font-black text-sm sm:text-base flex items-center justify-between transition-all cursor-pointer ${
                              isExpanded
                                ? 'bg-[#b02151] text-white shadow-md'
                                : 'bg-slate-50/90 text-gray-900 hover:bg-pink-50/60 hover:text-[#b02151]'
                            }`}
                          >
                            <div className="flex items-center space-x-2.5 min-w-0 pr-2">
                              <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${isExpanded ? 'bg-white' : 'bg-[#b02151]'}`} />
                              <span className="truncate">{hs.service?.name}</span>
                              {subList.length > 0 && (
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                  isExpanded ? 'bg-white/20 text-white' : 'bg-pink-100 text-[#b02151]'
                                }`}>
                                  {subList.length} procedures
                                </span>
                              )}
                            </div>

                            <ChevronRight className={`w-5 h-5 flex-shrink-0 transition-transform duration-200 ${isExpanded ? 'rotate-90 text-white' : 'text-gray-400'}`} />
                          </button>

                          {/* Sub-Services Dropdown Card (Expands directly below this service button) */}
                          {isExpanded && (
                            <div className="p-4 sm:p-5 bg-gradient-to-br from-pink-50/30 via-slate-50 to-white border-t border-pink-100 space-y-3 animate-fadeIn">
                              {subList.length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                                  {subList.map((subName: string, idx: number) => (
                                    <button
                                      key={idx}
                                      type="button"
                                      onClick={() => handleSubServiceClick(hs.serviceId, subName)}
                                      className="p-3 bg-white border border-gray-200/80 rounded-xl font-extrabold text-xs text-gray-900 flex items-center justify-between shadow-2xs hover:border-[#b02151] hover:bg-pink-50/60 hover:text-[#b02151] transition-all cursor-pointer group/sub text-left"
                                    >
                                      <div className="flex items-center space-x-2">
                                        <span className="text-[#b02151] font-black text-sm">»</span>
                                        <span>{subName}</span>
                                      </div>
                                      <span className="text-[10px] font-bold text-gray-400 group-hover/sub:text-[#b02151] group-hover/sub:translate-x-0.5 transition-all">
                                        Enquire →
                                      </span>
                                    </button>
                                  ))}
                                </div>
                              ) : (
                                <div className="text-xs font-semibold text-gray-500 italic py-1">
                                  No sub-services listed for {hs.service?.name}.
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </section>
              );
            })()}

            {/* Doctors & Specialists */}
            {(activeTab === 'overview' || activeTab === 'doctors') && doctorsList.length > 0 && (
              <section className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-gray-100 space-y-5">
                <div className="border-b border-gray-100 pb-3 flex items-center justify-between">
                  <h2 className="text-xl font-extrabold text-gray-900 flex items-center">
                    <UserCheck className="w-6 h-6 text-[#b02151] mr-2" />
                    Specialists & Medical Team
                  </h2>
                  <span className="text-xs font-bold text-gray-500">
                    {doctorsList.length} Verified Doctors
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {doctorsList.map((doc: any, idx: number) => {
                    const reviewCount = doc.reviews?.length || 0;
                    const docRating = doc.rating || (reviewCount > 0 ? (doc.reviews.reduce((s: number, r: any) => s + (r.rating || 5), 0) / reviewCount).toFixed(1) : 5.0);

                    return (
                      <div key={idx} className="p-5 bg-slate-50 rounded-2xl border border-gray-200 flex flex-col justify-between hover:shadow-md transition-all space-y-3">
                        <div className="flex items-start space-x-4">
                          <div className="w-14 h-14 rounded-2xl bg-[#b02151] text-white flex items-center justify-center font-extrabold text-xl flex-shrink-0 shadow-md overflow-hidden relative">
                            {doc.image ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={doc.image} alt={doc.name} className="w-full h-full object-cover" />
                            ) : (
                              <span>{doc.name ? doc.name.replace('Dr.', '').trim()[0] : 'D'}</span>
                            )}
                          </div>
                          <div className="space-y-1 min-w-0 flex-1">
                            <div className="flex items-center justify-between">
                              <h4 className="font-extrabold text-gray-900 text-base truncate">{doc.name}</h4>
                              <div className="flex items-center space-x-1 bg-amber-50 border border-amber-200/60 px-2 py-0.5 rounded-full flex-shrink-0">
                                <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                                <span className="text-[11px] font-black text-amber-800">{docRating}</span>
                              </div>
                            </div>
                            <p className="text-xs text-[#b02151] font-bold">{doc.specialty || doc.qualification}</p>
                            {doc.qualification && <p className="text-xs text-gray-500 font-medium">{doc.qualification}</p>}
                            {doc.experience && <p className="text-xs text-gray-600 font-extrabold">{doc.experience} Experience</p>}
                            {doc.about && <p className="text-xs text-gray-600 italic bg-pink-50/50 p-2 rounded-lg border border-pink-100 mt-1">&ldquo;{doc.about}&rdquo;</p>}
                            {doc.treatments && doc.treatments.length > 0 && (
                              <div className="pt-1.5">
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                                  Treatments:
                                </span>
                                <div className="flex flex-wrap gap-1">
                                  {doc.treatments.map((tr: string, tIdx: number) => (
                                    <span
                                      key={tIdx}
                                      className="px-2 py-0.5 bg-pink-100/80 text-[#b02151] font-bold text-[10px] rounded-md border border-pink-200"
                                    >
                                      {tr}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Doctor Profile & Reviews Trigger */}
                        <div className="pt-2 border-t border-gray-200/70 flex items-center justify-between">
                          <span className="text-[11px] text-gray-500 font-semibold">
                            {reviewCount > 0 ? `${reviewCount} Patient Review${reviewCount > 1 ? 's' : ''}` : 'No reviews yet'}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setActiveDoctorModal(doc);
                              setReviewError('');
                              setReviewSuccess('');
                            }}
                            className="px-3 py-1.5 bg-[#b02151] hover:bg-[#921941] text-white rounded-xl text-xs font-extrabold shadow-xs transition-all flex items-center space-x-1 cursor-pointer"
                          >
                            <Star className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
                            <span>Profile & Reviews</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Hospital Facilities & Amenities */}
            {(activeTab === 'overview' || activeTab === 'facilities') && facilities.length > 0 && (
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
            {(activeTab === 'overview' || activeTab === 'map') && (
              <section className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-gray-100 space-y-4">
                <div className="border-b border-gray-100 pb-3 flex items-center justify-between flex-wrap gap-2">
                  <h2 className="text-xl font-extrabold text-gray-900 flex items-center">
                    <MapPin className="w-6 h-6 text-[#b02151] mr-2" />
                    Hospital Address & Street Map
                  </h2>
                  <span className="text-xs font-bold text-gray-500">{hospital.city}, {hospital.state || 'Punjab'}</span>
                </div>

                <p className="text-xs text-gray-700 font-medium">
                  <strong>Exact Address:</strong> {hospital.address}, {hospital.city}, {hospital.state || 'Punjab'}, India
                </p>

                {(() => {
                  const placeId = (hospital as unknown as { googlePlaceId?: string }).googlePlaceId;
                  const mapQuery = placeId
                    ? `place_id:${placeId.trim()}`
                    : (() => {
                        const cleanBrand = (hospital.name || '')
                          .split('|')[0]
                          .split('–')[0]
                          .split('-')[0]
                          .replace(/[^\w\s,&-]/gi, '')
                          .trim();

                        let cleanAddr = (hospital.address || '')
                          .replace(/\b(near|opp|opposite|behind|above|next to)\s+[^,]+/gi, '')
                          .replace(/\b(modern tower|tower|building|flat|floor|block|room|shop)\b/gi, '')
                          .replace(/[^\w\s,&-]/gi, '')
                          .replace(/\s+/g, ' ')
                          .replace(/\s+,/g, ',')
                          .replace(/,\s*,/g, ',')
                          .trim();

                        const cityStr = hospital.city || '';
                        const stateStr = hospital.state || 'Punjab';

                        const addrHasCity = cleanAddr.toLowerCase().includes(cityStr.toLowerCase());
                        const addrHasState = cleanAddr.toLowerCase().includes(stateStr.toLowerCase());

                        const fullParts = [
                          cleanBrand && !cleanAddr.toLowerCase().includes(cleanBrand.toLowerCase()) ? cleanBrand : null,
                          cleanAddr,
                          !addrHasCity ? cityStr : null,
                          !addrHasState ? stateStr : null,
                          'India',
                        ].filter(Boolean);

                        return fullParts.join(', ');
                      })();

                  return (
                    <div className="space-y-2">
                      <div className="rounded-2xl border border-gray-200 overflow-hidden h-72 w-full relative shadow-inner bg-slate-100">
                        <iframe
                          title="Hospital Google Map Location"
                          width="100%"
                          height="100%"
                          frameBorder="0"
                          scrolling="no"
                          src={`https://maps.google.com/maps?q=${encodeURIComponent(mapQuery)}&t=m&z=16&output=embed`}
                          className="w-full h-full border-0"
                        />
                      </div>

                      <div className="pt-1">
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapQuery)}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center text-xs font-bold text-[#b02151] hover:text-[#921941] hover:underline"
                        >
                          <ExternalLink className="w-3.5 h-3.5 mr-1" />
                          <span>Open Location in Google Maps</span>
                        </a>
                      </div>
                    </div>
                  );
                })()}
              </section>
            )}

            {/* Google Reviews Tab Content */}
            {(activeTab === 'overview' || activeTab === 'reviews') && (
              <section className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-gray-100 space-y-6">
                <div className="border-b border-gray-100 pb-4 flex items-center">
                  <div className="flex items-center space-x-3">
                    <div className="p-2.5 bg-pink-50 rounded-2xl border border-pink-100">
                      <Star className="w-6 h-6 text-[#b02151]" />
                    </div>
                    <div>
                      <h2 className="text-xl font-extrabold text-gray-900">
                        Google Reviews & Patient Ratings
                      </h2>
                      <p className="text-xs text-gray-500 font-medium mt-0.5">
                        Verified ratings synced directly from Google Places
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Summary Metric */}
                  <div className="md:sticky md:top-24 h-fit bg-slate-50 border border-gray-100 p-6 rounded-2xl text-center space-y-2 flex flex-col justify-center items-center">
                    <span className="text-5xl font-black text-gray-900 leading-none">
                      {syncedRating}
                    </span>
                    <div className="flex text-amber-400 gap-0.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-4 h-4 fill-current ${
                            star <= Math.round(syncedRating) ? 'text-amber-400' : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-xs text-gray-500 font-bold">
                      Based on {googleReviews.length || syncedReviewsCount || 120} Google ratings
                    </p>
                  </div>

                  {/* Reviews List */}
                  <div className="md:col-span-2 space-y-4 max-h-[500px] overflow-y-auto pr-2 no-scrollbar">
                    {googleReviews && googleReviews.length > 0 ? (
                      <>
                        <div className="space-y-4">
                          {googleReviews.slice(0, visibleReviewsCount).map((rev: any, idx: number) => (
                            <div key={idx} className="p-4 bg-slate-50 border border-gray-100 rounded-2xl space-y-2">
                              <div className="flex items-center justify-between flex-wrap gap-2">
                                <div className="flex items-center space-x-2">
                                  {rev.profile_photo_url ? (
                                    <img
                                      src={rev.profile_photo_url}
                                      alt={rev.author_name}
                                      width={28}
                                      height={28}
                                      className="rounded-full w-7 h-7 object-cover"
                                    />
                                  ) : (
                                    <div className="w-7 h-7 bg-pink-100 text-pink-600 rounded-full flex items-center justify-center font-bold text-xs">
                                      {rev.author_name ? rev.author_name[0] : 'P'}
                                    </div>
                                  )}
                                  <span className="text-xs font-bold text-gray-900">{rev.author_name}</span>
                                </div>
                                <span className="text-[10px] text-gray-500 font-bold">
                                  {rev.relative_time_description || 'Recently'}
                                </span>
                              </div>

                              <div className="flex items-center space-x-0.5 text-amber-400">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <Star
                                    key={star}
                                    className={`w-3.5 h-3.5 fill-current ${
                                      star <= (rev.rating || 5) ? 'text-amber-400' : 'text-gray-300'
                                    }`}
                                  />
                                ))}
                              </div>

                              <p className="text-xs text-gray-700 leading-relaxed font-medium">
                                "{rev.text}"
                              </p>
                            </div>
                          ))}
                        </div>

                        {googleReviews.length > visibleReviewsCount ? (
                          <button
                            onClick={() => setVisibleReviewsCount((prev) => prev + 5)}
                            className="w-full text-center py-2.5 bg-slate-100 hover:bg-slate-200 text-gray-700 text-xs font-bold rounded-xl transition-all cursor-pointer block border border-gray-200"
                          >
                            Show More Reviews (+{googleReviews.length - visibleReviewsCount} remaining)
                          </button>
                        ) : (
                          visibleReviewsCount > 3 && (
                            <button
                              onClick={() => setVisibleReviewsCount(3)}
                              className="w-full text-center py-2.5 bg-slate-100 hover:bg-slate-200 text-gray-700 text-xs font-bold rounded-xl transition-all cursor-pointer block border border-gray-200"
                            >
                              Show Less
                            </button>
                          )
                        )}
                      </>
                    ) : (
                      <div className="p-8 text-center bg-slate-50 border border-dashed border-gray-200 rounded-2xl">
                        <Star className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                        <p className="text-xs text-gray-500 font-bold">No Google reviews loaded yet.</p>
                        <p className="text-[10px] text-gray-400 mt-1">
                          Click the "Sync Google Reviews" button above to fetch live ratings.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </section>
            )}

            {/* FAQs */}
            {(activeTab === 'overview' || activeTab === 'faqs') && faqs.length > 0 && (
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
                      Patient Name * <span className="text-[10px] text-gray-700 font-bold">(Max 50 chars)</span>
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={50}
                      value={sidebarName}
                      onChange={(e) => setSidebarName(e.target.value)}
                      placeholder="Your Full Name (Max 50 chars)"
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

      {/* Doctor Profile & Patient Reviews Modal */}
      {activeDoctorModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4">
          <div className="bg-white rounded-2xl sm:rounded-3xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-gray-100 relative">
            {/* Modal Header */}
            <div className="p-4 sm:p-6 bg-slate-900 text-white rounded-t-2xl sm:rounded-t-3xl relative flex items-start justify-between flex-shrink-0 gap-3">
              <div className="flex items-center space-x-3 sm:space-x-4 min-w-0">
                <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-[#b02151] text-white flex items-center justify-center font-black text-xl sm:text-2xl flex-shrink-0 shadow-lg overflow-hidden relative">
                  {activeDoctorModal.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={activeDoctorModal.image} alt={activeDoctorModal.name} className="w-full h-full object-cover" />
                  ) : (
                    <span>{activeDoctorModal.name ? activeDoctorModal.name.replace('Dr.', '').trim()[0] : 'D'}</span>
                  )}
                </div>

                <div className="space-y-0.5 min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                    <h3 className="text-base sm:text-xl font-extrabold text-white truncate">{activeDoctorModal.name}</h3>
                    <div className="flex items-center space-x-1 bg-amber-400/20 border border-amber-400/30 px-2 py-0.5 rounded-full flex-shrink-0">
                      <Star className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-400 fill-amber-400" />
                      <span className="text-[11px] sm:text-xs font-black text-amber-300">
                        {activeDoctorModal.rating || (activeDoctorModal.reviews?.length > 0 ? (activeDoctorModal.reviews.reduce((s: number, r: any) => s + (r.rating || 5), 0) / activeDoctorModal.reviews.length).toFixed(1) : '5.0')}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs font-bold text-pink-400 truncate">{activeDoctorModal.specialty || activeDoctorModal.qualification}</p>
                  <p className="text-[11px] text-gray-300 font-medium truncate">
                    {activeDoctorModal.qualification ? `${activeDoctorModal.qualification} • ` : ''}
                    {activeDoctorModal.experience ? `${activeDoctorModal.experience} Experience` : 'Accredited Specialist'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setActiveDoctorModal(null)}
                className="p-1.5 sm:p-2 text-gray-400 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-colors cursor-pointer flex-shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body (Scrollable) */}
            <div className="p-4 sm:p-6 space-y-5 overflow-y-auto flex-1">
              {/* Doctor Treatments */}
              {activeDoctorModal.treatments && activeDoctorModal.treatments.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-[11px] font-extrabold uppercase text-gray-700 tracking-wider">
                    Specialized Treatments Offered
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {activeDoctorModal.treatments.map((tr: string, i: number) => (
                      <span key={i} className="px-2.5 py-1 bg-pink-50 text-[#b02151] font-extrabold text-xs rounded-xl border border-pink-100">
                        {tr}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Submit Patient Review Form (On Top) */}
              <div className="bg-gradient-to-br from-slate-50 to-pink-50/30 p-4 sm:p-5 rounded-2xl border border-pink-100 space-y-3">
                <h5 className="text-xs font-extrabold uppercase text-[#b02151] tracking-wider flex items-center">
                  <Star className="w-4 h-4 text-[#b02151] mr-1.5" />
                  Leave a Review for {activeDoctorModal.name}
                </h5>

                {reviewSuccess && (
                  <div className="p-3 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-xl border border-emerald-200">
                    {reviewSuccess}
                  </div>
                )}

                {reviewError && (
                  <div className="p-3 bg-red-100 text-red-800 text-xs font-bold rounded-xl border border-red-200">
                    {reviewError}
                  </div>
                )}

                <form onSubmit={handleDoctorReviewSubmit} className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-extrabold uppercase text-gray-600 mb-1">
                        Your Full Name * <span className="text-[9px] text-gray-700 font-bold">(Max 50 chars)</span>
                      </label>
                      <input
                        type="text"
                        required
                        maxLength={50}
                        value={patientReviewerName}
                        onChange={(e) => setPatientReviewerName(e.target.value)}
                        placeholder="e.g. Ramesh Kumar"
                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#b02151]"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-extrabold uppercase text-gray-600 mb-1">
                        Star Rating *
                      </label>
                      <div className="flex items-center space-x-1 py-1 flex-wrap">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setPatientRating(star)}
                            className="p-1 focus:outline-none cursor-pointer hover:scale-110 transition-transform"
                          >
                            <Star
                              className={`w-4 h-4 sm:w-5 sm:h-5 ${
                                star <= patientRating
                                  ? 'text-amber-500 fill-amber-500'
                                  : 'text-gray-300'
                              }`}
                            />
                          </button>
                        ))}
                        <span className="text-xs font-bold text-gray-700 ml-1.5">{patientRating} / 5</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-extrabold uppercase text-gray-600 mb-1">
                      Patient Experience & Review *
                    </label>
                    <textarea
                      rows={2}
                      required
                      value={patientComment}
                      onChange={(e) => setPatientComment(e.target.value)}
                      placeholder={`Share your experience regarding treatment, diagnosis, or consultation with ${activeDoctorModal.name}...`}
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-medium focus:outline-none focus:border-[#b02151] resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submittingReview}
                    className="w-full py-2.5 bg-[#b02151] hover:bg-[#921941] text-white rounded-xl text-xs font-extrabold shadow-md transition-all flex items-center justify-center space-x-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {submittingReview ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Posting Review...</span>
                      </>
                    ) : (
                      <span>Submit Patient Review</span>
                    )}
                  </button>
                </form>
              </div>

              {/* Patient Reviews Section Header & Listing (Below) */}
              <div ref={reviewsSectionRef} className="border-t border-gray-100 pt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm sm:text-base font-extrabold text-gray-900 flex items-center">
                    <Star className="w-4 h-4 sm:w-5 sm:h-5 text-amber-500 fill-amber-500 mr-2" />
                    <span>Patient Reviews & Ratings ({activeDoctorModal.reviews?.length || 0})</span>
                  </h4>
                </div>

                {/* Patient Reviews List */}
                <div ref={reviewsListRef} className="space-y-3 max-h-56 overflow-y-auto pr-1">
                  {activeDoctorModal.reviews && activeDoctorModal.reviews.length > 0 ? (
                    activeDoctorModal.reviews.map((rev: any, rIdx: number) => (
                      <div
                        key={rev.id || rIdx}
                        className="p-3.5 sm:p-4 bg-slate-50 border border-gray-200 rounded-2xl space-y-2"
                      >
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <div className="flex items-center space-x-2">
                            <div className="w-7 h-7 rounded-full bg-pink-100 text-[#b02151] font-bold text-xs flex items-center justify-center">
                              {rev.patientName ? rev.patientName[0].toUpperCase() : 'P'}
                            </div>
                            <div>
                              <span className="font-extrabold text-gray-900 text-xs block">{rev.patientName}</span>
                              <span className="text-xs text-gray-600 font-semibold">
                                {rev.date ? new Date(rev.date).toLocaleDateString() : 'Verified Patient'}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center space-x-0.5">
                            {Array.from({ length: 5 }).map((_, s) => (
                              <Star
                                key={s}
                                className={`w-3 h-3 sm:w-3.5 sm:h-3.5 ${
                                  s < (rev.rating || 5)
                                    ? 'text-amber-500 fill-amber-500'
                                    : 'text-gray-300'
                                }`}
                              />
                            ))}
                          </div>
                        </div>

                        <p className="text-xs text-gray-700 leading-relaxed font-medium sm:pl-9">
                          &ldquo;{rev.comment}&rdquo;
                        </p>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 sm:p-6 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200 text-xs text-gray-500">
                      No patient reviews submitted yet for {activeDoctorModal.name}. Be the first to leave feedback above!
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <EnquiryModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        hospitalId={hospital.id}
        hospitalName={hospital.name}
        defaultServiceId={selectedServiceId}
        initialMessage={modalInitialMessage}
        servicesList={services}
      />
    </main>
  );
}
