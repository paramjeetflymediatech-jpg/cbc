'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  ShoppingBag,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ShieldCheck,
  Zap,
  ChevronLeft,
  ChevronRight,
  Eye,
  X,
  Calendar,
  CreditCard,
  Package as PackageIcon,
  Sparkles,
  Clock,
} from 'lucide-react';

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
  const [selectedSubscription, setSelectedSubscription] = useState<any | null>(null);

  // Pagination for Active Package Subscriptions
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    fetch('/api/hospital/packages')
      .then((r) => r.json())
      .then((data) => {
        if (data.packages) setPackages(data.packages);
        if (data.activePackages) setActivePackages(data.activePackages);
      })
      .finally(() => setLoading(false));
  }, []);

  const totalPages = Math.ceil(activePackages.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, activePackages.length);
  const paginatedActivePackages = activePackages.slice(startIndex, endIndex);

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
              Successfully credited <strong>+{addedParam || 0} leads</strong> to your hospital account. New balance:{' '}
              <strong>{balanceParam || 0} leads</strong>.
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

      {/* Active Package Subscriptions */}
      <div className="cbc-card p-6 border border-gray-100 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-2">
          <h3 className="text-sm font-bold text-gray-900">Active Package Subscriptions</h3>
          {activePackages.length > 0 && (
            <span className="text-xs font-medium text-gray-500">
              Showing {startIndex + 1}–{endIndex} of {activePackages.length} subscriptions
            </span>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-700">
            <thead className="bg-gray-50 text-xs font-bold uppercase text-gray-500">
              <tr>
                <th className="p-3">Package Name</th>
                <th className="p-3">Leads Granted</th>
                <th className="p-3">Price Paid</th>
                <th className="p-3">Purchase Date</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginatedActivePackages.map((ap) => (
                <tr key={ap.id} className="hover:bg-gray-50/50">
                  <td className="p-3 font-semibold text-gray-900">{ap.package?.name || 'Lead Package'}</td>
                  <td className="p-3 text-xs font-bold text-[#ec2c6c]">+{ap.leadLimit} Leads</td>
                  <td className="p-3 text-xs">₹{Number(ap.purchasePrice).toLocaleString('en-IN')}</td>
                  <td className="p-3 text-xs text-gray-500">{new Date(ap.purchasedAt).toLocaleDateString('en-IN')}</td>
                  <td className="p-3">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700">
                      {ap.status}
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    <button
                      onClick={() => setSelectedSubscription(ap)}
                      className="px-3 py-1 bg-[#ec2c6c]/10 text-[#ec2c6c] hover:bg-[#ec2c6c] hover:text-white transition-colors rounded-lg text-xs font-bold inline-flex items-center space-x-1 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>View Details</span>
                    </button>
                  </td>
                </tr>
              ))}
              {activePackages.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-gray-500 text-sm">
                    No active packages purchased yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-4 border-t border-gray-100 text-xs">
            <button
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center space-x-1 font-semibold transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Previous</span>
            </button>

            <div className="flex items-center space-x-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`w-7 h-7 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                    currentPage === pageNum
                      ? 'bg-[#ec2c6c] text-white shadow-xs'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {pageNum}
                </button>
              ))}
            </div>

            <button
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center space-x-1 font-semibold transition-colors cursor-pointer"
            >
              <span>Next</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Subscription Details Modal */}
      {selectedSubscription && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-gray-100 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setSelectedSubscription(null)}
              className="absolute top-5 right-5 p-1 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Title & Header */}
            <div className="flex items-start space-x-4 border-b border-gray-100 pb-4">
              <div className="w-12 h-12 rounded-2xl bg-pink-50 text-[#ec2c6c] flex items-center justify-center flex-shrink-0">
                <PackageIcon className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <h3 className="text-xl font-extrabold text-gray-900">
                    {selectedSubscription.package?.name || 'Lead Subscription Package'}
                  </h3>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                      selectedSubscription.status === 'ACTIVE'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {selectedSubscription.status}
                  </span>
                </div>
                <p className="text-xs text-gray-500 font-mono">Subscription ID: #{selectedSubscription.id}</p>
              </div>
            </div>

            {/* Lead Usage & Credit Summary Card */}
            <div className="p-5 bg-gradient-to-br from-pink-50/70 to-purple-50/40 rounded-2xl border border-pink-100 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#ec2c6c] uppercase tracking-wider flex items-center space-x-1">
                  <Sparkles className="w-4 h-4 mr-1" />
                  <span>Lead Allocation & Usage</span>
                </span>
                <span className="text-xs font-extrabold text-gray-900">
                  {selectedSubscription.leadsUsed || 0} / {selectedSubscription.leadLimit} Leads Used
                </span>
              </div>

              {/* Lead Progress Bar */}
              <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-[#ec2c6c] h-2.5 rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(
                      100,
                      Math.round(((selectedSubscription.leadsUsed || 0) / (selectedSubscription.leadLimit || 1)) * 100)
                    )}%`,
                  }}
                />
              </div>

              <div className="grid grid-cols-3 gap-3 text-center pt-1">
                <div className="p-3 bg-white rounded-xl border border-gray-100 shadow-2xs">
                  <span className="text-xs text-gray-500 font-medium block">Total Granted</span>
                  <span className="text-lg font-black text-[#101828]">+{selectedSubscription.leadLimit}</span>
                </div>
                <div className="p-3 bg-white rounded-xl border border-gray-100 shadow-2xs">
                  <span className="text-xs text-gray-500 font-medium block">Leads Used</span>
                  <span className="text-lg font-black text-[#ec2c6c]">{selectedSubscription.leadsUsed || 0}</span>
                </div>
                <div className="p-3 bg-white rounded-xl border border-gray-100 shadow-2xs">
                  <span className="text-xs text-gray-500 font-medium block">Unused / Remaining</span>
                  <span className="text-lg font-black text-emerald-600">
                    {selectedSubscription.leadsRemaining ??
                      (selectedSubscription.leadLimit - (selectedSubscription.leadsUsed || 0))}
                  </span>
                </div>
              </div>
            </div>

            {/* Payment & Audit Info Grid */}
            <div className="space-y-3">
              <h4 className="text-xs font-extrabold text-gray-400 uppercase tracking-wider">
                Payment Audit & Order Details
              </h4>
              <div className="bg-gray-50 rounded-2xl p-4 space-y-3 text-xs text-gray-700 font-medium border border-gray-100">
                <div className="flex justify-between items-center border-b border-gray-200/60 pb-2">
                  <span className="text-gray-500 flex items-center">
                    <CreditCard className="w-3.5 h-3.5 mr-1.5 text-gray-400" /> Amount Paid:
                  </span>
                  <span className="font-extrabold text-gray-900 text-sm">
                    ₹{Number(selectedSubscription.purchasePrice).toLocaleString('en-IN')}{' '}
                    <span className="text-[10px] text-gray-500 font-normal">({selectedSubscription.currency || 'INR'})</span>
                  </span>
                </div>

                <div className="flex justify-between items-center border-b border-gray-200/60 pb-2">
                  <span className="text-gray-500 flex items-center">
                    <Calendar className="w-3.5 h-3.5 mr-1.5 text-gray-400" /> Purchase Date:
                  </span>
                  <span className="font-bold text-gray-800">
                    {new Date(selectedSubscription.purchasedAt).toLocaleString('en-IN')}
                  </span>
                </div>

                <div className="flex justify-between items-center border-b border-gray-200/60 pb-2">
                  <span className="text-gray-500 flex items-center">
                    <Clock className="w-3.5 h-3.5 mr-1.5 text-gray-400" /> Expiry Validity:
                  </span>
                  <span className="font-bold text-gray-800">
                    {selectedSubscription.expiresAt
                      ? new Date(selectedSubscription.expiresAt).toLocaleDateString('en-IN')
                      : selectedSubscription.package?.validityDays
                      ? `${selectedSubscription.package.validityDays} Days`
                      : 'Lifetime Validity'}
                  </span>
                </div>

                {selectedSubscription.payment && (
                  <>
                    <div className="flex justify-between items-center border-b border-gray-200/60 pb-2">
                      <span className="text-gray-500">Merchant Transaction ID:</span>
                      <span className="font-mono font-bold text-gray-900">
                        {selectedSubscription.payment.merchantTransactionId}
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-gray-500">Payment Gateway:</span>
                      <span className="font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md">
                        {selectedSubscription.payment.gateway || 'PhonePe'}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Package Features Description */}
            {selectedSubscription.package?.description && (
              <div className="p-4 bg-gray-50/80 rounded-2xl border border-gray-100 space-y-1">
                <span className="text-xs font-extrabold text-gray-500 uppercase tracking-wider block">
                  Package Description
                </span>
                <p className="text-xs text-gray-600 leading-relaxed font-medium">
                  {selectedSubscription.package.description}
                </p>
              </div>
            )}

            {/* Modal Actions */}
            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                onClick={() => setSelectedSubscription(null)}
                className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 text-xs font-bold transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
