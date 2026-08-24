'use client';

import React, { useState, useEffect } from 'react';
import { Phone, Mail, Send, Loader2, CheckCircle2, AlertCircle, ShieldCheck, Stethoscope } from 'lucide-react';

interface BlogContactSidebarProps {
  categoryName?: string | null;
  articleTitle?: string;
}

export default function BlogContactSidebar({ categoryName, articleTitle }: BlogContactSidebarProps) {
  const [patientName, setPatientName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [city, setCity] = useState('');
  const [treatment, setTreatment] = useState(categoryName || 'General Healthcare');
  const [message, setMessage] = useState('');
  const [preferredContactTime, setPreferredContactTime] = useState('Morning (9 AM - 12 PM)');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [requireLogin, setRequireLogin] = useState(false);
  const [isResumed, setIsResumed] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('cbc_pending_enquiry');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.patientName || parsed.email || parsed.phone || parsed.message) {
          if (parsed.patientName) setPatientName(parsed.patientName);
          if (parsed.phone) setPhone(parsed.phone);
          if (parsed.email) setEmail(parsed.email);
          if (parsed.city) setCity(parsed.city);
          if (parsed.message) setMessage(parsed.message);
          if (parsed.preferredContactTime) setPreferredContactTime(parsed.preferredContactTime);
          setIsResumed(true);
        }
      }
    } catch {}
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
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
          message: `[Blog Enquiry: ${articleTitle || 'Article'}] ${message}`,
          preferredContactTime,
          isGeneralContact: true,
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
                formType: 'blog_sidebar',
                patientName,
                phone,
                email,
                city,
                message,
                preferredContactTime,
                isGeneralContact: true,
                returnUrl: typeof window !== 'undefined' ? window.location.pathname + window.location.search : '',
              })
            );
          } catch (storageErr) {
            console.warn(storageErr);
          }
          setError(data.error || 'An account with this email already exists. Please log in first to send your enquiry.');
        } else {
          setError(data.error || 'Failed to send enquiry.');
        }
      } else {
        setSuccess(true);
        setPatientName('');
        setPhone('');
        setEmail('');
        setCity('');
        setMessage('');
        try {
          localStorage.removeItem('cbc_pending_enquiry');
        } catch {}
      }
    } catch {
      setError('Network error sending enquiry. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-h-[calc(100vh-110px)] overflow-y-auto scrollbar-none pr-1">
      {/* Contact Us Form Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-xl border border-pink-100 space-y-5">
        <div className="border-b border-gray-100 pb-4 space-y-1">
          <div className="inline-flex items-center space-x-1.5 text-xs font-bold uppercase tracking-wider text-[#fd1d74] bg-pink-50 px-2.5 py-0.5 rounded-full mb-1">
            <Stethoscope className="w-3.5 h-3.5" />
            <span>Instant Medical Enquiry</span>
          </div>
          <h3 className="text-xl font-extrabold text-gray-900">Contact Us For Consultation</h3>
          <p className="text-xs text-gray-500 font-medium leading-relaxed">
            Fill in your details below to get a free callback from top medical experts & hospitals.
          </p>
        </div>

        {success ? (
          <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-3 animate-fadeIn">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-emerald-900 text-base">Enquiry Sent Successfully!</h4>
            <p className="text-xs text-emerald-700 leading-relaxed font-medium">
              Thank you for reaching out. Our healthcare advisor will call you back shortly.
            </p>
            <button
              type="button"
              onClick={() => setSuccess(false)}
              className="mt-2 px-4 py-2 bg-emerald-600 text-white font-bold text-xs rounded-xl hover:bg-emerald-700 transition-colors"
            >
              Send Another Enquiry
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {isResumed && !requireLogin && (
              <div className="p-3 bg-pink-50/80 border border-pink-200 text-[#b02151] rounded-xl space-y-1 text-xs">
                <div className="flex items-center space-x-1.5 font-bold">
                  <CheckCircle2 className="w-4 h-4 text-[#ec2c6c] flex-shrink-0" />
                  <span>Saved Details Restored</span>
                </div>
                <p className="text-gray-600 pl-5 text-[11px] leading-relaxed">
                  Please review your query and click <strong>Submit Contact Enquiry</strong> below.
                </p>
              </div>
            )}

            {requireLogin ? (
              <div className="p-3.5 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl space-y-2 text-xs">
                <div className="flex items-start space-x-1.5 font-bold text-amber-900">
                  <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  <span>Account Already Exists</span>
                </div>
                <p className="text-[11px] text-amber-800 leading-tight">
                  Your enquiry is saved. Please log in with <strong>{email}</strong> to securely submit and link your request.
                </p>
                <div className="space-y-1.5 pt-1">
                  <a
                    href={`/login?email=${encodeURIComponent(email)}&redirect=${encodeURIComponent(typeof window !== 'undefined' ? window.location.pathname + window.location.search : '')}`}
                    className="cbc-btn-primary block text-center text-xs py-2 font-bold"
                  >
                    Log In & Continue Submission
                  </a>
                  <div className="text-center">
                    <a
                      href={`/forgot-password?email=${encodeURIComponent(email)}`}
                      className="text-[10px] font-bold text-gray-600 hover:text-[#ec2c6c] underline"
                    >
                      Forgot password? Reset here
                    </a>
                  </div>
                </div>
              </div>
            ) : error ? (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                <span>{error}</span>
              </div>
            ) : null}

            <div>
              <label className="block text-xs font-bold uppercase text-gray-700 mb-1">
                Full Name *
              </label>
              <input
                type="text"
                required
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                placeholder="e.g. Rajesh Kumar"
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-900 focus:outline-none focus:border-[#fd1d74] transition-colors"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold uppercase text-gray-700 mb-1">
                  Mobile No. *
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 9876543210"
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-900 focus:outline-none focus:border-[#fd1d74] transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-gray-700 mb-1">
                  City / Location
                </label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="e.g. Ludhiana"
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-900 focus:outline-none focus:border-[#fd1d74] transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-gray-700 mb-1">
                Email Address *
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="patient@example.com"
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-900 focus:outline-none focus:border-[#fd1d74] transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-gray-700 mb-1">
                Treatment / Department
              </label>
              <input
                type="text"
                value={treatment}
                onChange={(e) => setTreatment(e.target.value)}
                placeholder="e.g. Knee Replacement"
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-900 focus:outline-none focus:border-[#fd1d74] transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-gray-700 mb-1">
                Preferred Callback Time
              </label>
              <select
                value={preferredContactTime}
                onChange={(e) => setPreferredContactTime(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900 focus:outline-none focus:border-[#fd1d74]"
              >
                <option value="Morning (9 AM - 12 PM)">Morning (9 AM - 12 PM)</option>
                <option value="Afternoon (12 PM - 4 PM)">Afternoon (12 PM - 4 PM)</option>
                <option value="Evening (4 PM - 8 PM)">Evening (4 PM - 8 PM)</option>
                <option value="Anytime (Immediate Callback)">Anytime (Immediate Callback)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-gray-700 mb-1">
                Message / Query
              </label>
              <textarea
                rows={3}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Briefly describe your symptoms or consultation requirements..."
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:border-[#fd1d74]"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="cbc-btn-primary w-full text-xs font-extrabold py-3 shadow-md flex items-center justify-center space-x-2 transition-transform hover:scale-[1.01]"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              <span>{loading ? 'Submitting Enquiry...' : 'Submit Contact Enquiry'}</span>
            </button>
          </form>
        )}
      </div>

      {/* Direct Helpdesk Box */}
      <div className="bg-[#101828] text-white rounded-3xl p-6 shadow-xl border border-gray-800 space-y-4">
        <div className="flex items-center space-x-2">
          <ShieldCheck className="w-5 h-5 text-[#fd1d74]" />
          <h4 className="text-sm font-extrabold uppercase tracking-wider text-white">Direct Medical Help Desk</h4>
        </div>
        <p className="text-xs text-gray-300 leading-relaxed font-medium">
          Speak directly with our healthcare desk for emergency assistance, second opinions, or hospital registration.
        </p>

        <div className="space-y-3 text-xs font-bold pt-1">
          <a href="mailto:info@clinicbychoice.com" className="flex items-center space-x-3 text-gray-200 hover:text-[#fd1d74] transition-colors">
            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-[#fd1d74]">
              <Mail className="w-4 h-4" />
            </div>
            <span className="truncate">info@clinicbychoice.com</span>
          </a>
        </div>
      </div>
    </div>
  );
}
