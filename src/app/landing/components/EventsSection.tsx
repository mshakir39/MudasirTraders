'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

export default function EventsSection() {
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchImages = async () => {
      try {
        const response = await fetch('/api/meetups/upload');
        const data = await response.json();
        setImages(data.images || []);
      } catch (error) {
        console.error('Error fetching meetup images:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchImages();
  }, []);

  if (loading) {
    return (
      <section className='bg-white py-20'>
        <div className='mx-auto max-w-7xl px-4 sm:px-6 lg:px-8'>
          <div className='mb-16 text-center'>
            <h2 className='mb-4 text-4xl font-bold text-gray-900'>
              Latest Events & Gallery
            </h2>
          </div>
          <div className='grid grid-cols-1 gap-8 md:grid-cols-3'>
            {[1, 2, 3].map((i) => (
              <div key={i} className='animate-pulse'>
                <div className='mb-4 h-48 rounded-lg bg-gray-200'></div>
                <div className='mb-2 h-4 w-3/4 rounded bg-gray-200'></div>
                <div className='h-4 w-1/2 rounded bg-gray-200'></div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className='bg-white py-20'>
      <div className='mx-auto max-w-7xl px-4 sm:px-6 lg:px-8'>
        <div className='mb-16 text-center'>
          <h2 className='mb-4 text-4xl font-bold text-gray-900'>
            Latest Events & Gallery
          </h2>
          <p className='mx-auto max-w-2xl text-xl text-gray-600'>
            Check out our recent events and activities
          </p>
        </div>

        {images.length > 0 ? (
          <div className='grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3'>
            {images.map((image, index) => (
              <div
                key={index}
                className='relative h-64 overflow-hidden rounded-lg shadow-lg transition-shadow hover:shadow-xl'
              >
                <Image
                  src={image}
                  alt={`Event ${index + 1}`}
                  fill
                  className='object-cover'
                  sizes='(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw'
                />
              </div>
            ))}
          </div>
        ) : (
          <div className='py-12 text-center'>
            <div className='mb-4 text-6xl text-gray-400'>📸</div>
            <p className='text-lg text-gray-600'>No images available yet</p>
            <p className='mt-2 text-gray-500'>
              Check back soon for our latest events!
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
