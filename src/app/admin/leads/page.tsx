'use client';

/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
import { Users, Phone, Mail, Building2, Filter, ShoppingBag, Sparkles, CheckCircle2, Eye, X, MapPin, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';

export default function AdminLeadsPage() {
  const [hospitals, setHospitals] = useState<any[]>([]);
  const [leads, setLeads] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedHospitalId, setSelectedHospitalId] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'leads' | 'purchases' | 'audit'>('leads');
  const [txTypeFilter, setTxTypeFilter] = useState<string>('');

  // Pagination State
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  // View Modals & Delete State
  const [viewLead, setViewLead] = useState<any | null>(null);
  const [viewTransaction, setViewTransaction] = useState<any | null>(null);
  const [deletingItem, setDeletingItem] = useState<{ id: number; type: 'lead' | 'transaction'; name: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  const handleDeleteConfirm = async () => {
    if (!deletingItem) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/leads?id=${deletingItem.id}&type=${deletingItem.type}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        if (deletingItem.type === 'lead') {
          setLeads((prev) => prev.filter((l) => l.id !== deletingItem.id));
        } else {
          setTransactions((prev) => prev.filter((tx) => tx.id !== deletingItem.id));
        }
        setDeletingItem(null);
      }
    } catch {
      // ignore
    } finally {
      setDeleting(false);
    }
  };

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

  const filteredPurchases = filteredTransactions.filter((tx) => tx.transactionType === 'PACKAGE_PURCHASE');

  // Paginated Data & Counts
  const currentTabTotalItems =
    activeTab === 'leads'
      ? filteredLeads.length
      : activeTab === 'purchases'
      ? filteredPurchases.length
      : filteredTransactions.length;

  const totalPages = Math.ceil(currentTabTotalItems / pageSize) || 1;
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const paginatedLeads = filteredLeads.slice((safeCurrentPage - 1) * pageSize, safeCurrentPage * pageSize);
  const paginatedPurchases = filteredPurchases.slice((safeCurrentPage - 1) * pageSize, safeCurrentPage * pageSize);
  const paginatedAudit = filteredTransactions.slice((safeCurrentPage - 1) * pageSize, safeCurrentPage * pageSize);

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
              onChange={(e) => {
                setSelectedHospitalId(e.target.value);
                setCurrentPage(1);
              }}
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
            onClick={() => {
              setActiveTab('leads');
              setCurrentPage(1);
            }}
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
              setCurrentPage(1);
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
              setCurrentPage(1);
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
            onChange={(e) => {
              setTxTypeFilter(e.target.value);
              setCurrentPage(1);
            }}
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
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paginatedLeads.map((l) => (
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
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        <button
                          onClick={() => setViewLead(l)}
                          className="px-3 py-1.5 bg-pink-50 hover:bg-pink-100 text-[#ec2c6c] border border-pink-100 rounded-xl text-xs font-bold transition-all flex items-center space-x-1 cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View</span>
                        </button>
                        <button
                          onClick={() => setDeletingItem({ id: l.id, type: 'lead', name: `Patient Lead for ${l.patientName}` })}
                          className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-100 rounded-xl text-xs font-bold transition-all cursor-pointer"
                          title="Delete Lead"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
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

          {/* Pagination Controls */}
          {filteredLeads.length > 0 && (
            <div className="p-4 bg-gray-50 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-600">
              <div className="flex items-center space-x-2">
                <span>Rows per page:</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="px-2 py-1 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-800 focus:outline-none cursor-pointer"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>
                <span className="text-gray-400">|</span>
                <span>
                  Showing <strong>{Math.min((currentPage - 1) * pageSize + 1, currentTabTotalItems)}</strong> to{' '}
                  <strong>{Math.min(currentPage * pageSize, currentTabTotalItems)}</strong> of <strong>{currentTabTotalItems}</strong> entries
                </span>
              </div>

              <div className="flex items-center space-x-1">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-1.5 rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  title="Previous Page"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <span className="px-3 py-1 font-bold text-gray-800">
                  Page {currentPage} of {totalPages}
                </span>

                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage >= totalPages}
                  className="p-1.5 rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  title="Next Page"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
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
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paginatedPurchases.map((tx) => (
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
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        <button
                          onClick={() => setViewTransaction(tx)}
                          className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-100 rounded-xl text-xs font-bold transition-all flex items-center space-x-1 cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View</span>
                        </button>
                        <button
                          onClick={() => setDeletingItem({ id: tx.id, type: 'transaction', name: `Transaction #${tx.id} (${tx.hospital?.name})` })}
                          className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-100 rounded-xl text-xs font-bold transition-all cursor-pointer"
                          title="Delete Transaction Audit Log"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredPurchases.length === 0 && (
              <div className="text-center py-12 text-gray-500 text-sm">
                No package purchase history recorded for this selection.
              </div>
            )}
          </div>

          {/* Pagination Controls */}
          {filteredPurchases.length > 0 && (
            <div className="p-4 bg-gray-50 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-600">
              <div className="flex items-center space-x-2">
                <span>Rows per page:</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="px-2 py-1 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-800 focus:outline-none cursor-pointer"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>
                <span className="text-gray-400">|</span>
                <span>
                  Showing <strong>{Math.min((currentPage - 1) * pageSize + 1, currentTabTotalItems)}</strong> to{' '}
                  <strong>{Math.min(currentPage * pageSize, currentTabTotalItems)}</strong> of <strong>{currentTabTotalItems}</strong> entries
                </span>
              </div>

              <div className="flex items-center space-x-1">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-1.5 rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  title="Previous Page"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <span className="px-3 py-1 font-bold text-gray-800">
                  Page {currentPage} of {totalPages}
                </span>

                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage >= totalPages}
                  className="p-1.5 rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  title="Next Page"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
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
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paginatedAudit.map((tx) => (
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
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        <button
                          onClick={() => setViewTransaction(tx)}
                          className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-100 rounded-xl text-xs font-bold transition-all flex items-center space-x-1 cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View</span>
                        </button>
                        <button
                          onClick={() => setDeletingItem({ id: tx.id, type: 'transaction', name: `Transaction #${tx.id} (${tx.hospital?.name})` })}
                          className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-100 rounded-xl text-xs font-bold transition-all cursor-pointer"
                          title="Delete Audit Log"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
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

          {/* Pagination Controls */}
          {filteredTransactions.length > 0 && (
            <div className="p-4 bg-gray-50 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-600">
              <div className="flex items-center space-x-2">
                <span>Rows per page:</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="px-2 py-1 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-800 focus:outline-none cursor-pointer"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>
                <span className="text-gray-400">|</span>
                <span>
                  Showing <strong>{Math.min((currentPage - 1) * pageSize + 1, currentTabTotalItems)}</strong> to{' '}
                  <strong>{Math.min(currentPage * pageSize, currentTabTotalItems)}</strong> of <strong>{currentTabTotalItems}</strong> entries
                </span>
              </div>

              <div className="flex items-center space-x-1">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-1.5 rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  title="Previous Page"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <span className="px-3 py-1 font-bold text-gray-800">
                  Page {currentPage} of {totalPages}
                </span>

                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage >= totalPages}
                  className="p-1.5 rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  title="Next Page"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* View Patient Lead Modal */}
      {viewLead && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-gray-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div>
                <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-pink-50 text-[#ec2c6c]">
                  Lead #{viewLead.id}
                </span>
                <h3 className="text-xl font-extrabold text-gray-900 mt-1">{viewLead.patientName}</h3>
              </div>
              <button
                onClick={() => setViewLead(null)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Contact Info */}
              <div className="p-4 bg-gray-50 rounded-2xl space-y-2 border border-gray-100">
                <h4 className="font-bold text-gray-800 uppercase tracking-wider text-[10px]">Patient Contact Details</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-gray-700">
                  <div className="flex items-center space-x-2">
                    <Phone className="w-3.5 h-3.5 text-gray-400" />
                    <a href={`tel:${viewLead.phone}`} className="font-bold text-pink-600 hover:underline">{viewLead.phone}</a>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Mail className="w-3.5 h-3.5 text-gray-400" />
                    <a href={`mailto:${viewLead.email}`} className="font-semibold text-gray-800 hover:underline truncate">{viewLead.email}</a>
                  </div>
                  {viewLead.city && (
                    <div className="flex items-center space-x-2 col-span-2">
                      <MapPin className="w-3.5 h-3.5 text-gray-400" />
                      <span>{viewLead.city}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Hospital & Service */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 bg-blue-50/60 rounded-2xl border border-blue-100">
                  <span className="text-[10px] font-bold text-blue-800 uppercase block mb-0.5">Assigned Hospital</span>
                  <span className="font-extrabold text-gray-900">{viewLead.hospital?.name || 'General Platform'}</span>
                </div>

                <div className="p-3.5 bg-pink-50/60 rounded-2xl border border-pink-100">
                  <span className="text-[10px] font-bold text-pink-800 uppercase block mb-0.5">Requested Specialty</span>
                  <span className="font-extrabold text-[#ec2c6c]">{viewLead.service?.name || 'General Consultation'}</span>
                </div>
              </div>

              {/* Status & Date */}
              <div className="flex items-center justify-between p-3.5 bg-gray-50 rounded-2xl border border-gray-100">
                <div>
                  <span className="text-[10px] font-bold text-gray-500 uppercase block">Status</span>
                  <span className="font-bold text-[#ec2c6c]">{viewLead.status}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold text-gray-500 uppercase block">Date & Time</span>
                  <span className="font-medium text-gray-700">{new Date(viewLead.createdAt).toLocaleString('en-IN')}</span>
                </div>
              </div>

              {/* Patient Message */}
              {viewLead.message && (
                <div className="p-4 bg-amber-50/60 rounded-2xl border border-amber-100 space-y-1">
                  <span className="text-[10px] font-bold text-amber-900 uppercase tracking-wider block">Patient Enquiry Message</span>
                  <p className="text-xs text-gray-800 leading-relaxed font-medium">{viewLead.message}</p>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2 border-t border-gray-100">
              <button
                onClick={() => setViewLead(null)}
                className="px-6 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full text-xs font-bold transition-all cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Transaction Audit Modal */}
      {viewTransaction && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-gray-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div>
                <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-800">
                  Transaction Audit #{viewTransaction.id}
                </span>
                <h3 className="text-xl font-extrabold text-gray-900 mt-1">
                  {viewTransaction.transactionType === 'PACKAGE_PURCHASE' ? 'Package Purchase Credit' : 'Lead Audit Log'}
                </h3>
              </div>
              <button
                onClick={() => setViewTransaction(null)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Hospital Info */}
              <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Hospital Profile</span>
                  <span className="font-extrabold text-gray-900 text-sm">{viewTransaction.hospital?.name}</span>
                  <p className="text-[11px] text-gray-500">{viewTransaction.hospital?.city}</p>
                </div>
                <Building2 className="w-6 h-6 text-[#b02151]" />
              </div>

              {/* Lead Amount & Balance Log */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 bg-emerald-50/70 rounded-2xl border border-emerald-100">
                  <span className="text-[10px] font-bold text-emerald-800 uppercase block mb-1">Lead Amount</span>
                  <span className="text-xl font-extrabold text-emerald-700">
                    {viewTransaction.leadAmount > 0 ? `+${viewTransaction.leadAmount}` : viewTransaction.leadAmount} Leads
                  </span>
                </div>

                <div className="p-4 bg-purple-50/70 rounded-2xl border border-purple-100">
                  <span className="text-[10px] font-bold text-purple-800 uppercase block mb-1">Balance Log</span>
                  <span className="text-xs font-bold text-gray-800">
                    {viewTransaction.balanceBefore} ➔ <strong className="text-purple-700 text-sm">{viewTransaction.balanceAfter}</strong>
                  </span>
                </div>
              </div>

              {/* Transaction Description */}
              {viewTransaction.description && (
                <div className="p-4 bg-slate-50 rounded-2xl border border-gray-200 space-y-1">
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Transaction Remarks</span>
                  <p className="text-xs text-gray-800 font-semibold leading-relaxed">{viewTransaction.description}</p>
                </div>
              )}

              {/* Date */}
              <div className="p-3.5 bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-between text-gray-600">
                <span className="text-[10px] font-bold uppercase">Transaction Date</span>
                <span className="font-bold text-gray-900">{new Date(viewTransaction.createdAt).toLocaleString('en-IN')}</span>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-gray-100">
              <button
                onClick={() => setViewTransaction(null)}
                className="px-6 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full text-xs font-bold transition-all cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingItem && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-gray-100 animate-in fade-in zoom-in-95 duration-150 text-center">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-gray-900">Delete Audit Record?</h3>
              <p className="text-xs text-gray-500 mt-1">
                Are you sure you want to permanently delete <strong>{deletingItem.name}</strong>? This action cannot be undone.
              </p>
            </div>
            <div className="flex justify-center space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setDeletingItem(null)}
                className="px-5 py-2 border border-gray-200 text-gray-700 text-xs font-bold rounded-full hover:bg-gray-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={deleting}
                className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-extrabold rounded-full shadow-md flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
              >
                <span>{deleting ? 'Deleting...' : 'Yes, Delete'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
