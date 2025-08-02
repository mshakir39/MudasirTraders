import React, { InputHTMLAttributes } from 'react';

interface CustomInputProps extends InputHTMLAttributes<HTMLInputElement> {
  type?: string;
  placeholder?: string;
  label?: string;
  parentClass?: string;
}

const CustomInput: React.FC<CustomInputProps> = ({
  type = 'text',
  placeholder = '',
  label = 'Change label please',
  parentClass,
  ...rest
}) => {
  return (
    <div className={`w-full ${parentClass}`}>
      <label className='mb-1 block text-sm font-medium text-gray-700'>
        {label}
      </label>
      <input
        type={type}
        placeholder={placeholder}
        className='w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm'
        {...rest}
      />
    </div>
  );
};

export default CustomInput;
