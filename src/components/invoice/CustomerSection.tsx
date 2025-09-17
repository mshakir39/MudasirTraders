import React, { useState, useEffect } from 'react';
import Input from '@/components/customInput';
import Dropdown from '@/components/dropdown';
import CustomerNameAutocomplete from '@/components/CustomerNameAutocomplete';
import { getAllInvoices } from '@/getData/getInvoices';

interface CustomerSectionProps {
  invoiceData: any;
  setInvoiceData: (data: any) => void;
  customers: any[];
  onChange: (e: any) => void;
}

const CustomerSection: React.FC<CustomerSectionProps> = ({
  invoiceData,
  setInvoiceData,
  customers,
  onChange,
}) => {
  const [allInvoices, setAllInvoices] = useState<any[]>([]);

  // Fetch invoice data to get customer information
  useEffect(() => {
    const fetchInvoiceData = async () => {
      try {
        const invoices = await getAllInvoices();
        if (Array.isArray(invoices)) {
          setAllInvoices(invoices);
        } else {
          setAllInvoices([]);
        }
      } catch (error) {
        console.error('Error fetching invoice data:', error);
        setAllInvoices([]);
      }
    };

    fetchInvoiceData();
  }, []);

  // Handle customer name change for walk-in customers
  const handleCustomerNameChange = (e: { target: { name: string; value: string; customerInfo?: any } }) => {
    const customerName = e.target.value;
    const customerInfo = e.target.customerInfo;
    
    if (customerInfo) {
      // Auto-fill customer details from the selected customer info
      setInvoiceData((prev: any) => ({
        ...prev,
        customerName: customerName,
        customerAddress: customerInfo.address || prev.customerAddress || '',
        customerContactNumber: customerInfo.contactNumber || prev.customerContactNumber || '',
      }));
    } else {
      // Find the most recent invoice for this customer to get their details
      // First try to find by exact name match
      let customerInvoice = allInvoices.find(
        (invoice) => invoice.customerName === customerName
      );
      
      // If not found by name, try to find by partial name match (in case of typos)
      if (!customerInvoice) {
        customerInvoice = allInvoices.find(
          (invoice) => invoice.customerName.toLowerCase().includes(customerName.toLowerCase())
        );
      }
      
      if (customerInvoice) {
        // Auto-fill customer details from invoice data
        setInvoiceData((prev: any) => ({
          ...prev,
          customerName: customerName,
          customerAddress: customerInvoice.customerAddress || prev.customerAddress || '',
          customerContactNumber: customerInvoice.customerContactNumber || prev.customerContactNumber || '',
        }));
      } else {
        // Just update the customer name if no previous data found
        onChange(e);
      }
    }
  };
  return (
    <>
      <div className='mt-2 flex gap-4'>
        <label className='flex items-center gap-2'>
          <input
            type='radio'
            name='customerType'
            value='WalkIn Customer'
            checked={invoiceData?.customerType === 'WalkIn Customer'}
            onChange={onChange}
          />
          Walk-In Customer
        </label>
        <label className='flex items-center gap-2'>
          <input
            type='radio'
            name='customerType'
            value='Regular'
            checked={invoiceData?.customerType === 'Regular'}
            onChange={onChange}
          />
          Regular Customer
        </label>
      </div>

      {invoiceData?.customerType === 'Regular' && (
        <div>
          <Dropdown
            key={invoiceData.customerType}
            className='mt-2'
            options={customers.map((customer) => ({
              label: customer.customerName,
              value: customer.id.toString(),
            }))}
            defaultValue={invoiceData.customerId?.toString() || ''}
            onSelect={(option) => {
              const selectedCustomer = customers.find(
                (c) => c.id.toString() === option.value
              );
              if (selectedCustomer) {
                console.log('selectedCustomer', selectedCustomer);
                setInvoiceData((prev: any) => ({
                  ...prev,
                  customerName: selectedCustomer.customerName,
                  customerAddress: selectedCustomer.address,
                  customerContactNumber: selectedCustomer.phoneNumber,
                  clientName: selectedCustomer.customerName,
                  customerId: selectedCustomer.id, // Ensure it's a number
                }));
              }
            }}
            placeholder='Select Regular Customer'
          />
        </div>
      )}

      {invoiceData?.customerType === 'WalkIn Customer' ? (
        <CustomerNameAutocomplete
          label='Customer Name'
          name='customerName'
          value={invoiceData?.customerName || ''}
          required
          minLength={2}
          maxLength={100}
          onChange={handleCustomerNameChange}
          placeholder='Enter customer name or use "-" for walk-in'
        />
      ) : (
        <Input
          type='text'
          label='Customer Name'
          name='customerName'
          value={invoiceData?.customerName || ''}
          required
          minLength={2}
          maxLength={100}
          onChange={onChange}
          readOnly={
            invoiceData?.customerType === 'Regular' && !!invoiceData?.customerId
          }
          placeholder={
            invoiceData?.customerType === 'Regular' && !invoiceData?.customerId
              ? 'Select a customer above'
              : 'Enter customer name or use "-" for walk-in'
          }
        />
      )}

      <Input
        type='text'
        label='Customer Address'
        name='customerAddress'
        value={invoiceData?.customerAddress || ''}
        minLength={1}
        maxLength={200}
        onChange={onChange}
        readOnly={
          invoiceData?.customerType === 'Regular' && !!invoiceData?.customerId
        }
        placeholder={
          invoiceData?.customerType === 'Regular' && !invoiceData?.customerId
            ? 'Select a customer above'
            : 'Enter address or use "-" if not specified'
        }
      />

      <Input
        type='tel'
        label='Contact Number'
        name='customerContactNumber'
        value={invoiceData?.customerContactNumber || ''}
        pattern='[0-9+\-\s]+'
        maxLength={20}
        onChange={onChange}
        readOnly={
          invoiceData?.customerType === 'Regular' && !!invoiceData?.customerId
        }
        placeholder={
          invoiceData?.customerType === 'Regular' && !invoiceData?.customerId
            ? 'Select a customer above'
            : 'Enter phone number or use "-" if not provided'
        }
      />
    </>
  );
};

export default CustomerSection;
