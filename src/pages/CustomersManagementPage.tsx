// src/pages/CustomersManagementPage.tsx
// Customers management page - <80 lines (composition only)

'use client';
import React, { useState, useCallback } from 'react';
import { FaPlus } from 'react-icons/fa';
import Button from '@/components/button';
import { Customer, CustomerFormData } from '@/entities/customer/model/types';
import { CustomerManagement } from '@/features/customer-management';
import { CustomerModal } from '@/features/customer-management';
import CustomerInvoicesModal from '@/components/customer/CustomerInvoicesModal';

interface CustomersManagementPageProps {
  initialCustomers: Customer[];
}

export default function CustomersManagementPage({
  initialCustomers,
}: CustomersManagementPageProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isInvoicesModalOpen, setIsInvoicesModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null
  );
  const [refreshKey, setRefreshKey] = useState(0);

  const handleViewInvoices = useCallback((customer: Customer) => {
    setSelectedCustomer(customer);
    setIsInvoicesModalOpen(true);
  }, []);

  const handleCloseInvoicesModal = useCallback(() => {
    setIsInvoicesModalOpen(false);
    setSelectedCustomer(null);
  }, []);

  const handleCreateCustomer = useCallback(() => {
    setSelectedCustomer(null);
    setIsModalOpen(true);
  }, []);

  const handleEditCustomer = useCallback((customer: Customer) => {
    setSelectedCustomer(customer);
    setIsModalOpen(true);
  }, []);

  const handleModalSuccess = useCallback(() => {
    setRefreshKey((prev) => prev + 1); // Trigger refresh
  }, []);

  const handleModalSubmit = useCallback(async (data: CustomerFormData) => {
    // The CustomerModal component will handle the actual submission
    // This is just a wrapper to match the expected interface
    return true;
  }, []);

  return (
    <div className='p-0 py-6 md:p-6'>
      {/* Header */}
      <div className='mb-6 flex items-center justify-between'>
        <h1 className='text-2xl font-bold text-secondary-900'>Customers</h1>
        <Button
          variant='fill'
          text='Create Customer'
          icon={<FaPlus />}
          onClick={handleCreateCustomer}
        />
      </div>

      {/* Customer Management */}
      <CustomerManagement
        key={refreshKey} // Force refresh on customer changes
        initialCustomers={initialCustomers}
        onViewInvoices={handleViewInvoices}
      />

      {/* Customer Modal */}
      <CustomerModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleModalSubmit}
        initialData={selectedCustomer}
      />

      {/* Customer Invoices Modal */}
      {selectedCustomer && (
        <CustomerInvoicesModal
          isOpen={isInvoicesModalOpen}
          onClose={handleCloseInvoicesModal}
          customer={selectedCustomer}
        />
      )}
    </div>
  );
}
