'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { MapPin, Star, PhoneCall, ShieldCheck, ArrowRight } from 'lucide-react';
import EnquiryModal from './EnquiryModal';

interface HospitalCardProps {
  hospital: {
    id: number;
    name: string;
    slug: string;
    city: string;
    address: string;
    description: string;
    logo?: string | null;
    rating?: number;
    leadsRemaining?: number;
    hospitalServices?: any[];
  };
}

export default function HospitalCard({ hospital }: HospitalCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const services = hospital.hospitalServices || [];
  const isExhausted = (hospital.leadsRemaining || 0) <= 0;

  return (
    <>
      <div className="cbc-card p-6 border border-gray-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 group hover:border-[#ec2c6c]/30">
        {/* Left Side: Logo & Info */}
        <div className="flex flex-col sm:flex-row items-start space-y-4 sm:space-y-0 sm:space-x-5 flex-1">
          <div className="relative w-20 h-20 sm:w-24 sm:h-24 bg-gray-50 rounded-xl p-2 border border-gray-100 flex-shrink-0 flex items-center justify-center overflow-hidden">
            {hospital.logo ? (
              <Image
                src={hospital.logo}
                alt={hospital.name}
                fill
                className="object-contain p-1"
              />
            ) : (
              <ShieldCheck className="w-10 h-10 text-[#ec2c6c]" />
            )}
          </div>

          <div className="space-y-2 flex-1">
            <div className="flex items-center space-x-2">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-pink-50 text-[#ec2c6c]">
                <Star className="w-3 h-3 fill-current mr-1 text-[#ec2c6c]" />
                {hospital.rating || 4.8} Rating
              </span>
              <span className="text-xs text-gray-500 font-medium flex items-center">
                <MapPin className="w-3.5 h-3.5 mr-1 text-gray-400" />
                {hospital.city}
              </span>
            </div>

            <h3 className="text-xl font-bold text-gray-900 group-hover:text-[#ec2c6c] transition-colors">
              <Link href={`/hospitals/${hospital.slug}`}>{hospital.name}</Link>
            </h3>

            <p className="text-xs text-gray-500 line-clamp-1">{hospital.address}</p>

            <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed">
              {hospital.description}
            </p>

            {/* Offered Services Badges */}
            {services.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {services.slice(0, 4).map((hs: any) => (
                  <span
                    key={hs.id}
                    className="text-xs font-medium px-2.5 py-1 bg-gray-100 text-gray-700 rounded-md"
                  >
                    {hs.service?.name || 'Medical Care'}
                  </span>
                ))}
                {services.length > 4 && (
                  <span className="text-xs text-gray-400 self-center">+{services.length - 4} more</span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Side: CTA Actions */}
        <div className="flex flex-col items-start md:items-end justify-center w-full md:w-auto border-t md:border-t-0 md:border-l border-gray-100 pt-4 md:pt-0 md:pl-6 space-y-3 flex-shrink-0">
          <div className="flex flex-col sm:flex-row md:flex-col gap-2.5 w-full sm:w-auto">
            <Link
              href={`/hospitals/${hospital.slug}`}
              className="px-5 py-2.5 rounded-full border border-gray-300 text-xs font-bold text-gray-700 hover:bg-gray-50 text-center transition-colors flex items-center justify-center"
            >
              <span>View Details</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
            </Link>

            <button
              onClick={() => setIsModalOpen(true)}
              disabled={isExhausted}
              className={`px-6 py-2.5 rounded-full text-xs font-bold text-center transition-all flex items-center justify-center space-x-1.5 ${
                isExhausted
                  ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                  : 'bg-[#ec2c6c] hover:bg-[#d41f5a] text-white shadow-md hover:shadow-lg'
              }`}
            >
              <PhoneCall className="w-3.5 h-3.5" />
              <span>{isExhausted ? 'Enquiries Paused' : 'Contact Hospital'}</span>
            </button>
          </div>
        </div>
      </div>

      <EnquiryModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        hospitalId={hospital.id}
        hospitalName={hospital.name}
      />
    </>
  );
}
