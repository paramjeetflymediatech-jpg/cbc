'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Quote, Plus, Edit3, Trash2, X, Upload, Loader2, CheckCircle2, AlertCircle, Search, Star, Eye, EyeOff } from 'lucide-react';

interface TestimonialItem {
  id: number;
  doctorName: string;
  hospitalInfo: string;
  quote: string;
  image?: string | null;
  rating?: number;
  status: 'ACTIVE' | 'INACTIVE';
  orderIndex?: number;
  createdAt?: string;
}

export default function AdminTestimonialsPage() {
  const [testimonials, setTestimonials] = useState<TestimonialItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<TestimonialItem | null>(null);

  // Form State
  const [doctorName, setDoctorName] = useState('');
  const [hospitalInfo, setHospitalInfo] = useState('');
  const [quote, setQuote] = useState('');
  const [image, setImage] = useState('');
  const [rating, setRating] = useState(5.0);
  const [status, setStatus] = useState<'ACTIVE' | 'INACTIVE'>('ACTIVE');
  const [orderIndex, setOrderIndex] = useState(0);

  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Delete State
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const fetchTestimonials = () => {
    fetch('/api/testimonials?admin=true')
      .then((r) => r.json())
      .then((data) => {
        if (data.testimonials) setTestimonials(data.testimonials);
      })
      .catch(() => setErrorMessage('Failed to load testimonials'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchTestimonials();
  }, []);

  const resetForm = () => {
    setEditingItem(null);
    setDoctorName('');
    setHospitalInfo('');
    setQuote('');
    setImage('');
    setRating(5.0);
    setStatus('ACTIVE');
    setOrderIndex(0);
    setErrorMessage('');
    setMessage('');
  };

  const handleOpenAddModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item: TestimonialItem) => {
    setEditingItem(item);
    setDoctorName(item.doctorName || '');
    setHospitalInfo(item.hospitalInfo || '');
    setQuote(item.quote || '');
    setImage(item.image || '');
    setRating(item.rating || 5.0);
    setStatus(item.status || 'ACTIVE');
    setOrderIndex(item.orderIndex || 0);
    setErrorMessage('');
    setMessage('');
    setIsModalOpen(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('category', 'testimonials');

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (res.ok && data.url) {
        setImage(data.url);
      } else {
        alert(data.error || 'Failed to upload photo.');
      }
    } catch {
      alert('Error uploading photo file.');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setMessage('');
    setSaving(true);

    try {
      const isEditing = editingItem !== null;
      const url = '/api/testimonials';
      const method = isEditing ? 'PUT' : 'POST';

      const payload: Record<string, unknown> = {
        doctorName,
        hospitalInfo,
        quote,
        image,
        rating,
        status,
        orderIndex,
      };

      if (isEditing && editingItem) {
        payload.id = editingItem.id;
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error || 'Failed to save testimonial.');
      } else {
        setMessage(isEditing ? 'Testimonial updated successfully!' : 'Testimonial created successfully!');
        fetchTestimonials();
        setTimeout(() => {
          setIsModalOpen(false);
          resetForm();
        }, 800);
      }
    } catch {
      setErrorMessage('Server error saving testimonial.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (item: TestimonialItem) => {
    const newStatus = item.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      const res = await fetch('/api/testimonials', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: item.id, status: newStatus }),
      });
      if (res.ok) {
        setTestimonials((prev) =>
          prev.map((t) => (t.id === item.id ? { ...t, status: newStatus } : t))
        );
      }
    } catch {
      alert('Failed to update status.');
    }
  };

  const handleDelete = async () => {
    if (deletingId === null) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/testimonials?id=${deletingId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setTestimonials((prev) => prev.filter((t) => t.id !== deletingId));
        setDeletingId(null);
      } else {
        alert('Failed to delete testimonial.');
      }
    } catch {
      alert('Error deleting testimonial.');
    } finally {
      setSaving(false);
    }
  };

  const filteredTestimonials = testimonials.filter((t) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      t.doctorName.toLowerCase().includes(q) ||
      t.hospitalInfo.toLowerCase().includes(q) ||
      t.quote.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 pb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 flex items-center space-x-2">
            <Quote className="w-7 h-7 text-[#ec2c6c]" />
            <span>Homepage Doctor Testimonials</span>
          </h1>
          <p className="text-xs text-gray-500">Manage doctor testimonials displayed in the Homepage interactive carousel.</p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="cbc-btn-primary text-xs font-extrabold px-5 py-3 shadow-md flex items-center justify-center space-x-2 w-full sm:w-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Testimonial</span>
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-gray-100 shadow-2xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search doctor or hospital name..."
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:border-[#ec2c6c]"
          />
        </div>

        <div className="text-xs font-semibold text-gray-500 flex items-center space-x-4">
          <span>Active on Homepage: <strong className="text-emerald-600">{testimonials.filter(t => t.status === 'ACTIVE').length}</strong></span>
          <span>Total: <strong className="text-gray-900">{testimonials.length}</strong></span>
        </div>
      </div>

      {/* Testimonials List */}
      {loading ? (
        <div className="p-12 text-center text-xs text-gray-500 font-semibold flex items-center justify-center space-x-2">
          <Loader2 className="w-5 h-5 animate-spin text-[#ec2c6c]" />
          <span>Loading testimonials...</span>
        </div>
      ) : filteredTestimonials.length === 0 ? (
        <div className="bg-white p-12 rounded-3xl text-center border border-gray-100 space-y-4 shadow-sm">
          <div className="w-16 h-16 rounded-full bg-pink-50 text-[#ec2c6c] flex items-center justify-center mx-auto">
            <Quote className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-gray-900">No Testimonials Found</h3>
          <p className="text-xs text-gray-500 max-w-md mx-auto leading-relaxed">
            Add doctor testimonials to showcase verified doctor reviews on your website homepage.
          </p>
          <button onClick={handleOpenAddModal} className="cbc-btn-primary text-xs font-bold px-6 py-2.5 shadow-md">
            + Add First Testimonial
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTestimonials.map((item) => (
            <div
              key={item.id}
              className={`bg-white rounded-3xl p-6 border shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between space-y-4 relative ${
                item.status === 'ACTIVE' ? 'border-gray-100' : 'border-gray-200 opacity-60 bg-gray-50/50'
              }`}
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span
                    className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                      item.status === 'ACTIVE'
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        : 'bg-gray-100 text-gray-600 border border-gray-200'
                    }`}
                  >
                    {item.status}
                  </span>

                  <div className="flex items-center space-x-1 bg-amber-50 border border-amber-200/60 px-2 py-0.5 rounded-full">
                    <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                    <span className="text-[11px] font-black text-amber-800">{item.rating || 5.0}</span>
                  </div>
                </div>

                <p className="text-xs text-gray-600 font-medium leading-relaxed italic bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                  &ldquo;{item.quote}&rdquo;
                </p>

                <div className="flex items-center space-x-3 pt-2 border-t border-gray-100">
                  <div className="relative w-12 h-12 rounded-full overflow-hidden bg-pink-50 border-2 border-[#ec2c6c]/20 flex-shrink-0">
                    {item.image ? (
                      <Image src={item.image} alt={item.doctorName} fill className="object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center font-bold text-lg text-[#ec2c6c]">
                        {item.doctorName[0] || 'D'}
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <h4 className="font-extrabold text-gray-900 text-sm truncate">{item.doctorName}</h4>
                    <p className="text-xs text-gray-500 font-medium truncate">{item.hospitalInfo}</p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => handleToggleStatus(item)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1 cursor-pointer ${
                    item.status === 'ACTIVE'
                      ? 'bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200'
                      : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200'
                  }`}
                >
                  {item.status === 'ACTIVE' ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  <span>{item.status === 'ACTIVE' ? 'Hide' : 'Show'}</span>
                </button>

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => handleOpenEditModal(item)}
                    className="px-3.5 py-1.5 bg-pink-50 hover:bg-pink-100 text-[#ec2c6c] border border-pink-100 rounded-lg text-xs font-bold transition-all flex items-center space-x-1 cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDeletingId(item.id)}
                    className="px-3.5 py-1.5 bg-gray-100 hover:bg-red-100 text-gray-700 hover:text-red-700 rounded-lg text-xs font-bold transition-colors flex items-center space-x-1 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Testimonial Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl relative my-8 border border-gray-100 text-gray-900">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-6 right-6 p-2 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1 border-b border-gray-100 pb-4">
              <h2 className="text-xl font-extrabold text-gray-900 flex items-center space-x-2">
                <Quote className="w-5 h-5 text-[#ec2c6c]" />
                <span>{editingItem ? 'Edit Homepage Testimonial' : 'Add New Homepage Testimonial'}</span>
              </h2>
              <p className="text-xs text-gray-500">Configure doctor testimonial content shown on the public Homepage carousel.</p>
            </div>

            {message && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span className="font-semibold">{message}</span>
              </div>
            )}

            {errorMessage && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                <span className="font-semibold">{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-4">
              {/* Doctor Photo */}
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-2xl flex items-center space-x-4">
                <div className="relative w-16 h-16 rounded-full overflow-hidden bg-white border border-gray-200 flex-shrink-0 flex items-center justify-center text-[#ec2c6c]">
                  {image ? (
                    <img src={image} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <Quote className="w-7 h-7" />
                  )}
                  {image && (
                    <button
                      type="button"
                      onClick={() => setImage('')}
                      className="absolute top-1 right-1 p-0.5 bg-red-600 text-white rounded-full text-[10px]"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>

                <div className="space-y-1">
                  <span className="text-xs font-bold text-gray-800 block">Doctor Photo Headshot</span>
                  <label className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 bg-white border border-gray-300 rounded-xl text-xs font-bold text-gray-700 hover:bg-gray-100 cursor-pointer shadow-2xs">
                    {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin text-[#ec2c6c]" /> : <Upload className="w-3.5 h-3.5 text-[#ec2c6c]" />}
                    <span>{image ? 'Change Photo' : 'Upload Photo'}</span>
                    <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Doctor Name *</label>
                <input
                  type="text"
                  required
                  value={doctorName}
                  onChange={(e) => setDoctorName(e.target.value)}
                  placeholder="e.g. Dr. Bikramjit Singh Dhillon"
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-900 focus:outline-none focus:border-[#ec2c6c]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Hospital / Clinic Info *</label>
                <input
                  type="text"
                  required
                  value={hospitalInfo}
                  onChange={(e) => setHospitalInfo(e.target.value)}
                  placeholder="e.g. Ludhiana Dental Centre – Ludhiana"
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-900 focus:outline-none focus:border-[#ec2c6c]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Testimonial Quote *</label>
                <textarea
                  rows={4}
                  required
                  value={quote}
                  onChange={(e) => setQuote(e.target.value)}
                  placeholder="e.g. Registering for Clinic By Choice has done my practice wonders! Patients who would not have found me now seek an appointment with us."
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-900 focus:outline-none focus:border-[#ec2c6c]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Display Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as 'ACTIVE' | 'INACTIVE')}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-900 focus:outline-none focus:border-[#ec2c6c]"
                  >
                    <option value="ACTIVE">ACTIVE (Show on Homepage)</option>
                    <option value="INACTIVE">INACTIVE (Hidden)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Star Rating</label>
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    max="5"
                    value={rating}
                    onChange={(e) => setRating(parseFloat(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-900 focus:outline-none focus:border-[#ec2c6c]"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 text-xs font-bold text-gray-600 border border-gray-200 rounded-full hover:bg-gray-50 cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="cbc-btn-primary text-xs font-extrabold px-6 py-2.5 shadow-md flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : editingItem ? <Edit3 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                  <span>{editingItem ? 'Update Testimonial' : 'Save Testimonial'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-5 shadow-2xl border border-red-100 text-gray-900">
            <div className="w-14 h-14 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto">
              <Trash2 className="w-7 h-7" />
            </div>

            <div className="text-center space-y-2">
              <h3 className="text-xl font-extrabold text-gray-900">Delete Testimonial</h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                Are you sure you want to delete this homepage doctor testimonial? This action cannot be undone.
              </p>
            </div>

            <div className="flex justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setDeletingId(null)}
                className="px-5 py-2.5 text-xs font-bold text-gray-600 border border-gray-200 rounded-full hover:bg-gray-50 cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleDelete}
                disabled={saving}
                className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-extrabold rounded-full shadow-lg transition-colors flex items-center space-x-1.5 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Confirm Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
