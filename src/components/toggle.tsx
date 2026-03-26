// src/components/toggle.tsx
import React from 'react';

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  color?: 'blue' | 'red' | 'green' | 'gray';
  disabled?: boolean;
  className?: string;
  labelPosition?: 'top' | 'bottom' | 'left' | 'right';
}

export const Toggle: React.FC<ToggleProps> = ({
  checked,
  onChange,
  label,
  size = 'sm',
  color = 'blue',
  disabled = false,
  className = '',
  labelPosition = 'right',
}) => {
  const trackSize = {
    sm: 'w-8 h-4',
    md: 'w-11 h-6',
    lg: 'w-14 h-7',
  };

  const thumbSize = {
    sm: 'w-3 h-3',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  const trackColor = {
    blue: checked ? 'bg-blue-600' : 'bg-gray-200',
    red: checked ? 'bg-red-500' : 'bg-gray-200',
    green: checked ? 'bg-green-500' : 'bg-gray-200',
    gray: checked ? 'bg-gray-500' : 'bg-gray-200',
  };

  const getLayoutClasses = () => {
    switch (labelPosition) {
      case 'top':
        return 'flex-col items-center justify-center gap-2';
      case 'bottom':
        return 'flex-col-reverse items-center justify-center gap-2';
      case 'left':
        return 'flex-row-reverse items-center gap-3';
      case 'right':
      default:
        return 'flex-row items-center gap-3';
    }
  };

  const renderLabel = () => {
    if (!label) return null;

    return (
      <span
        className={`text-sm font-medium ${disabled ? 'text-gray-400' : 'text-gray-700'}`}
      >
        {label}
      </span>
    );
  };

  return (
    <div className={className}>
      <label
        className={`inline-flex ${getLayoutClasses()} ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
      >
        {(labelPosition === 'top' || labelPosition === 'bottom') &&
          renderLabel()}

        <div className='relative'>
          <input
            type='checkbox'
            checked={checked}
            onChange={(e) => {
              if (!disabled && onChange) {
                onChange(e.target.checked);
              }
            }}
            disabled={disabled}
            className='sr-only'
          />
          {/* Track */}
          <div
            className={`
    ${trackSize[size]} ${trackColor[color]}
    flex items-center rounded-full
    px-0.5 transition-colors duration-200
    ${disabled ? 'cursor-not-allowed opacity-50' : ''}
  `}
          >
            {/* Thumb */}
            <div
              className={`
      ${thumbSize[size]} ${
        checked
          ? size === 'sm'
            ? 'translate-x-4'
            : size === 'md'
              ? 'translate-x-5'
              : 'translate-x-7'
          : 'translate-x-0.5'
      }
      rounded-full bg-white shadow-md
      transition-transform duration-200
    `}
            />
          </div>
        </div>

        {labelPosition === 'left' && renderLabel()}
        {labelPosition === 'right' && renderLabel()}
      </label>
    </div>
  );
};

// Test toggle component for debugging
export const TestToggle = () => {
  const [checked, setChecked] = React.useState(false);
  return (
    <div className='space-y-6 p-4'>
      <h3>Toggle Label Positions Demo</h3>

      <div className='grid grid-cols-2 gap-4'>
        <div>
          <p className='mb-2 text-xs text-gray-600'>Top Position:</p>
          <Toggle
            checked={checked}
            onChange={setChecked}
            label='Top Label'
            size='sm'
            color='blue'
            labelPosition='top'
          />
        </div>

        <div>
          <p className='mb-2 text-xs text-gray-600'>Bottom Position:</p>
          <Toggle
            checked={checked}
            onChange={setChecked}
            label='Bottom Label'
            size='sm'
            color='green'
            labelPosition='bottom'
          />
        </div>

        <div>
          <p className='mb-2 text-xs text-gray-600'>Left Position:</p>
          <Toggle
            checked={checked}
            onChange={setChecked}
            label='Left Label'
            size='sm'
            color='red'
            labelPosition='left'
          />
        </div>

        <div>
          <p className='mb-2 text-xs text-gray-600'>
            Right Position (Default):
          </p>
          <Toggle
            checked={checked}
            onChange={setChecked}
            label='Right Label'
            size='sm'
            color='blue'
            labelPosition='right'
          />
        </div>
      </div>

      <p className='text-sm text-gray-700'>State: {checked ? 'ON' : 'OFF'}</p>
    </div>
  );
};
