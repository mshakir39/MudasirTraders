// src/features/invoice-management/lib/useAccordionLogic.ts
// Accordion state and logic management

import { useState, useEffect, useCallback } from 'react';

export const useAccordionLogic = (
  accordionData: any,
  accordionMethods: any,
  invoiceData: any
) => {
  const [expandedAccordionIndex, setExpandedAccordionIndex] = useState(-1);
  const [lastSyncedDate, setLastSyncedDate] = useState('');

  const handleAccordionClick = useCallback(
    (index: number) => {
      setExpandedAccordionIndex(expandedAccordionIndex === index ? -1 : index);
    },
    [expandedAccordionIndex]
  );

  // Sync warranty dates with custom date
  const syncWarrantyDatesWithCustomDate = useCallback(
    (customDate: string) => {
      if (!customDate) return;

      const customDateOnly = customDate.split('T')[0];
      let updatedCount = 0;

      Object.keys(accordionData).forEach((accordionIndex) => {
        const index = parseInt(accordionIndex);
        const currentAccordion = accordionData[index];

        if (currentAccordion && currentAccordion.warrentyDuration) {
          const oldDate = currentAccordion.warrentyStartDate;

          if (oldDate !== customDateOnly) {
            accordionMethods.handleAccordionChange(
              index,
              'warrentyStartDate',
              customDateOnly
            );
            updatedCount++;
          }
        }
      });

      if (updatedCount > 0) {
        console.log(
          `Warranty start dates synced with custom date: ${customDateOnly}`
        );
      }
    },
    [accordionData, accordionMethods]
  );

  // Track sync state
  useEffect(() => {
    if (invoiceData?.useCustomDate && invoiceData?.customDate) {
      const customDateOnly = invoiceData.customDate.split('T')[0];

      if (lastSyncedDate !== customDateOnly) {
        syncWarrantyDatesWithCustomDate(invoiceData.customDate);
        setLastSyncedDate(customDateOnly);
      }
    }
  }, [
    invoiceData?.useCustomDate,
    invoiceData?.customDate,
    lastSyncedDate,
    accordionData,
    accordionMethods,
    syncWarrantyDatesWithCustomDate,
  ]);

  return {
    expandedAccordionIndex,
    handleAccordionClick,
    syncWarrantyDatesWithCustomDate,
    lastSyncedDate,
    setLastSyncedDate,
  };
};
