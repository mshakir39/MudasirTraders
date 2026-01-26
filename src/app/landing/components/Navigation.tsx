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

  const handleSmoothScroll = (
    e: React.MouseEvent<HTMLAnchorElement>,
    targetId: string
  ) => {
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
      behavior: 'smooth',
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
          if (
            scrollPosition >= offsetTop &&
            scrollPosition < offsetTop + offsetHeight
          ) {
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
      <nav className='fixed left-0 right-0 top-0 z-50 bg-white shadow-md'>
        <div className='mx-auto max-w-7xl px-4 sm:px-6 lg:px-8'>
          <div className='flex h-16 items-center justify-between'>
            <div className='flex items-center'>
              <Logo />
            </div>

            {/* Desktop Menu */}
            <div className='hidden space-x-8 md:flex'>
              <a
                href='#home'
                onClick={(e) => handleSmoothScroll(e, 'home')}
                className={`transition-colors ${
                  activeSection === 'home'
                    ? 'font-semibold text-blue-600'
                    : 'text-gray-700 hover:text-blue-600'
                }`}
              >
                Home
              </a>
              <a
                href='#features'
                onClick={(e) => handleSmoothScroll(e, 'features')}
                className={`transition-colors ${
                  activeSection === 'features'
                    ? 'font-semibold text-blue-600'
                    : 'text-gray-700 hover:text-blue-600'
                }`}
              >
                Features
              </a>
              <a
                href='#products'
                onClick={(e) => handleSmoothScroll(e, 'products')}
                className={`transition-colors ${
                  activeSection === 'products'
                    ? 'font-semibold text-blue-600'
                    : 'text-gray-700 hover:text-blue-600'
                }`}
              >
                Products
              </a>

              <a
                href='#footer-section'
                onClick={(e) => handleSmoothScroll(e, 'footer-section')}
                className={`transition-colors ${
                  activeSection === 'footer-section'
                    ? 'font-semibold text-blue-600'
                    : 'text-gray-700 hover:text-blue-600'
                }`}
              >
                Contact
              </a>
            </div>

            {/* Action Buttons */}
            <div className='hidden items-center space-x-4 md:flex'>
              <button
                onClick={() => (window.location.href = 'tel:03349627745')}
                className='rounded-md border border-blue-600 px-4 py-2 text-sm font-medium text-blue-600 transition-colors hover:bg-blue-600 hover:text-white'
              >
                Call Us
              </button>
              <button
                onClick={() => router.push(ROUTES.DASHBOARD)}
                className='rounded-md border border-blue-600 px-4 py-2 text-sm font-medium text-blue-600 transition-colors hover:bg-blue-600 hover:text-white'
              >
                Dashboard
              </button>
            </div>

            {/* Mobile Hamburger */}
            <div className='flex items-center md:hidden'>
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className='text-gray-700 hover:text-blue-600 focus:outline-none'
              >
                <svg
                  className='h-6 w-6'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                  xmlns='http://www.w3.org/2000/svg'
                >
                  {mobileMenuOpen ? (
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M6 18L18 6M6 6l12 12'
                    />
                  ) : (
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M4 6h16M4 12h16M4 18h16'
                    />
                  )}
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className='absolute left-0 top-16 z-40 w-full bg-white shadow-lg md:hidden'>
            <div className='flex flex-col space-y-3 px-4 py-4'>
              <a
                href='#home'
                onClick={(e) => handleSmoothScroll(e, 'home')}
                className={`transition-colors ${
                  activeSection === 'home'
                    ? 'font-semibold text-blue-600'
                    : 'text-gray-700 hover:text-blue-600'
                }`}
              >
                Home
              </a>

              <a
                href='#features'
                onClick={(e) => handleSmoothScroll(e, 'features')}
                className={`transition-colors ${
                  activeSection === 'features'
                    ? 'font-semibold text-blue-600'
                    : 'text-gray-700 hover:text-blue-600'
                }`}
              >
                Features
              </a>
              <a
                href='#products'
                onClick={(e) => handleSmoothScroll(e, 'products')}
                className={`transition-colors ${
                  activeSection === 'products'
                    ? 'font-semibold text-blue-600'
                    : 'text-gray-700 hover:text-blue-600'
                }`}
              >
                Products
              </a>
              <a
                href='#footer-section'
                onClick={(e) => handleSmoothScroll(e, 'footer-section')}
                className={`transition-colors ${
                  activeSection === 'footer-section'
                    ? 'font-semibold text-blue-600'
                    : 'text-gray-700 hover:text-blue-600'
                }`}
              >
                Contact
              </a>

              <button
                onClick={() => (window.location.href = 'tel:03349627745')}
                className='w-full rounded-md border border-blue-600 px-4 py-2 text-sm font-medium text-blue-600 transition-colors hover:bg-blue-600 hover:text-white'
              >
                Call Us
              </button>
              <button
                onClick={() => router.push(ROUTES.DASHBOARD)}
                className='w-full rounded-md border border-blue-600 px-4 py-2 text-sm font-medium text-blue-600 transition-colors hover:bg-blue-600 hover:text-white'
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
          className='fixed bottom-8 right-8 z-50 transform animate-bounce rounded-full bg-blue-600 p-4 text-white shadow-lg transition-all duration-300 hover:scale-110 hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-300'
          aria-label='Scroll to top'
        >
          <svg
            className='h-6 w-6'
            fill='none'
            stroke='currentColor'
            viewBox='0 0 24 24'
            xmlns='http://www.w3.org/2000/svg'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2}
              d='M5 10l7-7m0 0l7 7m-7-7v18'
            />
          </svg>
        </button>
      )}
    </>
  );
}
