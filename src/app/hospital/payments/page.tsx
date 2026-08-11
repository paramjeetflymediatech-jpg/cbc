'use client';

import React, { useState, useEffect } from 'react';
import { CreditCard, CheckCircle2, XCircle, Clock } from 'lucide-react';

export default function HospitalPaymentsPage() {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/hospital/packages')
      .then((r) => r.json())
      .then((data) => {
        if (data.recentPayments) setPayments(data.recentPayments);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-8 text-center text-gray-500">Loading payment receipts...</div>;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-extrabold text-gray-900">Payment Receipts & Orders</h1>
        <p className="text-xs text-gray-500">View transaction history and PhonePe payment statuses.</p>
      </div>

      <div className="cbc-card border border-gray-100 overflow-hidden">
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
              {payments.map((p) => (
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
      </div>
    </div>
  );
}
