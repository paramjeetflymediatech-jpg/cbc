'use client';

import React, { useState, useEffect } from 'react';
import { Stethoscope, Plus, Save, Loader2, CheckCircle2, Tag } from 'lucide-react';

export default function HospitalServicesPage() {
  const [platformServices, setPlatformServices] = useState<any[]>([]);
  const [hospitalServices, setHospitalServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal / Form state
  const [selectedServiceId, setSelectedServiceId] = useState<number | string>('');
  const [description, setDescription] = useState('');
  const [subServices, setSubServices] = useState('');
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

  const handleSelectServiceChange = (serviceIdVal: string) => {
    setSelectedServiceId(serviceIdVal);
    const existingConfig = hospitalServices.find((hs) => Number(hs.serviceId) === Number(serviceIdVal));
    if (existingConfig) {
      setDescription(existingConfig.description || '');
      setSubServices(existingConfig.subServices || '');
      setStatus(existingConfig.status || 'ACTIVE');
    } else {
      setDescription('');
      setSubServices('');
      setStatus('ACTIVE');
    }
  };

  const handleEditConfig = (hs: any) => {
    setSelectedServiceId(hs.serviceId);
    setDescription(hs.description || '');
    setSubServices(hs.subServices || '');
    setStatus(hs.status || 'ACTIVE');
    window.scrollTo({ top: 100, behavior: 'smooth' });
  };

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
          subServices,
          status,
        }),
      });

      if (res.ok) {
        setMessage('Service configuration saved successfully');
        loadData();
      }
    } catch {
      // ignore
    } finally {
      setSaving(false);
    }
  };

  // Filter top-level main platform services
  const mainPlatformServices = platformServices.filter((s) => !s.parentId);

  if (loading) return <div className="p-8 text-center text-gray-500 text-sm">Loading hospital services...</div>;

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-extrabold text-gray-900">Manage Offered Services & Sub-Categories</h1>
        <p className="text-xs text-gray-500">Configure medical specialties and enter sub-services offered at your hospital.</p>
      </div>

      {message && (
        <div className="p-4 bg-emerald-50 text-emerald-800 text-sm rounded-xl flex items-center space-x-2 border border-emerald-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          <span>{message}</span>
        </div>
      )}

      {/* Add / Update Service Form */}
      <div className="cbc-card p-6 border border-gray-100 space-y-4">
        <h3 className="text-sm font-bold text-[#ec2c6c] uppercase tracking-wider">Configure Hospital Specialty</h3>
        <form onSubmit={handleSaveService} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Select Main Medical Specialty *</label>
              <select
                required
                value={selectedServiceId}
                onChange={(e) => handleSelectServiceChange(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm"
              >
                <option value="" disabled>Select Specialty</option>
                {mainPlatformServices.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
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
            <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
              Sub-Services / Procedures (Comma-Separated)
            </label>
            <input
              type="text"
              value={subServices}
              onChange={(e) => setSubServices(e.target.value)}
              placeholder="e.g. Breast Cancer Care, Head & Neck Cancer, Lung Cancer, Cervical Cancer, Prostate Cancer"
              className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm"
            />
            <p className="text-[11px] text-gray-400 mt-1">Separate multiple sub-services or procedures with commas.</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Hospital Procedure Notes / Description</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Specialized oncology department equipped with linear accelerators & PET-CT."
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
        <h3 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-2">
          Configured Hospital Services ({hospitalServices.length})
        </h3>
        {hospitalServices.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {hospitalServices.map((hs) => {
              const subTags = hs.subServices
                ? hs.subServices.split(',').map((s: string) => s.trim()).filter(Boolean)
                : [];

              return (
                <div key={hs.id} className="p-4 bg-gray-50 border border-gray-200 rounded-xl flex flex-col justify-between space-y-3">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-gray-900 text-sm">{hs.service?.name}</h4>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${hs.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-200 text-gray-600'}`}>
                        {hs.status}
                      </span>
                    </div>

                    <p className="text-xs text-gray-500">{hs.description || 'Standard specialty treatment package.'}</p>

                    {subTags.length > 0 && (
                      <div className="pt-1">
                        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 flex items-center space-x-1">
                          <Tag className="w-3 h-3 text-[#ec2c6c]" />
                          <span>Offered Sub-Services:</span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {subTags.map((sub: string, idx: number) => (
                            <span
                              key={idx}
                              className="text-[11px] font-semibold text-[#ec2c6c] bg-pink-50 border border-pink-100 px-2 py-0.5 rounded-md"
                            >
                              {sub}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end pt-2 border-t border-gray-200/60">
                    <button
                      type="button"
                      onClick={() => handleEditConfig(hs)}
                      className="text-xs font-bold text-[#ec2c6c] hover:underline"
                    >
                      Edit Configuration
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8 text-xs text-gray-500">No services configured yet. Select a specialty above to enable it.</div>
        )}
      </div>
    </div>
  );
}
