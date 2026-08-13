'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MapPin, Navigation, Search, Loader2, Compass, Layers, ExternalLink, Map, CheckCircle2 } from 'lucide-react';
import { cleanLocationName, validateIndiaLocation, parseIndianAddress } from '@/lib/locationUtils';

interface GoogleAddressMapPickerProps {
  onAddressSelect: (data: {
    address: string;
    city: string;
    district?: string;
    state: string;
    country: string;
    lat?: number;
    lng?: number;
  }) => void;
  initialAddress?: string;
  initialCity?: string;
  initialState?: string;
}

interface LeafletMap {
  setView: (coords: [number, number], zoom: number) => void;
  on: (event: string, fn: (e: { latlng: { lat: number; lng: number } }) => void) => void;
}

interface LeafletMarker {
  setLatLng: (coords: [number, number]) => void;
  getLatLng: () => { lat: number; lng: number };
  on: (event: string, fn: () => void) => void;
}

interface LeafletObject {
  map: (element: HTMLElement, options?: object) => LeafletMap;
  tileLayer: (url: string, options?: object) => { addTo: (map: LeafletMap) => void };
  icon: (options: object) => object;
  marker: (coords: [number, number], options?: object) => LeafletMarker & { addTo: (map: LeafletMap) => LeafletMarker };
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
    municipality?: string;
    state_district?: string;
    city_district?: string;
    county?: string;
    state?: string;
    country?: string;
    country_code?: string;
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
  const [leafletReady, setLeafletReady] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // Map Layer View Mode: 'm' = Standard, 'k' = Satellite
  const [mapType, setMapType] = useState<'m' | 'k'>('m');

  const dropdownRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<LeafletMap | null>(null);
  const markerRef = useRef<LeafletMarker | null>(null);

  // Sync prop changes during render
  const [prevInitialAddress, setPrevInitialAddress] = useState(initialAddress);
  if (initialAddress !== prevInitialAddress) {
    setPrevInitialAddress(initialAddress);
    if (initialAddress && initialAddress.trim() !== '') {
      setSearchQuery(initialAddress);
    }
  }

  // Auto-geocode initial address / city / state to position map pin on default location
  useEffect(() => {
    const queryToGeocode = initialAddress || `${initialCity} ${initialState}`.trim();
    if (!queryToGeocode || queryToGeocode.trim() === '') return;

    let isMounted = true;
    const fetchDefaultCoords = async () => {
      try {
        let res = await fetch(`/api/locations/autocomplete?q=${encodeURIComponent(queryToGeocode.trim())}`);
        if (res.ok) {
          let data = await res.json();
          let match = data.suggestions && data.suggestions.length > 0 ? data.suggestions[0] : null;

          // If match is missing or returned India default fallback (20.5937, 78.9629), try City + State fallback
          if (!match || (Math.abs(parseFloat(match.lat) - 20.5937) < 0.01 && Math.abs(parseFloat(match.lon) - 78.9629) < 0.01)) {
            if (initialCity || initialState) {
              const cityQuery = `${initialCity || ''}, ${initialState || 'Punjab'}, India`.trim();
              const cityRes = await fetch(`/api/locations/autocomplete?q=${encodeURIComponent(cityQuery)}`);
              if (cityRes.ok) {
                const cityData = await cityRes.json();
                if (cityData.suggestions && cityData.suggestions.length > 0) {
                  match = cityData.suggestions[0];
                }
              }
            }
          }

          if (match && isMounted) {
            const lat = parseFloat(match.lat);
            const lng = parseFloat(match.lon);
            if (!isNaN(lat) && !isNaN(lng)) {
              setSelectedCoords({ lat, lng });
            }
          }
        }
      } catch (err) {
        console.error('Error auto-geocoding default location for map:', err);
      }
    };

    fetchDefaultCoords();

    return () => {
      isMounted = false;
    };
  }, [initialAddress, initialCity, initialState]);

