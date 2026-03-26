'use client';

import React, { ButtonHTMLAttributes, FunctionComponent } from 'react';
import { useFormStatus } from 'react-dom';

interface IButton extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant: 'fill' | 'outline';
  text: string;
  isPending?: boolean;
  icon?: React.ReactNode;
}

const Button: FunctionComponent<IButton> = ({
  variant,
  text,
  className = '',
  isPending,
  icon,
  ...rest
}) => {
  const { pending, data, action } = useFormStatus();

  const baseClasses =
    'flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-200';

  const variantClasses = {
    fill: 'text-white focus:ring-primary-500 transition-all duration-200',
    outline:
      'border border-secondary-300 bg-white text-secondary-700 hover:bg-secondary-50 focus:ring-primary-500',
  };

  const disabledClasses = 'disabled:opacity-50 disabled:cursor-not-allowed';

  return (
    <button
      type='button'
      disabled={pending || isPending}
      className={`${baseClasses} ${variantClasses[variant]} ${disabledClasses} ${className}`}
      style={
        variant === 'fill'
          ? {
              background: 'linear-gradient(135deg, #4287f5 0%, #021b3b 100%)',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
              transition: 'all 0.2s ease',
            }
          : {}
      }
      onMouseEnter={(e) => {
        if (variant === 'fill') {
          e.currentTarget.style.filter = 'brightness(1.1)';
        }
      }}
      onMouseLeave={(e) => {
        if (variant === 'fill') {
          e.currentTarget.style.filter = 'brightness(1)';
        }
      }}
      {...rest}
    >
      {pending ||
        (isPending && (
          <svg
            className='-ml-1 mr-3 h-5 w-5 animate-spin text-white'
            xmlns='http://www.w3.org/2000/svg'
            fill='none'
            viewBox='0 0 24 24'
          >
            <circle
              className='opacity-25'
              cx='12'
              cy='12'
              r='10'
              stroke='currentColor'
              strokeWidth='4'
            ></circle>
            <path
              className='opacity-75'
              fill='currentColor'
              d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
            ></path>
          </svg>
        ))}
      {icon}
      <span className={` ${pending || isPending ? 'pl-2' : ''}`}>
        {pending || isPending ? ' Saving' : text}
      </span>
    </button>
  );
};

export default Button;
