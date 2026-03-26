// src/app/dashboard/customers/page.tsx
// Use new FSD structure - preserve all functionality

'use client';

import { CustomerManagement } from '@/features/customer-management';
import CustomersErrorBoundary from '@/components/customers/CustomersErrorBoundary';
import CustomerInvoicesModal from '@/components/customer/CustomerInvoicesModal';
import { Customer } from '@/features/customer-management/entities/customer/model/types';
import { useState } from 'react';

// Client Component to handle event handlers
export default function CustomersPage() {
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isInvoicesModalOpen, setIsInvoicesModalOpen] = useState(false);

  const handleViewInvoices = (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsInvoicesModalOpen(true);
  };

  const handleCloseInvoicesModal = () => {
    setIsInvoicesModalOpen(false);
    setSelectedCustomer(null);
  };

  return (
    <CustomersErrorBoundary>
      <CustomerManagement 
        onViewInvoices={handleViewInvoices}
      />
      
      {/* Customer Invoices Modal */}
      {selectedCustomer && (
        <CustomerInvoicesModal
          isOpen={isInvoicesModalOpen}
          onClose={handleCloseInvoicesModal}
          customer={selectedCustomer}
        />
      )}
    </CustomersErrorBoundary>
  );
}
