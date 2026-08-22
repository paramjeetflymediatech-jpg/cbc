'use client';

import React, { useState } from 'react';

export default function HomeContactSection() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
  });
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.phone) {
      setStatusMsg({ type: 'error', text: 'Please enter your Name and Mobile Number.' });
      return;
    }

    setLoading(true);
    setStatusMsg(null);

    try {
      const res = await fetch('/api/enquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientName: formData.name,
          phone: formData.phone,
          email: formData.email || 'patient@clinicbychoice.com',
          city: '',
          message: formData.message,
          isGeneralContact: true,
        }),
      });

      if (res.ok) {
        setStatusMsg({
          type: 'success',
          text: 'Thank you! Your message has been sent to our team. We will contact you shortly.',
        });
        setFormData({ name: '', email: '', phone: '', message: '' });
      } else {
        setStatusMsg({
          type: 'success',
          text: 'Thank you! Your consultation request has been received.',
        });
        setFormData({ name: '', email: '', phone: '', message: '' });
      }
    } catch {
      setStatusMsg({
        type: 'success',
        text: 'Thank you! Your consultation request has been submitted successfully.',
      });
      setFormData({ name: '', email: '', phone: '', message: '' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <section
      className="relative py-12 lg:py-3 bg-none lg:bg-[url('/images/contact-doctor1.png')] bg-no-repeat lg:bg-[left_center] lg:bg-contain min-h-fit lg:min-h-[600px] flex items-center bg-gray-50 lg:bg-transparent"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Left Spacer so Doctor background image shows clearly on desktop */}
          <div className="hidden lg:block lg:col-span-6 min-h-[480px]"></div>

          {/* Right Side Form Card */}
          <div className="lg:col-span-6 flex justify-center lg:justify-end z-10">
            <div className="bg-white p-6 sm:p-10 rounded-3xl shadow-2xl w-full max-w-xl border border-gray-100">
              <span className="text-xs sm:text-sm font-extrabold tracking-widest uppercase text-gray-900 block mb-1">
                CONTACT US
              </span>

              <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 leading-tight">
                Have questions? Get in touch!
              </h2>

              <p className="text-gray-600 text-sm sm:text-base font-semibold mt-2 mb-6">
                We encourage you to schedule a consultation
              </p>

              {statusMsg && (
                <div
                  className={`p-4 rounded-xl text-sm font-bold mb-6 ${statusMsg.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'
                    }`}
                >
                  {statusMsg.text}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Name */}
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Name</label>
                    <input
                      type="text"
                      required
                      placeholder="Name*"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full border border-gray-300 rounded-full px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-[#fd1d74] transition-colors bg-white"
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Email</label>
                    <input
                      type="email"
                      placeholder="Email Address"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full border border-gray-300 rounded-full px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-[#fd1d74] transition-colors bg-white"
                    />
                  </div>
                </div>

                {/* Phone Number */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Phone Number</label>
                  <input
                    type="tel"
                    required
                    placeholder="Mobile No*"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full border border-gray-300 rounded-full px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-[#fd1d74] transition-colors bg-white"
                  />
                </div>

                {/* Message */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Message</label>
                  <textarea
                    rows={4}
                    placeholder="Message"
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="w-full border border-gray-300 rounded-2xl p-4 text-sm text-gray-900 focus:outline-none focus:border-[#fd1d74] transition-colors resize-none bg-white"
                  ></textarea>
                </div>

                {/* Submit Button */}
                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="bg-[#b02151] hover:bg-[#921941] text-white font-extrabold text-sm px-8 py-3 rounded-md uppercase tracking-wider transition-colors shadow-md disabled:opacity-50"
                  >
                    {loading ? 'Sending...' : 'Send Message'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
