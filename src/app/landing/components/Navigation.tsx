'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Logo from './Logo';

export default function Navigation() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const router = useRouter();

  const handleSmoothScroll = (e: React.MouseEvent<HTMLAnchorElement>, targetId: string) => {
    e.preventDefault();

    const sectionMap: { [key: string]: string } = {
      home: 'hero-section',
      products: 'brands-section',
      features: 'features-section',
      'footer-section': 'footer-section',
    };

    const targetElement = document.getElementById(sectionMap[targetId]);
    if (targetElement) {
      targetElement.scrollIntoView({ behavior: 'smooth' });
    }

    // Close mobile menu after click
    setMobileMenuOpen(false);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 bg-white shadow-md z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Logo />
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex space-x-8">
            <a
              href="#home"
              onClick={(e) => handleSmoothScroll(e, 'home')}
              className="text-gray-700 hover:text-blue-600 transition-colors"
            >
              Home
            </a>
            <a
              href="#products"
              onClick={(e) => handleSmoothScroll(e, 'products')}
              className="text-gray-700 hover:text-blue-600 transition-colors"
            >
              Products
            </a>
            <a
              href="#features"
              onClick={(e) => handleSmoothScroll(e, 'features')}
              className="text-gray-700 hover:text-blue-600 transition-colors"
            >
              Features
            </a>
            <a
              href="#footer-section"
              onClick={(e) => handleSmoothScroll(e, 'footer-section')}
              className="text-gray-700 hover:text-blue-600 transition-colors"
            >
              Contact
            </a>
          </div>

          {/* Action Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            <button
              onClick={() => (window.location.href = 'tel:03349627745')}
              className="px-4 py-2 text-sm font-medium text-blue-600 border border-blue-600 rounded-md hover:bg-blue-600 hover:text-white transition-colors"
            >
              Call Us
            </button>
            <button
              onClick={() => router.push('/signIn')}
              className="px-4 py-2 text-sm font-medium text-blue-600 border border-blue-600 rounded-md hover:bg-blue-600 hover:text-white transition-colors"
            >
              Dashboard
            </button>
          </div>

          {/* Mobile Hamburger */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-gray-700 hover:text-blue-600 focus:outline-none"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                {mobileMenuOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white shadow-lg w-full absolute top-16 left-0 z-40">
          <div className="flex flex-col px-4 py-4 space-y-3">
            <a
              href="#home"
              onClick={(e) => handleSmoothScroll(e, 'home')}
              className="text-gray-700 hover:text-blue-600 transition-colors"
            >
              Home
            </a>
            <a
              href="#products"
              onClick={(e) => handleSmoothScroll(e, 'products')}
              className="text-gray-700 hover:text-blue-600 transition-colors"
            >
              Products
            </a>
            <a
              href="#features"
              onClick={(e) => handleSmoothScroll(e, 'features')}
              className="text-gray-700 hover:text-blue-600 transition-colors"
            >
              Features
            </a>
            <a
              href="#footer-section"
              onClick={(e) => handleSmoothScroll(e, 'footer-section')}
              className="text-gray-700 hover:text-blue-600 transition-colors"
            >
              Contact
            </a>

            <button
              onClick={() => (window.location.href = 'tel:03349627745')}
              className="w-full px-4 py-2 text-sm font-medium text-blue-600 border border-blue-600 rounded-md hover:bg-blue-600 hover:text-white transition-colors"
            >
              Call Us
            </button>
            <button
              onClick={() => router.push('/signIn')}
              className="w-full px-4 py-2 text-sm font-medium text-blue-600 border border-blue-600 rounded-md hover:bg-blue-600 hover:text-white transition-colors"
            >
              Dashboard
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
