import React, { useEffect, useState } from 'react';
import { isEqual } from 'lodash';

interface CheckboxGroupProps {
  options: {
    id: string;
    value: string;
    label: string;
  }[];
  onChange: (values: string[]) => void;
  checkedValues?: string[];
}

const CheckboxGroup: React.FC<CheckboxGroupProps> = React.memo(
  ({ options, onChange, checkedValues = [], ...props }) => {
    const [selectedValues, setSelectedValues] =
      useState<string[]>(checkedValues);

    const handleCheckboxChange = (value: string, checked: boolean) => {
      if (checked) {
        setSelectedValues((prevValues) => [...prevValues, value]); // Add value to selected values array
      } else {
        setSelectedValues((prevValues) =>
          prevValues.filter((v) => v !== value)
        ); // Remove value from selected values array
      }
    };

    useEffect(() => {
      onChange(selectedValues);
    }, [selectedValues]);

    // Sync local state with checkedValues prop
    useEffect(() => {
      setSelectedValues(checkedValues);
    }, []);

    return (
      <div className='relative flex flex-col text-gray-700'>
        <nav className='text-blue-gray-700 flex flex-wrap text-base font-normal'>
          {options.map((option, index) => (
            <div
              role='button'
              key={index}
              className='hover:bg-blue-gray-50 hover:text-blue-[#5b4eea] focus:bg-blue-gray-50 focus:text-blue-[#5b4eea] active:bg-blue-gray-50 active:text-blue-[#5b4eea] flex w-fit items-center rounded-lg p-0 text-start leading-tight outline-none transition-all hover:bg-opacity-80 focus:bg-opacity-80 active:bg-opacity-80'
            >
              <label
                htmlFor={option.id}
                className='flex w-fit cursor-pointer items-center px-1 py-1'
              >
                <div className='mr-3 flex place-items-center'>
                  <div className='inline-flex items-center'>
                    <label
                      className='relative flex cursor-pointer items-center rounded-full p-0'
                      htmlFor={option.id}
                    >
                      <input
                        id={option.id}
                        type='checkbox'
                        checked={selectedValues.includes(option.value)} // Check if value is in selected values array
                        onChange={(e) =>
                          handleCheckboxChange(option.value, e.target.checked)
                        }
                        className="before:content[''] border-blue-gray-200 before:bg-blue-gray-500 small peer relative h-4 w-4 cursor-pointer appearance-none rounded-md border transition-all before:absolute before:left-2/4 before:top-2/4 before:block before:h-8 before:w-8 before:-translate-x-2/4 before:-translate-y-2/4 before:rounded-full before:opacity-0 before:transition-opacity checked:border-[#5b4eea] checked:bg-[#5b4eea] checked:before:bg-[#5b4eea] hover:before:opacity-0" // Add "small" class to reduce checkbox size
                      />
                      <span className='pointer-events-none absolute left-2/4 top-2/4 -translate-x-2/4 -translate-y-2/4 text-white opacity-0 transition-opacity peer-checked:opacity-100'>
                        <svg
                          xmlns='http://www.w3.org/2000/svg'
                          className='h-3.5 w-3.5'
                          viewBox='0 0 20 20'
                          fill='currentColor'
                          stroke='currentColor'
                          strokeWidth='1'
                        >
                          <path
                            fillRule='evenodd'
                            d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z'
                            clipRule='evenodd'
                          ></path>
                        </svg>
                      </span>
                    </label>
                  </div>
                </div>
                <p className='block text-sm leading-relaxed text-gray-500 antialiased'>
                  {option.label}
                </p>
              </label>
            </div>
          ))}
        </nav>
      </div>
    );
  }
);

CheckboxGroup.displayName = 'CheckboxGroup';

export default CheckboxGroup;
