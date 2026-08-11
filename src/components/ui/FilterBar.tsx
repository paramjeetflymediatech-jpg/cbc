'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, MapPin, Navigation, Building2, Stethoscope, Filter, RotateCcw } from 'lucide-react';

interface FilterBarProps {
  basePath: string;
  states: string[];
  districts?: string[];
  cities: string[];
  locationsMap?: Record<string, string[]>;
  stateDistrictMap?: Record<string, string[]>;
  districtCityMap?: Record<string, string[]>;
  services?: { name: string; slug: string }[];
  currentState?: string;
  currentDistrict?: string;
  currentCity?: string;
  currentSearch?: string;
  currentService?: string;
  showSpecialtySelect?: boolean;
}

export default function FilterBar({
  basePath,
  states,
  districts = [],
  cities,
  locationsMap = {},
  stateDistrictMap = {},
  districtCityMap = {},
  services = [],
  currentState = '',
  currentDistrict = '',
  currentCity = '',
  currentSearch = '',
  currentService = '',
  showSpecialtySelect = false,
}: FilterBarProps) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);

  const [selectedState, setSelectedState] = useState<string>(currentState);
  const [selectedDistrict, setSelectedDistrict] = useState<string>(currentDistrict);
  const [selectedCity, setSelectedCity] = useState<string>(currentCity);

  const [dynStateDistrictMap, setDynStateDistrictMap] = useState<Record<string, string[]>>(stateDistrictMap);
  const [dynDistrictCityMap, setDynDistrictCityMap] = useState<Record<string, string[]>>(districtCityMap);
  const [dynStateCityMap, setDynStateCityMap] = useState<Record<string, string[]>>(locationsMap);

  // Sync state if props change
  useEffect(() => {
    setSelectedState(currentState);
  }, [currentState]);

  useEffect(() => {
    setSelectedDistrict(currentDistrict);
  }, [currentDistrict]);

  useEffect(() => {
    setSelectedCity(currentCity);
  }, [currentCity]);

  useEffect(() => {
    if (stateDistrictMap && Object.keys(stateDistrictMap).length > 0) {
      setDynStateDistrictMap(stateDistrictMap);
    }
  }, [stateDistrictMap]);

  useEffect(() => {
    if (districtCityMap && Object.keys(districtCityMap).length > 0) {
      setDynDistrictCityMap(districtCityMap);
    }
  }, [districtCityMap]);

  useEffect(() => {
    if (locationsMap && Object.keys(locationsMap).length > 0) {
      setDynStateCityMap(locationsMap);
    }
  }, [locationsMap]);

  // Dynamically fetch districts & cities for selectedState if missing in map
  useEffect(() => {
    if (selectedState && (!dynStateDistrictMap[selectedState] || dynStateDistrictMap[selectedState].length === 0)) {
      fetch(`/api/locations?state=${encodeURIComponent(selectedState)}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.districts && Array.isArray(data.districts)) {
            const distNames = data.districts.map((d: any) => d.name);
            setDynStateDistrictMap((prev) => ({ ...prev, [selectedState]: distNames }));
          }
          if (data.cities && Array.isArray(data.cities)) {
            const cNames = data.cities.map((c: any) => c.name);
            setDynStateCityMap((prev) => ({ ...prev, [selectedState]: cNames }));
          }
        })
        .catch(() => {});
    }
  }, [selectedState, dynStateDistrictMap]);

  // Dynamically fetch cities for selectedDistrict if missing in map
  useEffect(() => {
    if (selectedDistrict && (!dynDistrictCityMap[selectedDistrict] || dynDistrictCityMap[selectedDistrict].length === 0)) {
      fetch(`/api/locations?district=${encodeURIComponent(selectedDistrict)}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.cities && Array.isArray(data.cities)) {
            const cNames = data.cities.map((c: any) => c.name);
            setDynDistrictCityMap((prev) => ({ ...prev, [selectedDistrict]: cNames }));
          }
        })
        .catch(() => {});
    }
  }, [selectedDistrict, dynDistrictCityMap]);

  // Compute available districts & cities
  const availableDistricts = selectedState
    ? (dynStateDistrictMap[selectedState] || districts)
    : districts;

  const availableCities = selectedDistrict
    ? (dynDistrictCityMap[selectedDistrict] || cities)
    : selectedState
    ? (dynStateCityMap[selectedState] || cities)
    : cities;

  const handleStateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newState = e.target.value;
    setSelectedState(newState);
    setSelectedDistrict('');
    setSelectedCity('');
    setTimeout(() => {
      if (formRef.current) formRef.current.requestSubmit();
    }, 50);
  };

  const handleDistrictChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newDistrict = e.target.value;
    setSelectedDistrict(newDistrict);
    setSelectedCity('');
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
    setSelectedDistrict('');
    setSelectedCity('');
    router.push(basePath);
  };

  return (
    <form
      ref={formRef}
      method="GET"
      action={basePath}
      className={`bg-white p-3 rounded-2xl shadow-2xl grid grid-cols-1 sm:grid-cols-2 ${
        showSpecialtySelect ? 'lg:grid-cols-6' : 'lg:grid-cols-5'
      } gap-3 text-gray-900 pt-2`}
    >
      {/* Search Input */}
      <div className="flex items-center px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl">
        <Search className="w-4 h-4 text-gray-400 mr-2 flex-shrink-0" />
        <input
          type="text"
          name="search"
          defaultValue={currentSearch}
          placeholder="Search hospital..."
          className="w-full text-xs text-gray-900 bg-transparent focus:outline-none placeholder-gray-400 font-medium"
        />
      </div>

      {/* Select State */}
      <div className="flex items-center px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl hover:border-[#ec2c6c] transition-colors">
        <MapPin className="w-4 h-4 text-[#ec2c6c] mr-2 flex-shrink-0" />
        <select
          name="state"
          value={selectedState}
          onChange={handleStateChange}
          className="w-full text-xs font-bold text-gray-800 bg-transparent focus:outline-none cursor-pointer"
        >
          <option value="">All States</option>
          {states.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {/* Select District */}
      <div className="flex items-center px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl hover:border-[#ec2c6c] transition-colors">
        <Navigation className="w-4 h-4 text-[#ec2c6c] mr-2 flex-shrink-0" />
        <select
          name="district"
          value={selectedDistrict}
          onChange={handleDistrictChange}
          className="w-full text-xs font-bold text-gray-800 bg-transparent focus:outline-none cursor-pointer"
        >
          <option value="">
            {selectedState ? `All Districts in ${selectedState}` : 'All Districts'}
          </option>
          {availableDistricts.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
      </div>

      {/* Select City */}
      <div className="flex items-center px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl hover:border-[#ec2c6c] transition-colors">
        <Building2 className="w-4 h-4 text-[#ec2c6c] mr-2 flex-shrink-0" />
        <select
          name="city"
          value={selectedCity}
          onChange={handleCityChange}
          className="w-full text-xs font-bold text-gray-800 bg-transparent focus:outline-none cursor-pointer"
        >
          <option value="">
            {selectedDistrict
              ? `All Cities in ${selectedDistrict}`
              : selectedState
              ? `All Cities in ${selectedState}`
              : 'All Cities'}
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
        <div className="flex items-center px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl hover:border-[#ec2c6c] transition-colors">
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
          className="cbc-btn-primary w-full py-2 text-xs font-bold uppercase tracking-wider flex items-center justify-center space-x-1.5 shadow-md"
        >
          <Filter className="w-3.5 h-3.5" />
          <span>Filter</span>
        </button>

        {(selectedState || selectedDistrict || selectedCity || currentSearch || currentService) && (
          <button
            type="button"
            onClick={handleReset}
            className="p-2 bg-gray-100 text-gray-600 hover:bg-red-50 hover:text-red-600 rounded-xl transition-colors"
            title="Reset Filters"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        )}
      </div>
    </form>
  );
}
