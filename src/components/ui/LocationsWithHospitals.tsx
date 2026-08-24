'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { MapPin, Search, X, Building2 } from 'lucide-react';

interface CityOption {
  cityName: string;
  citySlug: string;
  count: number;
}

interface LocationsWithHospitalsProps {
  serviceSlug: string;
  currentCitySlug?: string;
  totalAllIndiaHospitals: number;
  availableCities: CityOption[];
}

export default function LocationsWithHospitals({
  serviceSlug,
  currentCitySlug = '',
  totalAllIndiaHospitals,
  availableCities = [],
}: LocationsWithHospitalsProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredCities = useMemo(() => {
    if (!searchQuery.trim()) return availableCities;
    const q = searchQuery.toLowerCase().trim();
    return availableCities.filter((c) => c.cityName.toLowerCase().includes(q));
  }, [availableCities, searchQuery]);

  const isAllIndiaCurrent = !currentCitySlug || currentCitySlug === 'india';
  const showAllIndia =
    !searchQuery.trim() ||
    'all india'.includes(searchQuery.toLowerCase().trim()) ||
    'india'.includes(searchQuery.toLowerCase().trim());

  return (
    <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-xs space-y-4">
      {/* Header */}
      <div className="border-b border-gray-100 pb-3">
        <div className="flex items-center space-x-1.5 text-[11px] font-extrabold uppercase tracking-wider text-[#ec2c6c]">
          <MapPin className="w-3.5 h-3.5" />
          <span>Locations With Hospitals</span>
        </div>
        <div className="flex items-center justify-between mt-0.5">
          {searchQuery.trim() && (
            <span className="text-[11px] font-bold text-[#ec2c6c] bg-pink-50 px-2 py-0.5 rounded-full">
              {filteredCities.length} found
            </span>
          )}
        </div>
      </div>

      {/* City Search Bar */}
      <div className="relative">
        <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-2.5" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search city name (e.g. Mumbai, Delhi)..."
          className="w-full pl-8 pr-7 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-800 placeholder:text-gray-400 focus:bg-white focus:ring-2 focus:ring-[#ec2c6c] focus:outline-none transition-all"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-2.5 top-2 text-gray-400 hover:text-gray-600 cursor-pointer"
            aria-label="Clear city search"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Cities Scrollable List */}
      <div className="space-y-1.5 max-h-[380px] overflow-y-auto pr-1 [scrollbar-width:thin] [scrollbar-color:#e5e7eb_transparent]">
        {/* All India Option */}
        {showAllIndia && (
          <Link
            href={`/hospitals/${serviceSlug}/india`}
            className={`flex items-center justify-between p-2.5 rounded-xl text-xs font-bold border transition-all ${
              isAllIndiaCurrent
                ? 'bg-[#ec2c6c] text-white border-[#ec2c6c] shadow-xs'
                : 'bg-white hover:bg-pink-50/50 hover:border-pink-200 text-gray-800 border-gray-100 group'
            }`}
          >
            <span className="flex items-center space-x-2">
              <span>🇮🇳 All India</span>
            </span>
            <span
              className={`text-[11px] px-2 py-0.5 rounded-full font-bold transition-colors ${
                isAllIndiaCurrent
                  ? 'bg-white/20 text-white'
                  : 'bg-gray-100 group-hover:bg-[#ec2c6c] group-hover:text-white text-gray-600'
              }`}
            >
              {totalAllIndiaHospitals}
            </span>
          </Link>
        )}

        {/* Cities matching filter */}
        {filteredCities.length > 0 ? (
          filteredCities.map((c) => {
            const isCurrent = c.citySlug === currentCitySlug.toLowerCase();
            return (
              <Link
                key={c.citySlug}
                href={`/hospitals/${serviceSlug}/${c.citySlug}`}
                className={`flex items-center justify-between p-2.5 rounded-xl text-xs font-bold border transition-all ${
                  isCurrent
                    ? 'bg-[#ec2c6c] text-white border-[#ec2c6c] shadow-xs'
                    : 'bg-white hover:bg-pink-50/50 hover:border-pink-200 text-gray-800 border-gray-100 group'
                }`}
              >
                <span className="flex items-center space-x-2 truncate">
                  <MapPin
                    className={`w-3.5 h-3.5 flex-shrink-0 ${
                      isCurrent ? 'text-white' : 'text-[#ec2c6c]'
                    }`}
                  />
                  <span className="truncate">{c.cityName}</span>
                </span>
                <span
                  className={`text-[11px] px-2 py-0.5 rounded-full font-bold ml-2 flex-shrink-0 transition-colors ${
                    isCurrent
                      ? 'bg-white/20 text-white'
                      : 'bg-gray-100 group-hover:bg-[#ec2c6c] group-hover:text-white text-gray-600'
                  }`}
                >
                  {c.count} {c.count === 1 ? 'Hospital' : 'Hospitals'}
                </span>
              </Link>
            );
          })
        ) : !showAllIndia ? (
          <div className="text-center py-6 px-3 bg-gray-50 rounded-2xl border border-dashed border-gray-200 space-y-1">
            <Building2 className="w-6 h-6 text-gray-400 mx-auto" />
            <p className="text-xs font-bold text-gray-700">No matching cities found</p>
            <p className="text-[11px] text-gray-400">
              No hospital locations match &quot;{searchQuery}&quot;
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
