// src/features/customer-management/lib/useCustomerActions.ts
// Customer management actions and state management

'use client';

import { useCallback, useOptimistic, startTransition } from 'react';
import { toast } from 'react-toastify';
import { Customer, CustomerFormData, CustomerCreateRequest, CustomerUpdateRequest } from '@/features/customer-management/entities/customer/model/types';

export interface UseCustomerActionsProps {
  customers: Customer[];
  onCustomersChange: (customers: Customer[]) => void;
  onRefreshCustomers: () => Promise<void>;
}

export const useCustomerActions = ({
  customers,
  onCustomersChange,
  onRefreshCustomers,
}: UseCustomerActionsProps) => {
  // Optimistic updates for customer creation
  const [optimisticCustomers, addOptimisticCustomer] = useOptimistic(
    customers,
    (state, newCustomer: Customer) => [
      ...state,
      { ...newCustomer, _id: `temp-${Date.now()}` },
    ]
  );

  const createCustomer = useCallback(async (data: CustomerFormData) => {
    try {
      // Add optimistic update within transition
      startTransition(() => {
        addOptimisticCustomer({ 
          ...data, 
          _id: `temp-${Date.now()}`,
          createdAt: new Date().toISOString(),
        } as Customer);
      });

      const response = await fetch('/api/customers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customerName: data.customerName.trim(),
          phoneNumber: data.phoneNumber.trim(),
          address: data.address.trim(),
          email: data.email?.trim() || undefined,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success('Customer created successfully');
        await onRefreshCustomers(); // Refresh store after create
        return true;
      } else {
        toast.error(result.error || 'Failed to create customer');
        return false;
      }
    } catch (error) {
      toast.error('An error occurred while creating the customer');
      return false;
    }
  }, [addOptimisticCustomer, onRefreshCustomers]);

  const updateCustomer = useCallback(async (customerId: string, data: CustomerFormData) => {
    try {
      const response = await fetch(`/api/customers/${customerId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customerName: data.customerName.trim(),
          phoneNumber: data.phoneNumber.trim(),
          address: data.address.trim(),
          email: data.email?.trim() || undefined,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success('Customer updated successfully');
        await onRefreshCustomers(); // Refresh store after update
        return true;
      } else {
        toast.error(result.error || 'Failed to update customer');
        return false;
      }
    } catch (error) {
      toast.error('An error occurred while updating the customer');
      return false;
    }
  }, [onRefreshCustomers]);

  const deleteCustomer = useCallback(async (customer: Customer) => {
    if (!customer._id) {
      toast.error('Cannot delete customer: ID is missing');
      return;
    }

    if (!confirm('Are you sure you want to delete this customer?')) return;

    try {
      const response = await fetch('/api/customers', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: customer._id }),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success('Customer deleted successfully');
        await onRefreshCustomers(); // Refresh store after delete
      } else {
        toast.error(result.error || 'Failed to delete customer');
      }
    } catch (error) {
      toast.error('An error occurred while deleting the customer');
    }
  }, [onRefreshCustomers]);

  return {
    optimisticCustomers,
    createCustomer,
    updateCustomer,
    deleteCustomer,
  };
};
