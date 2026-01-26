'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Swiper, SwiperSlide } from 'swiper/react';
import {
  Navigation,
  Pagination,
  Autoplay,
  EffectFade,
  A11y,
} from 'swiper/modules';
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
    <div
      className='relative h-full w-full'
      role='region'
      aria-label='Hero slider showcasing battery products and services'
    >
      <Swiper
        modules={[Navigation, Pagination, Autoplay, EffectFade, A11y]}
        spaceBetween={0}
        slidesPerView={1}
        navigation={false}
        pagination={{
          clickable: true,
          bulletElement: 'button',
          bulletClass: 'swiper-pagination-bullet',
          bulletActiveClass: 'swiper-pagination-bullet-active',
        }}
        autoplay={{ delay: 5000, disableOnInteraction: false }}
        loop={true}
        effect='fade'
        fadeEffect={{ crossFade: true }}
        speed={1500}
        onSwiper={setSwiperInstance}
        className='h-full w-full'
        a11y={{
          enabled: true,
          prevSlideMessage: 'Previous slide',
          nextSlideMessage: 'Next slide',
          firstSlideMessage: 'This is the first slide',
          lastSlideMessage: 'This is the last slide',
          paginationBulletMessage: 'Go to slide {{index}}',
          notificationClass: 'swiper-notification',
        }}
      >
        {slides.map((slide) => (
          <SwiperSlide key={slide.id}>
            <div className='relative h-full w-full'>
              <Image
                src={slide.image}
                alt={slide.title}
                fill
                className='object-cover'
                priority
                sizes='100vw'
              />
              <div className='absolute inset-0 bg-black/35' />

              {/* Content */}
              <div className='absolute left-1/2 top-1/2 w-full max-w-4xl -translate-x-1/2 -translate-y-1/2 transform px-4 text-center sm:px-6 md:px-12 md:text-left lg:px-20'>
                <p className='mb-4 text-xs font-bold uppercase tracking-widest text-white sm:mb-6 sm:text-sm md:text-base'>
                  FACTS IN NUMBERS
                </p>
                <h1 className='mb-4 text-3xl font-black leading-tight text-white sm:mb-6 sm:text-4xl md:text-5xl lg:text-6xl'>
                  {slide.title}
                </h1>
                <h2 className='mb-4 text-xl font-semibold text-white sm:mb-6 sm:text-2xl md:text-3xl'>
                  {slide.subtitle}
                </h2>
                <p className='mx-auto mb-6 max-w-3xl text-sm leading-relaxed text-white sm:mb-8 sm:text-base md:mx-0 md:text-lg lg:text-xl'>
                  {slide.description}
                </p>
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>

      {/* Navigation Buttons */}
      <div
        className='absolute right-2 top-1/2 z-20 flex -translate-y-1/2 flex-col gap-2 sm:gap-4 lg:right-4'
        role='group'
        aria-label='Slider navigation'
      >
        <button
          onClick={() => swiperInstance?.slidePrev()}
          onKeyDown={(e) => {
            if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
              e.preventDefault();
              swiperInstance?.slidePrev();
            }
          }}
          className='flex h-10 w-10 items-center justify-center rounded-full border border-white/30 bg-white/20 text-white backdrop-blur-md transition-all hover:bg-white/30 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-transparent sm:h-14 sm:w-14'
          aria-label='Previous slide'
          title='Previous slide'
          type='button'
        >
          <span className='sr-only'>Previous slide</span>
          <svg
            xmlns='http://www.w3.org/2000/svg'
            fill='none'
            viewBox='0 0 24 24'
            strokeWidth={2.5}
            stroke='currentColor'
            className='h-5 w-5 sm:h-7 sm:w-7'
            aria-hidden='true'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              d='M15.75 19.5L8.25 12l7.5-7.5'
            />
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
          className='flex h-10 w-10 items-center justify-center rounded-full border border-white/30 bg-white/20 text-white backdrop-blur-md transition-all hover:bg-white/30 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-transparent sm:h-14 sm:w-14'
          aria-label='Next slide'
          title='Next slide'
          type='button'
        >
          <span className='sr-only'>Next slide</span>
          <svg
            xmlns='http://www.w3.org/2000/svg'
            fill='none'
            viewBox='0 0 24 24'
            strokeWidth={2.5}
            stroke='currentColor'
            className='h-5 w-5 sm:h-7 sm:w-7'
            aria-hidden='true'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              d='m8.25 4.5 7.5 7.5-7.5 7.5'
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
