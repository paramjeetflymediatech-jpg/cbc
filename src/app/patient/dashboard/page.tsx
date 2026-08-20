'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import {
  Building2,
  Users,
  MapPin,
  Phone,
  Mail,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ShieldCheck,
  Search,
  KeyRound,
  FileText,
  MessageSquare,
  ChevronRight,
  LogOut,
  ExternalLink,
  Star,
  Sparkles,
  Stethoscope,
  Filter,
} from 'lucide-react';

interface HospitalInfo {
  id: number;
  name: string;
  slug?: string;
  city?: string;
  state?: string;
  district?: string;
  address?: string;
  image?: string;
  phone?: string;
  email?: string;
  rating?: number;
  specialties?: string[];
  isNabhAccredited?: boolean;
  isVerifiedPartner?: boolean;
}

interface ServiceInfo {
  id: number;
  name: string;
  slug?: string;
  category?: string;
  image?: string;
  icon?: string;
}

interface LeadNote {
  content: string;
  author: string;
  createdAt: string;
}

interface LeadItem {
  id: number;
  userId: number;
  patientName: string;
  phone: string;
  email: string;
  city?: string;
  serviceId: number;
  hospitalId: number;
  message?: string;
  preferredContactTime?: string;
  status: 'NEW' | 'CONTACTED' | 'IN_PROGRESS' | 'CONVERTED' | 'CLOSED' | 'UNASSIGNED';
  notes?: LeadNote[];
  createdAt: string;
  updatedAt: string;
  hospital?: HospitalInfo;
  service?: ServiceInfo;
}

