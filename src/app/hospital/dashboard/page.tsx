'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Users, AlertTriangle, ArrowRight, CheckCircle2, Phone, Clock, PlusCircle } from 'lucide-react';

export default function HospitalDashboardPage() {
  const [hospital, setHospital] = useState<any>(null);
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/hospital/profile').then((r) => r.json()),
      fetch('/api/hospital/leads').then((r) => r.json()),
    ])
      .then(([profData, leadsData]) => {
        if (profData.hospital) setHospital(profData.hospital);
        if (leadsData.leads) setLeads(leadsData.leads);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading || !hospital) {
    return (
      <div className="flex items-center justify-center py-20 text-gray-500 text-sm">
        Loading hospital dashboard...
      </div>
    );
  }

  const remaining = hospital.leadsRemaining || 0;
  const purchased = hospital.totalLeadsPurchased || 0;
  const used = hospital.totalLeadsUsed || 0;
  const percentageUsed = purchased > 0 ? Math.min(100, Math.round((used / purchased) * 100)) : 0;
  const isLowBalance = remaining <= 3;

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Welcome Banner */}
      <div className="bg-[#101828] text-white p-6 sm:p-8 rounded-2xl shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-l-4 border-[#ec2c6c]">
        <div>
          <span className="text-xs font-bold text-[#ec2c6c] uppercase tracking-wider">Hospital Dashboard</span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">{hospital.name}</h1>
          <p className="text-gray-300 text-xs sm:text-sm mt-1">
            Status: <span className="text-emerald-400 font-bold uppercase">{hospital.status}</span> • Location: {hospital.city}
          </p>
        </div>

        <Link
          href="/hospital/packages"
          className="cbc-btn-primary text-sm shadow-lg flex items-center space-x-2 whitespace-nowrap"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Buy Lead Package</span>
        </Link>
      </div>

      {/* Exhaustion / Low Balance Alert Warning */}
      {isLowBalance && (
        <div className="p-6 bg-red-50 border-2 border-red-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-red-900 shadow-md">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-bold text-base text-red-800">
                {remaining === 0 ? 'Your lead package has been exhausted!' : 'Low Lead Balance Warning!'}
              </h3>
              <p className="text-xs sm:text-sm text-red-700 mt-0.5">
                {remaining === 0
                  ? 'You have used all available patient enquiries. Purchase another lead package to continue receiving enquiries.'
                  : `You have only ${remaining} lead(s) remaining. Purchase another package to prevent enquiry interruptions.`}
              </p>
            </div>
          </div>

          <Link
            href="/hospital/packages"
            className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-full shadow-lg whitespace-nowrap"
          >
            Purchase Package Now
          </Link>
        </div>
      )}

      {/* Lead Balance Visual Meter & KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: Lead Balance Meter */}
        <div className="cbc-card p-6 border border-gray-100 flex flex-col justify-between space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Enquiry Lead Balance</span>
            <span className="text-xs font-bold text-[#ec2c6c] bg-pink-50 px-2.5 py-1 rounded-full">
              {remaining} Available
            </span>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs font-semibold text-gray-700">
              <span>Used: {used} Leads</span>
              <span>Total: {purchased} Leads</span>
            </div>
            <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#ec2c6c] transition-all duration-500"
                style={{ width: `${percentageUsed}%` }}
              />
            </div>
          </div>

          <p className="text-xs text-gray-500">
            Every valid patient enquiry consumes exactly <strong>1 lead</strong> from your balance.
          </p>
        </div>

        {/* Card 2: Total Enquiries Received */}
        <div className="cbc-card p-6 border border-gray-100 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total Enquiries</span>
            <h3 className="text-3xl font-extrabold text-gray-900">{leads.length}</h3>
            <p className="text-xs text-gray-400">Received on Clinic By Choice</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
        </div>

        {/* Card 3: New Uncontacted Leads */}
        <div className="cbc-card p-6 border border-gray-100 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">New Enquiries</span>
            <h3 className="text-3xl font-extrabold text-[#ec2c6c]">
              {leads.filter((l) => l.status === 'NEW').length}
            </h3>
            <p className="text-xs text-gray-400">Requires follow-up</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-pink-50 text-[#ec2c6c] flex items-center justify-center">
            <Clock className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Recent Leads Table */}
      <div className="cbc-card p-6 border border-gray-100 space-y-4">
        <div className="flex justify-between items-center border-b border-gray-100 pb-3">
          <h2 className="text-lg font-bold text-gray-900">Recent Patient Enquiries</h2>
          <Link href="/hospital/leads" className="text-xs font-bold text-[#ec2c6c] hover:underline flex items-center">
            View All Leads <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-700">
            <thead className="bg-gray-50 text-xs font-bold uppercase text-gray-500 tracking-wider">
              <tr>
                <th className="p-3">Patient Name</th>
                <th className="p-3">Contact</th>
                <th className="p-3">Service</th>
                <th className="p-3">Date</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {leads.slice(0, 5).map((lead) => (
                <tr key={lead.id} className="hover:bg-gray-50/50">
                  <td className="p-3 font-semibold text-gray-900">{lead.patientName}</td>
                  <td className="p-3 text-xs">
                    <p>{lead.phone}</p>
                    <p className="text-gray-400">{lead.email}</p>
                  </td>
                  <td className="p-3 text-xs font-medium text-pink-600">{lead.service?.name || 'General'}</td>
                  <td className="p-3 text-xs text-gray-500">
                    {new Date(lead.createdAt).toLocaleDateString('en-IN')}
                  </td>
                  <td className="p-3">
                    <span className="inline-block px-2.5 py-1 rounded-full text-xs font-semibold bg-pink-100 text-[#ec2c6c]">
                      {lead.status}
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    <Link
                      href="/hospital/leads"
                      className="text-xs font-bold text-gray-700 hover:text-[#ec2c6c] border border-gray-200 px-3 py-1 rounded-lg"
                    >
                      Details
                    </Link>
                  </td>
                </tr>
              ))}
              {leads.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-500 text-sm">
                    No enquiries received yet. Ensure your hospital profile is active!
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
