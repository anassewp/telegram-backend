'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { Menu, X } from 'lucide-react';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  const navLinks = [
    { name: 'الرئيسية', href: '/' },
    { name: 'الميزات', href: '/features' },
    { name: 'الأسعار', href: '/pricing' },
  ];

  return (
    <nav className="bg-white border-b border-neutral-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3 space-x-reverse">
            <Image 
              src="/logo.png" 
              alt="SocialPro Logo" 
              width={40} 
              height={40} 
              className="object-contain"
            />
            <span className="text-2xl font-bold text-neutral-900">SocialPro</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-neutral-600 hover:text-primary-600 transition-colors font-medium"
              >
                {link.name}
              </Link>
            ))}
          </div>

          {/* Auth Buttons */}
          <div className="hidden md:flex items-center gap-4">
            <Link
              href="/login"
              className="text-neutral-700 hover:text-primary-600 transition-colors font-medium"
            >
              تسجيل الدخول
            </Link>
            <Link
              href="/signup"
              className="px-6 py-2.5 bg-gradient-primary text-white rounded-lg font-semibold btn-transition hover:shadow-primary"
            >
              ابدأ مجاناً
            </Link>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-neutral-100 transition-colors"
          >
            {isOpen ? (
              <X className="w-6 h-6 text-neutral-700" />
            ) : (
              <Menu className="w-6 h-6 text-neutral-700" />
            )}
          </button>
        </div>

        {/* Mobile menu */}
        {isOpen && (
          <div className="md:hidden py-4 border-t border-neutral-200 animate-fade-in">
            <div className="flex flex-col gap-4">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-neutral-600 hover:text-primary-600 transition-colors font-medium"
                  onClick={() => setIsOpen(false)}
                >
                  {link.name}
                </Link>
              ))}
              <div className="flex flex-col gap-3 pt-4 border-t border-neutral-200">
                <Link
                  href="/login"
                  className="text-center py-2.5 text-neutral-700 hover:text-primary-600 transition-colors font-medium"
                  onClick={() => setIsOpen(false)}
                >
                  تسجيل الدخول
                </Link>
                <Link
                  href="/signup"
                  className="text-center px-6 py-2.5 bg-gradient-primary text-white rounded-lg font-semibold btn-transition"
                  onClick={() => setIsOpen(false)}
                >
                  ابدأ مجاناً
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
