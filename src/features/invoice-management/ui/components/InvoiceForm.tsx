// src/features/invoice-management/ui/components/InvoiceForm.tsx
// Invoice form component - <50 lines

'use client';

import React from 'react';
import { Invoice, InvoiceFormData } from '@/entities/invoice';
import Button from '@/components/button';

interface InvoiceFormProps {
  invoiceData: InvoiceFormData;
  setInvoiceData: (data: InvoiceFormData) => void;
  isLoading: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  children: React.ReactNode;
}

export const InvoiceForm: React.FC<InvoiceFormProps> = ({
  invoiceData,
  setInvoiceData,
  isLoading,
  onSubmit,
  onCancel,
  children
}) => {
  return (
    <form onSubmit={onSubmit} className="space-y-2">
      {children}
      
      <div className="flex justify-end gap-3 pt-2">
        <Button
          variant="outline"
          text="Cancel"
          onClick={onCancel}
          type="button"
        />
        <Button
          variant="fill"
          text={isLoading ? 'Saving...' : 'Save Invoice'}
          isPending={isLoading}
          type="submit"
        />
      </div>
    </form>
  );
};
