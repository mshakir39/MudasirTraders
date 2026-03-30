// src/features/invoice-management/ui/components/InvoiceCustomerSection.tsx
// Invoice customer information section - <50 lines

'use client';

import React, { useEffect } from 'react';
import { useAtom } from 'jotai';
import { InvoiceFormData } from '@/entities/invoice';
import Dropdown from '@/components/dropdown';
import CustomerNameAutocomplete from '@/components/CustomerNameAutocomplete';
import { invoicesAtom } from '@/store/sharedAtoms';

interface InvoiceCustomerSectionProps {
  invoiceData: InvoiceFormData;
  setInvoiceData: (data: InvoiceFormData) => void;
  customers: any[];
}

export const InvoiceCustomerSection: React.FC<InvoiceCustomerSectionProps> = ({
  invoiceData,
  setInvoiceData,
  customers,
}) => {
  // Get invoices from Jotai store instead of fetching from API
  const [allInvoices] = useAtom(invoicesAtom);

  // Handle customer name change for walk-in customers (from old code)
  const handleCustomerNameChange = (e: {
    target: { name: string; value: string; customerInfo?: any };
  }) => {
    const customerName = e.target.value;
    const customerInfo = e.target.customerInfo;

    if (customerInfo) {
      // Auto-fill customer details from the selected customer info
      setInvoiceData({
        ...invoiceData,
        customerName: customerName,
        customerAddress:
          customerInfo.address || invoiceData.customerAddress || '',
        customerContactNumber:
          customerInfo.contactNumber || invoiceData.customerContactNumber || '',
      });
    } else {
      // Find the most recent invoice for this customer to get their details
      let customerInvoice = allInvoices.find(
        (invoice: any) => invoice.customerName === customerName
      );

      if (!customerInvoice) {
        customerInvoice = allInvoices.find((invoice: any) =>
          invoice.customerName
            .toLowerCase()
            .includes(customerName.toLowerCase())
        );
      }

      if (customerInvoice) {
        // Auto-fill customer details from invoice data
        setInvoiceData({
          ...invoiceData,
          customerName: customerName,
          customerAddress:
            customerInvoice.customerAddress ||
            invoiceData.customerAddress ||
            '',
          customerContactNumber:
            customerInvoice.customerContactNumber ||
            invoiceData.customerContactNumber ||
            '',
        });
      } else {
        // Just update the customer name if no previous data found
        setInvoiceData({
          ...invoiceData,
          customerName: customerName,
        });
      }
    }
  };

  const handleCustomerTypeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;

    // From old useInvoiceForm logic - clear fields when switching to WalkIn Customer
    if (value === 'WalkIn Customer') {
      setInvoiceData({
        ...invoiceData,
        customerType: 'WalkIn Customer',
        customerName: '',
        customerAddress: '',
        customerContactNumber: '',
        clientId: undefined,
      });
    } else {
      setInvoiceData({
        ...invoiceData,
        customerType: 'Regular Customer',
      });
    }
  };

  return (
    <div className='space-y-3'>
      <h3 className='text-lg font-semibold'>Customer Information</h3>

      <div>
        <label className='mb-2 block text-sm font-medium text-gray-700'>
          Customer Type
        </label>
        <div className='flex items-center space-x-3'>
          {['WalkIn Customer', 'Regular Customer'].map((type) => (
            <label key={type} className='flex cursor-pointer items-center'>
              <input
                type='radio'
                name='customerType'
                value={type}
                checked={invoiceData.customerType === type}
                onChange={handleCustomerTypeChange}
                className='peer sr-only'
              />
              <div className='relative h-4 w-4'>
                <div
                  className={`flex h-4 w-4 items-center justify-center rounded-full border-2 transition-all duration-200 ${
                    invoiceData.customerType === type
                      ? 'border-blue-600'
                      : 'border-gray-300'
                  }`}
                  style={{
                    background:
                      invoiceData.customerType === type
                        ? 'linear-gradient(135deg, rgb(30, 58, 138), rgb(29, 78, 216), rgb(37, 99, 235))'
                        : 'transparent',
                    boxShadow:
                      invoiceData.customerType === type
                        ? '0 0 0 2px rgba(37, 99, 235, 0.2)'
                        : 'none',
                  }}
                >
                  {invoiceData.customerType === type && (
                    <div className='h-2 w-2 rounded-full bg-white' />
                  )}
                </div>
              </div>
              <span className='ml-2 text-sm text-gray-700'>
                {type === 'WalkIn Customer'
                  ? 'Walk-in Customer'
                  : 'Regular Customer'}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Regular Customer Dropdown */}
      {invoiceData.customerType === 'Regular Customer' && (
        <div>
          <Dropdown
            key={invoiceData.customerType}
            className='mt-2'
            options={customers.map((customer) => ({
              label: customer.customerName,
              value: customer.id.toString(),
            }))}
            defaultValue={invoiceData.clientId?.toString() || ''}
            onSelect={(option) => {
              const selectedCustomer = customers.find(
                (c) => c.id.toString() === option.value
              );
              if (selectedCustomer) {
                setInvoiceData({
                  ...invoiceData,
                  customerName: selectedCustomer.customerName,
                  customerAddress: selectedCustomer.address,
                  customerContactNumber: selectedCustomer.phoneNumber,
                  clientId: selectedCustomer.id,
                });
              }
            }}
            placeholder='Select Regular Customer'
          />
        </div>
      )}

      {/* Customer Name - different for WalkIn vs Regular */}
      {invoiceData.customerType === 'WalkIn Customer' ? (
        <div>
          <CustomerNameAutocomplete
            label='Customer Name'
            name='customerName'
            value={invoiceData.customerName || ''}
            required
            minLength={1}
            maxLength={100}
            onChange={handleCustomerNameChange}
            placeholder="Enter customer name or use '-' for walk-in"
          />
        </div>
      ) : (
        <div>
          <label className='mb-1 block text-sm font-medium text-gray-700'>
            Customer Name *
          </label>
          <input
            type='text'
            value={invoiceData.customerName || ''}
            onChange={(e) =>
              setInvoiceData({
                ...invoiceData,
                customerName: e.target.value,
              })
            }
            className='w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500'
            required
            minLength={1}
            readOnly={
              invoiceData.customerType === 'Regular Customer' &&
              !!invoiceData.clientId
            }
            placeholder={
              invoiceData.customerType === 'Regular Customer' &&
              !invoiceData.clientId
                ? 'Select a customer above'
                : 'Enter customer name or use "-" for walk-in'
            }
          />
        </div>
      )}

      {/* Customer Contact Number */}
      <div>
        <label className='mb-1 block text-sm font-medium text-gray-700'>
          Phone Number
        </label>
        <input
          type='tel'
          value={invoiceData.customerContactNumber || ''}
          onChange={(e) =>
            setInvoiceData({
              ...invoiceData,
              customerContactNumber: e.target.value,
            })
          }
          className='w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500'
          readOnly={
            invoiceData.customerType === 'Regular Customer' &&
            !!invoiceData.clientId
          }
          maxLength={20}
          placeholder={
            invoiceData.customerType === 'Regular Customer' &&
            !invoiceData.clientId
              ? 'Select a customer above'
              : 'Enter phone number (optional)'
          }
        />
      </div>

      {/* Customer Address */}
      <div>
        <label className='mb-1 block text-sm font-medium text-gray-700'>
          Address
        </label>
        <textarea
          value={invoiceData.customerAddress || ''}
          onChange={(e) =>
            setInvoiceData({
              ...invoiceData,
              customerAddress: e.target.value,
            })
          }
          rows={3}
          className='w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500'
          required
          minLength={1}
          readOnly={
            invoiceData.customerType === 'Regular Customer' &&
            !!invoiceData.clientId
          }
          placeholder={
            invoiceData.customerType === 'Regular Customer' &&
            !invoiceData.clientId
              ? 'Select a customer above'
              : 'Enter address or use "-" if not specified'
          }
        />
      </div>
    </div>
  );
};
