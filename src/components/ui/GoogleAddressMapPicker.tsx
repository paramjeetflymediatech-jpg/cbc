'use client';

import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Navigation, Search, Loader2, Compass, Layers, ExternalLink, Map } from 'lucide-react';

interface GoogleAddressMapPickerProps {
  onAddressSelect: (data: {
    address: string;
    city: string;
    state: string;
    country: string;
    lat?: number;
    lng?: number;
  }) => void;
  initialAddress?: string;
  initialCity?: string;
  initialState?: string;
}

interface PlaceSuggestion {
  place_id: number | string;
  display_name: string;
  lat: string;
  lon: string;
  address?: {
    road?: string;
    suburb?: string;
    city?: string;
    town?: string;
    village?: string;
    county?: string;
    state?: string;
    country?: string;
    postcode?: string;
  };
}

export default function GoogleAddressMapPicker({
  onAddressSelect,
  initialAddress = '',
  initialCity = '',
  initialState = '',
}: GoogleAddressMapPickerProps) {
  const [searchQuery, setSearchQuery] = useState(initialAddress || `${initialCity} ${initialState}`.trim());
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [searching, setSearching] = useState(false);
  const [detecting, setDetecting] = useState(false);
  const [selectedCoords, setSelectedCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);

  // Map Layer View Mode: 'm' = Street Map, 'k' = Satellite, 'h' = Hybrid
  const [mapType, setMapType] = useState<'m' | 'k' | 'h'>('m');

  const dropdownRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Sync typed address to parent form whenever input changes or loses focus
  const notifyParent = (text: string, lat?: number, lng?: number, city?: string, state?: string) => {
    onAddressSelect({
      address: text,
      city: city || initialCity || '',
      state: state || initialState || '',
      country: 'India',
      lat,
      lng,
    });
  };

  // Debounced search input handler to fetch live suggestions
  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    setSelectedCoords(null);
    notifyParent(query);

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (query.trim().length < 2) {
      setSuggestions([]);
      setShowDropdown(false);
      setSearching(false);
      return;
    }

    setSearching(true);
    setShowDropdown(true);

    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/locations/autocomplete?q=${encodeURIComponent(query.trim())}`);
        if (res.ok) {
          const data = await res.json();
          if (data.suggestions && Array.isArray(data.suggestions)) {
            setSuggestions(data.suggestions);
          } else {
            setSuggestions([]);
          }
        }
      } catch {
        setSuggestions([]);
      } finally {
        setSearching(false);
      }
    }, 300);
  };

  const handleSelectSuggestion = (place: PlaceSuggestion) => {
    const lat = parseFloat(place.lat);
    const lng = parseFloat(place.lon);
    setSelectedCoords({ lat, lng });

    const fullAddr = place.display_name;
    setSearchQuery(fullAddr);
    setShowDropdown(false);

    // Parse city, state, country from response address object
    const addrObj = place.address || {};
    const city =
      addrObj.city ||
      addrObj.town ||
      addrObj.village ||
      addrObj.county ||
      addrObj.suburb ||
      initialCity ||
      '';
    const state = addrObj.state || initialState || '';
    const country = addrObj.country || 'India';

    onAddressSelect({
      address: fullAddr,
      city,
      state,
      country,
      lat,
      lng,
    });
  };

  // Detect Current Location using Geolocation API & Internal Reverse Geocoding Proxy
  const handleDetectCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }

    setDetecting(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setSelectedCoords({ lat, lng });

        try {
          const res = await fetch(`/api/locations/reverse?lat=${lat}&lon=${lng}`);
          if (res.ok) {
            const data = await res.json();
            if (data && data.display_name) {
              const fullAddr = data.display_name;
              setSearchQuery(fullAddr);

              const addrObj = data.address || {};
              const city =
                addrObj.city ||
                addrObj.town ||
                addrObj.village ||
                addrObj.county ||
                addrObj.suburb ||
                '';
              const state = addrObj.state || '';
              const country = addrObj.country || 'India';

              onAddressSelect({
                address: fullAddr,
                city,
                state,
                country,
                lat,
                lng,
              });
            }
          }
        } catch {
          alert('Could not fetch address details for your location.');
        } finally {
          setDetecting(false);
        }
      },
      (error) => {
        setDetecting(false);
        alert(`Location permission denied or unavailable: ${error.message}`);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const getMapEmbedUrl = () => {
    if (selectedCoords) {
      return `https://maps.google.com/maps?q=${selectedCoords.lat},${selectedCoords.lng}&t=${mapType}&z=16&output=embed`;
    }
    if (searchQuery && searchQuery.trim().length > 0) {
      return `https://maps.google.com/maps?q=${encodeURIComponent(searchQuery.trim())}&t=${mapType}&z=15&output=embed`;
    }
    return '';
  };

  const getExternalMapUrl = () => {
    if (selectedCoords) {
      return `https://www.google.com/maps/search/?api=1&query=${selectedCoords.lat},${selectedCoords.lng}`;
    }
    if (searchQuery) {
      return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(searchQuery)}`;
    }
    return 'https://maps.google.com';
  };

  return (
    <div className="space-y-3 w-full" ref={dropdownRef}>
      {/* Search Input Bar with Google Map Autocomplete */}
      <div className="relative">
        <label className="block text-xs font-extrabold text-gray-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
          <span className="flex items-center">
            <MapPin className="w-4 h-4 text-[#b02151] mr-1.5" />
            Google Street Map Address Search & Autocomplete
          </span>
          <button
            type="button"
            onClick={handleDetectCurrentLocation}
            disabled={detecting}
            className="text-[#b02151] hover:text-[#921941] text-[11px] font-bold inline-flex items-center space-x-1 border border-pink-100 bg-pink-50 px-2.5 py-1 rounded-full hover:bg-pink-100 transition-colors cursor-pointer"
          >
            {detecting ? (
              <>
                <Loader2 className="w-3 h-3 animate-spin mr-1" />
                <span>Detecting GPS...</span>
              </>
            ) : (
              <>
                <Navigation className="w-3 h-3 mr-1 text-[#b02151]" />
                <span>Use My Current Location</span>
              </>
            )}
          </button>
        </label>

        <div className="relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={handleSearchInputChange}
            onFocus={() => searchQuery.length >= 2 && setShowDropdown(true)}
            placeholder="Type hospital, landmark, or street address (e.g. ASG Hospital, Jalandhar)..."
            className="w-full pl-10 pr-10 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-900 focus:outline-none focus:border-[#fd1d74] focus:bg-white transition-colors"
          />
          {searching && <Loader2 className="w-4 h-4 text-gray-400 absolute right-3.5 top-3.5 animate-spin" />}
        </div>

        {/* Suggestions Dropdown */}
        {showDropdown && suggestions.length > 0 && (
          <div className="absolute z-50 left-0 right-0 top-full mt-1 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden max-h-60 overflow-y-auto">
            <div className="p-2 bg-pink-50 text-[10px] font-bold text-[#b02151] uppercase tracking-wider">
              Google Street Map Suggestions ({suggestions.length})
            </div>
            <ul className="divide-y divide-gray-100">
              {suggestions.map((item) => (
                <li
                  key={item.place_id}
                  onClick={() => handleSelectSuggestion(item)}
                  className="p-3 hover:bg-gray-50 cursor-pointer transition-colors flex items-start space-x-2 text-xs text-gray-800"
                >
                  <MapPin className="w-4 h-4 text-[#b02151] flex-shrink-0 mt-0.5" />
                  <span className="leading-relaxed font-medium">{item.display_name}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Map View Mode Toggles & Street View Bar */}
      <div className="flex items-center justify-between bg-gray-100 p-1.5 rounded-xl border border-gray-200 text-xs">
        <div className="flex items-center space-x-1">
          <button
            type="button"
            onClick={() => setMapType('m')}
            className={`px-3 py-1 rounded-lg font-extrabold transition-all flex items-center space-x-1 ${
              mapType === 'm' ? 'bg-white text-[#b02151] shadow-xs' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Map className="w-3.5 h-3.5 mr-1" />
            <span>Street Map</span>
          </button>

          <button
            type="button"
            onClick={() => setMapType('k')}
            className={`px-3 py-1 rounded-lg font-extrabold transition-all flex items-center space-x-1 ${
              mapType === 'k' ? 'bg-white text-[#b02151] shadow-xs' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5 mr-1" />
            <span>Satellite</span>
          </button>

          <button
            type="button"
            onClick={() => setMapType('h')}
            className={`px-3 py-1 rounded-lg font-extrabold transition-all flex items-center space-x-1 ${
              mapType === 'h' ? 'bg-white text-[#b02151] shadow-xs' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <span>Hybrid</span>
          </button>
        </div>

        {searchQuery && (
          <a
            href={getExternalMapUrl()}
            target="_blank"
            rel="noreferrer"
            className="text-[11px] font-bold text-pink-700 hover:underline inline-flex items-center space-x-1 pr-1"
          >
            <span>Open Full Google Map</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </div>

      {/* Interactive Street Map Canvas */}
      <div className="rounded-2xl border border-gray-200 overflow-hidden shadow-xs bg-gray-100 relative h-56 w-full">
        {searchQuery ? (
          <iframe
            title="Google Street Map Address Preview"
            width="100%"
            height="100%"
            frameBorder="0"
            scrolling="no"
            src={getMapEmbedUrl()}
            className="w-full h-full border-0"
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 text-xs space-y-2 p-4 text-center">
            <Compass className="w-8 h-8 text-gray-300 animate-pulse" />
            <span>Search street address or landmark to render live Google Street Map pin</span>
          </div>
        )}
      </div>
    </div>
  );
}
