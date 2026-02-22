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
          i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
        }`}
      />
    ));
  };

  if (loading) {
    return (
      <section className='py-16 bg-gray-50'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='text-center mb-12'>
            <h2 className='text-3xl font-bold text-gray-900 mb-4'>
              What Our Customers Say
            </h2>
            <p className='text-lg text-gray-600'>
              Loading customer reviews...
            </p>
          </div>
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8'>
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className='bg-white p-6 rounded-lg shadow-md animate-pulse'>
                <div className='h-4 bg-gray-200 rounded w-3/4 mb-4'></div>
                <div className='h-4 bg-gray-200 rounded w-1/2 mb-4'></div>
                <div className='h-16 bg-gray-200 rounded mb-4'></div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (error && reviews.length === 0) {
    return (
      <section className='py-16 bg-gray-50'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='text-center mb-12'>
            <h2 className='text-3xl font-bold text-gray-900 mb-4'>
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

  const averageRating = reviews.length > 0
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
    : 0;

  return (
    <section className='py-16 bg-gray-50' id='reviews-section'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        {/* Header */}
        <div className='text-center mb-12'>
          <h2 className='text-3xl font-bold text-gray-900 mb-4'>
            What Our Customers Say
          </h2>
          <p className='text-lg text-gray-600 mb-6'>
            Real reviews from our satisfied customers
          </p>

          {reviews.length > 0 && (
            <div className='inline-flex items-center bg-white px-6 py-3 rounded-lg shadow-sm'>
              <div className='flex items-center mr-4'>
                {renderStars(Math.round(averageRating))}
              </div>
              <div className='text-left'>
                <div className='text-2xl font-bold text-gray-900'>
                  {averageRating.toFixed(1)}
                </div>
                <div className='text-sm text-gray-600'>
                  Based on {reviews.length} review{reviews.length !== 1 ? 's' : ''}
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
            <div className='bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 h-full'>
              <FaQuoteLeft className='h-8 w-8 text-blue-500 mb-4 opacity-50' />

              <div className='flex items-center mb-4'>
                {renderStars(review.rating)}
                <span className='ml-2 text-sm text-gray-600'>
                  {review.rating}/5
                </span>
              </div>

              <div className='relative group'>
                <p
                  className='text-gray-700 mb-4 leading-relaxed overflow-hidden'
                  style={{
                    display: '-webkit-box',
                    WebkitLineClamp: 4,
                    WebkitBoxOrient: 'vertical'
                  }}
                  title={review.text}
                >
                  &ldquo;{review.text}&rdquo;
                </p>
              </div>

              <div className='flex items-center justify-between'>
                <div className='flex items-center'>
                  <div className='w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center mr-3'>
                    <span className='text-white font-semibold text-sm'>
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
          <div className='text-center py-12'>
            <div className='mb-4'>
              <FaQuoteLeft className='h-16 w-16 text-gray-300 mx-auto' />
            </div>
            <h3 className='text-xl font-medium text-gray-900 mb-2'>
              No reviews yet
            </h3>
            <p className='text-gray-600 mb-6'>
              Be the first to share your experience with us!
            </p>
          </div>
        )}

        {/* Add Review Button */}
        {showAddReviewButton && (
          <div className='text-center mt-12'>
            <button
              onClick={() => setShowReviewForm(true)}
              className='inline-flex items-center px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors duration-200'
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