'use client';

import React, { useState, useEffect } from 'react';
import { Globe, Code, Plus, Edit, Trash2, Save, Search, Settings, Upload, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';

interface SeoItem {
  id: number;
  pageName: string;
  path: string;
  title: string;
  description: string;
  keywords?: string | null;
  canonicalUrl?: string | null;
  ogImage?: string | null;
  ogTitle?: string | null;
  ogDescription?: string | null;
  robotsIndex?: string | null;
  schemaMarkup?: string | null;
  createdAt: string;
}

export default function AdminSeoPage() {
  const [activeTab, setActiveTab] = useState<'scripts' | 'seo'>('scripts');
  const [seoList, setSeoList] = useState<SeoItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Scripts Form State
  const [headerScript, setHeaderScript] = useState('');
  const [footerScript, setFooterScript] = useState('');
  const [googleAnalyticsId, setGoogleAnalyticsId] = useState('');
  const [googleTagManagerId, setGoogleTagManagerId] = useState('');
  const [globalSchema, setGlobalSchema] = useState('');
  const [isSavingScripts, setIsSavingScripts] = useState(false);

  // SEO Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editId, setEditId] = useState<number | null>(null);
  const [formPageName, setFormPageName] = useState('');
  const [formPath, setFormPath] = useState('');
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formKeywords, setFormKeywords] = useState('');
  const [formCanonicalUrl, setFormCanonicalUrl] = useState('');
  const [formOgImage, setFormOgImage] = useState('');
  const [formOgTitle, setFormOgTitle] = useState('');
  const [formOgDescription, setFormOgDescription] = useState('');
  const [formRobotsIndex, setFormRobotsIndex] = useState('index, follow');
  const [formSchemaMarkup, setFormSchemaMarkup] = useState('');
  const [isSavingSeo, setIsSavingSeo] = useState(false);
  const [formError, setFormError] = useState('');

  // Image Upload State
  const [isUploading, setIsUploading] = useState(false);

  // Status Alerts
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchData = async () => {
    try {
      const res = await fetch('/api/admin/seo');
      if (!res.ok) throw new Error('Failed to fetch data');
      const data = await res.json();
      setSeoList(data.seoList || []);
      setHeaderScript(data.settings?.headerScript || '');
      setFooterScript(data.settings?.footerScript || '');
      setGoogleAnalyticsId(data.settings?.googleAnalyticsId || '');
      setGoogleTagManagerId(data.settings?.googleTagManagerId || '');
      setGlobalSchema(data.settings?.globalSchema || '');
    } catch {
      showToast('error', 'Failed to load SEO settings');
    }
  };

  const handleSaveScripts = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingScripts(true);
    try {
      const res = await fetch('/api/admin/seo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'save_scripts',
          headerScript,
          footerScript,
          googleAnalyticsId,
          googleTagManagerId,
          globalSchema,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save settings');
      showToast('success', 'Global SEO settings updated successfully!');
    } catch (err: any) {
      showToast('error', err.message || 'Error saving settings');
    } finally {
      setIsSavingScripts(false);
    }
  };

  const handleOpenCreateModal = () => {
    setModalMode('create');
    setEditId(null);
    setFormPageName('');
    setFormPath('');
    setFormTitle('');
    setFormDescription('');
    setFormKeywords('');
    setFormCanonicalUrl('');
    setFormOgImage('');
    setFormOgTitle('');
    setFormOgDescription('');
    setFormRobotsIndex('index, follow');
    setFormSchemaMarkup('');
    setFormError('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (seo: SeoItem) => {
    setModalMode('edit');
    setEditId(seo.id);
    setFormPageName(seo.pageName || '');
    setFormPath(seo.path);
    setFormTitle(seo.title);
    setFormDescription(seo.description);
    setFormKeywords(seo.keywords || '');
    setFormCanonicalUrl(seo.canonicalUrl || '');
    setFormOgImage(seo.ogImage || '');
    setFormOgTitle(seo.ogTitle || '');
    setFormOgDescription(seo.ogDescription || '');
    setFormRobotsIndex(seo.robotsIndex || 'index, follow');
    setFormSchemaMarkup(seo.schemaMarkup || '');
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSaveSeoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setIsSavingSeo(true);

    try {
      const res = await fetch('/api/admin/seo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'save_seo',
          id: editId,
          pageName: formPageName,
          path: formPath,
          title: formTitle,
          description: formDescription,
          keywords: formKeywords,
          canonicalUrl: formCanonicalUrl,
          ogImage: formOgImage,
          ogTitle: formOgTitle,
          ogDescription: formOgDescription,
          robotsIndex: formRobotsIndex,
          schemaMarkup: formSchemaMarkup,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save SEO config');
      
      showToast('success', editId ? 'SEO override updated!' : 'SEO override created!');
      setIsModalOpen(false);
      fetchData();
    } catch (err: any) {
      setFormError(err.message || 'Error saving SEO metadata');
    } finally {
      setIsSavingSeo(false);
    }
  };

  const handleDeleteSeo = async (id: number) => {
    if (!confirm('Are you sure you want to delete this SEO configuration?')) return;
    try {
      const res = await fetch('/api/admin/seo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'delete_seo',
          id,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete SEO config');
      
      showToast('success', 'SEO configuration deleted');
      fetchData();
    } catch (err: any) {
      showToast('error', err.message || 'Error deleting SEO config');
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('category', 'seo');

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (res.ok && data.url) {
        setFormOgImage(data.url);
        showToast('success', 'Featured image uploaded successfully!');
      } else {
        showToast('error', data.error || 'Failed to upload photo.');
      }
    } catch {
      showToast('error', 'Error uploading image file.');
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, pageSize]);

  const filteredSeoList = seoList.filter(
    (seo) =>
      seo.pageName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      seo.path.toLowerCase().includes(searchQuery.toLowerCase()) ||
      seo.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalPages = Math.max(1, Math.ceil(filteredSeoList.length / pageSize));
  const paginatedSeoList = filteredSeoList.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  return (
    <div className="space-y-6 w-full">
      {/* Toast Alert */}
      {toast && (
        <div
          className={`fixed bottom-5 right-5 z-50 px-5 py-3 rounded-xl text-white font-semibold shadow-lg transition-all animate-bounce ${
            toast.type === 'success' ? 'bg-emerald-500' : 'bg-rose-500'
          }`}
        >
          {toast.message}
        </div>
      )}

      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-gray-200">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight flex items-center">
            <Settings className="w-8 h-8 mr-2 text-[#ec2c6c]" />
            SEO & Script Management
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Configure global headers/footers (GTM, Analytics) and setup on-page SEO meta overrides per path.
          </p>
        </div>
      </div>

      {/* Section Tabs */}
      <div className="flex border-b border-gray-200 space-x-4 bg-white p-2 rounded-2xl shadow-xs">
        <button
          onClick={() => setActiveTab('scripts')}
          className={`flex items-center space-x-1.5 px-4 py-2.5 rounded-xl font-bold text-sm transition-all cursor-pointer ${
            activeTab === 'scripts'
              ? 'bg-[#ec2c6c] text-white shadow-md'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
          }`}
        >
          <Code className="w-4 h-4" />
          <span>Global Settings</span>
        </button>
        <button
          onClick={() => setActiveTab('seo')}
          className={`flex items-center space-x-1.5 px-4 py-2.5 rounded-xl font-bold text-sm transition-all cursor-pointer ${
            activeTab === 'seo'
              ? 'bg-[#ec2c6c] text-white shadow-md'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
          }`}
        >
          <Globe className="w-4 h-4" />
          <span>On-Page SEO Overrides</span>
        </button>
      </div>

      {/* Tab Contents: Scripts */}
      {activeTab === 'scripts' && (
        <form onSubmit={handleSaveScripts} className="bg-white p-6 rounded-2xl shadow-md border border-gray-100 space-y-6">
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-gray-900 flex items-center">
              <Code className="w-5 h-5 mr-2 text-[#ec2c6c]" />
              Inject Global Setup & Tracking Settings
            </h2>
            <p className="text-xs text-gray-500 leading-relaxed">
              Use this section to inject scripts globally, such as Google Tag Manager, Google Analytics, Facebook Pixel, or custom structured schema markups. 
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block">
                Google Analytics Measurement ID (GA4 ID)
              </label>
              <input
                type="text"
                value={googleAnalyticsId}
                onChange={(e) => setGoogleAnalyticsId(e.target.value)}
                placeholder="e.g. G-7L8NBPJXYR"
                className="w-full text-xs p-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:border-[#ec2c6c] transition-colors font-mono"
              />
              <p className="text-[10px] text-gray-400 font-medium">Entering your GA4 Measurement ID (G-XXXXX) automatically injects the official Google gtag.js snippet in the website header.</p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block">
                Google Tag Manager ID (GTM Container ID)
              </label>
              <input
                type="text"
                value={googleTagManagerId}
                onChange={(e) => setGoogleTagManagerId(e.target.value)}
                placeholder="e.g. GTM-W2H4Z2L"
                className="w-full text-xs p-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:border-[#ec2c6c] transition-colors font-mono"
              />
              <p className="text-[10px] text-gray-400 font-medium">Entering your GTM ID (GTM-XXXXX) automatically injects the GTM script in the head and body iframe noscript fallback.</p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block">
                Header Scripts (&lt;head&gt; section)
              </label>
              <textarea
                value={headerScript}
                onChange={(e) => setHeaderScript(e.target.value)}
                placeholder="<!-- Enter custom CSS link tags, meta tags, verification scripts etc. -->"
                rows={10}
                className="w-full text-xs font-mono p-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:border-[#ec2c6c] transition-colors leading-relaxed"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block">
                Footer Scripts (End of &lt;body&gt; section)
              </label>
              <textarea
                value={footerScript}
                onChange={(e) => setFooterScript(e.target.value)}
                placeholder="<!-- Enter custom chat widgets, pixel tags, fallback tracking code -->"
                rows={10}
                className="w-full text-xs font-mono p-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:border-[#ec2c6c] transition-colors leading-relaxed"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block">
                Global Schema Markup (JSON-LD Structured Data)
              </label>
              <textarea
                value={globalSchema}
                onChange={(e) => setGlobalSchema(e.target.value)}
                placeholder='{ "@context": "https://schema.org", "@type": "Organization", "name": "Clinic By Choice", "url": "https://clinicbychoice.com" }'
                rows={6}
                className="w-full text-xs font-mono p-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:border-[#ec2c6c] transition-colors leading-relaxed"
              />
              <p className="text-[10px] text-gray-400 font-medium font-sans">Structured organization data markup. script blocks are auto-appended.</p>
            </div>
          </div>

          <div className="flex justify-end pt-2 border-t border-gray-100">
            <button
              type="submit"
              disabled={isSavingScripts}
              className="bg-[#ec2c6c] hover:bg-[#d61e56] text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow-md transition-all flex items-center space-x-2 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{isSavingScripts ? 'Saving Settings...' : 'Save Settings'}</span>
            </button>
          </div>
        </form>
      )}

      {/* Tab Contents: SEO Overrides */}
      {activeTab === 'seo' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 justify-between items-stretch sm:items-center">
            {/* Search */}
            <div className="bg-white px-4 py-2 border border-gray-200 rounded-xl flex items-center max-w-sm w-full shadow-xs">
              <Search className="w-4 h-4 text-gray-400 mr-2" />
              <input
                type="text"
                placeholder="Search page names, paths or meta titles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs bg-transparent focus:outline-none text-gray-800 placeholder-gray-400 font-medium"
              />
            </div>

            {/* Add New Button */}
            <button
              onClick={handleOpenCreateModal}
              className="bg-[#ec2c6c] hover:bg-[#d61e56] text-white px-5 py-2.5 rounded-xl font-bold text-xs shadow-md transition-all flex items-center justify-center space-x-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add SEO Override</span>
            </button>
          </div>

          {/* Table list */}
          <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100 text-[10px] font-black uppercase text-gray-500 tracking-wider">
                    <th className="px-6 py-4">Page Name</th>
                    <th className="px-6 py-4">URL Path</th>
                    <th className="px-6 py-4">Meta Title</th>
                    <th className="px-6 py-4">Canonical URL</th>
                    <th className="px-6 py-4">Robots</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-xs text-gray-700 font-medium">
                  {paginatedSeoList.length > 0 ? (
                    paginatedSeoList.map((seo) => (
                      <tr key={seo.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-4.5 font-extrabold text-gray-900 max-w-[150px] truncate">
                          {seo.pageName || 'Unnamed Page'}
                        </td>
                        <td className="px-6 py-4.5 font-bold text-[#ec2c6c] font-mono break-all max-w-[180px]">
                          {seo.path}
                        </td>
                        <td className="px-6 py-4.5 max-w-[150px] truncate" title={seo.title}>
                          {seo.title}
                        </td>
                        <td className="px-6 py-4.5 max-w-[150px] truncate font-mono text-[10px]" title={seo.canonicalUrl || ''}>
                          {seo.canonicalUrl || <span className="text-gray-400 font-normal italic font-sans">Default</span>}
                        </td>
                        <td className="px-6 py-4.5">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            seo.robotsIndex?.includes('noindex')
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          }`}>
                            {seo.robotsIndex || 'index, follow'}
                          </span>
                        </td>
                        <td className="px-6 py-4.5 text-right whitespace-nowrap">
                          <div className="inline-flex space-x-2">
                            <button
                              onClick={() => handleOpenEditModal(seo)}
                              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                              title="Edit"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteSeo(seo.id)}
                              className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="text-center py-12 text-gray-400 italic">
                        No SEO path configurations found matching your search.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {filteredSeoList.length > 0 && (
              <div className="px-6 py-4 bg-gray-50/80 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-600">
                <div className="flex items-center space-x-2">
                  <span>Showing</span>
                  <span className="font-bold text-gray-900">
                    {(currentPage - 1) * pageSize + 1}
                  </span>
                  <span>to</span>
                  <span className="font-bold text-gray-900">
                    {Math.min(currentPage * pageSize, filteredSeoList.length)}
                  </span>
                  <span>of</span>
                  <span className="font-bold text-gray-900">{filteredSeoList.length}</span>
                  <span>entries</span>

                  <span className="text-gray-300 mx-2">|</span>

                  <label className="text-gray-500 font-medium">Per page:</label>
                  <select
                    value={pageSize}
                    onChange={(e) => {
                      setPageSize(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="px-2.5 py-1 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-700 cursor-pointer focus:outline-none focus:border-[#ec2c6c]"
                  >
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                </div>

                <div className="flex items-center space-x-1.5">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-2xs"
                    title="Previous page"
                  >
                    <ChevronLeft className="w-4 h-4 text-gray-600" />
                  </button>

                  <div className="flex items-center space-x-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum = i + 1;
                      if (totalPages > 5) {
                        if (currentPage > 3 && currentPage < totalPages - 2) {
                          pageNum = currentPage - 2 + i;
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        }
                      }
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`w-8 h-8 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            currentPage === pageNum
                              ? 'bg-[#ec2c6c] text-white shadow-xs'
                              : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-100'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="p-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-2xs"
                    title="Next page"
                  >
                    <ChevronRight className="w-4 h-4 text-gray-600" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Save/Edit SEO Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden animate-fadeIn">
            <div className="bg-[#101828] text-white p-5 flex items-center justify-between">
              <h3 className="text-base font-bold flex items-center">
                <Globe className="w-5 h-5 mr-1.5 text-[#ec2c6c]" />
                {modalMode === 'create' ? 'Create SEO Path Override' : 'Edit SEO Override'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-white text-sm font-semibold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveSeoSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-100 text-rose-600 rounded-xl text-xs font-semibold">
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700 block">Page Name (e.g. About Us)</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. About Us Page, Homepage, Cancer Specialty"
                    value={formPageName}
                    onChange={(e) => setFormPageName(e.target.value)}
                    className="w-full text-xs p-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:border-[#ec2c6c] transition-colors font-medium text-gray-900 font-sans"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700 block">URL Path (must start with /)</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. /about-us or /hospitals/cancer-hospital/india"
                    value={formPath}
                    onChange={(e) => setFormPath(e.target.value)}
                    className="w-full text-xs p-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:border-[#ec2c6c] transition-colors font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700 block">Meta Title</label>
                  <input
                    type="text"
                    required
                    placeholder="Recommended 50-60 characters"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    className="w-full text-xs p-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:border-[#ec2c6c] transition-colors font-medium"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700 block">Meta Description</label>
                  <textarea
                    required
                    rows={3}
                    placeholder="Recommended 120-160 characters describing the page content."
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    className="w-full text-xs p-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:border-[#ec2c6c] transition-colors leading-relaxed font-medium"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700 block">Meta Keywords (comma separated)</label>
                  <input
                    type="text"
                    placeholder="e.g. cancer hospital, best oncology centers, ludhiana"
                    value={formKeywords}
                    onChange={(e) => setFormKeywords(e.target.value)}
                    className="w-full text-xs p-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:border-[#ec2c6c] transition-colors font-medium"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700 block">Canonical URL (optional)</label>
                  <input
                    type="url"
                    placeholder="e.g. https://clinicbychoice.com/about-us"
                    value={formCanonicalUrl}
                    onChange={(e) => setFormCanonicalUrl(e.target.value)}
                    className="w-full text-xs p-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:border-[#ec2c6c] transition-colors font-medium"
                  />
                </div>

                {/* Open Graph Social Sharing Overrides */}
                <div className="border-t border-slate-100 pt-3 space-y-3">
                  <span className="text-xs font-black uppercase text-gray-400 tracking-wider block">Social Sharing (Open Graph)</span>
                  
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-700 block">Open Graph / Facebook Title (optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. Clinic By Choice - Specialty Care"
                      value={formOgTitle}
                      onChange={(e) => setFormOgTitle(e.target.value)}
                      className="w-full text-xs p-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:border-[#ec2c6c] transition-colors font-medium"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-700 block">Open Graph / Facebook Description (optional)</label>
                    <textarea
                      rows={2}
                      placeholder="Custom descriptive text for social sharing card."
                      value={formOgDescription}
                      onChange={(e) => setFormOgDescription(e.target.value)}
                      className="w-full text-xs p-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:border-[#ec2c6c] transition-colors leading-relaxed font-medium"
                    />
                  </div>

                  {/* Featured / OG Image Input + Upload option */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-700 block">Social Featured Image / OG Image URL (optional)</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="e.g. https://clinicbychoice.com/uploads/seo/featured.png"
                        value={formOgImage}
                        onChange={(e) => setFormOgImage(e.target.value)}
                        className="w-full text-xs p-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:border-[#ec2c6c] transition-colors font-medium flex-1"
                      />
                      <label className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs px-4 rounded-xl flex items-center justify-center space-x-1.5 cursor-pointer font-bold border border-slate-200 select-none">
                        {isUploading ? (
                          <Loader2 className="w-4 h-4 animate-spin text-[#ec2c6c]" />
                        ) : (
                          <Upload className="w-4 h-4" />
                        )}
                        <span>Upload</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          disabled={isUploading}
                          className="hidden"
                        />
                      </label>
                    </div>
                    {formOgImage && (
                      <div className="mt-1 bg-slate-50 p-2 rounded-lg border border-slate-100 flex items-center space-x-2">
                        <img src={formOgImage} alt="SEO Preview" className="w-8 h-8 rounded object-cover" />
                        <span className="text-[10px] text-gray-500 truncate font-mono max-w-[300px]">{formOgImage}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-1.5 border-t border-slate-100 pt-3">
                  <label className="text-xs font-bold text-gray-700 block">Robots Index Status</label>
                  <select
                    value={formRobotsIndex}
                    onChange={(e) => setFormRobotsIndex(e.target.value)}
                    className="w-full text-xs p-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:border-[#ec2c6c] transition-colors font-bold text-gray-800"
                  >
                    <option value="index, follow">Index, Follow (Default)</option>
                    <option value="noindex, follow">Noindex, Follow</option>
                    <option value="index, nofollow">Index, Nofollow</option>
                    <option value="noindex, nofollow">Noindex, Nofollow</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700 block">Page Schema Markup (JSON-LD Structured Data, optional)</label>
                  <textarea
                    rows={4}
                    placeholder='e.g. { "@context": "https://schema.org", "@type": "FAQPage", ... }'
                    value={formSchemaMarkup}
                    onChange={(e) => setFormSchemaMarkup(e.target.value)}
                    className="w-full text-xs p-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:border-[#ec2c6c] transition-colors leading-relaxed font-mono"
                  />
                  <p className="text-[9px] text-gray-400 font-medium font-sans">Add page-specific structured data script context.</p>
                </div>
              </div>

              <div className="flex space-x-3 pt-3 border-t border-gray-100 justify-end">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-gray-200 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingSeo}
                  className="bg-[#ec2c6c] hover:bg-[#d61e56] text-white px-5 py-2 rounded-xl font-bold text-xs shadow-md transition-all flex items-center space-x-1 cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isSavingSeo ? 'Saving...' : 'Save Configuration'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
