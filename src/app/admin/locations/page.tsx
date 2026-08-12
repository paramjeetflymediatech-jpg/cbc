'use client';

import React, { useState, useEffect, useCallback } from 'react';
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
} from 'lucide-react';

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

export default function AdminLocationsPage() {
  const [activeTab, setActiveTab] = useState<'STATES' | 'DISTRICTS' | 'CITIES'>('STATES');
  const [states, setStates] = useState<StateItem[]>([]);
  const [districts, setDistricts] = useState<DistrictItem[]>([]);
  const [cities, setCities] = useState<CityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedStateFilter, setSelectedStateFilter] = useState<string>('');
  const [selectedDistrictFilter, setSelectedDistrictFilter] = useState<string>('');

  // Modal State
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

  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

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

  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      try {
        let url = `/api/admin/locations?search=${encodeURIComponent(search)}`;
        if (selectedStateFilter) url += `&stateId=${selectedStateFilter}`;
        if (selectedDistrictFilter) url += `&districtId=${selectedDistrictFilter}`;
        const res = await fetch(url);
        if (res.ok && isMounted) {
          const data = await res.json();
          setStates(data.states || []);
          setDistricts(data.districts || []);
          setCities(data.cities || []);
        }
      } catch (err) {
        console.error('Error loading locations:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadData();
    return () => {
      isMounted = false;
    };
  }, [search, selectedStateFilter, selectedDistrictFilter]);

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

  const handleOpenEditModal = (
    entityType: 'STATE' | 'DISTRICT' | 'CITY',
    item: StateItem | DistrictItem | CityItem
  ) => {
    if (entityType === 'STATE') {
      const s = item as StateItem;
      setEditingItem({
        entityType: 'STATE',
        id: s.id,
        name: s.name,
        status: s.status,
      });
    } else if (entityType === 'DISTRICT') {
      const d = item as DistrictItem;
      setEditingItem({
        entityType: 'DISTRICT',
        id: d.id,
        name: d.name,
        stateId: d.stateId,
        status: d.status,
      });
    } else {
      const c = item as CityItem;
      setEditingItem({
        entityType: 'CITY',
        id: c.id,
        name: c.name,
        stateId: c.stateId,
        districtId: c.districtId || null,
        isPopular: c.isPopular || false,
        status: c.status,
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

      setFeedback({ type: 'success', message: data.message || 'Location saved successfully!' });
      setIsModalOpen(false);
      fetchLocations();
    } catch (err: unknown) {
      setFeedback({ type: 'error', message: (err as Error).message || 'Error saving location.' });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteItem = async (entityType: 'STATE' | 'DISTRICT' | 'CITY', id: number, name: string) => {
    if (!confirm(`Are you sure you want to delete ${entityType.toLowerCase()} "${name}"?`)) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/admin/locations?entityType=${entityType}&id=${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Delete failed.');

      setFeedback({ type: 'success', message: `${entityType} deleted successfully.` });
      fetchLocations();
    } catch (err: unknown) {
      setFeedback({ type: 'error', message: (err as Error).message || 'Error deleting location.' });
      setLoading(false);
    }
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
            <span>Master Data Management</span>
          </div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Location Master Settings</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage State, District, and City hierarchy for hospital addresses across India.
          </p>
        </div>

        <button
          onClick={() => handleOpenAddModal(activeTab === 'STATES' ? 'STATE' : activeTab === 'DISTRICTS' ? 'DISTRICT' : 'CITY')}
          className="inline-flex items-center justify-center px-4 py-2.5 bg-[#ec2c6c] hover:bg-[#d4225b] text-white font-bold rounded-xl shadow-md transition-all text-sm"
        >
          <Plus className="w-4 h-4 mr-2" />
          <span>Add New {activeTab === 'STATES' ? 'State' : activeTab === 'DISTRICTS' ? 'District' : 'City'}</span>
        </button>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          <div className="flex items-center space-x-3">
            {feedback.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            <span className="text-sm font-semibold">{feedback.message}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="text-gray-400 hover:text-gray-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Navigation Tabs & Filter Bar */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-gray-100 pb-4">
          <div className="flex items-center space-x-2 bg-gray-100 p-1.5 rounded-xl w-full sm:w-auto">
            <button
              onClick={() => setActiveTab('STATES')}
              className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center space-x-2 ${
                activeTab === 'STATES' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Building className="w-4 h-4" />
              <span>States ({states.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('DISTRICTS')}
              className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center space-x-2 ${
                activeTab === 'DISTRICTS' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Districts ({districts.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('CITIES')}
              className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center space-x-2 ${
                activeTab === 'CITIES' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <MapPin className="w-4 h-4" />
              <span>Cities ({cities.length})</span>
            </button>
          </div>

          <div className="flex items-center space-x-3 w-full sm:w-auto">
            {/* State Filter (for Districts & Cities tabs) */}
            {activeTab !== 'STATES' && (
              <div className="relative w-full sm:w-48">
                <Filter className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <select
                  value={selectedStateFilter}
                  onChange={(e) => setSelectedStateFilter(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-[#ec2c6c]"
                >
                  <option value="">All States</option>
                  {states.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* District Filter (for Cities tab) */}
            {activeTab === 'CITIES' && (
              <div className="relative w-full sm:w-48">
                <Filter className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <select
                  value={selectedDistrictFilter}
                  onChange={(e) => setSelectedDistrictFilter(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-[#ec2c6c]"
                >
                  <option value="">All Districts</option>
                  {(selectedStateFilter
                    ? districts.filter((d) => d.stateId === Number(selectedStateFilter))
                    : districts
                  ).map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Search Box */}
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder={`Search ${activeTab.toLowerCase()}...`}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-[#ec2c6c]"
              />
            </div>
          </div>
        </div>

        {/* Location Content */}
        {loading ? (
          <div className="py-16 text-center text-gray-500">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-[#ec2c6c]" />
            <p className="text-sm font-medium">Loading locations...</p>
          </div>
        ) : (
          <div>
            {/* STATES TAB */}
            {activeTab === 'STATES' && (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50/50 text-gray-500 uppercase tracking-wider font-bold">
                      <th className="py-3 px-4">State Name</th>
                      <th className="py-3 px-4">Districts Count</th>
                      <th className="py-3 px-4">Cities Count</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {states.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="text-center py-8 text-gray-400">
                          No states found. Click &quot;Add New State&quot; to create one.
                        </td>
                      </tr>
                    ) : (
                      states.map((st) => {
                        const distCount = districts.filter((d) => d.stateId === st.id).length;
                        const cityCount = cities.filter((c) => c.stateId === st.id).length;
                        return (
                          <tr key={st.id} className="hover:bg-gray-50/80 transition-colors">
                            <td className="py-3 px-4 font-bold text-gray-900">{st.name}</td>
                            <td className="py-3 px-4 font-semibold text-gray-600">{distCount} Districts</td>
                            <td className="py-3 px-4 font-semibold text-gray-600">{cityCount} Cities</td>
                            <td className="py-3 px-4">
                              <span
                                className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                                  st.status === 'ACTIVE'
                                    ? 'bg-emerald-100 text-emerald-700'
                                    : 'bg-gray-100 text-gray-600'
                                }`}
                              >
                                {st.status}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right space-x-2">
                              <button
                                onClick={() => handleOpenEditModal('STATE', st)}
                                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                title="Edit State"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteItem('STATE', st.id, st.name)}
                                className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Delete State"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* DISTRICTS TAB */}
            {activeTab === 'DISTRICTS' && (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50/50 text-gray-500 uppercase tracking-wider font-bold">
                      <th className="py-3 px-4">District Name</th>
                      <th className="py-3 px-4">State</th>
                      <th className="py-3 px-4">Cities Count</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {districts.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="text-center py-8 text-gray-400">
                          No districts found. Click &quot;Add New District&quot; to create one.
                        </td>
                      </tr>
                    ) : (
                      districts.map((dst) => {
                        const stateObj = states.find((s) => s.id === dst.stateId);
                        const cityCount = cities.filter((c) => c.districtId === dst.id).length;
                        return (
                          <tr key={dst.id} className="hover:bg-gray-50/80 transition-colors">
                            <td className="py-3 px-4 font-bold text-gray-900">{dst.name}</td>
                            <td className="py-3 px-4 font-semibold text-gray-700">{stateObj?.name || '-'}</td>
                            <td className="py-3 px-4 font-semibold text-gray-600">{cityCount} Cities</td>
                            <td className="py-3 px-4">
                              <span
                                className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                                  dst.status === 'ACTIVE'
                                    ? 'bg-emerald-100 text-emerald-700'
                                    : 'bg-gray-100 text-gray-600'
                                }`}
                              >
                                {dst.status}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right space-x-2">
                              <button
                                onClick={() => handleOpenEditModal('DISTRICT', dst)}
                                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                title="Edit District"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteItem('DISTRICT', dst.id, dst.name)}
                                className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Delete District"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* CITIES TAB */}
            {activeTab === 'CITIES' && (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50/50 text-gray-500 uppercase tracking-wider font-bold">
                      <th className="py-3 px-4">City Name</th>
                      <th className="py-3 px-4">District</th>
                      <th className="py-3 px-4">State</th>
                      <th className="py-3 px-4">Popular</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {cities.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-8 text-gray-400">
                          No cities found. Click &quot;Add New City&quot; to create one.
                        </td>
                      </tr>
                    ) : (
                      cities.map((ct) => {
                        const stateObj = states.find((s) => s.id === ct.stateId);
                        const distObj = districts.find((d) => d.id === ct.districtId);
                        return (
                          <tr key={ct.id} className="hover:bg-gray-50/80 transition-colors">
                            <td className="py-3 px-4 font-bold text-gray-900 flex items-center space-x-2">
                              <span>{ct.name}</span>
                              {ct.isPopular && (
                                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500 flex-shrink-0" />
                              )}
                            </td>
                            <td className="py-3 px-4 font-semibold text-gray-600">{distObj?.name || '-'}</td>
                            <td className="py-3 px-4 font-semibold text-gray-700">{stateObj?.name || '-'}</td>
                            <td className="py-3 px-4">
                              {ct.isPopular ? (
                                <span className="px-2 py-0.5 bg-amber-50 text-amber-700 font-bold text-[10px] rounded-full border border-amber-200">
                                  Popular
                                </span>
                              ) : (
                                <span className="text-gray-400 text-[10px]">-</span>
                              )}
                            </td>
                            <td className="py-3 px-4">
                              <span
                                className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                                  ct.status === 'ACTIVE'
                                    ? 'bg-emerald-100 text-emerald-700'
                                    : 'bg-gray-100 text-gray-600'
                                }`}
                              >
                                {ct.status}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right space-x-2">
                              <button
                                onClick={() => handleOpenEditModal('CITY', ct)}
                                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                title="Edit City"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteItem('CITY', ct.id, ct.name)}
                                className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Delete City"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add / Edit Location Modal */}
      {isModalOpen && editingItem && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-gray-200 space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-lg font-bold text-gray-900">
                {editingItem.id ? 'Edit' : 'Add New'} {editingItem.entityType.charAt(0) + editingItem.entityType.slice(1).toLowerCase()}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveItem} className="space-y-4">
              {/* State Selection (for District & City) */}
              {(editingItem.entityType === 'DISTRICT' || editingItem.entityType === 'CITY') && (
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">State *</label>
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
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-[#ec2c6c]"
                  >
                    <option value="">Select State</option>
                    {states.map((st) => (
                      <option key={st.id} value={st.id}>
                        {st.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* District Selection (for City) */}
              {editingItem.entityType === 'CITY' && (
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Select District</label>
                  <select
                    value={editingItem.districtId || ''}
                    onChange={(e) =>
                      setEditingItem({
                        ...editingItem,
                        districtId: e.target.value ? Number(e.target.value) : null,
                      })
                    }
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-[#ec2c6c]"
                  >
                    <option value="">Select District</option>
                    {filteredDistricts.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Name Input */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  {editingItem.entityType.charAt(0) + editingItem.entityType.slice(1).toLowerCase()} Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder={`Enter ${editingItem.entityType.toLowerCase()} name...`}
                  value={editingItem.name}
                  onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-[#ec2c6c]"
                />
              </div>

              {/* Popular Checkbox (For City) */}
              {editingItem.entityType === 'CITY' && (
                <div className="flex items-center space-x-2 pt-1">
                  <input
                    type="checkbox"
                    id="isPopular"
                    checked={editingItem.isPopular || false}
                    onChange={(e) => setEditingItem({ ...editingItem, isPopular: e.target.checked })}
                    className="rounded border-gray-300 text-[#ec2c6c] focus:ring-[#ec2c6c]"
                  />
                  <label htmlFor="isPopular" className="text-xs font-semibold text-gray-700 cursor-pointer">
                    Mark as Popular City (Appears highlighted in search filters)
                  </label>
                </div>
              )}

              {/* Status Select */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Status</label>
                <select
                  value={editingItem.status}
                  onChange={(e) =>
                    setEditingItem({ ...editingItem, status: e.target.value as 'ACTIVE' | 'INACTIVE' })
                  }
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-[#ec2c6c]"
                >
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="INACTIVE">INACTIVE</option>
                </select>
              </div>

              {/* Form Buttons */}
              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-gray-200 text-gray-600 rounded-xl text-xs font-semibold hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-[#ec2c6c] hover:bg-[#d4225b] text-white rounded-xl text-xs font-bold shadow-md flex items-center space-x-2 disabled:opacity-50"
                >
                  {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{editingItem.id ? 'Save Changes' : 'Create Entry'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
