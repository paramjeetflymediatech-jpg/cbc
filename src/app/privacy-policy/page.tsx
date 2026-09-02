import React from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Link from 'next/link';
import { 
  ShieldCheck, 
  Lock, 
  Eye, 
  Trash2, 
  FileText, 
  Server, 
  Mail, 
  UserCheck, 
  AlertCircle, 
  CheckCircle2, 
  Phone, 
  MapPin, 
  ChevronRight,
  ExternalLink
} from 'lucide-react';
import { getPageMetadata } from '@/lib/seo';

export const dynamic = 'force-dynamic';

export async function generateMetadata() {
  return await getPageMetadata(
    '/privacy-policy',
    'Privacy Policy - Clinic By Choice',
    'Learn how Clinic By Choice protects your medical and personal data. Read our privacy policy covering web and mobile app data protection, retention, and deletion.'
  );
}

export default async function PrivacyPolicyPage() {
  const { getPageSchemaMarkup } = await import('@/lib/seo');
  const schemaMarkup = await getPageSchemaMarkup('/privacy-policy');

  const sections = [
    { id: 'introduction', label: '1. Introduction & Overview' },
    { id: 'data-we-collect', label: '2. Information We Collect' },
    { id: 'how-we-use-data', label: '3. How We Use Your Information' },
    { id: 'sharing-disclosure', label: '4. Information Sharing & Disclosure' },
    { id: 'data-security', label: '5. Data Security & Protection' },
    { id: 'data-retention-deletion', label: '6. Data Retention & Account Deletion' },
    { id: 'user-rights', label: '7. Your Privacy Rights' },
    { id: 'cookies-tracking', label: '8. Cookies & Tracking Technologies' },
    { id: 'children-privacy', label: '9. Children\'s Privacy' },
    { id: 'third-parties', label: '10. Third-Party Services & Links' },
    { id: 'policy-changes', label: '11. Changes to This Policy' },
    { id: 'contact-us', label: '12. Contact & Grievance Officer' },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#fbfbfd]">
      <Header />

      {/* Hero Banner */}
      <section className="relative bg-[#101828] text-white py-16 sm:py-20 overflow-hidden border-b border-gray-800">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#ec2c6c_1px,transparent_1px)] [background-size:20px_20px]" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          {/* Breadcrumb */}
          <nav className="flex items-center space-x-2 text-xs sm:text-sm text-gray-400 mb-6">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-[#ec2c6c] font-semibold">Privacy Policy</span>
          </nav>

          <div className="max-w-3xl">
            <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-pink-500/10 border border-pink-500/20 text-[#ec2c6c] text-xs sm:text-sm font-bold mb-4">
              <ShieldCheck className="w-4 h-4 text-[#ec2c6c]" />
              <span>Official Privacy & Data Protection Policy</span>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white mb-4">
              Your Privacy & Trust Come First
            </h1>
            <p className="text-gray-300 text-sm sm:text-base leading-relaxed">
              At Clinic By Choice, we believe medical choices require uncompromising trust. This Privacy Policy details how we collect, handle, safeguard, and delete your personal and healthcare information across our website and mobile application.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-4 text-xs sm:text-sm text-gray-400">
              <span><strong>Last Updated:</strong> September 2026</span>
              <span>•</span>
              <span><strong>Applies to:</strong> Web platform & Google Play Mobile App</span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16 flex-1 w-full">
        {/* Key Highlights Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white rounded-2xl p-6 border border-gray-200/80 shadow-sm flex items-start space-x-4">
            <div className="w-12 h-12 rounded-xl bg-pink-50 text-[#ec2c6c] flex items-center justify-center flex-shrink-0">
              <Lock className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-base mb-1">Encrypted In-Transit & At-Rest</h3>
              <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                All communications use industry-standard TLS 1.3 encryption, and sensitive data is secured with AES-256 protocols.
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-gray-200/80 shadow-sm flex items-start space-x-4">
            <div className="w-12 h-12 rounded-xl bg-pink-50 text-[#ec2c6c] flex items-center justify-center flex-shrink-0">
              <Eye className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-base mb-1">Zero Data Sale Guarantee</h3>
              <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                We never sell, rent, or trade your personal health data or contact information to data brokers or third-party marketers.
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-gray-200/80 shadow-sm flex items-start space-x-4">
            <div className="w-12 h-12 rounded-xl bg-pink-50 text-[#ec2c6c] flex items-center justify-center flex-shrink-0">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-base mb-1">Complete Account Deletion</h3>
              <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                You retain full control over your data. Request complete deletion of your account and personal history at any time.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          {/* Sticky Left Navigation (Desktop) */}
          <aside className="hidden lg:block lg:col-span-4 sticky top-28 space-y-6">
            <div className="bg-white rounded-2xl p-6 border border-gray-200/80 shadow-sm">
              <h3 className="text-sm font-extrabold text-gray-900 uppercase tracking-wider mb-4 pb-3 border-b border-gray-100">
                Table of Contents
              </h3>
              <nav className="space-y-1.5 text-xs sm:text-sm font-medium">
                {sections.map((sec) => (
                  <a
                    key={sec.id}
                    href={`#${sec.id}`}
                    className="block py-1.5 px-2.5 rounded-lg text-gray-600 hover:text-[#ec2c6c] hover:bg-pink-50/50 transition-colors"
                  >
                    {sec.label}
                  </a>
                ))}
              </nav>
            </div>

            {/* Quick Contact Card */}
            <div className="bg-gradient-to-br from-pink-50 to-rose-50/40 rounded-2xl p-6 border border-pink-100 shadow-sm space-y-3">
              <h4 className="font-extrabold text-gray-900 text-sm">Need Privacy Assistance?</h4>
              <p className="text-xs text-gray-600 leading-relaxed">
                Have questions regarding your personal information, or wish to submit a data erasure request?
              </p>
              <a
                href="mailto:privacy@clinicbychoice.com"
                className="inline-flex items-center space-x-2 text-xs font-bold text-[#ec2c6c] hover:underline"
              >
                <Mail className="w-3.5 h-3.5" />
                <span>privacy@clinicbychoice.com</span>
              </a>
            </div>
          </aside>

          {/* Right Detailed Sections */}
          <div className="lg:col-span-8 space-y-10">
            {/* Section 1 */}
            <section id="introduction" className="bg-white rounded-2xl p-6 sm:p-8 border border-gray-200/80 shadow-sm space-y-4">
              <div className="flex items-center space-x-3">
                <span className="w-8 h-8 rounded-full bg-pink-100 text-[#ec2c6c] font-bold text-sm flex items-center justify-center">1</span>
                <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900">Introduction & Overview</h2>
              </div>
              <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
                Welcome to <strong>Clinic By Choice</strong> (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;, or &quot;Company&quot;). We operate the healthcare discovery and medical facilitation marketplace accessible via our official website (<Link href="/" className="text-[#ec2c6c] hover:underline">https://clinicbychoice.com</Link>) and our dedicated mobile application available on the Google Play Store (collectively, the &quot;Platform&quot;).
              </p>
              <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
                We are committed to maintaining the confidentiality, integrity, and security of all personal, technical, and medical inquiry data entrusted to us by patients, medical practitioners, and partner healthcare institutions. This Privacy Policy governs your use of our Platform and explains how we gather, utilize, store, share, and protect your information, as well as your choices regarding your data.
              </p>
            </section>

            {/* Section 2 */}
            <section id="data-we-collect" className="bg-white rounded-2xl p-6 sm:p-8 border border-gray-200/80 shadow-sm space-y-4">
              <div className="flex items-center space-x-3">
                <span className="w-8 h-8 rounded-full bg-pink-100 text-[#ec2c6c] font-bold text-sm flex items-center justify-center">2</span>
                <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900">Information We Collect</h2>
              </div>
              <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
                In order to provide hospital discovery, medical consultation coordination, and user account features, we collect several categories of information:
              </p>

              <div className="space-y-4 mt-3">
                <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
                  <h3 className="font-bold text-gray-900 text-sm sm:text-base mb-1">A. Personal Identification Data</h3>
                  <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                    When you register an account, book an appointment, or submit an enquiry, we collect your full name, email address, contact phone number, age, gender, and city or state.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
                  <h3 className="font-bold text-gray-900 text-sm sm:text-base mb-1">B. Medical Consultation & Inquiry Information</h3>
                  <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                    Information you voluntarily submit when requesting care: medical specialty sought (e.g., Orthopedic, Cardiology, Dental, Dermatology), desired procedures, symptoms, preferred hospital or doctor selections, notes, and appointment preferences.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
                  <h3 className="font-bold text-gray-900 text-sm sm:text-base mb-1">C. Mobile & Device Information (Google Play App Disclosures)</h3>
                  <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                    When you use our Android mobile application or website, we may automatically collect diagnostic technical identifiers: device manufacturer and model, operating system version, unique device tokens for push notifications (if granted), IP address, app crash logs, and network connection type to ensure stability and smooth performance.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
                  <h3 className="font-bold text-gray-900 text-sm sm:text-base mb-1">D. Hospital & Provider Partner Information</h3>
                  <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                    For hospitals and healthcare clinics registering on our portal: institutional name, administrative contacts, medical registration licenses, service offerings, doctor credentials, and facility photos.
                  </p>
                </div>
              </div>
            </section>

            {/* Section 3 */}
            <section id="how-we-use-data" className="bg-white rounded-2xl p-6 sm:p-8 border border-gray-200/80 shadow-sm space-y-4">
              <div className="flex items-center space-x-3">
                <span className="w-8 h-8 rounded-full bg-pink-100 text-[#ec2c6c] font-bold text-sm flex items-center justify-center">3</span>
                <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900">How We Use Your Information</h2>
              </div>
              <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
                We process your information strictly for legitimate healthcare facilitation purposes:
              </p>
              <ul className="space-y-2.5 text-xs sm:text-sm text-gray-700">
                <li className="flex items-start space-x-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <span><strong>Healthcare Coordination:</strong> To connect you with your chosen accredited hospitals, clinics, and doctors for appointment scheduling and procedure estimates.</span>
                </li>
                <li className="flex items-start space-x-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <span><strong>Care Support & Enquiries:</strong> To facilitate callbacks from care coordinators and provide updates regarding your medical inquiries.</span>
                </li>
                <li className="flex items-start space-x-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <span><strong>Account Authentication:</strong> To securely verify your identity, maintain your session, and allow you to manage saved doctors and enquiries.</span>
                </li>
                <li className="flex items-start space-x-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <span><strong>Safety & Quality Assurance:</strong> To detect fraudulent listings, prevent spam inquiries, debug application issues, and optimize platform speed.</span>
                </li>
                <li className="flex items-start space-x-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <span><strong>Legal Compliance:</strong> To satisfy statutory, accounting, and regulatory obligations under Indian law.</span>
                </li>
              </ul>
            </section>

            {/* Section 4 */}
            <section id="sharing-disclosure" className="bg-white rounded-2xl p-6 sm:p-8 border border-gray-200/80 shadow-sm space-y-4">
              <div className="flex items-center space-x-3">
                <span className="w-8 h-8 rounded-full bg-pink-100 text-[#ec2c6c] font-bold text-sm flex items-center justify-center">4</span>
                <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900">Information Sharing & Disclosure</h2>
              </div>
              <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
                Clinic By Choice respects patient confidentiality. We only share information under the following defined circumstances:
              </p>
              <div className="space-y-3 text-xs sm:text-sm text-gray-700">
                <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-100">
                  <strong className="text-gray-900 block mb-1">1. User-Selected Healthcare Providers</strong>
                  When you submit an inquiry or appointment request for a specific hospital or doctor, relevant contact and consultation notes are transmitted to that accredited facility so their medical team can assist you.
                </div>
                <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-100">
                  <strong className="text-gray-900 block mb-1">2. Trusted Technical Service Providers</strong>
                  We employ reputable third-party cloud infrastructure providers (e.g., secure database hosting, transactional email/SMS gateways, Google Maps for location verification) who process data strictly under our instructions and confidentiality requirements.
                </div>
                <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-100">
                  <strong className="text-gray-900 block mb-1">3. Legal & Regulatory Disclosures</strong>
                  We may disclose data if legally required to do so by a valid subpoena, court order, or governmental inquiry, or to protect the vital medical interests of an individual.
                </div>
                <div className="p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-200/60 text-emerald-900">
                  <strong className="font-extrabold block mb-1">No Sale or Unauthorized Commercialization of Data</strong>
                  We affirm that Clinic By Choice does not sell, lease, monetize, or disclose user data to third-party advertisers, data aggregators, or unauthorized third parties.
                </div>
              </div>
            </section>

            {/* Section 5 */}
            <section id="data-security" className="bg-white rounded-2xl p-6 sm:p-8 border border-gray-200/80 shadow-sm space-y-4">
              <div className="flex items-center space-x-3">
                <span className="w-8 h-8 rounded-full bg-pink-100 text-[#ec2c6c] font-bold text-sm flex items-center justify-center">5</span>
                <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900">Data Security & Protection</h2>
              </div>
              <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
                We implement robust organizational, technical, and administrative safeguards designed to protect personal and medical data against unauthorized access, alteration, disclosure, or destruction:
              </p>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm text-gray-700">
                <li className="p-3 rounded-xl bg-gray-50 border border-gray-100 flex items-start space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                  <span><strong>TLS/HTTPS Encryption:</strong> All data transmitted between user devices and our servers is encrypted in transit using modern TLS protocols.</span>
                </li>
                <li className="p-3 rounded-xl bg-gray-50 border border-gray-100 flex items-start space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                  <span><strong>AES-256 Storage:</strong> Stored databases and confidential records are protected with industry-grade AES-256 encryption.</span>
                </li>
                <li className="p-3 rounded-xl bg-gray-50 border border-gray-100 flex items-start space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                  <span><strong>Hashed Credentials:</strong> Passwords are cryptographically salted and hashed; we never store plain text passwords.</span>
                </li>
                <li className="p-3 rounded-xl bg-gray-50 border border-gray-100 flex items-start space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                  <span><strong>Role-Based Access:</strong> Only authorized personnel who require access for support or coordination are granted database privileges.</span>
                </li>
              </ul>
            </section>

            {/* Section 6 - Crucial for Google Play Store */}
            <section id="data-retention-deletion" className="bg-white rounded-2xl p-6 sm:p-8 border-2 border-pink-100 shadow-md space-y-6">
              <div className="flex items-center space-x-3">
                <span className="w-8 h-8 rounded-full bg-[#ec2c6c] text-white font-bold text-sm flex items-center justify-center">6</span>
                <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900">Data Retention & Account Deletion Policy</h2>
              </div>
              
              <div className="bg-pink-50/60 p-4 rounded-xl border border-pink-200/60 text-xs sm:text-sm text-gray-800 leading-relaxed">
                <p className="font-semibold text-gray-900 mb-1">
                  Google Play Store & DPDPA Compliance Disclosure:
                </p>
                <p>
                  In accordance with Google Play Developer Policies and data protection standards, users have the absolute right to request the complete deletion of their account and all associated personal and consultation data.
                </p>
              </div>

              <div className="space-y-3">
                <h3 className="font-bold text-gray-900 text-base">How Long We Retain Data</h3>
                <p className="text-xs sm:text-sm text-gray-700 leading-relaxed">
                  We retain personal data only for as long as your account remains active or as needed to fulfill your medical coordination requests, resolve disputes, enforce agreements, or comply with legal statutory requirements. When data is no longer necessary, it is securely purged or anonymized.
                </p>
              </div>

              <div className="space-y-4">
                <h3 className="font-bold text-gray-900 text-base">How to Request Account & Data Deletion</h3>
                <p className="text-xs sm:text-sm text-gray-700 leading-relaxed">
                  You can request the deletion of your account and personal records at any time through either of the following straightforward methods:
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Method 1: Email Request */}
                  <div className="p-5 rounded-2xl bg-white border border-gray-200 shadow-sm space-y-2.5">
                    <div className="w-9 h-9 rounded-xl bg-pink-50 text-[#ec2c6c] flex items-center justify-center font-bold text-sm">
                      <Mail className="w-4 h-4" />
                    </div>
                    <h4 className="font-extrabold text-gray-900 text-sm">Option A: Direct Email Request</h4>
                    <p className="text-xs text-gray-600 leading-relaxed">
                      Send an email to <a href="mailto:privacy@clinicbychoice.com" className="text-[#ec2c6c] font-bold hover:underline">privacy@clinicbychoice.com</a> or <a href="mailto:info@clinicbychoice.com" className="text-[#ec2c6c] font-bold hover:underline">info@clinicbychoice.com</a> with the subject line <strong>&quot;Data Deletion Request&quot;</strong> and your registered phone number or email.
                    </p>
                  </div>

                  {/* Method 2: In-App / Account Settings */}
                  <div className="p-5 rounded-2xl bg-white border border-gray-200 shadow-sm space-y-2.5">
                    <div className="w-9 h-9 rounded-xl bg-pink-50 text-[#ec2c6c] flex items-center justify-center font-bold text-sm">
                      <Trash2 className="w-4 h-4" />
                    </div>
                    <h4 className="font-extrabold text-gray-900 text-sm">Option B: In-App or Portal Profile</h4>
                    <p className="text-xs text-gray-600 leading-relaxed">
                      Log into your Clinic By Choice mobile application or patient dashboard, navigate to <strong>Profile &gt; Privacy &amp; Security</strong>, and tap <strong>Request Account Deletion</strong>.
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-600 space-y-1">
                  <p className="font-bold text-gray-800">What Happens Upon Deletion Request:</p>
                  <p>• Our Data Protection Team verifies your identity and processes the request within <strong>30 business days</strong>.</p>
                  <p>• Your personal identification, login credentials, and stored consultation inquiries are permanently purged from our active operational databases.</p>
                  <p>• You will receive a written confirmation once the deletion process is complete.</p>
                </div>
              </div>
            </section>

            {/* Section 7 */}
            <section id="user-rights" className="bg-white rounded-2xl p-6 sm:p-8 border border-gray-200/80 shadow-sm space-y-4">
              <div className="flex items-center space-x-3">
                <span className="w-8 h-8 rounded-full bg-pink-100 text-[#ec2c6c] font-bold text-sm flex items-center justify-center">7</span>
                <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900">Your Privacy Rights</h2>
              </div>
              <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
                Depending on your location, you may exercise the following rights regarding your personal information:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm text-gray-700">
                <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-100">
                  <strong className="text-gray-900 block mb-1">Right to Access</strong>
                  Request a copy of the personal information we hold about you.
                </div>
                <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-100">
                  <strong className="text-gray-900 block mb-1">Right to Correction</strong>
                  Request correction or updating of incomplete or inaccurate data.
                </div>
                <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-100">
                  <strong className="text-gray-900 block mb-1">Right to Erasure</strong>
                  Request permanent deletion of your data when retention is no longer justified.
                </div>
                <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-100">
                  <strong className="text-gray-900 block mb-1">Right to Withdraw Consent</strong>
                  Revoke previously granted permissions for data processing at any time.
                </div>
              </div>
            </section>

            {/* Section 8 */}
            <section id="cookies-tracking" className="bg-white rounded-2xl p-6 sm:p-8 border border-gray-200/80 shadow-sm space-y-4">
              <div className="flex items-center space-x-3">
                <span className="w-8 h-8 rounded-full bg-pink-100 text-[#ec2c6c] font-bold text-sm flex items-center justify-center">8</span>
                <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900">Cookies & Tracking Technologies</h2>
              </div>
              <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
                Our website uses session cookies, local storage tokens, and analytical technologies to enhance your browsing experience. Cookies help us keep you signed in, remember your hospital search filters, and analyze web traffic patterns. You can choose to disable cookies through your browser settings, though certain interactive features of the Platform may be impacted.
              </p>
            </section>

            {/* Section 9 */}
            <section id="children-privacy" className="bg-white rounded-2xl p-6 sm:p-8 border border-gray-200/80 shadow-sm space-y-4">
              <div className="flex items-center space-x-3">
                <span className="w-8 h-8 rounded-full bg-pink-100 text-[#ec2c6c] font-bold text-sm flex items-center justify-center">9</span>
                <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900">Children&apos;s Privacy</h2>
              </div>
              <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
                Our platform is intended for use by adults. Pediatric healthcare inquiries and hospital appointments for minor patients must be submitted by a parent, legal guardian, or authorized adult caregiver. We do not knowingly collect personal information directly from children under 13 without verifiable parental consent. If you believe a child has provided us personal data without guardian consent, please contact us immediately.
              </p>
            </section>

            {/* Section 10 */}
            <section id="third-parties" className="bg-white rounded-2xl p-6 sm:p-8 border border-gray-200/80 shadow-sm space-y-4">
              <div className="flex items-center space-x-3">
                <span className="w-8 h-8 rounded-full bg-pink-100 text-[#ec2c6c] font-bold text-sm flex items-center justify-center">10</span>
                <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900">Third-Party Services & External Links</h2>
              </div>
              <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
                Our Platform may include links to third-party hospital websites, accredited diagnostic centers, medical blogs, or payment gateway providers. We do not control and are not responsible for the privacy practices or contents of these external services. We encourage you to review their specific privacy policies before providing them with personal details.
              </p>
            </section>

            {/* Section 11 */}
            <section id="policy-changes" className="bg-white rounded-2xl p-6 sm:p-8 border border-gray-200/80 shadow-sm space-y-4">
              <div className="flex items-center space-x-3">
                <span className="w-8 h-8 rounded-full bg-pink-100 text-[#ec2c6c] font-bold text-sm flex items-center justify-center">11</span>
                <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900">Changes to This Privacy Policy</h2>
              </div>
              <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
                We may periodically update this Privacy Policy to reflect modifications in our services, technological advancements, or regulatory requirements. Any revisions will be published on this page with an updated &quot;Last Updated&quot; date. We encourage you to review this policy periodically to stay informed about our data protection standards.
              </p>
            </section>

            {/* Section 12 */}
            <section id="contact-us" className="bg-white rounded-2xl p-6 sm:p-8 border border-gray-200/80 shadow-sm space-y-6">
              <div className="flex items-center space-x-3">
                <span className="w-8 h-8 rounded-full bg-pink-100 text-[#ec2c6c] font-bold text-sm flex items-center justify-center">12</span>
                <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900">Contact & Grievance Officer</h2>
              </div>
              <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
                If you have any questions, clarifications, feedback, or grievances regarding this Privacy Policy, our data collection practices, or wish to exercise your data rights, please contact our designated Grievance Officer:
              </p>

              <div className="p-6 rounded-2xl bg-gray-50 border border-gray-200/80 space-y-4">
                <div className="font-extrabold text-gray-900 text-base sm:text-lg">
                  Clinic By Choice Data Protection &amp; Grievance Office
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm text-gray-700">
                  <div className="flex items-start space-x-3">
                    <Mail className="w-4 h-4 text-[#ec2c6c] mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="font-bold block text-gray-900">Privacy & Deletion Email:</span>
                      <a href="mailto:privacy@clinicbychoice.com" className="text-[#ec2c6c] hover:underline">privacy@clinicbychoice.com</a>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <Mail className="w-4 h-4 text-[#ec2c6c] mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="font-bold block text-gray-900">General Support Email:</span>
                      <a href="mailto:info@clinicbychoice.com" className="text-[#ec2c6c] hover:underline">info@clinicbychoice.com</a>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <MapPin className="w-4 h-4 text-[#ec2c6c] mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="font-bold block text-gray-900">Location:</span>
                      <span>Clinic By Choice Network, Mumbai, Maharashtra, India</span>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <FileText className="w-4 h-4 text-[#ec2c6c] mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="font-bold block text-gray-900">Response Window:</span>
                      <span>Within 24 to 48 hours (Mon - Sat)</span>
                    </div>
                  </div>
                </div>
              </div>
            </section>
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
