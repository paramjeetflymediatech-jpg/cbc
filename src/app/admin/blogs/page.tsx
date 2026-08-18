'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import RichTextEditor from '@/components/ui/RichTextEditor';
import {
  FileText,
  Plus,
  Search,
  CheckCircle2,
  Loader2,
  Edit3,
  Trash2,
  Eye,
  X,
  Upload,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
} from 'lucide-react';

interface BlogPostItem {
  id: number;
  title: string;
  slug: string;
  excerpt?: string | null;
  content: string;
  image?: string | null;
  category?: string | null;
  author?: string | null;
  readTime?: string | null;
  tags?: string | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
  seoKeywords?: string | null;
  canonicalUrl?: string | null;
  ogImage?: string | null;
  ogTitle?: string | null;
  ogDescription?: string | null;
  robotsIndex?: string | null;
  schemaMarkup?: string | null;
  status: 'DRAFT' | 'PUBLISHED';
  publishedAt?: string | null;
  views: number;
  createdAt: string;
}

export default function AdminBlogsPage() {
  const [blogs, setBlogs] = useState<BlogPostItem[]>([]);
  const [stats, setStats] = useState({ total: 0, published: 0, drafts: 0, totalViews: 0 });
  const [loading, setLoading] = useState(true);

  // Search & Filter & Pagination state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBlogId, setEditingBlogId] = useState<number | null>(null);
  const [deleteBlogId, setDeleteBlogId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Form states
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [content, setContent] = useState('');
  const [image, setImage] = useState('');
  const [category, setCategory] = useState('Orthopedics');
  const [author, setAuthor] = useState('Clinic By Choice Editorial Team');
  const [readTime, setReadTime] = useState('5 min read');
  const [tags, setTags] = useState('');
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDescription, setSeoDescription] = useState('');
  const [seoKeywords, setSeoKeywords] = useState('');
  const [canonicalUrl, setCanonicalUrl] = useState('');
  const [ogImage, setOgImage] = useState('');
  const [ogTitle, setOgTitle] = useState('');
  const [ogDescription, setOgDescription] = useState('');
  const [robotsIndex, setRobotsIndex] = useState('index, follow');
  const [schemaMarkup, setSchemaMarkup] = useState('');
  const [status, setStatus] = useState<'PUBLISHED' | 'DRAFT'>('PUBLISHED');

  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadingOg, setUploadingOg] = useState(false);
  const [message, setMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const fetchBlogs = () => {
    fetch('/api/admin/blogs')
      .then((res) => res.json())
      .then((data) => {
        if (data.blogs) setBlogs(data.blogs);
        if (data.stats) setStats(data.stats);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchBlogs();
  }, []);

  const openCreateModal = () => {
    setEditingBlogId(null);
    setTitle('');
    setSlug('');
    setExcerpt('');
    setContent('');
    setImage('');
    setCategory('Orthopedics');
    setAuthor('Clinic By Choice Editorial Team');
    setReadTime('5 min read');
    setTags('');
    setSeoTitle('');
    setSeoDescription('');
    setSeoKeywords('');
    setCanonicalUrl('');
    setOgImage('');
    setOgTitle('');
    setOgDescription('');
    setRobotsIndex('index, follow');
    setSchemaMarkup('');
    setStatus('PUBLISHED');
    setIsModalOpen(true);
  };

  const openEditModal = (blog: BlogPostItem) => {
    setEditingBlogId(blog.id);
    setTitle(blog.title || '');
    setSlug(blog.slug || '');
    setExcerpt(blog.excerpt || '');
    setContent(blog.content || '');
    setImage(blog.image || '');
    setCategory(blog.category || 'General Health');
    setAuthor(blog.author || 'Clinic By Choice Editorial Team');
    setReadTime(blog.readTime || '5 min read');
    setTags(blog.tags || '');
    setSeoTitle(blog.seoTitle || '');
    setSeoDescription(blog.seoDescription || '');
    setSeoKeywords(blog.seoKeywords || '');
    setCanonicalUrl(blog.canonicalUrl || '');
    setOgImage(blog.ogImage || '');
    setOgTitle(blog.ogTitle || '');
    setOgDescription(blog.ogDescription || '');
    setRobotsIndex(blog.robotsIndex || 'index, follow');
    setSchemaMarkup(blog.schemaMarkup || '');
    setStatus(blog.status || 'PUBLISHED');
    setIsModalOpen(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('category', 'blogs');

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (res.ok && data.url) {
        setImage(data.url);
      } else {
        alert(data.error || 'Failed to upload image');
      }
    } catch {
      alert('Error uploading image file');
    } finally {
      setUploading(false);
    }
  };

  const handleOgImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingOg(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('category', 'blogs');

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (res.ok && data.url) {
        setOgImage(data.url);
      } else {
        alert(data.error || 'Failed to upload image');
      }
    } catch {
      alert('Error uploading image file');
    } finally {
      setUploadingOg(false);
      e.target.value = '';
    }
  };

  const handleSaveBlog = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setErrorMessage('');
    setSaving(true);

    const payload = {
      title,
      slug,
      excerpt,
      content,
      image,
      category,
      author,
      readTime,
      tags,
      seoTitle,
      seoDescription,
      seoKeywords,
      canonicalUrl,
      ogImage,
      ogTitle,
      ogDescription,
      robotsIndex,
      schemaMarkup,
      status,
    };

    try {
      const isEdit = editingBlogId !== null;
      const url = isEdit ? `/api/admin/blogs/${editingBlogId}` : '/api/admin/blogs';
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage(isEdit ? 'Blog post updated successfully.' : 'New blog post created successfully.');
        setIsModalOpen(false);
        fetchBlogs();
      } else {
        setErrorMessage(data.error || 'Failed to save blog post');
      }
    } catch {
      setErrorMessage('An unexpected error occurred while saving.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteBlog = async () => {
    if (!deleteBlogId) return;
    setDeleting(true);

    try {
      const res = await fetch(`/api/admin/blogs/${deleteBlogId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setMessage('Blog post deleted successfully.');
        setDeleteBlogId(null);
        fetchBlogs();
      }
    } catch {
      alert('Failed to delete blog post');
    } finally {
      setDeleting(false);
    }
  };

  // Filtering
  const filteredBlogs = blogs.filter((b) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      b.title.toLowerCase().includes(q) ||
      (b.category && b.category.toLowerCase().includes(q)) ||
      (b.author && b.author.toLowerCase().includes(q));

    const matchesStatus = statusFilter === 'ALL' || b.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Pagination
  const totalPages = Math.ceil(filteredBlogs.length / pageSize) || 1;
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * pageSize;
  const paginatedBlogs = filteredBlogs.slice(startIndex, startIndex + pageSize);

  return (
    <div className="space-y-8 w-full">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 flex items-center gap-2.5">
            <FileText className="w-7 h-7 text-[#ec2c6c]" />
            <span>Blog Management</span>
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Publish, edit, draft and manage medical & health articles for Clinic By Choice.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="cbc-btn-primary text-sm shadow-md flex items-center space-x-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Write New Post</span>
        </button>
      </div>

      {/* Message Notifications */}
      {message && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm rounded-xl flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <span>{message}</span>
          </div>
          <button onClick={() => setMessage('')} className="text-emerald-600 hover:text-emerald-800">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Stats Widgets */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="cbc-card p-5 border border-gray-100 space-y-1">
          <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total Articles</span>
          <div className="text-2xl font-black text-gray-900">{stats.total}</div>
        </div>

        <div className="cbc-card p-5 border border-gray-100 space-y-1">
          <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Published</span>
          <div className="text-2xl font-black text-emerald-700">{stats.published}</div>
        </div>

        <div className="cbc-card p-5 border border-gray-100 space-y-1">
          <span className="text-xs font-bold text-amber-600 uppercase tracking-wider">Drafts</span>
          <div className="text-2xl font-black text-amber-700">{stats.drafts}</div>
        </div>

        <div className="cbc-card p-5 border border-gray-100 space-y-1">
          <span className="text-xs font-bold text-[#ec2c6c] uppercase tracking-wider">Total Readers / Views</span>
          <div className="text-2xl font-black text-[#ec2c6c]">{stats.totalViews.toLocaleString()}</div>
        </div>
      </div>

      {/* Search & Status Filters Bar */}
      <div className="cbc-card p-4 sm:p-6 border border-gray-100 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search post title, category or author..."
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:border-[#ec2c6c]"
            />
          </div>

          <div className="flex items-center space-x-2 overflow-x-auto pb-1 md:pb-0">
            {['ALL', 'PUBLISHED', 'DRAFT'].map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => {
                  setStatusFilter(st);
                  setCurrentPage(1);
                }}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors whitespace-nowrap ${
                  statusFilter === st
                    ? 'bg-[#101828] text-white shadow-xs'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {st === 'ALL' ? 'All Posts' : st === 'PUBLISHED' ? 'Published' : 'Drafts'}
              </button>
            ))}
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto pt-2">
          <table className="w-full text-left text-sm text-gray-700">
            <thead className="bg-gray-50 text-xs font-bold uppercase text-gray-500 border-b border-gray-100">
              <tr>
                <th className="p-4">Article</th>
                <th className="p-4">Category</th>
                <th className="p-4">Author</th>
                <th className="p-4">Status</th>
                <th className="p-4">Views</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginatedBlogs.map((b) => (
                <tr key={b.id} className="hover:bg-gray-50/60 transition-colors">
                  <td className="p-4 max-w-md">
                    <div className="flex items-start space-x-3">
                      <div className="relative w-14 h-14 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0 border border-gray-200">
                        {b.image ? (
                          <Image src={b.image} alt={b.title} fill className="object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            <FileText className="w-6 h-6" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-bold text-gray-900 text-sm line-clamp-1">{b.title}</h4>
                        <p className="text-xs text-gray-500 font-mono mt-0.5 truncate">/blogs/{b.slug}</p>
                        <span className="text-[11px] text-gray-400 mt-1 block">
                          {b.publishedAt
                            ? `Published ${new Date(b.publishedAt).toLocaleDateString()}`
                            : `Created ${new Date(b.createdAt).toLocaleDateString()}`}
                        </span>
                      </div>
                    </div>
                  </td>

                  <td className="p-4">
                    <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-pink-50 text-[#ec2c6c] border border-pink-100">
                      {b.category || 'General Health'}
                    </span>
                  </td>

                  <td className="p-4 text-xs font-semibold text-gray-700">{b.author}</td>

                  <td className="p-4">
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-extrabold ${
                        b.status === 'PUBLISHED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {b.status}
                    </span>
                  </td>

                  <td className="p-4 text-xs font-bold text-gray-700">{b.views || 0}</td>

                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <Link
                        href={`/blogs/${b.slug}`}
                        target="_blank"
                        className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Preview Public Page"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>

                      <button
                        type="button"
                        onClick={() => openEditModal(b)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Edit Article"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => setDeleteBlogId(b.id)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete Article"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredBlogs.length === 0 && !loading && (
            <div className="text-center py-12 text-gray-500 text-sm">
              No blog posts found matching your criteria.
            </div>
          )}
        </div>

        {/* Pagination Controls */}
        {filteredBlogs.length > 0 && (
          <div className="p-4 bg-gray-50 border border-gray-100 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-600 mt-4">
            <div className="flex items-center space-x-2">
              <span>Articles per page:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="px-2 py-1 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-800 focus:outline-none cursor-pointer"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
              <span className="text-gray-400">|</span>
              <span>
                Showing <strong>{Math.min(startIndex + 1, filteredBlogs.length)}</strong> to{' '}
                <strong>{Math.min(startIndex + pageSize, filteredBlogs.length)}</strong> of <strong>{filteredBlogs.length}</strong> posts
              </span>
            </div>

            <div className="flex items-center space-x-1">
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={safeCurrentPage === 1}
                className="p-1.5 rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                title="Previous Page"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <span className="px-3 py-1 font-bold text-gray-800">
                Page {safeCurrentPage} of {totalPages}
              </span>

              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={safeCurrentPage >= totalPages}
                className="p-1.5 rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                title="Next Page"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create / Edit Blog Post Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl animate-fadeIn">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-[#101828] text-white flex items-center justify-between">
              <h3 className="font-bold text-lg flex items-center space-x-2">
                <FileText className="w-5 h-5 text-[#ec2c6c]" />
                <span>{editingBlogId ? 'Edit Blog Post' : 'Write New Blog Post'}</span>
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form Content */}
            <form onSubmit={handleSaveBlog} className="p-6 overflow-y-auto space-y-5 flex-1 bg-white text-gray-900">
              {errorMessage && (
                <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold uppercase text-gray-700 mb-1">
                    Article Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. 10 Health Tips for Knee Joint Longevity"
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold text-gray-900 focus:outline-none focus:border-[#ec2c6c]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-gray-700 mb-1">
                    Category
                  </label>
                  <input
                    type="text"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="e.g. Orthopedics, Wellness..."
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:border-[#ec2c6c]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-700 mb-1">
                    Slug (URL path)
                  </label>
                  <input
                    type="text"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder="Leave empty to auto-generate"
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-mono text-gray-800 focus:outline-none focus:border-[#ec2c6c]"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold uppercase text-gray-700 mb-1">
                    Author Name
                  </label>
                  <input
                    type="text"
                    value={author}
                    onChange={(e) => setAuthor(e.target.value)}
                    placeholder="e.g. Dr. S. S. Gill"
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:border-[#ec2c6c]"
                  />
                </div>
              </div>

              {/* Featured Image & Upload */}
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase text-gray-700">
                  Featured Cover Image URL
                </label>
                <div className="flex flex-col sm:flex-row gap-3 items-center">
                  <input
                    type="text"
                    value={image}
                    onChange={(e) => setImage(e.target.value)}
                    placeholder="https://... or click upload"
                    className="flex-1 w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-mono text-gray-800 focus:outline-none focus:border-[#ec2c6c]"
                  />

                  <label className="cursor-pointer bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-2.5 rounded-xl text-xs font-bold flex items-center space-x-2 flex-shrink-0 transition-colors">
                    {uploading ? <Loader2 className="w-4 h-4 animate-spin text-[#ec2c6c]" /> : <Upload className="w-4 h-4 text-[#ec2c6c]" />}
                    <span>{uploading ? 'Uploading...' : 'Upload Image'}</span>
                    <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                  </label>
                </div>

                {image && (
                  <div className="relative h-28 w-48 rounded-xl overflow-hidden border border-gray-200 mt-2">
                    <img src={image} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>

              {/* Excerpt */}
              <div>
                <label className="block text-xs font-bold uppercase text-gray-700 mb-1">
                  Article Excerpt / Short Summary
                </label>
                <textarea
                  rows={2}
                  value={excerpt}
                  onChange={(e) => setExcerpt(e.target.value)}
                  placeholder="Brief summary that appears on blog cards and search results..."
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-800 focus:outline-none focus:border-[#ec2c6c]"
                />
              </div>

              {/* Article Content */}
              <div>
                <label className="block text-xs font-bold uppercase text-gray-700 mb-1">
                  Full Article Body (HTML / Formatted Text) *
                </label>
                <RichTextEditor value={content} onChange={setContent} placeholder="Write or format your blog post content..." />
              </div>

              {/* Tags & Status */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-700 mb-1">
                    Tags (Comma separated)
                  </label>
                  <input
                    type="text"
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    placeholder="Orthopedics, Joint Health, Surgery"
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:border-[#ec2c6c]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-gray-700 mb-1">
                    Publishing Status
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as 'PUBLISHED' | 'DRAFT')}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-900 focus:outline-none focus:border-[#ec2c6c]"
                  >
                    <option value="PUBLISHED">PUBLISHED (Live on Website)</option>
                    <option value="DRAFT">DRAFT (Hidden from Public)</option>
                  </select>
                </div>
              </div>

              {/* SEO Meta Fields */}
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl space-y-3">
                <h4 className="text-xs font-bold text-[#ec2c6c] uppercase tracking-wider">SEO Optimization (Optional)</h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">SEO Title Tag</label>
                    <input
                      type="text"
                      value={seoTitle}
                      onChange={(e) => setSeoTitle(e.target.value)}
                      placeholder="Custom page title for search engines..."
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">Meta Keywords</label>
                    <input
                      type="text"
                      value={seoKeywords}
                      onChange={(e) => setSeoKeywords(e.target.value)}
                      placeholder="e.g. medical blog, oncology article, clinicbychoice"
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">SEO Meta Description</label>
                  <textarea
                    rows={2}
                    value={seoDescription}
                    onChange={(e) => setSeoDescription(e.target.value)}
                    placeholder="Custom meta description snippet..."
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs leading-relaxed"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">Canonical URL</label>
                    <input
                      type="url"
                      value={canonicalUrl}
                      onChange={(e) => setCanonicalUrl(e.target.value)}
                      placeholder="e.g. https://clinicbychoice.com/blogs/..."
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">Robots Status</label>
                    <select
                      value={robotsIndex}
                      onChange={(e) => setRobotsIndex(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-800"
                    >
                      <option value="index, follow">Index, Follow (Default)</option>
                      <option value="noindex, follow">Noindex, Follow</option>
                      <option value="index, nofollow">Index, Nofollow</option>
                      <option value="noindex, nofollow">Noindex, Nofollow</option>
                    </select>
                  </div>
                </div>

                {/* Social Open Graph Overrides */}
                <div className="border-t border-gray-200 pt-3 space-y-3">
                  <span className="text-[11px] font-black uppercase text-gray-400 tracking-wider block">Social Sharing (Open Graph)</span>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">OG Title</label>
                      <input
                        type="text"
                        value={ogTitle}
                        onChange={(e) => setOgTitle(e.target.value)}
                        placeholder="Custom title for Facebook/LinkedIn shares..."
                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">OG Image URL</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={ogImage}
                          onChange={(e) => setOgImage(e.target.value)}
                          placeholder="Custom image URL for shares..."
                          className="flex-1 w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs font-mono"
                        />
                        <label className="cursor-pointer bg-gray-100 hover:bg-gray-200 text-gray-800 px-3 rounded-lg text-[10px] font-bold flex items-center space-x-1.5 transition-colors border border-gray-200 select-none flex-shrink-0">
                          {uploadingOg ? <Loader2 className="w-3.5 h-3.5 animate-spin text-[#ec2c6c]" /> : <Upload className="w-3.5 h-3.5 text-[#ec2c6c]" />}
                          <span>Upload</span>
                          <input type="file" accept="image/*" onChange={handleOgImageUpload} className="hidden" />
                        </label>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">OG Description</label>
                    <textarea
                      rows={2}
                      value={ogDescription}
                      onChange={(e) => setOgDescription(e.target.value)}
                      placeholder="Custom description for shares..."
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs leading-relaxed"
                    />
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-3">
                  <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">Article Schema Markup (JSON-LD)</label>
                  <textarea
                    rows={3}
                    value={schemaMarkup}
                    onChange={(e) => setSchemaMarkup(e.target.value)}
                    placeholder='e.g. { "@context": "https://schema.org", "@type": "NewsArticle", ... }'
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs font-mono leading-relaxed"
                  />
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-2 flex items-center justify-end space-x-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="cbc-btn-primary text-xs shadow-md flex items-center space-x-2"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  <span>{editingBlogId ? 'Update Post' : 'Publish / Save Post'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteBlogId && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-lg font-bold text-gray-900">Delete Blog Post?</h3>
              <p className="text-xs text-gray-500">
                Are you sure you want to permanently delete this blog post? This action cannot be undone.
              </p>
            </div>

            <div className="flex items-center space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteBlogId(null)}
                className="flex-1 py-2.5 bg-gray-100 text-gray-700 text-xs font-bold rounded-xl hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteBlog}
                disabled={deleting}
                className="flex-1 py-2.5 bg-red-600 text-white text-xs font-bold rounded-xl hover:bg-red-700 flex items-center justify-center space-x-2"
              >
                {deleting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Delete Post</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
