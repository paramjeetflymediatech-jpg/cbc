'use client';

import React, { useState, useEffect } from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import GoogleAddressMapPicker from '@/components/ui/GoogleAddressMapPicker';
import { Building2, CheckCircle2, AlertCircle, Loader2, ShieldCheck, Users, Stethoscope, Globe, Award, Sparkles } from 'lucide-react';

interface ServiceItem {
  id: number;
  name: string;
}

export default function GetListedPage() {
  const [hospitalName, setHospitalName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [website, setWebsite] = useState('');
  const [address, setAddress] = useState('');

  // Dynamic State, District & City Cascading Selection
  const [statesList, setStatesList] = useState<any[]>([]);
  const [state, setState] = useState('Punjab');
  const [districtOptions, setDistrictOptions] = useState<string[]>([]);
  const [district, setDistrict] = useState('Ludhiana');
  const [cityOptions, setCityOptions] = useState<string[]>([]);
  const [city, setCity] = useState('Ludhiana City');

  const [description, setDescription] = useState('');
  const [contactPersonName, setContactPersonName] = useState('');
  const [contactPersonPhone, setContactPersonPhone] = useState('');
  const [selectedServices, setSelectedServices] = useState<number[]>([]);

  const [availableServices, setAvailableServices] = useState<ServiceItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    // Fetch Medical Services
    fetch('/api/services')
      .then((res) => res.json())
      .then((data) => {
        if (data.services) setAvailableServices(data.services);
      })
      .catch(() => {});

    // Fetch Dynamic States, Districts & Cities
    fetch('/api/locations')
      .then((res) => res.json())
      .then((data) => {
        if (data.states && data.states.length > 0) {
          setStatesList(data.states);
          const defaultSt = data.states.find((s: any) => s.name === 'Punjab') || data.states[0];
          setState(defaultSt.name);

          if (defaultSt.districts && defaultSt.districts.length > 0) {
            const dists = defaultSt.districts.map((d: any) => d.name);
            setDistrictOptions(dists);
            const firstDistObj = defaultSt.districts[0];
            setDistrict(firstDistObj.name);

            if (firstDistObj.cities && firstDistObj.cities.length > 0) {
              const cities = firstDistObj.cities.map((c: any) => c.name);
              setCityOptions(cities);
              setCity(cities[0]);
            }
          } else if (defaultSt.cities && defaultSt.cities.length > 0) {
            const cities = defaultSt.cities.map((c: any) => c.name);
            setCityOptions(cities);
            setCity(cities[0]);
          }
        }
      })
      .catch(() => {});
  }, []);

  const handleStateChange = (newStateName: string) => {
    setState(newStateName);
    const selectedStateObj = statesList.find((s: any) => s.name === newStateName);
    if (selectedStateObj && selectedStateObj.districts && selectedStateObj.districts.length > 0) {
      const dists = selectedStateObj.districts.map((d: any) => d.name);
      setDistrictOptions(dists);
      const firstDist = selectedStateObj.districts[0];
      setDistrict(firstDist.name);

      if (firstDist.cities && firstDist.cities.length > 0) {
        const cities = firstDist.cities.map((c: any) => c.name);
        setCityOptions(cities);
        setCity(cities[0]);
      } else if (selectedStateObj.cities && selectedStateObj.cities.length > 0) {
        const cities = selectedStateObj.cities.map((c: any) => c.name);
        setCityOptions(cities);
        setCity(cities[0]);
      } else {
        setCityOptions([]);
        setCity('');
      }
    } else if (selectedStateObj && selectedStateObj.cities && selectedStateObj.cities.length > 0) {
      setDistrictOptions([]);
      setDistrict('');
      const cities = selectedStateObj.cities.map((c: any) => c.name);
      setCityOptions(cities);
      setCity(cities[0]);
    } else {
      setDistrictOptions([]);
      setDistrict('');
      setCityOptions([]);
      setCity('');
    }
  };

  const handleDistrictChange = (newDistName: string) => {
    setDistrict(newDistName);
    const selectedStateObj = statesList.find((s: any) => s.name === state);
    const selectedDistObj = selectedStateObj?.districts?.find((d: any) => d.name === newDistName);
    if (selectedDistObj && selectedDistObj.cities && selectedDistObj.cities.length > 0) {
      const cities = selectedDistObj.cities.map((c: any) => c.name);
      setCityOptions(cities);
      setCity(cities[0]);
    } else {
      fetch(`/api/locations?district=${encodeURIComponent(newDistName)}`)
        .then((r) => r.json())
        .then((d) => {
          if (d.cities && Array.isArray(d.cities)) {
            const cNames = d.cities.map((c: any) => c.name);
            setCityOptions(cNames);
            if (cNames.length > 0) setCity(cNames[0]);
          }
        })
        .catch(() => {});
    }
  };

  const handleGoogleAddressSelected = async (data: {
    address: string;
    city: string;
    district?: string;
    state: string;
    country: string;
  }) => {
    if (data.address) setAddress(data.address);

    const searchedState = (data.state || '').toLowerCase().trim();
    const searchedDistrict = (data.district || '').toLowerCase().trim();
    const searchedCity = (data.city || '').toLowerCase().trim();

    // 1. Find matching state in statesList
    const matchedStateObj = statesList.find(
      (s: any) =>
        s.name.toLowerCase() === searchedState ||
        s.name.toLowerCase().includes(searchedState) ||
        searchedState.includes(s.name.toLowerCase())
    );

    if (matchedStateObj) {
      setState(matchedStateObj.name);

      let dists: string[] = [];
      let stateCities: string[] = [];

      if (matchedStateObj.districts && matchedStateObj.districts.length > 0) {
        dists = matchedStateObj.districts.map((d: any) => d.name);
      }

      // Fetch dynamic districts and cities for this state if missing
      try {
        const res = await fetch(`/api/locations?state=${encodeURIComponent(matchedStateObj.name)}`);
        if (res.ok) {
          const locData = await res.json();
          if (locData.districts && Array.isArray(locData.districts)) {
            const apiDists = locData.districts.map((d: any) => d.name);
            dists = Array.from(new Set([...dists, ...apiDists]));
          }
          if (locData.cities && Array.isArray(locData.cities)) {
            stateCities = locData.cities.map((c: any) => c.name);
          }
        }
      } catch {}

      // 2. Match district
      const targetDistName = data.district || data.city || '';
      let matchedDistName = dists.find(
        (dName: string) =>
          dName.toLowerCase() === searchedDistrict ||
          dName.toLowerCase().includes(searchedDistrict) ||
          searchedDistrict.includes(dName.toLowerCase()) ||
          dName.toLowerCase() === searchedCity ||
          dName.toLowerCase().includes(searchedCity)
      );

      if (!matchedDistName && targetDistName) {
        matchedDistName = targetDistName;
        dists = [targetDistName, ...dists];
      }

      setDistrictOptions(dists);
      if (matchedDistName) {
        setDistrict(matchedDistName);
      }

      // 3. Match city
      let cityList: string[] = stateCities;
      const selectedDistObj = matchedStateObj.districts?.find((d: any) => d.name === matchedDistName);
      if (selectedDistObj && selectedDistObj.cities && selectedDistObj.cities.length > 0) {
        cityList = Array.from(new Set([...selectedDistObj.cities.map((c: any) => c.name), ...stateCities]));
      }

      const targetCityName = data.city || '';
      let matchedCityName = cityList.find(
        (cName: string) =>
          cName.toLowerCase() === searchedCity ||
          cName.toLowerCase().includes(searchedCity) ||
          searchedCity.includes(cName.toLowerCase())
      );

      // Fallback: If searched city is a local area/neighborhood (e.g. Mota Singh Nagar), match district name (e.g. Jalandhar)
      if (!matchedCityName && matchedDistName) {
        matchedCityName = cityList.find(
          (cName: string) =>
            cName.toLowerCase() === matchedDistName.toLowerCase() ||
            cName.toLowerCase().includes(matchedDistName.toLowerCase()) ||
            matchedDistName.toLowerCase().includes(cName.toLowerCase())
        );
      }

      if (!matchedCityName && targetCityName) {
        matchedCityName = targetCityName;
        cityList = [targetCityName, ...cityList];
      }

      setCityOptions(cityList);
      if (matchedCityName) {
        setCity(matchedCityName);
      }
    } else {
      // Fallback if state not in list
      if (data.state) setState(data.state);
      if (data.district) {
        setDistrictOptions((prev) => (!prev.includes(data.district!) ? [data.district!, ...prev] : prev));
        setDistrict(data.district);
      }
      if (data.city) {
        setCityOptions((prev) => (!prev.includes(data.city) ? [data.city, ...prev] : prev));
        setCity(data.city);
      }
    }
  };

  const handleServiceToggle = (id: number) => {
    setSelectedServices((prev) =>
      prev.includes(id) ? prev.filter((sId) => sId !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setLoading(true);

    try {
      const res = await fetch('/api/hospitals/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hospitalName,
          email,
          phone,
          password,
          website,
          address,
          city,
          district,
          state,
          description,
          contactPersonName,
          contactPersonPhone,
          services: selectedServices,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error || 'Failed to submit hospital registration.');
      } else {
        setIsSuccess(true);
      }
    } catch {
      setErrorMessage('Network error during registration.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-gray-900">
      <Header />

      {/* Modern Gradient Hero Banner */}
      <section
        className="text-white py-14 sm:py-16 relative overflow-hidden"
        style={{
          background: 'linear-gradient(90deg, rgb(180 58 173) 0%, rgb(253 29 116) 50%, rgb(252 69 214) 100%)',
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10 space-y-3">
          <div className="inline-flex items-center space-x-2 bg-white/20 backdrop-blur-md px-4 py-1.5 rounded-full text-xs font-extrabold uppercase tracking-widest text-white shadow-sm border border-white/30 mb-1">
            <Sparkles className="w-4 h-4 text-yellow-300" />
            <span>Hospital & Clinic Onboarding Portal</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight drop-shadow-md">
            Partner With Clinic By Choice
          </h1>

          <p className="text-white/95 text-base sm:text-lg max-w-4xl mx-auto font-medium leading-relaxed drop-shadow">
            Join India&apos;s premier healthcare network to connect your specialized clinic directly with domestic and international patients seeking quality medical procedures.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-6 pt-3 text-xs sm:text-sm font-bold text-white/90">
            <span className="flex items-center"><ShieldCheck className="w-5 h-5 text-yellow-300 mr-1.5" /> NABH Verified Marketplace</span>
            <span className="flex items-center"><Globe className="w-5 h-5 text-yellow-300 mr-1.5" /> Global Medical Tourism Reach</span>
            <span className="flex items-center"><Award className="w-5 h-5 text-yellow-300 mr-1.5" /> Dedicated Hospital Dashboard</span>
          </div>
        </div>
      </section>

      {/* Full Width Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12 flex-1 w-full">
        {isSuccess ? (
          <div className="bg-white p-10 sm:p-14 rounded-3xl shadow-2xl text-center space-y-6 max-w-2xl mx-auto border border-emerald-100">
            <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-12 h-12" />
            </div>

            <h2 className="text-3xl font-extrabold text-gray-900">
              Registration Submitted Successfully!
            </h2>

            <p className="text-gray-600 text-base font-medium leading-relaxed">
              Thank you for partnering with <strong>Clinic By Choice</strong>. Our hospital verification team is reviewing your accreditation details and medical credentials.
            </p>

            <div className="p-6 bg-pink-50/70 rounded-2xl border border-pink-100 text-left space-y-3 text-sm text-gray-700">
              <h4 className="font-extrabold text-[#b02151] uppercase tracking-wider text-xs">
                What happens next?
              </h4>
              <ul className="space-y-2 list-disc list-inside font-medium">
                <li>Verification usually takes 24–48 business hours.</li>
                <li>You will receive your login access details at <strong>{email}</strong>.</li>
                <li>Access your hospital portal to customize packages, upload doctors, and track leads.</li>
              </ul>
            </div>

            <div className="pt-4">
              <a
                href="/login"
                className="bg-[#b02151] hover:bg-[#921941] text-white font-extrabold text-sm px-8 py-3.5 rounded-xl uppercase tracking-wider transition-colors shadow-lg inline-block"
              >
                Go to Hospital Login
              </a>
            </div>
          </div>
        ) : (
          <div className="space-y-8 w-full">
            {/* 3 Benefit Feature Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col space-y-3">
                <div className="w-12 h-12 rounded-xl bg-pink-50 text-[#fd1d74] flex items-center justify-center">
                  <Globe className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-extrabold text-gray-900">Expand Reach</h3>
                <p className="text-xs text-gray-600 font-medium leading-relaxed">
                  List your clinic to gain visibility among patients across India and overseas medical tourism seekers.
                </p>
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col space-y-3">
                <div className="w-12 h-12 rounded-xl bg-pink-50 text-[#fd1d74] flex items-center justify-center">
                  <Users className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-extrabold text-gray-900">Verified Patient Leads</h3>
                <p className="text-xs text-gray-600 font-medium leading-relaxed">
                  Receive pre-screened consultation requests from patients specifically looking for your specialties.
                </p>
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col space-y-3">
                <div className="w-12 h-12 rounded-xl bg-pink-50 text-[#fd1d74] flex items-center justify-center">
                  <Stethoscope className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-extrabold text-gray-900">Hospital Portal</h3>
                <p className="text-xs text-gray-600 font-medium leading-relaxed">
                  Manage patient enquiries, update pricing packages, and showcase doctor credentials through a dedicated dashboard.
                </p>
              </div>
            </div>

            {/* Full Width Registration Form Card */}
            <div className="bg-white p-6 sm:p-10 rounded-3xl shadow-xl border border-gray-100 space-y-8 w-full">
              <div className="border-b border-gray-100 pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="text-xs font-extrabold tracking-widest text-[#fd1d74] uppercase block mb-1">
                    GET LISTED TODAY
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 flex items-center">
                    <Building2 className="w-7 h-7 text-[#b02151] mr-3" />
                    Hospital & Clinic Onboarding Form
                  </h2>
                </div>
                <span className="text-xs font-bold bg-pink-50 text-[#b02151] px-3.5 py-1.5 rounded-full border border-pink-100 self-start sm:self-auto">
                  Instant Access
                </span>
              </div>

              {errorMessage && (
                <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-2xl flex items-center space-x-3">
                  <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                  <span className="font-semibold">{errorMessage}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-8 w-full">
                {/* Step 1: Basic Info */}
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <span className="w-7 h-7 rounded-full bg-[#b02151] text-white text-xs font-extrabold flex items-center justify-center">
                      1
                    </span>
                    <h3 className="text-base font-extrabold text-gray-900 uppercase tracking-wider">
                      Hospital General Information
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                        Hospital / Clinic Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={hospitalName}
                        onChange={(e) => setHospitalName(e.target.value)}
                        placeholder="e.g. Apollo Super Specialty Hospital"
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:border-[#fd1d74] focus:bg-white transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                        Official Email Address *
                      </label>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="contact@hospital.com"
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:border-[#fd1d74] focus:bg-white transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                        Contact Phone Number *
                      </label>
                      <input
                        type="tel"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+91 9876543210"
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:border-[#fd1d74] focus:bg-white transition-colors"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                        Create Account Password *
                      </label>
                      <input
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Password for hospital portal"
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:border-[#fd1d74] focus:bg-white transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                        Hospital Website URL (Optional)
                      </label>
                      <input
                        type="url"
                        value={website}
                        onChange={(e) => setWebsite(e.target.value)}
                        placeholder="https://www.yourhospital.com"
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:border-[#fd1d74] focus:bg-white transition-colors"
                      />
                    </div>
                  </div>
                </div>

                {/* Step 2: Google Maps Location Autocomplete & Picker */}
                <div className="space-y-4 pt-6 border-t border-gray-100">
                  <div className="flex items-center space-x-2">
                    <span className="w-7 h-7 rounded-full bg-[#b02151] text-white text-xs font-extrabold flex items-center justify-center">
                      2
                    </span>
                    <h3 className="text-base font-extrabold text-gray-900 uppercase tracking-wider">
                      Location Details & Google Map Address Fetch
                    </h3>
                  </div>

                  {/* Google Map Address Autocomplete Component */}
                  <div className="p-4 bg-slate-50 border border-gray-200 rounded-2xl space-y-4">
                    <GoogleAddressMapPicker
                      initialAddress={address}
                      initialCity={city}
                      initialState={state}
                      onAddressSelect={handleGoogleAddressSelected}
                    />
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                    <div className="lg:col-span-6">
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                        Full Street Address *
                      </label>
                      <textarea
                        rows={3}
                        required
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="Building name, street address, landmark..."
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:border-[#fd1d74] focus:bg-white transition-colors resize-none"
                      />
                    </div>

                    <div className="lg:col-span-12 grid grid-cols-1 sm:grid-cols-3 gap-5">
                      {/* State Dropdown */}
                      <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                          State / Region *
                        </label>
                        <select
                          required
                          value={state}
                          onChange={(e) => handleStateChange(e.target.value)}
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-900 focus:outline-none focus:border-[#fd1d74] focus:bg-white transition-colors cursor-pointer"
                        >
                          {statesList.map((st: any) => (
                            <option key={st.id} value={st.name}>
                              {st.name} ({st.code})
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* District Dropdown (State-wise Dynamic Options) */}
                      <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                          District *
                        </label>
                        <select
                          required
                          value={district}
                          onChange={(e) => handleDistrictChange(e.target.value)}
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-900 focus:outline-none focus:border-[#fd1d74] focus:bg-white transition-colors cursor-pointer"
                        >
                          {districtOptions.map((dName: string) => (
                            <option key={dName} value={dName}>
                              {dName}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* City Dropdown (District-wise Dynamic Options) */}
                      <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                          City / Town *
                        </label>
                        <select
                          required
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-900 focus:outline-none focus:border-[#fd1d74] focus:bg-white transition-colors cursor-pointer"
                        >
                          {cityOptions.map((cName: string) => (
                            <option key={cName} value={cName}>
                              {cName}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Step 3: Description */}
                <div className="space-y-4 pt-6 border-t border-gray-100">
                  <div className="flex items-center space-x-2">
                    <span className="w-7 h-7 rounded-full bg-[#b02151] text-white text-xs font-extrabold flex items-center justify-center">
                      3
                    </span>
                    <h3 className="text-base font-extrabold text-gray-900 uppercase tracking-wider">
                      Hospital Overview & Primary Contact
                    </h3>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                      Hospital Overview & Special Features *
                    </label>
                    <textarea
                      rows={3}
                      required
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Describe your hospital facilities, accreditation (NABH/JCI), number of ICU beds, and medical team experience..."
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:border-[#fd1d74] focus:bg-white transition-colors resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                        Medical Coordinator Name
                      </label>
                      <input
                        type="text"
                        value={contactPersonName}
                        onChange={(e) => setContactPersonName(e.target.value)}
                        placeholder="Dr. / Mr. Contact Person"
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:border-[#fd1d74] focus:bg-white transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                        Direct Mobile Number
                      </label>
                      <input
                        type="tel"
                        value={contactPersonPhone}
                        onChange={(e) => setContactPersonPhone(e.target.value)}
                        placeholder="+91 9876543210"
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:border-[#fd1d74] focus:bg-white transition-colors"
                      />
                    </div>
                  </div>
                </div>

                {/* Step 4: Specialties */}
                <div className="space-y-4 pt-6 border-t border-gray-100">
                  <div className="flex items-center space-x-2">
                    <span className="w-7 h-7 rounded-full bg-[#b02151] text-white text-xs font-extrabold flex items-center justify-center">
                      4
                    </span>
                    <h3 className="text-base font-extrabold text-gray-900 uppercase tracking-wider">
                      Select Offered Medical Specialties
                    </h3>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                    {availableServices.map((svc) => (
                      <label
                        key={svc.id}
                        className={`p-3.5 rounded-xl border text-xs font-bold cursor-pointer flex items-center space-x-2.5 transition-all select-none ${
                          selectedServices.includes(svc.id)
                            ? 'border-[#fd1d74] bg-pink-50 text-[#b02151] shadow-sm'
                            : 'border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={selectedServices.includes(svc.id)}
                          onChange={() => handleServiceToggle(svc.id)}
                          className="rounded text-[#fd1d74] focus:ring-[#fd1d74] w-4 h-4"
                        />
                        <span className="truncate">{svc.name}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Submit Action */}
                <div className="pt-6 border-t border-gray-100">
                  <button
                    type="submit"
                    disabled={loading}
                    className="bg-[#b02151] hover:bg-[#921941] text-white w-full text-base py-4 rounded-xl font-extrabold uppercase tracking-wider shadow-xl transition-all disabled:opacity-50 flex items-center justify-center space-x-2"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Submitting Registration...</span>
                      </>
                    ) : (
                      <span>Submit Hospital Registration</span>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
