'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

interface ServiceItem {
  id: number;
  name: string;
  slug: string;
}

interface EnquiryModalProps {
  isOpen: boolean;
  onClose: () => void;
  hospitalId: number;
  hospitalName: string;
  defaultServiceId?: number;
  initialMessage?: string;
  servicesList?: ServiceItem[];
}

const EMPTY_SERVICES: ServiceItem[] = [];

export default function EnquiryModal({
  isOpen,
  onClose,
  hospitalId,
  hospitalName,
  defaultServiceId,
  initialMessage,
  servicesList = EMPTY_SERVICES,
}: EnquiryModalProps) {
  const [patientName, setPatientName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [city, setCity] = useState('');
  const validDefaultId = defaultServiceId && !Number.isNaN(Number(defaultServiceId)) ? Number(defaultServiceId) : '';
  const [serviceId, setServiceId] = useState<number | string>(validDefaultId);
  const [message, setMessage] = useState('');
  const [preferredContactTime, setPreferredContactTime] = useState('Morning (9 AM - 12 PM)');
  const [availableServices, setAvailableServices] = useState<ServiceItem[]>(servicesList);

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const fetchedRef = useRef(false);
  const prevIsOpenRef = useRef(false);

  useEffect(() => {
    if (isOpen && !prevIsOpenRef.current) {
      // Modal opened: initialize serviceId to validDefaultId or first available service
      const initial = validDefaultId || (availableServices.length > 0 ? availableServices[0].id : '');
      setServiceId(initial);
      if (initialMessage !== undefined) {
        setMessage(initialMessage);
      }
    } else if (isOpen && !serviceId && availableServices.length > 0) {
      // Services loaded asynchronously after opening
      const initial = validDefaultId || availableServices[0].id;
      setServiceId(initial);
    }
    prevIsOpenRef.current = isOpen;
  }, [isOpen, validDefaultId, availableServices, serviceId, initialMessage]);

  useEffect(() => {
    if (!isOpen) {
      fetchedRef.current = false;
      return;
    }

    if (fetchedRef.current) return;
    fetchedRef.current = true;

    const dedupe = (list: any[]) => {
      if (!Array.isArray(list)) return [];
      const map = new Map();
      list.forEach((item, idx) => {
        if (!item) return;
        const key = item.id || item.slug || item.name || idx;
        if (!map.has(key)) map.set(key, item);
      });
      return Array.from(map.values());
    };

    // 1. If explicit servicesList prop is provided with items, check if validDefaultId is included
    if (servicesList && servicesList.length > 0) {
      const hasDefault = validDefaultId ? servicesList.some((s: any) => s && s.id === Number(validDefaultId)) : true;
      if (hasDefault) {
        setAvailableServices(dedupe(servicesList));
        return;
      }
    }

    // 2. If hospitalId is provided, fetch hospital details to display ONLY its offered services
    if (hospitalId) {
      fetch('/api/hospitals')
        .then((res) => res.json())
        .then((data) => {
          if (data.hospitals && Array.isArray(data.hospitals)) {
            const currentHospital = data.hospitals.find((h: any) => h.id === hospitalId);
            if (currentHospital) {
              const hServices =
                currentHospital.services ||
                currentHospital.hospitalServices?.map((hs: any) => hs.service).filter(Boolean);
              if (hServices && hServices.length > 0) {
                const hasDefault = validDefaultId ? hServices.some((s: any) => s && s.id === Number(validDefaultId)) : true;
                if (hasDefault) {
                  setAvailableServices(dedupe(hServices));
                  return;
                }
              }
            }
          }
          // Fallback if no specific services found or default missing
          fetchGlobalServices();
        })
        .catch(() => {
          fetchGlobalServices();
        });
    } else {
      fetchGlobalServices();
    }

    function fetchGlobalServices() {
      fetch('/api/services')
        .then((res) => res.json())
        .then((data) => {
          if (data.services) {
            setAvailableServices(dedupe(data.services));
          }
        })
        .catch(() => {});
    }
  }, [isOpen, servicesList, hospitalId, validDefaultId]);

  const [requireLogin, setRequireLogin] = useState(false);

  useEffect(() => {
    if (isOpen) {
      try {
        const stored = localStorage.getItem('cbc_pending_enquiry');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed.patientName) setPatientName(parsed.patientName);
          if (parsed.phone) setPhone(parsed.phone);
          if (parsed.email) setEmail(parsed.email);
          if (parsed.city) setCity(parsed.city);
          if (parsed.message) setMessage(parsed.message);
        }
      } catch {}
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setRequireLogin(false);
    setLoading(true);

    try {
      const res = await fetch('/api/enquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientName,
          phone,
          email,
          city,
          serviceId: Number(serviceId),
          hospitalId,
          message,
          preferredContactTime,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.requireLogin || res.status === 409) {
          setRequireLogin(true);
          try {
            localStorage.setItem(
              'cbc_pending_enquiry',
              JSON.stringify({
                patientName,
                phone,
                email,
                city,
                serviceId: Number(serviceId),
                hospitalId,
                hospitalName,
                message,
                preferredContactTime,
                returnUrl: typeof window !== 'undefined' ? window.location.pathname + window.location.search : '',
              })
            );
          } catch (storageErr) {
            console.warn(storageErr);
          }
          setErrorMessage(data.error || 'An account with this email already exists. Please log in to complete your enquiry.');
        } else {
          setErrorMessage(data.error || 'Failed to submit enquiry. Please try again.');
        }
      } else {
        setIsSuccess(true);
        try {
          localStorage.removeItem('cbc_pending_enquiry');
        } catch {}
      }
    } catch {
      setErrorMessage('Network error while submitting enquiry.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setIsSuccess(false);
    setRequireLogin(false);
    setErrorMessage('');
    setPatientName('');
    setPhone('');
    setEmail('');
    setCity('');
    setMessage('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="bg-[#101828] text-white p-5 sm:p-6 flex justify-between items-center border-b border-gray-800 flex-shrink-0">
          <div>
            <span className="text-xs font-semibold text-[#ec2c6c] uppercase tracking-wider">
              Hospital Service Enquiry
            </span>
            <h3 className="text-lg sm:text-xl font-bold text-white mt-0.5">{hospitalName}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-white rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1">
          {isSuccess ? (
            <div className="text-center py-8 space-y-4">
              <CheckCircle2 className="w-16 h-16 text-[#ec2c6c] mx-auto animate-bounce" />
              <h4 className="text-2xl font-bold text-gray-900">Thank You for Your Enquiry!</h4>
              <p className="text-gray-600 text-sm leading-relaxed max-w-md mx-auto">
                Your enquiry has been submitted successfully to <strong>{hospitalName}</strong>. A medical coordinator will contact you shortly regarding your treatment preferences.
              </p>
              <div className="pt-4">
                <button onClick={handleReset} className="cbc-btn-primary w-full text-sm">
                  Close Window
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {requireLogin ? (
                <div className="p-4 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl space-y-3">
                  <div className="flex items-start space-x-2">
                    <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div className="text-xs space-y-1">
                      <p className="font-bold text-amber-900">Account Already Exists</p>
                      <p className="text-amber-800">
                        An account with <strong>{email}</strong> already exists. Your form details are saved. Please log in to complete and link your enquiry.
                      </p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <a
                      href={`/login?email=${encodeURIComponent(email)}&redirect=${encodeURIComponent(typeof window !== 'undefined' ? window.location.pathname + window.location.search : '')}`}
                      className="cbc-btn-primary block text-center text-xs py-2.5 font-bold"
                    >
                      Log In & Submit Enquiry
                    </a>
                    <div className="text-center">
                      <a
                        href={`/forgot-password?email=${encodeURIComponent(email)}`}
                        className="text-[11px] font-bold text-gray-600 hover:text-[#ec2c6c] underline"
                      >
                        Forgot your password? Get a new one
                      </a>
                    </div>
                  </div>
                </div>
              ) : errorMessage ? (
                <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl flex items-start space-x-2">
                  <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              ) : null}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    Patient Name * <span className="text-[10px] text-gray-700 font-bold">(Max 50 chars)</span>
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={50}
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}
                    placeholder="Full Name (Max 50 chars)"
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#ec2c6c]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 9876543210"
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#ec2c6c]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="email@example.com"
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#ec2c6c]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    Your City *
                  </label>
                  <input
                    type="text"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="e.g. Mumbai, Delhi"
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#ec2c6c]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1 flex items-center justify-between">
                  <span>Medical Service Needed *</span>
                  <span className="text-[10px] text-pink-600 font-bold bg-pink-50 px-2 py-0.5 rounded-full border border-pink-100">
                    Offered by {hospitalName} ({availableServices.length})
                  </span>
                </label>
                <select
                  required
                  value={Number.isNaN(Number(serviceId)) ? '' : String(serviceId)}
                  onChange={(e) => setServiceId(e.target.value ? Number(e.target.value) : '')}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#ec2c6c] cursor-pointer"
                >
                  <option value="" disabled>
                    Select Medical Service
                  </option>
                  {availableServices.map((s, idx) => (
                    <option key={s.id ? `service-${s.id}-${idx}` : `service-idx-${idx}`} value={s.id ?? ''}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Preferred Contact Time
                </label>
                <select
                  value={preferredContactTime}
                  onChange={(e) => setPreferredContactTime(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#ec2c6c]"
                >
                  <option value="Morning (9 AM - 12 PM)">Morning (9 AM - 12 PM)</option>
                  <option value="Afternoon (12 PM - 4 PM)">Afternoon (12 PM - 4 PM)</option>
                  <option value="Evening (4 PM - 8 PM)">Evening (4 PM - 8 PM)</option>
                  <option value="Anytime">Anytime</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Medical Enquiry Message
                </label>
                <textarea
                  rows={3}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Describe your medical condition or treatment requirements..."
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#ec2c6c]"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="cbc-btn-primary w-full text-base py-3 flex items-center justify-center space-x-2 shadow-lg"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Submitting Enquiry...</span>
                    </>
                  ) : (
                    <span>Submit Enquiry Now</span>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
