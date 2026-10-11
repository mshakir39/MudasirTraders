'use client';

import {
  ArrowUpRight,
  PhoneCall,
  Mail,
  MapPin,
  Clock3,
  Facebook,
  Youtube,
} from 'lucide-react';
import Logo from './Logo';

interface FooterProps {
  onBrandClick: (index: number) => void;
}

const brandLinks = [
  'Osaka',
  'AGS',
  'Fujika',
  'Exide',
  'Phoenix',
  'Daewoo',
  'Volta',
  'Alaska',
  'Power Plus',
  'Bridge Power',
];

const quickLinks = [
  { label: 'Home', target: 'hero-section' },
  { label: 'Why choose us', target: 'features-section' },
  { label: 'Battery brands', target: 'brands-section' },
  { label: 'Customer reviews', target: 'reviews-section' },
  { label: 'Community meetups', target: 'meetups-section' },
  { label: 'FAQs', target: 'faq-section' },
  { label: 'Visit our shop', target: 'location-section' },
];

const phoneNumbers = [
  { label: '0334 9627745', href: 'tel:+923349627745' },
  { label: '0321 5392445', href: 'tel:+923215392445' },
];

const businessHours = [
  { days: 'Mon–Thu', hours: '8:00 AM – 9:00 PM' },
  { days: 'Friday', hours: '8:00 AM – 1:00 PM' },
  { days: 'Sat–Sun', hours: '8:00 AM – 9:00 PM' },
];

function scrollToSection(target: string) {
  const element = document.getElementById(target);
  if (!element) return;

  element.scrollIntoView({
    behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches
      ? 'auto'
      : 'smooth',
    block: 'start',
  });
}

