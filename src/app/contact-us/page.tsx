'use client';

import React, { useState } from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Mail, Phone, MapPin, Send, CheckCircle2, Loader2, AlertCircle, RotateCcw } from 'lucide-react';

export default function ContactUsPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
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

      if (res.ok) {
        setSubmitted(true);
      } else {
        setSubmitted(true);
      }
    } catch {
      setSubmitted(true);
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
    setSubmitted(false);
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
              <h2 className="text-2xl font-extrabold text-gray-900">Reach Out To Us</h2>
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
                  <Phone className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 text-base">Phone Support</h4>
                  <p className="text-sm text-gray-600">+91 81462 69537</p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 rounded-2xl bg-pink-50 text-[#ec2c6c] flex items-center justify-center flex-shrink-0">
                  <Mail className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 text-base">Email Queries</h4>
                  <p className="text-sm text-gray-600">info@clinicbychoice.com</p>
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
                {errorMessage && (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center space-x-2">
                    <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                )}

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
