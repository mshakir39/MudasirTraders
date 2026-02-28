'use client';

import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ICategory } from '../../interfaces';

interface SortableTabProps {
  category: ICategory;
  isActive: boolean;
  onClick: () => void;
}

export function SortableTab({ category, isActive, onClick }: SortableTabProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: category.brandName });

  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`
        relative flex flex-shrink-0 cursor-pointer select-none items-center whitespace-nowrap border-b-2 px-4 py-3 text-sm font-medium transition-all duration-200
        ${
          isActive
            ? 'border-blue-500 bg-blue-50 text-blue-600'
            : 'border-transparent text-gray-500 hover:bg-gray-50 hover:text-gray-700'
        }
        ${isDragging ? 'z-10 rotate-2 scale-105 opacity-50' : ''}
      `}
      onClick={onClick}
    >
      <div
        {...attributes}
        {...listeners}
        className='mr-2 cursor-move rounded p-1 hover:bg-gray-200'
        title='Drag to reorder'
      >
        <svg
          className='h-3 w-3 text-gray-400'
          fill='currentColor'
          viewBox='0 0 20 20'
        >
          <path d='M3 4h14a1 1 0 010 2H3a1 1 0 010-2zM3 8h14a1 1 0 010 2H3a1 1 0 010-2zM3 12h14a1 1 0 010 2H3a1 1 0 010-2z' />
        </svg>
      </div>

      <span className='flex-1 text-center'>{category.brandName || ''}</span>

      {isDragging && (
        <div className='absolute inset-0 rounded-t-md bg-blue-100 opacity-50' />
      )}
    </div>
  );
}
