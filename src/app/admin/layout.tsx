'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, Building2, Stethoscope, ShoppingBag, Users, BookOpen, MapPin, LogOut, Menu, X, Quote, Globe, UserCheck } from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<{ name: string; email: string; role: string } | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (!data.user || (data.user.role !== 'SUPER_ADMIN' && data.user.role !== 'ADMIN')) {
          router.push('/login');
        } else {
          setUser(data.user);
        }
      })
      .catch(() => {
        router.push('/login');
      });
  }, [router]);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  const navItems = [
    { name: 'Admin Overview', href: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Users Directory', href: '/admin/users', icon: UserCheck },
    { name: 'Hospitals Approval', href: '/admin/hospitals', icon: Building2 },
    { name: 'Homepage Testimonials', href: '/admin/testimonials', icon: Quote },
    { name: 'Location Master', href: '/admin/locations', icon: MapPin },
    { name: 'Medical Services', href: '/admin/services', icon: Stethoscope },
    { name: 'Lead Packages', href: '/admin/packages', icon: ShoppingBag },
    { name: 'Leads & Audit Logs', href: '/admin/leads', icon: Users },
    { name: 'Blog Management', href: '/admin/blogs', icon: BookOpen },
    { name: 'SEO & Global Scripts', href: '/admin/seo', icon: Globe },
  ];

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setIsSidebarOpen(false)} />
      )}

      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-[#101828] text-white flex flex-col justify-between transition-transform duration-300 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-gray-800 pb-4">
            <Link href="/" className="relative h-10 w-40 block">
              <Image src="/images/logo.png" alt="Clinic By Choice" fill className="object-contain object-left" />
            </Link>
            <button className="lg:hidden text-gray-400" onClick={() => setIsSidebarOpen(false)}>
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-3 bg-pink-500/10 border border-pink-500/20 rounded-xl space-y-0.5">
            <span className="text-[10px] font-bold text-[#ec2c6c] uppercase tracking-wider">Super Admin</span>
            <h4 className="text-sm font-bold text-white truncate">{user.name}</h4>
          </div>

          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                    isActive ? 'bg-[#ec2c6c] text-white font-bold shadow-lg' : 'text-gray-300 hover:bg-white/5 hover:text-white'
                  }`}
                  onClick={() => setIsSidebarOpen(false)}
                >
                  <Icon className="w-4 h-4 mr-3 flex-shrink-0" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="p-4 border-t border-gray-800">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-400 hover:text-white hover:bg-red-500/10 border border-transparent transition-all"
          >
            <LogOut className="w-4 h-4 mr-2 text-red-400" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <button className="lg:hidden p-2 text-gray-700" onClick={() => setIsSidebarOpen(true)}>
            <Menu className="w-6 h-6" />
          </button>

          <div className="flex items-center space-x-3 ml-auto">
            <span className="text-xs font-semibold text-gray-500">Super Admin Panel</span>
            <div className="w-8 h-8 rounded-full bg-[#101828] text-white flex items-center justify-center font-bold text-xs">
              A
            </div>
          </div>
        </header>

        <main className="p-6 sm:p-8 flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
