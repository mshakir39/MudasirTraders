'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Logo from './Logo';
import { ROUTES } from '@/constants/routes';

export default function Navigation() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('home');
  const [showScrollTop, setShowScrollTop] = useState(false);
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

  // Scroll to top handler
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  // Scroll detection for active section highlighting and scroll to top button
  useEffect(() => {
    const handleScroll = () => {
      const sections = [
        { id: 'hero-section', name: 'home' },
        { id: 'brands-section', name: 'products' },
        { id: 'features-section', name: 'features' },
        { id: 'footer-section', name: 'footer-section' },
      ];

      const scrollPosition = window.scrollY + 100; // Offset for better detection
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      const scrollFromBottom = documentHeight - (window.scrollY + windowHeight);
      const isAtBottom = scrollFromBottom <= 200; // 200px threshold for better detection

      // Show/hide scroll to top button
      setShowScrollTop(scrollPosition > 300);

      // If at bottom of page, highlight Contact
      if (isAtBottom) {
        setActiveSection('footer-section');
        return;
      }

      for (const section of sections) {
        const element = document.getElementById(section.id);
        if (element) {
          const { offsetTop, offsetHeight } = element;
          if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
            setActiveSection(section.name);
            break;
          }
        }
      }
    };

    // Initial check
    handleScroll();

    // Add scroll event listener
    window.addEventListener('scroll', handleScroll);
    
    // Cleanup
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
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
              className={`transition-colors ${
                activeSection === 'home'
                  ? 'text-blue-600 font-semibold'
                  : 'text-gray-700 hover:text-blue-600'
              }`}
            >
              Home
            </a>
               <a
              href="#features"
              onClick={(e) => handleSmoothScroll(e, 'features')}
              className={`transition-colors ${
                activeSection === 'features'
                  ? 'text-blue-600 font-semibold'
                  : 'text-gray-700 hover:text-blue-600'
              }`}
            >
              Features
            </a>
            <a
              href="#products"
              onClick={(e) => handleSmoothScroll(e, 'products')}
              className={`transition-colors ${
                activeSection === 'products'
                  ? 'text-blue-600 font-semibold'
                  : 'text-gray-700 hover:text-blue-600'
              }`}
            >
              Products
            </a>
         
            <a
              href="#footer-section"
              onClick={(e) => handleSmoothScroll(e, 'footer-section')}
              className={`transition-colors ${
                activeSection === 'footer-section'
                  ? 'text-blue-600 font-semibold'
                  : 'text-gray-700 hover:text-blue-600'
              }`}
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
              onClick={() => router.push(ROUTES.DASHBOARD)}
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
              className={`transition-colors ${
                activeSection === 'home'
                  ? 'text-blue-600 font-semibold'
                  : 'text-gray-700 hover:text-blue-600'
              }`}
            >
              Home
            </a>
         
            <a
              href="#features"
              onClick={(e) => handleSmoothScroll(e, 'features')}
              className={`transition-colors ${
                activeSection === 'features'
                  ? 'text-blue-600 font-semibold'
                  : 'text-gray-700 hover:text-blue-600'
              }`}
            >
              Features
            </a>
               <a
              href="#products"
              onClick={(e) => handleSmoothScroll(e, 'products')}
              className={`transition-colors ${
                activeSection === 'products'
                  ? 'text-blue-600 font-semibold'
                  : 'text-gray-700 hover:text-blue-600'
              }`}
            >
              Products
            </a>
            <a
              href="#footer-section"
              onClick={(e) => handleSmoothScroll(e, 'footer-section')}
              className={`transition-colors ${
                activeSection === 'footer-section'
                  ? 'text-blue-600 font-semibold'
                  : 'text-gray-700 hover:text-blue-600'
              }`}
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
              onClick={() => router.push(ROUTES.DASHBOARD)}
              className="w-full px-4 py-2 text-sm font-medium text-blue-600 border border-blue-600 rounded-md hover:bg-blue-600 hover:text-white transition-colors"
            >
              Dashboard
            </button>
          </div>
        </div>
      )}
    </nav>
    
    {/* Floating Scroll to Top Button */}
    {showScrollTop && (
      <button
        onClick={scrollToTop}
        className="fixed bottom-8 right-8 z-50 bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-full shadow-lg transition-all duration-300 transform hover:scale-110 focus:outline-none focus:ring-4 focus:ring-blue-300 animate-bounce"
        aria-label="Scroll to top"
      >
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 10l7-7m0 0l7 7m-7-7v18"
          />
        </svg>
      </button>
    )}
    </>
  );
}
