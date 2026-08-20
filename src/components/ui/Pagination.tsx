'use client';

import React from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  basePath: string;
  searchParams?: Record<string, string | undefined>;
}

export default function Pagination({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  basePath,
  searchParams = {},
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const createPageUrl = (pageNumber: number) => {
    const params = new URLSearchParams();
    Object.entries(searchParams).forEach(([key, val]) => {
      if (val && key !== 'page') {
        params.set(key, val);
      }
    });
    if (pageNumber > 1) {
      params.set('page', String(pageNumber));
    }
    const qs = params.toString();
    return `${basePath}${qs ? `?${qs}` : ''}`;
  };

  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  // Generate page numbers with ellipses
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const delta = 2;

    for (let i = 1; i <= totalPages; i++) {
      if (
        i === 1 ||
        i === totalPages ||
        (i >= currentPage - delta && i <= currentPage + delta)
      ) {
        pages.push(i);
      } else if (pages[pages.length - 1] !== '...') {
        pages.push('...');
      }
    }
    return pages;
  };

  return (
    <div className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-100 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4 mt-6">
      <div className="text-xs text-gray-500 font-medium">
        Showing <span className="font-extrabold text-gray-900">{startItem}</span> to{' '}
        <span className="font-extrabold text-gray-900">{endItem}</span> of{' '}
        <span className="font-extrabold text-[#ec2c6c]">{totalItems}</span> hospitals
      </div>

      <div className="flex items-center space-x-1.5">
        {/* Previous Button */}
        {currentPage > 1 ? (
          <Link
            href={createPageUrl(currentPage - 1)}
            className="inline-flex items-center space-x-1 px-3 py-2 rounded-xl text-xs font-bold text-gray-700 bg-gray-50 hover:bg-pink-50 hover:text-[#ec2c6c] border border-gray-200 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Prev</span>
          </Link>
        ) : (
          <span className="inline-flex items-center space-x-1 px-3 py-2 rounded-xl text-xs font-bold text-gray-300 bg-gray-50/50 border border-gray-100 cursor-not-allowed">
            <ChevronLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Prev</span>
          </span>
        )}

        {/* Page Number Pills */}
        <div className="flex items-center space-x-1">
          {getPageNumbers().map((page, index) => {
            if (page === '...') {
              return (
                <span key={`ellipsis-${index}`} className="px-2 py-1 text-gray-400 font-bold text-xs">
                  ...
                </span>
              );
            }

            const pageNum = page as number;
            const isActive = pageNum === currentPage;

            return (
              <Link
                key={pageNum}
                href={createPageUrl(pageNum)}
                className={`w-9 h-9 flex items-center justify-center rounded-xl text-xs font-extrabold transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-pink-600 to-[#b02151] text-white shadow-md shadow-pink-500/20'
                    : 'text-gray-700 bg-gray-50 hover:bg-pink-50 hover:text-[#ec2c6c] border border-gray-200'
                }`}
              >
                {pageNum}
              </Link>
            );
          })}
        </div>

        {/* Next Button */}
        {currentPage < totalPages ? (
          <Link
            href={createPageUrl(currentPage + 1)}
            className="inline-flex items-center space-x-1 px-3 py-2 rounded-xl text-xs font-bold text-gray-700 bg-gray-50 hover:bg-pink-50 hover:text-[#ec2c6c] border border-gray-200 transition-colors"
          >
            <span className="hidden sm:inline">Next</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        ) : (
          <span className="inline-flex items-center space-x-1 px-3 py-2 rounded-xl text-xs font-bold text-gray-300 bg-gray-50/50 border border-gray-100 cursor-not-allowed">
            <span className="hidden sm:inline">Next</span>
            <ChevronRight className="w-4 h-4" />
          </span>
        )}
      </div>
    </div>
  );
}