export default function PatientDashboard() {
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<'enquiries' | 'profile'>('enquiries');
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState({
    totalEnquiries: 0,
    totalHospitalsContacted: 0,
    activeEnquiries: 0,
    resolvedEnquiries: 0,
  });
  const [leads, setLeads] = useState<LeadItem[]>([]);
  const [selectedHospitalFilter, setSelectedHospitalFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  // Profile Form States
  const [profileName, setProfileName] = useState('');
  const [profilePhone, setProfilePhone] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Reset page when filter or search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedHospitalFilter, searchQuery, pageSize]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // 1. Fetch user profile & stats
      const profileRes = await fetch('/api/user/profile');
      if (profileRes.status === 401) {
        router.push('/login?redirect=/patient/dashboard');
        return;
      }
      const profileData = await profileRes.json();
      if (profileData.user) {
        setUser(profileData.user);
        setProfileName(profileData.user.name || '');
        setProfilePhone(profileData.user.phone || '');
        if (profileData.stats) setStats(profileData.stats);
      }

      // 2. Fetch user enquiries
      const enquiriesRes = await fetch('/api/enquiries');
      if (enquiriesRes.ok) {
        const enquiriesData = await enquiriesRes.json();
        if (enquiriesData.leads) {
          setLeads(enquiriesData.leads);
        }
      }
    } catch (err) {
      console.error('Error fetching patient dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
    } catch {
      router.push('/login');
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMsg(null);

    if (newPassword && newPassword !== confirmPassword) {
      setProfileMsg({ type: 'error', text: 'New passwords do not match.' });
      return;
    }

    setProfileSaving(true);
    try {
      const res = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: profileName,
          phone: profilePhone,
          ...(newPassword ? { currentPassword, newPassword } : {}),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setProfileMsg({ type: 'error', text: data.error || 'Failed to update profile.' });
      } else {
        setProfileMsg({ type: 'success', text: data.message || 'Profile updated successfully!' });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        if (data.user) {
          setUser((prev: any) => ({ ...prev, ...data.user }));
        }
      }
    } catch {
      setProfileMsg({ type: 'error', text: 'Network error updating profile.' });
    } finally {
      setProfileSaving(false);
    }
  };

  // Group unique hospitals for filter buttons
  const uniqueHospitalsMap = new Map<string, { id: number; name: string; count: number }>();
  leads.forEach((l) => {
    const hName = l.hospital?.name || 'General Platform';
    const hId = l.hospitalId || 0;
    if (!uniqueHospitalsMap.has(hName)) {
      uniqueHospitalsMap.set(hName, { id: hId, name: hName, count: 1 });
    } else {
      uniqueHospitalsMap.get(hName)!.count += 1;
    }
  });
  const uniqueHospitals = Array.from(uniqueHospitalsMap.values());

  // Filtered leads
  const filteredLeads = leads.filter((l) => {
    const hName = l.hospital?.name || 'General Platform';
    const matchesHospital = selectedHospitalFilter === 'ALL' || hName === selectedHospitalFilter;

    const q = searchQuery.toLowerCase().trim();
    if (!q) return matchesHospital;

    const matchesSearch =
      (l.hospital?.name || '').toLowerCase().includes(q) ||
      (l.hospital?.city || '').toLowerCase().includes(q) ||
      (l.service?.name || '').toLowerCase().includes(q) ||
      (l.message || '').toLowerCase().includes(q) ||
      (l.patientName || '').toLowerCase().includes(q);

    return matchesHospital && matchesSearch;
  });

  // Calculate pagination
  const totalPages = Math.max(1, Math.ceil(filteredLeads.length / pageSize));
  const paginatedLeads = filteredLeads.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'NEW':
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-blue-100 text-blue-800 uppercase tracking-wider">
            Enquiry Received
          </span>
        );
      case 'CONTACTED':
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-800 uppercase tracking-wider">
            Hospital Contacted
          </span>
        );
      case 'IN_PROGRESS':
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-purple-100 text-purple-800 uppercase tracking-wider">
            Consultation In Progress
          </span>
        );
      case 'CONVERTED':
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 uppercase tracking-wider">
            Appointment Confirmed
          </span>
        );
      case 'CLOSED':
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-gray-100 text-gray-700 uppercase tracking-wider">
            Consultation Completed
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-slate-100 text-slate-800 uppercase tracking-wider">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
        {/* User Portal Top Header Banner */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-pink-500 to-[#b02151] text-white flex items-center justify-center font-black text-2xl shadow-lg flex-shrink-0">
              {user?.name ? user.name.trim()[0].toUpperCase() : 'P'}
            </div>
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900">
                  {user?.name || 'Patient Profile'}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-pink-50 text-[#ec2c6c] border border-pink-200">
                  Verified Patient Account
                </span>
              </div>
              <p className="text-xs text-gray-500 font-medium">
                {user?.email} • Track all your hospital enquiries and responses in one central dashboard.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition-all flex items-center space-x-1.5 cursor-pointer shadow-sm"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Log Out</span>
            </button>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-gray-200 gap-4">
          <button
            onClick={() => setActiveTab('enquiries')}
            className={`pb-3 text-sm font-extrabold flex items-center space-x-2 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'enquiries'
                ? 'border-[#ec2c6c] text-[#ec2c6c]'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>Hospital Enquiries & Reverts</span>
            <span className="px-2 py-0.5 rounded-full text-xs font-extrabold bg-pink-100 text-[#ec2c6c]">
              {leads.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('profile')}
            className={`pb-3 text-sm font-extrabold flex items-center space-x-2 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'profile'
                ? 'border-[#ec2c6c] text-[#ec2c6c]'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>My Profile & Security</span>
          </button>
        </div>

        {/* TAB 1: HOSPITAL ENQUIRIES */}
        {activeTab === 'enquiries' && (
          <div className="space-y-6">
            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-1">
                <span className="text-[11px] font-bold uppercase text-gray-400">Total Enquiries</span>
                <p className="text-2xl font-black text-gray-900">{stats.totalEnquiries || leads.length}</p>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-1">
                <span className="text-[11px] font-bold uppercase text-gray-400">Hospitals Inquired</span>
                <p className="text-2xl font-black text-[#ec2c6c]">{stats.totalHospitalsContacted || uniqueHospitals.length}</p>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-1">
                <span className="text-[11px] font-bold uppercase text-gray-400">In Progress / Active</span>
                <p className="text-2xl font-black text-purple-600">
                  {leads.filter((l) => ['NEW', 'CONTACTED', 'IN_PROGRESS'].includes(l.status)).length}
                </p>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-1">
                <span className="text-[11px] font-bold uppercase text-gray-400">Confirmed / Reverts</span>
                <p className="text-2xl font-black text-emerald-600">
                  {leads.filter((l) => (l.notes && l.notes.length > 0) || l.status === 'CONVERTED').length}
                </p>
              </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm space-y-3">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                {/* Search box */}
                <div className="relative w-full sm:w-80">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search hospital, specialty, city..."
                    className="w-full pl-9 pr-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-[#ec2c6c] focus:outline-none"
                  />
                </div>

                <div className="text-xs text-gray-500 font-semibold self-end sm:self-center">
                  Showing <strong>{filteredLeads.length}</strong> of {leads.length} inquiries
                </div>
              </div>

              {/* Hospital Selection Pills */}
              {uniqueHospitals.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-gray-100">
                  <span className="text-[11px] font-bold text-gray-400 uppercase mr-1 flex items-center">
                    <Building2 className="w-3.5 h-3.5 mr-1" /> Hospital:
                  </span>
                  <button
                    onClick={() => setSelectedHospitalFilter('ALL')}
                    className={`px-3 py-1 rounded-full text-xs font-extrabold transition-all cursor-pointer ${
                      selectedHospitalFilter === 'ALL'
                        ? 'bg-gradient-to-r from-pink-600 to-[#b02151] text-white shadow-sm'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    All Hospitals ({leads.length})
                  </button>

                  {uniqueHospitals.map((h) => (
                    <button
                      key={h.id || h.name}
                      onClick={() => setSelectedHospitalFilter(h.name)}
                      className={`px-3 py-1 rounded-full text-xs font-extrabold transition-all cursor-pointer ${
                        selectedHospitalFilter === h.name
                          ? 'bg-gradient-to-r from-pink-600 to-[#b02151] text-white shadow-sm'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {h.name} ({h.count})
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Inquiries Cards List */}
            {loading ? (
              <div className="p-12 text-center bg-white rounded-3xl border border-gray-100 space-y-3">
                <Loader2 className="w-8 h-8 text-[#ec2c6c] animate-spin mx-auto" />
                <p className="text-sm text-gray-500 font-medium">Loading your hospital inquiries...</p>
              </div>
            ) : filteredLeads.length === 0 ? (
              <div className="p-12 text-center bg-white rounded-3xl border border-gray-100 space-y-4">
                <FileText className="w-12 h-12 text-gray-300 mx-auto" />
                <h3 className="text-lg font-bold text-gray-800">No Enquiries Found</h3>
                <p className="text-xs text-gray-500 max-w-md mx-auto leading-relaxed">
                  {searchQuery || selectedHospitalFilter !== 'ALL'
                    ? 'No inquiries match your current filter criteria. Try selecting "All Hospitals" or clearing your search.'
                    : "You haven't submitted any hospital consultation requests yet. Browse top hospitals to request a medical callback."}
                </p>
                <a
                  href="/service/gastroenterology"
                  className="cbc-btn-primary inline-flex items-center space-x-1.5 text-xs py-2 px-6 font-bold"
                >
                  <Stethoscope className="w-4 h-4" />
                  <span>Browse Medical Specialties</span>
                </a>
              </div>
            ) : (
              <div className="space-y-4">
                {paginatedLeads.map((lead) => {
                  const hospital = lead.hospital;
                  const service = lead.service;
                  const hasNotes = lead.notes && lead.notes.length > 0;

                  return (
                    <div
                      key={lead.id}
                      className="bg-white rounded-3xl p-6 sm:p-7 shadow-sm border border-gray-100 hover:border-pink-200 transition-all space-y-5"
                    >
                      {/* Top Row: Hospital & Status */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
                        <div className="flex items-start space-x-3.5">
                          <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-700 font-black flex-shrink-0 shadow-xs">
                            <Building2 className="w-6 h-6 text-[#b02151]" />
                          </div>
                          <div className="space-y-0.5">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="text-base sm:text-lg font-extrabold text-gray-900">
                                {hospital?.name || 'General Platform Enquiry'}
                              </h3>
                              {hospital?.rating && (
                                <span className="inline-flex items-center space-x-1 text-[11px] font-extrabold bg-amber-50 text-amber-800 px-2 py-0.5 rounded-full border border-amber-200">
                                  <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                                  <span>{hospital.rating}</span>
                                </span>
                              )}
                              {hospital?.isVerifiedPartner && (
                                <span className="inline-flex items-center space-x-1 text-[10px] font-extrabold bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-200">
                                  <ShieldCheck className="w-3 h-3 text-emerald-600" />
                                  <span>Verified Partner</span>
                                </span>
                              )}
                            </div>

                            {hospital?.city && (
                              <p className="text-xs text-gray-500 font-medium flex items-center">
                                <MapPin className="w-3.5 h-3.5 text-pink-500 mr-1 flex-shrink-0" />
                                {hospital.city}
                                {hospital.state ? `, ${hospital.state}` : ''}
                                {hospital.address ? ` • ${hospital.address}` : ''}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-col sm:items-end space-y-1">
                          {getStatusBadge(lead.status)}
                          <span className="text-[11px] text-gray-400 font-medium">
                            Enquiry #{lead.id} • {new Date(lead.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </span>
                        </div>
                      </div>

                      {/* Middle Grid: Service, Contact, Patient Message */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                        {/* Service / Specialty */}
                        <div className="p-4 bg-pink-50/50 rounded-2xl border border-pink-100 space-y-1">
                          <span className="text-[10px] font-bold uppercase text-pink-800 tracking-wider">
                            Requested Medical Service
                          </span>
                          <p className="font-extrabold text-[#ec2c6c] text-sm">
                            {service?.name || 'General Medical Consultation'}
                          </p>
                          {lead.preferredContactTime && (
                            <p className="text-gray-500 text-[11px]">
                              Preferred Time: <strong>{lead.preferredContactTime}</strong>
                            </p>
                          )}
                        </div>

                        {/* Patient Details Stored */}
                        <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 space-y-1">
                          <span className="text-[10px] font-bold uppercase text-gray-500 tracking-wider">
                            Contact Info Provided
                          </span>
                          <p className="font-bold text-gray-900">{lead.patientName}</p>
                          <p className="text-gray-600">{lead.phone} • {lead.email}</p>
                        </div>

                        {/* Hospital Direct Actions */}
                        <div className="p-4 bg-slate-50 rounded-2xl border border-gray-100 flex flex-col justify-center space-y-2">
                          {hospital?.phone && (
                            <a
                              href={`tel:${hospital.phone}`}
                              className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center justify-center space-x-1.5 transition-colors shadow-xs"
                            >
                              <Phone className="w-3.5 h-3.5" />
                              <span>Call Hospital: {hospital.phone}</span>
                            </a>
                          )}
                          {hospital?.email && (
                            <a
                              href={`mailto:${hospital.email}`}
                              className="w-full py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold text-xs rounded-xl flex items-center justify-center space-x-1.5 transition-colors"
                            >
                              <Mail className="w-3.5 h-3.5" />
                              <span>Email Hospital</span>
                            </a>
                          )}
                        </div>
                      </div>

                      {/* Patient Enquiry Note / Message */}
                      {lead.message && (
                        <div className="p-4 bg-amber-50/50 rounded-2xl border border-amber-100 space-y-1 text-xs">
                          <span className="text-[10px] font-bold uppercase text-amber-900 tracking-wider">
                            Your Enquiry Message
                          </span>
                          <p className="text-gray-800 leading-relaxed font-medium">{lead.message}</p>
                        </div>
                      )}

                      {/* Hospital Reverts / Response Notes Timeline */}
                      {hasNotes && (
                        <div className="p-4 bg-purple-50/60 rounded-2xl border border-purple-100 space-y-2.5">
                          <div className="flex items-center space-x-1.5 text-purple-900 font-extrabold text-xs uppercase tracking-wider">
                            <Sparkles className="w-4 h-4 text-purple-600" />
                            <span>Hospital Coordinator Response & Reverts ({lead.notes!.length})</span>
                          </div>

                          <div className="space-y-2 pt-1 border-t border-purple-200/50">
                            {lead.notes!.map((note, idx) => (
                              <div key={idx} className="bg-white p-3 rounded-xl border border-purple-100 text-xs space-y-1 shadow-2xs">
                                <div className="flex items-center justify-between text-[10px] font-bold text-gray-400">
                                  <span className="text-purple-700 font-extrabold">{note.author || 'Medical Coordinator'}</span>
                                  <span>{new Date(note.createdAt).toLocaleString('en-IN')}</span>
                                </div>
                                <p className="text-gray-800 font-medium leading-relaxed">{note.content}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Pagination Toolbar */}
                {filteredLeads.length > 0 && (
                  <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4 mt-6">
                    <div className="flex items-center space-x-4 text-xs text-gray-500 font-medium">
                      <span>
                        Showing <strong>{(currentPage - 1) * pageSize + 1}</strong> to{' '}
                        <strong>{Math.min(currentPage * pageSize, filteredLeads.length)}</strong> of{' '}
                        <strong>{filteredLeads.length}</strong> enquiries
                      </span>

                      <div className="flex items-center space-x-1.5 pl-2 border-l border-gray-200">
                        <span className="text-[11px] text-gray-400">Per page:</span>
                        {[5, 10, 20].map((size) => (
                          <button
                            key={size}
                            onClick={() => setPageSize(size)}
                            className={`px-2 py-0.5 text-xs font-bold rounded-md transition-colors cursor-pointer ${
                              pageSize === size
                                ? 'bg-[#ec2c6c] text-white'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                          >
                            {size}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Page Navigation Buttons */}
                    {totalPages > 1 && (
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => setCurrentPage(1)}
                          disabled={currentPage === 1}
                          className="px-2.5 py-1.5 text-xs font-bold rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                          title="First Page"
                        >
                          « First
                        </button>
                        <button
                          onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                          disabled={currentPage === 1}
                          className="px-2.5 py-1.5 text-xs font-bold rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                          title="Previous Page"
                        >
                          ‹ Prev
                        </button>

                        <div className="flex items-center space-x-1 px-1">
                          {Array.from({ length: totalPages }, (_, i) => i + 1)
                            .filter(
                              (p) =>
                                p === 1 ||
                                p === totalPages ||
                                (p >= currentPage - 1 && p <= currentPage + 1)
                            )
                            .map((page, idx, arr) => {
                              const showEllipsisBefore = idx > 0 && page - arr[idx - 1] > 1;
                              return (
                                <React.Fragment key={page}>
                                  {showEllipsisBefore && (
                                    <span className="px-1 text-gray-400 text-xs font-bold">...</span>
                                  )}
                                  <button
                                    onClick={() => setCurrentPage(page)}
                                    className={`w-8 h-8 text-xs font-extrabold rounded-lg transition-colors cursor-pointer ${
                                      currentPage === page
                                        ? 'bg-gradient-to-r from-pink-600 to-[#b02151] text-white shadow-sm'
                                        : 'border border-gray-200 text-gray-700 hover:bg-gray-50'
                                    }`}
                                  >
                                    {page}
                                  </button>
                                </React.Fragment>
                              );
                            })}
                        </div>

                        <button
                          onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                          disabled={currentPage === totalPages}
                          className="px-2.5 py-1.5 text-xs font-bold rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                          title="Next Page"
                        >
                          Next ›
                        </button>
                        <button
                          onClick={() => setCurrentPage(totalPages)}
                          disabled={currentPage === totalPages}
                          className="px-2.5 py-1.5 text-xs font-bold rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                          title="Last Page"
                        >
                          Last »
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: MY PROFILE & SECURITY */}
        {activeTab === 'profile' && (
          <div className="max-w-2xl bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-100 space-y-6">
            <div>
              <h3 className="text-xl font-extrabold text-gray-900">Patient Profile & Security</h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Update your contact details or change your account password.
              </p>
            </div>

            {profileMsg && (
              <div
                className={`p-4 rounded-2xl text-xs font-bold flex items-start space-x-2 border ${
                  profileMsg.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : 'bg-red-50 text-red-800 border-red-200'
                }`}
              >
                {profileMsg.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                )}
                <span>{profileMsg.text}</span>
              </div>
            )}

            <form onSubmit={handleProfileUpdate} className="space-y-6">
              {/* Personal Details Section */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold uppercase text-gray-400 tracking-wider">
                  Contact Information
                </h4>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-[#ec2c6c] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                    Email Address (Account User ID)
                  </label>
                  <input
                    type="email"
                    disabled
                    value={user?.email || ''}
                    className="w-full px-3.5 py-2.5 bg-gray-100 border border-gray-200 rounded-xl text-sm font-semibold text-gray-500 cursor-not-allowed"
                  />
                  <p className="text-[11px] text-gray-400 mt-1">
                    Email address is your unique patient account identifier and cannot be changed.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                    Mobile Phone Number
                  </label>
                  <input
                    type="tel"
                    value={profilePhone}
                    onChange={(e) => setProfilePhone(e.target.value)}
                    placeholder="+91 Mobile number"
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-[#ec2c6c] focus:outline-none"
                  />
                </div>
              </div>

              {/* Password Change Section */}
              <div className="space-y-4 pt-6 border-t border-gray-100">
                <div className="space-y-0.5">
                  <h4 className="text-xs font-bold uppercase text-gray-400 tracking-wider flex items-center space-x-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-[#ec2c6c]" />
                    <span>Change Account Password (Optional)</span>
                  </h4>
                  <p className="text-[11px] text-gray-500">
                    Leave blank if you do not wish to change your current password.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                    Current Password
                  </label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#ec2c6c] focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                      New Password
                    </label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Min 6 characters"
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#ec2c6c] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter new password"
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#ec2c6c] focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={profileSaving}
                  className="cbc-btn-primary w-full text-sm py-3 font-bold flex items-center justify-center space-x-2 shadow-md cursor-pointer"
                >
                  {profileSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving Profile Changes...</span>
                    </>
                  ) : (
                    <span>Save Changes</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
