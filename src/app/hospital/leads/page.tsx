'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Phone, Mail, MapPin, Clock, MessageSquare, Plus, Save, X, Lock, Unlock, ShoppingBag, AlertTriangle, ShieldAlert, CheckCircle2, Loader2 } from 'lucide-react';

export default function HospitalLeadsPage() {
  const [leads, setLeads] = useState<any[]>([]);
  const [hospitalInfo, setHospitalInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');
  const [search, setSearch] = useState('');

  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [newNote, setNewNote] = useState('');
  const [savingNote, setSavingNote] = useState(false);
  const [unlockingLeadId, setUnlockingLeadId] = useState<number | null>(null);
  const [unlockMessage, setUnlockMessage] = useState('');

  const fetchLeads = () => {
    const query = new URLSearchParams();
    if (filterStatus) query.append('status', filterStatus);
    if (search) query.append('search', search);

    fetch(`/api/hospital/leads?${query.toString()}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.leads) setLeads(data.leads);
        if (data.hospital) setHospitalInfo(data.hospital);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchLeads();
  }, [filterStatus]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchLeads();
  };

  const handleStatusChange = async (leadId: number, status: string) => {
    try {
      const res = await fetch('/api/hospital/leads', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId, status }),
      });
      if (res.ok) {
        fetchLeads();
      }
    } catch {
      // ignore
    }
  };

  const handleUnlockLead = async (leadId: number) => {
    setUnlockingLeadId(leadId);
    setUnlockMessage('');

    try {
      const res = await fetch('/api/hospital/leads/unlock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Failed to unlock lead.');
      } else {
        setUnlockMessage('Patient contact unlocked successfully! (1 Lead Deducted)');
        fetchLeads();
      }
    } catch {
      alert('Network error unlocking lead.');
    } finally {
      setUnlockingLeadId(null);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLead || !newNote.trim()) return;

    setSavingNote(true);
    try {
      const res = await fetch(`/api/hospital/leads/${selectedLead.id}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newNote }),
      });

      const data = await res.json();
      if (res.ok && data.notes) {
        setSelectedLead({ ...selectedLead, notes: data.notes });
        setNewNote('');
        fetchLeads();
      }
    } catch {
      // ignore
    } finally {
      setSavingNote(false);
    }
  };

  const pendingHeldLeadsCount = leads.filter((l) => l.status === 'UNASSIGNED').length;
  const leadsRemaining = hospitalInfo?.leadsRemaining || 0;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Top Bar Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 pb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">Patient Enquiries & Leads</h1>
          <p className="text-xs text-gray-500">Track, unlock and manage patient leads delivered to your hospital portal.</p>
        </div>

        {/* Lead Balance Pill & CTA */}
        <div className="flex items-center space-x-3">
          <div className="bg-pink-50 border border-pink-100 px-4 py-2 rounded-2xl text-right">
            <span className="text-[10px] font-extrabold text-[#b02151] uppercase tracking-wider block">Lead Balance</span>
            <span className="text-sm font-extrabold text-gray-900">{leadsRemaining} Leads Remaining</span>
          </div>

          <Link
            href="/hospital/packages"
            className="bg-[#b02151] hover:bg-[#921941] text-white text-xs font-extrabold px-4 py-2.5 rounded-xl uppercase tracking-wider shadow-md transition-all flex items-center space-x-1.5"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Buy Lead Package</span>
          </Link>
        </div>
      </div>

      {/* Held Leads Warning Banner */}
      {pendingHeldLeadsCount > 0 && (
        <div className="p-5 bg-gradient-to-r from-amber-500/10 via-pink-50 to-amber-500/5 border-2 border-amber-400/40 rounded-3xl space-y-3 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start space-x-3">
              <ShieldAlert className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h3 className="text-sm font-extrabold text-gray-900 flex items-center">
                  <span>🔒 {pendingHeldLeadsCount} Pending Patient Enquiry Lead(s) Held!</span>
                  <span className="ml-2 text-[10px] font-bold bg-amber-200 text-amber-900 px-2.5 py-0.5 rounded-full uppercase">
                    Package Purchase Required
                  </span>
                </h3>
                <p className="text-xs text-gray-700 font-medium leading-relaxed">
                  You received new patient enquiry contacts, but your lead balance is 0 or your package has expired. Patient phone numbers and emails are locked until package purchase.
                  <br />
                  <strong className="text-[#b02151]">Note: 1 Lead = Exactly 1 Patient Contact. A 25 Lead Package unlocks 25 patient enquiries.</strong>
                </p>
              </div>
            </div>

            <Link
              href="/hospital/packages"
              className="bg-[#b02151] hover:bg-[#921941] text-white text-xs font-extrabold px-5 py-3 rounded-2xl uppercase tracking-wider shadow-lg flex-shrink-0 flex items-center justify-center space-x-2 transition-transform hover:scale-105"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Purchase Package to Unlock Leads</span>
            </Link>
          </div>
        </div>
      )}

      {unlockMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-2xl flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{unlockMessage}</span>
        </div>
      )}

      {/* Filter Controls Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-gray-200 shadow-xs">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setFilterStatus('')}
            className={`px-3.5 py-2 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all cursor-pointer ${
              filterStatus === '' ? 'bg-[#b02151] text-white shadow-xs' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            All Leads ({leads.length})
          </button>

          <button
            onClick={() => setFilterStatus('UNASSIGNED')}
            className={`px-3.5 py-2 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all flex items-center space-x-1 cursor-pointer ${
              filterStatus === 'UNASSIGNED'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100'
            }`}
          >
            <Lock className="w-3 h-3 mr-1" />
            <span>Pending Held Leads ({pendingHeldLeadsCount})</span>
          </button>

          <button
            onClick={() => setFilterStatus('NEW')}
            className={`px-3.5 py-2 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all cursor-pointer ${
              filterStatus === 'NEW' ? 'bg-[#b02151] text-white shadow-xs' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Active New
          </button>
        </div>

        <form onSubmit={handleSearchSubmit} className="flex items-center space-x-2">
          <input
            type="text"
            placeholder="Search patient, phone, city..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:outline-none focus:border-[#fd1d74]"
          />
          <button type="submit" className="bg-gray-900 text-white text-xs font-bold px-4 py-2 rounded-xl hover:bg-black transition-colors cursor-pointer">
            Filter
          </button>
        </form>
      </div>

      {/* Leads Table */}
      <div className="bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-700">
            <thead className="bg-slate-50 text-[11px] font-extrabold uppercase text-gray-500 tracking-wider border-b border-gray-200">
              <tr>
                <th className="p-4">Patient Info</th>
                <th className="p-4">Requested Service</th>
                <th className="p-4">Contact Time</th>
                <th className="p-4">Received Date</th>
                <th className="p-4">Lead Status</th>
                <th className="p-4 text-right">Actions / Unlock</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-medium">
              {leads.map((lead) => {
                const isHeldLocked = lead.status === 'UNASSIGNED';
                const isExpired = lead.status === 'EXPIRED';

                return (
                  <tr key={lead.id} className={isHeldLocked ? 'bg-amber-50/30 hover:bg-amber-50/60' : 'hover:bg-gray-50/50'}>
                    <td className="p-4">
                      <p className="font-extrabold text-gray-900 text-sm flex items-center">
                        {lead.patientName}
                        {isHeldLocked && (
                          <span className="ml-2 text-[10px] font-extrabold bg-amber-100 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-full flex items-center">
                            <Lock className="w-3 h-3 mr-0.5" /> Locked (Pending Package)
                          </span>
                        )}
                        {isExpired && (
                          <span className="ml-2 text-[10px] font-extrabold bg-red-100 text-red-800 border border-red-200 px-2 py-0.5 rounded-full">
                            EXPIRED (48h Passed)
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-gray-600 flex items-center mt-1 font-semibold">
                        <Phone className="w-3.5 h-3.5 mr-1 text-[#b02151]" /> {lead.phone}
                      </p>
                      <p className="text-xs text-gray-600 flex items-center mt-0.5">
                        <Mail className="w-3.5 h-3.5 mr-1 text-gray-400" /> {lead.email}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">{lead.city}</p>
                    </td>

                    <td className="p-4 font-bold text-xs text-[#b02151]">
                      {lead.service?.name || 'General Medical Care'}
                    </td>

                    <td className="p-4 text-xs text-gray-600 font-medium">{lead.preferredContactTime || 'Anytime'}</td>

                    <td className="p-4 text-xs text-gray-500 font-medium">
                      {new Date(lead.createdAt).toLocaleDateString('en-IN')}
                    </td>

                    <td className="p-4">
                      {isHeldLocked ? (
                        <span className="px-3 py-1 bg-amber-100 text-amber-900 border border-amber-300 rounded-xl text-xs font-extrabold inline-flex items-center">
                          <Lock className="w-3 h-3 mr-1" /> HELD (0 BALANCE)
                        </span>
                      ) : isExpired ? (
                        <span className="px-3 py-1 bg-red-100 text-red-900 border border-red-300 rounded-xl text-xs font-extrabold inline-flex items-center">
                          EXPIRED
                        </span>
                      ) : (
                        <select
                          value={lead.status}
                          onChange={(e) => handleStatusChange(lead.id, e.target.value)}
                          className="px-3 py-1.5 text-xs font-extrabold rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:border-[#fd1d74] cursor-pointer"
                        >
                          <option value="NEW">NEW</option>
                          <option value="CONTACTED">CONTACTED</option>
                          <option value="IN_PROGRESS">IN_PROGRESS</option>
                          <option value="CONVERTED">CONVERTED</option>
                          <option value="LOST">LOST</option>
                          <option value="CANCELLED">CANCELLED</option>
                        </select>
                      )}
                    </td>

                    <td className="p-4 text-right space-y-2">
                      {isHeldLocked ? (
                        leadsRemaining > 0 ? (
                          <button
                            onClick={() => handleUnlockLead(lead.id)}
                            disabled={unlockingLeadId === lead.id}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold px-4 py-2 rounded-xl uppercase tracking-wider shadow-md transition-all inline-flex items-center space-x-1.5 cursor-pointer"
                          >
                            {unlockingLeadId === lead.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Unlock className="w-3.5 h-3.5" />
                            )}
                            <span>Unlock Contact (1 Lead)</span>
                          </button>
                        ) : (
                          <Link
                            href="/hospital/packages"
                            className="bg-[#b02151] hover:bg-[#921941] text-white text-xs font-extrabold px-4 py-2 rounded-xl uppercase tracking-wider shadow-md transition-all inline-flex items-center space-x-1 cursor-pointer"
                          >
                            <ShoppingBag className="w-3.5 h-3.5 mr-1" />
                            <span>Buy Package to Unlock</span>
                          </Link>
                        )
                      ) : (
                        <button
                          onClick={() => setSelectedLead(lead)}
                          className="text-xs font-bold text-[#b02151] hover:underline flex items-center ml-auto cursor-pointer"
                        >
                          <MessageSquare className="w-3.5 h-3.5 mr-1" /> Notes & Details
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
              {leads.length === 0 && !loading && (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-gray-500 text-xs font-medium">
                    No patient leads found matching selected criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Lead Detail & Internal Notes Drawer/Modal */}
      {selectedLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-gray-100 relative">
            <button
              onClick={() => setSelectedLead(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-extrabold text-gray-900 border-b border-gray-100 pb-2">
              Patient Lead: {selectedLead.patientName}
            </h3>

            <div className="p-4 bg-slate-50 rounded-2xl space-y-1.5 text-xs text-gray-700 font-medium">
              <p><strong>Phone:</strong> {selectedLead.phone}</p>
              <p><strong>Email:</strong> {selectedLead.email}</p>
              <p><strong>City:</strong> {selectedLead.city}</p>
              <p><strong>Service Needed:</strong> {selectedLead.service?.name}</p>
              {selectedLead.message && <p><strong>Enquiry Message:</strong> {selectedLead.message}</p>}
            </div>

            {/* Internal Notes History */}
            <div className="space-y-3">
              <h4 className="text-xs font-extrabold uppercase text-gray-500 tracking-wider">Internal Notes Timeline</h4>
              <form onSubmit={handleAddNote} className="flex space-x-2">
                <input
                  type="text"
                  placeholder="Add internal note..."
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  className="flex-1 px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:outline-none focus:border-[#fd1d74]"
                />
                <button
                  type="submit"
                  disabled={savingNote}
                  className="bg-[#b02151] hover:bg-[#921941] text-white text-xs font-extrabold px-4 py-2.5 rounded-xl uppercase tracking-wider cursor-pointer"
                >
                  Save
                </button>
              </form>

              <div className="max-h-48 overflow-y-auto space-y-2 pt-2">
                {Array.isArray(selectedLead.notes) && selectedLead.notes.length > 0 ? (
                  selectedLead.notes.map((note: any, i: number) => (
                    <div key={i} className="p-3 bg-pink-50/50 border border-pink-100 rounded-xl text-xs space-y-0.5">
                      <p className="text-gray-800 font-medium">{note.content}</p>
                      <p className="text-[10px] text-gray-400 font-bold">
                        {note.author} • {new Date(note.createdAt).toLocaleString('en-IN')}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-gray-400 italic font-medium">No internal notes recorded yet.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
