// src/entities/customer/api/customerApi.ts
// Customer API operations - wraps existing actions

import {
  Customer,
  CustomerFormData,
  CustomerCreateRequest,
  CustomerApiResponse,
} from '../model/types';

export class CustomerApi {
  // Fetch all customers
  static async fetchCustomers(): Promise<Customer[]> {
    try {
      // Import the existing action
      const { getCustomers } = await import('@/actions/customerActions');

      const result = await getCustomers();

      if (result.success && Array.isArray(result.data)) {
        return result.data;
      }

      return [];
    } catch (error) {
      console.error('Error fetching customers:', error);
      throw error;
    }
  }

  // Create a new customer
  static async createCustomer(
    customerData: CustomerCreateRequest
  ): Promise<Customer> {
    try {
      // Import the existing action
      const { createCustomer } = await import('@/actions/customerActions');

      const result = await createCustomer(customerData);

      if (!result.success) {
        throw new Error(result.error || 'Failed to create customer');
      }

      // Return the created customer data or a constructed customer object
      if (
        result.data &&
        typeof result.data === 'object' &&
        'customerName' in result.data
      ) {
        return {
          _id: `temp-${Date.now()}`,
          id: `temp-${Date.now()}`,
          customerName: result.data.customerName,
          phoneNumber: result.data.phoneNumber,
          address: result.data.address || '',
          email: result.data.email,
          createdAt:
            result.data.createdAt instanceof Date
              ? result.data.createdAt.toISOString()
              : new Date().toISOString(),
        };
      }

      // Fallback to constructed customer object
      return {
        _id: `temp-${Date.now()}`,
        id: `temp-${Date.now()}`,
        customerName: customerData.customerName,
        phoneNumber: customerData.phoneNumber,
        address: customerData.address,
        email: customerData.email,
        createdAt: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Error creating customer:', error);
      throw error;
    }
  }

  // Delete a customer
  static async deleteCustomer(customerId: string): Promise<void> {
    try {
      const response = await fetch(`/api/customers/${customerId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete customer');
      }
    } catch (error) {
      console.error('Error deleting customer:', error);
      throw error;
    }
  }

  // Update a customer
  static async updateCustomer(
    customerId: string,
    customerData: Partial<CustomerFormData>
  ): Promise<Customer> {
    try {
      const response = await fetch(`/api/customers/${customerId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(customerData),
      });

      if (!response.ok) {
        throw new Error('Failed to update customer');
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('Error updating customer:', error);
      throw error;
    }
  }

  // Get customer by ID
  static async getCustomerById(customerId: string): Promise<Customer | null> {
    try {
      const customers = await this.fetchCustomers();
      return customers.find((customer) => customer._id === customerId) || null;
    } catch (error) {
      console.error('Error getting customer by ID:', error);
      return null;
    }
  }

  // Search customers
  static searchCustomers(
    customers: Customer[],
    searchTerm: string
  ): Customer[] {
    if (!searchTerm.trim()) {
      return customers;
    }

    const lowerSearchTerm = searchTerm.toLowerCase();

    return customers.filter(
      (customer) =>
        customer.customerName.toLowerCase().includes(lowerSearchTerm) ||
        customer.phoneNumber.toLowerCase().includes(lowerSearchTerm) ||
        customer.email?.toLowerCase().includes(lowerSearchTerm) ||
        customer.address.toLowerCase().includes(lowerSearchTerm)
    );
  }

  // Validate customer form data
  static validateCustomerForm(data: CustomerFormData): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!data.customerName.trim()) {
      errors.push('Customer name is required');
    }

    if (!data.phoneNumber.trim()) {
      errors.push('Phone number is required');
    }

    if (
      data.email &&
      data.email.trim() &&
      !this.isValidEmail(data.email.trim())
    ) {
      errors.push('Invalid email format');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  // Email validation helper
  private static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}
