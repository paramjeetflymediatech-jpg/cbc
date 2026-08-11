'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Stethoscope, ChevronRight, Search, ChevronLeft } from 'lucide-react';

interface ServiceItem {
  id: number;
  name: string;
  slug: string;
  category?: string;
  shortDescription?: string;
  description?: string;
}

export default function ServicesPage() {
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 9;

  useEffect(() => {
    fetch('/api/services')
      .then((r) => r.json())
      .then((data) => {
        if (data.services) setServices(data.services);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Filter services by search query
  const filteredServices = services.filter((svc) => {
    const q = searchQuery.toLowerCase().trim();
    return (
      !q ||
      svc.name.toLowerCase().includes(q) ||
      (svc.category && svc.category.toLowerCase().includes(q)) ||
      (svc.shortDescription && svc.shortDescription.toLowerCase().includes(q))
    );
  });

  // Calculate Pagination
  const totalPages = Math.ceil(filteredServices.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedServices = filteredServices.slice(startIndex, startIndex + itemsPerPage);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      window.scrollTo({ top: 280, behavior: 'smooth' });
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-gray-900">
      <Header />

      {/* Hero Banner */}
      <div className="bg-[#101828] text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
          <span className="text-xs font-bold uppercase tracking-wider text-[#ec2c6c] bg-pink-500/10 px-4 py-1.5 rounded-full border border-pink-500/20">
            {services.length} Accredited Medical Specialties
          </span>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight">Explore Medical Services</h1>
          <p className="text-gray-300 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
            Select any specialized medical discipline below to view accredited hospitals, expert doctors, and transparent treatment packages across India.
          </p>

          {/* Search Box */}
          <div className="max-w-xl mx-auto pt-2">
            <div className="relative">
              <Search className="w-5 h-5 text-gray-400 absolute left-4 top-3.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={handleSearchChange}
                placeholder="Search specialty by name (e.g. Cardiology, Orthopedic, IVF)..."
                className="w-full pl-12 pr-4 py-3 bg-white text-gray-900 rounded-full text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#fd1d74] shadow-lg"
              />
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex-1 w-full space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 pb-4">
          <h2 className="text-xl font-extrabold text-gray-900">
            Available Medical Specialties ({filteredServices.length})
          </h2>

          <div className="text-xs font-medium text-gray-500">
            Showing <strong className="text-gray-900">{filteredServices.length > 0 ? startIndex + 1 : 0}</strong> to{' '}
            <strong className="text-gray-900">{Math.min(startIndex + itemsPerPage, filteredServices.length)}</strong> of{' '}
            <strong className="text-gray-900">{filteredServices.length}</strong> specialties
          </div>
        </div>

        {/* Services Cards Grid */}
        {loading ? (
          <div className="text-center py-20 text-gray-500 text-sm">Loading medical services...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {paginatedServices.map((svc) => (
              <Link
                key={svc.id}
                href={`/services/${svc.slug}`}
                className="bg-white p-7 rounded-3xl border border-gray-100 shadow-sm flex flex-col justify-between group hover:border-[#fd1d74] transition-all hover:shadow-xl relative overflow-hidden"
              >
                <div className="space-y-4">
                  <div className="w-14 h-14 rounded-2xl bg-pink-50 flex items-center justify-center text-[#fd1d74] group-hover:bg-[#fd1d74] group-hover:text-white transition-colors duration-300 shadow-xs">
                    <Stethoscope className="w-7 h-7" />
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#b02151] bg-pink-50 px-2.5 py-0.5 rounded-full border border-pink-100">
                      {svc.category || 'Specialty Care'}
                    </span>
                    <h3 className="text-xl font-bold text-gray-900 group-hover:text-[#fd1d74] transition-colors pt-1">
                      {svc.name}
                    </h3>
                  </div>

                  <p className="text-xs text-gray-600 leading-relaxed line-clamp-3 font-medium">
                    {svc.shortDescription || svc.description || 'Find specialized treatments and accredited hospital centers.'}
                  </p>
                </div>

                <div className="pt-6 border-t border-gray-100 flex items-center justify-between text-xs font-extrabold text-[#b02151] group-hover:translate-x-1 transition-transform mt-4">
                  <span>View Hospital Listings</span>
                  <ChevronRight className="w-4 h-4" />
                </div>
              </Link>
            ))}
          </div>
        )}

        {filteredServices.length === 0 && !loading && (
          <div className="text-center py-16 bg-white rounded-3xl border border-gray-100 text-gray-500 text-sm">
            No medical services found matching &quot;{searchQuery}&quot;.
          </div>
        )}

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-gray-200">
            <div className="text-xs font-bold text-gray-500">
              Page {currentPage} of {totalPages}
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-4 py-2 bg-white border border-gray-200 text-xs font-bold text-gray-700 rounded-xl hover:bg-gray-50 disabled:opacity-40 flex items-center space-x-1 shadow-xs"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Previous</span>
              </button>

              <div className="flex items-center space-x-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                  <button
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum)}
                    className={`w-9 h-9 rounded-xl text-xs font-extrabold transition-all ${
                      currentPage === pageNum
                        ? 'bg-[#b02151] text-white shadow-md'
                        : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                    }`}
                  >
                    {pageNum}
                  </button>
                ))}
              </div>

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-4 py-2 bg-white border border-gray-200 text-xs font-bold text-gray-700 rounded-xl hover:bg-gray-50 disabled:opacity-40 flex items-center space-x-1 shadow-xs"
              >
                <span>Next</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
