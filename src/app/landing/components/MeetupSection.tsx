'use client';

import { useState, useEffect } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay } from 'swiper/modules';
import Image from 'next/image';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

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
      <div className="py-20 text-center bg-gray-50">
        <div className="animate-pulse text-gray-400">Loading Community Meetups...</div>
      </div>
    );
  }

  // If no images are returned from API, you can hide the section or show a message
  if (meetups.length === 0) return null;

  return (
 <div className="bg-gray-50 w-full">
    <section className="py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center mb-20">
          <p className="text-blue-600 font-semibold text-sm tracking-widest uppercase mb-4">
            Community Engagement
          </p>
          <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
            COMMUNITY MEETUPS
          </h2>
          <p className="text-lg lg:text-xl text-gray-600 max-w-3xl mx-auto">
            Join our community events and connect with fellow customers. 
            Monthly meetups with appreciation certificates and expert sessions.
          </p>
        </div>


          {/* Meetup Swiper */}
          <div className="relative">
            <Swiper
              modules={[Navigation, Pagination, Autoplay]}
              spaceBetween={30}
              slidesPerView={1}
              autoplay={{
                delay: 5000,
                disableOnInteraction: false,
              }}
              pagination={{
                clickable: true,
                dynamicBullets: true,
              }}
              navigation={{
                nextEl: '.swiper-button-next',
                prevEl: '.swiper-button-prev',
              }}
              breakpoints={{
                640: { slidesPerView: 2 },
                1024: { slidesPerView: 3 },
              }}
              className="meetup-swiper"
            >
              {meetups.map((meetup, index) => (
                <SwiperSlide key={meetup.id || index}>
                  <div className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300 group mt-12">
                    {/* Image */}
                    <div className="relative h-64 overflow-hidden cursor-pointer" onClick={() => setSelectedImage(meetup.url)}>
                      <Image
                        src={meetup.url}
                        alt={meetup.title || "Community Meetup"}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                      
                      {/* Date Badge */}
                      {meetup.date && (
                        <div className="absolute top-4 left-4">
                          <span className="px-3 py-1 bg-blue-600 text-white text-xs font-semibold rounded-full">
                            {meetup.date}
                          </span>
                        </div>
                      )}
                      
                      {/* Click indicator */}
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <div className="bg-white/90 rounded-full p-3">
                          <svg className="w-6 h-6 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
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
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-6xl max-h-full">
            <img
              src={selectedImage}
              alt="Meetup Image Preview"
              className="max-w-full max-h-[90vh] object-contain rounded-lg"
            />
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-4 right-4 bg-white/90 hover:bg-white text-gray-800 rounded-full p-2 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}