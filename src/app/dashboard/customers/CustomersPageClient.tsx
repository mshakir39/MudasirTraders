'use client';

import { useState } from 'react';
import { CustomerManagement } from '@/features/customer-management';
import CustomerInvoicesModal from '@/components/customer/CustomerInvoicesModal';
import {
  Customer,
  CustomersPaginationMeta,
} from '@/features/customer-management/entities/customer/model/types';

interface CustomersPageClientProps {
  initialCustomers: Customer[];
  initialPagination: CustomersPaginationMeta;
}

export default function CustomersPageClient({
  initialCustomers,
  initialPagination,
}: CustomersPageClientProps) {
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null
  );
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
    <>
      <CustomerManagement
        initialCustomers={initialCustomers}
        initialPagination={initialPagination}
        onViewInvoices={handleViewInvoices}
      />

      {selectedCustomer && (
        <CustomerInvoicesModal
          isOpen={isInvoicesModalOpen}
          onClose={handleCloseInvoicesModal}
          customer={selectedCustomer}
        />
      )}
    </>
  );
}
