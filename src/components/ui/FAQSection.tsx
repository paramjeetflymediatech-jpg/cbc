'use client';

import React, { useState } from 'react';
import { Plus, Minus } from 'lucide-react';

interface FAQItem {
  question: string;
  answer: string;
}

const faqs: FAQItem[] = [
  {
    question: 'How do you simplify the search for the top psychiatrists in India?',
    answer:
      'Clinic By Choice aggregates verified mental health specialists and accredited psychiatric facilities across India, allowing you to filter by sub-specialties, patient reviews, location, and consultation options.',
  },
  {
    question: "What if I didn't feel comfortable expressing my condition to the psychiatrist?",
    answer:
      'Our partner psychiatrists provide confidential, non-judgmental consultations in comfortable private environments. You can also share pre-consultation notes or medical history online to ease communication.',
  },
  {
    question: 'What exactly happens in the first consultation with a psychiatrist?',
    answer:
      'During your initial consultation, the psychiatrist will conduct a detailed evaluation of your medical history, current symptoms, lifestyle factors, and discuss a personalized treatment plan tailored to your needs.',
  },
  {
    question: 'How can a psychiatrist help in managing the thoughts of self-harm?',
    answer:
      'Psychiatrists provide evidence-based therapy, crisis intervention strategies, safe medication management, and ongoing support to help individuals build healthy coping mechanisms and emotional stability.',
  },
  {
    question: 'Does a dermatologist help in providing skincare products according to my skin?',
    answer:
      'Yes, dermatologists analyze your skin type, underlying conditions (like acne, eczema, or hyperpigmentation), and prescribe medical-grade skincare products tailored to your specific skin needs.',
  },
  {
    question: 'How can I find an experienced dermatologist in my area?',
    answer:
      'Use Clinic By Choice’s specialty filter to locate top-rated dermatologists in your city. You can review doctor credentials, hospital affiliations, patient feedback, and book direct consultations.',
  },
  {
    question: 'Is there any specific preparation that should be done before visiting the dermatologist?',
    answer:
      'Avoid wearing makeup or heavy skincare products on the day of your visit, bring a list of your current skincare items and medical history, and note down any specific skin concerns you wish to address.',
  },
  {
    question: 'Is it necessary to visit the dermatologist if I am suddenly having moles on my face?',
    answer:
      'Yes, any new, growing, irregular, or changing moles should be examined promptly by a certified dermatologist to ensure proper screening, diagnosis, and preventative care.',
  },
  {
    question: 'How do orthopedists diagnose the real cause on the first visit?',
    answer:
      'Orthopedists perform physical assessments, evaluate joint mobility, review your pain history, and order diagnostic imaging such as X-rays, MRIs, or CT scans to identify the exact cause of discomfort.',
  },
  {
    question: 'What is the treatment approach for orthopedists for managing chronic back pain?',
    answer:
      'Orthopedic care for chronic back pain ranges from conservative treatments like targeted physical therapy, anti-inflammatory medications, and spinal injections to minimally invasive surgical procedures when necessary.',
  },
  {
    question: 'How can you simplify my search for the best orthopaedic hospital in India for knee pain?',
    answer:
      'Clinic By Choice lists top-tier NABH-accredited orthopedic hospitals specializing in joint replacement, arthroscopy, and robotic surgery, helping you compare facilities, doctors, and treatment packages effortlessly.',
  },
  {
    question: 'How can I engage with the best skin doctor in India?',
    answer:
      'You can request a direct appointment or online tele-consultation through Clinic By Choice. Simply choose your preferred dermatologist and submit an enquiry for fast scheduling.',
  },
  {
    question: 'What is the general price range for consulting a dermatologist?',
    answer:
      'Consultation fees generally range between ₹500 and ₹2,000 depending on doctor experience, clinic location, and facility accreditation.',
  },
];

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  const midPoint = Math.ceil(faqs.length / 2);
  const col1 = faqs.slice(0, midPoint);
  const col2 = faqs.slice(midPoint);

  return (
    <section className="py-20 bg-[#F04B8B] text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <h2 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white text-center tracking-tight">
          FAQ's
        </h2>

        {/* 2-Column FAQs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4 items-start">
          {/* Column 1 */}
          <div className="space-y-4">
            {col1.map((faq, idx) => {
              const actualIdx = idx;
              const isOpen = openIndex === actualIdx;
              return (
                <div
                  key={actualIdx}
                  className="border-b border-white/20 pb-4 transition-colors"
                >
                  <button
                    type="button"
                    onClick={() => toggleFAQ(actualIdx)}
                    className="w-full flex items-center justify-between py-2 text-left font-bold text-white text-base sm:text-lg hover:opacity-90 transition-opacity focus:outline-none group"
                  >
                    <div className="flex items-center space-x-3.5 pr-4">
                      <span className="text-xl font-extrabold text-white select-none flex-shrink-0">
                        {isOpen ? <Minus className="w-5 h-5 stroke-[3]" /> : <Plus className="w-5 h-5 stroke-[3]" />}
                      </span>
                      <span>{faq.question}</span>
                    </div>
                    <div className="w-1.5 h-6 bg-white/80 rounded-full flex-shrink-0 hidden sm:block"></div>
                  </button>

                  {isOpen && (
                    <div className="pl-8 pr-4 pt-3 text-white/90 text-sm sm:text-base leading-relaxed font-medium animate-fadeIn">
                      {faq.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Column 2 */}
          <div className="space-y-4">
            {col2.map((faq, idx) => {
              const actualIdx = midPoint + idx;
              const isOpen = openIndex === actualIdx;
              return (
                <div
                  key={actualIdx}
                  className="border-b border-white/20 pb-4 transition-colors"
                >
                  <button
                    type="button"
                    onClick={() => toggleFAQ(actualIdx)}
                    className="w-full flex items-center justify-between py-2 text-left font-bold text-white text-base sm:text-lg hover:opacity-90 transition-opacity focus:outline-none group"
                  >
                    <div className="flex items-center space-x-3.5 pr-4">
                      <span className="text-xl font-extrabold text-white select-none flex-shrink-0">
                        {isOpen ? <Minus className="w-5 h-5 stroke-[3]" /> : <Plus className="w-5 h-5 stroke-[3]" />}
                      </span>
                      <span>{faq.question}</span>
                    </div>
                    <div className="w-1.5 h-6 bg-white/80 rounded-full flex-shrink-0 hidden sm:block"></div>
                  </button>

                  {isOpen && (
                    <div className="pl-8 pr-4 pt-3 text-white/90 text-sm sm:text-base leading-relaxed font-medium animate-fadeIn">
                      {faq.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
