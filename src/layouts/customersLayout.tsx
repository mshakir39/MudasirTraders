'use client';
import React from "react";
import { FaEye } from 'react-icons/fa';
import Table from "@/components/table";
import Modal from '@/components/modal';
import Input from '@/components/customInput';
import Button from '@/components/button';
import CustomerInvoicesModal from '@/components/customer/CustomerInvoicesModal';
import { createCustomer, getCustomers } from '@/actions/customerActions';
import { toast } from 'react-toastify';
import { ColumnDef } from '@tanstack/react-table';

interface CustomerData {
  customerName: string;
  phoneNumber: string;
  address: string;
}

const CustomersLayout = ({ customers }: { customers: any[] }) => {
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [isInvoicesModalOpen, setIsInvoicesModalOpen] = React.useState(false);
  const [selectedCustomer, setSelectedCustomer] = React.useState<any>(null);
  const [form, setForm] = React.useState({ name: '', contactInfo: '', address: '' });
  const [customerList, setCustomerList] = React.useState(customers);
  const [isLoading, setIsLoading] = React.useState(false);

  // Updated columns with "View Invoices" button
  const columns = React.useMemo<ColumnDef<any>[]>(() => [
    { 
      accessorKey: "name",
      header: "Name",
    },
    { 
      accessorKey: "contactInfo",
      header: "Contact Info",
    },
    { 
      accessorKey: "address",
      header: "Address",
    },
    { 
      accessorKey: "createdDate",
      header: "Created Date",
      cell: ({ row }) => new Date(row.original.createdDate).toLocaleString()
    },
    {
      id: "viewInvoices",
      header: "Invoices",
      cell: ({ row }) => (
        <div className='flex h-full w-full items-center justify-center'>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleViewInvoices(row.original);
            }}
            className='flex items-center gap-2 px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded text-sm transition-colors'
            title="View Customer Invoices"
          >
            <FaEye size={12} />
            View Invoices
          </button>
        </div>
      ),
    },
  ], []);

  const handleViewInvoices = (customer: any) => {
    setSelectedCustomer(customer);
    setIsInvoicesModalOpen(true);
  };

  const handleCloseInvoicesModal = () => {
    setIsInvoicesModalOpen(false);
    setSelectedCustomer(null);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.contactInfo) {
      toast.error('Name and Contact Info are required');
      return;
    }

    setIsLoading(true);
    try {
      const customerData: CustomerData = {
        customerName: form.name,
        phoneNumber: form.contactInfo,
        address: form.address,
      };

      const result = await createCustomer(customerData);
      if (!result.success) {
        throw new Error(result.error || 'Failed to create customer');
      }

      // Refresh customers list
      const customersResult = await getCustomers();
      if (customersResult.success && Array.isArray(customersResult.data)) {
        setCustomerList(customersResult.data);
      }

      setIsModalOpen(false);
      setForm({ name: '', contactInfo: '', address: '' });
      toast.success('Customer created successfully');
    } catch (error) {
      console.error('Error creating customer:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create customer');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className='md:p-6 p-0 py-6'>
      <h1 className="text-2xl font-bold">Customers</h1>
      
      <Table
        data={customerList}
        columns={columns}
        enableSearch={true}
        searchPlaceholder="Search customers..."
        buttonTitle="Create Customer"
        buttonOnClick={() => setIsModalOpen(true)}
        showButton={true}
      />

      {/* Create Customer Modal */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => {
          setIsModalOpen(false);
          setForm({ name: '', contactInfo: '', address: '' });
        }} 
        title="Create Customer"
      >
        <form onSubmit={handleCreate} className="flex flex-col gap-4 mt-4">
          <Input 
            label="Name" 
            name="name" 
            value={form.name} 
            onChange={handleChange} 
            required 
          />
          <Input 
            label="Contact Info" 
            name="contactInfo" 
            value={form.contactInfo} 
            onChange={handleChange} 
            required 
          />
          <Input 
            label="Address" 
            name="address" 
            value={form.address} 
            onChange={handleChange} 
          />
          <Button 
            className="w-fit" 
            type="submit" 
            text="Create" 
            isPending={isLoading} 
            variant="fill" 
          />
        </form>
      </Modal>

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
};

export default CustomersLayout;