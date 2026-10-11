'use client';

import React, { useId } from 'react';
import {
  ShieldCheck,
  CircleDollarSign,
  Wrench,
  Headphones,
  Award,
  Truck,
  ArrowUpRight,
  ArrowRight,
  CheckCircle2,
  PhoneCall,
} from 'lucide-react';

const features = [
  {
    title: 'Genuine Batteries',
    description:
      '100% genuine batteries. Authorized Dealer of Fujika & Exide, plus Osaka, AGS, Phoenix, Daewoo, Volta, Alaska, Power Plus & Bridge Power with official warranty.',
    icon: ShieldCheck,
    stats: '100% Original',
  },
  {
    title: 'Best Market Rates',
    description:
      'Competitive pricing with special discounts for bulk orders and regular customers. Get value for your money.',
    icon: CircleDollarSign,
    stats: 'Best Prices',
  },
  {
    title: 'Expert Installation',
    description:
      'Professional battery installation by certified technicians. Free testing and maintenance service included.',
    icon: Wrench,
    stats: 'Free Service',
  },
  {
    title: '24/7 Support',
    description:
      'Round-the-clock customer support for all your battery needs. Emergency services available.',
    icon: Headphones,
    stats: 'Always Available',
  },
  {
    title: 'Warranty Coverage',
    description:
      'Comprehensive warranty on all products. Hassle-free replacement and support throughout warranty period.',
    icon: Award,
    stats: '1–3 Years',
  },
  {
    title: 'Fast Delivery',
    description:
      'Quick delivery across Dera Ghazi Khan. Same-day delivery available for urgent orders within city limits.',
    icon: Truck,
    stats: 'Same Day',
  },
];

