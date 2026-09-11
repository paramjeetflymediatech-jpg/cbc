'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import {
  Check,
  Sparkles,
  Zap,
  ShieldCheck,
  TrendingUp,
  Users,
  Clock,
  PhoneCall,
  ArrowRight,
  HelpCircle,
  ChevronDown,
  Building2,
  CreditCard,
  Target,
  Award,
  Star,
  CheckCircle2,
  Shield,
  Activity,
  Layers,
  Phone,
  MessageSquare,
  Lock,
} from 'lucide-react';

interface LeadPackageItem {
  id: number;
  name: string;
  leadCount: number;
  price: number;
  currency: string;
  validityDays?: number | null;
  description?: string | null;
  status?: string;
  popular?: boolean;
  tag?: string;
  originalPrice?: number;
  targetAudience?: string;
  features: string[];
}

const defaultPackagesData: LeadPackageItem[] = [
  {
    id: 1,
    name: 'Starter Clinic Pack',
    leadCount: 25,
    price: 4999,
    originalPrice: 6999,
    currency: 'INR',
    validityDays: 30,
    tag: 'Entry Level',
    targetAudience: 'Single Clinics & Individual Specialists',
    description: 'Get started with verified digital patient enquiries in your local area with zero monthly commitments.',
    features: [
      '25 Verified Patient Enquiries',
      'Direct Patient Mobile & Email Access',
      'Instant Email Lead Alerts',
      'Standard Hospital CRM Dashboard',
      '48-Hour Held Lead Protection',
      'Basic Specialty Profile Listing',
    ],
  },
  {
    id: 2,
    name: 'Growth Care Pack',
    leadCount: 50,
    price: 8999,
    originalPrice: 12999,
    currency: 'INR',
    validityDays: 60,
    popular: true,
    tag: 'Most Popular',
    targetAudience: 'Established Specialty Centers & Day-care Clinics',
    description: 'Our most popular package designed to scale daily OPD footfall and boost surgical procedure bookings.',
    features: [
      '50 Verified Patient Enquiries',
      'Direct Patient Mobile, WhatsApp & Email',
      'Real-Time Instant Email & Dashboard Alerts',
      'Full CRM Dashboard with Lead Status Notes',
      '48-Hour Held Lead Protection',
      'Verified Hospital Profile Badge',
      'Multiple Doctors & Specialties Support',
      'Priority Phone & WhatsApp Support',
    ],
  },
  {
    id: 3,
    name: 'Super Specialty Pro',
    leadCount: 100,
    price: 15999,
    originalPrice: 24999,
    currency: 'INR',
    validityDays: 90,
    tag: 'High Value',
    targetAudience: 'Multi-Specialty & Tertiary Care Hospitals',
    description: 'Accelerate high-ticket elective surgeries, inpatient admissions, and tertiary care medical consultations.',
    features: [
      '100 Verified Patient Enquiries',
      'Highest Priority Direct Lead Delivery',
      'Real-Time Email, SMS & CRM Push Notifications',
      'Comprehensive Multi-User Hospital CRM',
      'Enhanced 72-Hour Held Lead Grace Protection',
      'Featured Top-Placement on City & Service Pages',
      'Unlimited Doctor & Department Profiles',
      'Dedicated Account Coordination Manager',
    ],
  },
  {
    id: 4,
    name: 'Enterprise Healthcare Max',
    leadCount: 250,
    price: 34999,
    originalPrice: 54999,
    currency: 'INR',
    validityDays: 180,
    tag: 'Maximum Volume',
    targetAudience: 'Hospital Networks, Multi-Branch Chains & Corporates',
    description: 'Ultimate patient volume and brand exposure with guaranteed lowest cost-per-lead and VIP onboarding.',
    features: [
      '250 Verified Patient Enquiries',
      'VIP Real-Time Patient Routing Engine',
      'Multi-Location & Multi-Branch Lead Routing',
      'Custom CRM Webhook & Lead Export Options',
      'Featured Super-Partner Badge & Top Banner Ads',
      'Custom Marketing Campaign Co-Promotion',
      'Quarterly Performance & Conversion Reviews',
      '24/7 Dedicated Senior Account Director',
    ],
  },
];

