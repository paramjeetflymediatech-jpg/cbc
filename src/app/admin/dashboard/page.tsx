'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Building2, Users, IndianRupee, ShieldCheck, Clock, ArrowUpRight, Award } from 'lucide-react';

export default function AdminDashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/stats')
      .then((r) => r.json())
      .then((res) => {
        if (res.stats) setData(res);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading || !data) {
    return <div className="p-8 text-center text-gray-500">Loading admin statistics...</div>;
  }

  const { stats, recentLeads = [], recentPayments = [] } = data;

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-extrabold text-gray-900">Admin Control Center</h1>
        <p className="text-xs text-gray-500">Platform overview, hospital approvals and revenue metrics.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="cbc-card p-6 border border-gray-100 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total Revenue</span>
            <h3 className="text-2xl font-extrabold text-[#101828]">₹{Number(stats.totalRevenue).toLocaleString('en-IN')}</h3>
            <p className="text-[10px] text-emerald-600 font-semibold mt-1">Verified PhonePe Sales</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <IndianRupee className="w-6 h-6" />
          </div>
        </div>

        <div className="cbc-card p-6 border border-gray-100 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total Hospitals</span>
            <h3 className="text-2xl font-extrabold text-gray-900">{stats.totalHospitals}</h3>
            <p className="text-[10px] text-pink-600 font-semibold mt-1">{stats.pendingHospitals} Pending Approval</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-pink-50 text-[#ec2c6c] flex items-center justify-center">
            <Building2 className="w-6 h-6" />
          </div>
        </div>

        <div className="cbc-card p-6 border border-gray-100 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total Leads Delivered</span>
            <h3 className="text-2xl font-extrabold text-gray-900">{stats.totalLeads}</h3>
            <p className="text-[10px] text-gray-400 mt-1">Atomic deducted enquiries</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="cbc-card p-6 border border-gray-100 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Medical Services</span>
            <h3 className="text-2xl font-extrabold text-gray-900">{stats.activeServicesCount}</h3>
            <p className="text-[10px] text-gray-400 mt-1">Active platform specialties</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <ShieldCheck className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Pending Hospitals Warning Banner */}
      {stats.pendingHospitals > 0 && (
        <div className="p-6 bg-amber-50 border-2 border-amber-200 rounded-2xl flex items-center justify-between text-amber-900 shadow-sm">
          <div className="flex items-center space-x-3">
            <Clock className="w-6 h-6 text-amber-600 flex-shrink-0" />
            <div>
              <h3 className="font-bold text-base text-amber-950">
                {stats.pendingHospitals} Pending Hospital Registration(s) Awaiting Review
              </h3>
              <p className="text-xs text-amber-800">Review new clinic onboarding applications to grant dashboard access.</p>
            </div>
          </div>
          <Link href="/admin/hospitals?status=PENDING" className="cbc-btn-dark text-xs px-5 py-2.5 whitespace-nowrap">
            Review Registrations
          </Link>
        </div>
      )}

      {/* Recent Activity Grids */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Enquiries */}
        <div className="cbc-card p-6 border border-gray-100 space-y-4">
          <div className="flex justify-between items-center border-b border-gray-100 pb-2">
            <h3 className="font-bold text-gray-900 text-base">Recent Platform Leads</h3>
            <Link href="/admin/leads" className="text-xs font-bold text-[#ec2c6c] hover:underline flex items-center">
              View All <ArrowUpRight className="w-3.5 h-3.5 ml-1" />
            </Link>
          </div>
          <div className="space-y-3">
            {recentLeads.map((l: any) => (
              <div key={l.id} className="p-3 bg-gray-50 rounded-xl flex items-center justify-between text-xs">
                <div>
                  <p className="font-bold text-gray-900">{l.patientName}</p>
                  <p className="text-gray-500">{l.hospital?.name} • {l.service?.name}</p>
                </div>
                <span className="font-bold text-[#ec2c6c]">{new Date(l.createdAt).toLocaleDateString('en-IN')}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Payments */}
        <div className="cbc-card p-6 border border-gray-100 space-y-4">
          <div className="flex justify-between items-center border-b border-gray-100 pb-2">
            <h3 className="font-bold text-gray-900 text-base">Recent Package Purchases</h3>
            <Link href="/admin/leads" className="text-xs font-bold text-[#ec2c6c] hover:underline flex items-center">
              View All <ArrowUpRight className="w-3.5 h-3.5 ml-1" />
            </Link>
          </div>
          <div className="space-y-3">
            {recentPayments.map((p: any) => (
              <div key={p.id} className="p-3 bg-gray-50 rounded-xl flex items-center justify-between text-xs">
                <div>
                  <p className="font-bold text-gray-900">{p.hospital?.name}</p>
                  <p className="text-emerald-700 font-bold">₹{Number(p.amount).toLocaleString('en-IN')}</p>
                </div>
                <span className="px-2.5 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-800 text-[10px]">
                  {p.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
