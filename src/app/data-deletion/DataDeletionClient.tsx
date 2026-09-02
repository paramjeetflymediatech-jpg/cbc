'use client';

import React, { useState } from 'react';
import { Mail, Phone, AlertTriangle, CheckCircle2, Loader2, Trash2, Lock, Eye, EyeOff } from 'lucide-react';

export default function DataDeletionClient() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [phone, setPhone] = useState('');
  const [reason, setReason] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [referenceId, setReferenceId] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!password) {
      setErrorMessage('Please enter your account password to verify your identity.');
      return;
    }

    if (!confirmed) {
      setErrorMessage('Please confirm that you understand this action is permanent.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/data-deletion-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          phone,
          reason,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit request.');
      }

      setReferenceId(data.referenceId || 'DEL-CONFIRMED');
      setSubmitted(true);
    } catch (err: any) {
      setErrorMessage(err.message || 'Error submitting request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="p-8 bg-emerald-50 rounded-2xl border border-emerald-200 text-center space-y-4">
        <CheckCircle2 className="w-16 h-16 text-emerald-600 mx-auto" />
        <h3 className="text-xl font-extrabold text-emerald-900">
          Deletion Request Processed
        </h3>
        <p className="text-xs sm:text-sm text-emerald-800 leading-relaxed max-w-md mx-auto">
          Your request has been recorded. All personal and consultation records associated with <strong>{email}</strong> have been marked and purged from our active systems.
        </p>
        <div className="inline-block px-4 py-2 bg-emerald-100/70 border border-emerald-300 rounded-xl text-xs font-mono font-bold text-emerald-900">
          Reference ID: {referenceId}
        </div>
        <p className="text-xs text-emerald-700">
          A confirmation record has been logged for your account. If you ever wish to use Clinic By Choice again, you are welcome to register a new account at any time.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {errorMessage && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs sm:text-sm flex items-start space-x-2">
          <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0 text-rose-600" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Email */}
      <div>
        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
          Registered Email Address <span className="text-rose-600">*</span>
        </label>
        <div className="relative">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="e.g. yourname@example.com"
            className="w-full px-4 py-3 pl-10 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#ec2c6c] focus:border-transparent text-sm"
          />
          <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
        </div>
      </div>

      {/* Password (Security Verification) */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
            Account Password <span className="text-rose-600">*</span>
          </label>
          <span className="text-[11px] text-gray-400">Identity verification</span>
        </div>
        <div className="relative">
          <input
            type={showPassword ? 'text' : 'password'}
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your account password"
            className="w-full px-4 py-3 pl-10 pr-10 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#ec2c6c] focus:border-transparent text-sm"
          />
          <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3.5 top-3 text-gray-400 hover:text-gray-600 focus:outline-none p-0.5"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        <p className="mt-1 text-[11px] text-gray-500">
          Required for security to confirm that you are the verified owner of this account.
        </p>
      </div>

      {/* Phone (Optional) */}
      <div>
        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
          Registered Phone Number (Optional)
        </label>
        <div className="relative">
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="e.g. +91 98765 43210"
            className="w-full px-4 py-3 pl-10 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#ec2c6c] focus:border-transparent text-sm"
          />
          <Phone className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
        </div>
      </div>

      {/* Reason */}
      <div>
        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
          Reason for Deletion (Optional)
        </label>
        <textarea
          rows={3}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Let us know how we can improve, or specify particular records..."
          className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#ec2c6c] focus:border-transparent text-sm"
        />
      </div>

      {/* Confirmation Checkbox */}
      <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200/80">
        <label className="flex items-start space-x-3 cursor-pointer">
          <input
            type="checkbox"
            checked={confirmed}
            onChange={(e) => setConfirmed(e.target.checked)}
            className="mt-1 w-4 h-4 rounded text-[#ec2c6c] focus:ring-[#ec2c6c] border-gray-300"
          />
          <span className="text-xs text-amber-900 leading-relaxed font-medium">
            I understand that submitting this request will permanently delete my profile, saved preferences, and past consultation records. This action cannot be reversed.
          </span>
        </label>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-[#ec2c6c] hover:bg-[#d41f5a] disabled:opacity-60 text-white font-extrabold py-3.5 px-6 rounded-xl transition-colors shadow-sm flex items-center justify-center space-x-2 text-sm"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Processing Request...</span>
          </>
        ) : (
          <>
            <Trash2 className="w-4 h-4" />
            <span>Submit Data Deletion Request</span>
          </>
        )}
      </button>
    </form>
  );
}
