'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export interface DoctorTestimonialItem {
  quote: string;
  doctorName: string;
  hospitalInfo: string;
  image: string;
}

interface Props {
  testimonials: DoctorTestimonialItem[];
}

export default function DoctorTestimonialCarousel({ testimonials }: Props) {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Auto slide every 5 seconds
  useEffect(() => {
    if (testimonials.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [testimonials.length]);

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? testimonials.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
  };

  if (!testimonials || testimonials.length === 0) return null;

  return (
    <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Navigation Buttons */}
      <div className="absolute top-1/2 -translate-y-1/2 -left-2 sm:-left-6 z-20">
        <button
          type="button"
          onClick={handlePrev}
          className="w-12 h-12 rounded-full bg-white text-gray-800 shadow-xl border border-gray-100 flex items-center justify-center hover:bg-[#fd1d74] hover:text-white transition-all transform hover:scale-110 focus:outline-none"
          aria-label="Previous Testimonial"
        >
          <ChevronLeft className="w-6 h-6 stroke-[2.5]" />
        </button>
      </div>

      <div className="absolute top-1/2 -translate-y-1/2 -right-2 sm:-right-6 z-20">
        <button
          type="button"
          onClick={handleNext}
          className="w-12 h-12 rounded-full bg-white text-gray-800 shadow-xl border border-gray-100 flex items-center justify-center hover:bg-[#fd1d74] hover:text-white transition-all transform hover:scale-110 focus:outline-none"
          aria-label="Next Testimonial"
        >
          <ChevronRight className="w-6 h-6 stroke-[2.5]" />
        </button>
      </div>

      {/* Cards Viewport */}
      <div className="overflow-hidden py-4 px-2">
        <div
          className="flex transition-transform duration-500 ease-in-out gap-6"
          style={{
            transform: `translateX(-${currentIndex * (100 / Math.min(testimonials.length, 3))}%)`,
          }}
        >
          {testimonials.map((item, idx) => (
            <div
              key={idx}
              className="w-full md:w-[calc(50%-12px)] lg:w-[calc(33.333%-16px)] flex-shrink-0 bg-white p-8 rounded-3xl shadow-sm border border-gray-100 flex flex-col justify-between space-y-6 hover:shadow-md transition-shadow"
            >
              <p className="text-gray-600 text-sm sm:text-base font-medium leading-relaxed italic">
                {item.quote}
              </p>
              <div className="flex items-center space-x-3 pt-4 border-t border-gray-100">
                <div className="relative w-12 h-12 rounded-full overflow-hidden flex-shrink-0 border-2 border-[#fd1d74]/20 shadow-sm">
                  <Image
                    src={item.image}
                    alt={item.doctorName}
                    fill
                    className="object-cover"
                  />
                </div>
                <div>
                  <h4 className="font-extrabold text-gray-900 text-base">{item.doctorName}</h4>
                  <p className="text-xs text-gray-500 font-medium">{item.hospitalInfo}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pagination Dot Indicators */}
      <div className="flex justify-center items-center space-x-2 pt-6">
        {testimonials.map((_, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => setCurrentIndex(idx)}
            className={`h-3 rounded-full transition-all ${
              currentIndex === idx ? 'bg-[#fd1d74] w-8' : 'bg-gray-300 w-3 hover:bg-gray-400'
            }`}
            aria-label={`Go to slide ${idx + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
