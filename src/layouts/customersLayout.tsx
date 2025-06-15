'use client';
import React from "react";
import { FaEye } from 'react-icons/fa';
import DataGridDemo from "@/components/dataGrid";
import Modal from '@/components/modal';
import Input from '@/components/customInput';
import Button from '@/components/button';
import CustomerInvoicesModal from '@/components/customer/CustomerInvoicesModal';

const CustomersLayout = ({ customers }: { customers: any[] }) => {
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [isInvoicesModalOpen, setIsInvoicesModalOpen] = React.useState(false);
  const [selectedCustomer, setSelectedCustomer] = React.useState<any>(null);
  const [form, setForm] = React.useState({ name: '', contactInfo: '', address: '' });
  const [customerList, setCustomerList] = React.useState(customers);
  const [isLoading, setIsLoading] = React.useState(false);

  // Updated columns with "View Invoices" button
  const columns = [
    { field: "name", headerName: "Name", width: 200 },
    { field: "contactInfo", headerName: "Contact Info", width: 250 },
    { field: "address", headerName: "Address", width: 250 },
    { 
      field: "createdDate", 
      headerName: "Created Date", 
      width: 180, 
      renderCell: (item: any) => new Date(item.row.createdDate).toLocaleString() 
    },
    {
      field: "viewInvoices",
      headerName: "Invoices",
      width: 120,
      renderCell: (item: any) => (
        <div className='flex h-full w-full items-center justify-center'>
          <button
            onClick={() => handleViewInvoices(item.row)}
            className='flex items-center gap-2 px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded text-sm transition-colors'
            title="View Customer Invoices"
          >
            <FaEye size={12} />
            View Invoices
          </button>
        </div>
      ),
    },
  ];

  const handleChange = (e: any) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleCreate = async (e: any) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const res = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      
      if (res.ok) {
        // Refresh customer list
        const updated = await fetch('/api/customers');
        const data = await updated.json();
        setCustomerList(data);
        
        // Reset form and close modal
        setForm({ name: '', contactInfo: '', address: '' });
        setIsModalOpen(false);
      }
    } catch (error) {
      console.error('Error creating customer:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewInvoices = (customer: any) => {
    setSelectedCustomer(customer);
    setIsInvoicesModalOpen(true);
  };

  const handleCloseInvoicesModal = () => {
    setIsInvoicesModalOpen(false);
    setSelectedCustomer(null);
  };

  const rows = customerList.map((client, idx) => ({ 
    id: client.id || idx, 
    ...client 
  }));

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Customers</h1>
      
      <DataGridDemo
        rows={rows}
        columns={columns}
        buttonTitle="Create Customer"
        buttonOnClick={() => setIsModalOpen(true)}
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