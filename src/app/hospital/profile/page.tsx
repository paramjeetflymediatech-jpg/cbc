'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Building2, Save, Loader2, CheckCircle2, AlertCircle, Plus, Trash2, Image as ImageIcon, Sparkles, ExternalLink, Upload } from 'lucide-react';

export default function HospitalProfilePage() {
  const [hospital, setHospital] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Form states
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [website, setWebsite] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [district, setDistrict] = useState('');
  const [state, setState] = useState('');
  const [description, setDescription] = useState('');
  const [logo, setLogo] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [contactPersonName, setContactPersonName] = useState('');
  const [contactPersonPhone, setContactPersonPhone] = useState('');

  // Uploading state
  const [uploadingCategory, setUploadingCategory] = useState<string | null>(null);

  // Complex arrays
  const [facilities, setFacilities] = useState<string[]>([]);
  const [newFacility, setNewFacility] = useState('');

  // Gallery array
  const [gallery, setGallery] = useState<string[]>([]);
  const [newGalleryUrl, setNewGalleryUrl] = useState('');

  useEffect(() => {
    fetch('/api/hospital/profile')
      .then((r) => r.json())
      .then((data) => {
        if (data.hospital) {
          const h = data.hospital;
          setHospital(h);
          setName(h.name || '');
          setPhone(h.phone || '');
          setWebsite(h.website || '');
          setAddress(h.address || '');
          setCity(h.city || '');
          setDistrict(h.district || '');
          setState(h.state || '');
          setDescription(h.description || '');
          setLogo(h.logo || '');
          setCoverImage(h.coverImage || '');
          setContactPersonName(h.contactPersonName || '');
          setContactPersonPhone(h.contactPersonPhone || '');
          setFacilities(h.facilities || []);
          setGallery(h.gallery || []);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, targetCategory: 'logo' | 'cover' | 'gallery') => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingCategory(targetCategory);
    setErrorMessage('');

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('category', targetCategory);
      if (name) formData.append('hospitalName', name);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(data.error || 'Failed to upload image.');
      } else {
        if (targetCategory === 'logo') {
          setLogo(data.url);
          await fetch('/api/hospital/profile', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ logo: data.url }),
          });
        } else if (targetCategory === 'cover') {
          setCoverImage(data.url);
          await fetch('/api/hospital/profile', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ coverImage: data.url }),
          });
        } else if (targetCategory === 'gallery') {
          const updatedGallery = [...gallery, data.url];
          setGallery(updatedGallery);
          await fetch('/api/hospital/profile', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ gallery: updatedGallery }),
          });
        }

        setMessage(`Image uploaded and updated in profile successfully!`);
      }
    } catch {
      setErrorMessage('Network error uploading file.');
    } finally {
      setUploadingCategory(null);
      e.target.value = '';
    }
  };

  const handleAddFacility = () => {
    if (newFacility.trim()) {
      setFacilities([...facilities, newFacility.trim()]);
      setNewFacility('');
    }
  };

  const handleRemoveFacility = (index: number) => {
    setFacilities(facilities.filter((_, i) => i !== index));
  };

  const handleAddGalleryPhoto = () => {
    if (newGalleryUrl.trim()) {
      setGallery([...gallery, newGalleryUrl.trim()]);
      setNewGalleryUrl('');
    }
  };

  const handleRemoveGalleryPhoto = (index: number) => {
    setGallery(gallery.filter((_, i) => i !== index));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setErrorMessage('');
    setSaving(true);

    try {
      const res = await fetch('/api/hospital/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          phone,
          website,
          address,
          city,
          district,
          state,
          description,
          logo,
          coverImage,
          contactPersonName,
          contactPersonPhone,
          facilities,
          gallery,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(data.error || 'Failed to update profile.');
      } else {
        setMessage('Hospital profile and photo gallery updated successfully.');
      }
    } catch {
      setErrorMessage('Network error saving profile.');
    } finally {
      setSaving(false);
    }
  };

  if (loading || !hospital) {
    return <div className="p-8 text-center text-gray-500 font-medium">Loading hospital profile...</div>;
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      <div className="flex justify-between items-center border-b border-gray-200 pb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">Hospital Profile & Media</h1>
          <p className="text-xs text-gray-500">Manage your hospital information, uploaded photos, and local gallery folder.</p>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-[#b02151] hover:bg-[#921941] text-white text-xs font-extrabold px-5 py-2.5 rounded-xl uppercase tracking-wider transition-all shadow-md flex items-center space-x-2 cursor-pointer"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          <span>Save Profile & Media</span>
        </button>
      </div>

      {message && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm rounded-xl flex items-center space-x-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <span className="font-semibold">{message}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl flex items-center space-x-2">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <span className="font-semibold">{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Hospital Photo Gallery Section */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-gray-100 space-y-5">
          <div className="border-b border-gray-100 pb-3 flex items-center justify-between">
            <div>
              <h3 className="text-base font-extrabold text-gray-900 flex items-center">
                <ImageIcon className="w-5 h-5 text-[#b02151] mr-2" />
                Hospital Photo Gallery ({gallery.length})
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">Uploaded images are stored in your hospital folder under <code className="bg-gray-100 px-1 py-0.5 rounded text-pink-600">/public/uploads/hospitals/{hospital.slug || 'hospital-name'}</code>.</p>
            </div>
            <span className="text-xs font-bold text-[#b02151] bg-pink-50 px-3 py-1 rounded-full border border-pink-100">
              Visible to Patients
            </span>
          </div>

          {/* Upload File Box */}
          <div className="p-5 bg-gradient-to-r from-pink-50/50 via-slate-50 to-pink-50/20 border-2 border-dashed border-pink-200 rounded-2xl space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-[#b02151] text-white flex items-center justify-center font-bold flex-shrink-0 shadow-md">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-extrabold text-gray-900 uppercase tracking-wider">
                    Upload Photo from Device
                  </h4>
                  <p className="text-xs text-gray-500 font-medium">
                    Choose an image file (.jpg, .png, .webp). Saved directly to hospital folder.
                  </p>
                </div>
              </div>

              <label className="bg-[#b02151] hover:bg-[#921941] text-white text-xs font-extrabold px-4 py-2.5 rounded-xl uppercase tracking-wider shadow-md transition-all inline-flex items-center justify-center space-x-2 cursor-pointer flex-shrink-0">
                {uploadingCategory === 'gallery' ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Uploading...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    <span>Choose Photo File</span>
                  </>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileUpload(e, 'gallery')}
                  className="hidden"
                />
              </label>
            </div>

            {/* Paste URL Option */}
            <div className="pt-2 border-t border-gray-200/60 flex space-x-2">
              <input
                type="url"
                value={newGalleryUrl}
                onChange={(e) => setNewGalleryUrl(e.target.value)}
                placeholder="Or paste external image URL (https://...)..."
                className="w-full px-3.5 py-2 bg-white border border-gray-200 rounded-xl text-xs font-medium focus:outline-none focus:border-[#fd1d74]"
              />
              <button
                type="button"
                onClick={handleAddGalleryPhoto}
                className="bg-gray-900 text-white px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider flex-shrink-0 cursor-pointer"
              >
                Add URL
              </button>
            </div>
          </div>

          {/* Gallery Image Grid */}
          {gallery.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 pt-2">
              {gallery.map((imgUrl, index) => (
                <div key={index} className="relative group h-36 bg-gray-100 rounded-2xl overflow-hidden border border-gray-200 shadow-xs">
                  <Image
                    src={imgUrl}
                    alt={`Hospital Gallery Photo ${index + 1}`}
                    fill
                    unoptimized
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-2 p-2">
                    <button
                      type="button"
                      onClick={() => handleRemoveGalleryPhoto(index)}
                      className="p-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors shadow-lg cursor-pointer"
                      title="Delete Photo"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <a
                      href={imgUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="p-2 bg-white/90 text-gray-900 rounded-full hover:bg-white transition-colors shadow-lg"
                      title="View Full Image"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-gray-200 text-gray-400 text-xs space-y-2">
              <ImageIcon className="w-8 h-8 mx-auto text-gray-300" />
              <p className="font-medium">No gallery photos added yet. Upload files above to showcase your hospital facilities to patients!</p>
            </div>
          )}
        </div>

        {/* General Information & Branding Uploads */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-gray-100 space-y-5">
          <h3 className="text-xs font-extrabold text-[#b02151] uppercase tracking-wider">General Information & Branding</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Hospital Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:border-[#fd1d74]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Phone Number</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:border-[#fd1d74]"
              />
            </div>
          </div>

          {/* Logo & Cover Upload Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-xs font-bold text-gray-700 uppercase">Hospital Logo</label>
              <div className="flex items-center space-x-3">
                {logo ? (
                  <div className="relative w-12 h-12 rounded-xl bg-gray-50 border border-gray-200 overflow-hidden flex-shrink-0">
                    <Image src={logo} alt="Logo preview" fill unoptimized className="object-contain p-1" />
                  </div>
                ) : null}
                <div className="flex items-center space-x-2 flex-1">
                  <input
                    type="url"
                    value={logo}
                    onChange={(e) => setLogo(e.target.value)}
                    placeholder="https://..."
                    className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:outline-none focus:border-[#fd1d74]"
                  />
                  <label className="bg-gray-900 text-white text-xs font-bold px-3 py-2 rounded-xl flex-shrink-0 cursor-pointer hover:bg-black inline-flex items-center space-x-1">
                    {uploadingCategory === 'logo' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                    <span>Upload Logo</span>
                    <input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, 'logo')} className="hidden" />
                  </label>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-gray-700 uppercase">Cover Banner</label>
              <div className="flex items-center space-x-3">
                {coverImage ? (
                  <div className="relative w-16 h-12 rounded-xl bg-gray-50 border border-gray-200 overflow-hidden flex-shrink-0">
                    <Image src={coverImage} alt="Cover preview" fill unoptimized className="object-cover" />
                  </div>
                ) : null}
                <div className="flex items-center space-x-2 flex-1">
                  <input
                    type="url"
                    value={coverImage}
                    onChange={(e) => setCoverImage(e.target.value)}
                    placeholder="https://..."
                    className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:outline-none focus:border-[#fd1d74]"
                  />
                  <label className="bg-gray-900 text-white text-xs font-bold px-3 py-2 rounded-xl flex-shrink-0 cursor-pointer hover:bg-black inline-flex items-center space-x-1">
                    {uploadingCategory === 'cover' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                    <span>Upload Cover</span>
                    <input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, 'cover')} className="hidden" />
                  </label>
                </div>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Hospital Description</label>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:border-[#fd1d74]"
            />
          </div>
        </div>

        {/* Location */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-gray-100 space-y-4">
          <h3 className="text-xs font-extrabold text-[#b02151] uppercase tracking-wider">Location & Address</h3>
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Street Address</label>
            <textarea
              rows={2}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:border-[#fd1d74]"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">City / Town</label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:border-[#fd1d74]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">District</label>
              <input
                type="text"
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                placeholder="e.g. Ludhiana"
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:border-[#fd1d74]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">State</label>
              <input
                type="text"
                value={state}
                onChange={(e) => setState(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:border-[#fd1d74]"
              />
            </div>
          </div>
        </div>

        {/* Facilities */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-gray-100 space-y-4">
          <h3 className="text-xs font-extrabold text-[#b02151] uppercase tracking-wider">Hospital Facilities</h3>
          <div className="flex space-x-2">
            <input
              type="text"
              value={newFacility}
              onChange={(e) => setNewFacility(e.target.value)}
              placeholder="Add facility (e.g. 24/7 Pharmacy, Modular OT)"
              className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm"
            />
            <button
              type="button"
              onClick={handleAddFacility}
              className="px-4 py-2 bg-[#b02151] hover:bg-[#921941] text-white rounded-xl text-xs font-extrabold uppercase"
            >
              Add
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            {facilities.map((fac, idx) => (
              <span key={idx} className="bg-slate-100 text-gray-800 text-xs font-bold px-3.5 py-1.5 rounded-full flex items-center">
                {fac}
                <button
                  type="button"
                  onClick={() => handleRemoveFacility(idx)}
                  className="ml-2 text-red-500 hover:text-red-700 font-extrabold"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>
      </form>
    </div>
  );
}
