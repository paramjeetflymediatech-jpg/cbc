'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
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
  ExternalLink,
  Star,
  Sparkles,
  Stethoscope,
  Trash2,
  Edit2,
  Home,
  User as UserIcon,
  Copy,
  Check,
  ArrowUpRight,
  Activity,
  Hospital as HospitalIcon,
  X,
} from 'lucide-react';

interface HospitalInfo {
  id: number;
  name: string;
  slug?: string;
  city?: string;
  state?: string;
  district?: string;
  address?: string;
  logo?: string;
  coverImage?: string;
  phone?: string;
  email?: string;
  rating?: number;
  isNabhAccredited?: boolean;
  isVerifiedPartner?: boolean;
  enquiryCount?: number;
  lastEnquiryDate?: string;
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

interface UserDetailData {
  id: number;
  name: string;
  email: string;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'HOSPITAL' | 'PATIENT';
  hospitalId?: number | null;
  phone?: string | null;
  avatar?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  pincode?: string | null;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  createdAt: string;
  updatedAt: string;
  hospital?: any;
}

export default function AdminUserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<UserDetailData | null>(null);
  const [leads, setLeads] = useState<LeadItem[]>([]);
  const [contactedHospitals, setContactedHospitals] = useState<HospitalInfo[]>([]);
  const [stats, setStats] = useState({
    totalEnquiries: 0,
    totalHospitalsContacted: 0,
    activeEnquiries: 0,
    convertedEnquiries: 0,
  });

