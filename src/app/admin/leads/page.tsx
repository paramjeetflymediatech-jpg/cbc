'use client';

import React, { useState, useEffect } from 'react';
import { Users, History, Phone, Mail, Building2, Filter, ShoppingBag, ArrowDownRight, ArrowUpRight, Sparkles, CheckCircle2 } from 'lucide-react';

export default function AdminLeadsPage() {
  const [hospitals, setHospitals] = useState<any[]>([]);
  const [leads, setLeads] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedHospitalId, setSelectedHospitalId] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'leads' | 'purchases' | 'audit'>('leads');
  const [txTypeFilter, setTxTypeFilter] = useState<string>('');

  useEffect(() => {
    fetch('/api/admin/leads')
      .then((r) => r.json())
      .then((data) => {
        if (data.hospitals) setHospitals(data.hospitals);
        if (data.leads) setLeads(data.leads);
        if (data.leadTransactions) setTransactions(data.leadTransactions);
      })
      .finally(() => setLoading(false));
  }, []);

  // Filtered Leads
  const filteredLeads = selectedHospitalId
    ? leads.filter((l) => String(l.hospitalId) === selectedHospitalId)
    : leads;

  // Filtered Transactions
  const filteredTransactions = transactions.filter((tx) => {
    const matchesHospital = !selectedHospitalId || String(tx.hospitalId) === selectedHospitalId;
    const matchesType = !txTypeFilter || tx.transactionType === txTypeFilter;
    return matchesHospital && matchesType;
  });

  // Calculate metrics for selected hospital or platform overall
  const selectedHospitalObj = hospitals.find((h) => String(h.id) === selectedHospitalId);

  const totalRemaining = selectedHospitalObj
    ? selectedHospitalObj.leadsRemaining
    : hospitals.reduce((sum, h) => sum + (h.leadsRemaining || 0), 0);

  const totalPurchased = selectedHospitalObj
    ? selectedHospitalObj.totalLeadsPurchased
    : hospitals.reduce((sum, h) => sum + (h.totalLeadsPurchased || 0), 0);

  const totalUsed = selectedHospitalObj
    ? selectedHospitalObj.totalLeadsUsed
    : hospitals.reduce((sum, h) => sum + (h.totalLeadsUsed || 0), 0);

  if (loading) return <div className="p-8 text-center text-gray-500">Loading lead audit logs...</div>;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 pb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">Hospital Leads & Package Purchase History</h1>
          <p className="text-xs text-gray-500">Filter hospital-wise to inspect lead balances, package purchases, and patient enquiry audits.</p>
        </div>

        {/* Hospital Filter Dropdown */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 bg-white border border-gray-200 rounded-xl px-3 py-1.5 shadow-xs">
            <Filter className="w-4 h-4 text-[#b02151]" />
            <select
              value={selectedHospitalId}
              onChange={(e) => setSelectedHospitalId(e.target.value)}
              className="bg-transparent text-xs font-bold text-gray-900 focus:outline-none cursor-pointer"
            >
              <option value="">All Hospitals ({hospitals.length})</option>
              {hospitals.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.name} ({h.city})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Hospital Metrics Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-extrabold uppercase text-gray-400 tracking-wider">Available Leads Balance</span>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-emerald-600 mt-1">{totalRemaining}</h3>
            <p className="text-[11px] text-gray-500 mt-0.5">Ready to receive patient inquiries</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Sparkles className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-extrabold uppercase text-gray-400 tracking-wider">Total Leads Purchased</span>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-blue-600 mt-1">{totalPurchased}</h3>
            <p className="text-[11px] text-gray-500 mt-0.5">Cumulative credited package leads</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <ShoppingBag className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-extrabold uppercase text-gray-400 tracking-wider">Total Leads Used</span>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-[#b02151] mt-1">{totalUsed}</h3>
            <p className="text-[11px] text-gray-500 mt-0.5">Deducted for patient consultations</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-pink-50 text-[#b02151] flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-200 pb-2">
        <div className="flex bg-gray-100 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('leads')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'leads' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-500'
            }`}
          >
            Patient Leads ({filteredLeads.length})
          </button>

          <button
            onClick={() => {
              setActiveTab('purchases');
              setTxTypeFilter('PACKAGE_PURCHASE');
            }}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'purchases' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-500'
            }`}
          >
            Package Purchase History
          </button>

          <button
            onClick={() => {
              setActiveTab('audit');
              setTxTypeFilter('');
            }}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'audit' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-500'
            }`}
          >
            All Audit Transactions ({filteredTransactions.length})
          </button>
        </div>

        {activeTab === 'audit' && (
          <select
            value={txTypeFilter}
            onChange={(e) => setTxTypeFilter(e.target.value)}
            className="px-3 py-1.5 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-700"
          >
            <option value="">All Transaction Types</option>
            <option value="PACKAGE_PURCHASE">Package Purchases Only</option>
            <option value="LEAD_CONSUMED">Lead Deductions Only</option>
          </select>
        )}
      </div>

      {/* Tab Content 1: Patient Leads */}
      {activeTab === 'leads' && (
        <div className="cbc-card border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-700">
              <thead className="bg-gray-50 text-xs font-bold uppercase text-gray-500">
                <tr>
                  <th className="p-4">Patient Name</th>
                  <th className="p-4">Hospital Name</th>
                  <th className="p-4">Service</th>
                  <th className="p-4">Date</th>
                  <th className="p-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredLeads.map((l) => (
                  <tr key={l.id} className="hover:bg-gray-50/50">
                    <td className="p-4 font-bold text-gray-900">
                      {l.patientName}
                      <p className="text-xs text-gray-500 font-normal">{l.phone} • {l.email}</p>
                    </td>
                    <td className="p-4 text-xs font-semibold text-gray-900">{l.hospital?.name || 'General Platform'}</td>
                    <td className="p-4 text-xs font-medium text-[#ec2c6c]">{l.service?.name || 'General Consultation'}</td>
                    <td className="p-4 text-xs text-gray-500">{new Date(l.createdAt).toLocaleString('en-IN')}</td>
                    <td className="p-4">
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-pink-100 text-[#ec2c6c]">
                        {l.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredLeads.length === 0 && (
              <div className="text-center py-12 text-gray-500 text-sm">
                No patient leads found for this selection.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab Content 2: Package Purchase History */}
      {activeTab === 'purchases' && (
        <div className="cbc-card border border-gray-100 overflow-hidden">
          <div className="p-4 bg-gray-50 border-b border-gray-100 text-xs font-bold uppercase tracking-wider text-gray-700 flex items-center justify-between">
            <span>Hospital Package Subscriptions & Credit History</span>
            <span className="text-[#b02151]">Verified Payments</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-700">
              <thead className="bg-gray-50 text-xs font-bold uppercase text-gray-500">
                <tr>
                  <th className="p-4">Hospital Name</th>
                  <th className="p-4">Transaction Type</th>
                  <th className="p-4">Leads Credited</th>
                  <th className="p-4">Balance Log</th>
                  <th className="p-4">Package Details</th>
                  <th className="p-4">Purchase Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredTransactions
                  .filter((tx) => tx.transactionType === 'PACKAGE_PURCHASE')
                  .map((tx) => (
                    <tr key={tx.id} className="hover:bg-gray-50/50">
                      <td className="p-4 font-bold text-gray-900 flex items-center">
                        <Building2 className="w-4 h-4 mr-2 text-[#b02151]" />
                        {tx.hospital?.name}
                      </td>
                      <td className="p-4">
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 inline-flex items-center">
                          <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                          Package Purchased
                        </span>
                      </td>
                      <td className="p-4 font-extrabold text-sm text-emerald-600">
                        +{tx.leadAmount} Leads
                      </td>
                      <td className="p-4 text-xs text-gray-600">
                        {tx.balanceBefore} ➔ <strong className="text-gray-900">{tx.balanceAfter} Leads</strong>
                      </td>
                      <td className="p-4 text-xs text-gray-700 font-medium">{tx.description}</td>
                      <td className="p-4 text-xs text-gray-500">{new Date(tx.createdAt).toLocaleString('en-IN')}</td>
                    </tr>
                  ))}
              </tbody>
            </table>

            {filteredTransactions.filter((tx) => tx.transactionType === 'PACKAGE_PURCHASE').length === 0 && (
              <div className="text-center py-12 text-gray-500 text-sm">
                No package purchase history recorded for this selection.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab Content 3: All Audit Transactions */}
      {activeTab === 'audit' && (
        <div className="cbc-card border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-700">
              <thead className="bg-gray-50 text-xs font-bold uppercase text-gray-500">
                <tr>
                  <th className="p-4">Hospital Name</th>
                  <th className="p-4">Type</th>
                  <th className="p-4">Lead Amount</th>
                  <th className="p-4">Balance Before / After</th>
                  <th className="p-4">Description</th>
                  <th className="p-4">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-gray-50/50">
                    <td className="p-4 font-bold text-gray-900">{tx.hospital?.name}</td>
                    <td className="p-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          tx.transactionType === 'PACKAGE_PURCHASE'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {tx.transactionType}
                      </span>
                    </td>
                    <td className="p-4 font-extrabold text-xs">
                      {tx.leadAmount > 0 ? (
                        <span className="text-emerald-600">+{tx.leadAmount} Leads</span>
                      ) : (
                        <span className="text-amber-600">{tx.leadAmount} Lead</span>
                      )}
                    </td>
                    <td className="p-4 text-xs text-gray-600">
                      {tx.balanceBefore} ➔ <strong>{tx.balanceAfter} Leads</strong>
                    </td>
                    <td className="p-4 text-xs text-gray-500">{tx.description}</td>
                    <td className="p-4 text-xs text-gray-400">{new Date(tx.createdAt).toLocaleString('en-IN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredTransactions.length === 0 && (
              <div className="text-center py-12 text-gray-500 text-sm">
                No audit log transactions found for this selection.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
