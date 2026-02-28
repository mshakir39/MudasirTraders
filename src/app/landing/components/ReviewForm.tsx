'use client';

import React, { useState } from 'react';
import { FaStar, FaTimes } from 'react-icons/fa';

interface ReviewFormProps {
  onClose: () => void;
  onSubmitSuccess: () => void;
}

const ReviewForm: React.FC<ReviewFormProps> = ({
  onClose,
  onSubmitSuccess,
}) => {
  const [formData, setFormData] = useState({
    author_name: '',
    rating: 5,
    text: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    if (!formData.author_name.trim()) {
      setError('Please enter your name');
      setIsSubmitting(false);
      return;
    }

    if (!formData.text.trim()) {
      setError('Please enter your review');
      setIsSubmitting(false);
      return;
    }

    if (formData.text.trim().length < 10) {
      setError('Please write at least 10 characters');
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to submit review');
      }

      onSubmitSuccess();
    } catch (err) {
      setError('Failed to submit review. Please try again.');
      console.error('Error submitting review:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRatingClick = (rating: number) => {
    setFormData((prev) => ({ ...prev, rating }));
  };

  const renderStars = (rating: number, interactive = false) => {
    return Array.from({ length: 5 }, (_, i) => (
      <FaStar
        key={i}
        className={`h-6 w-6 ${
          i < rating
            ? 'fill-current text-yellow-400'
            : interactive
              ? 'cursor-pointer text-gray-300 hover:text-yellow-400'
              : 'text-gray-300'
        }`}
        onClick={interactive ? () => handleRatingClick(i + 1) : undefined}
      />
    ));
  };

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4'>
      <div className='max-h-[90vh] w-full max-w-md overflow-y-auto rounded-lg bg-white shadow-xl'>
        <div className='p-6'>
          <div className='mb-6 flex items-center justify-between'>
            <h3 className='text-xl font-bold text-gray-900'>Write a Review</h3>
            <button
              onClick={onClose}
              className='text-gray-400 transition-colors hover:text-gray-600'
            >
              <FaTimes className='h-5 w-5' />
            </button>
          </div>

          <form onSubmit={handleSubmit} className='space-y-4'>
            <div>
              <label className='mb-2 block text-sm font-medium text-gray-700'>
                Your Name *
              </label>
              <input
                type='text'
                value={formData.author_name}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    author_name: e.target.value,
                  }))
                }
                className='w-full rounded-md border border-gray-300 px-3 py-2 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500'
                placeholder='Enter your name'
                required
              />
            </div>

            <div>
              <label className='mb-2 block text-sm font-medium text-gray-700'>
                Rating *
              </label>
              <div className='flex items-center space-x-1'>
                {renderStars(formData.rating, true)}
                <span className='ml-2 text-sm text-gray-600'>
                  {formData.rating}/5
                </span>
              </div>
            </div>

            <div>
              <label className='mb-2 block text-sm font-medium text-gray-700'>
                Your Review *
              </label>
              <textarea
                value={formData.text}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, text: e.target.value }))
                }
                className='h-32 w-full resize-none rounded-md border border-gray-300 px-3 py-2 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500'
                placeholder='Share your experience with us...'
                required
              />
              <p className='mt-1 text-xs text-gray-500'>
                Minimum 10 characters
              </p>
            </div>

            {error && (
              <div className='rounded-md bg-red-50 p-3 text-sm text-red-600'>
                {error}
              </div>
            )}

            <div className='flex space-x-3 pt-4'>
              <button
                type='button'
                onClick={onClose}
                className='flex-1 rounded-md bg-gray-100 px-4 py-2 text-gray-700 transition-colors hover:bg-gray-200'
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type='submit'
                className='flex-1 rounded-md bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50'
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Submitting...' : 'Submit Review'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ReviewForm;
