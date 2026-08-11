'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { ShoppingBag, CheckCircle2, AlertCircle, Loader2, ShieldCheck, Zap } from 'lucide-react';

export default function HospitalPackagesPage() {
  const searchParams = useSearchParams();
  const statusParam = searchParams.get('status');
  const addedParam = searchParams.get('added');
  const balanceParam = searchParams.get('balance');
  const errorParam = searchParams.get('error');

  const [packages, setPackages] = useState<any[]>([]);
  const [activePackages, setActivePackages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasingId, setPurchasingId] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    fetch('/api/hospital/packages')
      .then((r) => r.json())
      .then((data) => {
        if (data.packages) setPackages(data.packages);
        if (data.activePackages) setActivePackages(data.activePackages);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleBuyPackage = async (packageId: number) => {
    setErrorMessage('');
    setPurchasingId(packageId);

    try {
      const res = await fetch('/api/payments/phonepe/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packageId }),
      });

      const data = await res.json();

      if (!res.ok || !data.redirectUrl) {
        setErrorMessage(data.error || 'Failed to initiate PhonePe checkout.');
      } else {
        // Redirect to PhonePe Gateway
        window.location.href = data.redirectUrl;
      }
    } catch {
      setErrorMessage('Network error initiating PhonePe payment.');
    } finally {
      setPurchasingId(null);
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading packages...</div>;

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-extrabold text-gray-900">Purchase Lead Packages</h1>
        <p className="text-xs text-gray-500">
          Enquiries consume 1 lead per patient enquiry. Purchased leads add directly to your existing balance.
        </p>
      </div>

      {statusParam === 'success' && (
        <div className="p-5 bg-emerald-50 border-2 border-emerald-200 text-emerald-900 rounded-2xl flex items-center space-x-3 shadow-md">
          <CheckCircle2 className="w-8 h-8 text-emerald-600 flex-shrink-0" />
          <div>
            <h3 className="font-bold text-base text-emerald-800">Payment Successful!</h3>
            <p className="text-xs text-emerald-700">
              Successfully credited <strong>+{addedParam || 0} leads</strong> to your hospital account. New balance: <strong>{balanceParam || 0} leads</strong>.
            </p>
          </div>
        </div>
      )}

      {errorParam && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl flex items-center space-x-2">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <span>Payment Error: {errorParam.replace(/_/g, ' ')}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl flex items-center space-x-2">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Package Selection Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {packages.map((pkg) => {
          const isPurchasing = purchasingId === pkg.id;
          return (
            <div
              key={pkg.id}
              className="cbc-card p-8 border-2 border-gray-100 flex flex-col justify-between space-y-6 hover:border-[#ec2c6c] transition-all relative overflow-hidden group"
            >
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#ec2c6c] bg-pink-50 px-3 py-1 rounded-full">
                    {pkg.validityDays ? `${pkg.validityDays} Days Validity` : 'Lifetime Validity'}
                  </span>
                  <Zap className="w-5 h-5 text-[#ec2c6c]" />
                </div>

                <h3 className="text-2xl font-extrabold text-gray-900">{pkg.name}</h3>

                <div className="flex items-baseline space-x-1">
                  <span className="text-4xl font-extrabold text-[#101828]">
                    ₹{Number(pkg.price).toLocaleString('en-IN')}
                  </span>
                  <span className="text-xs text-gray-500">/ package</span>
                </div>

                <div className="p-4 bg-pink-50/60 rounded-xl text-center">
                  <span className="text-2xl font-extrabold text-[#ec2c6c]">{pkg.leadCount}</span>
                  <span className="text-xs font-bold text-gray-700 block uppercase tracking-wider">
                    Verified Patient Leads
                  </span>
                </div>

                <p className="text-xs text-gray-600 leading-relaxed">{pkg.description}</p>
              </div>

              <div className="pt-4 border-t border-gray-100">
                <button
                  onClick={() => handleBuyPackage(pkg.id)}
                  disabled={isPurchasing}
                  className="cbc-btn-primary w-full text-sm py-3 flex items-center justify-center space-x-2 shadow-lg"
                >
                  {isPurchasing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Connecting PhonePe...</span>
                    </>
                  ) : (
                    <span>Buy Now with PhonePe</span>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Subscription History */}
      <div className="cbc-card p-6 border border-gray-100 space-y-4">
        <h3 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-2">Active Package Subscriptions</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-700">
            <thead className="bg-gray-50 text-xs font-bold uppercase text-gray-500">
              <tr>
                <th className="p-3">Package Name</th>
                <th className="p-3">Leads Granted</th>
                <th className="p-3">Price Paid</th>
                <th className="p-3">Purchase Date</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {activePackages.map((ap) => (
                <tr key={ap.id}>
                  <td className="p-3 font-semibold text-gray-900">{ap.package?.name || 'Lead Package'}</td>
                  <td className="p-3 text-xs font-bold text-[#ec2c6c]">+{ap.leadLimit} Leads</td>
                  <td className="p-3 text-xs">₹{Number(ap.purchasePrice).toLocaleString('en-IN')}</td>
                  <td className="p-3 text-xs text-gray-500">{new Date(ap.purchasedAt).toLocaleDateString('en-IN')}</td>
                  <td className="p-3">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700">
                      {ap.status}
                    </span>
                  </td>
                </tr>
              ))}
              {activePackages.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-gray-500 text-sm">
                    No active packages purchased yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
