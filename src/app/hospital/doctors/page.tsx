'use client';

import React, { useState, useEffect } from 'react';
import { UserCheck, Plus, Edit3, Trash2, X, Upload, Loader2, CheckCircle2, AlertCircle, Search, Stethoscope, Award, Briefcase, Star } from 'lucide-react';

interface IDoctorReview {
  id?: string;
  patientName: string;
  rating: number;
  comment: string;
  date: string;
}

interface DoctorItem {
  name: string;
  specialty?: string;
  qualification?: string;
  experience?: string;
  image?: string;
  treatments?: string[];
  reviews?: IDoctorReview[];
  rating?: number;
}

export default function HospitalDoctorsPage() {
  const [doctors, setDoctors] = useState<DoctorItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [reviewModalDoc, setReviewModalDoc] = useState<DoctorItem | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [qualification, setQualification] = useState('');
  const [experience, setExperience] = useState('');
  const [image, setImage] = useState('');
  const [treatmentsInput, setTreatmentsInput] = useState('');

  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Delete State
  const [deletingIndex, setDeletingIndex] = useState<number | null>(null);

  const fetchDoctors = () => {
    fetch('/api/hospital/doctors')
      .then((r) => r.json())
      .then((data) => {
        if (data.doctors) setDoctors(data.doctors);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchDoctors();
  }, []);

  const resetForm = () => {
    setEditingIndex(null);
    setName('');
    setSpecialty('');
    setQualification('');
    setExperience('');
    setImage('');
    setTreatmentsInput('');
    setErrorMessage('');
    setMessage('');
  };

  const handleOpenAddModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (doc: DoctorItem, idx: number) => {
    setEditingIndex(idx);
    setName(doc.name || '');
    setSpecialty(doc.specialty || '');
    setQualification(doc.qualification || '');
    setExperience(doc.experience || '');
    setImage(doc.image || '');
    setTreatmentsInput((doc.treatments || []).join(', '));
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
    formData.append('category', 'hospitals');

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

  const handleSaveDoctor = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setMessage('');
    setSaving(true);

    try {
      const isEditing = editingIndex !== null;
      const url = '/api/hospital/doctors';
      const method = isEditing ? 'PUT' : 'POST';

      const parsedTreatments = treatmentsInput
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      const payload: Record<string, unknown> = {
        name,
        specialty,
        qualification,
        experience,
        image,
        treatments: parsedTreatments,
      };

      if (isEditing) {
        payload.index = editingIndex;
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error || 'Failed to save doctor.');
      } else {
        setMessage(isEditing ? 'Doctor profile updated successfully!' : 'Doctor added successfully!');
        if (data.doctors) setDoctors(data.doctors);
        setTimeout(() => {
          setIsModalOpen(false);
          resetForm();
        }, 1000);
      }
    } catch {
      setErrorMessage('Server error saving doctor profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteDoctor = async () => {
    if (deletingIndex === null) return;

    setSaving(true);
    try {
      const res = await fetch(`/api/hospital/doctors?index=${deletingIndex}`, {
        method: 'DELETE',
      });

      const data = await res.json();
      if (res.ok) {
        if (data.doctors) setDoctors(data.doctors);
        setDeletingIndex(null);
      } else {
        alert(data.error || 'Failed to delete doctor.');
      }
    } catch {
      alert('Error deleting doctor profile.');
    } finally {
      setSaving(false);
    }
  };

  const filteredDoctors = doctors.filter((doc) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      doc.name.toLowerCase().includes(q) ||
      (doc.specialty && doc.specialty.toLowerCase().includes(q)) ||
      (doc.qualification && doc.qualification.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 pb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 flex items-center space-x-2">
            <UserCheck className="w-7 h-7 text-[#ec2c6c]" />
            <span>Manage Hospital Doctors</span>
          </h1>
          <p className="text-xs text-gray-500">Add, update qualifications, and present your specialist medical team on your public hospital profile.</p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="cbc-btn-primary text-xs font-extrabold px-5 py-3 shadow-md flex items-center justify-center space-x-2 w-full sm:w-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Specialist Doctor</span>
        </button>
      </div>

      {/* Search Filter & Count Stats */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-gray-100 shadow-2xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by doctor name or specialty..."
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:border-[#ec2c6c]"
          />
        </div>

        <div className="text-xs font-semibold text-gray-500">
          Total Doctors: <span className="text-[#ec2c6c] font-extrabold">{doctors.length}</span>
        </div>
      </div>

      {/* Doctors Grid */}
      {loading ? (
        <div className="p-12 text-center text-xs text-gray-500 font-semibold flex items-center justify-center space-x-2">
          <Loader2 className="w-5 h-5 animate-spin text-[#ec2c6c]" />
          <span>Loading doctor team...</span>
        </div>
      ) : filteredDoctors.length === 0 ? (
        <div className="bg-white p-12 rounded-3xl text-center border border-gray-100 space-y-4 shadow-sm">
          <div className="w-16 h-16 rounded-full bg-pink-50 text-[#ec2c6c] flex items-center justify-center mx-auto">
            <Stethoscope className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-gray-900">No Doctors Added Yet</h3>
          <p className="text-xs text-gray-500 max-w-md mx-auto leading-relaxed">
            Adding your specialist doctors builds patient trust and significantly increases enquiry conversions on your hospital page.
          </p>
          <button
            onClick={handleOpenAddModal}
            className="cbc-btn-primary text-xs font-bold px-6 py-2.5 shadow-md"
          >
            + Add First Doctor
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDoctors.map((doc, idx) => {
            const revCount = doc.reviews?.length || 0;
            const docRating = doc.rating || (revCount > 0 ? (doc.reviews!.reduce((s: number, r: IDoctorReview) => s + (r.rating || 5), 0) / revCount).toFixed(1) : 5.0);

            return (
              <div
                key={idx}
                className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 space-y-4 flex flex-col justify-between group"
              >
                <div className="space-y-4">
                  <div className="flex items-center space-x-4">
                    <div className="relative w-16 h-16 rounded-2xl overflow-hidden bg-pink-50 border border-pink-100 flex-shrink-0 flex items-center justify-center text-[#ec2c6c] font-bold text-xl">
                      {doc.image ? (
                        <img src={doc.image} alt={doc.name} className="w-full h-full object-cover" />
                      ) : (
                        <span>{doc.name.replace(/^(Dr\.\s*)/i, '')[0] || 'D'}</span>
                      )}
                    </div>

                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <h3 className="font-extrabold text-gray-900 text-base truncate group-hover:text-[#ec2c6c] transition-colors">
                          {doc.name}
                        </h3>
                        <div className="flex items-center space-x-1 bg-amber-50 border border-amber-200/60 px-2 py-0.5 rounded-full">
                          <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                          <span className="text-[11px] font-black text-amber-800">{docRating}</span>
                        </div>
                      </div>
                      <p className="text-xs font-bold text-[#ec2c6c] bg-pink-50 px-2.5 py-0.5 rounded-full w-fit truncate">
                        {doc.specialty || 'Medical Specialist'}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2 text-xs text-gray-600 pt-2 border-t border-gray-100">
                    {doc.qualification && (
                      <div className="flex items-start space-x-2">
                        <Award className="w-3.5 h-3.5 text-gray-400 flex-shrink-0 mt-0.5" />
                        <span className="font-medium text-gray-800">{doc.qualification}</span>
                      </div>
                    )}

                    {doc.experience && (
                      <div className="flex items-center space-x-2">
                        <Briefcase className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                        <span className="font-semibold text-gray-700">{doc.experience} Experience</span>
                      </div>
                    )}

                    {doc.treatments && doc.treatments.length > 0 && (
                      <div className="pt-2 border-t border-gray-50">
                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                          Treatments Provided:
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {doc.treatments.map((tr, tIdx) => (
                            <span
                              key={tIdx}
                              className="px-2 py-0.5 bg-pink-50 text-[#ec2c6c] border border-pink-100 font-semibold text-[10px] rounded-md"
                            >
                              {tr}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Actions */}
                <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setReviewModalDoc(doc)}
                    className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-lg text-xs font-bold transition-all flex items-center space-x-1 cursor-pointer"
                  >
                    <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                    <span>Reviews ({revCount})</span>
                  </button>

                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => handleOpenEditModal(doc, idx)}
                      className="px-3.5 py-1.5 bg-pink-50 hover:bg-pink-100 text-[#ec2c6c] border border-pink-100 rounded-lg text-xs font-bold transition-all flex items-center space-x-1 cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setDeletingIndex(idx)}
                      className="px-3.5 py-1.5 bg-gray-100 hover:bg-red-100 text-gray-700 hover:text-red-700 rounded-lg text-xs font-bold transition-colors flex items-center space-x-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remove</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Doctor Modal */}
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
                <Stethoscope className="w-5 h-5 text-[#ec2c6c]" />
                <span>{editingIndex !== null ? 'Edit Doctor Profile' : 'Add New Specialist Doctor'}</span>
              </h2>
              <p className="text-xs text-gray-500">Fill in doctor credentials and upload professional headshot photo.</p>
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

            <form onSubmit={handleSaveDoctor} className="space-y-4">
              {/* Doctor Photo Uploader */}
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-2xl flex items-center space-x-4">
                <div className="relative w-16 h-16 rounded-2xl overflow-hidden bg-white border border-gray-200 flex-shrink-0 flex items-center justify-center text-[#ec2c6c]">
                  {image ? (
                    <img src={image} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <Stethoscope className="w-7 h-7" />
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
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Doctor Full Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Dr. Rajesh Sharma"
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-900 focus:outline-none focus:border-[#ec2c6c]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Specialty / Department *</label>
                <input
                  type="text"
                  required
                  value={specialty}
                  onChange={(e) => setSpecialty(e.target.value)}
                  placeholder="e.g. Senior Orthopedic & Joint Replacement Surgeon"
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-900 focus:outline-none focus:border-[#ec2c6c]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Qualifications</label>
                  <input
                    type="text"
                    value={qualification}
                    onChange={(e) => setQualification(e.target.value)}
                    placeholder="e.g. MBBS, MS (Orthopedics), M.Ch"
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-900 focus:outline-none focus:border-[#ec2c6c]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Experience</label>
                  <input
                    type="text"
                    value={experience}
                    onChange={(e) => setExperience(e.target.value)}
                    placeholder="e.g. 18+ Years"
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-900 focus:outline-none focus:border-[#ec2c6c]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Treatments Provided / Special Procedures
                </label>
                <input
                  type="text"
                  value={treatmentsInput}
                  onChange={(e) => setTreatmentsInput(e.target.value)}
                  placeholder="e.g. Knee Replacement, Hip Arthroplasty, ACL Reconstruction"
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-900 focus:outline-none focus:border-[#ec2c6c]"
                />
                <p className="text-[10px] text-gray-400 mt-1">Separate multiple treatments with commas.</p>
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
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : editingIndex !== null ? <Edit3 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                  <span>{editingIndex !== null ? 'Update Doctor' : 'Save Doctor'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingIndex !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-5 shadow-2xl border border-red-100 text-gray-900">
            <div className="w-14 h-14 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto">
              <Trash2 className="w-7 h-7" />
            </div>

            <div className="text-center space-y-2">
              <h3 className="text-xl font-extrabold text-gray-900">Remove Doctor Profile</h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                Are you sure you want to remove <strong>{doctors[deletingIndex]?.name}</strong> from your hospital profile?
              </p>
            </div>

            <div className="flex justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setDeletingIndex(null)}
                className="px-5 py-2.5 text-xs font-bold text-gray-600 border border-gray-200 rounded-full hover:bg-gray-50 cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleDeleteDoctor}
                disabled={saving}
                className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-extrabold rounded-full shadow-lg transition-colors flex items-center space-x-1.5 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Confirm Remove</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hospital Manager Doctor Reviews Modal */}
      {reviewModalDoc && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-gray-100 space-y-5 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <h3 className="text-lg font-extrabold text-gray-900 flex items-center">
                  <Star className="w-5 h-5 text-amber-500 fill-amber-500 mr-2" />
                  Patient Reviews for {reviewModalDoc.name}
                </h3>
                <p className="text-xs text-gray-500">{reviewModalDoc.specialty || reviewModalDoc.qualification}</p>
              </div>

              <button
                type="button"
                onClick={() => setReviewModalDoc(null)}
                className="p-1.5 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              {reviewModalDoc.reviews && reviewModalDoc.reviews.length > 0 ? (
                reviewModalDoc.reviews.map((rev, rIdx) => (
                  <div key={rev.id || rIdx} className="p-4 bg-slate-50 border border-gray-200 rounded-2xl space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-7 h-7 rounded-full bg-pink-100 text-[#ec2c6c] font-extrabold text-xs flex items-center justify-center">
                          {rev.patientName ? rev.patientName[0].toUpperCase() : 'P'}
                        </div>
                        <div>
                          <span className="font-extrabold text-gray-900 text-xs block">{rev.patientName}</span>
                          <span className="text-[10px] text-gray-400 font-medium">
                            {rev.date ? new Date(rev.date).toLocaleDateString() : 'Verified Patient'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-0.5">
                        {Array.from({ length: 5 }).map((_, s) => (
                          <Star
                            key={s}
                            className={`w-3.5 h-3.5 ${
                              s < (rev.rating || 5) ? 'text-amber-500 fill-amber-500' : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                    </div>

                    <p className="text-xs text-gray-700 leading-relaxed font-medium pl-9">
                      &ldquo;{rev.comment}&rdquo;
                    </p>
                  </div>
                ))
              ) : (
                <div className="py-10 text-center text-xs text-gray-500 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                  No patient reviews recorded yet for {reviewModalDoc.name}.
                </div>
              )}
            </div>

            <div className="pt-2 text-right">
              <button
                type="button"
                onClick={() => setReviewModalDoc(null)}
                className="px-5 py-2.5 bg-[#ec2c6c] hover:bg-[#d41f5a] text-white text-xs font-extrabold rounded-xl cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
