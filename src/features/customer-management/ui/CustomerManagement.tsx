// src/features/customer-management/ui/CustomerManagement.tsx
// Main customer management component

'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { unstable_noStore } from 'next/cache';
import { useAtom } from 'jotai';
import {
  Customer,
  CustomerFormData,
} from '@/features/customer-management/entities/customer/model/types';
import { customersAtom, fetchCustomersAtom } from '@/store/sharedAtoms';
import { useCustomerActions } from '@/features/customer-management/lib/useCustomerActions';
import { CustomerTable } from '@/features/customer-management/shared/ui/components/CustomerTable';
import { CustomerModal } from '@/features/customer-management/shared/ui/components/CustomerModal';
import CustomerDeleteModal from '@/components/customer/CustomerDeleteModal';
import Input from '@/components/customInput';
import Button from '@/components/button';
import { FaPlus } from 'react-icons/fa';

interface CustomerManagementProps {
  initialCustomers?: Customer[];
  onViewInvoices: (customer: Customer) => void;
  className?: string;
}

export const CustomerManagement: React.FC<CustomerManagementProps> = ({
  initialCustomers,
  onViewInvoices,
  className = '',
}) => {
  unstable_noStore();

  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null
  );
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [customers, setCustomers] = useAtom(customersAtom);
  const fetchCustomers = useAtom(fetchCustomersAtom)[1];

  // Data is pre-loaded by GlobalDataProvider, but fetch if empty
  React.useEffect(() => {
    if (!customers || customers.length === 0) {
      fetchCustomers();
    }
  }, [customers, fetchCustomers]);

  const handleRefreshCustomers = useCallback(async () => {
    await fetchCustomers();
  }, [fetchCustomers]);

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
    onRefreshCustomers: handleRefreshCustomers,
  });

  // Filter customers based on search
  const filteredCustomers = useMemo(() => {
    if (!searchTerm.trim()) return optimisticCustomers;

    const lowerSearchTerm = searchTerm.toLowerCase();
    return optimisticCustomers.filter(
      (customer) =>
        customer.customerName.toLowerCase().includes(lowerSearchTerm) ||
        customer.phoneNumber.toLowerCase().includes(lowerSearchTerm) ||
        customer.address.toLowerCase().includes(lowerSearchTerm) ||
        (customer.email &&
          customer.email.toLowerCase().includes(lowerSearchTerm))
    );
  }, [optimisticCustomers, searchTerm]);

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
        return await updateCustomer(selectedCustomer.id || '', data);
      } else {
        return await createCustomer(data);
      }
    },
    [selectedCustomer, updateCustomer, createCustomer]
  );

  return (
    <div className={`p-0 py-6 md:p-6 ${className}`}>
      <h1 className='mb-6 text-2xl font-bold text-secondary-900'>Customers</h1>

      {/* Customer Table with built-in search */}
      <CustomerTable
        customers={filteredCustomers}
        onViewInvoices={onViewInvoices}
        onEditCustomer={handleEditCustomer}
        onDeleteCustomer={handleDeleteCustomer}
        onAddCustomer={handleCreateCustomer}
        loading={false}
        className='mt-4'
      />

      {/* Customer Modal */}
      <CustomerModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSubmit={handleModalSubmit}
        isLoading={isCreating}
        initialData={selectedCustomer}
        title={selectedCustomer ? 'Edit Customer' : 'Add Customer'}
      />

      {/* Customer Delete Modal */}
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