  // Load Leaflet CSS & JS dynamically
  useEffect(() => {
    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link');
      link.id = 'leaflet-css';
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }

    const win = window as unknown as Record<string, unknown>;
    if (!win.L) {
      const script = document.createElement('script');
      script.id = 'leaflet-js';
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.onload = () => {
        setLeafletReady(true);
      };
      document.body.appendChild(script);
    } else {
      const timer = setTimeout(() => setLeafletReady(true), 0);
      return () => clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Reverse Geocode coordinates to fetch address and notify parent
  const fetchAddressFromCoords = useCallback(
    async (lat: number, lng: number, updateQueryInput = true) => {
      setSearching(true);
      try {
        const res = await fetch(`/api/locations/reverse?lat=${lat}&lon=${lng}`);
        if (res.ok) {
          const data = await res.json();
          if (data && data.display_name) {
            const fullAddr = data.display_name;
            if (updateQueryInput) {
              setSearchQuery(fullAddr);
            }

            const addrObj = data.address || {};
            const locationCheck = validateIndiaLocation({
              country: addrObj.country,
              countryCode: addrObj.country_code,
              address: fullAddr,
            });

            if (!locationCheck.isValid) {
              setSelectedCoords(null);
              setSearchQuery('');
              const alertMessage = `⚠️ Location Restricted Error:\n\nThe selected address "${fullAddr}" is located outside India (${locationCheck.detectedCountry}).\n\nOnly hospital locations within India are allowed.`;
              alert(alertMessage);
              setToastMessage(`⚠️ Error: Selected address ("${fullAddr}") is outside India. Only locations in India are allowed.`);
              setTimeout(() => setToastMessage(''), 8000);
              return;
            }

            if (updateQueryInput) {
              setSearchQuery(fullAddr);
            }

            const { state, district, city } = parseIndianAddress(fullAddr, addrObj);

            onAddressSelect({
              address: fullAddr,
              city: city || initialCity || '',
              district: district || '',
              state: state || initialState || '',
              country: 'India',
              lat,
              lng,
            });

            setToastMessage('Location address fetched and filled automatically!');
            setTimeout(() => setToastMessage(''), 3500);
          }
        }
      } catch (err) {
        console.error('Error reverse geocoding map click location:', err);
      } finally {
        setSearching(false);
      }
    },
    [initialCity, initialState, onAddressSelect]
  );

  // Initialize Interactive Leaflet Map
  useEffect(() => {
    if (!leafletReady || !mapContainerRef.current) return;

    const win = window as unknown as { L?: LeafletObject };
    const L = win.L;
    if (!L) return;

    const defaultLat = selectedCoords?.lat || 20.5937;
    const defaultLng = selectedCoords?.lng || 78.9629;
    const defaultZoom = selectedCoords ? 16 : 5;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [defaultLat, defaultLng],
        zoom: defaultZoom,
        zoomControl: true,
      });

      const tileUrl =
        mapType === 'k'
          ? 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
          : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

      L.tileLayer(tileUrl, {
        maxZoom: 19,
        attribution: '© OpenStreetMap & Esri World Imagery',
      }).addTo(map);

      // Custom Pink Map Marker Icon
      const pinIcon = L.icon({
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41],
      });

      const marker = L.marker([defaultLat, defaultLng], { icon: pinIcon, draggable: true }).addTo(map);

      // CLICK ON MAP EVENT -> UPDATE MARKER & FETCH ADDRESS
      map.on('click', async (e: { latlng: { lat: number; lng: number } }) => {
        const clickLat = e.latlng.lat;
        const clickLng = e.latlng.lng;
        marker.setLatLng([clickLat, clickLng]);
        setSelectedCoords({ lat: clickLat, lng: clickLng });
        await fetchAddressFromCoords(clickLat, clickLng);
      });

      // DRAG PIN EVENT -> UPDATE MARKER & FETCH ADDRESS
      marker.on('dragend', async () => {
        const pos = marker.getLatLng();
        setSelectedCoords({ lat: pos.lat, lng: pos.lng });
        await fetchAddressFromCoords(pos.lat, pos.lng);
      });

      mapInstanceRef.current = map;
      markerRef.current = marker;
    } else {
      if (selectedCoords && markerRef.current) {
        markerRef.current.setLatLng([selectedCoords.lat, selectedCoords.lng]);
        mapInstanceRef.current.setView([selectedCoords.lat, selectedCoords.lng], 16);
      }
    }
  }, [leafletReady, mapType, selectedCoords, fetchAddressFromCoords]);

  // Update map view when selectedCoords changes
  useEffect(() => {
    if (mapInstanceRef.current && selectedCoords) {
      mapInstanceRef.current.setView([selectedCoords.lat, selectedCoords.lng], 16);
      if (markerRef.current) {
        markerRef.current.setLatLng([selectedCoords.lat, selectedCoords.lng]);
      }
    }
  }, [selectedCoords]);

  // Sync typed address to parent form
  const notifyParent = (text: string) => {
    onAddressSelect({
      address: text,
      city: initialCity || '',
      district: '',
      state: initialState || '',
      country: 'India',
    });
  };

  // Debounced search input handler
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

    const addrObj = place.address || {};
    const locationCheck = validateIndiaLocation({
      country: addrObj.country,
      countryCode: addrObj.country_code,
      address: fullAddr,
    });

    if (!locationCheck.isValid) {
      setSelectedCoords(null);
      setSearchQuery('');
      const alertMessage = `⚠️ Location Restricted Error:\n\nThe selected address "${fullAddr}" is located outside India (${locationCheck.detectedCountry}).\n\nOnly hospital locations within India are allowed.`;
      alert(alertMessage);
      setToastMessage(`⚠️ Error: Selected address ("${fullAddr}") is outside India. Only locations in India are allowed.`);
      setTimeout(() => setToastMessage(''), 8000);
      return;
    }

    const { state, district, city } = parseIndianAddress(fullAddr, addrObj);

    onAddressSelect({
      address: fullAddr,
      city: city || initialCity || '',
      district: district || '',
      state: state || initialState || '',
      country: 'India',
      lat,
      lng,
    });
  };

  // Detect Current Location using Geolocation API
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
        await fetchAddressFromCoords(lat, lng);
        setDetecting(false);
      },
      (error) => {
        setDetecting(false);
        alert(`Location permission denied or unavailable: ${error.message}`);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
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
      {/* Toast Notification when map clicked */}
      {toastMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-xl flex items-center space-x-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Search Input Bar with Google Map Autocomplete */}
      <div className="relative">
        <label className="block text-xs font-extrabold text-gray-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
          <span className="flex items-center">
            <MapPin className="w-4 h-4 text-[#b02151] mr-1.5" />
            Click Map or Search Address Below
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
              Suggestions ({suggestions.length})
            </div>
            <ul className="divide-y divide-gray-100">
              {suggestions.map((item) => (
                <li
                  key={item.place_id}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleSelectSuggestion(item);
                  }}
                  onClick={(e) => {
                    e.preventDefault();
                    handleSelectSuggestion(item);
                  }}
                  className="p-3 hover:bg-pink-50/60 cursor-pointer transition-colors flex items-start space-x-2 text-xs text-gray-800"
                >
                  <MapPin className="w-4 h-4 text-[#b02151] flex-shrink-0 mt-0.5" />
                  <span className="leading-relaxed font-medium">{item.display_name}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Map View Mode Toggles & Instruction Bar */}
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
        </div>

        <span className="text-[11px] font-semibold text-gray-500 hidden sm:inline">
          💡 Click map or drag pin to auto-fill address
        </span>

        {searchQuery && (
          <a
            href={getExternalMapUrl()}
            target="_blank"
            rel="noreferrer"
            className="text-[11px] font-bold text-pink-700 hover:underline inline-flex items-center space-x-1 pr-1"
          >
            <span>Open Google Maps</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </div>

      {/* Interactive Clickable & Draggable Map Canvas */}
      <div className="rounded-2xl border border-gray-200 overflow-hidden shadow-xs bg-gray-100 relative h-64 w-full z-10">
        <div ref={mapContainerRef} className="w-full h-full" />
        {!leafletReady && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-50 text-gray-400 text-xs space-y-2">
            <Compass className="w-8 h-8 animate-pulse text-[#b02151]" />
            <span>Loading interactive map...</span>
          </div>
        )}
      </div>
    </div>
  );
}