const comparisonMatrix = [
  { feature: 'Patient Lead Credits', starter: '25 Leads', growth: '50 Leads', pro: '100 Leads', enterprise: '250 Leads' },
  { feature: 'Cost per Verified Lead', starter: '₹200 / lead', growth: '₹180 / lead', pro: '₹160 / lead', enterprise: '₹140 / lead' },
  { feature: 'Package Validity', starter: '30 Days', growth: '60 Days', pro: '90 Days', enterprise: '180 Days' },
  { feature: 'Contact Info Access', starter: 'Phone & Email', growth: 'Phone, WhatsApp & Email', growthHighlighted: true, pro: 'Full Details + Callback Preference', enterprise: 'Full Details + Multi-branch Routing' },
  { feature: 'Held Lead Grace Period', starter: '48 Hours', growth: '48 Hours', pro: '72 Hours', enterprise: 'Unlimited Grace Hold' },
  { feature: 'Profile Listing Badge', starter: 'Standard Listing', growth: 'Verified Hospital Badge', pro: 'Featured Top Placement', enterprise: 'VIP Super-Partner Badge' },
  { feature: 'Doctor & Department Profiles', starter: 'Up to 3 Doctors', growth: 'Up to 10 Doctors', pro: 'Unlimited Doctors', enterprise: 'Unlimited Multi-Location' },
  { feature: 'Support Level', starter: 'Email Support', growth: 'Priority Phone & WhatsApp', pro: 'Dedicated Account Manager', enterprise: '24/7 Executive Concierge' },
];

const faqs = [
  {
    q: 'How does the Clinic By Choice patient lead system work?',
    a: 'Each lead package credits your hospital portal with genuine patient enquiries. When a patient in your city submits a consultation or treatment enquiry, 1 lead credit unlocks their complete contact details (Full Name, Phone Number, Email, City & Medical Query) instantly.',
  },
  {
    q: 'Are patient enquiries exclusive to our hospital?',
    a: 'Yes! When a patient specifically selects your hospital or requests a specialized treatment in your location, the lead is routed directly to your hospital dashboard and registered email address.',
  },
  {
    q: 'What happens if our hospital lead balance reaches zero?',
    a: 'When your balance reaches 0, new patient enquiries are held in locked mode for 48 hours. Both your team and the Super Admin receive an automated email alert. Purchasing any package immediately unlocks all held patient contacts.',
  },
  {
    q: 'Can we purchase multiple packages or top up anytime?',
    a: 'Yes! Any new package you purchase is immediately added on top of your existing lead credits. Your total balance increases right away with zero downtime.',
  },
  {
    q: 'How fast is package activation after payment?',
    a: 'Instantaneous! Payments are processed securely via PhonePe, UPI, Net Banking, and Cards. Your hospital lead balance updates in real-time as soon as the transaction succeeds.',
  },
  {
    q: 'Can we receive custom invoices and GST receipts?',
    a: 'Yes, official GST-compliant tax invoices and payment receipts are generated automatically and available in your hospital portal under the Payment Receipts section.',
  },
];

