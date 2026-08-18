'use client';

import React, { useState, useEffect } from 'react';
import { CreditCard, CheckCircle2, XCircle, Clock, ChevronLeft, ChevronRight } from 'lucide-react';

export default function HospitalPaymentsPage() {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  useEffect(() => {
    fetch('/api/hospital/packages')
      .then((r) => r.json())
      .then((data) => {
        if (data.recentPayments) setPayments(data.recentPayments);
      })
      .finally(() => setLoading(false));
  }, []);

  const totalPages = Math.ceil(payments.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, payments.length);
  const paginatedPayments = payments.slice(startIndex, endIndex);

  if (loading) return <div className="p-8 text-center text-gray-500">Loading payment receipts...</div>;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">Payment Receipts & Orders</h1>
          <p className="text-xs text-gray-500">View transaction history and PhonePe payment statuses.</p>
        </div>

        {payments.length > 0 && (
          <span className="text-xs font-medium text-gray-500">
            Showing {startIndex + 1}–{endIndex} of {payments.length} orders
          </span>
        )}
      </div>

      <div className="cbc-card border border-gray-100 overflow-hidden space-y-4 p-4">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-700">
            <thead className="bg-gray-50 text-xs font-bold uppercase text-gray-500 tracking-wider">
              <tr>
                <th className="p-4">Transaction ID</th>
                <th className="p-4">Package</th>
                <th className="p-4">Amount</th>
                <th className="p-4">Gateway</th>
                <th className="p-4">Date</th>
                <th className="p-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginatedPayments.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50/50">
                  <td className="p-4 font-mono text-xs font-semibold text-gray-900">
                    {p.merchantTransactionId}
                  </td>
                  <td className="p-4 font-semibold text-xs text-[#ec2c6c]">
                    {p.package?.name || 'Lead Package'}
                  </td>
                  <td className="p-4 text-xs font-bold text-gray-900">
                    ₹{Number(p.amount).toLocaleString('en-IN')}
                  </td>
                  <td className="p-4 text-xs font-semibold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-md w-fit">
                    {p.gateway}
                  </td>
                  <td className="p-4 text-xs text-gray-500">
                    {new Date(p.createdAt).toLocaleString('en-IN')}
                  </td>
                  <td className="p-4">
                    <span
                      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
                        p.status === 'SUCCESS'
                          ? 'bg-emerald-100 text-emerald-800'
                          : p.status === 'PENDING'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {p.status === 'SUCCESS' && <CheckCircle2 className="w-3 h-3 mr-1" />}
                      {p.status === 'PENDING' && <Clock className="w-3 h-3 mr-1" />}
                      {p.status === 'FAILED' && <XCircle className="w-3 h-3 mr-1" />}
                      {p.status}
                    </span>
                  </td>
                </tr>
              ))}
              {payments.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-500 text-sm">
                    No payment history recorded yet.
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
    </div>
  );
}
