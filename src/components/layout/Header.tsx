'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Menu, X, ChevronDown, Building2 } from 'lucide-react';

interface ServiceItem {
  id: number;
  parentId?: number | null;
  name: string;
  slug: string;
  subServices?: ServiceItem[];
}

export default function Header() {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobileServicesOpen, setIsMobileServicesOpen] = useState(false);
  const [expandedMobileParent, setExpandedMobileParent] = useState<number | null>(null);
  const [isServicesOpen, setIsServicesOpen] = useState(false);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [authUser, setAuthUser] = useState<any>(null);

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fetch('/api/services')
      .then((res) => res.json())
      .then((data) => {
        if (data.services) setServices(data.services);
      })
      .catch(() => {});

    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.user) setAuthUser(data.user);
      })
      .catch(() => {});

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const mainServices = services.filter((s) => !s.parentId);

  const handleMouseEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setIsServicesOpen(true);
  };

  const handleMouseLeave = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setIsServicesOpen(false);
    }, 200);
  };

  const handleServiceClick = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsServicesOpen(false);
  };

  return (
    <header
      className="sticky top-0 z-50 text-white shadow-md relative"
      style={{ background: 'linear-gradient(90deg, rgb(180 58 173) 0%, rgb(253 29 116) 50%, rgb(252 69 214) 100%)' }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Brand Logo */}
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="relative h-12 w-48 bg-white/0 p-1.5 rounded-xl backdrop-blur-xs transition-transform group-hover:scale-105">
              <Image
                src="/images/logo.png"
                alt="Clinic By Choice Logo"
                fill
                priority
                className="object-contain object-left p-1"
              />
            </div>
          </Link>

          {/* Desktop Navigation Menu */}
          <nav className="hidden lg:flex items-center space-x-8">
            <Link
              href="/"
              className={`text-white text-sm font-semibold transition-colors py-2 border-b-2 ${
                pathname === '/' ? 'border-white' : 'border-transparent hover:border-white/70'
              }`}
            >
              Home
            </Link>

            <Link
              href="/about-us"
              className={`text-white text-sm font-semibold transition-colors py-2 border-b-2 ${
                pathname === '/about-us' ? 'border-white' : 'border-transparent hover:border-white/70'
              }`}
            >
              About Us
            </Link>

            {/* Our Services 4-Column Dropdown */}
            <div
              className="static"
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
            >
              <button
                className={`flex items-center space-x-1.5 text-white text-sm font-semibold transition-colors py-2 border-b-2 ${
                  isServicesOpen || pathname.startsWith('/service') || pathname.startsWith('/hospitals')
                    ? 'border-white'
                    : 'border-transparent hover:border-white/70'
                }`}
                onClick={() => setIsServicesOpen(!isServicesOpen)}
              >
                <span>Our Services</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${isServicesOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Mega Dropdown Panel */}
              {isServicesOpen && (
                <div
                  className="absolute left-0 right-0 top-full w-full bg-white text-gray-900 shadow-2xl border-b-2 border-[#fd1d74] z-50 animate-fadeIn"
                  onMouseEnter={handleMouseEnter}
                  onMouseLeave={handleMouseLeave}
                >
                  <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8">
                    {mainServices.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-3.5">
                        {mainServices.map((svc) => (
                          <Link
                            key={svc.id}
                            href={`/hospitals/${svc.slug}/india`}
                            className="flex items-center text-sm font-bold text-gray-800 hover:text-[#fd1d74] transition-colors py-1 group"
                            onClick={handleServiceClick}
                          >
                            <span className="text-[#fd1d74] font-black text-sm mr-2.5 group-hover:translate-x-1 transition-transform select-none">
                              »
                            </span>
                            <span className="truncate">{svc.name}</span>
                          </Link>
                        ))}
                      </div>
                    ) : (
                      <div className="py-6 text-center text-sm text-gray-500">Loading services...</div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <Link
              href="/contact-us"
              className={`text-white text-sm font-semibold transition-colors py-2 border-b-2 ${
                pathname === '/contact-us' ? 'border-white' : 'border-transparent hover:border-white/70'
              }`}
            >
              Contact Us
            </Link>

            <Link
              href="/get-listed"
              className="text-[#ec2c6c] bg-white px-4 py-1.5 rounded-full text-sm font-bold shadow-[0_0_15px_rgba(255,255,255,0.6)] animate-pulse hover:animate-none transition-all"
            >
              Get Listed
            </Link>
          </nav>

          {/* Social Icons & Login CTA */}
          <div className="hidden lg:flex items-center space-x-4">
            <div className="flex items-center space-x-2.5 mr-2">
              <a
                href="https://www.facebook.com/clinicbychoice"
                target="_blank"
                rel="noreferrer"
                className="w-9 h-9 rounded-full bg-[#1877F2] text-white flex items-center justify-center hover:scale-110 transition-transform shadow-md"
                aria-label="Facebook"
              >
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </a>

              <a
                href="https://www.instagram.com/clinicbychoice/"
                target="_blank"
                rel="noreferrer"
                className="w-9 h-9 rounded-full text-white flex items-center justify-center hover:scale-110 transition-transform shadow-md"
                style={{
                  background: 'radial-gradient(circle at 30% 107%, #fdf497 0%, #fdf497 5%, #fd5949 45%, #d6249f 60%, #285AEB 90%)',
                }}
                aria-label="Instagram"
              >
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              </a>
            </div>

            {authUser ? (
              <Link
                href={
                  authUser.role === 'HOSPITAL'
                    ? '/hospital/dashboard'
                    : authUser.role === 'PATIENT'
                    ? '/patient/dashboard'
                    : '/admin/dashboard'
                }
                className="bg-white text-[#fd1d74] text-xs font-extrabold py-2.5 px-5 rounded-full shadow-md hover:bg-gray-100 transition-colors flex items-center space-x-1.5"
              >
                <Building2 className="w-4 h-4" />
                <span>
                  {authUser.role === 'PATIENT'
                    ? 'My Enquiries'
                    : authUser.role === 'HOSPITAL'
                    ? 'Hospital Portal'
                    : 'Admin Panel'}
                </span>
              </Link>
            ) : (
              <Link
                href="/login"
                className="bg-white text-[#fd1d74] text-xs font-extrabold py-2.5 px-5 rounded-full shadow-md hover:bg-gray-100 transition-colors"
              >
                Login
              </Link>
            )}
          </div>

          {/* Mobile Toggle */}
          <div className="flex lg:hidden items-center space-x-2">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-lg text-white hover:bg-white/10 focus:outline-none"
              aria-label="Toggle Navigation"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden bg-white text-gray-900 border-b border-gray-200 px-4 pt-3 pb-6 space-y-2 max-h-[85vh] overflow-y-auto">
          <Link
            href="/"
            className="block py-2 font-bold text-gray-900 hover:text-[#fd1d74]"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            Home
          </Link>
          <Link
            href="/about-us"
            className="block py-2 font-bold text-gray-900 hover:text-[#fd1d74]"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            About Us
          </Link>

          {/* Mobile Services Accordion */}
          <div className="border-y border-gray-100 py-1">
            <button
              type="button"
              onClick={() => setIsMobileServicesOpen(!isMobileServicesOpen)}
              className="w-full flex items-center justify-between py-2 text-sm font-bold text-gray-900 hover:text-[#fd1d74]"
            >
              <span>Our Services ({mainServices.length})</span>
              <ChevronDown className={`w-4 h-4 text-[#fd1d74] transition-transform ${isMobileServicesOpen ? 'rotate-180' : ''}`} />
            </button>

            {isMobileServicesOpen && (
              <div className="space-y-1 pl-2 pt-1 pb-2">
                {mainServices.map((svc) => (
                  <Link
                    key={svc.id}
                    href={`/hospitals/${svc.slug}/india`}
                    className="text-xs font-semibold text-gray-700 hover:text-[#fd1d74] py-1.5 px-2 rounded-md hover:bg-pink-50 flex items-center"
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      setIsMobileServicesOpen(false);
                    }}
                  >
                    <span className="text-[#fd1d74] font-black mr-2 text-sm">»</span>
                    <span>{svc.name}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>

          <Link
            href="/contact-us"
            className="block py-2 font-bold text-gray-900 hover:text-[#fd1d74]"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            Contact Us
          </Link>

          <Link
            href="/get-listed"
            className="block py-2 font-extrabold text-[#ec2c6c] animate-pulse bg-pink-50 rounded-lg px-3 -ml-3"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            Get Listed
          </Link>

          <div className="flex items-center space-x-3 py-3 border-t border-gray-100">
            {/* Colorful Facebook Button */}
            <a
              href="https://www.facebook.com/clinicbychoice"
              target="_blank"
              rel="noreferrer"
              className="w-9 h-9 rounded-full bg-[#1877F2] text-white flex items-center justify-center hover:scale-110 transition-transform shadow-md"
              aria-label="Facebook"
            >
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
            </a>

            {/* Colorful Instagram Button */}
            <a
              href="https://www.instagram.com/clinicbychoice/"
              target="_blank"
              rel="noreferrer"
              className="w-9 h-9 rounded-full text-white flex items-center justify-center hover:scale-110 transition-transform shadow-md"
              style={{
                background: 'radial-gradient(circle at 30% 107%, #fdf497 0%, #fdf497 5%, #fd5949 45%, #d6249f 60%, #285AEB 90%)',
              }}
              aria-label="Instagram"
            >
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
              </svg>
            </a>
          </div>

          <div className="pt-2 border-t border-gray-100">
            {authUser ? (
              <Link
                href={
                  authUser.role === 'HOSPITAL'
                    ? '/hospital/dashboard'
                    : authUser.role === 'PATIENT'
                    ? '/patient/dashboard'
                    : '/admin/dashboard'
                }
                className="cbc-btn-primary text-center w-full text-sm block py-2.5"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {authUser.role === 'PATIENT'
                  ? 'My Enquiries'
                  : authUser.role === 'HOSPITAL'
                  ? 'Hospital Dashboard'
                  : 'Admin Dashboard'}
              </Link>
            ) : (
              <Link
                href="/login"
                className="cbc-btn-primary text-center w-full text-sm block py-2.5"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Login to Portal
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
