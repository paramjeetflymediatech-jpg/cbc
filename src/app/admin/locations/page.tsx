'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  MapPin,
  Search,
  Plus,
  Edit2,
  Trash2,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Building,
  Layers,
  Star,
  X,
  Filter,
  FileText,
  HelpCircle,
  ExternalLink,
  Save,
  Globe,
  Sparkles,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import Swal from 'sweetalert2';
import RichTextEditor from '@/components/ui/RichTextEditor';

interface StateItem {
  id: number;
  name: string;
  status: 'ACTIVE' | 'INACTIVE';
}

interface DistrictItem {
  id: number;
  stateId: number;
  name: string;
  status: 'ACTIVE' | 'INACTIVE';
}

interface CityItem {
  id: number;
  stateId: number;
  districtId?: number | null;
  name: string;
  isPopular?: boolean;
  status: 'ACTIVE' | 'INACTIVE';
}

interface ServiceItem {
  id: number;
  name: string;
  slug: string;
  category?: string;
}

interface ServiceLocationItem {
  id: number;
  serviceId: number;
  serviceSlug?: string;
  serviceTitle?: string;
  cityName: string;
  citySlug: string;
  stateName?: string;
  shortDescription?: string;
  description?: string;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string;
  faqs?: Array<{ question: string; answer: string }>;
  status: 'ACTIVE' | 'INACTIVE';
  service?: ServiceItem;
  updatedAt?: string;
}

