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

            {/* Social Media Icons */}
            <div className='mb-6'>
              <h4 className='mb-3 font-semibold'>Follow Us</h4>
              <div className='flex space-x-4'>
                <a
                  href='https://www.facebook.com/profile.php?id=61587613890929'
                  target='_blank'
                  rel='noopener noreferrer'
                  className='text-gray-400 transition-colors hover:text-white'
                  aria-label='Facebook'
                >
                  <svg
                    className='h-6 w-6'
                    fill='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path d='M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z'/>
                  </svg>
                </a>
                <a
                  href='https://youtube.com/mudasirTraders'
                  target='_blank'
                  rel='noopener noreferrer'
                  className='text-gray-400 transition-colors hover:text-white'
                  aria-label='YouTube'
                >
                  <svg
                    className='h-6 w-6'
                    fill='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path d='M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z'/>
                  </svg>
                </a>
              </div>
            </div>

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
