'use client';

import React, { useState, useEffect } from 'react';
import { Stethoscope, Plus, Save, Loader2, CheckCircle2, Search, ChevronLeft, ChevronRight, Edit2, X } from 'lucide-react';
import RichTextEditor from '@/components/ui/RichTextEditor';

export default function AdminServicesPage() {
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Pagination & Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Create Form state
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [category, setCategory] = useState('');
  const [parentId, setParentId] = useState<number | string>('');
  const [shortDescription, setShortDescription] = useState('');
  const [description, setDescription] = useState('');
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDescription, setSeoDescription] = useState('');

  // Edit Modal state
  const [editingService, setEditingService] = useState<any | null>(null);
  const [editName, setEditName] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editParentId, setEditParentId] = useState<number | string>('');
  const [editShortDescription, setEditShortDescription] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editSeoTitle, setEditSeoTitle] = useState('');
  const [editSeoDescription, setEditSeoDescription] = useState('');
  const [editStatus, setEditStatus] = useState<'ACTIVE' | 'INACTIVE'>('ACTIVE');

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const fetchServices = () => {
    fetch('/api/admin/services')
      .then((r) => r.json())
      .then((data) => {
        if (data.services) setServices(data.services);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const handleCreateService = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setSaving(true);

    try {
      const res = await fetch('/api/admin/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          slug,
          category,
          parentId: parentId ? Number(parentId) : null,
          shortDescription,
          description,
          seoTitle,
          seoDescription,
        }),
      });

      if (res.ok) {
        setMessage('New medical service created successfully.');
        setName('');
        setSlug('');
        setCategory('');
        setParentId('');
        setShortDescription('');
        setDescription('');
        setSeoTitle('');
        setSeoDescription('');
        fetchServices();
      }
    } catch {
      // ignore
    } finally {
      setSaving(false);
    }
  };

  const handleOpenEdit = (svc: any) => {
    setEditingService(svc);
    setEditName(svc.name || '');
    setEditCategory(svc.category || '');
    setEditParentId(svc.parentId || '');
    setEditShortDescription(svc.shortDescription || '');
    setEditDescription(svc.description || '');
    setEditSeoTitle(svc.seoTitle || '');
    setEditSeoDescription(svc.seoDescription || '');
    setEditStatus(svc.status || 'ACTIVE');
  };

  const handleUpdateService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingService) return;

    setMessage('');
    setSaving(true);

    try {
      const res = await fetch('/api/admin/services', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingService.id,
          name: editName,
          category: editCategory,
          parentId: editParentId ? Number(editParentId) : null,
          shortDescription: editShortDescription,
          description: editDescription,
          seoTitle: editSeoTitle,
          seoDescription: editSeoDescription,
          status: editStatus,
        }),
      });

      if (res.ok) {
        setMessage(`Service "${editName}" updated successfully.`);
        setEditingService(null);
        fetchServices();
      }
    } catch {
      // ignore
    } finally {
      setSaving(false);
    }
  };

  // Main parent services for dropdown selection
  const mainServicesList = services.filter((s) => !s.parentId);

  // Filtered Services
  const filteredServices = services.filter((s) => {
    const q = searchQuery.toLowerCase().trim();
    return (
      !q ||
      s.name.toLowerCase().includes(q) ||
      (s.slug && s.slug.toLowerCase().includes(q)) ||
      (s.category && s.category.toLowerCase().includes(q)) ||
      (s.parent && s.parent.name.toLowerCase().includes(q))
    );
  });

  // Pagination Math
  const totalPages = Math.ceil(filteredServices.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedServices = filteredServices.slice(startIndex, startIndex + itemsPerPage);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-extrabold text-gray-900">Manage Platform Medical Services</h1>
        <p className="text-xs text-gray-500">Create and edit medical specialties, sub-services, descriptions and SEO tags.</p>
      </div>

      {message && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm rounded-xl flex items-center space-x-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          <span>{message}</span>
        </div>
      )}

      {/* Add New Service Form */}
      <div className="cbc-card p-6 border border-gray-100 space-y-4">
        <h3 className="text-sm font-bold text-[#ec2c6c] uppercase tracking-wider">Create New Specialty or Sub-Service</h3>
        <form onSubmit={handleCreateService} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Service Name *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Breast Cancer Care"
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Slug (URL identifier)</label>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="e.g. breast-cancer"
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Parent Service (Optional)</label>
              <select
                value={parentId}
                onChange={(e) => setParentId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm"
              >
                <option value="">None (Top-Level Main Service)</option>
                {mainServicesList.map((m) => (
                  <option key={m.id} value={m.id}>
                    Sub-service of: {m.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Category</label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="e.g. Oncology & Cancer Care"
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Short Description</label>
            <input
              type="text"
              value={shortDescription}
              onChange={(e) => setShortDescription(e.target.value)}
              placeholder="Brief summary displayed on cards..."
              className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Full Description</label>
            <RichTextEditor
              value={description}
              onChange={setDescription}
              placeholder="Enter full specialty details and formatting here..."
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">SEO Title</label>
              <input
                type="text"
                value={seoTitle}
                onChange={(e) => setSeoTitle(e.target.value)}
                placeholder="SEO page title tag..."
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">SEO Meta Description</label>
              <input
                type="text"
                value={seoDescription}
                onChange={(e) => setSeoDescription(e.target.value)}
                placeholder="SEO meta description..."
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={saving}
              className="cbc-btn-primary text-sm shadow-md flex items-center space-x-2"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              <span>Create Specialty Service</span>
            </button>
          </div>
        </form>
      </div>

      {/* Services List Table Header with Search & Pagination info */}
      <div className="cbc-card border border-gray-100 overflow-hidden space-y-4 p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-extrabold text-gray-900">Platform Medical Services ({filteredServices.length})</h3>
            <p className="text-xs text-gray-500">
              Showing {filteredServices.length > 0 ? startIndex + 1 : 0}–{Math.min(startIndex + itemsPerPage, filteredServices.length)} of {filteredServices.length} specialties
            </p>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search service by name or slug..."
              className="w-full pl-9 pr-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:outline-none focus:border-[#ec2c6c]"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-700">
            <thead className="bg-gray-50 text-xs font-bold uppercase text-gray-500">
              <tr>
                <th className="p-4">Service Name</th>
                <th className="p-4">Slug</th>
                <th className="p-4">Parent Specialty</th>
                <th className="p-4">Category</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginatedServices.map((s) => (
                <tr key={s.id} className="hover:bg-gray-50/50">
                  <td className="p-4 font-bold text-gray-900">{s.name}</td>
                  <td className="p-4 font-mono text-xs text-[#ec2c6c]">{s.slug}</td>
                  <td className="p-4 text-xs font-semibold text-gray-600">
                    {s.parent ? (
                      <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200">
                        Sub of {s.parent.name}
                      </span>
                    ) : (
                      <span className="text-gray-400 font-normal">Main Service</span>
                    )}
                  </td>
                  <td className="p-4 text-xs font-semibold text-gray-600">{s.category || 'General'}</td>
                  <td className="p-4">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                      {s.status}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(s)}
                      className="px-3 py-1 bg-gray-100 hover:bg-[#ec2c6c] hover:text-white text-gray-700 text-xs font-extrabold rounded-lg transition-colors inline-flex items-center space-x-1"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredServices.length === 0 && !loading && (
            <div className="text-center py-12 text-gray-500 text-xs">
              No services found matching &quot;{searchQuery}&quot;.
            </div>
          )}
        </div>

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-4 border-t border-gray-100">
            <div className="text-xs text-gray-500 font-medium">
              Page {currentPage} of {totalPages}
            </div>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3 py-1.5 bg-white border border-gray-200 text-xs font-bold text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-40 flex items-center space-x-1"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Prev</span>
              </button>

              <div className="flex items-center space-x-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                  <button
                    key={pageNum}
                    type="button"
                    onClick={() => handlePageChange(pageNum)}
                    className={`w-7 h-7 rounded-lg text-xs font-bold transition-all ${
                      currentPage === pageNum
                        ? 'bg-[#ec2c6c] text-white shadow-xs'
                        : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                    }`}
                  >
                    {pageNum}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 bg-white border border-gray-200 text-xs font-bold text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-40 flex items-center space-x-1"
              >
                <span>Next</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Edit Service Modal Overlay */}
      {editingService && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full p-6 space-y-6 shadow-2xl animate-fadeIn max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-lg font-bold text-gray-900">
                Edit Service: <span className="text-[#ec2c6c]">{editingService.name}</span>
              </h3>
              <button
                type="button"
                onClick={() => setEditingService(null)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateService} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Service Name *</label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Category</label>
                  <input
                    type="text"
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Parent Service</label>
                  <select
                    value={editParentId}
                    onChange={(e) => setEditParentId(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm"
                  >
                    <option value="">None (Top-Level Main Service)</option>
                    {mainServicesList
                      .filter((m) => m.id !== editingService.id)
                      .map((m) => (
                        <option key={m.id} value={m.id}>
                          Sub-service of: {m.name}
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Status</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as 'ACTIVE' | 'INACTIVE')}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm"
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Short Description</label>
                <input
                  type="text"
                  value={editShortDescription}
                  onChange={(e) => setEditShortDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Full Description</label>
                <RichTextEditor
                  value={editDescription}
                  onChange={setEditDescription}
                  placeholder="Enter full specialty details and formatting here..."
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">SEO Title</label>
                  <input
                    type="text"
                    value={editSeoTitle}
                    onChange={(e) => setEditSeoTitle(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">SEO Description</label>
                  <input
                    type="text"
                    value={editSeoDescription}
                    onChange={(e) => setEditSeoDescription(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setEditingService(null)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 text-xs font-bold rounded-xl hover:bg-gray-200"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="cbc-btn-primary text-xs shadow-md flex items-center space-x-1.5 py-2 px-5"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
