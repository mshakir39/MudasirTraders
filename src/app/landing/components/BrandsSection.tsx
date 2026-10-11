'use client';

import React, { useId } from 'react';
import { ArrowUpRight, ArrowRight, Zap, ShieldCheck, Award, CheckCircle2, PhoneCall, MapPin, BatteryCharging } from 'lucide-react';

interface BrandsSectionProps {
  selectedBrand: number;
  setSelectedBrand: (index: number) => void;
}

const BRANDS = [

    {

      name: 'Osaka',

      code: 'OSK',

      tag: 'Market Leader',

      isAuthorized: false,

      badge: '25+ Years Legacy',

      description:

        "Pakistan's most trusted battery brand with 25+ years of excellence. High performance, durable lead-acid and maintenance-free options.",

      features: ['Long Life', 'High Performance', 'Warranty Available'],

      category: 'Car, UPS & Solar Applications',

    },

    {

      name: 'AGS',

      code: 'AGS',

      tag: 'Japanese Tech',

      isAuthorized: false,

      badge: 'Atlas Battery Tech',

      description:

        'Japanese technology batteries engineered for superior starting power, rapid charging, and long-lasting durability in hot climates.',

      features: ['Japanese Tech', 'Reliable', 'Powerful'],

      category: 'Automotive & Commercial Transport',

    },

    {

      name: 'Fujika',

      code: 'FJK',

      tag: 'Authorized Dealer',

      isAuthorized: true,

      badge: 'Official Dealership',

      description:

        'Official Authorized Dealership. Advanced dry battery and tubular technology known for extra backup power, heavy duty performance, and exceptional long life.',

      features: ['Advanced Dry Tech', 'Extra Backup', 'Long Life'],

      category: 'Heavy Duty, Commercial & Deep Cycle',

    },

    {

      name: 'Exide',

      code: 'EXD',

      tag: 'Authorized Dealer',

      isAuthorized: true,

      badge: 'Official Dealership',

      description:

        'Official Authorized Dealership. Since 1953, Exide stands as the gold standard in automotive, solar, and industrial power solutions.',

      features: ['Since 1953', 'Premium Quality', 'All Vehicles'],

      category: 'Automotive, Solar & Inverter UPS',

    },

    {

      name: 'Phoenix',

      code: 'PHX',

      tag: 'Extreme Power',

      isAuthorized: false,

      badge: 'OEM Quality',

      description:

        'OEM quality batteries designed for extreme performance conditions, high heat resistance, and reliable heavy vehicle cranking.',

      features: ['OEM Quality', 'Extreme Performance', 'Durable'],

      category: 'Car & Heavy Duty Tubular UPS',

    },

    {

      name: 'Daewoo',

      code: 'DWO',

      tag: '100% Maintenance Free',

      isAuthorized: false,

      badge: 'Sealed MF Tech',

      description:

        'International standard sealed maintenance-free batteries. Zero acid refilling, instant cranking power, and long service life.',

      features: ['International', 'Auto Excellence', 'Reliable'],

      category: 'Sealed Maintenance-Free Automotive',

    },

    {

      name: 'Volta',

      code: 'VLT',

      tag: 'Solar Tubular',

      isAuthorized: false,

      badge: 'Deep Cycle Tech',

      description:

        'Top-tier tubular, maintenance-free, and deep-cycle batteries specifically designed for residential solar setups and uninterrupted UPS backup.',

      features: ['Tubular Solar Tech', 'Deep Cycle', 'High Heat Resistance'],

      category: 'Solar Energy Storage & Home Inverters',

    },

    {

      name: 'Alaska',

      code: 'ALK',

      tag: 'Heavy Commercial',

      isAuthorized: false,

      badge: 'Tough Endurance',

      description:

        'Heavy-duty commercial and automotive batteries engineered for reliable starting power under extreme load and heavy vibration.',

      features: ['Heavy Duty', 'Commercial & Auto', 'Reliable Starting'],

      category: 'Commercial Vehicles, Trucks & Tractors',

    },

    {

      name: 'Power Plus',

      code: 'PWR',

      tag: 'High Cranking',

      isAuthorized: false,

      badge: 'Heavy Plates',

      description:

        'High-cranking power batteries engineered with thick reinforced plates for cars, commercial transport, and dependable UPS backup.',

      features: ['High Cranking', 'Durable Plates', 'Instant Power'],

      category: 'Automotive & Emergency UPS Power',

    },

    {

      name: 'Bridge Power',

      code: 'BRG',

      tag: 'Cost Effective',

      isAuthorized: false,

      badge: 'Economy & Value',

      description:

        'Reliable, cost-effective power storage batteries built for consistent daily performance and economical battery replacement.',

      features: ['Cost Effective', 'Consistent Output', 'Long Backup'],

      category: 'Economy Solar & Domestic Backup',

    },

  ];

