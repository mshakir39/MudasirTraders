'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay, EffectFade, A11y } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import 'swiper/css/effect-fade';
import './HeroSlider.css';

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
  const [swiperInstance, setSwiperInstance] = useState<any>(null);

  return (
    <div className="relative h-full w-full" role="region" aria-label="Hero slider showcasing battery products and services">
      <Swiper
        modules={[Navigation, Pagination, Autoplay, EffectFade, A11y]}
        spaceBetween={0}
        slidesPerView={1}
        navigation={false}
        pagination={{ 
          clickable: true,
          bulletElement: 'button',
          bulletClass: 'swiper-pagination-bullet',
          bulletActiveClass: 'swiper-pagination-bullet-active'
        }}
        autoplay={{ delay: 5000, disableOnInteraction: false }}
        loop={true}
        effect="fade"
        fadeEffect={{ crossFade: true }}
        speed={1500}
        onSwiper={setSwiperInstance}
        className="h-full w-full"
        a11y={{
          enabled: true,
          prevSlideMessage: 'Previous slide',
          nextSlideMessage: 'Next slide',
          firstSlideMessage: 'This is the first slide',
          lastSlideMessage: 'This is the last slide',
          paginationBulletMessage: 'Go to slide {{index}}',
          notificationClass: 'swiper-notification'
        }}
      >
        {slides.map((slide) => (
          <SwiperSlide key={slide.id}>
            <div className="relative h-full w-full">
              <Image
                src={slide.image}
                alt={slide.title}
                fill
                className="object-cover"
                priority
                sizes="100vw"
              />
              <div className="absolute inset-0 bg-black/35" />

              {/* Content */}
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 px-4 sm:px-6 md:px-12 lg:px-20 w-full max-w-4xl text-center md:text-left">
                <p className="text-white text-xs sm:text-sm md:text-base font-bold tracking-widest mb-4 sm:mb-6 uppercase">
                  FACTS IN NUMBERS
                </p>
                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black mb-4 sm:mb-6 leading-tight text-white">
                  {slide.title}
                </h1>
                <h2 className="text-xl sm:text-2xl md:text-3xl font-semibold mb-4 sm:mb-6 text-white">
                  {slide.subtitle}
                </h2>
                <p className="text-sm sm:text-base md:text-lg lg:text-xl text-white mb-6 sm:mb-8 leading-relaxed max-w-3xl mx-auto md:mx-0">
                  {slide.description}
                </p>
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>

      {/* Navigation Buttons */}
      <div className="absolute right-2 lg:right-4 top-1/2 -translate-y-1/2 flex flex-col gap-2 sm:gap-4 z-20" role="group" aria-label="Slider navigation">
        <button
          onClick={() => swiperInstance?.slidePrev()}
          onKeyDown={(e) => {
            if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
              e.preventDefault();
              swiperInstance?.slidePrev();
            }
          }}
          className="w-10 h-10 sm:w-14 sm:h-14 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-all border border-white/30 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-transparent"
          aria-label="Previous slide"
          title="Previous slide"
          type="button"
        >
          <span className="sr-only">Previous slide</span>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5 sm:w-7 sm:h-7" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </button>
        <button
          onClick={() => swiperInstance?.slideNext()}
          onKeyDown={(e) => {
            if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
              e.preventDefault();
              swiperInstance?.slideNext();
            }
          }}
          className="w-10 h-10 sm:w-14 sm:h-14 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-all border border-white/30 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-transparent"
          aria-label="Next slide"
          title="Next slide"
          type="button"
        >
          <span className="sr-only">Next slide</span>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5 sm:w-7 sm:h-7" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
          </svg>
        </button>
      </div>
    </div>
  );
}