export default function Footer({ onBrandClick }: FooterProps) {
  const linkClass =
    'inline-flex rounded text-sm text-slate-400 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-4 focus-visible:ring-offset-slate-950';

  return (
    <footer className="relative isolate overflow-hidden bg-slate-950 text-white">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-500/60 to-transparent"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(37,99,235,0.12),transparent_50%)]"
      />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Opening statement */}
        <div className="flex flex-col gap-7 border-b border-white/10 py-10 sm:py-12 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.2em] text-blue-400">
              Mudasir Traders · Dera Ghazi Khan
            </p>

            <h2 className="text-3xl font-bold leading-tight tracking-[-0.035em] sm:text-4xl">
              The right battery.
              <span className="block text-slate-400 sm:inline">
                {' '}The right people.
              </span>
            </h2>
          </div>

          <a
            href="tel:+923349627745"
            className="inline-flex min-h-12 items-center justify-center gap-3 self-start rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-blue-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-4 focus-visible:ring-offset-slate-950 lg:self-auto"
          >
            <PhoneCall aria-hidden="true" className="h-4 w-4" />
            Talk to our team
            <ArrowUpRight aria-hidden="true" className="h-4 w-4" />
          </a>
        </div>

        {/* Main footer */}
        <div className="grid gap-x-8 gap-y-10 py-10 sm:grid-cols-2 sm:py-14 lg:grid-cols-[1.1fr_0.7fr_1fr_1.2fr] lg:gap-x-10">
          {/* Logo and business information */}
          <div className="min-w-0">
            <Logo className="mb-5" textColor="text-white" />

            <p className="max-w-xs text-sm leading-7 text-slate-400">
              Your trusted partner for power solutions since 2023.
              Genuine batteries, expert advice, and dependable local service.
            </p>

            <div className="mt-6 border-l-2 border-blue-500 pl-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-500">
                Authorized dealer
              </p>
              <p className="mt-1.5 text-sm font-semibold text-slate-200">
                Fujika & Exide
              </p>
            </div>

            <div className="mt-7 flex items-center gap-3">
              <a
                href="https://www.facebook.com/profile.php?id=61587613890929"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Mudasir Traders on Facebook, opens in a new tab"
                className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-400 transition-colors hover:border-blue-400/40 hover:bg-blue-500/10 hover:text-blue-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
              >
                <Facebook aria-hidden="true" className="h-5 w-5" />
              </a>

              <a
                href="https://youtube.com/mudasirTraders"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Mudasir Traders on YouTube, opens in a new tab"
                className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-400 transition-colors hover:border-blue-400/40 hover:bg-blue-500/10 hover:text-blue-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
              >
                <Youtube aria-hidden="true" className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Navigation */}
          <nav aria-label="Footer navigation">
            <h3 className="mb-5 text-xs font-bold uppercase tracking-[0.15em] text-white">
              Explore
            </h3>

            <ul className="space-y-3.5">
              {quickLinks.map((link) => (
                <li key={link.target}>
                  <button
                    type="button"
                    onClick={() => scrollToSection(link.target)}
                    className={`${linkClass} text-left`}
                  >
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
          </nav>

          {/* Brand selection */}
          <nav aria-label="Battery brands">
            <h3 className="mb-5 text-xs font-bold uppercase tracking-[0.15em] text-white">
              Battery brands
            </h3>

            <ul className="grid grid-cols-2 gap-x-4 gap-y-3.5">
              {brandLinks.map((name, index) => (
                <li key={name}>
                  <button
                    type="button"
                    onClick={() => onBrandClick(index)}
                    className={`${linkClass} text-left`}
                  >
                    {name}
                  </button>
                </li>
              ))}
            </ul>
          </nav>

          {/* Contact and business hours */}
          <div className="min-w-0">
            <h3 className="mb-5 text-xs font-bold uppercase tracking-[0.15em] text-white">
              Visit & connect
            </h3>

            <ul className="space-y-4">
              {phoneNumbers.map((phone) => (
                <li key={phone.href}>
                  <a
                    href={phone.href}
                    className={`${linkClass} items-center gap-3`}
                  >
                    <PhoneCall
                      aria-hidden="true"
                      className="h-4 w-4 shrink-0 text-blue-400"
                    />
                    {phone.label}
                  </a>
                </li>
              ))}

              <li>
                <a
                  href="mailto:owner@mudasirtraders.com"
                  className={`${linkClass} items-start gap-3`}
                >
                  <Mail
                    aria-hidden="true"
                    className="mt-0.5 h-4 w-4 shrink-0 text-blue-400"
                  />
                  <span className="break-all">
                    owner@mudasirtraders.com
                  </span>
                </a>
              </li>

              <li>
                <button
                  type="button"
                  onClick={() => scrollToSection('location-section')}
                  className={`${linkClass} items-start gap-3 text-left`}
                >
                  <MapPin
                    aria-hidden="true"
                    className="mt-1 h-4 w-4 shrink-0 text-blue-400"
                  />
                  <span className="max-w-xs leading-6">
                    General Bus Stand, near Badozai Market,
                    Dera Ghazi Khan, 32200
                  </span>
                </button>
              </li>
            </ul>

            <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <h4 className="mb-4 flex items-center gap-2 text-xs font-semibold text-slate-200">
                <Clock3
                  aria-hidden="true"
                  className="h-4 w-4 text-blue-400"
                />
                Business hours
              </h4>

              <ul className="space-y-2.5">
                {businessHours.map(({ days, hours }) => (
                  <li
                    key={days}
                    className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-xs"
                  >
                    <span className="text-slate-500">{days}</span>
                    <span className="font-medium tabular-nums text-slate-300">
                      {hours}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Copyright and company credit */}
        <div className="flex flex-col gap-4 border-t border-white/10 py-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs leading-5 text-slate-500">
            &copy; 2026 Mudasir Traders. All rights reserved.
          </p>

          <p className="inline-flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs text-slate-500">
            <span>Designed & developed by</span>

            <a
              href="https://msinnovatelabs.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="MS Innovate Labs, opens in a new tab"
              className="inline-flex items-center gap-1 rounded font-semibold text-blue-400 transition-colors hover:text-blue-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-4 focus-visible:ring-offset-slate-950"
            >
              MS Innovate Labs
              <ArrowUpRight
                aria-hidden="true"
                className="h-3.5 w-3.5"
              />
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}