import React from 'react';
import { FiPlusSquare } from 'react-icons/fi';
import { PiMinusSquare } from 'react-icons/pi';

interface AccordionProps {
  title: string;
  content: React.ReactNode;
  addOnClick?: () => void;
  removeOnClick?: () => void;
  removeIconClass?: string;
  addIconClass?: string;
  index: number;
  expandedAccordionIndex: number;
  handleAccordionClick: (accordionIndex: number) => void;
}

const Accordion = ({
  title,
  content,
  addOnClick,
  removeOnClick,
  removeIconClass,
  addIconClass,
  index,
  expandedAccordionIndex,
  handleAccordionClick,
}: AccordionProps) => {
  return (
    <div className='py-0 '>
      <button
        className='relative flex w-full items-center justify-between rounded-md px-1 py-2 text-sm font-medium text-white transition duration-300 ease-in-out'
        style={{
          background: 'linear-gradient(to right, rgb(30, 58, 138), rgb(29, 78, 216), rgb(37, 99, 235))',
          boxShadow:
            'rgba(0, 0, 0, 0.1) 0px 20px 25px -5px, rgba(0, 0, 0, 0.04) 0px 10px 10px -5px',
        }}
        aria-expanded={expandedAccordionIndex === index}
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();

          handleAccordionClick(index);
        }}
      >
        <PiMinusSquare
          className={`absolute right-[-10px] top-[45%] z-20 cursor-pointer text-red-500 ${removeIconClass} -translate-y-1/2 translate-x-1/2 transform`}
          onClick={(event) => {
            event.stopPropagation();
            event.preventDefault();

            if (removeOnClick) removeOnClick();
          }}
        />

        <FiPlusSquare
          className={`absolute left-[-23px] top-[45%]  z-20 cursor-pointer text-[var(--color-success-400)] ${addIconClass} -translate-y-1/2 translate-x-1/2 transform`}
          onClick={(event) => {
            event.stopPropagation();
            event.preventDefault();

            if (addOnClick) addOnClick();
          }}
        />
        {title}
        <svg
          className={`h-5 w-5 ${expandedAccordionIndex === index ? 'rotate-180' : ''}`}
          viewBox='0 0 512 512'
          fill='white'
        >
          <path d='M256 217.9L383 345c9.4 9.4 24.6 9.4 33.9 0 9.4-9.4 9.3-24.6 0-34L273 167c-9.1-9.1-23.7-9.3-33.1-.7L95 310.9c-4.7 4.7-7 10.9-7 17s2.3 12.3 7 17c9.4 9.4 24.6 9.4 33.9 0l127.1-127z' />
        </svg>
      </button>
      <div
        className={`text-sm transition duration-300 ease-in-out ${expandedAccordionIndex === index ? 'h-auto' : 'hidden'}`}
        aria-hidden={expandedAccordionIndex !== index}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
      >
        {content}
      </div>
    </div>
  );
};

export default Accordion;
