// src/features/invoice-management/ui/components/product/ProductAccordion.tsx
// Product accordion component - <80 lines

'use client';

import React from 'react';
import Accordion from '@/components/accordion';

interface ProductAccordionProps {
  title: string;
  content: React.ReactNode;
  index: number;
  expandedAccordionIndex: number;
  handleAccordionClick: (index: number) => void;
  addOnClick: () => void;
  removeOnClick: () => void;
  addIconClass?: string;
  removeIconClass?: string;
}

export const ProductAccordion: React.FC<ProductAccordionProps> = ({
  title,
  content,
  index,
  expandedAccordionIndex,
  handleAccordionClick,
  addOnClick,
  removeOnClick,
  addIconClass = '',
  removeIconClass = '',
}) => {
  return (
    <Accordion
      title={title}
      content={content}
      index={index}
      expandedAccordionIndex={expandedAccordionIndex}
      handleAccordionClick={handleAccordionClick}
      addOnClick={addOnClick}
      removeOnClick={removeOnClick}
      addIconClass={addIconClass}
      removeIconClass={removeIconClass}
    />
  );
};
