'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, MapPin, Building2, Stethoscope, Filter, RotateCcw } from 'lucide-react';

export const STATE_CITY_MAP: Record<string, string[]> = {
  Maharashtra: ['Mumbai', 'Pune', 'Thane', 'Navi Mumbai', 'Nagpur', 'Nashik'],
  'Delhi NCR': ['Delhi', 'Gurgaon', 'Noida', 'Faridabad', 'Ghaziabad'],
  Karnataka: ['Bangalore', 'Mysore', 'Mangalore', 'Hubli'],
  'Tamil Nadu': ['Chennai', 'Coimbatore', 'Madurai', 'Trichy'],
  Telangana: ['Hyderabad', 'Secunderabad', 'Warangal'],
  Gujarat: ['Ahmedabad', 'Surat', 'Vadodara', 'Rajkot'],
  Kerala: ['Kochi', 'Trivandrum', 'Kozhikode', 'Thrissur'],
  'West Bengal': ['Kolkata', 'Howrah', 'Siliguri'],
  Punjab: ['Mohali', 'Amritsar', 'Ludhiana', 'Jalandhar'],
};

interface FilterBarProps {
  basePath: string;
  states: string[];
  cities: string[];
  services?: { name: string; slug: string }[];
  currentState?: string;
  currentCity?: string;
  currentSearch?: string;
  currentService?: string;
  showSpecialtySelect?: boolean;
}

export default function FilterBar({
  basePath,
  states,
  cities,
  services = [],
  currentState = '',
  currentCity = '',
  currentSearch = '',
  currentService = '',
  showSpecialtySelect = false,
}: FilterBarProps) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);

  const [selectedState, setSelectedState] = useState<string>(currentState);
  const [selectedCity, setSelectedCity] = useState<string>(currentCity);

  // Sync state if prop changes
  useEffect(() => {
    setSelectedState(currentState);
  }, [currentState]);

  useEffect(() => {
    setSelectedCity(currentCity);
  }, [currentCity]);

  // Compute available cities for selectedState
  const availableCities = selectedState && STATE_CITY_MAP[selectedState]
    ? STATE_CITY_MAP[selectedState]
    : cities;

  const handleStateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newState = e.target.value;
    setSelectedState(newState);
    // If city doesn't belong to new state, clear city
    if (newState && STATE_CITY_MAP[newState] && !STATE_CITY_MAP[newState].includes(selectedCity)) {
      setSelectedCity('');
    }
    setTimeout(() => {
      if (formRef.current) formRef.current.requestSubmit();
    }, 50);
  };

  const handleCityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedCity(e.target.value);
    setTimeout(() => {
      if (formRef.current) formRef.current.requestSubmit();
    }, 50);
  };

  const handleOtherSelectChange = () => {
    setTimeout(() => {
      if (formRef.current) formRef.current.requestSubmit();
    }, 50);
  };

  const handleReset = () => {
    setSelectedState('');
    setSelectedCity('');
    router.push(basePath);
  };

  return (
    <form
      ref={formRef}
      method="GET"
      action={basePath}
      className={`bg-white p-3 rounded-2xl shadow-2xl grid grid-cols-1 sm:grid-cols-2 ${
        showSpecialtySelect ? 'lg:grid-cols-5' : 'lg:grid-cols-4'
      } gap-3 text-gray-900 pt-2`}
    >
      {/* Search Input */}
      <div className="flex items-center px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl">
        <Search className="w-4 h-4 text-gray-400 mr-2 flex-shrink-0" />
        <input
          type="text"
          name="search"
          defaultValue={currentSearch}
          placeholder="Search hospital name..."
          className="w-full text-xs text-gray-900 bg-transparent focus:outline-none placeholder-gray-400 font-medium"
        />
      </div>

      {/* Select State */}
      <div className="flex items-center px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl hover:border-[#ec2c6c] transition-colors">
        <MapPin className="w-4 h-4 text-[#ec2c6c] mr-2 flex-shrink-0" />
        <select
          name="state"
          value={selectedState}
          onChange={handleStateChange}
          className="w-full text-xs font-bold text-gray-800 bg-transparent focus:outline-none cursor-pointer"
        >
          <option value="">All States (Select State)</option>
          {states.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {/* Select City (Dynamically filtered by selectedState) */}
      <div className="flex items-center px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl hover:border-[#ec2c6c] transition-colors">
        <Building2 className="w-4 h-4 text-[#ec2c6c] mr-2 flex-shrink-0" />
        <select
          name="city"
          value={selectedCity}
          onChange={handleCityChange}
          className="w-full text-xs font-bold text-gray-800 bg-transparent focus:outline-none cursor-pointer"
        >
          <option value="">
            {selectedState ? `All Cities in ${selectedState}` : 'All Cities (Select City)'}
          </option>
          {availableCities.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      {/* Select Specialty */}
      {showSpecialtySelect && (
        <div className="flex items-center px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl hover:border-[#ec2c6c] transition-colors">
          <Stethoscope className="w-4 h-4 text-[#ec2c6c] mr-2 flex-shrink-0" />
          <select
            name="service"
            defaultValue={currentService}
            onChange={handleOtherSelectChange}
            className="w-full text-xs font-bold text-gray-800 bg-transparent focus:outline-none cursor-pointer"
          >
            <option value="">All Specialties</option>
            {services.map((svc) => (
              <option key={svc.slug} value={svc.slug}>
                {svc.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Submit / Reset Actions */}
      <div className="flex items-center space-x-2">
        <button
          type="submit"
          className="cbc-btn-primary w-full py-2.5 text-xs font-bold uppercase tracking-wider flex items-center justify-center space-x-1.5 shadow-md"
        >
          <Filter className="w-3.5 h-3.5" />
          <span>Filter</span>
        </button>

        {(selectedState || selectedCity || currentSearch || currentService) && (
          <button
            type="button"
            onClick={handleReset}
            className="p-2.5 bg-gray-100 text-gray-600 hover:bg-red-50 hover:text-red-600 rounded-xl transition-colors"
            title="Reset Filters"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        )}
      </div>
    </form>
  );
}
