// src/features/invoice-management/ui/components/InvoiceDateSection.tsx
// Invoice date section - <30 lines

'use client';

import React from 'react';
import { InvoiceFormData } from '@/entities/invoice';
import { Toggle } from '@/components/toggle';

interface InvoiceDateSectionProps {
  invoiceData: InvoiceFormData;
  setInvoiceData: (data: InvoiceFormData) => void;
}

export const InvoiceDateSection: React.FC<InvoiceDateSectionProps> = ({
  invoiceData,
  setInvoiceData
}) => {
  return (
    <div className="space-y-2">
      <h3 className="text-lg font-semibold">Date & Time</h3>
      
      <Toggle
        checked={invoiceData.useCustomDate || false}
        onChange={(checked) => setInvoiceData({
          ...invoiceData,
          useCustomDate: checked,
          customDate: checked ? invoiceData.customDate : undefined
        })}
        label="Use Custom Date"
        size="sm"
        color="blue"
      />

      {invoiceData.useCustomDate && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Custom Date & Time
          </label>
          <input
            type="datetime-local"
            value={invoiceData.customDate || ''}
            onChange={(e) => setInvoiceData({
              ...invoiceData,
              customDate: e.target.value || undefined
            })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      )}
    </div>
  );
};
