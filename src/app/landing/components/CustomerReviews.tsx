'use client';

import React, { useState, useEffect } from 'react';
import { FaStar, FaQuoteLeft, FaPlus } from 'react-icons/fa';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Autoplay } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/autoplay';
import ReviewForm from './ReviewForm';

interface CustomerReview {
  id?: string;
  author_name: string;
  rating: number;
  text: string;
  createdAt: string;
  approved?: boolean;
}

interface CustomerReviewsProps {
  showAddReviewButton?: boolean;
  maxReviews?: number;
}

const CustomerReviews: React.FC<CustomerReviewsProps> = ({
  showAddReviewButton = true,
  maxReviews = 10,
}) => {
  const [reviews, setReviews] = useState<CustomerReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showReviewForm, setShowReviewForm] = useState(false);
  useEffect(() => {
    const updateScreenWidth = () => {
      if (typeof document !== 'undefined') {
        const widthElement = document.getElementById('screen-width');
        if (widthElement) {
          widthElement.textContent = window.innerWidth.toString();
        }
      }
    };

    updateScreenWidth();
    window.addEventListener('resize', updateScreenWidth);
    return () => window.removeEventListener('resize', updateScreenWidth);
  }, []);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const response = await fetch('/api/reviews');

        if (!response.ok) {
          throw new Error('Failed to fetch reviews');
        }

        const data = await response.json();

        if (data.reviews && Array.isArray(data.reviews)) {
          const approvedReviews = data.reviews
            .filter((review: CustomerReview) => review.approved !== false)
            .slice(0, maxReviews);
          setReviews(approvedReviews);
        } else {
          setReviews([]);
        }
      } catch (err) {
        console.error('Error fetching reviews:', err);
        setError('Unable to load reviews at this time');
        setReviews([]);
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, [maxReviews]);

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <FaStar
        key={i}
        className={`h-4 w-4 ${
          i < rating ? 'fill-current text-yellow-400' : 'text-gray-300'
        }`}
      />
    ));
  };

  if (loading) {
    return (
      <section className='bg-gray-50 py-16'>
        <div className='mx-auto max-w-7xl px-4 sm:px-6 lg:px-8'>
          <div className='mb-12 text-center'>
            <h2 className='mb-4 text-3xl font-bold text-gray-900'>
              What Our Customers Say
            </h2>
            <p className='text-lg text-gray-600'>Loading customer reviews...</p>
          </div>
          <div className='grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3'>
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className='animate-pulse rounded-lg bg-white p-6 shadow-md'
              >
                <div className='mb-4 h-4 w-3/4 rounded bg-gray-200'></div>
                <div className='mb-4 h-4 w-1/2 rounded bg-gray-200'></div>
                <div className='mb-4 h-16 rounded bg-gray-200'></div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (error && reviews.length === 0) {
    return (
      <section className='bg-gray-50 py-16'>
        <div className='mx-auto max-w-7xl px-4 sm:px-6 lg:px-8'>
          <div className='mb-12 text-center'>
            <h2 className='mb-4 text-3xl font-bold text-gray-900'>
              What Our Customers Say
            </h2>
            <p className='text-lg text-gray-600'>
              Unable to load reviews at this time. Please check back later.
            </p>
          </div>
        </div>
      </section>
    );
  }

  const averageRating =
    reviews.length > 0
      ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
      : 0;

  return (
    <section className='bg-gray-50 py-16' id='reviews-section'>
      <div className='mx-auto max-w-7xl px-4 sm:px-6 lg:px-8'>
        {/* Header */}
        <div className='mb-12 text-center'>
          <h2 className='mb-4 text-3xl font-bold text-gray-900'>
            What Our Customers Say
          </h2>
          <p className='mb-6 text-lg text-gray-600'>
            Real reviews from our satisfied customers
          </p>

          {reviews.length > 0 && (
            <div className='inline-flex items-center rounded-lg bg-white px-6 py-3 shadow-sm'>
              <div className='mr-4 flex items-center'>
                {renderStars(Math.round(averageRating))}
              </div>
              <div className='text-left'>
                <div className='text-2xl font-bold text-gray-900'>
                  {averageRating.toFixed(1)}
                </div>
                <div className='text-sm text-gray-600'>
                  Based on {reviews.length} review
                  {reviews.length !== 1 ? 's' : ''}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Reviews Swiper */}
        {reviews.length > 0 ? (
          <>
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
                480: { slidesPerView: 1 },
                640: { slidesPerView: 2 },
                768: { slidesPerView: 2 },
                1024: { slidesPerView: 3 },
                1280: { slidesPerView: 3 },
              }}
              className='reviews-swiper'
            >
              {reviews.map((review, index) => (
                <SwiperSlide key={review.id || index}>
                  <div className='h-full rounded-lg bg-white p-6 shadow-md transition-shadow duration-300 hover:shadow-lg'>
                    <FaQuoteLeft className='mb-4 h-8 w-8 text-blue-500 opacity-50' />

                    <div className='mb-4 flex items-center'>
                      {renderStars(review.rating)}
                      <span className='ml-2 text-sm text-gray-600'>
                        {review.rating}/5
                      </span>
                    </div>

                    <div className='group relative'>
                      <p
                        className='mb-4 overflow-hidden leading-relaxed text-gray-700'
                        style={{
                          display: '-webkit-box',
                          WebkitLineClamp: 4,
                          WebkitBoxOrient: 'vertical',
                        }}
                        title={review.text}
                      >
                        &ldquo;{review.text}&rdquo;
                      </p>
                    </div>

                    <div className='flex items-center justify-between'>
                      <div className='flex items-center'>
                        <div className='mr-3 flex h-10 w-10 items-center justify-center rounded-full bg-blue-500'>
                          <span className='text-sm font-semibold text-white'>
                            {review.author_name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <div className='font-semibold text-gray-900'>
                            {review.author_name}
                          </div>
                          <div className='text-sm text-gray-500'>
                            {new Date(review.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>
          </>
        ) : (
          <div className='py-12 text-center'>
            <div className='mb-4'>
              <FaQuoteLeft className='mx-auto h-16 w-16 text-gray-300' />
            </div>
            <h3 className='mb-2 text-xl font-medium text-gray-900'>
              No reviews yet
            </h3>
            <p className='mb-6 text-gray-600'>
              Be the first to share your experience with us!
            </p>
          </div>
        )}

        {/* Add Review Button */}
        {showAddReviewButton && (
          <div className='mt-12 text-center'>
            <button
              onClick={() => setShowReviewForm(true)}
              className='inline-flex items-center rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white transition-colors duration-200 hover:bg-blue-700'
            >
              <FaPlus className='mr-2 h-4 w-4' />
              Write a Review
            </button>
          </div>
        )}
      </div>

      {/* Review Form Modal */}
      {showReviewForm && (
        <ReviewForm
          onClose={() => setShowReviewForm(false)}
          onSubmitSuccess={() => {
            setShowReviewForm(false);
            window.location.reload();
          }}
        />
      )}
    </section>
  );
};

export default CustomerReviews;
