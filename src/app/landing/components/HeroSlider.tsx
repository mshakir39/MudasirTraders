'use client';

import { useEffect, useId, useRef, useState } from 'react';
import Image from 'next/image';
import { Swiper, SwiperSlide } from 'swiper/react';
import type { Swiper as SwiperInstance } from 'swiper';
import { Autoplay, EffectFade, A11y } from 'swiper/modules';
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  PhoneCall,
  Pause,
  Play,
  ShieldCheck,
  MapPin,
} from 'lucide-react';

import 'swiper/css';
import 'swiper/css/effect-fade';

interface Slide {
  id: number;
  image: string;
  title: string;
  subtitle: string;
  description: string;
}

interface HeroSliderProps {
  slides: Slide[];
}

export default function HeroSlider({ slides }: HeroSliderProps) {
  const id = useId();
  const swiperRef = useRef<SwiperInstance | null>(null);

  const [activeIndex, setActiveIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(true);
  const [focusWithin, setFocusWithin] = useState(false);
  const [hovered, setHovered] = useState(false);

  const hasMultipleSlides = slides.length > 1;

  const shouldAutoplay =
    hasMultipleSlides &&
    !paused &&
    !reducedMotion &&
    !focusWithin &&
    !hovered;

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReducedMotion(query.matches);

    update();
    query.addEventListener('change', update);

    return () => query.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    const swiper = swiperRef.current;

    if (!swiper || swiper.destroyed) return;

    if (shouldAutoplay) {
      swiper.autoplay?.start();
    } else {
      swiper.autoplay?.stop();
    }
  }, [shouldAutoplay]);

  if (!slides.length) return null;

  const currentIndex = Math.min(activeIndex, slides.length - 1);

  return (
    <div
      role="region"
      aria-roledescription="carousel"
      aria-label="Battery products and services"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocusCapture={() => setFocusWithin(true)}
      onBlurCapture={(event) => {
        if (
          !event.currentTarget.contains(
            event.relatedTarget as Node | null,
          )
        ) {
          setFocusWithin(false);
        }
      }}
      className="relative isolate h-full min-h-[680px] w-full bg-slate-950 text-white sm:min-h-[700px] lg:min-h-[740px]"
    >
      <Swiper
        modules={[Autoplay, EffectFade, A11y]}
        onSwiper={(instance) => {
          swiperRef.current = instance;
          if (!shouldAutoplay) instance.autoplay?.stop();
        }}
        onSlideChange={(instance) => {
          setActiveIndex(instance.realIndex);
        }}
        slidesPerView={1}
        spaceBetween={0}
        loop={hasMultipleSlides}
        allowTouchMove={hasMultipleSlides}
        preventClicks
        preventClicksPropagation
        effect="fade"
        fadeEffect={{ crossFade: true }}
        speed={reducedMotion ? 0 : 850}
        autoplay={
          hasMultipleSlides && !reducedMotion
            ? {
                delay: 6000,
                disableOnInteraction: false,
                pauseOnMouseEnter: true,
              }
            : false
        }
        a11y={{
          enabled: true,
          slideLabelMessage: 'Slide {{index}} of {{slidesLength}}',
        }}
        className="absolute inset-0 !h-full !w-full"
      >
        {slides.map((slide, index) => {
          const active = index === currentIndex;

          return (
            <SwiperSlide key={slide.id}>
              <div
                aria-hidden={!active}
                className="relative flex h-full min-h-[680px] items-center pb-32 pt-14 sm:min-h-[700px] sm:pb-32 sm:pt-20 lg:min-h-[740px]"
              >
                <Image
                  src={slide.image}
                  alt={slide.title}
                  fill
                  priority={index === 0}
                  sizes="100vw"
                  className="object-cover"
                />

                {/* One lighter overlay instead of three stacked overlays */}
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 bg-gradient-to-r from-slate-950/60 via-slate-950/25 to-transparent"
                />

                <div className="relative mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
                  <div className="max-w-3xl">
                    <div className="mb-6 flex flex-wrap items-center gap-3 sm:mb-8">
                      <span
                        aria-hidden="true"
                        className="h-px w-8 bg-blue-400"
                      />

                      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-200 sm:text-xs">
                        Mudasir Traders
                      </p>

                      <span
                        aria-hidden="true"
                        className="h-1 w-1 rounded-full bg-white/50"
                      />

                      <p className="text-[10px] font-medium uppercase tracking-[0.15em] text-white sm:text-xs">
                        Power solutions since 2023
                      </p>
                    </div>

                    <h1
                      id={`${id}-title-${index}`}
                      className="max-w-3xl break-words text-4xl font-extrabold leading-[1.06] tracking-[-0.045em] text-white [text-shadow:0_2px_12px_rgba(0,0,0,0.3)] sm:text-5xl md:text-6xl lg:text-7xl"
                    >
                      {slide.title}
                    </h1>

                    <p className="mt-5 max-w-2xl text-xl font-semibold leading-snug tracking-tight text-blue-100 [text-shadow:0_1px_6px_rgba(0,0,0,0.3)] sm:mt-6 sm:text-2xl lg:text-3xl">
                      {slide.subtitle}
                    </p>

                    <p className="mt-5 max-w-xl text-sm leading-7 text-white [text-shadow:0_1px_6px_rgba(0,0,0,0.4)] sm:text-base sm:leading-8">
                      {slide.description}
                    </p>

                    <div className="mt-8 flex flex-col gap-3 min-[400px]:flex-row sm:mt-9">
                      <a
                        href="#brands-section"
                        tabIndex={active ? 0 : -1}
                        className="inline-flex min-h-12 items-center justify-center gap-3 rounded-xl bg-blue-600 px-6 py-3.5 text-sm font-bold text-white transition-colors hover:bg-blue-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 focus-visible:ring-offset-4 focus-visible:ring-offset-slate-950"
                      >
                        Explore batteries
                        <ArrowUpRight
                          aria-hidden="true"
                          className="h-4 w-4"
                        />
                      </a>

                      <a
                        href="tel:+923349627745"
                        tabIndex={active ? 0 : -1}
                        className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-white/40 bg-slate-950/20 px-6 py-3.5 text-sm font-bold text-white backdrop-blur-sm transition-colors hover:bg-slate-950/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-4 focus-visible:ring-offset-slate-950"
                      >
                        <PhoneCall
                          aria-hidden="true"
                          className="h-4 w-4"
                        />
                        Talk to an expert
                      </a>
                    </div>

                    <div className="mt-7 flex flex-wrap gap-x-6 gap-y-3 text-xs text-white [text-shadow:0_1px_5px_rgba(0,0,0,0.4)] sm:mt-8">
                      <span className="inline-flex items-center gap-2">
                        <ShieldCheck
                          aria-hidden="true"
                          className="h-4 w-4 text-blue-200"
                        />
                        Authorized dealer · Fujika & Exide
                      </span>

                      <span className="inline-flex items-center gap-2">
                        <MapPin
                          aria-hidden="true"
                          className="h-4 w-4 text-blue-200"
                        />
                        Dera Ghazi Khan
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </SwiperSlide>
          );
        })}
      </Swiper>

      {hasMultipleSlides && (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="pointer-events-auto flex flex-wrap items-center justify-between gap-x-5 gap-y-4 border-t border-white/30 py-5 sm:py-6">
              <div className="flex min-w-0 items-center gap-4 sm:gap-6">
                <p
                  aria-label={`Slide ${currentIndex + 1} of ${slides.length}`}
                  className="shrink-0 text-xs font-semibold tabular-nums text-white [text-shadow:0_1px_5px_rgba(0,0,0,0.5)]"
                >
                  {String(currentIndex + 1).padStart(2, '0')}
                  <span className="mx-2 text-white/60">/</span>
                  <span className="text-white/80">
                    {String(slides.length).padStart(2, '0')}
                  </span>
                </p>

                <div
                  role="group"
                  aria-label="Choose a slide"
                  className="flex max-w-[45vw] items-center gap-1 overflow-x-auto"
                >
                  {slides.map((slide, index) => (
                    <button
                      key={slide.id}
                      type="button"
                      aria-label={`Go to slide ${index + 1}: ${slide.title}`}
                      aria-current={
                        index === currentIndex ? 'true' : undefined
                      }
                      onClick={() =>
                        swiperRef.current?.slideToLoop(index)
                      }
                      className="flex h-10 w-9 shrink-0 items-center justify-center rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300"
                    >
                      <span
                        aria-hidden="true"
                        className={`h-1 rounded-full transition-all duration-300 motion-reduce:transition-none ${
                          index === currentIndex
                            ? 'w-7 bg-blue-400'
                            : 'w-3 bg-white/60'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div
                role="group"
                aria-label="Slider controls"
                className="flex items-center gap-2"
              >
                {!reducedMotion && (
                  <button
                    type="button"
                    aria-label={
                      paused
                        ? 'Enable automatic slides'
                        : 'Pause automatic slides'
                    }
                    aria-pressed={paused}
                    onClick={() => setPaused((value) => !value)}
                    className="mr-1 flex h-11 w-11 items-center justify-center rounded-full bg-slate-950/20 text-white backdrop-blur-sm transition-colors hover:bg-slate-950/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300"
                  >
                    {paused ? (
                      <Play aria-hidden="true" className="h-4 w-4" />
                    ) : (
                      <Pause aria-hidden="true" className="h-4 w-4" />
                    )}
                  </button>
                )}

                <button
                  type="button"
                  aria-label="Previous slide"
                  onClick={() => swiperRef.current?.slidePrev()}
                  className="flex h-11 w-11 items-center justify-center rounded-full border border-white/40 bg-slate-950/20 text-white backdrop-blur-sm transition-colors hover:border-blue-400 hover:bg-blue-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300"
                >
                  <ArrowLeft aria-hidden="true" className="h-4 w-4" />
                </button>

                <button
                  type="button"
                  aria-label="Next slide"
                  onClick={() => swiperRef.current?.slideNext()}
                  className="flex h-11 w-11 items-center justify-center rounded-full border border-white/40 bg-slate-950/20 text-white backdrop-blur-sm transition-colors hover:border-blue-400 hover:bg-blue-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300"
                >
                  <ArrowRight aria-hidden="true" className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}