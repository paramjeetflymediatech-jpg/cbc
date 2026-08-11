'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import GoogleAddressMapPicker from '@/components/ui/GoogleAddressMapPicker';
import { Building2, CheckCircle2, XCircle, AlertCircle, Eye, Phone, Mail, MapPin, User, Stethoscope, FileText, Sparkles, X, Trash2, Plus, Loader2 } from 'lucide-react';

export default function AdminHospitalsPage() {
  const searchParams = useSearchParams();
  const initialStatus = searchParams.get('status') || '';

  const [hospitals, setHospitals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState(initialStatus);

  // Dynamic Locations State
  const [statesList, setStatesList] = useState<any[]>([]);
  const [cityOptions, setCityOptions] = useState<string[]>([]);

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [viewHospital, setViewHospital] = useState<any | null>(null);
  const [deletingHospital, setDeletingHospital] = useState<any | null>(null);
  const [rejectingId, setRejectingId] = useState<number | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Add Hospital Form state
  const [addName, setAddName] = useState('');
  const [addEmail, setAddEmail] = useState('');
  const [addPhone, setAddPhone] = useState('');
  const [addPassword, setAddPassword] = useState('');
  const [addState, setAddState] = useState('Maharashtra');
  const [addCity, setAddCity] = useState('Mumbai');
  const [addAddress, setAddAddress] = useState('');
  const [addWebsite, setAddWebsite] = useState('');
  const [addDescription, setAddDescription] = useState('');
  const [addLeads, setAddLeads] = useState('50');
  const [addStatus, setAddStatus] = useState('APPROVED');
  const [formError, setFormError] = useState('');

  const fetchHospitals = () => {
    const url = statusFilter ? `/api/admin/hospitals?status=${statusFilter}` : '/api/admin/hospitals';
    fetch(url)
      .then((r) => r.json())
      .then((data) => {
        if (data.hospitals) setHospitals(data.hospitals);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchHospitals();

    // Fetch States & Cities
    fetch('/api/locations')
      .then((res) => res.json())
      .then((data) => {
        if (data.states && data.states.length > 0) {
          setStatesList(data.states);
          const defaultSt = data.states.find((s: any) => s.name === 'Maharashtra') || data.states[0];
          setAddState(defaultSt.name);
          if (defaultSt.cities && defaultSt.cities.length > 0) {
            const cities = defaultSt.cities.map((c: any) => c.name);
            setCityOptions(cities);
            setAddCity(cities[0]);
          }
        }
      })
      .catch(() => {});
  }, [statusFilter]);

  const handleAddStateChange = (newStateName: string) => {
    setAddState(newStateName);
    const selectedStateObj = statesList.find((s: any) => s.name === newStateName);
    if (selectedStateObj && selectedStateObj.cities && selectedStateObj.cities.length > 0) {
      const cities = selectedStateObj.cities.map((c: any) => c.name);
      setCityOptions(cities);
      setAddCity(cities[0]);
    } else {
      setCityOptions([]);
      setAddCity('');
    }
  };

  const handleGoogleAddressSelected = (data: {
    address: string;
    city: string;
    state: string;
    country: string;
  }) => {
    if (data.address) setAddAddress(data.address);
    if (data.state) {
      const matchedState = statesList.find((s: any) =>
        s.name.toLowerCase().includes(data.state.toLowerCase())
      );
      if (matchedState) {
        handleAddStateChange(matchedState.name);
      }
    }
    if (data.city) {
      setAddCity(data.city);
    }
  };

  const handleApprove = async (id: number) => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/hospitals/${id}/approve`, { method: 'POST' });
      if (res.ok) {
        setViewHospital(null);
        fetchHospitals();
      }
    } catch {
      // ignore
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingId || !rejectionReason.trim()) return;

    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/hospitals/${rejectingId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rejectionReason }),
      });

      if (res.ok) {
        setRejectingId(null);
        setViewHospital(null);
        setRejectionReason('');
        fetchHospitals();
      }
    } catch {
      // ignore
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteHospital = async () => {
    if (!deletingHospital) return;
    setActionLoading(true);

    try {
      const res = await fetch(`/api/admin/hospitals/${deletingHospital.id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setDeletingHospital(null);
        setViewHospital(null);
        fetchHospitals();
      }
    } catch {
      // ignore
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddHospitalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setActionLoading(true);

    try {
      const res = await fetch('/api/admin/hospitals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: addName,
          email: addEmail,
          phone: addPhone,
          password: addPassword,
          city: addCity,
          state: addState,
          address: addAddress,
          website: addWebsite,
          description: addDescription,
          leadsRemaining: Number(addLeads),
          status: addStatus,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setFormError(data.error || 'Failed to create hospital.');
      } else {
        setShowAddModal(false);
        setAddName('');
        setAddEmail('');
        setAddPhone('');
        setAddPassword('');
        setAddAddress('');
        setAddWebsite('');
        setAddDescription('');
        fetchHospitals();
      }
    } catch {
      setFormError('Server error creating hospital.');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 pb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">Hospital Approvals & Management</h1>
          <p className="text-xs text-gray-500">Inspect hospital applications, add new hospitals, or purge data.</p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-[#b02151] hover:bg-[#921941] text-white text-xs font-extrabold px-4 py-2 rounded-xl uppercase tracking-wider transition-all shadow-md flex items-center space-x-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Hospital</span>
          </button>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3.5 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-[#ec2c6c]"
          >
            <option value="">All Registrations</option>
            <option value="PENDING">PENDING APPROVAL</option>
            <option value="APPROVED">APPROVED</option>
            <option value="REJECTED">REJECTED</option>
            <option value="SUSPENDED">SUSPENDED</option>
          </select>
        </div>
      </div>

      {/* Hospital Cards List */}
      <div className="space-y-4">
        {hospitals.map((h) => (
          <div key={h.id} className="cbc-card p-6 border border-gray-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-2 flex-1">
              <div className="flex items-center space-x-2">
                <span
                  className={`text-[10px] font-extrabold uppercase px-3 py-0.5 rounded-full ${
                    h.status === 'APPROVED'
                      ? 'bg-emerald-100 text-emerald-800'
                      : h.status === 'PENDING'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {h.status}
                </span>
                <span className="text-xs text-gray-400 font-medium">Registered: {new Date(h.createdAt).toLocaleDateString('en-IN')}</span>
              </div>

              <h3 className="text-xl font-bold text-gray-900">{h.name}</h3>

              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-600">
                <span className="flex items-center"><MapPin className="w-3.5 h-3.5 mr-1 text-gray-400" /> {h.city}, {h.state}</span>
                <span className="flex items-center"><Phone className="w-3.5 h-3.5 mr-1 text-gray-400" /> {h.phone}</span>
                <span className="flex items-center"><Mail className="w-3.5 h-3.5 mr-1 text-gray-400" /> {h.email}</span>
              </div>

              <p className="text-xs text-gray-600 line-clamp-2 pt-1">{h.description}</p>

              {h.rejectionReason && (
                <p className="text-xs text-red-600 bg-red-50 p-2 rounded-lg">
                  <strong>Rejection Reason:</strong> {h.rejectionReason}
                </p>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto border-t md:border-t-0 pt-3 md:pt-0">
              <button
                onClick={() => setViewHospital(h)}
                className="px-3.5 py-2 bg-pink-50 hover:bg-pink-100 text-[#b02151] rounded-full text-xs font-extrabold transition-all flex items-center space-x-1.5 border border-pink-100 shadow-sm"
              >
                <Eye className="w-4 h-4" />
                <span>View Details</span>
              </button>

              {h.status === 'PENDING' && (
                <>
                  <button
                    onClick={() => handleApprove(h.id)}
                    disabled={actionLoading}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full text-xs font-bold transition-all flex items-center space-x-1 shadow-md"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Approve</span>
                  </button>

                  <button
                    onClick={() => setRejectingId(h.id)}
                    disabled={actionLoading}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-full text-xs font-bold transition-all flex items-center space-x-1 shadow-md"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>Reject</span>
                  </button>
                </>
              )}

              {h.status === 'APPROVED' && (
                <button
                  onClick={() => setRejectingId(h.id)}
                  className="px-3.5 py-2 border border-red-200 text-red-600 hover:bg-red-50 rounded-full text-xs font-bold"
                >
                  Suspend
                </button>
              )}

              <button
                onClick={() => setDeletingHospital(h)}
                className="px-3.5 py-2 bg-gray-100 hover:bg-red-100 text-gray-700 hover:text-red-700 rounded-full text-xs font-bold transition-colors flex items-center space-x-1"
                title="Delete Hospital & Purge Data"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>
            </div>
          </div>
        ))}

        {hospitals.length === 0 && !loading && (
          <div className="text-center py-16 bg-gray-50 rounded-2xl text-gray-500 text-sm">
            No hospital registrations found matching selected filter.
          </div>
        )}
      </div>

      {/* Add Hospital Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-6 shadow-2xl relative my-8 border border-gray-100 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowAddModal(false)}
              className="absolute top-6 right-6 p-2 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="border-b border-gray-100 pb-4">
              <h2 className="text-2xl font-extrabold text-gray-900 flex items-center">
                <Building2 className="w-6 h-6 text-[#b02151] mr-2" />
                Add New Hospital
              </h2>
              <p className="text-xs text-gray-500 mt-1">Directly onboard a hospital with Google Maps address fetch & dynamic locations.</p>
            </div>

            {formError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleAddHospitalSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Hospital / Clinic Name *</label>
                  <input
                    type="text"
                    required
                    value={addName}
                    onChange={(e) => setAddName(e.target.value)}
                    placeholder="e.g. Fortis Healthcare"
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#fd1d74]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Official Email Address *</label>
                  <input
                    type="email"
                    required
                    value={addEmail}
                    onChange={(e) => setAddEmail(e.target.value)}
                    placeholder="contact@fortis.com"
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#fd1d74]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Contact Phone Number *</label>
                  <input
                    type="tel"
                    required
                    value={addPhone}
                    onChange={(e) => setAddPhone(e.target.value)}
                    placeholder="+91 9876543210"
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#fd1d74]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Portal Login Password *</label>
                  <input
                    type="password"
                    required
                    value={addPassword}
                    onChange={(e) => setAddPassword(e.target.value)}
                    placeholder="Create account password"
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#fd1d74]"
                  />
                </div>
              </div>

              {/* Google Maps Location Autocomplete Component */}
              <div className="p-4 bg-slate-50 border border-gray-200 rounded-2xl">
                <GoogleAddressMapPicker
                  initialAddress={addAddress}
                  initialCity={addCity}
                  initialState={addState}
                  onAddressSelect={handleGoogleAddressSelected}
                />
              </div>

              {/* Dynamic State & City Dropdowns */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Select State *</label>
                  <select
                    required
                    value={addState}
                    onChange={(e) => handleAddStateChange(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-900 focus:outline-none focus:border-[#fd1d74] cursor-pointer"
                  >
                    {statesList.map((st: any) => (
                      <option key={st.id} value={st.name}>
                        {st.name} ({st.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Select City *</label>
                  {cityOptions.length > 0 ? (
                    <select
                      required
                      value={addCity}
                      onChange={(e) => setAddCity(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-900 focus:outline-none focus:border-[#fd1d74] cursor-pointer"
                    >
                      {cityOptions.map((cName: string) => (
                        <option key={cName} value={cName}>
                          {cName}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      required
                      value={addCity}
                      onChange={(e) => setAddCity(e.target.value)}
                      placeholder="Enter City Name"
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#fd1d74]"
                    />
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Full Street Address *</label>
                <textarea
                  rows={2}
                  required
                  value={addAddress}
                  onChange={(e) => setAddAddress(e.target.value)}
                  placeholder="Building name, street address..."
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#fd1d74] resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Initial Leads Credit</label>
                  <input
                    type="number"
                    value={addLeads}
                    onChange={(e) => setAddLeads(e.target.value)}
                    placeholder="50"
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#fd1d74]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Initial Status</label>
                  <select
                    value={addStatus}
                    onChange={(e) => setAddStatus(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold focus:outline-none focus:border-[#fd1d74]"
                  >
                    <option value="APPROVED">APPROVED (Active Live)</option>
                    <option value="PENDING">PENDING (Require Review)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Website URL</label>
                  <input
                    type="url"
                    value={addWebsite}
                    onChange={(e) => setAddWebsite(e.target.value)}
                    placeholder="https://..."
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#fd1d74]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Hospital Description</label>
                <textarea
                  rows={2}
                  value={addDescription}
                  onChange={(e) => setAddDescription(e.target.value)}
                  placeholder="Overview of hospital facilities and doctor team..."
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#fd1d74] resize-none"
                />
              </div>

              <div className="pt-4 border-t border-gray-100 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-5 py-2.5 text-xs font-bold text-gray-600 border border-gray-200 rounded-full hover:bg-gray-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={actionLoading}
                  className="bg-[#b02151] hover:bg-[#921941] text-white text-xs font-extrabold px-6 py-2.5 rounded-full uppercase tracking-wider transition-all shadow-lg flex items-center space-x-1.5 disabled:opacity-50"
                >
                  {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  <span>Save & Create Hospital</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Full Hospital Details Modal */}
      {viewHospital && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-8 space-y-6 shadow-2xl relative my-8 border border-gray-100 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setViewHospital(null)}
              className="absolute top-6 right-6 p-2 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-2 border-b border-gray-100 pb-4">
              <div className="flex items-center space-x-2">
                <span
                  className={`text-[10px] font-extrabold uppercase px-3 py-0.5 rounded-full ${
                    viewHospital.status === 'APPROVED'
                      ? 'bg-emerald-100 text-emerald-800'
                      : viewHospital.status === 'PENDING'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {viewHospital.status}
                </span>
                <span className="text-xs text-gray-400">ID: #{viewHospital.id} • Registered {new Date(viewHospital.createdAt).toLocaleDateString('en-IN')}</span>
              </div>
              <h2 className="text-2xl font-extrabold text-gray-900">{viewHospital.name}</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
              <div className="bg-gray-50 p-4 rounded-2xl space-y-2 border border-gray-100">
                <h4 className="font-extrabold text-xs uppercase text-[#b02151] tracking-wider flex items-center">
                  <Mail className="w-4 h-4 mr-1.5" /> Contact Details
                </h4>
                <p className="text-xs text-gray-700"><strong>Official Email:</strong> {viewHospital.email}</p>
                <p className="text-xs text-gray-700"><strong>Phone Number:</strong> {viewHospital.phone}</p>
                {viewHospital.website && (
                  <p className="text-xs text-gray-700 truncate">
                    <strong>Website:</strong> <a href={viewHospital.website} target="_blank" rel="noreferrer" className="text-pink-600 underline">{viewHospital.website}</a>
                  </p>
                )}
              </div>

              <div className="bg-gray-50 p-4 rounded-2xl space-y-2 border border-gray-100">
                <h4 className="font-extrabold text-xs uppercase text-[#b02151] tracking-wider flex items-center">
                  <MapPin className="w-4 h-4 mr-1.5" /> Location Address
                </h4>
                <p className="text-xs text-gray-700"><strong>Address:</strong> {viewHospital.address}</p>
                <p className="text-xs text-gray-700"><strong>City / State:</strong> {viewHospital.city}, {viewHospital.state || 'Maharashtra'}</p>
                <p className="text-xs text-gray-700"><strong>Country:</strong> {viewHospital.country || 'India'}</p>
              </div>

              <div className="bg-gray-50 p-4 rounded-2xl space-y-2 border border-gray-100">
                <h4 className="font-extrabold text-xs uppercase text-[#b02151] tracking-wider flex items-center">
                  <User className="w-4 h-4 mr-1.5" /> Hospital Coordinator
                </h4>
                <p className="text-xs text-gray-700"><strong>Contact Person:</strong> {viewHospital.contactPersonName || 'N/A'}</p>
                <p className="text-xs text-gray-700"><strong>Direct Mobile:</strong> {viewHospital.contactPersonPhone || viewHospital.phone}</p>
                <p className="text-xs text-gray-700"><strong>Email:</strong> {viewHospital.contactPersonEmail || viewHospital.email}</p>
              </div>

              <div className="bg-pink-50/60 p-4 rounded-2xl space-y-2 border border-pink-100">
                <h4 className="font-extrabold text-xs uppercase text-[#b02151] tracking-wider flex items-center">
                  <Sparkles className="w-4 h-4 mr-1.5 text-yellow-500" /> Account Lead Balance
                </h4>
                <p className="text-xs text-gray-800"><strong>Available Leads:</strong> <span className="text-emerald-700 font-extrabold">{viewHospital.leadsRemaining || 0}</span></p>
                <p className="text-xs text-gray-800"><strong>Total Purchased:</strong> {viewHospital.totalLeadsPurchased || 0}</p>
                <p className="text-xs text-gray-800"><strong>Total Consumed:</strong> {viewHospital.totalLeadsUsed || 0}</p>
              </div>
            </div>

            <div className="space-y-1.5">
              <h4 className="font-extrabold text-xs uppercase text-gray-700 tracking-wider flex items-center">
                <FileText className="w-4 h-4 mr-1 text-gray-500" /> Hospital Overview & Credentials
              </h4>
              <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 text-xs text-gray-700 leading-relaxed max-h-36 overflow-y-auto">
                {viewHospital.description}
              </div>
            </div>

            {viewHospital.services && viewHospital.services.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-extrabold text-xs uppercase text-gray-700 tracking-wider flex items-center">
                  <Stethoscope className="w-4 h-4 mr-1 text-gray-500" /> Selected Medical Specialties ({viewHospital.services.length})
                </h4>
                <div className="flex flex-wrap gap-2">
                  {viewHospital.services.map((svc: any) => (
                    <span key={svc.id} className="px-3 py-1 bg-pink-50 text-[#b02151] border border-pink-100 rounded-full text-xs font-bold">
                      {svc.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setDeletingHospital(viewHospital)}
                className="px-4 py-2.5 bg-red-50 hover:bg-red-100 text-red-700 rounded-full text-xs font-extrabold transition-colors flex items-center space-x-1.5 border border-red-200 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete & Purge Data</span>
              </button>

              <div className="flex items-center space-x-3">
                <button
                  type="button"
                  onClick={() => setViewHospital(null)}
                  className="px-5 py-2.5 text-xs font-bold text-gray-600 border border-gray-200 rounded-full hover:bg-gray-50"
                >
                  Close
                </button>

                {viewHospital.status === 'PENDING' && (
                  <>
                    <button
                      onClick={() => setRejectingId(viewHospital.id)}
                      disabled={actionLoading}
                      className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-full text-xs font-bold shadow-md flex items-center space-x-1"
                    >
                      <XCircle className="w-4 h-4" />
                      <span>Reject Request</span>
                    </button>

                    <button
                      onClick={() => handleApprove(viewHospital.id)}
                      disabled={actionLoading}
                      className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full text-xs font-extrabold shadow-lg flex items-center space-x-1.5"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Approve & Grant Access</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete & Clear Data Modal */}
      {deletingHospital && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-5 shadow-2xl border border-red-100">
            <div className="w-14 h-14 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto">
              <Trash2 className="w-7 h-7" />
            </div>

            <div className="text-center space-y-2">
              <h3 className="text-xl font-extrabold text-gray-900">Delete Hospital & Clear Data</h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                Are you sure you want to permanently delete <strong>{deletingHospital.name}</strong>?
              </p>
            </div>

            <div className="p-4 bg-red-50 rounded-2xl border border-red-200 text-xs text-red-800 space-y-1">
              <p className="font-extrabold">Warning: Permanent Action</p>
              <p className="text-[11px] leading-relaxed text-red-700">
                This will permanently purge all user credentials, hospital leads, transaction logs, and service linkages associated with this hospital.
              </p>
            </div>

            <div className="flex justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setDeletingHospital(null)}
                className="px-5 py-2.5 text-xs font-bold text-gray-600 border border-gray-200 rounded-full hover:bg-gray-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleDeleteHospital}
                disabled={actionLoading}
                className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-extrabold rounded-full shadow-lg transition-colors flex items-center space-x-1.5 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Confirm Delete & Clear Data</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-gray-900">Reject Hospital Registration</h3>
            <p className="text-xs text-gray-600">Please provide a reason for rejecting this hospital application.</p>

            <form onSubmit={handleRejectSubmit} className="space-y-4">
              <textarea
                rows={3}
                required
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Reason for rejection (e.g. Invalid medical license or missing verification details)..."
                className="w-full p-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-red-500"
              />

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setRejectingId(null)}
                  className="px-4 py-2 text-xs font-bold text-gray-600 border border-gray-200 rounded-full"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-full shadow-md"
                >
                  Confirm Rejection
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
