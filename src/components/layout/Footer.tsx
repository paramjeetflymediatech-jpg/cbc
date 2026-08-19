'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Phone, Mail } from 'lucide-react';

interface ServiceItem {
  id: number;
  name: string;
  slug: string;
}

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
    </svg>
  );
}

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
    </svg>
  );
}

const defaultTreatments = [
  { name: 'Orthopedic', slug: 'orthopedic' },
  { name: 'Gastroenterologist', slug: 'gastroenterologist' },
  { name: 'Dermatologists', slug: 'dermatologists' },
  { name: 'Transgender Surgery', slug: 'transgender-surgery' },
  { name: 'Dental Care', slug: 'dental-care' },
  { name: 'Eye Care', slug: 'eye-care' },
  { name: 'Neurologist', slug: 'neurologist' },

  { name: 'Urologist', slug: 'urologist' },
  { name: 'Sexologist', slug: 'sexologist' },
  { name: 'Plastic Surgery', slug: 'plastic-surgery' },
  { name: 'Infertility Treatment', slug: 'infertility-treatment' },
  { name: 'Hair Transplant', slug: 'hair-transplant' },
  { name: 'Proctology Hospital', slug: 'proctology-hospital' },
  { name: 'Pediatric Orthopedic', slug: 'pediatric-orthopedic' },

  { name: 'Anaesthesia', slug: 'anaesthesia' },
  { name: 'Ayurveda', slug: 'ayurveda' },
  { name: 'Cancer Hospital', slug: 'cancer-hospital' },
  { name: 'ENT Hospitals', slug: 'ent-hospitals' },
  { name: 'Heart Hospital', slug: 'heart-hospital' },
  { name: 'General surgery', slug: 'general-surgery' },
  { name: 'Homeopathy Hospital', slug: 'homeopathy-hospital' },

  { name: 'Laparoscopy', slug: 'laparoscopy' },
  { name: 'Neonatology Hospital', slug: 'neonatology-hospital' },
  { name: 'Obstetrics and Gynecology', slug: 'obstetrics-and-gynecology' },
  { name: 'Psychiatrist', slug: 'psychiatrist' },
  { name: 'Hepatology', slug: 'hepatology' },
  { name: 'Physiotherapy', slug: 'physiotherapy' },
];

