'use client';

import React, { useState } from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Mail, Phone, MapPin, Send, CheckCircle2, Loader2, AlertCircle, RotateCcw } from 'lucide-react';

export default function ContactUsClient() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [requireLogin, setRequireLogin] = useState(false);
  const [isResumed, setIsResumed] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Restore saved contact form submission after login
  React.useEffect(() => {
    try {
      const stored = localStorage.getItem('cbc_pending_enquiry');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.patientName || parsed.email || parsed.phone || parsed.message) {
          if (parsed.patientName) setName(parsed.patientName);
          if (parsed.email) setEmail(parsed.email);
          if (parsed.phone && parsed.phone !== 'N/A') setPhone(parsed.phone);
          if (parsed.message) setMessage(parsed.message);
          setIsResumed(true);
        }
      }
    } catch {
      // ignore
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setRequireLogin(false);
    setLoading(true);

    try {
      const res = await fetch('/api/enquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientName: name,
          phone: phone || 'N/A',
          email,
          city: '',
          message,
          isGeneralContact: true,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.requireLogin || res.status === 409) {
          setRequireLogin(true);
          try {
            localStorage.setItem(
              'cbc_pending_enquiry',
              JSON.stringify({
                formType: 'contact',
                patientName: name,
                phone,
                email,
                city: '',
                message,
                isGeneralContact: true,
                returnUrl: typeof window !== 'undefined' ? window.location.pathname + window.location.search : '/contact-us',
              })
            );
          } catch (storageErr) {
            console.warn(storageErr);
          }
          setErrorMessage(data.error || 'An account with this email already exists. Please log in first to submit your enquiry.');
        } else {
          setErrorMessage(data.error || 'Failed to submit your message. Please try again.');
        }
      } else {
        setSubmitted(true);
        try {
          localStorage.removeItem('cbc_pending_enquiry');
        } catch {}
      }
    } catch {
      setErrorMessage('Network error while sending message. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetForm = () => {
    setName('');
    setEmail('');
    setPhone('');
    setMessage('');
    setErrorMessage('');
    setRequireLogin(false);
    setIsResumed(false);
    setSubmitted(false);
    try {
      localStorage.removeItem('cbc_pending_enquiry');
    } catch {}
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />

      <div className="bg-[#101828] text-white py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-[#ec2c6c]">Support & Help</span>
          <h1 className="text-3xl sm:text-4xl font-extrabold">Contact Clinic By Choice</h1>
          <p className="text-gray-300 text-sm max-w-xl mx-auto">
            Have questions about medical listings, hospital partnerships, or patient enquiries? Get in touch with our team.
          </p>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 flex-1 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Contact Details */}
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-extrabold text-gray-900">For any inquiry contact us</h2>
              <p className="text-sm text-gray-600 mt-2">
                Our support team is available Monday to Saturday (9 AM - 7 PM IST) to assist with hospital registrations and medical search enquiries.
              </p>
            </div>

            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 rounded-2xl bg-pink-50 text-[#ec2c6c] flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 text-base">Headquarters</h4>
                  <p className="text-sm text-gray-600">Clinic By Choice Network, Mumbai, Maharashtra, India</p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 rounded-2xl bg-pink-50 text-[#ec2c6c] flex items-center justify-center flex-shrink-0">
                  <Mail className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 text-base">Email Queries</h4>
                  <p className="text-sm text-gray-600">info@clinicbychoice.com</p>
                  <p className="text-sm text-gray-600 mt-1">anujguptaflymedia@gmail.com</p>
                </div>
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="cbc-card p-8 border border-gray-100 space-y-6">
            <h3 className="text-xl font-bold text-gray-900">Send Us A Message</h3>

            {submitted ? (
              <div className="p-8 bg-emerald-50/80 text-emerald-800 rounded-3xl text-center space-y-4 border border-emerald-100 shadow-sm">
                <CheckCircle2 className="w-14 h-14 text-emerald-600 mx-auto" />
                <h4 className="font-extrabold text-xl text-emerald-900">Message Sent Successfully!</h4>
                <p className="text-xs sm:text-sm text-emerald-700 font-medium max-w-md mx-auto leading-relaxed">
                  Thank you for reaching out. Your enquiry has been sent to our super admin team and we will get back to you shortly.
                </p>

                <div className="pt-3">
                  <button
                    type="button"
                    onClick={handleResetForm}
                    className="bg-[#b02151] hover:bg-[#921941] text-white text-xs font-extrabold px-6 py-3 rounded-xl uppercase tracking-wider transition-all shadow-md inline-flex items-center space-x-2"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Submit Another Query</span>
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {isResumed && !requireLogin && (
                  <div className="p-4 bg-pink-50/80 border border-pink-200 text-[#b02151] rounded-2xl space-y-1 text-xs">
                    <div className="flex items-center space-x-2 font-black">
                      <CheckCircle2 className="w-4 h-4 text-[#ec2c6c] flex-shrink-0" />
                      <span>Welcome Back! Your Message Details Are Ready</span>
                    </div>
                    <p className="text-gray-600 pl-6 leading-relaxed">
                      We have restored your message details below. Please review your information and click <strong>Send Message</strong> to submit.
                    </p>
                  </div>
                )}

                {requireLogin ? (
                  <div className="p-4 bg-amber-50 border border-amber-200 text-amber-900 rounded-2xl space-y-3">
                    <div className="flex items-start space-x-2.5">
                      <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                      <div className="text-xs space-y-1">
                        <p className="font-extrabold text-amber-900">Account Already Exists</p>
                        <p className="text-amber-800 leading-relaxed">
                          An account with <strong>{email}</strong> already exists. Your message details are securely saved. Please log in first to submit and link your message.
                        </p>
                      </div>
                    </div>
                    <div className="space-y-2 pt-1">
                      <a
                        href={`/login?email=${encodeURIComponent(email)}&redirect=${encodeURIComponent(typeof window !== 'undefined' ? window.location.pathname + window.location.search : '/contact-us')}`}
                        className="cbc-btn-primary block text-center text-xs py-2.5 font-bold shadow-md"
                      >
                        Log In & Continue Form Submission
                      </a>
                      <div className="text-center">
                        <a
                          href={`/forgot-password?email=${encodeURIComponent(email)}`}
                          className="text-[11px] font-bold text-gray-600 hover:text-[#ec2c6c] underline"
                        >
                          Forgot your password? Reset here
                        </a>
                      </div>
                    </div>
                  </div>
                ) : errorMessage ? (
                  <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center space-x-2">
                    <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                ) : null}

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Your Name *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Full Name"
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#ec2c6c]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="email@example.com"
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#ec2c6c]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Phone Number *</label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 9876543210"
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#ec2c6c]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Your Message *</label>
                  <textarea
                    rows={4}
                    required
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="How can we help you?"
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#ec2c6c]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="cbc-btn-primary w-full text-base py-3 flex items-center justify-center space-x-2 shadow-lg disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Sending Message...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Send Message</span>
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
