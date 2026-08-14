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
  if (!testimonials || testimonials.length === 0) return null;

  const count = testimonials.length;
  // Duplicate items 3 times for seamless infinite loop buffer
  const extendedItems = count < 3 
    ? [...testimonials, ...testimonials, ...testimonials, ...testimonials, ...testimonials, ...testimonials]
    : [...testimonials, ...testimonials, ...testimonials];

  const totalExtended = extendedItems.length;
  const initialIndex = count < 3 ? count * 2 : count;

  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isTransitioning, setIsTransitioning] = useState(true);
  const [visibleCount, setVisibleCount] = useState(3);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 640) {
        setVisibleCount(1);
      } else if (window.innerWidth < 1024) {
        setVisibleCount(2);
      } else {
        setVisibleCount(3);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Auto slide every 4 seconds
  useEffect(() => {
    if (count <= 1) return;
    const timer = setInterval(() => {
      handleNext();
    }, 4000);
    return () => clearInterval(timer);
  }, [count, currentIndex]);

  const handleNext = () => {
    setIsTransitioning(true);
    setCurrentIndex((prev) => prev + 1);
  };

  const handlePrev = () => {
    setIsTransitioning(true);
    setCurrentIndex((prev) => prev - 1);
  };

  const handleTransitionEnd = () => {
    // Seamless infinite reset when exceeding boundaries
    if (currentIndex >= totalExtended - visibleCount) {
      setIsTransitioning(false);
      setCurrentIndex(initialIndex + (currentIndex % count));
    } else if (currentIndex < count) {
      setIsTransitioning(false);
      setCurrentIndex(initialIndex + (currentIndex % count));
    }
  };

  const activeDotIndex = ((currentIndex % count) + count) % count;

  return (
    <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 select-none">
      {/* Navigation Buttons */}
      {count > 1 && (
        <>
          <div className="absolute top-1/2 -translate-y-1/2 -left-2 sm:-left-6 z-20">
            <button
              type="button"
              onClick={handlePrev}
              className="w-12 h-12 rounded-full bg-white text-gray-800 shadow-xl border border-gray-100 flex items-center justify-center hover:bg-[#fd1d74] hover:text-white transition-all transform hover:scale-110 focus:outline-none cursor-pointer"
              aria-label="Previous Testimonial"
            >
              <ChevronLeft className="w-6 h-6 stroke-[2.5]" />
            </button>
          </div>

          <div className="absolute top-1/2 -translate-y-1/2 -right-2 sm:-right-6 z-20">
            <button
              type="button"
              onClick={handleNext}
              className="w-12 h-12 rounded-full bg-white text-gray-800 shadow-xl border border-gray-100 flex items-center justify-center hover:bg-[#fd1d74] hover:text-white transition-all transform hover:scale-110 focus:outline-none cursor-pointer"
              aria-label="Next Testimonial"
            >
              <ChevronRight className="w-6 h-6 stroke-[2.5]" />
            </button>
          </div>
        </>
      )}

      {/* Cards Viewport */}
      <div className="overflow-hidden py-4 px-2">
        <div
          className={`flex ${isTransitioning ? 'transition-transform duration-500 ease-in-out' : ''} gap-6`}
          style={{
            transform: `translateX(-${currentIndex * (100 / visibleCount)}%)`,
          }}
          onTransitionEnd={handleTransitionEnd}
        >
          {extendedItems.map((item, idx) => (
            <div
              key={idx}
              className="w-full sm:w-[calc(50%-12px)] lg:w-[calc(33.333%-16px)] flex-shrink-0 bg-white p-8 rounded-3xl shadow-sm border border-gray-100 flex flex-col justify-between space-y-6 hover:shadow-md transition-shadow"
            >
              <p className="text-gray-600 text-sm sm:text-base font-medium leading-relaxed italic">
                {item.quote}
              </p>
              <div className="flex items-center space-x-3 pt-4 border-t border-gray-100">
                <div className="relative w-12 h-12 rounded-full overflow-hidden flex-shrink-0 border-2 border-[#fd1d74]/20 shadow-sm">
                  <Image
                    src={item.image || '/images/indus-1.jpg'}
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
      {count > 1 && (
        <div className="flex justify-center items-center space-x-2 pt-6">
          {testimonials.map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                setIsTransitioning(true);
                setCurrentIndex(initialIndex + idx);
              }}
              className={`h-3 rounded-full transition-all cursor-pointer ${
                activeDotIndex === idx ? 'bg-[#fd1d74] w-8' : 'bg-gray-300 w-3 hover:bg-gray-400'
              }`}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