export default function FeaturesSection() {
  const headingId = useId();

  return (
    <section
      aria-labelledby={headingId}
      className="relative isolate overflow-hidden bg-white py-16 sm:py-24 lg:py-28"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent"
      />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Editorial section header */}
        <header className="mb-10 grid gap-6 lg:mb-14 lg:grid-cols-[1.15fr_1fr] lg:items-end lg:gap-20">
          <div>
            <div className="mb-5 flex items-center gap-3">
              <span
                aria-hidden="true"
                className="h-px w-8 bg-blue-600"
              />
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-blue-700">
                Why choose us
              </span>
            </div>

            <h2
              id={headingId}
              className="text-4xl font-extrabold leading-[1.08] tracking-[-0.045em] text-slate-900 sm:text-5xl lg:text-6xl"
            >
              More than batteries.
              <br />
              <span className="text-blue-600">Confidence, delivered.</span>
            </h2>
          </div>

          <div className="max-w-lg lg:pb-1">
            <p className="text-base leading-7 text-slate-600">
              Your local battery specialist in Dera Ghazi Khan.
              Genuine products, competitive prices, and expert care —
              from choosing your battery to keeping it running.
            </p>

            <a
              href="#location-section"
              className="mt-5 inline-flex items-center gap-2 rounded-md text-sm font-bold text-blue-700 transition-colors hover:text-blue-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-4"
            >
              Meet your local specialists
              <ArrowUpRight aria-hidden="true" className="h-4 w-4" />
            </a>
          </div>
        </header>

        {/* Asymmetric service layout */}
        <div className="grid gap-5 lg:grid-cols-3 lg:gap-6">
          {/* Featured trust panel */}
          <article className="relative isolate flex min-w-0 flex-col overflow-hidden rounded-[24px] bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-700 p-6 text-white sm:rounded-[28px] sm:p-8 lg:row-span-2 lg:p-9">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full border-[45px] border-white/[0.05]"
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -bottom-32 -left-20 h-80 w-80 rounded-full border border-white/10"
            />

            <div className="relative flex items-center justify-between gap-4">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-blue-50">
                <ShieldCheck
                  aria-hidden="true"
                  className="h-3.5 w-3.5"
                />
                Genuine products
              </span>

              <span
                aria-hidden="true"
                className="text-xs font-medium text-blue-200"
              >
                01
              </span>
            </div>

            <div className="relative mt-10 lg:mt-14">
              <div
                aria-hidden="true"
                className="mb-7 flex h-16 w-16 items-center justify-center rounded-2xl border border-white/20 bg-white/10"
              >
                <ShieldCheck
                  className="h-8 w-8"
                  strokeWidth={1.5}
                />
              </div>

              <p className="text-[clamp(3.5rem,6vw,5rem)] font-extrabold leading-none tracking-[-0.06em]">
                100<span className="text-blue-200">%</span>
              </p>

              <h3 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">
                Genuine batteries.
                <br />
                Complete peace of mind.
              </h3>

              <p className="mt-5 text-sm leading-7 text-blue-100">
                {features[0].description}
              </p>
            </div>

            <div className="relative mt-8 border-t border-white/20 pt-6 lg:mt-auto lg:pt-7">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-blue-200">
                Authorized dealership
              </p>

              <div className="mt-3 flex flex-wrap items-center gap-3">
                {['Fujika', 'Exide'].map((brand) => (
                  <span
                    key={brand}
                    className="inline-flex items-center gap-2 rounded-lg border border-amber-200/30 bg-amber-200/10 px-3 py-2 text-sm font-bold text-amber-100"
                  >
                    <Award
                      aria-hidden="true"
                      className="h-4 w-4"
                    />
                    {brand}
                  </span>
                ))}
              </div>
            </div>
          </article>

          {/* Four compact service cards */}
          {features.slice(1, 5).map((feature, index) => {
            const Icon = feature.icon;

            return (
              <article
                key={feature.title}
                className="group relative min-w-0 overflow-hidden rounded-[24px] border border-slate-200 bg-[#f8faff] p-6 transition-colors duration-200 hover:border-blue-300 hover:bg-blue-50/60 motion-reduce:transition-none sm:p-7"
              >
                <div className="flex items-start justify-between gap-4">
                  <div
                    aria-hidden="true"
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-blue-100 bg-white text-blue-600"
                  >
                    <Icon
                      className="h-6 w-6"
                      strokeWidth={1.7}
                    />
                  </div>

                  <span
                    aria-hidden="true"
                    className="text-xs font-medium tabular-nums text-slate-400"
                  >
                    {String(index + 2).padStart(2, '0')}
                  </span>
                </div>

                <h3 className="mt-6 text-xl font-bold tracking-tight text-slate-900">
                  {feature.title}
                </h3>

                <p className="mt-3 text-sm leading-6 text-slate-600">
                  {feature.description}
                </p>

                <div className="mt-6 flex items-center gap-2 border-t border-slate-200/80 pt-4">
                  <CheckCircle2
                    aria-hidden="true"
                    className="h-4 w-4 shrink-0 text-blue-600"
                  />
                  <span className="text-xs font-bold text-blue-700">
                    {feature.stats}
                  </span>
                </div>
              </article>
            );
          })}

          {/* Full-width delivery and action strip */}
          <article className="relative min-w-0 overflow-hidden rounded-[24px] border border-slate-200 bg-white lg:col-span-3">
            <div className="grid lg:grid-cols-[1.2fr_1fr]">
              <div className="flex items-start gap-4 p-6 sm:gap-5 sm:p-8">
                <div
                  aria-hidden="true"
                  className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600"
                >
                  <Truck className="h-7 w-7" strokeWidth={1.6} />
                </div>

                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                    <h3 className="text-xl font-bold tracking-tight text-slate-900">
                      {features[5].title}
                    </h3>

                    <span className="rounded-full border border-blue-100 bg-blue-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-blue-700">
                      {features[5].stats}
                    </span>
                  </div>

                  <p className="mt-2 max-w-xl text-sm leading-6 text-slate-600">
                    {features[5].description}
                  </p>
                </div>
              </div>

              <div className="flex flex-col justify-center gap-3 border-t border-slate-200 bg-slate-50/70 p-6 sm:flex-row sm:items-center sm:p-8 lg:border-l lg:border-t-0">
                <a
                  href="#brands-section"
                  className="group inline-flex min-h-12 items-center justify-center gap-3 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
                >
                  Explore our brands
                  <ArrowRight
                    aria-hidden="true"
                    className="h-4 w-4 transition-transform group-hover:translate-x-1 motion-reduce:transform-none"
                  />
                </a>

                <a
                  href="tel:03349627745"
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition-colors hover:border-blue-300 hover:text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
                >
                  <PhoneCall
                    aria-hidden="true"
                    className="h-4 w-4"
                  />
                  Talk to an expert
                </a>
              </div>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}