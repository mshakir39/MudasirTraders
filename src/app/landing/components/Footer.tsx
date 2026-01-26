'use client';
import Logo from './Logo';
interface FooterProps {
  onBrandClick: (index: number) => void;
}

export default function Footer({ onBrandClick }: FooterProps) {
  const brandLinks = ['Osaka', 'AGS', 'Exide', 'Phoenix', 'Daewoo'];

  return (
    <footer className='bg-gray-900 px-6 py-12 text-white lg:px-12'>
      <div className='mx-auto max-w-7xl'>
        <div className='grid gap-8 md:grid-cols-4'>
          {/* Column 1: About */}
          {/* Column 1: Logo & About */}
          <div>
            <Logo className='mb-4' textColor='text-white' />
            <p className='mt-4 text-gray-400'>
              Your trusted partner for power solutions since 2023.
            </p>
          </div>

          {/* Column 2: Quick Links */}
          <div>
            <h3 className='mb-4 font-bold'>Quick Links</h3>
            <ul className='space-y-2 text-gray-400'>
              <li>
                <button
                  onClick={() => {
                    const element = document.getElementById('hero-section');
                    if (element) {
                      element.scrollIntoView({ behavior: 'smooth' });
                    }
                  }}
                  className='text-left transition-colors hover:text-white focus:outline-none'
                >
                  Home
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    const element = document.getElementById('features-section');
                    if (element) {
                      element.scrollIntoView({ behavior: 'smooth' });
                    }
                  }}
                  className='text-left transition-colors hover:text-white focus:outline-none'
                >
                  Features
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    const element = document.getElementById('brands-section');
                    if (element) {
                      element.scrollIntoView({ behavior: 'smooth' });
                    }
                  }}
                  className='text-left transition-colors hover:text-white focus:outline-none'
                >
                  Products
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    const element = document.getElementById('location-section');
                    if (element) {
                      element.scrollIntoView({ behavior: 'smooth' });
                    }
                  }}
                  className='text-left transition-colors hover:text-white focus:outline-none'
                >
                  Contact
                </button>
              </li>
            </ul>
          </div>

          {/* Column 3: Products (Smooth Scroll Trigger) */}
          <div>
            <h3 className='mb-4 font-bold'>Products</h3>
            <ul className='space-y-2 text-gray-400'>
              {brandLinks.map((name, index) => (
                <li key={name}>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      onBrandClick(index);
                    }}
                    className='text-left transition-colors hover:text-white focus:outline-none'
                  >
                    {name}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4: Contact & Timing */}
          <div>
            <h3 className='mb-4 font-bold'>Contact Info</h3>
            <ul className='mb-6 space-y-2 text-gray-400'>
              <li>📞 0334 9627745</li>
              <li>📧 owner@mudasirtraders.com</li>
              <li className='text-sm'>
                📍 General Bus Stand, near Badozai Market, Dera Ghazi Khan,
                32200
              </li>
            </ul>

            <div className='mt-4 border-t border-gray-800 pt-4'>
              <h4 className='mb-2 font-semibold '>Business Hours</h4>
              <ul className='space-y-1 text-xs text-gray-400'>
                <li>Mon-Thu: 8:00 AM - 9:00 PM</li>
                <li>Friday: 8:00 AM - 1:00 PM</li>
                <li>Sat-Sun: 8:00 AM - 9:00 PM</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className='mt-8 border-t border-gray-800 pt-8 text-center text-gray-400'>
          <p>&copy; 2026 Mudasir Traders. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
