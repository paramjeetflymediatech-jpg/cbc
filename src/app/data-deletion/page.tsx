import React from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Link from 'next/link';
import { 
  Trash2, 
  ShieldAlert, 
  CheckCircle2, 
  Mail, 
  Phone, 
  Clock, 
  Smartphone, 
  FileText, 
  ChevronRight,
  Info
} from 'lucide-react';
import { getPageMetadata } from '@/lib/seo';
import DataDeletionClient from '@/app/data-deletion/DataDeletionClient';

export const dynamic = 'force-dynamic';

export async function generateMetadata() {
  return await getPageMetadata(
    '/data-deletion',
    'Account & Data Deletion Request - Clinic By Choice',
    'Submit an account and data deletion request for Clinic By Choice website and Android mobile app. Permanently delete your user profile and healthcare inquiries.'
  );
}

export default async function DataDeletionPage() {
  const { getPageSchemaMarkup } = await import('@/lib/seo');
  const schemaMarkup = await getPageSchemaMarkup('/data-deletion');

  return (
    <div className="min-h-screen flex flex-col bg-[#fbfbfd]">
      <Header />

      {/* Hero Banner */}
      <section className="relative bg-[#101828] text-white py-14 sm:py-18 overflow-hidden border-b border-gray-800">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#ec2c6c_1px,transparent_1px)] [background-size:20px_20px]" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <nav className="flex items-center space-x-2 text-xs sm:text-sm text-gray-400 mb-6">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <Link href="/privacy-policy" className="hover:text-white transition-colors">Privacy Policy</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-[#ec2c6c] font-semibold">Data Deletion</span>
          </nav>

          <div className="max-w-3xl">
            <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-rose-500/10 border border-rose-500/20 text-[#ec2c6c] text-xs sm:text-sm font-bold mb-4">
              <Trash2 className="w-4 h-4 text-[#ec2c6c]" />
              <span>Google Play Developer Policy &amp; DPDPA Compliance</span>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white mb-4">
              User Account &amp; Data Deletion
            </h1>
            <p className="text-gray-300 text-sm sm:text-base leading-relaxed">
              At Clinic By Choice, you have complete ownership of your personal data. This page allows you to submit a formal request to permanently delete your account, personal credentials, and medical inquiry records across our platform.
            </p>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16 flex-1 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          
          {/* Left Column: Form & Methods */}
          <div className="lg:col-span-7 space-y-8">
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200/80 shadow-sm space-y-6">
              <div className="space-y-2">
                <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900">
                  Online Deletion Request Form
                </h2>
                <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                  Enter your registered email address and password below to securely verify your identity. You do not need to have the mobile app installed to request deletion.
                </p>
              </div>

              {/* Interactive Client Form */}
              <DataDeletionClient />
            </div>

            {/* In-App Deletion Steps */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200/80 shadow-sm space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-pink-50 text-[#ec2c6c] flex items-center justify-center">
                  <Smartphone className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-extrabold text-gray-900">
                  How to Delete Directly in the Mobile App
                </h3>
              </div>

              <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                If you currently have the <strong>Clinic By Choice</strong> app installed on your Android or iOS device:
              </p>

              <ol className="space-y-3 text-xs sm:text-sm text-gray-700 list-decimal list-inside pl-1">
                <li>Open the <strong>Clinic By Choice</strong> mobile application.</li>
                <li>Tap the <strong>Profile</strong> tab in the bottom navigation.</li>
                <li>Scroll down to the <strong>Settings &amp; Support</strong> section.</li>
                <li>Tap <strong>Delete Account &amp; Data</strong>.</li>
                <li>Confirm the prompt. Your session will be immediately terminated and your data permanently purged.</li>
              </ol>
            </div>
          </div>

          {/* Right Column: Information & Disclosures */}
          <div className="lg:col-span-5 space-y-6">
            {/* What Gets Deleted Card */}
            <div className="bg-white rounded-3xl p-6 border border-gray-200/80 shadow-sm space-y-4">
              <div className="flex items-center space-x-2.5 text-rose-600 font-extrabold text-sm uppercase tracking-wider">
                <ShieldAlert className="w-4 h-4" />
                <span>What Data is Deleted</span>
              </div>

              <ul className="space-y-2.5 text-xs sm:text-sm text-gray-700">
                <li className="flex items-start space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <span><strong>Personal Profile:</strong> Full name, email address, phone number, saved addresses, profile pictures, and hashed passwords.</span>
                </li>
                <li className="flex items-start space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <span><strong>Consultation Inquiries:</strong> Past doctor appointments, specialty requests, symptoms notes, and medical coordinator communications.</span>
                </li>
                <li className="flex items-start space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <span><strong>Device Data:</strong> Push notification tokens, session cookies, and IP diagnostic logs.</span>
                </li>
              </ul>
            </div>

            {/* What Data is Retained Card */}
            <div className="bg-white rounded-3xl p-6 border border-gray-200/80 shadow-sm space-y-3">
              <div className="flex items-center space-x-2.5 text-gray-800 font-extrabold text-sm uppercase tracking-wider">
                <Info className="w-4 h-4 text-[#ec2c6c]" />
                <span>Data Retention Policy</span>
              </div>
              <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                Personal identifier records are deleted immediately. In accordance with applicable Indian laws and regulatory financial statutes, formal invoices or transaction records for completed hospital subscription fees are retained for up to 7 years solely for tax, legal, and statutory accounting audits. No medical notes or personal profile records are retained.
              </p>
            </div>

            {/* Turnaround Time Card */}
            <div className="bg-gradient-to-br from-pink-50 to-rose-50/50 rounded-3xl p-6 border border-pink-100 shadow-sm space-y-3">
              <div className="flex items-center space-x-2.5 text-gray-900 font-extrabold text-sm">
                <Clock className="w-4 h-4 text-[#ec2c6c]" />
                <span>Processing Timeframe</span>
              </div>
              <p className="text-xs text-gray-700 leading-relaxed">
                Requests submitted via the mobile app are processed <strong>immediately</strong>. Web form or email requests are verified and processed within <strong>24 to 48 hours</strong>, with automated backup cycles fully purging residual data within 30 days.
              </p>
            </div>

            {/* Contact Card */}
            <div className="p-6 bg-gray-50 rounded-3xl border border-gray-200/80 space-y-3">
              <h4 className="font-extrabold text-gray-900 text-sm">Need Direct Assistance?</h4>
              <p className="text-xs text-gray-600 leading-relaxed">
                You can also email our Data Protection Team directly from your registered email:
              </p>
              <a
                href="mailto:privacy@clinicbychoice.com?subject=Data%20Deletion%20Request"
                className="inline-flex items-center space-x-2 text-xs font-bold text-[#ec2c6c] hover:underline"
              >
                <Mail className="w-3.5 h-3.5" />
                <span>privacy@clinicbychoice.com</span>
              </a>
            </div>
          </div>
        </div>
      </main>

      <Footer />

      {schemaMarkup && (
        schemaMarkup.includes('<script') ? (
          <span dangerouslySetInnerHTML={{ __html: schemaMarkup }} />
        ) : (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: schemaMarkup }}
          />
        )
      )}
    </div>
  );
}
