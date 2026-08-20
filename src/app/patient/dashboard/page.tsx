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
  ChevronDown,
  LogOut,
  ExternalLink,
  Star,
  Sparkles,
  Stethoscope,
  Filter,
  Camera,
  Upload,
  Trash2,
  Home,
  User as UserIcon,
  Lock,
  Eye,
  EyeOff,
  Copy,
  Check,
  ArrowUpRight,
  Activity,
  Send,
  HelpCircle,
  Hospital as HospitalIcon,
  AlertTriangle,
  X,
} from 'lucide-react';
import Link from 'next/link';

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

interface HospitalGroup {
  hospitalId: number;
  name: string;
  slug?: string;
  logo?: string;
  city?: string;
  state?: string;
  address?: string;
  phone?: string;
  email?: string;
  rating?: number;
  isNabhAccredited?: boolean;
  isVerifiedPartner?: boolean;
  leads: LeadItem[];
  lastEnquiryDate: string;
}

interface DeleteModalState {
  isOpen: boolean;
  type: 'enquiry' | 'hospital';
  id?: number;
  hospitalId?: number;
  title: string;
  subtitle: string;
}

export default function PatientDashboard() {
  const router = useRouter();

  const [currentTab, setCurrentTab] = useState<'hospitals' | 'enquiries' | 'profile' | 'security'>('hospitals');
  const [expandedHospitalMap, setExpandedHospitalMap] = useState<Record<string, boolean>>({});

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
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState(false);

  // Delete Modal State
  const [deleteModal, setDeleteModal] = useState<DeleteModalState | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  // Profile Form States
  const [profileName, setProfileName] = useState('');
  const [profilePhone, setProfilePhone] = useState('');
  const [profileAvatar, setProfileAvatar] = useState('');
  const [profileAddress, setProfileAddress] = useState('');
  const [profileCity, setProfileCity] = useState('');
  const [profileState, setProfileState] = useState('');
  const [profilePincode, setProfilePincode] = useState('');
  const [avatarUploading, setAvatarUploading] = useState(false);

  // Security Form States
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedHospitalFilter, selectedStatusFilter, searchQuery, pageSize]);

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
        setProfileAvatar(profileData.user.avatar || '');
        setProfileAddress(profileData.user.address || '');
        setProfileCity(profileData.user.city || '');
        setProfileState(profileData.user.state || '');
        setProfilePincode(profileData.user.pincode || '');
        if (profileData.stats) setStats(profileData.stats);
      }

      // 2. Fetch user enquiries
      const enquiriesRes = await fetch('/api/enquiries');
      if (enquiriesRes.ok) {
        const enquiriesData = await enquiriesRes.json();
        if (enquiriesData.leads) {
          setLeads(enquiriesData.leads);
          // Expand first hospital by default
          if (enquiriesData.leads.length > 0) {
            const firstHId = enquiriesData.leads[0].hospitalId || enquiriesData.leads[0].hospital?.name || '0';
            setExpandedHospitalMap({ [String(firstHId)]: true });
          }
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

  const copyPatientId = () => {
    if (!user?.id) return;
    const formattedId = `CBC-PT-${String(user.id).padStart(5, '0')}`;
    navigator.clipboard.writeText(formattedId);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const toggleHospitalExpand = (hospitalKey: string) => {
    setExpandedHospitalMap((prev) => ({
      ...prev,
      [hospitalKey]: !prev[hospitalKey],
    }));
  };

  // Open single enquiry delete confirmation
  const promptDeleteEnquiry = (lead: LeadItem) => {
    setDeleteModal({
      isOpen: true,
      type: 'enquiry',
      id: lead.id,
      title: `Delete Enquiry #${lead.id}?`,
      subtitle: `Are you sure you want to delete this consultation request for ${
        lead.hospital?.name || 'this hospital'
      }? This action cannot be undone.`,
    });
  };

  // Open hospital delete confirmation
  const promptDeleteHospital = (group: HospitalGroup) => {
    setDeleteModal({
      isOpen: true,
      type: 'hospital',
      hospitalId: group.hospitalId,
      title: `Remove ${group.name}?`,
      subtitle: `Are you sure you want to remove ${group.name} and all ${group.leads.length} associated enquiry record(s) from your patient panel?`,
    });
  };

  // Execute Delete
  const handleConfirmDelete = async () => {
    if (!deleteModal) return;
    setDeleting(true);

    try {
      if (deleteModal.type === 'enquiry' && deleteModal.id) {
        const res = await fetch(`/api/enquiries?id=${deleteModal.id}`, { method: 'DELETE' });
        if (res.ok) {
          setLeads((prev) => prev.filter((l) => l.id !== deleteModal.id));
          setStats((prev) => ({
            ...prev,
            totalEnquiries: Math.max(0, prev.totalEnquiries - 1),
          }));
        } else {
          alert('Failed to delete enquiry.');
        }
      } else if (deleteModal.type === 'hospital' && deleteModal.hospitalId) {
        const res = await fetch(`/api/enquiries?hospitalId=${deleteModal.hospitalId}`, {
          method: 'DELETE',
        });
        if (res.ok) {
          setLeads((prev) => prev.filter((l) => l.hospitalId !== deleteModal.hospitalId));
          setStats((prev) => ({
            ...prev,
            totalHospitalsContacted: Math.max(0, prev.totalHospitalsContacted - 1),
          }));
        } else {
          alert('Failed to remove hospital enquiries.');
        }
      }
    } catch (err) {
      console.error('Delete error:', err);
      alert('Network error while deleting.');
    } finally {
      setDeleting(false);
      setDeleteModal(null);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setProfileMsg({ type: 'error', text: 'Profile picture must be under 5MB.' });
      return;
    }

    setAvatarUploading(true);
    setProfileMsg(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('category', 'avatar');

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        setProfileMsg({ type: 'error', text: data.error || 'Failed to upload profile picture.' });
      } else {
        setProfileAvatar(data.url);
        // Auto update profile record
        await fetch('/api/user/profile', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ avatar: data.url }),
        });
        setUser((prev: any) => ({ ...prev, avatar: data.url }));
        setProfileMsg({ type: 'success', text: 'Profile picture updated successfully!' });
      }
    } catch {
      setProfileMsg({ type: 'error', text: 'Network error uploading profile image.' });
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleRemoveAvatar = async () => {
    setProfileAvatar('');
    try {
      await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ avatar: null }),
      });
      setUser((prev: any) => ({ ...prev, avatar: null }));
      setProfileMsg({ type: 'success', text: 'Profile picture removed.' });
    } catch {
      // ignore
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
          avatar: profileAvatar,
          address: profileAddress,
          city: profileCity,
          state: profileState,
          pincode: profilePincode,
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

  // Group unique hospitals
  const hospitalGroupsMap = new Map<string, HospitalGroup>();
  leads.forEach((lead) => {
    const hKey = String(lead.hospitalId || lead.hospital?.name || 'general');
    if (!hospitalGroupsMap.has(hKey)) {
      hospitalGroupsMap.set(hKey, {
        hospitalId: lead.hospitalId || lead.hospital?.id || 0,
        name: lead.hospital?.name || 'General Medical Consultation',
        slug: lead.hospital?.slug,
        logo: lead.hospital?.logo,
        city: lead.hospital?.city || lead.city,
        state: lead.hospital?.state,
        address: lead.hospital?.address,
        phone: lead.hospital?.phone || lead.phone,
        email: lead.hospital?.email || lead.email,
        rating: lead.hospital?.rating,
        isNabhAccredited: lead.hospital?.isNabhAccredited,
        isVerifiedPartner: lead.hospital?.isVerifiedPartner,
        leads: [lead],
        lastEnquiryDate: lead.createdAt,
      });
    } else {
      hospitalGroupsMap.get(hKey)!.leads.push(lead);
    }
  });
  const hospitalGroups = Array.from(hospitalGroupsMap.values());

  // Filtered leads
  const filteredLeads = leads.filter((l) => {
    const hName = l.hospital?.name || 'General Platform';
    const matchesHospital = selectedHospitalFilter === 'ALL' || hName === selectedHospitalFilter;
    const matchesStatus = selectedStatusFilter === 'ALL' || l.status === selectedStatusFilter;

    const q = searchQuery.toLowerCase().trim();
    if (!q) return matchesHospital && matchesStatus;

    const matchesSearch =
      (l.hospital?.name || '').toLowerCase().includes(q) ||
      (l.hospital?.city || '').toLowerCase().includes(q) ||
      (l.service?.name || '').toLowerCase().includes(q) ||
      (l.message || '').toLowerCase().includes(q) ||
      (l.patientName || '').toLowerCase().includes(q);

    return matchesHospital && matchesStatus && matchesSearch;
  });

  // Filtered hospital groups
  const filteredHospitalGroups = hospitalGroups.filter((g) => {
    const matchesHospital = selectedHospitalFilter === 'ALL' || g.name === selectedHospitalFilter;

    const q = searchQuery.toLowerCase().trim();
    if (!q) return matchesHospital;

    const matchesSearch =
      g.name.toLowerCase().includes(q) ||
      (g.city || '').toLowerCase().includes(q) ||
      (g.state || '').toLowerCase().includes(q) ||
      g.leads.some(
        (l) =>
          (l.service?.name || '').toLowerCase().includes(q) ||
          (l.message || '').toLowerCase().includes(q)
      );

    return matchesHospital && matchesSearch;
  });

  // Calculate pagination
  const totalPages = Math.max(1, Math.ceil(filteredLeads.length / pageSize));
  const paginatedLeads = filteredLeads.slice((currentPage - 1) * pageSize, currentPage * pageSize);

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

  return (
    <div className="min-h-screen flex flex-col bg-[#f8fafc]">
      <Header />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-8">
        {/* ========================================================================= */}
        {/* HERO PATIENT IDENTITY BANNER */}
        {/* ========================================================================= */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#0f172a] via-[#1e1b4b] to-[#0f172a] p-6 sm:p-8 text-white shadow-2xl border border-slate-800">
          <div className="absolute -right-16 -top-16 w-64 h-64 bg-pink-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -left-16 -bottom-16 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            {/* Left: Avatar & Identity Details */}
            <div className="flex items-start sm:items-center space-x-5">
              <div className="relative group flex-shrink-0">
                <div className="w-20 h-20 sm:w-22 sm:h-22 rounded-2xl overflow-hidden bg-gradient-to-br from-pink-500 to-[#b02151] ring-4 ring-white/10 shadow-xl flex items-center justify-center text-white font-black text-3xl">
                  {user?.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user?.name || 'Patient'}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span>{user?.name ? user.name.trim()[0].toUpperCase() : 'P'}</span>
                  )}

                  {avatarUploading && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                      <Loader2 className="w-6 h-6 text-white animate-spin" />
                    </div>
                  )}
                </div>

                <label className="absolute -bottom-1.5 -right-1.5 w-8 h-8 rounded-xl bg-[#ec2c6c] hover:bg-[#d6215f] text-white flex items-center justify-center shadow-lg transition-transform hover:scale-110 cursor-pointer border-2 border-[#0f172a]">
                  <Camera className="w-4 h-4" />
                  <input
                    type="file"
                    accept="image/png, image/jpeg, image/webp"
                    className="hidden"
                    onChange={handleAvatarUpload}
                    disabled={avatarUploading}
                  />
                </label>
              </div>

              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tight text-white">
                    {user?.name || 'Patient Dashboard'}
                  </h1>
                  <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    <ShieldCheck className="w-3 h-3" />
                    <span>Verified Patient</span>
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-slate-300">
                  <span className="flex items-center">
                    <Mail className="w-3.5 h-3.5 text-pink-400 mr-1.5 flex-shrink-0" />
                    {user?.email}
                  </span>
                  {user?.phone && (
                    <span className="flex items-center">
                      <Phone className="w-3.5 h-3.5 text-pink-400 mr-1.5 flex-shrink-0" />
                      {user.phone}
                    </span>
                  )}
                  {user?.city && (
                    <span className="flex items-center">
                      <MapPin className="w-3.5 h-3.5 text-pink-400 mr-1.5 flex-shrink-0" />
                      {user.city}
                      {user?.state ? `, ${user.state}` : ''}
                    </span>
                  )}
                </div>

                <div className="pt-1 flex items-center space-x-2">
                  <button
                    onClick={copyPatientId}
                    className="inline-flex items-center space-x-1.5 px-2.5 py-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-[11px] text-slate-300 font-mono transition-colors cursor-pointer"
                    title="Click to copy Patient ID"
                  >
                    <span>ID: CBC-PT-{String(user?.id || 1).padStart(5, '0')}</span>
                    {copiedId ? (
                      <Check className="w-3 h-3 text-emerald-400" />
                    ) : (
                      <Copy className="w-3 h-3 text-slate-400" />
                    )}
                  </button>
                  {copiedId && (
                    <span className="text-[10px] text-emerald-400 font-medium">Copied!</span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 sm:self-end lg:self-center">
              <Link
                href="/hospital"
                className="px-4 py-2.5 bg-gradient-to-r from-pink-600 to-[#b02151] hover:from-pink-700 hover:to-[#961943] text-white text-xs font-extrabold rounded-xl shadow-lg shadow-pink-900/30 transition-all flex items-center space-x-1.5 cursor-pointer"
              >
                <HospitalIcon className="w-4 h-4" />
                <span>Browse Hospitals</span>
              </Link>
              <button
                onClick={handleLogout}
                className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-slate-200 hover:text-white text-xs font-bold rounded-xl border border-white/10 transition-all flex items-center space-x-1.5 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Log Out</span>
              </button>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* KPI SUMMARY STATS CARDS */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow relative overflow-hidden group">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                Total Enquiries
              </span>
              <div className="w-10 h-10 rounded-2xl bg-pink-50 text-[#ec2c6c] flex items-center justify-center shadow-xs group-hover:scale-110 transition-transform">
                <Activity className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-3xl font-black text-slate-900 tracking-tight">
                {stats.totalEnquiries || leads.length}
              </span>
              <p className="text-[11px] text-slate-400 mt-1 font-medium">Submitted queries</p>
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-pink-500 to-[#ec2c6c]" />
          </div>

          <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow relative overflow-hidden group">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                Partner Hospitals
              </span>
              <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-xs group-hover:scale-110 transition-transform">
                <Building2 className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-3xl font-black text-indigo-900 tracking-tight">
                {stats.totalHospitalsContacted || hospitalGroups.length}
              </span>
              <p className="text-[11px] text-slate-400 mt-1 font-medium">Unique clinics reached</p>
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 to-blue-600" />
          </div>

          <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow relative overflow-hidden group">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                In Progress
              </span>
              <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shadow-xs group-hover:scale-110 transition-transform">
                <Clock className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-3xl font-black text-amber-700 tracking-tight">
                {leads.filter((l) => ['NEW', 'CONTACTED', 'IN_PROGRESS'].includes(l.status)).length}
              </span>
              <p className="text-[11px] text-slate-400 mt-1 font-medium">Active consultations</p>
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 to-amber-600" />
          </div>

          <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow relative overflow-hidden group">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                Hospital Reverts
              </span>
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-xs group-hover:scale-110 transition-transform">
                <Sparkles className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-3xl font-black text-emerald-700 tracking-tight">
                {leads.filter((l) => (l.notes && l.notes.length > 0) || l.status === 'CONVERTED').length}
              </span>
              <p className="text-[11px] text-slate-400 mt-1 font-medium">Coordinators answered</p>
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-400 to-emerald-600" />
          </div>
        </div>

        {/* ========================================================================= */}
        {/* TAB NAVIGATION PILLS */}
        {/* ========================================================================= */}
        <div className="bg-white p-1.5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap gap-1.5">
          <button
            onClick={() => setCurrentTab('hospitals')}
            className={`px-5 py-3 rounded-xl text-xs font-extrabold flex items-center space-x-2 transition-all cursor-pointer ${
              currentTab === 'hospitals'
                ? 'bg-gradient-to-r from-pink-600 to-[#b02151] text-white shadow-md'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>My Hospitals ({hospitalGroups.length})</span>
          </button>

          <button
            onClick={() => setCurrentTab('enquiries')}
            className={`px-5 py-3 rounded-xl text-xs font-extrabold flex items-center space-x-2 transition-all cursor-pointer ${
              currentTab === 'enquiries'
                ? 'bg-gradient-to-r from-pink-600 to-[#b02151] text-white shadow-md'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>All Enquiries Stream ({leads.length})</span>
          </button>

          <button
            onClick={() => setCurrentTab('profile')}
            className={`px-5 py-3 rounded-xl text-xs font-extrabold flex items-center space-x-2 transition-all cursor-pointer ${
              currentTab === 'profile'
                ? 'bg-gradient-to-r from-pink-600 to-[#b02151] text-white shadow-md'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <UserIcon className="w-4 h-4" />
            <span>Profile & Address</span>
          </button>

          <button
            onClick={() => setCurrentTab('security')}
            className={`px-5 py-3 rounded-xl text-xs font-extrabold flex items-center space-x-2 transition-all cursor-pointer ${
              currentTab === 'security'
                ? 'bg-gradient-to-r from-pink-600 to-[#b02151] text-white shadow-md'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <KeyRound className="w-4 h-4" />
            <span>Account Security</span>
          </button>
        </div>

        {/* ========================================================================= */}
        {/* TAB 1: HOSPITAL-CENTRIC ACCORDION & FOLDER VIEW (SCALABLE FOR 100+ HOSPITALS) */}
        {/* ========================================================================= */}
        {currentTab === 'hospitals' && (
          <div className="space-y-6">
            {/* Search & Filter Bar */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter by hospital name, city, specialty, doctor revert..."
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-[#ec2c6c] focus:outline-none transition-all"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-3 text-xs text-slate-400 hover:text-slate-600 font-bold"
                  >
                    ✕
                  </button>
                )}
              </div>

              <div className="text-xs text-slate-500 font-bold self-end md:self-center">
                Managing <strong>{filteredHospitalGroups.length}</strong> hospital relations
              </div>
            </div>

            {loading ? (
              <div className="p-16 text-center bg-white rounded-3xl border border-slate-200/80 space-y-4">
                <Loader2 className="w-10 h-10 text-[#ec2c6c] animate-spin mx-auto" />
                <h4 className="font-extrabold text-slate-800 text-base">Loading Your Hospital Directory...</h4>
              </div>
            ) : filteredHospitalGroups.length === 0 ? (
              <div className="p-16 text-center bg-white rounded-3xl border border-slate-200/80 space-y-5">
                <div className="w-16 h-16 rounded-full bg-pink-50 text-[#ec2c6c] flex items-center justify-center mx-auto shadow-inner">
                  <Building2 className="w-8 h-8" />
                </div>
                <div className="space-y-1 max-w-md mx-auto">
                  <h3 className="text-xl font-black text-slate-900">No Hospitals Found</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    {searchQuery
                      ? 'No hospitals match your search keyword. Try a different query.'
                      : 'You have not submitted enquiries to any hospital yet. Browse accredited hospitals to get expert medical advice.'}
                  </p>
                </div>
                <div className="pt-2">
                  <Link
                    href="/hospital"
                    className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-pink-600 to-[#b02151] hover:from-pink-700 hover:to-[#961943] text-white text-xs font-bold rounded-xl shadow-lg transition-all"
                  >
                    <Stethoscope className="w-4 h-4" />
                    <span>Browse Hospital Directory</span>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="space-y-5">
                {filteredHospitalGroups.map((group) => {
                  const hKey = String(group.hospitalId || group.name);
                  const isExpanded = !!expandedHospitalMap[hKey];

                  return (
                    <div
                      key={hKey}
                      className="bg-white rounded-3xl border border-slate-200/80 shadow-xs hover:border-pink-200 hover:shadow-md transition-all overflow-hidden"
                    >
                      {/* Master Hospital Card Header Banner */}
                      <div className="p-6 sm:p-7 flex flex-col md:flex-row md:items-center justify-between gap-5 bg-gradient-to-r from-white via-slate-50/50 to-white">
                        <div className="flex items-start space-x-4">
                          <div className="relative w-16 h-16 rounded-2xl overflow-hidden bg-white border border-slate-200 shadow-sm flex items-center justify-center flex-shrink-0">
                            {group.logo ? (
                              <img
                                src={group.logo}
                                alt={group.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <Building2 className="w-8 h-8 text-[#ec2c6c]" />
                            )}
                          </div>

                          <div className="space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="text-lg sm:text-xl font-black text-slate-900">
                                {group.name}
                              </h3>
                              {group.rating && (
                                <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[11px] font-extrabold bg-amber-50 text-amber-800 border border-amber-200">
                                  <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                                  <span>{group.rating}</span>
                                </span>
                              )}
                              {group.isNabhAccredited && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-50 text-blue-700 border border-blue-200">
                                  NABH Accredited
                                </span>
                              )}
                              {group.isVerifiedPartner && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  Verified Partner
                                </span>
                              )}
                            </div>

                            {group.city && (
                              <p className="text-xs text-slate-500 font-medium flex items-center">
                                <MapPin className="w-3.5 h-3.5 text-pink-500 mr-1 flex-shrink-0" />
                                <span>{group.city}{group.state ? `, ${group.state}` : ''}</span>
                                {group.address && (
                                  <span className="hidden lg:inline text-slate-400"> • {group.address}</span>
                                )}
                              </p>
                            )}

                            <div className="flex items-center space-x-3 text-[11px] text-slate-400 font-semibold pt-0.5">
                              <span className="text-[#ec2c6c] font-black">
                                {group.leads.length} Enquiry(s) Submitted
                              </span>
                              <span>•</span>
                              <span>
                                Latest: {new Date(group.lastEnquiryDate).toLocaleDateString('en-IN', {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric',
                                })}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Action Buttons & Accordion Toggle */}
                        <div className="flex flex-wrap items-center gap-2 self-start md:self-center">
                          {group.phone && (
                            <a
                              href={`tel:${group.phone}`}
                              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl flex items-center space-x-1.5 transition-colors shadow-xs"
                            >
                              <Phone className="w-3.5 h-3.5" />
                              <span>Call</span>
                            </a>
                          )}
                          {group.slug && (
                            <Link
                              href={`/hospital/${group.slug}`}
                              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl border border-slate-200 flex items-center space-x-1.5 transition-colors"
                            >
                              <span>Profile</span>
                              <ArrowUpRight className="w-3 h-3 text-slate-500" />
                            </Link>
                          )}
                          <button
                            onClick={() => toggleHospitalExpand(hKey)}
                            className="px-4 py-2 bg-slate-900 hover:bg-black text-white font-extrabold text-xs rounded-xl flex items-center space-x-1.5 transition-colors cursor-pointer shadow-xs"
                          >
                            <span>{isExpanded ? 'Hide Enquiries' : `View (${group.leads.length})`}</span>
                            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                          </button>
                          {/* Delete/Remove Hospital Button */}
                          <button
                            onClick={() => promptDeleteHospital(group)}
                            title="Remove this hospital and all its queries"
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Expandable Enquiries Section For This Specific Hospital */}
                      {isExpanded && (
                        <div className="border-t border-slate-100 bg-slate-50/50 p-6 sm:p-7 space-y-4">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-black uppercase text-slate-400 tracking-wider">
                              Consultation History for {group.name}
                            </span>
                            <span className="text-xs text-slate-500 font-bold">
                              {group.leads.length} record(s)
                            </span>
                          </div>

                          <div className="space-y-4">
                            {group.leads.map((lead) => {
                              const service = lead.service;
                              const hasNotes = lead.notes && lead.notes.length > 0;

                              return (
                                <div
                                  key={lead.id}
                                  className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-4"
                                >
                                  {/* Lead Header */}
                                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                                    <div className="flex items-center space-x-2">
                                      <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-pink-50 text-[#ec2c6c] border border-pink-200">
                                        {service?.name || 'General Consultation'}
                                      </span>
                                      <span className="text-xs text-slate-400 font-bold">
                                        Ref #{lead.id}
                                      </span>
                                    </div>

                                    <div className="flex items-center space-x-3">
                                      {getStatusBadge(lead.status)}
                                      <span className="text-[11px] text-slate-400 font-medium">
                                        {new Date(lead.createdAt).toLocaleDateString('en-IN', {
                                          day: 'numeric',
                                          month: 'short',
                                          year: 'numeric',
                                        })}
                                      </span>
                                      <button
                                        onClick={() => promptDeleteEnquiry(lead)}
                                        title="Delete this query"
                                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </div>

                                  {/* Message & Contact details */}
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                                    <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                                      <span className="text-[10px] font-bold text-slate-400 uppercase">Contact Info Sent</span>
                                      <p className="font-extrabold text-slate-900">{lead.patientName}</p>
                                      <p className="text-slate-600">{lead.phone} • {lead.email}</p>
                                      {lead.preferredContactTime && (
                                        <p className="text-slate-500 text-[11px] pt-0.5">
                                          Preferred: <strong>{lead.preferredContactTime}</strong>
                                        </p>
                                      )}
                                    </div>

                                    {lead.message ? (
                                      <div className="p-3 bg-amber-50/50 rounded-xl border border-amber-100 space-y-1">
                                        <span className="text-[10px] font-bold text-amber-900 uppercase">Your Query</span>
                                        <p className="text-slate-800 font-medium leading-relaxed">&quot;{lead.message}&quot;</p>
                                      </div>
                                    ) : (
                                      <div className="p-3 bg-slate-50 rounded-xl flex items-center text-slate-400 font-medium italic">
                                        No additional message provided.
                                      </div>
                                    )}
                                  </div>

                                  {/* Hospital Coordinator Reverts */}
                                  {hasNotes && (
                                    <div className="p-4 bg-purple-50/70 rounded-xl border border-purple-200/60 space-y-2.5">
                                      <div className="flex items-center space-x-1.5 text-purple-950 font-black text-xs uppercase tracking-wider">
                                        <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                                        <span>Hospital Coordinator Reverts ({lead.notes!.length})</span>
                                      </div>

                                      <div className="space-y-2 pt-1 border-t border-purple-100">
                                        {lead.notes!.map((note, idx) => (
                                          <div
                                            key={idx}
                                            className="bg-white p-3 rounded-lg border border-purple-100 text-xs space-y-1 shadow-2xs"
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
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: FLAT ENQUIRIES STREAM TIMELINE VIEW */}
        {/* ========================================================================= */}
        {currentTab === 'enquiries' && (
          <div className="space-y-6">
            <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by hospital name, specialty, location, or query message..."
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-[#ec2c6c] focus:outline-none transition-all"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-3 text-xs text-slate-400 hover:text-slate-600 font-bold"
                    >
                      ✕
                    </button>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold text-slate-400 uppercase">Hospital:</span>
                  <select
                    value={selectedHospitalFilter}
                    onChange={(e) => setSelectedHospitalFilter(e.target.value)}
                    className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#ec2c6c] cursor-pointer"
                  >
                    <option value="ALL">All Hospitals ({leads.length})</option>
                    {hospitalGroups.map((g) => (
                      <option key={g.hospitalId || g.name} value={g.name}>
                        {g.name} ({g.leads.length})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold text-slate-400 uppercase">Status:</span>
                  <select
                    value={selectedStatusFilter}
                    onChange={(e) => setSelectedStatusFilter(e.target.value)}
                    className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#ec2c6c] cursor-pointer"
                  >
                    <option value="ALL">All Statuses</option>
                    <option value="NEW">Received</option>
                    <option value="CONTACTED">Hospital Contacted</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="CONVERTED">Confirmed</option>
                    <option value="CLOSED">Completed</option>
                  </select>
                </div>
              </div>
            </div>

            {loading ? (
              <div className="p-16 text-center bg-white rounded-3xl border border-slate-200/80 space-y-4">
                <Loader2 className="w-10 h-10 text-[#ec2c6c] animate-spin mx-auto" />
                <h4 className="font-extrabold text-slate-800 text-base">Loading Inquiries Stream...</h4>
              </div>
            ) : filteredLeads.length === 0 ? (
              <div className="p-16 text-center bg-white rounded-3xl border border-slate-200/80 space-y-5">
                <FileText className="w-12 h-12 text-slate-300 mx-auto" />
                <h3 className="text-lg font-bold text-slate-800">No Enquiries Found</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                  No inquiries match your current filter criteria.
                </p>
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
                      className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-xs hover:border-pink-200 hover:shadow-md transition-all space-y-5"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-slate-100 pb-4">
                        <div className="flex items-start space-x-3.5">
                          <div className="relative w-12 h-12 rounded-2xl overflow-hidden bg-slate-50 border border-slate-200/80 flex items-center justify-center flex-shrink-0 shadow-inner">
                            {hospital?.logo ? (
                              <img
                                src={hospital.logo}
                                alt={hospital.name}
                                className="w-full h-full object-cover"
                              />
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
                          <div className="flex items-center space-x-2">
                            {getStatusBadge(lead.status)}
                            <button
                              onClick={() => promptDeleteEnquiry(lead)}
                              title="Delete Enquiry"
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <span className="text-[11px] text-slate-400 font-medium">
                            #{lead.id} • {new Date(lead.createdAt).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                        <div className="p-4 bg-pink-50/40 rounded-2xl border border-pink-100 space-y-1">
                          <span className="text-[10px] font-extrabold uppercase text-pink-800 tracking-wider">
                            Medical Service
                          </span>
                          <p className="font-black text-[#ec2c6c] text-sm">
                            {service?.name || 'General Medical Consultation'}
                          </p>
                        </div>

                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/70 space-y-1">
                          <span className="text-[10px] font-extrabold uppercase text-slate-500 tracking-wider">
                            Contact Stored
                          </span>
                          <p className="font-extrabold text-slate-900">{lead.patientName}</p>
                          <p className="text-slate-600 font-medium">{lead.phone} • {lead.email}</p>
                        </div>

                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/70 flex flex-col justify-center space-y-2">
                          {hospital?.phone && (
                            <a
                              href={`tel:${hospital.phone}`}
                              className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl flex items-center justify-center space-x-1.5 transition-colors shadow-xs"
                            >
                              <Phone className="w-3.5 h-3.5" />
                              <span>Call: {hospital.phone}</span>
                            </a>
                          )}
                          {hospital?.slug ? (
                            <Link
                              href={`/hospital/${hospital.slug}`}
                              className="w-full py-1.5 bg-white hover:bg-slate-100 text-slate-800 font-bold text-xs rounded-xl border border-slate-200 flex items-center justify-center space-x-1.5 transition-colors"
                            >
                              <span>View Profile</span>
                              <ArrowUpRight className="w-3.5 h-3.5 text-slate-500" />
                            </Link>
                          ) : null}
                        </div>
                      </div>

                      {lead.message && (
                        <div className="p-4 bg-amber-50/40 rounded-2xl border border-amber-200/70 space-y-1 text-xs">
                          <span className="text-[10px] font-extrabold uppercase text-amber-900 tracking-wider">
                            Your Enquiry Message
                          </span>
                          <p className="text-slate-800 leading-relaxed font-medium">
                            &quot;{lead.message}&quot;
                          </p>
                        </div>
                      )}

                      {hasNotes && (
                        <div className="p-4 bg-purple-50/70 rounded-2xl border border-purple-200/60 space-y-2.5">
                          <div className="flex items-center space-x-1.5 text-purple-950 font-black text-xs uppercase tracking-wider">
                            <Sparkles className="w-4 h-4 text-purple-600" />
                            <span>Hospital Coordinator Response & Reverts ({lead.notes!.length})</span>
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
                })}

                {filteredLeads.length > 0 && (
                  <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4 mt-6">
                    <div className="flex items-center space-x-4 text-xs text-slate-500 font-semibold">
                      <span>
                        Showing <strong>{(currentPage - 1) * pageSize + 1}</strong> to{' '}
                        <strong>{Math.min(currentPage * pageSize, filteredLeads.length)}</strong> of{' '}
                        <strong>{filteredLeads.length}</strong> inquiries
                      </span>

                      <div className="flex items-center space-x-1.5 pl-3 border-l border-slate-200">
                        <span className="text-[11px] text-slate-400">Per page:</span>
                        {[5, 10, 20].map((size) => (
                          <button
                            key={size}
                            onClick={() => setPageSize(size)}
                            className={`px-2.5 py-1 text-xs font-extrabold rounded-lg transition-colors cursor-pointer ${
                              pageSize === size
                                ? 'bg-slate-900 text-white'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                          >
                            {size}
                          </button>
                        ))}
                      </div>
                    </div>

                    {totalPages > 1 && (
                      <div className="flex items-center space-x-1.5">
                        <button
                          onClick={() => setCurrentPage(1)}
                          disabled={currentPage === 1}
                          className="px-3 py-1.5 text-xs font-bold rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                        >
                          « First
                        </button>
                        <button
                          onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                          disabled={currentPage === 1}
                          className="px-3 py-1.5 text-xs font-bold rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
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
                                    <span className="px-1 text-slate-400 text-xs font-bold">...</span>
                                  )}
                                  <button
                                    onClick={() => setCurrentPage(page)}
                                    className={`w-8 h-8 text-xs font-black rounded-xl transition-colors cursor-pointer ${
                                      currentPage === page
                                        ? 'bg-gradient-to-r from-pink-600 to-[#b02151] text-white shadow-sm'
                                        : 'border border-slate-200 text-slate-700 hover:bg-slate-50'
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
                          className="px-3 py-1.5 text-xs font-bold rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                        >
                          Next ›
                        </button>
                        <button
                          onClick={() => setCurrentPage(totalPages)}
                          disabled={currentPage === totalPages}
                          className="px-3 py-1.5 text-xs font-bold rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
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

        {/* ========================================================================= */}
        {/* TAB 3: MY PROFILE & RESIDENTIAL ADDRESS */}
        {/* ========================================================================= */}
        {currentTab === 'profile' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-4 space-y-6">
              <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-xs text-center space-y-5">
                <div className="relative w-28 h-28 mx-auto rounded-3xl overflow-hidden bg-gradient-to-br from-pink-500 to-[#b02151] ring-4 ring-pink-100 shadow-xl flex items-center justify-center text-white font-black text-4xl">
                  {profileAvatar ? (
                    <img
                      src={profileAvatar}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span>{profileName ? profileName.trim()[0].toUpperCase() : 'P'}</span>
                  )}

                  {avatarUploading && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                      <Loader2 className="w-8 h-8 text-white animate-spin" />
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <h3 className="font-extrabold text-slate-900 text-lg">{profileName || 'Patient'}</h3>
                  <p className="text-xs text-slate-500 font-medium">{user?.email}</p>
                </div>

                <div className="flex flex-col gap-2 pt-2">
                  <label className="w-full py-2.5 bg-slate-900 hover:bg-black text-white text-xs font-extrabold rounded-xl transition-all shadow-sm cursor-pointer flex items-center justify-center space-x-1.5">
                    <Upload className="w-3.5 h-3.5" />
                    <span>{profileAvatar ? 'Change Profile Picture' : 'Upload Profile Picture'}</span>
                    <input
                      type="file"
                      accept="image/png, image/jpeg, image/webp"
                      className="hidden"
                      onChange={handleAvatarUpload}
                      disabled={avatarUploading}
                    />
                  </label>

                  {profileAvatar && (
                    <button
                      type="button"
                      onClick={handleRemoveAvatar}
                      className="w-full py-2 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold rounded-xl transition-colors flex items-center justify-center space-x-1.5 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remove Picture</span>
                    </button>
                  )}
                </div>

                <div className="pt-4 border-t border-slate-100 text-left space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-400 font-bold">Account Status</span>
                    <span className="font-extrabold text-emerald-600">Active</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-400 font-bold">Patient Role</span>
                    <span className="font-extrabold text-slate-700">Verified Patient</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-400 font-bold">Member Since</span>
                    <span className="font-extrabold text-slate-700">
                      {user?.createdAt ? new Date(user.createdAt).getFullYear() : '2026'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-8 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
              <div>
                <h3 className="text-xl font-black text-slate-900">Personal & Address Details</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Keep your contact information and residential address updated for hospital consultations.
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
                <div className="space-y-4">
                  <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider flex items-center space-x-1.5">
                    <UserIcon className="w-3.5 h-3.5 text-[#ec2c6c]" />
                    <span>Personal Information</span>
                  </h4>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={profileName}
                      onChange={(e) => setProfileName(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-[#ec2c6c] focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                        Email Address (Read-Only)
                      </label>
                      <input
                        type="email"
                        disabled
                        value={user?.email || ''}
                        className="w-full px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-sm font-bold text-slate-500 cursor-not-allowed"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                        Mobile Phone Number
                      </label>
                      <input
                        type="tel"
                        value={profilePhone}
                        onChange={(e) => setProfilePhone(e.target.value)}
                        placeholder="+91 Mobile number"
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-[#ec2c6c] focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4 pt-6 border-t border-slate-100">
                  <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider flex items-center space-x-1.5">
                    <Home className="w-3.5 h-3.5 text-[#ec2c6c]" />
                    <span>Residential Address</span>
                  </h4>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Street Address / House No.
                    </label>
                    <textarea
                      rows={2}
                      value={profileAddress}
                      onChange={(e) => setProfileAddress(e.target.value)}
                      placeholder="e.g. Flat 402, Royal Residency, Main GT Road"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-[#ec2c6c] focus:outline-none resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                        City
                      </label>
                      <input
                        type="text"
                        value={profileCity}
                        onChange={(e) => setProfileCity(e.target.value)}
                        placeholder="e.g. Ludhiana"
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-[#ec2c6c] focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                        State
                      </label>
                      <input
                        type="text"
                        value={profileState}
                        onChange={(e) => setProfileState(e.target.value)}
                        placeholder="e.g. Punjab"
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-[#ec2c6c] focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                        Pincode
                      </label>
                      <input
                        type="text"
                        value={profilePincode}
                        onChange={(e) => setProfilePincode(e.target.value)}
                        placeholder="e.g. 141001"
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-[#ec2c6c] focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={profileSaving}
                    className="w-full py-3.5 bg-gradient-to-r from-pink-600 to-[#b02151] hover:from-pink-700 hover:to-[#961943] text-white font-extrabold text-sm rounded-xl shadow-lg transition-all flex items-center justify-center space-x-2 cursor-pointer"
                  >
                    {profileSaving ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Saving Changes...</span>
                      </>
                    ) : (
                      <span>Save Profile & Address</span>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: ACCOUNT SECURITY & PASSWORD */}
        {/* ========================================================================= */}
        {currentTab === 'security' && (
          <div className="max-w-2xl mx-auto bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
            <div>
              <h3 className="text-xl font-black text-slate-900">Account Security & Password</h3>
              <p className="text-xs text-slate-500 mt-1">
                Change your password to keep your Clinic By Choice patient account safe.
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

            <form onSubmit={handleProfileUpdate} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Current Password *
                </label>
                <div className="relative">
                  <input
                    type={showCurrentPass ? 'text' : 'password'}
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-[#ec2c6c] focus:outline-none pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPass(!showCurrentPass)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                  >
                    {showCurrentPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    New Password *
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPass ? 'text' : 'password'}
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Min 6 characters"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-[#ec2c6c] focus:outline-none pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPass(!showNewPass)}
                      className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                    >
                      {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Confirm New Password *
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPass ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter new password"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-[#ec2c6c] focus:outline-none pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPass(!showConfirmPass)}
                      className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                    >
                      {showConfirmPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-600 space-y-1">
                <p className="font-bold text-slate-800">Password Tips:</p>
                <p>• Use at least 6 characters with a combination of letters, numbers, and symbols.</p>
                <p>• Do not share your password or verification codes with anyone.</p>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={profileSaving}
                  className="w-full py-3.5 bg-slate-900 hover:bg-black text-white font-extrabold text-sm rounded-xl shadow-lg transition-all flex items-center justify-center space-x-2 cursor-pointer"
                >
                  {profileSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Updating Password...</span>
                    </>
                  ) : (
                    <span>Update Account Password</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
      </main>

      {/* ========================================================================= */}
      {/* DELETE CONFIRMATION MODAL */}
      {/* ========================================================================= */}
      {deleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="relative w-full max-w-md bg-white rounded-3xl p-6 sm:p-7 shadow-2xl border border-slate-100 space-y-5 animate-in fade-in zoom-in duration-150">
            <button
              onClick={() => setDeleteModal(null)}
              className="absolute right-4 top-4 p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-50 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center shadow-inner">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-lg font-black text-slate-900">{deleteModal.title}</h3>
              <p className="text-xs text-slate-500 leading-relaxed">{deleteModal.subtitle}</p>
            </div>

            <div className="flex items-center space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteModal(null)}
                disabled={deleting}
                className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={deleting}
                className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center justify-center space-x-1.5 cursor-pointer"
              >
                {deleting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>Yes, Delete</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
