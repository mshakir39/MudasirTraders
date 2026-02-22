'use client';

import { useState, useEffect } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Autoplay } from 'swiper/modules';
import Image from 'next/image';
import 'swiper/css';
import 'swiper/css/navigation';

export default function MeetupSection() {
  // Store the full objects from the API instead of just strings
  const [meetups, setMeetups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    const fetchImages = async () => {
      try {
        const response = await fetch('/api/meetups/upload');
        if (response.ok) {
          const data = await response.json();
          // Assuming API returns objects with url, title, date, etc.
          // If it only returns URLs, we map them to the object structure below
          setMeetups(data);
        }
      } catch (error) {
        console.error('Failed to fetch meetup images:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchImages();
  }, []);

  // Early return or conditional rendering for loading state
  if (loading) {
    return (
      <div className='bg-gray-50 py-20 text-center'>
        <div className='animate-pulse text-gray-400'>
          Loading Community Meetups...
        </div>
      </div>
    );
  }

  // If no images are returned from API, you can hide the section or show a message
  if (meetups.length === 0) return null;
  return (
    <div className='w-full bg-gray-50'>
      <section className='py-24'>
        <div className='mx-auto max-w-7xl px-4 sm:px-6 lg:px-8'>
          {/* Section Header */}
          <div className='mb-20 text-center'>
            <p className='mb-4 text-sm font-semibold uppercase tracking-widest text-blue-600'>
              Community Engagement
            </p>
            <h2 className='mb-6 text-4xl font-bold text-gray-900 lg:text-5xl'>
              COMMUNITY MEETUPS
            </h2>
            <p className='mx-auto max-w-3xl text-lg text-gray-600 lg:text-xl'>
              Join our community events and connect with fellow customers.
              Monthly meetups with appreciation certificates and expert
              sessions.
            </p>
          </div>

          {/* Meetup Swiper */}
          <div className='relative'>
            <Swiper
              modules={[Navigation, Autoplay]}
              spaceBetween={30}
              slidesPerView={1}
              speed={2500}
              autoplay={{
                delay: 5000,
                disableOnInteraction: false,
              }}
              breakpoints={{
                640: { slidesPerView: 2 },
                1024: { slidesPerView: 3 },
              }}
              className='meetup-swiper'
            >
              {meetups.map((meetup, index) => (
                <SwiperSlide key={meetup.id || index}>
                  <div className='group mt-12 overflow-hidden rounded-2xl bg-white shadow-lg transition-shadow duration-300 hover:shadow-xl'>
                    {/* Image */}
                    <div
                      className='relative h-80 w-full cursor-pointer overflow-hidden'
                      onClick={() => setSelectedImage(meetup.url)}
                    >
                      <Image
                        src={meetup.url}
                        alt={meetup.title || 'Community Meetup'}
                        fill={true}
                        sizes='(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw'
                        className={`transition-transform duration-300 group-hover:scale-105 ${
                          meetup.position === 'contain'
                            ? 'object-contain'
                            : 'object-cover'
                        }`}
                        style={{
                          objectPosition:
                            meetup.position && meetup.position !== 'contain'
                              ? meetup.position === 'custom' &&
                                meetup.customPosition
                                ? `${meetup.customPosition.x}% ${meetup.customPosition.y}%`
                                : meetup.position === 'top'
                                  ? 'center top'
                                  : meetup.position === 'bottom'
                                    ? 'center bottom'
                                    : 'center'
                              : 'center',
                        }}
                      />
                      <div className='absolute inset-0 bg-gradient-to-t from-black/50 to-transparent'></div>

                      {/* Date Badge */}
                      {meetup.date && (
                        <div className='absolute left-4 top-4'>
                          <span className='rounded-full bg-blue-600 px-3 py-1 text-xs font-semibold text-white'>
                            {meetup.date}
                          </span>
                        </div>
                      )}

                      {/* Click indicator */}
                      <div className='absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-300 group-hover:opacity-100'>
                        <div className='rounded-full bg-white/90 p-3'>
                          <svg
                            className='h-6 w-6 text-gray-800'
                            fill='none'
                            stroke='currentColor'
                            viewBox='0 0 24 24'
                          >
                            <path
                              strokeLinecap='round'
                              strokeLinejoin='round'
                              strokeWidth={2}
                              d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7'
                            />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>
          </div>
        </div>
      </section>

      {/* Image Preview Modal */}
      {selectedImage && (
        <div
          className='fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4'
          onClick={() => setSelectedImage(null)}
        >
          <div className='relative max-h-full max-w-6xl'>
            <Image
              src={selectedImage}
              alt='Meetup Image Preview'
              width={1200}
              height={800}
              className='max-h-[90vh] max-w-full rounded-lg object-contain'
              style={{ objectFit: 'contain' }}
            />
            <button
              onClick={() => setSelectedImage(null)}
              className='absolute right-4 top-4 rounded-full bg-white/90 p-2 text-gray-800 transition-colors hover:bg-white'
            >
              <svg
                className='h-6 w-6'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M6 18L18 6M6 6l12 12'
                />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
