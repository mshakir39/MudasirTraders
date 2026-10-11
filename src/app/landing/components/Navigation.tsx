'use client';

import { useEffect, useRef, useState, type MouseEvent } from 'react';
import Link from 'next/link';
import Logo from './Logo';
import { ROUTES } from '@/constants/routes';

const links = [
  { id: 'hero-section', label: 'Home' },
  { id: 'features-section', label: 'Features' },
  { id: 'brands-section', label: 'Brands' },
  { id: 'reviews-section', label: 'Reviews' },
  { id: 'meetups-section', label: 'Meetups' },
  { id: 'faq-section', label: 'FAQ' },
  { id: 'location-section', label: 'Location' },
];

function Icon({ name, className = 'h-5 w-5' }: { name: 'phone' | 'arrow' | 'up'; className?: string }) {
  const paths = {
    phone: 'M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.2 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.69 2.79a2 2 0 0 1-.45 2.11L8.09 9.89a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.89.33 1.83.56 2.79.69A2 2 0 0 1 22 16.92Z',
    arrow: 'M5 12h14m-6-6 6 6-6 6',
    up: 'M12 19V5m-6 6 6-6 6 6',
  };
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[name]} /></svg>;
}

export default function Navigation() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('hero-section');
  const [scrolled, setScrolled] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const headerRef = useRef<HTMLElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const isClickScrollRef = useRef(false);
  const clickTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const scrollBehavior = (): ScrollBehavior => window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';

  const handleSmoothScroll = (event: MouseEvent<HTMLAnchorElement>, id: string) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
    const target = document.getElementById(id);
    if (!target) return;
    event.preventDefault();

    // 1. Immediately highlight the clicked item
    setActiveSection(id);
    isClickScrollRef.current = true;

    if (clickTimeoutRef.current) {
      clearTimeout(clickTimeoutRef.current);
    }
    // Lock highlight for the duration of smooth scroll
    clickTimeoutRef.current = setTimeout(() => {
      isClickScrollRef.current = false;
    }, 850);

    const offset = (headerRef.current?.getBoundingClientRect().height ?? 72) + 16;
    window.scrollTo({
      top: Math.max(0, window.scrollY + target.getBoundingClientRect().top - offset),
      behavior: scrollBehavior(),
    });
    window.history.replaceState(null, '', `#${id}`);
    setMobileMenuOpen(false);
  };

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const scrollY = window.scrollY;
      setScrolled(scrollY > 16);
      setShowScrollTop(scrollY > 400);

      // Do not overwrite clicked item while smooth-scrolling to it
      if (isClickScrollRef.current) return;

      const headerHeight = headerRef.current?.getBoundingClientRect().height ?? 72;
      const viewportHeight = window.innerHeight;
      const scrollHeight = document.documentElement.scrollHeight;

      // Bottom of page check (within 60px of the document bottom)
      if (scrollY > 0 && scrollY + viewportHeight >= scrollHeight - 60) {
        setActiveSection(links[links.length - 1].id);
        return;
      }

      // Very top of page check
      if (scrollY < 50) {
        setActiveSection(links[0].id);
        return;
      }

      // Detection threshold: section is active when scrolled to upper 30% of viewport
      const threshold = headerHeight + viewportHeight * 0.3;
      let current = links[0].id;

      for (const link of links) {
        const element = document.getElementById(link.id);
        if (element) {
          const rect = element.getBoundingClientRect();
          if (rect.top <= threshold && rect.bottom > headerHeight) {
            current = link.id;
          }
        }
      }

      setActiveSection(current);
    };

    const onUserInteraction = () => {
      if (isClickScrollRef.current) {
        isClickScrollRef.current = false;
        if (clickTimeoutRef.current) clearTimeout(clickTimeoutRef.current);
      }
    };

    const schedule = () => { if (!frame) frame = window.requestAnimationFrame(update); };
    update();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    window.addEventListener('wheel', onUserInteraction, { passive: true });
    window.addEventListener('touchstart', onUserInteraction, { passive: true });
    return () => {
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      window.removeEventListener('wheel', onUserInteraction);
      window.removeEventListener('touchstart', onUserInteraction);
      if (frame) window.cancelAnimationFrame(frame);
      if (clickTimeoutRef.current) clearTimeout(clickTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    if (!mobileMenuOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { setMobileMenuOpen(false); toggleRef.current?.focus(); }
    };
    const onPointerDown = (event: PointerEvent) => {
      if (event.target instanceof Node && !headerRef.current?.contains(event.target)) setMobileMenuOpen(false);
    };
    const desktop = window.matchMedia('(min-width: 1024px)');
    const onResize = () => { if (desktop.matches) setMobileMenuOpen(false); };
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('pointerdown', onPointerDown);
    desktop.addEventListener('change', onResize);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('pointerdown', onPointerDown);
      desktop.removeEventListener('change', onResize);
    };
  }, [mobileMenuOpen]);

  const focus = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-4';
  const dashboardClass = `group inline-flex items-center justify-center gap-3 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-[0_6px_18px_-6px_rgba(37,99,235,0.5)] transition-colors hover:bg-blue-700 ${focus}`;

  return (
    <>
      <header ref={headerRef} className={`fixed inset-x-0 top-0 z-50 border-b transition-[background-color,box-shadow,border-color] duration-300 motion-reduce:transition-none ${scrolled || mobileMenuOpen ? 'border-slate-200/70 bg-white/95 shadow-[0_8px_30px_-18px_rgba(15,23,42,0.2)] backdrop-blur-xl' : 'border-slate-200/50 bg-white'}`}>
        <nav aria-label="Main navigation" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-[72px] items-center justify-between gap-4">
            <div className="min-w-0 shrink-0"><Logo /></div>
            <div className="hidden items-center gap-0.5 rounded-full border border-slate-200/70 bg-slate-50/80 p-1 lg:flex xl:gap-1">
              {links.map(link => (
                <a key={link.id} href={`#${link.id}`} onClick={event => handleSmoothScroll(event, link.id)} aria-current={activeSection === link.id ? 'location' : undefined} className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors xl:px-3.5 xl:py-2 xl:text-sm ${focus} ${activeSection === link.id ? 'bg-white text-blue-600 shadow-sm ring-1 ring-slate-200/60' : 'text-slate-600 hover:bg-white/80 hover:text-slate-950'}`}>
                  {link.label}
                </a>
              ))}
            </div>
            <div className="hidden items-center gap-5 lg:flex">
              <a href="tel:03349627745" className={`inline-flex items-center gap-2 rounded-lg text-sm font-semibold text-slate-600 transition-colors hover:text-blue-600 ${focus}`}><Icon name="phone" className="h-4 w-4" />Call Us</a>
              <Link href={ROUTES.DASHBOARD} className={dashboardClass}>Dashboard<Icon name="arrow" className="h-4 w-4 transition-transform group-hover:translate-x-0.5 motion-reduce:transform-none" /></Link>
            </div>
            <div className="flex items-center gap-2 lg:hidden">
              <a href="tel:03349627745" aria-label="Call us" className={`flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 ${focus}`}><Icon name="phone" /></a>
              <button ref={toggleRef} type="button" aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'} aria-expanded={mobileMenuOpen} aria-controls="mobile-navigation" onClick={() => setMobileMenuOpen(open => !open)} className={`flex h-11 w-11 flex-col items-center justify-center gap-[5px] rounded-xl border border-slate-200 bg-white text-slate-800 ${focus}`}>
                <span className={`h-0.5 w-5 rounded-full bg-current transition-transform motion-reduce:transition-none ${mobileMenuOpen ? 'translate-y-[7px] rotate-45' : ''}`} />
                <span className={`h-0.5 w-5 rounded-full bg-current transition-opacity ${mobileMenuOpen ? 'opacity-0' : ''}`} />
                <span className={`h-0.5 w-5 rounded-full bg-current transition-transform motion-reduce:transition-none ${mobileMenuOpen ? '-translate-y-[7px] -rotate-45' : ''}`} />
              </button>
            </div>
          </div>
          <div id="mobile-navigation" hidden={!mobileMenuOpen} className="absolute left-4 right-4 top-[84px] max-h-[calc(100dvh-100px)] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-3 shadow-[0_20px_60px_-15px_rgba(15,23,42,0.25)] sm:left-6 sm:right-6 lg:hidden">
            <p className="px-3 pb-2 pt-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">Explore</p>
            {links.map(link => (
              <a key={link.id} href={`#${link.id}`} onClick={event => handleSmoothScroll(event, link.id)} aria-current={activeSection === link.id ? 'location' : undefined} className={`mb-1 flex items-center justify-between rounded-xl px-4 py-3 text-sm font-medium ${focus} ${activeSection === link.id ? 'bg-blue-50 text-blue-600' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-950'}`}>
                {link.label}{activeSection === link.id ? <span className="h-1.5 w-1.5 rounded-full bg-blue-600" /> : <Icon name="arrow" className="h-4 w-4 text-slate-300" />}
              </a>
            ))}
            <div className="mt-3 grid grid-cols-2 gap-2 border-t border-slate-100 pt-3">
              <a href="tel:03349627745" className={`inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 ${focus}`}><Icon name="phone" className="h-4 w-4" />Call Us</a>
              <Link href={ROUTES.DASHBOARD} onClick={() => setMobileMenuOpen(false)} className={dashboardClass}>Dashboard<Icon name="arrow" className="h-4 w-4" /></Link>
            </div>
          </div>
        </nav>
      </header>
      {showScrollTop && <button type="button" onClick={() => window.scrollTo({ top: 0, behavior: scrollBehavior() })} aria-label="Scroll to top" className={`fixed bottom-6 right-5 z-40 flex h-12 w-12 items-center justify-center rounded-2xl border border-blue-500 bg-blue-600 text-white shadow-lg shadow-blue-600/20 transition-colors hover:bg-blue-700 sm:bottom-8 sm:right-8 ${focus}`}><Icon name="up" /></button>}
    </>
  );
}
