// src/shared/ui/StarRating.tsx
// Star rating display component - <50 lines

import React from 'react';
import { FaStar } from 'react-icons/fa';

interface StarRatingProps {
  rating: number;
  maxRating?: number;
  className?: string;
}

export const StarRating: React.FC<StarRatingProps> = ({
  rating,
  maxRating = 5,
  className = '',
}) => {
  return (
    <div className={`flex items-center space-x-1 ${className}`}>
      {Array.from({ length: maxRating }, (_, i) => (
        <FaStar
          key={i}
          className={`h-4 w-4 ${
            i < rating ? 'fill-current text-warning' : 'text-secondary-300'
          }`}
        />
      ))}
    </div>
  );
};
