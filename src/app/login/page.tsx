'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Building2, ShieldCheck, AlertCircle, Loader2, KeyRound } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

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
      } else {
        if (data.user.role === 'HOSPITAL') {
          router.push('/hospital/dashboard');
        } else {
          router.push('/admin/dashboard');
        }
      }
    } catch {
      setErrorMessage('Network error during login.');
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
            <h1 className="text-2xl font-bold text-gray-900">Portal Login</h1>
            <p className="text-xs text-gray-500">
              Sign in to your Hospital Portal or Admin Management Dashboard.
            </p>
          </div>

          {errorMessage && (
            <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl flex items-start space-x-2">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Account Email *
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="hospital@example.com"
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#ec2c6c]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Password *
              </label>
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

          <div className="p-4 bg-gray-50 rounded-xl text-xs text-gray-600 space-y-1">
            <p className="font-semibold text-gray-900">Demo Credentials:</p>
            <p>• <strong>Hospital Admin:</strong> hospital@apollofertility-mumbai.com / Hospital123!</p>
            <p>• <strong>Super Admin:</strong> admin@clinicbychoice.com / Admin123!</p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
