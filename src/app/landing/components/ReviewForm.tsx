'use client';

import React, { useState } from 'react';
import { FaStar, FaTimes } from 'react-icons/fa';

interface ReviewFormProps {
  onClose: () => void;
  onSubmitSuccess: () => void;
}

const ReviewForm: React.FC<ReviewFormProps> = ({ onClose, onSubmitSuccess }) => {
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
    setFormData(prev => ({ ...prev, rating }));
  };

  const renderStars = (rating: number, interactive = false) => {
    return Array.from({ length: 5 }, (_, i) => (
      <FaStar
        key={i}
        className={`h-6 w-6 ${
          i < rating
            ? 'text-yellow-400 fill-current'
            : interactive
              ? 'text-gray-300 hover:text-yellow-400 cursor-pointer'
              : 'text-gray-300'
        }`}
        onClick={interactive ? () => handleRatingClick(i + 1) : undefined}
      />
    ));
  };

  return (
    <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4'>
      <div className='bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto'>
        <div className='p-6'>
          <div className='flex items-center justify-between mb-6'>
            <h3 className='text-xl font-bold text-gray-900'>Write a Review</h3>
            <button
              onClick={onClose}
              className='text-gray-400 hover:text-gray-600 transition-colors'
            >
              <FaTimes className='h-5 w-5' />
            </button>
          </div>

          <form onSubmit={handleSubmit} className='space-y-4'>
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                Your Name *
              </label>
              <input
                type='text'
                value={formData.author_name}
                onChange={(e) => setFormData(prev => ({ ...prev, author_name: e.target.value }))}
                className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                placeholder='Enter your name'
                required
              />
            </div>

            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
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
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                Your Review *
              </label>
              <textarea
                value={formData.text}
                onChange={(e) => setFormData(prev => ({ ...prev, text: e.target.value }))}
                className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent h-32 resize-none'
                placeholder='Share your experience with us...'
                required
              />
              <p className='text-xs text-gray-500 mt-1'>
                Minimum 10 characters
              </p>
            </div>

            {error && (
              <div className='text-red-600 text-sm bg-red-50 p-3 rounded-md'>
                {error}
              </div>
            )}

            <div className='flex space-x-3 pt-4'>
              <button
                type='button'
                onClick={onClose}
                className='flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors'
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type='submit'
                className='flex-1 px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
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
