'use client';

import React, { useState, useEffect } from 'react';
import { ShoppingBag, Plus, Save, Loader2, CheckCircle2, Edit3, Trash2, X, AlertCircle } from 'lucide-react';
import RichTextEditor from '@/components/ui/RichTextEditor';

interface LeadPackage {
  id: number;
  name: string;
  leadCount: number;
  price: number;
  validityDays?: number | null;
  description?: string;
  status: string;
}

export default function AdminPackagesPage() {
  const [packages, setPackages] = useState<LeadPackage[]>([]);
  const [loading, setLoading] = useState(true);

  // Edit Mode state
  const [editingId, setEditingId] = useState<number | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [leadCount, setLeadCount] = useState('');
  const [price, setPrice] = useState('');
  const [validityDays, setValidityDays] = useState('30');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('ACTIVE');

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Delete modal state
  const [deletingPkg, setDeletingPkg] = useState<LeadPackage | null>(null);

  const fetchPackages = () => {
    fetch('/api/admin/packages')
      .then((r) => r.json())
      .then((data) => {
        if (data.packages) setPackages(data.packages);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchPackages();
  }, []);

  const resetForm = () => {
    setEditingId(null);
    setName('');
    setLeadCount('');
    setPrice('');
    setValidityDays('30');
    setDescription('');
    setStatus('ACTIVE');
  };

  const handleStartEdit = (pkg: LeadPackage) => {
    setEditingId(pkg.id);
    setName(pkg.name);
    setLeadCount(String(pkg.leadCount));
    setPrice(String(pkg.price));
    setValidityDays(pkg.validityDays ? String(pkg.validityDays) : '30');
    setDescription(pkg.description || '');
    setStatus(pkg.status || 'ACTIVE');
    setMessage('');
    setErrorMessage('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSavePackage = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setErrorMessage('');
    setSaving(true);

    try {
      const isEditing = Boolean(editingId);
      const url = '/api/admin/packages';
      const method = isEditing ? 'PUT' : 'POST';

      const payload: Record<string, unknown> = {
        name,
        leadCount: Number(leadCount),
        price: Number(price),
        validityDays: validityDays ? Number(validityDays) : null,
        description,
        status,
      };

      if (isEditing) {
        payload.id = editingId;
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error || 'Failed to save lead package.');
      } else {
        setMessage(isEditing ? 'Lead package updated successfully.' : 'Lead package created successfully.');
        resetForm();
        fetchPackages();
      }
    } catch {
      setErrorMessage('Server error saving package.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePackage = async () => {
    if (!deletingPkg) return;
    setSaving(true);

    try {
      const res = await fetch(`/api/admin/packages?id=${deletingPkg.id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setMessage(`Package "${deletingPkg.name}" deleted successfully.`);
        setDeletingPkg(null);
        if (editingId === deletingPkg.id) resetForm();
        fetchPackages();
      } else {
        const data = await res.json();
        setErrorMessage(data.error || 'Failed to delete package.');
      }
    } catch {
      setErrorMessage('Server error deleting package.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 pb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">Manage Lead Packages</h1>
          <p className="text-xs text-gray-500">Configure lead counts, pricing, validity, and modify or delete subscription packages.</p>
        </div>
      </div>

      {message && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm rounded-2xl flex items-center space-x-2 shadow-xs">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <span className="font-semibold">{message}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-800 text-sm rounded-2xl flex items-center space-x-2 shadow-xs">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <span className="font-semibold">{errorMessage}</span>
        </div>
      )}

      {/* Package Form (Create & Edit Mode) */}
      <div className="cbc-card p-6 sm:p-8 border border-gray-100 space-y-6">
        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
          <h3 className="text-sm font-extrabold text-[#b02151] uppercase tracking-wider flex items-center">
            <ShoppingBag className="w-4 h-4 mr-2" />
            {editingId ? `Edit Lead Package #${editingId}` : 'Create New Lead Package'}
          </h3>

          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="text-xs font-bold text-gray-500 hover:text-gray-900 bg-gray-100 px-3 py-1 rounded-full flex items-center space-x-1"
            >
              <X className="w-3.5 h-3.5" />
              <span>Cancel Edit</span>
            </button>
          )}
        </div>

        <form onSubmit={handleSavePackage} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Package Name *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Starter 25 Leads"
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:border-[#fd1d74]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Number of Leads *</label>
              <input
                type="number"
                required
                value={leadCount}
                onChange={(e) => setLeadCount(e.target.value)}
                placeholder="25"
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:border-[#fd1d74]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Price (₹) *</label>
              <input
                type="number"
                required
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="4999"
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:border-[#fd1d74]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Validity (Days)</label>
              <input
                type="number"
                value={validityDays}
                onChange={(e) => setValidityDays(e.target.value)}
                placeholder="30"
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:border-[#fd1d74]"
              />
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Feature Description *</label>
              <RichTextEditor
                value={description}
                onChange={setDescription}
                placeholder="Write detailed package features (e.g. 25 Verified Patient Leads, Dedicated Manager, Priority Placement)..."
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full sm:w-64 px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-900 focus:outline-none focus:border-[#fd1d74]"
              >
                <option value="ACTIVE">ACTIVE</option>
                <option value="INACTIVE">INACTIVE</option>
              </select>
            </div>
          </div>

          <div className="pt-2 flex items-center space-x-3">
            <button
              type="submit"
              disabled={saving}
              className="bg-[#b02151] hover:bg-[#921941] text-white text-xs font-extrabold px-6 py-3 rounded-xl uppercase tracking-wider transition-all shadow-md flex items-center space-x-2 disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : editingId ? <Save className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              <span>{editingId ? 'Update Lead Package' : 'Create Lead Package'}</span>
            </button>

            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="px-5 py-3 border border-gray-200 text-gray-600 rounded-xl text-xs font-bold hover:bg-gray-50"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Existing Packages Cards Grid */}
      <div className="space-y-4">
        <h3 className="text-lg font-extrabold text-gray-900">Active Packages ({packages.length})</h3>

        {loading ? (
          <div className="p-8 text-center text-xs text-gray-500 font-semibold flex items-center justify-center space-x-2">
            <Loader2 className="w-4 h-4 animate-spin text-[#b02151]" />
            <span>Loading packages...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {packages.map((pkg) => (
            <div key={pkg.id} className="cbc-card p-6 border border-gray-100 space-y-4 flex flex-col justify-between relative group hover:shadow-lg transition-shadow">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span
                    className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full ${
                      pkg.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {pkg.status || 'ACTIVE'}
                  </span>
                  <span className="text-xs text-gray-400">ID: #{pkg.id}</span>
                </div>

                <h3 className="text-xl font-bold text-gray-900">{pkg.name}</h3>

                <p className="text-3xl font-extrabold text-[#101828]">₹{Number(pkg.price).toLocaleString('en-IN')}</p>

                <p className="text-xs font-bold text-[#b02151] bg-pink-50 px-3 py-1 rounded-full w-fit border border-pink-100">
                  {pkg.leadCount} Patient Leads ({pkg.validityDays ? `${pkg.validityDays} Days` : 'Unlimited'})
                </p>

                {pkg.description && (
                  <div
                    className="text-xs text-gray-600 pt-1 leading-relaxed space-y-1 [&_ul]:list-disc [&_ul]:pl-4 [&_ol]:list-decimal [&_ol]:pl-4 [&_p]:mb-1 [&_h2]:font-bold [&_h3]:font-bold"
                    dangerouslySetInnerHTML={{ __html: pkg.description }}
                  />
                )}
              </div>

              {/* Edit & Delete Action Buttons */}
              <div className="pt-4 border-t border-gray-100 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => handleStartEdit(pkg)}
                  className="px-3.5 py-1.5 bg-pink-50 hover:bg-pink-100 text-[#b02151] border border-pink-100 rounded-lg text-xs font-bold transition-all flex items-center space-x-1"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit</span>
                </button>

                <button
                  type="button"
                  onClick={() => setDeletingPkg(pkg)}
                  className="px-3.5 py-1.5 bg-gray-100 hover:bg-red-100 text-gray-700 hover:text-red-700 rounded-lg text-xs font-bold transition-colors flex items-center space-x-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      </div>

      {/* Delete Package Confirmation Modal */}
      {deletingPkg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-5 shadow-2xl border border-red-100">
            <div className="w-14 h-14 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto">
              <Trash2 className="w-7 h-7" />
            </div>

            <div className="text-center space-y-2">
              <h3 className="text-xl font-extrabold text-gray-900">Delete Lead Package</h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                Are you sure you want to delete package <strong>{deletingPkg.name}</strong> (₹{deletingPkg.price})?
              </p>
            </div>

            <div className="flex justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setDeletingPkg(null)}
                className="px-5 py-2.5 text-xs font-bold text-gray-600 border border-gray-200 rounded-full hover:bg-gray-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleDeletePackage}
                disabled={saving}
                className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-extrabold rounded-full shadow-lg transition-colors flex items-center space-x-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete Package</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