export default function AdminLocationsPage() {
  const [activeTab, setActiveTab] = useState<'STATES' | 'DISTRICTS' | 'CITIES' | 'SERVICE_LOCATIONS'>('STATES');
  const [states, setStates] = useState<StateItem[]>([]);
  const [districts, setDistricts] = useState<DistrictItem[]>([]);
  const [cities, setCities] = useState<CityItem[]>([]);
  const [serviceLocations, setServiceLocations] = useState<ServiceLocationItem[]>([]);
  const [serviceLocationsTotal, setServiceLocationsTotal] = useState(0);
  const [servicesList, setServicesList] = useState<ServiceItem[]>([]);

  const [loading, setLoading] = useState(true);
  const [slLoading, setSlLoading] = useState(false);
  const [slPage, setSlPage] = useState(1);
  const [slTotalPages, setSlTotalPages] = useState(1);
  const [slLimit, setSlLimit] = useState(25);

  const [search, setSearch] = useState('');
  const [selectedStateFilter, setSelectedStateFilter] = useState<string>('');
  const [selectedDistrictFilter, setSelectedDistrictFilter] = useState<string>('');
  const [selectedServiceFilter, setSelectedServiceFilter] = useState<string>('');

  const [locPage, setLocPage] = useState(1);
  const [locLimit, setLocLimit] = useState(25);

  // Location Hierarchy Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<{
    entityType: 'STATE' | 'DISTRICT' | 'CITY';
    id?: number;
    name: string;
    stateId?: number;
    districtId?: number | null;
    isPopular?: boolean;
    status: 'ACTIVE' | 'INACTIVE';
  } | null>(null);

  // Service Location Content Modal State
  const [isServiceLocModalOpen, setIsServiceLocModalOpen] = useState(false);
  const [serviceLocForm, setServiceLocForm] = useState<{
    id?: number;
    serviceId: number | '';
    cityName: string;
    stateName: string;
    serviceTitle: string;
    shortDescription: string;
    description: string;
    seoTitle: string;
    seoDescription: string;
    seoKeywords: string;
    faqs: Array<{ question: string; answer: string }>;
    status: 'ACTIVE' | 'INACTIVE';
  }>({
    serviceId: '',
    cityName: '',
    stateName: '',
    serviceTitle: '',
    shortDescription: '',
    description: '',
    seoTitle: '',
    seoDescription: '',
    seoKeywords: '',
    faqs: [{ question: '', answer: '' }],
    status: 'ACTIVE',
  });

  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchInitialCounts = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/service-locations?countsOnly=true');
      if (res.ok) {
        const data = await res.json();
        setServiceLocationsTotal(data.total || 0);
        setSlTotalPages(Math.ceil((data.total || 0) / slLimit));
      }
    } catch (err) {
      console.error('Error fetching initial counts:', err);
    }
  }, [slLimit]);

  const fetchLocations = useCallback(async () => {
    setLoading(true);
    try {
      let url = `/api/admin/locations?search=${encodeURIComponent(search)}`;
      if (selectedStateFilter) url += `&stateId=${selectedStateFilter}`;
      if (selectedDistrictFilter) url += `&districtId=${selectedDistrictFilter}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setStates(data.states || []);
        setDistricts(data.districts || []);
        setCities(data.cities || []);
      }
    } catch (err) {
      console.error('Error loading locations:', err);
    } finally {
      setLoading(false);
    }
  }, [search, selectedStateFilter, selectedDistrictFilter]);

  const fetchServiceLocations = useCallback(async (targetPage = slPage) => {
    setSlLoading(true);
    try {
      let url = `/api/admin/service-locations?page=${targetPage}&limit=${slLimit}&search=${encodeURIComponent(search)}`;
      if (selectedServiceFilter) url += `&serviceId=${selectedServiceFilter}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setServiceLocations(data.locations || []);
        setServiceLocationsTotal(data.total || 0);
        setSlTotalPages(data.totalPages || 1);
      }
    } catch (err) {
      console.error('Error loading service locations:', err);
    } finally {
      setSlLoading(false);
    }
  }, [search, selectedServiceFilter, slPage, slLimit]);

  const fetchServices = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/services');
      if (res.ok) {
        const data = await res.json();
        setServicesList(data.services || []);
      }
    } catch (err) {
      console.error('Error loading services:', err);
    }
  }, []);

  useEffect(() => {
    fetchLocations();
    fetchServices();
    fetchInitialCounts();
  }, [fetchLocations, fetchServices, fetchInitialCounts]);

  useEffect(() => {
    if (activeTab === 'SERVICE_LOCATIONS') {
      fetchServiceLocations(slPage);
    }
  }, [activeTab, fetchServiceLocations, slPage]);

  // Reset page when search or filters change
  useEffect(() => {
    setSlPage(1);
  }, [search, selectedServiceFilter]);

  useEffect(() => {
    setLocPage(1);
  }, [activeTab, search, selectedStateFilter, selectedDistrictFilter]);

  // Modal Handlers for Hierarchy (State/District/City)
  const handleOpenAddModal = (entityType: 'STATE' | 'DISTRICT' | 'CITY') => {
    setEditingItem({
      entityType,
      name: '',
      stateId: states.length > 0 ? states[0].id : undefined,
      districtId: null,
      isPopular: false,
      status: 'ACTIVE',
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (entityType: 'STATE' | 'DISTRICT' | 'CITY', item: any) => {
    if (entityType === 'STATE') {
      setEditingItem({
        entityType: 'STATE',
        id: item.id,
        name: item.name,
        status: item.status,
      });
    } else if (entityType === 'DISTRICT') {
      setEditingItem({
        entityType: 'DISTRICT',
        id: item.id,
        name: item.name,
        stateId: item.stateId,
        status: item.status,
      });
    } else if (entityType === 'CITY') {
      setEditingItem({
        entityType: 'CITY',
        id: item.id,
        name: item.name,
        stateId: item.stateId,
        districtId: item.districtId || null,
        isPopular: item.isPopular || false,
        status: item.status,
      });
    }
    setIsModalOpen(true);
  };

  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem || !editingItem.name.trim()) return;

    setSaving(true);
    setFeedback(null);
    try {
      const method = editingItem.id ? 'PUT' : 'POST';
      const res = await fetch('/api/admin/locations', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingItem),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save location entry.');
      }

      Swal.fire({
        icon: 'success',
        title: 'Saved Successfully',
        text: data.message || 'Location entry saved successfully!',
        timer: 2000,
        showConfirmButton: false,
      });

      setIsModalOpen(false);
      fetchLocations();
    } catch (err: any) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: err.message || 'Error saving location.',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteItem = async (entityType: 'STATE' | 'DISTRICT' | 'CITY', id: number, name: string) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: `Do you want to delete ${entityType.toLowerCase()} "${name}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ec2c6c',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, delete it!',
    });

    if (!result.isConfirmed) return;

    try {
      const res = await fetch(`/api/admin/locations?entityType=${entityType}&id=${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Delete failed.');

      Swal.fire({
        icon: 'success',
        title: 'Deleted!',
        text: `${entityType} deleted successfully.`,
        timer: 2000,
        showConfirmButton: false,
      });
      fetchLocations();
    } catch (err: any) {
      Swal.fire({
        icon: 'error',
        title: 'Delete Failed',
        text: err.message || 'Error deleting location.',
      });
    }
  };

  // Service Location CRUD Handlers
  const handleOpenAddServiceLoc = () => {
    setServiceLocForm({
      serviceId: servicesList.length > 0 ? servicesList[0].id : '',
      cityName: '',
      stateName: states.length > 0 ? states[0].name : '',
      serviceTitle: '',
      shortDescription: '',
      description: '',
      seoTitle: '',
      seoDescription: '',
      seoKeywords: '',
      faqs: [{ question: '', answer: '' }],
      status: 'ACTIVE',
    });
    setIsServiceLocModalOpen(true);
  };

  const handleOpenEditServiceLoc = (item: ServiceLocationItem) => {
    setServiceLocForm({
      id: item.id,
      serviceId: item.serviceId,
      cityName: item.cityName,
      stateName: item.stateName || '',
      serviceTitle: item.serviceTitle || '',
      shortDescription: item.shortDescription || '',
      description: item.description || '',
      seoTitle: item.seoTitle || '',
      seoDescription: item.seoDescription || '',
      seoKeywords: item.seoKeywords || '',
      faqs: item.faqs && item.faqs.length > 0 ? item.faqs : [{ question: '', answer: '' }],
      status: item.status,
    });
    setIsServiceLocModalOpen(true);
  };

  const handleSaveServiceLoc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!serviceLocForm.serviceId || !serviceLocForm.cityName.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Missing Required Fields',
        text: 'Please select a service and specify the city name.',
      });
      return;
    }

    setSaving(true);
    try {
      const cleanFaqs = serviceLocForm.faqs.filter((f) => f.question.trim() && f.answer.trim());
      const payload = {
        ...serviceLocForm,
        faqs: cleanFaqs,
      };

      let res;
      if (serviceLocForm.id) {
        res = await fetch(`/api/admin/service-locations/${serviceLocForm.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch('/api/admin/service-locations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save city service content');

      Swal.fire({
        icon: 'success',
        title: 'Saved Successfully',
        text: `City description & SEO for ${serviceLocForm.cityName} saved!`,
        timer: 2000,
        showConfirmButton: false,
      });

      setIsServiceLocModalOpen(false);
      fetchServiceLocations();
    } catch (err: any) {
      Swal.fire({
        icon: 'error',
        title: 'Save Failed',
        text: err.message || 'Error saving city service content.',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteServiceLoc = async (id: number, serviceName?: string, cityName?: string) => {
    const result = await Swal.fire({
      title: 'Delete City Content?',
      text: `Are you sure you want to remove the custom content for "${serviceName} in ${cityName}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ec2c6c',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, delete',
    });

    if (!result.isConfirmed) return;

    try {
      const res = await fetch(`/api/admin/service-locations/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Delete failed');

      Swal.fire({
        icon: 'success',
        title: 'Deleted',
        text: 'Custom city service content deleted.',
        timer: 2000,
        showConfirmButton: false,
      });
      fetchServiceLocations();
    } catch (err: any) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: err.message || 'Failed to delete record.',
      });
    }
  };

  const handleAddFaqField = () => {
    setServiceLocForm((prev) => ({
      ...prev,
      faqs: [...prev.faqs, { question: '', answer: '' }],
    }));
  };

  const handleRemoveFaqField = (index: number) => {
    setServiceLocForm((prev) => ({
      ...prev,
      faqs: prev.faqs.filter((_, i) => i !== index),
    }));
  };

  const handleFaqChange = (index: number, field: 'question' | 'answer', val: string) => {
    setServiceLocForm((prev) => {
      const updated = [...prev.faqs];
      updated[index][field] = val;
      return { ...prev, faqs: updated };
    });
  };

  const filteredDistricts = editingItem?.stateId
    ? districts.filter((d) => d.stateId === editingItem.stateId)
    : districts;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
        <div>
          <div className="flex items-center space-x-2 text-[#ec2c6c] font-bold text-xs uppercase tracking-wider mb-1">
            <MapPin className="w-4 h-4" />
            <span>Master Data & City Content</span>
          </div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Location & City Services Manager</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage Indian locations and customize city-specific service descriptions, SEO metadata, and FAQs.
          </p>
        </div>

        {activeTab === 'SERVICE_LOCATIONS' ? (
          <button
            onClick={handleOpenAddServiceLoc}
            className="inline-flex items-center justify-center px-4 py-2.5 bg-[#ec2c6c] hover:bg-[#d4225b] text-white font-bold rounded-xl shadow-md transition-all text-sm cursor-pointer"
          >
            <Plus className="w-4 h-4 mr-2" />
            <span>Add City Service Description</span>
          </button>
        ) : (
          <button
            onClick={() =>
              handleOpenAddModal(
                activeTab === 'STATES' ? 'STATE' : activeTab === 'DISTRICTS' ? 'DISTRICT' : 'CITY'
              )
            }
            className="inline-flex items-center justify-center px-4 py-2.5 bg-[#ec2c6c] hover:bg-[#d4225b] text-white font-bold rounded-xl shadow-md transition-all text-sm cursor-pointer"
          >
            <Plus className="w-4 h-4 mr-2" />
            <span>Add New {activeTab === 'STATES' ? 'State' : activeTab === 'DISTRICTS' ? 'District' : 'City'}</span>
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-3">
        <button
          onClick={() => setActiveTab('STATES')}
          className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl font-extrabold text-sm transition-all cursor-pointer ${
            activeTab === 'STATES'
              ? 'bg-[#101828] text-white shadow-md'
              : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
          }`}
        >
          <Building className="w-4 h-4 text-pink-400" />
          <span>States ({states.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('DISTRICTS')}
          className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl font-extrabold text-sm transition-all cursor-pointer ${
            activeTab === 'DISTRICTS'
              ? 'bg-[#101828] text-white shadow-md'
              : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
          }`}
        >
          <Layers className="w-4 h-4 text-pink-400" />
          <span>Districts ({districts.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('CITIES')}
          className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl font-extrabold text-sm transition-all cursor-pointer ${
            activeTab === 'CITIES'
              ? 'bg-[#101828] text-white shadow-md'
              : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
          }`}
        >
          <MapPin className="w-4 h-4 text-pink-400" />
          <span>Cities ({cities.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('SERVICE_LOCATIONS')}
          className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl font-extrabold text-sm transition-all cursor-pointer ${
            activeTab === 'SERVICE_LOCATIONS'
              ? 'bg-gradient-to-r from-[#ec2c6c] to-[#fd1d74] text-white shadow-md'
              : 'bg-white text-gray-700 hover:bg-pink-50 hover:text-[#ec2c6c] border border-pink-200'
          }`}
        >
          <Sparkles className="w-4 h-4 text-amber-300" />
          <span>City Service Descriptions & SEO ({serviceLocationsTotal.toLocaleString()})</span>
        </button>
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={
              activeTab === 'SERVICE_LOCATIONS'
                ? 'Search city service descriptions (e.g. Ludhiana, Dermatologist, Cancer)...'
                : `Search ${activeTab.toLowerCase()}...`
            }
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-800 placeholder:text-gray-400 focus:bg-white focus:ring-2 focus:ring-[#ec2c6c] focus:outline-none"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-2.5 text-xs text-gray-400 hover:text-gray-600 font-bold"
            >
              ✕
            </button>
          )}
        </div>

        {activeTab === 'SERVICE_LOCATIONS' && (
          <div className="flex items-center space-x-2 w-full md:w-auto">
            <span className="text-xs font-bold text-gray-500 uppercase flex-shrink-0">Service:</span>
            <select
              value={selectedServiceFilter}
              onChange={(e) => setSelectedServiceFilter(e.target.value)}
              className="w-full md:w-56 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#ec2c6c]"
            >
              <option value="">All Services ({servicesList.length})</option>
              {servicesList.map((srv) => (
                <option key={srv.id} value={srv.id}>
                  {srv.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {activeTab === 'CITIES' && (
          <div className="flex items-center space-x-2 w-full md:w-auto">
            <span className="text-xs font-bold text-gray-500 uppercase flex-shrink-0">Filter State:</span>
            <select
              value={selectedStateFilter}
              onChange={(e) => setSelectedStateFilter(e.target.value)}
              className="w-full md:w-48 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#ec2c6c]"
            >
              <option value="">All States</option>
              {states.map((st) => (
                <option key={st.id} value={st.id}>
                  {st.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="p-16 flex flex-col items-center justify-center bg-white rounded-2xl border border-gray-200">
          <Loader2 className="w-8 h-8 text-[#ec2c6c] animate-spin mb-2" />
          <span className="text-sm font-bold text-gray-500">Loading location records...</span>
        </div>
      ) : activeTab === 'SERVICE_LOCATIONS' ? (
        /* SERVICE LOCATIONS TAB CONTENT */
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-4 bg-gray-50/80 border-b border-gray-200 flex items-center justify-between">
            <div className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center space-x-2">
              <span>City-Specific Descriptions, SEO & FAQs ({serviceLocationsTotal.toLocaleString()})</span>
              {slLoading && <Loader2 className="w-3.5 h-3.5 text-[#ec2c6c] animate-spin" />}
            </div>
            <button
              onClick={handleOpenAddServiceLoc}
              className="text-xs font-bold text-[#ec2c6c] hover:underline flex items-center space-x-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Description</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-[10px] font-black uppercase text-gray-500 tracking-wider">
                  <th className="px-6 py-4">Service</th>
                  <th className="px-6 py-4">City / State</th>
                  <th className="px-6 py-4">SEO Title</th>
                  <th className="px-6 py-4">FAQs</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs text-gray-700 font-medium">
                {slLoading && serviceLocations.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-16">
                      <Loader2 className="w-6 h-6 text-[#ec2c6c] animate-spin mx-auto mb-2" />
                      <span className="text-xs text-gray-500 font-bold">Loading records...</span>
                    </td>
                  </tr>
                ) : serviceLocations.length > 0 ? (
                  serviceLocations.map((loc) => {
                    const serviceSlug = loc.service?.slug || loc.serviceSlug || 'service';
                    const citySlug = loc.citySlug || loc.cityName.toLowerCase().replace(/\s+/g, '-');
                    const liveUrl = `/hospitals/${serviceSlug}/${citySlug}`;

                    return (
                      <tr key={loc.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-extrabold text-gray-900">{loc.service?.name || loc.serviceSlug}</div>
                          {loc.serviceTitle && (
                            <div className="text-[11px] font-semibold text-[#ec2c6c] truncate max-w-xs" title={loc.serviceTitle}>
                              Heading: {loc.serviceTitle}
                            </div>
                          )}
                          <div className="text-[11px] text-gray-400 font-mono">/hospitals/{serviceSlug}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-bold text-[#ec2c6c] flex items-center space-x-1">
                            <MapPin className="w-3.5 h-3.5" />
                            <span>{loc.cityName}</span>
                          </div>
                          {loc.stateName && <div className="text-[11px] text-gray-400">{loc.stateName}</div>}
                        </td>
                        <td className="px-6 py-4 max-w-[200px] truncate" title={loc.seoTitle || ''}>
                          {loc.seoTitle || <span className="text-gray-400 italic">Default</span>}
                        </td>
                        <td className="px-6 py-4">
                          <span className="bg-pink-50 text-[#ec2c6c] font-bold text-[11px] px-2.5 py-1 rounded-full border border-pink-100">
                            {loc.faqs?.length || 0} FAQs
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              loc.status === 'ACTIVE'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-gray-100 text-gray-600'
                            }`}
                          >
                            {loc.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right whitespace-nowrap">
                          <div className="inline-flex space-x-2">
                            <Link
                              href={liveUrl}
                              target="_blank"
                              className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                              title="View Public City Page"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </Link>
                            <button
                              onClick={() => handleOpenEditServiceLoc(loc)}
                              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                              title="Edit"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteServiceLoc(loc.id, loc.service?.name, loc.cityName)}
                              className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-gray-400 italic">
                      No city service descriptions found. Click &quot;Add City Service Description&quot; above to create one.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {serviceLocationsTotal > 0 && (
            <div className="p-4 border-t border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-600">
              <div className="flex items-center gap-4 flex-wrap">
                <div>
                  Showing <strong>{(slPage - 1) * slLimit + 1}</strong> to{' '}
                  <strong>{Math.min(slPage * slLimit, serviceLocationsTotal).toLocaleString()}</strong> of{' '}
                  <strong className="text-[#ec2c6c]">{serviceLocationsTotal.toLocaleString()}</strong> records
                </div>

                <div className="flex items-center space-x-1.5">
                  <span className="text-gray-500 font-medium">Per page:</span>
                  <select
                    value={slLimit}
                    onChange={(e) => {
                      setSlLimit(Number(e.target.value));
                      setSlPage(1);
                    }}
                    className="bg-white border border-gray-200 rounded-lg px-2 py-1 text-xs font-bold text-gray-700 focus:outline-none focus:ring-1 focus:ring-[#ec2c6c] cursor-pointer"
                  >
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                </div>
              </div>

              {slTotalPages > 1 && (
                <div className="flex items-center space-x-1.5">
                  <button
                    onClick={() => setSlPage((p) => Math.max(1, p - 1))}
                    disabled={slPage === 1 || slLoading}
                    className="px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed font-bold flex items-center space-x-1 cursor-pointer"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    <span>Prev</span>
                  </button>

                  <span className="px-3 font-extrabold text-gray-800">
                    Page {slPage} of {slTotalPages.toLocaleString()}
                  </span>

                  <button
                    onClick={() => setSlPage((p) => Math.min(slTotalPages, p + 1))}
                    disabled={slPage === slTotalPages || slLoading}
                    className="px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed font-bold flex items-center space-x-1 cursor-pointer"
                  >
                    <span>Next</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        /* STATES, DISTRICTS, CITIES TABLES */
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-[10px] font-black uppercase text-gray-500 tracking-wider">
                  <th className="px-6 py-4">ID</th>
                  <th className="px-6 py-4">Name</th>
                  {activeTab === 'DISTRICTS' && <th className="px-6 py-4">State</th>}
                  {activeTab === 'CITIES' && (
                    <>
                      <th className="px-6 py-4">State</th>
                      <th className="px-6 py-4">District</th>
                      <th className="px-6 py-4">Popular</th>
                    </>
                  )}
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs text-gray-700 font-medium">
                {activeTab === 'STATES' &&
                  states.slice((locPage - 1) * locLimit, locPage * locLimit).map((st) => (
                    <tr key={st.id} className="hover:bg-gray-50/50">
                      <td className="px-6 py-4 text-gray-400 font-mono">#{st.id}</td>
                      <td className="px-6 py-4 font-bold text-gray-900">{st.name}</td>
                      <td className="px-6 py-4">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {st.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        <div className="inline-flex space-x-2">
                          <button
                            onClick={() => handleOpenEditModal('STATE', st)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg cursor-pointer"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteItem('STATE', st.id, st.name)}
                            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}

                {activeTab === 'DISTRICTS' &&
                  districts.slice((locPage - 1) * locLimit, locPage * locLimit).map((dt) => {
                    const st = states.find((s) => s.id === dt.stateId);
                    return (
                      <tr key={dt.id} className="hover:bg-gray-50/50">
                        <td className="px-6 py-4 text-gray-400 font-mono">#{dt.id}</td>
                        <td className="px-6 py-4 font-bold text-gray-900">{dt.name}</td>
                        <td className="px-6 py-4 text-gray-600">{st ? st.name : '-'}</td>
                        <td className="px-6 py-4">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            {dt.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right whitespace-nowrap">
                          <div className="inline-flex space-x-2">
                            <button
                              onClick={() => handleOpenEditModal('DISTRICT', dt)}
                              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg cursor-pointer"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteItem('DISTRICT', dt.id, dt.name)}
                              className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                {activeTab === 'CITIES' &&
                  cities.slice((locPage - 1) * locLimit, locPage * locLimit).map((ct) => {
                    const st = states.find((s) => s.id === ct.stateId);
                    const dt = districts.find((d) => d.id === ct.districtId);
                    return (
                      <tr key={ct.id} className="hover:bg-gray-50/50">
                        <td className="px-6 py-4 text-gray-400 font-mono">#{ct.id}</td>
                        <td className="px-6 py-4 font-bold text-gray-900">{ct.name}</td>
                        <td className="px-6 py-4 text-gray-600">{st ? st.name : '-'}</td>
                        <td className="px-6 py-4 text-gray-600">{dt ? dt.name : '-'}</td>
                        <td className="px-6 py-4">
                          {ct.isPopular ? (
                            <span className="inline-flex items-center text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full">
                              <Star className="w-3 h-3 fill-amber-400 text-amber-500 mr-1" />
                              Popular
                            </span>
                          ) : (
                            <span className="text-gray-400 text-[10px]">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            {ct.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right whitespace-nowrap">
                          <div className="inline-flex space-x-2">
                            <button
                              onClick={() => handleOpenEditModal('CITY', ct)}
                              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg cursor-pointer"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteItem('CITY', ct.id, ct.name)}
                              className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                {((activeTab === 'STATES' && states.length === 0) ||
                  (activeTab === 'DISTRICTS' && districts.length === 0) ||
                  (activeTab === 'CITIES' && cities.length === 0)) && (
                  <tr>
                    <td colSpan={activeTab === 'CITIES' ? 6 : activeTab === 'DISTRICTS' ? 5 : 4} className="text-center py-12 text-gray-400 italic">
                      No {activeTab.toLowerCase()} found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls for States / Districts / Cities */}
          {(() => {
            const currentList = activeTab === 'STATES' ? states : activeTab === 'DISTRICTS' ? districts : cities;
            const totalCount = currentList.length;
            const totalPages = Math.ceil(totalCount / locLimit);

            if (totalCount === 0) return null;

            return (
              <div className="p-4 border-t border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-600">
                <div className="flex items-center gap-4 flex-wrap">
                  <div>
                    Showing <strong>{(locPage - 1) * locLimit + 1}</strong> to{' '}
                    <strong>{Math.min(locPage * locLimit, totalCount).toLocaleString()}</strong> of{' '}
                    <strong className="text-[#ec2c6c]">{totalCount.toLocaleString()}</strong> {activeTab.toLowerCase()}
                  </div>

                  <div className="flex items-center space-x-1.5">
                    <span className="text-gray-500 font-medium">Per page:</span>
                    <select
                      value={locLimit}
                      onChange={(e) => {
                        setLocLimit(Number(e.target.value));
                        setLocPage(1);
                      }}
                      className="bg-white border border-gray-200 rounded-lg px-2 py-1 text-xs font-bold text-gray-700 focus:outline-none focus:ring-1 focus:ring-[#ec2c6c] cursor-pointer"
                    >
                      <option value={10}>10</option>
                      <option value={25}>25</option>
                      <option value={50}>50</option>
                      <option value={100}>100</option>
                    </select>
                  </div>
                </div>

                {totalPages > 1 && (
                  <div className="flex items-center space-x-1.5">
                    <button
                      onClick={() => setLocPage((p) => Math.max(1, p - 1))}
                      disabled={locPage === 1}
                      className="px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed font-bold flex items-center space-x-1 cursor-pointer"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                      <span>Prev</span>
                    </button>

                    <span className="px-3 font-extrabold text-gray-800">
                      Page {locPage} of {totalPages.toLocaleString()}
                    </span>

                    <button
                      onClick={() => setLocPage((p) => Math.min(totalPages, p + 1))}
                      disabled={locPage === totalPages}
                      className="px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed font-bold flex items-center space-x-1 cursor-pointer"
                    >
                      <span>Next</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      )}

      {/* MODAL 1: Hierarchy (State / District / City) */}
      {isModalOpen && editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-lg font-black text-gray-900">
                {editingItem.id ? 'Edit' : 'Add New'} {editingItem.entityType}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-gray-400 hover:text-gray-700 rounded-full hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveItem} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Name</label>
                <input
                  type="text"
                  required
                  value={editingItem.name}
                  onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                  placeholder={`Enter ${editingItem.entityType.toLowerCase()} name...`}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold focus:outline-none focus:border-[#ec2c6c]"
                />
              </div>

              {(editingItem.entityType === 'DISTRICT' || editingItem.entityType === 'CITY') && (
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Parent State</label>
                  <select
                    required
                    value={editingItem.stateId || ''}
                    onChange={(e) =>
                      setEditingItem({
                        ...editingItem,
                        stateId: Number(e.target.value),
                        districtId: null,
                      })
                    }
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold focus:outline-none focus:border-[#ec2c6c]"
                  >
                    <option value="">Select State...</option>
                    {states.map((st) => (
                      <option key={st.id} value={st.id}>
                        {st.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {editingItem.entityType === 'CITY' && (
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">District (Optional)</label>
                  <select
                    value={editingItem.districtId || ''}
                    onChange={(e) =>
                      setEditingItem({
                        ...editingItem,
                        districtId: e.target.value ? Number(e.target.value) : null,
                      })
                    }
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold focus:outline-none focus:border-[#ec2c6c]"
                  >
                    <option value="">None / Direct State City</option>
                    {filteredDistricts.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {editingItem.entityType === 'CITY' && (
                <div className="flex items-center space-x-2 pt-2">
                  <input
                    type="checkbox"
                    id="isPopular"
                    checked={editingItem.isPopular || false}
                    onChange={(e) => setEditingItem({ ...editingItem, isPopular: e.target.checked })}
                    className="w-4 h-4 text-[#ec2c6c] rounded focus:ring-[#ec2c6c]"
                  />
                  <label htmlFor="isPopular" className="text-xs font-bold text-gray-700 cursor-pointer">
                    Feature as Popular City in Search Pills
                  </label>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Status</label>
                <select
                  value={editingItem.status}
                  onChange={(e) => setEditingItem({ ...editingItem, status: e.target.value as any })}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold focus:outline-none focus:border-[#ec2c6c]"
                >
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                </select>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-[#ec2c6c] hover:bg-[#d4225b] text-white text-xs font-bold rounded-xl flex items-center space-x-2"
                >
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>Save Location</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Service Location Content & Description Modal */}
      {isServiceLocModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl space-y-6 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div>
                <span className="text-xs font-extrabold text-[#ec2c6c] uppercase tracking-wider">
                  City-Specific Content
                </span>
                <h3 className="text-xl font-black text-gray-900">
                  {serviceLocForm.id ? 'Edit City Service Content' : 'Add New City Service Content'}
                </h3>
              </div>
              <button
                onClick={() => setIsServiceLocModalOpen(false)}
                className="p-2 text-gray-400 hover:text-gray-700 rounded-full hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveServiceLoc} className="space-y-6">
              {/* Service & City Selectors */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                    Select Service <span className="text-rose-500">*</span>
                  </label>
                  <select
                    required
                    value={serviceLocForm.serviceId}
                    onChange={(e) => setServiceLocForm({ ...serviceLocForm, serviceId: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-800 focus:outline-none focus:border-[#ec2c6c]"
                  >
                    <option value="">Choose Service...</option>
                    {servicesList.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.category || 'General'})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                    City Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={serviceLocForm.cityName}
                    onChange={(e) => setServiceLocForm({ ...serviceLocForm, cityName: e.target.value })}
                    placeholder="e.g. Ludhiana, Delhi, Mumbai"
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-800 focus:outline-none focus:border-[#ec2c6c]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">State Name (Optional)</label>
                  <input
                    type="text"
                    value={serviceLocForm.stateName}
                    onChange={(e) => setServiceLocForm({ ...serviceLocForm, stateName: e.target.value })}
                    placeholder="e.g. Punjab, Maharashtra"
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-800 focus:outline-none focus:border-[#ec2c6c]"
                  />
                </div>
              </div>

              {/* Service Title / Banner Heading */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Banner Title / Custom Heading (Optional)
                </label>
                <input
                  type="text"
                  value={serviceLocForm.serviceTitle}
                  onChange={(e) => setServiceLocForm({ ...serviceLocForm, serviceTitle: e.target.value })}
                  placeholder="e.g. Best Dermatologists in Ludhiana (defaults to '{Service} in {City}')"
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:outline-none focus:border-[#ec2c6c]"
                />
                <p className="text-[11px] text-gray-400 mt-1">
                  Custom heading displayed as the main title on the banner of the city page (e.g. /hospitals/dermatologist/ludhiana).
                </p>
              </div>

              {/* Short Description */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  City Hero Summary / Short Description
                </label>
                <textarea
                  rows={2}
                  value={serviceLocForm.shortDescription}
                  onChange={(e) => setServiceLocForm({ ...serviceLocForm, shortDescription: e.target.value })}
                  placeholder="Short 1-2 line summary to display under the city banner heading..."
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:outline-none focus:border-[#ec2c6c]"
                />
              </div>

              {/* Detailed City Description (Rich Text Editor) */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Detailed City Service Guide & Healthcare Overview (Rich Text)
                </label>
                <p className="text-[11px] text-gray-400 mb-2">
                  This custom description will replace the default text on the dedicated city page (e.g. /hospitals/dermatologist/ludhiana).
                </p>
                <RichTextEditor
                  value={serviceLocForm.description}
                  onChange={(content) => setServiceLocForm({ ...serviceLocForm, description: content })}
                  placeholder="Write in-depth clinical guide, doctor expertise, treatment facilities, and surgical care available in this city..."
                />
              </div>

              {/* SEO Meta Fields */}
              <div className="bg-gray-50 p-5 rounded-2xl border border-gray-200 space-y-4">
                <div className="flex items-center space-x-2 text-xs font-bold uppercase text-gray-700">
                  <Globe className="w-4 h-4 text-[#ec2c6c]" />
                  <span>City-Specific SEO Metadata</span>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">Meta Title</label>
                    <input
                      type="text"
                      value={serviceLocForm.seoTitle}
                      onChange={(e) => setServiceLocForm({ ...serviceLocForm, seoTitle: e.target.value })}
                      placeholder="e.g. Best Dermatologists in Ludhiana - Top Clinics & Hospitals | Clinic By Choice"
                      className="w-full px-3.5 py-2 bg-white border border-gray-200 rounded-xl text-xs font-medium focus:outline-none focus:border-[#ec2c6c]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">Meta Description</label>
                    <textarea
                      rows={2}
                      value={serviceLocForm.seoDescription}
                      onChange={(e) => setServiceLocForm({ ...serviceLocForm, seoDescription: e.target.value })}
                      placeholder="e.g. Find top accredited dermatologist hospitals and specialist doctors in Ludhiana. Compare facilities and book free consultation."
                      className="w-full px-3.5 py-2 bg-white border border-gray-200 rounded-xl text-xs font-medium focus:outline-none focus:border-[#ec2c6c]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">Keywords</label>
                    <input
                      type="text"
                      value={serviceLocForm.seoKeywords}
                      onChange={(e) => setServiceLocForm({ ...serviceLocForm, seoKeywords: e.target.value })}
                      placeholder="e.g. dermatologist in ludhiana, skin clinic ludhiana, best skin hospital"
                      className="w-full px-3.5 py-2 bg-white border border-gray-200 rounded-xl text-xs font-medium focus:outline-none focus:border-[#ec2c6c]"
                    />
                  </div>
                </div>
              </div>

              {/* City FAQs Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-xs font-bold uppercase text-gray-700">
                    <HelpCircle className="w-4 h-4 text-[#ec2c6c]" />
                    <span>Frequently Asked Questions for this City ({serviceLocForm.faqs.length})</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddFaqField}
                    className="text-xs font-bold text-[#ec2c6c] hover:underline flex items-center space-x-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Question</span>
                  </button>
                </div>

                <div className="space-y-3">
                  {serviceLocForm.faqs.map((faq, idx) => (
                    <div key={idx} className="p-4 bg-gray-50 rounded-2xl border border-gray-200 space-y-2 relative group">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-[#ec2c6c] uppercase">FAQ #{idx + 1}</span>
                        {serviceLocForm.faqs.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveFaqField(idx)}
                            className="p-1 text-gray-400 hover:text-rose-600 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      <input
                        type="text"
                        value={faq.question}
                        onChange={(e) => handleFaqChange(idx, 'question', e.target.value)}
                        placeholder="Question (e.g. What is the average consultation fee in this city?)"
                        className="w-full px-3.5 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-900 focus:outline-none focus:border-[#ec2c6c]"
                      />

                      <textarea
                        rows={2}
                        value={faq.answer}
                        onChange={(e) => handleFaqChange(idx, 'answer', e.target.value)}
                        placeholder="Answer..."
                        className="w-full px-3.5 py-2 bg-white border border-gray-200 rounded-xl text-xs font-medium text-gray-700 focus:outline-none focus:border-[#ec2c6c]"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Status */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Status</label>
                <select
                  value={serviceLocForm.status}
                  onChange={(e) => setServiceLocForm({ ...serviceLocForm, status: e.target.value as any })}
                  className="w-full sm:w-48 px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold focus:outline-none focus:border-[#ec2c6c]"
                >
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                </select>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsServiceLocModalOpen(false)}
                  className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 bg-[#ec2c6c] hover:bg-[#d4225b] text-white text-xs font-bold rounded-xl flex items-center space-x-2 shadow-md transition-all cursor-pointer"
                >
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  <Save className="w-4 h-4" />
                  <span>Save City Content</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