  const [activeTab, setActiveTab] = useState<'queries' | 'hospitals' | 'profile'>('queries');
  const [copiedId, setCopiedId] = useState(false);
  const [toastMsg, setToastMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editRole, setEditRole] = useState<'PATIENT' | 'HOSPITAL' | 'ADMIN' | 'SUPER_ADMIN'>('PATIENT');
  const [editStatus, setEditStatus] = useState<'ACTIVE' | 'INACTIVE' | 'SUSPENDED'>('ACTIVE');
  const [editCity, setEditCity] = useState('');
  const [editState, setEditState] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editPincode, setEditPincode] = useState('');
  const [editPassword, setEditPassword] = useState('');

  // Delete Modal State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  useEffect(() => {
    if (userId) {
      fetchUserDetails();
    }
  }, [userId]);

  const fetchUserDetails = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}`);
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        setLeads(data.leads || []);
        setContactedHospitals(data.contactedHospitals || []);
        if (data.stats) setStats(data.stats);

        // Pre-fill edit modal form
        if (data.user) {
          setEditName(data.user.name || '');
          setEditPhone(data.user.phone || '');
          setEditRole(data.user.role || 'PATIENT');
          setEditStatus(data.user.status || 'ACTIVE');
          setEditCity(data.user.city || '');
          setEditState(data.user.state || '');
          setEditAddress(data.user.address || '');
          setEditPincode(data.user.pincode || '');
        }
      } else {
        router.push('/admin/users');
      }
    } catch (err) {
      console.error('Error fetching user details:', err);
    } finally {
      setLoading(false);
    }
  };

  const showToast = (type: 'success' | 'error', text: string) => {
    setToastMsg({ type, text });
    setTimeout(() => setToastMsg(null), 4000);
  };

  const copyUserId = () => {
    if (!user?.id) return;
    const text = `CBC-USER-${String(user.id).padStart(5, '0')}`;
    navigator.clipboard.writeText(text);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setActionLoading(true);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: user.id,
          name: editName,
          phone: editPhone,
          role: editRole,
          status: editStatus,
          city: editCity,
          state: editState,
          address: editAddress,
          pincode: editPincode,
          ...(editPassword ? { newPassword: editPassword } : {}),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        showToast('error', data.error || 'Failed to update user.');
      } else {
        showToast('success', 'User details updated successfully.');
        setIsEditModalOpen(false);
        setEditPassword('');
        fetchUserDetails();
      }
    } catch {
      showToast('error', 'Network error updating user.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!user) return;
    setActionLoading(true);

    try {
      const res = await fetch(`/api/admin/users?id=${user.id}`, {
        method: 'DELETE',
      });

      const data = await res.json();
      if (!res.ok) {
        showToast('error', data.error || 'Failed to delete user.');
      } else {
        showToast('success', 'User account permanently deleted.');
        setTimeout(() => {
          router.push('/admin/users');
        }, 1200);
      }
    } catch {
      showToast('error', 'Network error deleting user.');
    } finally {
      setActionLoading(false);
      setIsDeleteModalOpen(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'NEW':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-blue-50 text-blue-700 border border-blue-200">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
            <span>Received</span>
          </span>
        );
      case 'CONTACTED':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-50 text-amber-700 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            <span>Contacted</span>
          </span>
        );
      case 'IN_PROGRESS':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-purple-50 text-purple-700 border border-purple-200">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse" />
            <span>In Progress</span>
          </span>
        );
      case 'CONVERTED':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>Confirmed</span>
          </span>
        );
      case 'CLOSED':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-gray-100 text-gray-700 border border-gray-200">
            <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
            <span>Completed</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-slate-100 text-slate-700">
            <span>{status}</span>
          </span>
        );
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-black bg-purple-500/20 text-purple-300 border border-purple-500/30">
            <ShieldCheck className="w-3.5 h-3.5 mr-1" />
            Super Admin
          </span>
        );
      case 'ADMIN':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
            Admin Staff
          </span>
        );
      case 'HOSPITAL':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
            <Building2 className="w-3.5 h-3.5 mr-1" />
            Hospital Partner
          </span>
        );
      case 'PATIENT':
      default:
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-pink-500/20 text-pink-300 border border-pink-500/30">
            Registered Patient
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div className="p-20 text-center space-y-4">
        <Loader2 className="w-10 h-10 text-[#ec2c6c] animate-spin mx-auto" />
        <h3 className="font-extrabold text-slate-800 text-base">Loading Full User Profile & Records...</h3>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="p-16 text-center space-y-4">
        <Users className="w-12 h-12 text-slate-300 mx-auto" />
        <h3 className="text-lg font-bold text-slate-800">User Not Found</h3>
        <Link href="/admin/users" className="text-xs font-bold text-[#ec2c6c] underline">
          Return to Users Directory
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMsg && (
        <div
          className={`fixed top-4 right-4 z-50 p-4 rounded-2xl shadow-xl flex items-center space-x-2 border text-xs font-bold ${
            toastMsg.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-red-50 text-red-800 border-red-200'
          }`}
        >
          {toastMsg.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          ) : (
            <AlertCircle className="w-4 h-4 text-red-600" />
          )}
          <span>{toastMsg.text}</span>
        </div>
      )}

      {/* Back Navigation Bar */}
      <div className="flex items-center justify-between">
        <Link
          href="/admin/users"
          className="inline-flex items-center space-x-2 text-xs font-extrabold text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Users Directory</span>
        </Link>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsEditModalOpen(true)}
            className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 shadow-2xs flex items-center space-x-1.5 cursor-pointer"
          >
            <Edit2 className="w-3.5 h-3.5" />
            <span>Edit User</span>
          </button>
          {user.role !== 'SUPER_ADMIN' && (
            <button
              onClick={() => setIsDeleteModalOpen(true)}
              className="px-3.5 py-2 bg-red-50 hover:bg-red-100 text-red-600 font-bold text-xs rounded-xl border border-red-200 flex items-center space-x-1.5 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete User</span>
            </button>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* USER IDENTITY HERO BANNER */}
      {/* ========================================================================= */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#0f172a] via-[#1e1b4b] to-[#0f172a] p-6 sm:p-8 text-white shadow-xl border border-slate-800">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start sm:items-center space-x-5">
            <div className="relative w-20 h-20 sm:w-22 sm:h-22 rounded-2xl overflow-hidden bg-gradient-to-br from-pink-500 to-[#b02151] ring-4 ring-white/10 shadow-xl flex items-center justify-center text-white font-black text-3xl flex-shrink-0">
              {user.avatar ? (
                <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                <span>{user.name ? user.name.trim()[0].toUpperCase() : 'U'}</span>
              )}
            </div>

            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-white">{user.name || 'Unnamed User'}</h1>
                {getRoleBadge(user.role)}
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${
                    user.status === 'ACTIVE'
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                      : 'bg-red-500/20 text-red-300 border-red-500/30'
                  }`}
                >
                  {user.status}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-slate-300">
                <span className="flex items-center">
                  <Mail className="w-3.5 h-3.5 text-pink-400 mr-1.5 flex-shrink-0" />
                  {user.email}
                </span>
                {user.phone && (
                  <span className="flex items-center">
                    <Phone className="w-3.5 h-3.5 text-pink-400 mr-1.5 flex-shrink-0" />
                    {user.phone}
                  </span>
                )}
                {user.city && (
                  <span className="flex items-center">
                    <MapPin className="w-3.5 h-3.5 text-pink-400 mr-1.5 flex-shrink-0" />
                    {user.city}{user.state ? `, ${user.state}` : ''}
                  </span>
                )}
              </div>

              <div className="pt-1 flex items-center space-x-2">
                <button
                  onClick={copyUserId}
                  className="inline-flex items-center space-x-1.5 px-2.5 py-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-[11px] text-slate-300 font-mono transition-colors cursor-pointer"
                  title="Click to copy User ID"
                >
                  <span>UID: CBC-USER-{String(user.id).padStart(5, '0')}</span>
                  {copiedId ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-slate-400" />}
                </button>
                <span className="text-[11px] text-slate-400">
                  Joined: {new Date(user.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* KPI METRIC CARDS */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <span className="text-[11px] font-bold uppercase text-slate-400">Total Enquiries</span>
          <p className="text-2xl font-black text-slate-900">{stats.totalEnquiries}</p>
          <span className="text-[10px] text-pink-600 font-bold">Submitted queries</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <span className="text-[11px] font-bold uppercase text-slate-400">Hospitals Contacted</span>
          <p className="text-2xl font-black text-indigo-600">{stats.totalHospitalsContacted}</p>
          <span className="text-[10px] text-slate-400">Partner clinics reached</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <span className="text-[11px] font-bold uppercase text-slate-400">Active Consultations</span>
          <p className="text-2xl font-black text-amber-600">{stats.activeEnquiries}</p>
          <span className="text-[10px] text-amber-600 font-bold">In progress / pending</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <span className="text-[11px] font-bold uppercase text-slate-400">Appointments</span>
          <p className="text-2xl font-black text-emerald-600">{stats.convertedEnquiries}</p>
          <span className="text-[10px] text-emerald-600 font-bold">Confirmed / Completed</span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SEGMENTED VIEW TABS */}
      {/* ========================================================================= */}
      <div className="bg-white p-1.5 rounded-2xl border border-slate-200 shadow-2xs flex flex-wrap gap-1.5">
        <button
          onClick={() => setActiveTab('queries')}
          className={`px-5 py-2.5 rounded-xl text-xs font-extrabold flex items-center space-x-2 transition-all cursor-pointer ${
            activeTab === 'queries'
              ? 'bg-gradient-to-r from-pink-600 to-[#b02151] text-white shadow-md'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>Consultations & Queries ({leads.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('hospitals')}
          className={`px-5 py-2.5 rounded-xl text-xs font-extrabold flex items-center space-x-2 transition-all cursor-pointer ${
            activeTab === 'hospitals'
              ? 'bg-gradient-to-r from-pink-600 to-[#b02151] text-white shadow-md'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Associated Hospitals ({contactedHospitals.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('profile')}
          className={`px-5 py-2.5 rounded-xl text-xs font-extrabold flex items-center space-x-2 transition-all cursor-pointer ${
            activeTab === 'profile'
              ? 'bg-gradient-to-r from-pink-600 to-[#b02151] text-white shadow-md'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <UserIcon className="w-4 h-4" />
          <span>Profile & Residential Address</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: CONSULTATIONS & QUERIES LIST */}
      {/* ========================================================================= */}
      {activeTab === 'queries' && (
        <div className="space-y-4">
          {leads.length === 0 ? (
            <div className="bg-white p-16 text-center rounded-3xl border border-slate-200 space-y-3">
              <FileText className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="font-bold text-slate-800 text-base">No Enquiries Submitted</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                This user has not submitted any hospital consultation requests yet.
              </p>
            </div>
          ) : (
            leads.map((lead) => {
              const hospital = lead.hospital;
              const service = lead.service;
              const hasNotes = lead.notes && lead.notes.length > 0;

              return (
                <div
                  key={lead.id}
                  className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-2xs hover:border-pink-200 hover:shadow-md transition-all space-y-5"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-slate-100 pb-4">
                    <div className="flex items-start space-x-3.5">
                      <div className="relative w-12 h-12 rounded-2xl overflow-hidden bg-slate-50 border border-slate-200 flex items-center justify-center flex-shrink-0">
                        {hospital?.logo ? (
                          <img src={hospital.logo} alt={hospital.name} className="w-full h-full object-cover" />
                        ) : (
                          <Building2 className="w-6 h-6 text-[#ec2c6c]" />
                        )}
                      </div>
                      <div className="space-y-0.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-base sm:text-lg font-black text-slate-900">
                            {hospital?.name || 'General Platform Request'}
                          </h3>
                          {hospital?.rating && (
                            <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[11px] font-extrabold bg-amber-50 text-amber-800 border border-amber-200">
                              <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                              <span>{hospital.rating}</span>
                            </span>
                          )}
                          {hospital?.isNabhAccredited && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-50 text-blue-700 border border-blue-200">
                              NABH
                            </span>
                          )}
                        </div>
                        {hospital?.city && (
                          <p className="text-xs text-slate-500 font-medium flex items-center">
                            <MapPin className="w-3.5 h-3.5 text-pink-500 mr-1 flex-shrink-0" />
                            <span>{hospital.city}{hospital.state ? `, ${hospital.state}` : ''}</span>
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col sm:items-end space-y-1">
                      {getStatusBadge(lead.status)}
                      <span className="text-[11px] text-slate-400 font-medium">
                        Lead #{lead.id} • {new Date(lead.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                    <div className="p-4 bg-pink-50/40 rounded-2xl border border-pink-100 space-y-1">
                      <span className="text-[10px] font-extrabold uppercase text-pink-800 tracking-wider">
                        Medical Specialty
                      </span>
                      <p className="font-black text-[#ec2c6c] text-sm">
                        {service?.name || 'General Medical Consultation'}
                      </p>
                      {lead.preferredContactTime && (
                        <p className="text-slate-500 text-[11px] pt-1">
                          Preferred: <strong>{lead.preferredContactTime}</strong>
                        </p>
                      )}
                    </div>

                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/70 space-y-1">
                      <span className="text-[10px] font-extrabold uppercase text-slate-500 tracking-wider">
                        Contact Submitted
                      </span>
                      <p className="font-extrabold text-slate-900">{lead.patientName}</p>
                      <p className="text-slate-600 font-medium">{lead.phone} • {lead.email}</p>
                    </div>

                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/70 flex flex-col justify-center space-y-2">
                      {hospital?.phone && (
                        <a
                          href={`tel:${hospital.phone}`}
                          className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl flex items-center justify-center space-x-1.5 transition-colors shadow-2xs"
                        >
                          <Phone className="w-3.5 h-3.5" />
                          <span>Call Hospital: {hospital.phone}</span>
                        </a>
                      )}
                      {hospital?.slug ? (
                        <Link
                          href={`/hospital/${hospital.slug}`}
                          target="_blank"
                          className="w-full py-1.5 bg-white hover:bg-slate-100 text-slate-800 font-bold text-xs rounded-xl border border-slate-200 flex items-center justify-center space-x-1.5 transition-colors"
                        >
                          <span>View Hospital Profile</span>
                          <ArrowUpRight className="w-3.5 h-3.5 text-slate-500" />
                        </Link>
                      ) : null}
                    </div>
                  </div>

                  {lead.message && (
                    <div className="p-4 bg-amber-50/40 rounded-2xl border border-amber-200/70 space-y-1 text-xs">
                      <span className="text-[10px] font-extrabold uppercase text-amber-900 tracking-wider">
                        Patient Query Message
                      </span>
                      <p className="text-slate-800 leading-relaxed font-medium">
                        &quot;{lead.message}&quot;
                      </p>
                    </div>
                  )}

                  {/* Hospital Coordinator Reverts */}
                  {hasNotes && (
                    <div className="p-4 bg-purple-50/70 rounded-2xl border border-purple-200/60 space-y-2.5">
                      <div className="flex items-center space-x-1.5 text-purple-950 font-black text-xs uppercase tracking-wider">
                        <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                        <span>Hospital Coordinator Response & Notes ({lead.notes!.length})</span>
                      </div>

                      <div className="space-y-2 pt-1 border-t border-purple-100">
                        {lead.notes!.map((note, idx) => (
                          <div
                            key={idx}
                            className="bg-white p-3 rounded-xl border border-purple-100 text-xs space-y-1 shadow-2xs"
                          >
                            <div className="flex items-center justify-between text-[11px] font-bold">
                              <span className="text-purple-800 font-extrabold">{note.author || 'Medical Coordinator'}</span>
                              <span className="text-slate-400">{new Date(note.createdAt).toLocaleString('en-IN')}</span>
                            </div>
                            <p className="text-slate-800 font-medium leading-relaxed pl-2.5 border-l-2 border-purple-200">
                              {note.content}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: ASSOCIATED CONTACTED HOSPITALS */}
      {/* ========================================================================= */}
      {activeTab === 'hospitals' && (
        <div className="space-y-4">
          {contactedHospitals.length === 0 ? (
            <div className="bg-white p-16 text-center rounded-3xl border border-slate-200 space-y-3">
              <Building2 className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="font-bold text-slate-800 text-base">No Associated Hospitals</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                This user has not established any hospital relationships or enquiries.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {contactedHospitals.map((h) => (
                <div
                  key={h.id}
                  className="bg-white rounded-3xl p-6 border border-slate-200 shadow-2xs space-y-4 flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-start space-x-3.5">
                      <div className="w-12 h-12 rounded-2xl overflow-hidden bg-slate-50 border border-slate-200 flex items-center justify-center flex-shrink-0">
                        {h.logo ? (
                          <img src={h.logo} alt={h.name} className="w-full h-full object-cover" />
                        ) : (
                          <Building2 className="w-6 h-6 text-[#ec2c6c]" />
                        )}
                      </div>
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="font-black text-slate-900 text-base">{h.name}</h4>
                          {h.rating && (
                            <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-50 text-amber-800 border border-amber-200">
                              <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                              <span>{h.rating}</span>
                            </span>
                          )}
                        </div>
                        {h.city && (
                          <p className="text-xs text-slate-500 font-medium flex items-center">
                            <MapPin className="w-3.5 h-3.5 text-pink-500 mr-1 flex-shrink-0" />
                            <span>{h.city}{h.state ? `, ${h.state}` : ''}</span>
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl text-xs space-y-1 border border-slate-100">
                      <div className="flex justify-between">
                        <span className="text-slate-400 font-bold">Total User Queries</span>
                        <span className="font-extrabold text-[#ec2c6c]">{h.enquiryCount} enquiries</span>
                      </div>
                      {h.phone && (
                        <div className="flex justify-between">
                          <span className="text-slate-400 font-bold">Contact Phone</span>
                          <span className="font-bold text-slate-700">{h.phone}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-2">
                    {h.slug && (
                      <Link
                        href={`/hospital/${h.slug}`}
                        target="_blank"
                        className="w-full py-2 bg-slate-900 hover:bg-black text-white font-extrabold text-xs rounded-xl flex items-center justify-center space-x-1.5 transition-colors"
                      >
                        <span>View Hospital Page</span>
                        <ArrowUpRight className="w-3.5 h-3.5 text-slate-300" />
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: COMPLETE PROFILE & ADDRESS */}
      {/* ========================================================================= */}
      {activeTab === 'profile' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-2xs space-y-6 max-w-3xl">
          <div>
            <h3 className="text-lg font-black text-slate-900">User Account & Address Record</h3>
            <p className="text-xs text-slate-500 mt-0.5">Comprehensive identity and location details stored in database</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-4 bg-slate-50 rounded-2xl space-y-1">
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Full Name</span>
              <p className="font-extrabold text-slate-900 text-sm">{user.name || 'Not provided'}</p>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl space-y-1">
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Email Address</span>
              <p className="font-extrabold text-slate-900 text-sm font-mono">{user.email}</p>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl space-y-1">
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Phone Number</span>
              <p className="font-extrabold text-slate-900 text-sm">{user.phone || 'Not provided'}</p>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl space-y-1">
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Account Role</span>
              <p className="font-extrabold text-slate-900 text-sm">{user.role}</p>
            </div>
          </div>

          <div className="p-5 bg-slate-50 rounded-2xl space-y-3 border border-slate-100 text-xs">
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider flex items-center">
              <Home className="w-3.5 h-3.5 text-[#ec2c6c] mr-1" />
              Residential Address Information
            </span>

            <div className="space-y-2 text-slate-700">
              <div className="flex justify-between border-b border-slate-200/60 pb-1.5">
                <span className="text-slate-400 font-bold">Street Address:</span>
                <span className="font-extrabold text-slate-900 text-right">{user.address || 'Not provided'}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200/60 pb-1.5">
                <span className="text-slate-400 font-bold">City:</span>
                <span className="font-extrabold text-slate-900">{user.city || 'Not provided'}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200/60 pb-1.5">
                <span className="text-slate-400 font-bold">State:</span>
                <span className="font-extrabold text-slate-900">{user.state || 'Not provided'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-bold">Pincode:</span>
                <span className="font-extrabold text-slate-900">{user.pincode || 'Not provided'}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* EDIT USER MODAL */}
      {/* ========================================================================= */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="relative w-full max-w-lg bg-white rounded-3xl p-6 sm:p-7 shadow-2xl border border-slate-100 space-y-5 animate-in fade-in zoom-in duration-150 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsEditModalOpen(false)}
              className="absolute right-4 top-4 p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-50"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <h3 className="text-lg font-black text-slate-900">Edit User Details</h3>
              <p className="text-xs text-slate-500">Update account credentials, role, or password for {user.email}</p>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-[#ec2c6c] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Role</label>
                  <select
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value as any)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#ec2c6c]"
                  >
                    <option value="PATIENT">Patient</option>
                    <option value="HOSPITAL">Hospital Partner</option>
                    <option value="ADMIN">Admin Staff</option>
                    <option value="SUPER_ADMIN">Super Admin</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Account Status</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as any)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#ec2c6c]"
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                    <option value="SUSPENDED">Suspended</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Phone Number</label>
                <input
                  type="tel"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  placeholder="+91 Mobile number"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-[#ec2c6c] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">City</label>
                  <input
                    type="text"
                    value={editCity}
                    onChange={(e) => setEditCity(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-[#ec2c6c] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">State</label>
                  <input
                    type="text"
                    value={editState}
                    onChange={(e) => setEditState(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-[#ec2c6c] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Street Address</label>
                <input
                  type="text"
                  value={editAddress}
                  onChange={(e) => setEditAddress(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-[#ec2c6c] focus:outline-none"
                />
              </div>

              <div className="pt-2 border-t border-slate-100 space-y-1">
                <label className="block font-bold text-slate-700 uppercase flex items-center">
                  <KeyRound className="w-3.5 h-3.5 text-[#ec2c6c] mr-1" />
                  <span>Reset Password (Optional)</span>
                </label>
                <input
                  type="password"
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  placeholder="Enter new password (min 6 characters)"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-[#ec2c6c] focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end space-x-2.5 pt-4">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 bg-[#ec2c6c] hover:bg-[#d6215f] text-white font-extrabold rounded-xl shadow-md flex items-center space-x-1.5 cursor-pointer"
                >
                  {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* DELETE CONFIRMATION MODAL */}
      {/* ========================================================================= */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="relative w-full max-w-md bg-white rounded-3xl p-6 sm:p-7 shadow-2xl border border-slate-100 space-y-5 animate-in fade-in zoom-in duration-150">
            <button
              onClick={() => setIsDeleteModalOpen(false)}
              className="absolute right-4 top-4 p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-50"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center shadow-inner">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h3 className="text-lg font-black text-slate-900">Delete User Account?</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Are you sure you want to permanently delete <strong>{user.name}</strong> ({user.email})?
              </p>
            </div>

            <div className="flex items-center space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                disabled={actionLoading}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteUser}
                disabled={actionLoading}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs rounded-xl shadow-md flex items-center justify-center space-x-1.5 cursor-pointer"
              >
                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Yes, Delete</span>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
