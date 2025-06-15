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
    <div className={`relative h-11 w-full min-w-[200px] ${parentClass}`}>
      <input
        type={type}
        placeholder={placeholder}
        className='border-blue-gray-200 text-blue-gray-700 placeholder-shown:border-blue-gray-200 disabled:bg-blue-gray-50 peer h-full w-full border-b bg-transparent pb-1.5 pt-4 font-sans text-sm font-normal outline outline-0 transition-all placeholder:opacity-0 focus:border-gray-500 focus:outline-0 focus:placeholder:opacity-100 disabled:border-0'
        {...rest}
      />
      <label className="after:content[''] peer-placeholder-shown:text-blue-gray-500 peer-disabled:peer-placeholder-shown:text-blue-gray-500 pointer-events-none absolute -top-1.5 left-0 flex h-full w-full select-none !overflow-visible truncate font-normal leading-tight text-gray-500 transition-all after:absolute after:-bottom-1.5 after:block after:w-full after:scale-x-0 after:border-b-2 after:border-gray-500 after:transition-transform after:duration-300 peer-placeholder-shown:text-sm peer-placeholder-shown:leading-[4.25] peer-focus:leading-tight peer-focus:text-gray-900 peer-focus:after:scale-x-100 peer-focus:after:border-gray-900 peer-disabled:text-transparent md:text-sm peer-focus:md:text-[18px]">
        {label}
      </label>
    </div>
  );
};

export default CustomInput;
