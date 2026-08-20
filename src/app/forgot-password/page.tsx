'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { KeyRound, CheckCircle2, AlertCircle, Loader2, ArrowLeft, Mail } from 'lucide-react';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    const qEmail = searchParams.get('email');
    if (qEmail) setEmail(qEmail);
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error || 'Failed to process password reset request.');
      } else {
        setSuccessMessage(
          data.message ||
            `A new temporary password has been sent to ${email}. Please check your inbox (and spam folder).`
        );
      }
    } catch {
      setErrorMessage('Network error while requesting password reset.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />

      <main className="flex-1 flex items-center justify-center py-16 px-4">
        <div className="w-full max-w-md bg-white p-8 sm:p-10 rounded-2xl shadow-xl border border-gray-100 space-y-6">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-full bg-pink-50 text-[#ec2c6c] flex items-center justify-center mx-auto mb-2">
              <KeyRound className="w-7 h-7" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Forgot Password</h1>
            <p className="text-xs text-gray-500 max-w-xs mx-auto">
              Enter your registered account email and we will send you a new temporary password to access your account.
            </p>
          </div>

          {errorMessage && (
            <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl flex items-start space-x-2">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage ? (
            <div className="p-6 bg-emerald-50/80 border border-emerald-200 rounded-2xl text-center space-y-4 animate-in fade-in zoom-in-95 duration-150">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h4 className="font-extrabold text-emerald-900 text-base">Password Sent!</h4>
                <p className="text-xs text-emerald-700 leading-relaxed font-medium">
                  {successMessage}
                </p>
              </div>

              <div className="pt-2 space-y-2">
                <a
                  href={`/login?email=${encodeURIComponent(email)}`}
                  className="cbc-btn-primary block text-center w-full text-sm py-2.5 font-bold shadow-md"
                >
                  Go to Login
                </a>
                <button
                  type="button"
                  onClick={() => setSuccessMessage('')}
                  className="text-xs text-gray-500 hover:text-gray-700 font-semibold cursor-pointer underline"
                >
                  Try a different email
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Your Account Email *
                </label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="user@example.com"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#ec2c6c] text-gray-900 font-medium"
                  />
                  <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5 pointer-events-none" />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="cbc-btn-primary w-full text-base py-3 flex items-center justify-center space-x-2 shadow-lg cursor-pointer"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Sending Password...</span>
                    </>
                  ) : (
                    <span>Send Temporary Password</span>
                  )}
                </button>
              </div>
            </form>
          )}

          <div className="pt-2 text-center border-t border-gray-100">
            <a
              href="/login"
              className="inline-flex items-center space-x-1.5 text-xs font-bold text-gray-600 hover:text-[#ec2c6c] transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Portal Login</span>
            </a>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
