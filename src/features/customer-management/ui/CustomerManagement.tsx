// src/features/customer-management/ui/CustomerManagement.tsx
// Main customer management component

'use client';

import React, { useState, useCallback, useEffect } from 'react';
import {
  Customer,
  CustomerFormData,
  CustomersPaginationMeta,
} from '@/features/customer-management/entities/customer/model/types';
import { useCustomerActions } from '@/features/customer-management/lib/useCustomerActions';
import { useCustomersInfiniteScroll } from '@/features/customer-management/lib/useCustomersInfiniteScroll';
import { CustomerTable } from '@/features/customer-management/shared/ui/components/CustomerTable';
import { CustomerModal } from '@/features/customer-management/shared/ui/components/CustomerModal';
import CustomerDeleteModal from '@/components/customer/CustomerDeleteModal';
import { CustomerTabFilter } from '@/lib/customersQuery';

interface CustomerManagementProps {
  initialCustomers?: Customer[];
  initialPagination?: CustomersPaginationMeta;
  onViewInvoices: (customer: Customer) => void;
  className?: string;
}

export const CustomerManagement: React.FC<CustomerManagementProps> = ({
  initialCustomers = [],
  initialPagination,
  onViewInvoices,
  className = '',
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null
  );
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(
    null
  );
  const [activeTab, setActiveTab] = useState<CustomerTabFilter>('all');
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchInput), 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const {
    customers,
    setCustomers,
    hasMore,
    loading,
    loadingMore,
    loadMore,
    refetch,
  } = useCustomersInfiniteScroll({
    initialCustomers,
    initialPagination,
    activeTab,
    search: debouncedSearch,
  });

  const {
    optimisticCustomers,
    createCustomer,
    updateCustomer,
    deleteCustomer,
    isCreating,
    isDeleting,
  } = useCustomerActions({
    customers,
    onCustomersChange: setCustomers,
    onRefreshCustomers: refetch,
  });

  const handleCreateCustomer = useCallback(() => {
    setSelectedCustomer(null);
    setIsModalOpen(true);
  }, []);

  const handleEditCustomer = useCallback((customer: Customer) => {
    setSelectedCustomer(customer);
    setIsModalOpen(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setSelectedCustomer(null);
  }, []);

  const handleDeleteCustomer = useCallback((customer: Customer) => {
    setCustomerToDelete(customer);
    setIsDeleteModalOpen(true);
  }, []);

  const handleCloseDeleteModal = useCallback(() => {
    setIsDeleteModalOpen(false);
    setCustomerToDelete(null);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (customerToDelete) {
      await deleteCustomer(customerToDelete);
      handleCloseDeleteModal();
    }
  }, [customerToDelete, deleteCustomer, handleCloseDeleteModal]);

  const handleModalSubmit = useCallback(
    async (data: CustomerFormData) => {
      if (selectedCustomer) {
        return await updateCustomer(
          selectedCustomer.id || selectedCustomer._id || '',
          data
        );
      }
      return await createCustomer(data);
    },
    [selectedCustomer, updateCustomer, createCustomer]
  );

  return (
    <div className={`p-0 py-6 md:p-6 ${className}`}>
      <div className='mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
        <h1 className='text-2xl font-bold text-secondary-900'>Customers</h1>

        <div className='flex rounded-lg bg-gray-100 p-1'>
          <button
            type='button'
            onClick={() => setActiveTab('all')}
            className={`rounded-md px-4 py-2 text-sm font-medium transition-all duration-200 ${
              activeTab === 'all'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            All Customers
          </button>
          <button
            type='button'
            onClick={() => setActiveTab('regular')}
            className={`rounded-md px-4 py-2 text-sm font-medium transition-all duration-200 ${
              activeTab === 'regular'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Regular Customers
          </button>
          <button
            type='button'
            onClick={() => setActiveTab('walkin')}
            className={`rounded-md px-4 py-2 text-sm font-medium transition-all duration-200 ${
              activeTab === 'walkin'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Walk-in Customers
          </button>
        </div>
      </div>

      <CustomerTable
        customers={optimisticCustomers}
        onViewInvoices={onViewInvoices}
        onEditCustomer={handleEditCustomer}
        onDeleteCustomer={handleDeleteCustomer}
        onAddCustomer={handleCreateCustomer}
        loading={loading}
        onNearBottom={hasMore ? loadMore : undefined}
        searchValue={searchInput}
        onSearchChange={setSearchInput}
        className='mt-4'
      />

      {(loadingMore || (loading && customers.length > 0)) && (
        <div className='py-3 text-center text-sm text-gray-500'>
          Loading more customers…
        </div>
      )}
      {!hasMore && customers.length > 0 && !loadingMore && (
        <div className='py-3 text-center text-sm text-gray-400'>
          All matching customers loaded
        </div>
      )}

      <CustomerModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSubmit={handleModalSubmit}
        isLoading={isCreating}
        initialData={selectedCustomer}
        title={selectedCustomer ? 'Edit Customer' : 'Add Customer'}
      />

      <CustomerDeleteModal
        isOpen={isDeleteModalOpen}
        isLoading={isDeleting}
        customerToDelete={customerToDelete}
        onClose={handleCloseDeleteModal}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
};
