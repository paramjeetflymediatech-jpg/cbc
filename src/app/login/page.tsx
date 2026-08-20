'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Building2, ShieldCheck, AlertCircle, Loader2, KeyRound, CheckCircle2, FileText } from 'lucide-react';

function LoginFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [pendingEnquiryInfo, setPendingEnquiryInfo] = useState<{ patientName?: string; hospitalName?: string } | null>(null);

  useEffect(() => {
    // 1. Check query param email
    const qEmail = searchParams.get('email');
    if (qEmail) setEmail(qEmail);

    // 2. Check localStorage for pending enquiry
    try {
      const stored = localStorage.getItem('cbc_pending_enquiry');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.email && !qEmail) {
          setEmail(parsed.email);
        }
        setPendingEnquiryInfo({
          patientName: parsed.patientName,
          hospitalName: parsed.hospitalName,
        });
      }
    } catch {
      // ignore
    }
  }, [searchParams]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error || 'Login failed. Please check credentials.');
        setLoading(false);
        return;
      }

      // Check if there is a pending enquiry to auto-submit
      const returnUrl = searchParams.get('redirect');
      try {
        const stored = localStorage.getItem('cbc_pending_enquiry');
        if (stored) {
          const pendingData = JSON.parse(stored);
          if (pendingData && pendingData.hospitalId && pendingData.serviceId) {
            // Auto submit pending enquiry with newly authenticated user session
            await fetch('/api/enquiries', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(pendingData),
            });
            localStorage.removeItem('cbc_pending_enquiry');
          }
        }
      } catch (enquiryErr) {
        console.warn('Pending enquiry auto-submission warning:', enquiryErr);
      }

      // Redirect user according to role & pending destination
      if (data.user.role === 'HOSPITAL') {
        router.push('/hospital/dashboard');
      } else if (data.user.role === 'SUPER_ADMIN' || data.user.role === 'ADMIN') {
        router.push('/admin/dashboard');
      } else {
        // Patient role
        if (returnUrl) {
          const separator = returnUrl.includes('?') ? '&' : '?';
          router.push(`${returnUrl}${separator}enquiry_submitted=1`);
        } else {
          router.push('/patient/dashboard');
        }
      }
    } catch {
      setErrorMessage('Network error during login.');
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md bg-white p-8 sm:p-10 rounded-2xl shadow-xl border border-gray-100 space-y-6">
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-2xl bg-pink-50 text-[#ec2c6c] flex items-center justify-center mx-auto mb-3">
          <Building2 className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Sign In to CBC Portal</h1>
        <p className="text-xs text-gray-500">Access your hospital portal, patient dashboard, or admin panel</p>
      </div>

      {pendingEnquiryInfo && (
        <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl space-y-1 text-xs text-amber-900">
          <div className="flex items-center space-x-1.5 font-bold">
            <CheckCircle2 className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <span>Saved Enquiry Ready to Submit</span>
          </div>
          <p className="text-[11px] text-amber-800 leading-tight">
            Log in to automatically submit and link your enquiry
            {pendingEnquiryInfo.hospitalName ? ` for ${pendingEnquiryInfo.hospitalName}` : ''}.
          </p>
        </div>
      )}

      {errorMessage && (
        <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl flex items-start space-x-2">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleLogin} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
            Email Address
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@hospital.com"
            className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#ec2c6c]"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider">
              Password
            </label>
            <a
              href={`/forgot-password${email ? `?email=${encodeURIComponent(email)}` : ''}`}
              className="text-xs font-bold text-[#ec2c6c] hover:underline"
            >
              Forgot Password?
            </a>
          </div>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#ec2c6c]"
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
                <span>Signing In...</span>
              </>
            ) : (
              <span>Sign In To Portal</span>
            )}
          </button>
        </div>
      </form>

    
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />

      <main className="flex-1 flex items-center justify-center py-16 px-4">
        <Suspense
          fallback={
            <div className="w-full max-w-md bg-white p-12 rounded-2xl shadow-xl border border-gray-100 text-center space-y-3">
              <Loader2 className="w-8 h-8 text-[#ec2c6c] animate-spin mx-auto" />
              <p className="text-xs text-gray-500 font-medium">Loading login...</p>
            </div>
          }
        >
          <LoginFormContent />
        </Suspense>
      </main>

      <Footer />
    </div>
  );
}
