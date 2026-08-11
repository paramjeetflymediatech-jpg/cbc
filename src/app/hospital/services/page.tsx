'use client';

import React, { useState, useEffect } from 'react';
import { Stethoscope, Plus, Save, Loader2, CheckCircle2 } from 'lucide-react';

export default function HospitalServicesPage() {
  const [platformServices, setPlatformServices] = useState<any[]>([]);
  const [hospitalServices, setHospitalServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal / Form state
  const [selectedServiceId, setSelectedServiceId] = useState<number | string>('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('ACTIVE');

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const loadData = () => {
    fetch('/api/hospital/services')
      .then((r) => r.json())
      .then((data) => {
        if (data.allPlatformServices) setPlatformServices(data.allPlatformServices);
        if (data.hospitalServices) setHospitalServices(data.hospitalServices);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSaveService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedServiceId) return;

    setMessage('');
    setSaving(true);

    try {
      const res = await fetch('/api/hospital/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceId: Number(selectedServiceId),
          description,
          status,
        }),
      });

      if (res.ok) {
        setMessage('Service updated successfully');
        loadData();
      }
    } catch {
      // ignore
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading services...</div>;

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-extrabold text-gray-900">Manage Offered Services</h1>
        <p className="text-xs text-gray-500">Configure medical specialties offered at your hospital.</p>
      </div>

      {message && (
        <div className="p-4 bg-emerald-50 text-emerald-800 text-sm rounded-xl flex items-center space-x-2 border border-emerald-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          <span>{message}</span>
        </div>
      )}

      {/* Add / Update Service Form */}
      <div className="cbc-card p-6 border border-gray-100 space-y-4">
        <h3 className="text-sm font-bold text-[#ec2c6c] uppercase tracking-wider">Configure Specialty</h3>
        <form onSubmit={handleSaveService} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Select Specialty *</label>
              <select
                required
                value={selectedServiceId}
                onChange={(e) => setSelectedServiceId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm"
              >
                <option value="" disabled>Select Medical Specialty</option>
                {platformServices.map((svc) => (
                  <option key={svc.id} value={svc.id}>
                    {svc.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm"
              >
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Procedure Description</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Robotic joint replacement with 3 days hospital stay."
              className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={saving}
              className="cbc-btn-primary text-sm shadow-md flex items-center space-x-2"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>Save Service Configuration</span>
            </button>
          </div>
        </form>
      </div>

      {/* Current Hospital Services List */}
      <div className="cbc-card p-6 border border-gray-100 space-y-4">
        <h3 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-2">Active Configured Services</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {hospitalServices.map((hs) => (
            <div key={hs.id} className="p-4 bg-gray-50 border border-gray-200 rounded-xl flex justify-between items-start">
              <div>
                <h4 className="font-bold text-gray-900 text-sm">{hs.service?.name}</h4>
                <p className="text-xs text-gray-500 mt-0.5">{hs.description || 'Standard specialty treatment package.'}</p>
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${hs.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-200 text-gray-600'}`}>
                {hs.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