function cleanPlainText(input?: string | null): string {
  if (!input) return '';
  return input
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractFeatures(input?: string | null, fallbackFeatures: string[] = []): string[] {
  if (!input) return fallbackFeatures;
  const liMatches = input.match(/<li[^>]*>([\s\S]*?)<\/li>/gi);
  if (liMatches && liMatches.length > 0) {
    const extracted = liMatches
      .map((li) => cleanPlainText(li))
      .filter((text) => text.length > 0);
    if (extracted.length > 0) return extracted;
  }
  return fallbackFeatures;
}

export default function PricingPage() {
  const [packages, setPackages] = useState<LeadPackageItem[]>(defaultPackagesData);
  const [calcLeads, setCalcLeads] = useState<number>(50);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  useEffect(() => {
    fetch('/api/packages')
      .then((res) => res.json())
      .then((data) => {
        if (data.packages && Array.isArray(data.packages) && data.packages.length > 0) {
          // Merge dynamic prices with rich local metadata and clean any raw HTML
          const merged = defaultPackagesData.map((defPkg, idx) => {
            const apiMatch = data.packages[idx] || data.packages.find((p: any) => p.leadCount === defPkg.leadCount);
            if (apiMatch) {
              const cleanedDesc = cleanPlainText(apiMatch.description) || defPkg.description;
              const dynamicFeatures = extractFeatures(apiMatch.description, defPkg.features);

              return {
                ...defPkg,
                name: apiMatch.name || defPkg.name,
                price: Number(apiMatch.price) || defPkg.price,
                leadCount: Number(apiMatch.leadCount) || defPkg.leadCount,
                validityDays: apiMatch.validityDays !== undefined ? apiMatch.validityDays : defPkg.validityDays,
                description: cleanedDesc,
                features: dynamicFeatures,
              };
            }
            return defPkg;
          });
          setPackages(merged);
        }
      })
      .catch((err) => console.warn('Using default package pricing:', err));
  }, []);

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  // Projected conversion calculations
  const estimatedPatients = Math.round(calcLeads * 0.35);
  const estimatedMinRevenue = (estimatedPatients * 12500).toLocaleString('en-IN');
  const estimatedMaxRevenue = (estimatedPatients * 28000).toLocaleString('en-IN');

  return (
    <div className="min-h-screen bg-[#0d121f] text-slate-100 font-sans selection:bg-[#fd1d74] selection:text-white">
      <Header />

      {/* Hero Header Section */}
      <section className="relative pt-20 pb-36 px-4 sm:px-6 lg:px-8 overflow-hidden bg-gradient-to-b from-[#0b0f19] via-[#111827] to-[#0d121f]">
        {/* Ambient Gradient Glows */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-gradient-to-b from-[#fd1d74]/20 via-[#b02151]/10 to-transparent blur-[120px] pointer-events-none" />
        <div className="absolute -top-24 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute -top-24 right-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-[100px] pointer-events-none" />

        {/* Subtle Grid Background Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />

        <div className="relative max-w-5xl mx-auto text-center space-y-6 z-10">
          {/* Badge */}
          <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-pink-400 text-xs sm:text-sm font-bold tracking-wider uppercase shadow-xl backdrop-blur-md">
            <Sparkles className="w-4 h-4 text-[#fd1d74] animate-pulse" />
            <span>Hospital Growth &amp; Patient Acquisition</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-[1.15]">
            Simple, Transparent Packages for <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-[#ff4d8d] via-[#fd1d74] to-[#fb923c] bg-clip-text text-transparent">
              Guaranteed Patient Enquiries
            </span>
          </h1>

          {/* Subtitle */}
          <p className="max-w-2xl mx-auto text-slate-300 text-sm sm:text-base lg:text-lg leading-relaxed font-normal">
            No expensive retainers. No bidding wars. Connect directly with genuine patients actively searching for medical procedures and hospital consultations in your city.
          </p>

          {/* Trust Highlights */}
          <div className="pt-6 flex flex-wrap items-center justify-center gap-4 sm:gap-8 text-xs sm:text-sm font-semibold text-slate-300">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>100% Verified Phone Numbers</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Direct Hospital CRM Delivery</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Instant Activation</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Zero Commission on Surgeries</span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Pricing Cards Grid Section */}
      <section className="relative -mt-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 z-20 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
          {packages.map((pkg, idx) => {
            const isPopular = pkg.popular || idx === 1;
            const pricePerLead = Math.round(Number(pkg.price) / Number(pkg.leadCount));
            const formattedPrice = Number(pkg.price).toLocaleString('en-IN');
            const formattedOriginalPrice = (pkg.originalPrice || Math.round(pkg.price * 1.4)).toLocaleString('en-IN');
            const discountPercent = Math.round(((Number(pkg.originalPrice || pkg.price * 1.4) - Number(pkg.price)) / Number(pkg.originalPrice || pkg.price * 1.4)) * 100);

            return (
              <div
                key={pkg.id || idx}
                className={`relative rounded-3xl transition-all duration-300 flex flex-col justify-between ${
                  isPopular
                    ? 'bg-gradient-to-b from-[#1a1f33] via-[#161a29] to-[#121624] border-2 border-[#fd1d74] shadow-[0_0_50px_rgba(253,29,116,0.3)] lg:-translate-y-4 scale-[1.02] lg:scale-105 z-10 ring-1 ring-pink-500/50'
                    : 'bg-[#141926] border border-slate-800/80 shadow-xl hover:border-slate-700 hover:shadow-2xl hover:-translate-y-1'
                }`}
              >
                {/* Popular Header Badge */}
                {isPopular && (
                  <div className="bg-gradient-to-r from-[#fd1d74] to-[#b02151] text-white text-[11px] font-black uppercase tracking-widest text-center py-2 px-4 rounded-t-2xl shadow-md flex items-center justify-center space-x-1.5">
                    <Star className="w-3.5 h-3.5 fill-current text-yellow-300" />
                    <span>Recommended For Most Hospitals</span>
                  </div>
                )}

                <div className="p-6 sm:p-7 flex-1 flex flex-col justify-between space-y-6">
                  {/* Top Details & Tag */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className={`text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full border ${
                        isPopular
                          ? 'bg-pink-500/20 text-pink-300 border-pink-500/30'
                          : 'bg-slate-800 text-slate-300 border-slate-700'
                      }`}>
                        {pkg.tag || 'Standard Tier'}
                      </span>
                      {discountPercent > 0 && (
                        <span className="text-[10px] font-extrabold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                          Save {discountPercent}%
                        </span>
                      )}
                    </div>

                    <h3 className="text-xl font-extrabold text-white">{pkg.name}</h3>
                    <p className="text-xs text-slate-400 leading-relaxed min-h-[48px]">
                      {pkg.description}
                    </p>
                  </div>

                  {/* Pricing Hero Box */}
                  <div className="p-4 rounded-2xl bg-black/40 border border-white/5 space-y-2">
                    <div className="flex items-baseline space-x-2">
                      <span className="text-2xl font-bold text-slate-400">₹</span>
                      <span className="text-4xl font-black text-white tracking-tight">{formattedPrice}</span>
                      <span className="text-xs text-slate-500 line-through">₹{formattedOriginalPrice}</span>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-1 border-t border-white/5">
                      <span className="font-extrabold text-[#ff4d8d]">
                        ₹{pricePerLead} / lead
                      </span>
                      <span className="text-slate-400 font-medium flex items-center space-x-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>{pkg.validityDays ? `${pkg.validityDays} Days` : 'Lifetime'}</span>
                      </span>
                    </div>
                  </div>

                  {/* Lead Capacity Highlight */}
                  <div className={`p-4 rounded-2xl text-center border ${
                    isPopular
                      ? 'bg-gradient-to-r from-pink-500/15 to-purple-500/15 border-pink-500/30 text-white'
                      : 'bg-slate-800/50 border-slate-700/50 text-slate-200'
                  }`}>
                    <div className="text-3xl font-black text-white flex items-center justify-center space-x-1">
                      <span>{pkg.leadCount}</span>
                      <span className="text-lg font-bold text-pink-400">+</span>
                    </div>
                    <span className="text-[11px] font-extrabold text-slate-300 uppercase tracking-wider block mt-0.5">
                      Verified Patient Enquiries
                    </span>
                  </div>

                  {/* Feature Checklist */}
                  <div className="space-y-3 pt-2">
                    <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider block">
                      Included Capabilities:
                    </span>
                    <ul className="space-y-2.5 text-xs text-slate-300">
                      {pkg.features.map((feat, fIdx) => (
                        <li key={fIdx} className="flex items-start space-x-2.5">
                          <div className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0 mt-0.5 border border-emerald-500/30">
                            <Check className="w-2.5 h-2.5 stroke-[3]" />
                          </div>
                          <span className="leading-tight">{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Action CTA Button */}
                  <div className="pt-4">
                    <Link
                      href="/hospital/packages"
                      className={`w-full py-3.5 px-5 rounded-2xl font-extrabold text-xs uppercase tracking-wider flex items-center justify-center space-x-2 transition-all shadow-lg ${
                        isPopular
                          ? 'bg-gradient-to-r from-[#fd1d74] via-[#ec2c6c] to-[#b02151] text-white hover:brightness-110 shadow-pink-500/30'
                          : 'bg-white text-slate-900 hover:bg-slate-100 shadow-white/5'
                      }`}
                    >
                      <span>Get {pkg.leadCount} Patient Leads</span>
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Feature Comparison Matrix Section */}
      <section className="py-20 bg-[#0f1422] border-y border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center space-y-3 max-w-3xl mx-auto">
            <span className="text-xs font-extrabold text-[#fd1d74] uppercase tracking-wider">
              Detailed Package Breakdown
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
              Compare Hospital Package Features
            </h2>
            <p className="text-sm text-slate-400">
              Transparent specifications for every stage of medical practice growth.
            </p>
          </div>

          {/* Responsive Comparison Table */}
          <div className="overflow-x-auto rounded-3xl border border-slate-800 bg-[#141926] shadow-2xl">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/60 text-xs uppercase tracking-wider">
                  <th className="p-5 font-black text-slate-300 w-1/4">Key Features</th>
                  <th className="p-5 font-black text-slate-300">Starter (25)</th>
                  <th className="p-5 font-black text-[#ff4d8d] bg-pink-500/5 border-x border-pink-500/20">
                    Growth (50) ★
                  </th>
                  <th className="p-5 font-black text-slate-300">Pro (100)</th>
                  <th className="p-5 font-black text-slate-300">Enterprise (250)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 text-xs sm:text-sm text-slate-300">
                {comparisonMatrix.map((row, rIdx) => (
                  <tr key={rIdx} className="hover:bg-slate-800/30 transition-colors">
                    <td className="p-5 font-bold text-white flex items-center space-x-2">
                      <span>{row.feature}</span>
                    </td>
                    <td className="p-5 text-slate-300">{row.starter}</td>
                    <td className="p-5 font-extrabold text-white bg-pink-500/5 border-x border-pink-500/20">
                      {row.growth}
                    </td>
                    <td className="p-5 text-slate-300">{row.pro}</td>
                    <td className="p-5 text-slate-300">{row.enterprise}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Interactive ROI Calculator */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-br from-[#131929] via-[#1a2238] to-[#121726] rounded-3xl p-8 sm:p-14 text-white shadow-2xl border border-slate-800 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#fd1d74]/10 rounded-full blur-3xl pointer-events-none" />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center relative z-10">
            {/* Left Info & Slider */}
            <div className="lg:col-span-6 space-y-6">
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-pink-500/20 text-pink-300 text-xs font-bold uppercase tracking-wider">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>Return On Investment Calculator</span>
              </div>
              <h2 className="text-2xl sm:text-4xl font-black text-white leading-tight">
                Forecast Your Hospital Admissions &amp; Revenue
              </h2>
              <p className="text-slate-300 text-sm leading-relaxed">
                See how increasing your verified patient consultation flow translates directly into surgical appointments and OPD admissions.
              </p>

              {/* Slider Component */}
              <div className="space-y-4 pt-2 bg-black/40 border border-white/10 p-6 rounded-2xl">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Lead Volume:</span>
                  <span className="text-2xl font-black text-[#ff4d8d]">{calcLeads} Patient Leads</span>
                </div>
                <input
                  type="range"
                  min="25"
                  max="500"
                  step="25"
                  value={calcLeads}
                  onChange={(e) => setCalcLeads(Number(e.target.value))}
                  className="w-full h-3 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-[#fd1d74]"
                />
                <div className="flex justify-between text-[11px] text-slate-400 font-medium">
                  <span>25 Leads</span>
                  <span>100 Leads</span>
                  <span>250 Leads</span>
                  <span>500+ Leads</span>
                </div>
              </div>
            </div>

            {/* Right Projected Yield Box */}
            <div className="lg:col-span-6">
              <div className="bg-[#0b0f19] border border-slate-700/80 rounded-3xl p-8 space-y-6 shadow-2xl">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider">
                  Estimated Hospital Performance Output
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-pink-500/10 border border-pink-500/20 p-5 rounded-2xl text-center">
                    <span className="text-3xl sm:text-4xl font-black text-[#ff4d8d]">~{estimatedPatients}</span>
                    <span className="text-xs font-extrabold text-slate-300 block mt-1">
                      Projected Patient Consultations
                    </span>
                  </div>

                  <div className="bg-emerald-500/10 border border-emerald-500/20 p-5 rounded-2xl text-center">
                    <span className="text-2xl sm:text-3xl font-black text-emerald-400">₹{estimatedMinRevenue}</span>
                    <span className="text-xs font-extrabold text-slate-300 block mt-1">
                      Estimated Procedure Value
                    </span>
                  </div>
                </div>

                <p className="text-[11px] text-slate-400 leading-relaxed">
                  * Based on an average 35% clinical conversion rate and typical OPD/IPD procedural ticket values across Indian multi-specialty healthcare centers.
                </p>

                <Link
                  href="/get-listed"
                  className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-[#fd1d74] to-[#b02151] text-white font-black text-xs uppercase tracking-wider flex items-center justify-center space-x-2 shadow-xl hover:brightness-110 transition-all"
                >
                  <Building2 className="w-4 h-4" />
                  <span>Onboard Your Hospital &amp; Start Receiving Leads</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3-Step Workflow Section */}
      <section className="py-20 bg-[#0b0f19]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center space-y-3 max-w-3xl mx-auto">
            <span className="text-xs font-extrabold text-[#fd1d74] uppercase tracking-wider">
              Seamless Integration
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white">How Patient Delivery Works</h2>
            <p className="text-sm text-slate-400">
              From patient search to your OPD consultation desk in three simple steps.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-[#141926] border border-slate-800 rounded-3xl p-8 space-y-4 hover:border-pink-500/40 transition-all">
              <div className="w-12 h-12 rounded-2xl bg-pink-500/20 text-[#ff4d8d] flex items-center justify-center font-black text-xl border border-pink-500/30">
                1
              </div>
              <h3 className="text-lg font-extrabold text-white">Choose Your Package</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Select your required lead volume. Complete instant online checkout to credit your hospital portal balance in real-time.
              </p>
            </div>

            <div className="bg-[#141926] border border-slate-800 rounded-3xl p-8 space-y-4 hover:border-pink-500/40 transition-all">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-black text-xl border border-amber-500/30">
                2
              </div>
              <h3 className="text-lg font-extrabold text-white">Receive Instant Leads</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                When patients enquire for medical procedures in your specialty, full details (phone, email, message) arrive directly via email &amp; CRM.
              </p>
            </div>

            <div className="bg-[#141926] border border-slate-800 rounded-3xl p-8 space-y-4 hover:border-pink-500/40 transition-all">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-black text-xl border border-emerald-500/30">
                3
              </div>
              <h3 className="text-lg font-extrabold text-white">Schedule Consultations</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Your hospital coordinators contact the patient directly, book diagnostic consultations, and convert enquiries into admissions.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        <div className="text-center space-y-3">
          <span className="text-xs font-extrabold text-[#fd1d74] uppercase tracking-wider">
            Clear Answers
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white">Frequently Asked Questions</h2>
          <p className="text-sm text-slate-400">
            Got questions regarding lead packages, renewal policies, or technical setup?
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, i) => (
            <div
              key={i}
              className="bg-[#141926] border border-slate-800 rounded-2xl overflow-hidden transition-all shadow-md"
            >
              <button
                onClick={() => toggleFaq(i)}
                className="w-full text-left p-6 flex justify-between items-center space-x-4 hover:bg-slate-800/40 transition-colors"
              >
                <span className="font-extrabold text-sm sm:text-base text-white">{faq.q}</span>
                <ChevronDown
                  className={`w-5 h-5 text-slate-400 transition-transform duration-200 flex-shrink-0 ${
                    openFaq === i ? 'rotate-180 text-[#fd1d74]' : ''
                  }`}
                />
              </button>
              {openFaq === i && (
                <div className="px-6 pb-6 text-xs sm:text-sm text-slate-300 leading-relaxed border-t border-slate-800 pt-4 bg-slate-900/30">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Custom Enterprise Banner CTA */}
      <section className="pb-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-[#b02151] via-[#fd1d74] to-[#f97316] rounded-3xl p-8 sm:p-14 text-white flex flex-col lg:flex-row items-center justify-between gap-8 shadow-2xl relative overflow-hidden">
          <div className="space-y-3 text-center lg:text-left z-10">
            <span className="text-xs font-black uppercase tracking-widest bg-black/20 px-3 py-1 rounded-full">
              Enterprise Hospital Networks
            </span>
            <h3 className="text-2xl sm:text-4xl font-black">Need High-Volume Custom Routing?</h3>
            <p className="text-white/90 text-xs sm:text-sm max-w-2xl leading-relaxed">
              We provide enterprise integrations, multi-city department routing, and custom CRM webhooks for hospital networks requiring 500+ patient leads per month.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4 flex-shrink-0 z-10 w-full sm:w-auto">
            <Link
              href="/contact-us"
              className="w-full sm:w-auto px-8 py-4 rounded-full bg-white text-slate-900 font-black text-xs uppercase tracking-wider shadow-2xl hover:bg-slate-100 transition-all text-center"
            >
              Contact Enterprise Desk
            </Link>
            <a
              href="mailto:info@clinicbychoice.com"
              className="w-full sm:w-auto px-6 py-4 rounded-full bg-black/25 hover:bg-black/40 text-white font-extrabold text-xs uppercase tracking-wider flex items-center justify-center space-x-2 backdrop-blur-md transition-all border border-white/20"
            >
              <PhoneCall className="w-4 h-4" />
              <span>info@clinicbychoice.com</span>
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