export default function Footer() {
  const [treatments, setTreatments] = useState<ServiceItem[]>([]);

  useEffect(() => {
    fetch('/api/services')
      .then((res) => res.json())
      .then((data) => {
        if (data.services && data.services.length > 0) {
          setTreatments(data.services);
        }
      })
      .catch(() => {});
  }, []);

  const displayList = treatments.length > 0 ? treatments : defaultTreatments;

  return (
    <footer className="bg-[#e9ecef] text-gray-800 border-t border-gray-300">
      {/* Top Header Row with Logo, Description, and Contact Info */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 border-b border-gray-300">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
          {/* Logo */}
          <div className="md:col-span-3">
            <Link href="/" className="inline-block">
              <div className="relative h-14 w-56">
                <Image
                  src="/images/logoblac.png"
                  alt="Clinic By Choice Logo"
                  fill
                  className="object-contain object-left"
                />
              </div>
            </Link>
          </div>

          {/* Description */}
          <div className="md:col-span-5 text-gray-700 text-sm sm:text-base font-medium leading-relaxed">
            Clinic By Choice is a one-stop platform for medical providers and healthcare seekers to find the right connections for optimal healthcare procedures.
          </div>

          {/* Contact Details */}
          <div className="md:col-span-4 flex flex-col space-y-3 font-extrabold text-gray-900 text-base sm:text-lg lg:pl-6">
            <a href="tel:8146269537" className="flex items-center space-x-3 hover:text-[#F04B8B] transition-colors">
              <div className="w-10 h-10 rounded-full bg-gray-900 text-white flex items-center justify-center flex-shrink-0">
                <Phone className="w-5 h-5 fill-white" />
              </div>
              <span>81462 69537</span>
            </a>

            <a href="mailto:info@clinicbychoice.com" className="flex items-center space-x-3 hover:text-[#F04B8B] transition-colors">
              <div className="w-10 h-10 rounded-full bg-gray-900 text-white flex items-center justify-center flex-shrink-0">
                <Mail className="w-5 h-5" />
              </div>
              <span className="text-sm sm:text-base truncate">info@clinicbychoice.com</span>
            </a>
          </div>
        </div>
      </div>

      {/* Middle Links & Treatments Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Quick Links Column */}
          <div className="lg:col-span-3 space-y-6">
            <div className="border-b border-gray-400 pb-2">
              <h3 className="text-2xl font-extrabold text-gray-900">Quick Links</h3>
            </div>

            <ul className="space-y-3 font-bold text-gray-800 text-base">
              <li>
                <Link href="/" className="hover:text-[#F04B8B] flex items-center group">
                  <span className="text-[#F04B8B] font-black mr-2 text-sm group-hover:translate-x-1 transition-transform">»</span>
                  <span>Home</span>
                </Link>
              </li>
              <li>
                <Link href="/about-us" className="hover:text-[#F04B8B] flex items-center group">
                  <span className="text-[#F04B8B] font-black mr-2 text-sm group-hover:translate-x-1 transition-transform">»</span>
                  <span>About Us</span>
                </Link>
              </li>
              <li>
                <Link href="/contact-us" className="hover:text-[#F04B8B] flex items-center group">
                  <span className="text-[#F04B8B] font-black mr-2 text-sm group-hover:translate-x-1 transition-transform">»</span>
                  <span>Book Appointment</span>
                </Link>
              </li>
              <li>
                <Link href="/contact-us" className="hover:text-[#F04B8B] flex items-center group">
                  <span className="text-[#F04B8B] font-black mr-2 text-sm group-hover:translate-x-1 transition-transform">»</span>
                  <span>Contact Us</span>
                </Link>
              </li>
              <li>
                <Link href="/blog" className="hover:text-[#F04B8B] flex items-center group">
                  <span className="text-[#F04B8B] font-black mr-2 text-sm group-hover:translate-x-1 transition-transform">»</span>
                  <span>Blog</span>
                </Link>
              </li>
            </ul>

            {/* Colorful Brand Social Media Icons */}
            <div className="flex items-center space-x-3 pt-2">
              {/* Facebook Icon */}
              <a
                href="https://www.facebook.com/clinicbychoice"
                target="_blank"
                rel="noreferrer"
                className="w-10 h-10 rounded-full bg-[#1877F2] text-white flex items-center justify-center shadow-md hover:scale-110 transition-transform"
                aria-label="Facebook"
              >
                <FacebookIcon className="w-5 h-5" />
              </a>

              {/* Instagram Icon */}
              <a
                href="https://www.instagram.com/clinicbychoice/"
                target="_blank"
                rel="noreferrer"
                className="w-10 h-10 rounded-full text-white flex items-center justify-center shadow-md hover:scale-110 transition-transform"
                style={{
                  background: 'radial-gradient(circle at 30% 107%, #fdf497 0%, #fdf497 5%, #fd5949 45%, #d6249f 60%, #285AEB 90%)',
                }}
                aria-label="Instagram"
              >
                <InstagramIcon className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Treatments Column (4-Column Grid) */}
          <div className="lg:col-span-9 space-y-6">
            <div className="border-b border-gray-400 pb-2 text-center lg:text-left">
              <h3 className="text-2xl font-extrabold text-gray-900">Treatments</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-3 font-bold text-gray-800 text-sm sm:text-base">
              {displayList.map((svc: any, idx: number) => (
                <Link
                  key={svc.id || idx}
                  href={`/hospitals/${svc.slug}/india`}
                  className="flex items-center hover:text-[#F04B8B] transition-colors py-1 group"
                >
                  <span className="text-[#F04B8B] font-black mr-2 text-sm group-hover:translate-x-1 transition-transform select-none">
                    »
                  </span>
                  <span className="truncate">{svc.name}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Pink Bottom Bar matching exact screenshot */}
      <div className="bg-[#F04B8B] text-white py-4 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs sm:text-sm font-semibold">
          <div>Copyright © 2026 Clinic By Choice All rights reserved.</div>
          <div>Website Design And Developed By Flymedia Technology</div>
        </div>
      </div>
    </footer>
  );
}