export default function BrandsSection({ selectedBrand, setSelectedBrand }: BrandsSectionProps) {
  const id = useId();
  const activeIndex = Number.isInteger(selectedBrand) && selectedBrand >= 0 && selectedBrand < BRANDS.length ? selectedBrand : 0;
  const brand = BRANDS[activeIndex];

  return (
    <section aria-labelledby={`${id}-heading`} className="relative isolate overflow-hidden bg-[#f8faff] py-16 text-slate-900 sm:py-24 lg:py-28">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(79,70,229,0.07),transparent_55%)]" />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <header className="mb-10 grid gap-6 lg:mb-12 lg:grid-cols-[1.2fr_1fr] lg:items-end lg:gap-16">
          <div>
            <div className="mb-5 flex items-center gap-3 text-xs font-bold uppercase tracking-[0.2em] text-blue-700">
              <span className="h-px w-8 bg-blue-600" /> Our battery collection
            </div>
            <h2 id={`${id}-heading`} className="text-4xl font-extrabold leading-[1.08] tracking-[-0.045em] sm:text-5xl lg:text-6xl">
              Trusted names.<br /><span className="text-blue-600">Power that lasts.</span>
            </h2>
          </div>
          <div className="max-w-lg lg:pb-1">
            <p className="text-base leading-7 text-slate-600">Explore premium battery brands for your vehicle, home, and solar setup. Find the right power solution with expert guidance and in-shop load testing.</p>
            <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm font-semibold text-slate-800">
              <Award aria-hidden="true" className="h-5 w-5 text-amber-600" /><span>Authorized dealer of Fujika & Exide</span>
            </div>
          </div>
        </header>

        <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-[0_24px_80px_-40px_rgba(15,23,42,0.3)] sm:rounded-[32px]">
          <div className="grid lg:grid-cols-[300px_minmax(0,1fr)]">
            <aside className="min-w-0 border-b border-slate-200 bg-slate-50/70 lg:border-b-0 lg:border-r">
              <div className="flex items-center justify-between px-5 py-5 sm:px-6">
                <p className="text-xs font-bold uppercase tracking-[0.15em] text-slate-500">Choose a brand</p>
                <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-500">10 brands</span>
              </div>
              <div role="group" aria-label="Battery brands" className="grid grid-cols-2 gap-2 px-3 pb-4 sm:grid-cols-3 lg:grid-cols-1 lg:gap-1 lg:px-3 lg:pb-5">
                {BRANDS.map((item, index) => {
                  const active = activeIndex === index;
                  return (
                    <button key={item.code} type="button" aria-pressed={active} aria-controls={`${id}-detail`} onClick={() => setSelectedBrand(index)} className={`group flex min-w-0 items-center gap-3 rounded-xl border p-3 text-left transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 motion-reduce:transition-none ${active ? 'border-blue-600 bg-blue-600 text-white shadow-md shadow-blue-600/15' : 'border-transparent text-slate-700 hover:border-slate-200 hover:bg-white'}`}>
                      <span aria-hidden="true" className={`hidden h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[10px] font-extrabold tracking-wider sm:flex ${active ? 'bg-white/15 text-white' : 'bg-white text-slate-500 ring-1 ring-slate-200'}`}>{item.code}</span>
                      <span className="min-w-0 flex-1"><span className="block text-sm font-bold">{item.name}</span><span className={`mt-0.5 block text-[10px] leading-4 ${active ? 'text-blue-100' : 'text-slate-500'}`}>{item.isAuthorized ? 'Authorized dealer' : item.tag}</span></span>
                      {item.isAuthorized ? <Award aria-label="Authorized dealer" className={`h-4 w-4 shrink-0 ${active ? 'text-amber-300' : 'text-amber-600'}`} /> : <ArrowRight aria-hidden="true" className={`hidden h-4 w-4 shrink-0 lg:block ${active ? 'text-white' : 'text-slate-300 group-hover:text-blue-600'}`} />}
                    </button>
                  );
                })}
              </div>
            </aside>

            <div id={`${id}-detail`} className="min-w-0">
              <div className="relative isolate overflow-hidden bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-700 px-6 py-8 text-white sm:px-10 sm:py-10">
                <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-24 h-80 w-80 rounded-full border-[40px] border-white/[0.05]" />
                <div aria-hidden="true" className="pointer-events-none absolute -bottom-28 right-16 h-72 w-72 rounded-full border border-white/10" />
                <div className="relative flex items-start justify-between gap-4">
                  <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.1em] sm:text-xs ${brand.isAuthorized ? 'border-amber-300/40 bg-amber-300/15 text-amber-100' : 'border-white/20 bg-white/10 text-blue-50'}`}>
                    {brand.isAuthorized ? <Award aria-hidden="true" className="h-4 w-4" /> : <ShieldCheck aria-hidden="true" className="h-4 w-4" />}
                    {brand.isAuthorized ? 'Authorized dealership' : 'Genuine battery collection'}
                  </span>
                  <span aria-hidden="true" className="text-xs font-medium tabular-nums text-blue-200">{String(activeIndex + 1).padStart(2, '0')} / 10</span>
                </div>
                <div className="relative mt-9 flex items-end justify-between gap-4">
                  <div className="min-w-0"><p className="mb-2 text-xs font-medium uppercase tracking-[0.2em] text-blue-200">{brand.badge}</p><h3 className="break-words text-4xl font-extrabold leading-tight tracking-[-0.04em] sm:text-6xl">{brand.name}<span className="text-blue-300">.</span></h3><p className="mt-3 text-sm text-blue-100">{brand.tag}</p></div>
                  <div aria-hidden="true" className="hidden h-24 w-24 shrink-0 items-center justify-center rounded-3xl border border-white/20 bg-white/10 sm:flex"><BatteryCharging className="h-12 w-12 text-white" strokeWidth={1.25} /></div>
                </div>
              </div>

              <div className="px-6 py-7 sm:px-10 sm:py-9">
                <p className="max-w-2xl text-base leading-7 text-slate-600">{brand.description}</p>
                <div className="mt-6 flex flex-wrap gap-x-5 gap-y-3">
                  {brand.features.map(feature => <span key={feature} className="inline-flex items-center gap-2 text-sm font-semibold text-slate-800"><CheckCircle2 aria-hidden="true" className="h-4 w-4 shrink-0 text-blue-600" />{feature}</span>)}
                </div>
                <div className="mt-7 flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50 px-4 py-4">
                  <Zap aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" /><div><p className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-500">Recommended applications</p><p className="mt-1 text-sm font-semibold leading-6 text-slate-800">{brand.category}</p></div>
                </div>
                <div className="mt-7 grid gap-3 sm:grid-cols-2">
                  <a href="tel:03349627745" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"><PhoneCall aria-hidden="true" className="h-4 w-4" />Call for best price<ArrowUpRight aria-hidden="true" className="ml-1 h-4 w-4" /></a>
                  <a href="#location-section" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 transition-colors hover:border-blue-300 hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"><MapPin aria-hidden="true" className="h-4 w-4" />Visit shop in DG Khan</a>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-5 border-t border-slate-200 bg-white px-6 py-6 sm:grid-cols-3 sm:gap-6 sm:px-8">
            {[
              { icon: ShieldCheck, title: 'Manufacturer warranty', text: 'Genuine products with warranty support.' },
              { icon: BatteryCharging, title: 'In-shop load testing', text: 'Get help choosing the right battery.' },
              { icon: Zap, title: 'Old battery trade-in', text: 'Exchange your old battery for a discount.' },
            ].map(({ icon: Icon, title, text }) => <div key={title} className="flex items-start gap-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600"><Icon aria-hidden="true" className="h-5 w-5" strokeWidth={1.7} /></span><div><p className="text-sm font-bold text-slate-900">{title}</p><p className="mt-1 text-xs leading-5 text-slate-500">{text}</p></div></div>)}
          </div>
        </div>
      </div>
    </section>
  );
}
