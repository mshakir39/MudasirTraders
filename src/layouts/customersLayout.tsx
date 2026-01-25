'use client';
import React, {
  useState,
  useMemo,
  useCallback,
  useOptimistic,
  useActionState,
} from 'react';
import { FaEye, FaTrash, FaEdit } from 'react-icons/fa';
import Table from '@/components/table';
import Modal from '@/components/modal';
import Input from '@/components/customInput';
import Button from '@/components/button';
import CustomerInvoicesModal from '@/components/customer/CustomerInvoicesModal';
import {
  createCustomer,
  getCustomers,
  deleteCustomer,
} from '@/actions/customerActions';
import { toast } from 'react-toastify';
import { ColumnDef } from '@tanstack/react-table';

interface CustomerData {
  customerName: string;
  phoneNumber: string;
  address: string;
  email?: string;
}

interface CustomersLayoutProps {
  customers: any[];
  // React 19: Add server timestamp for cache invalidation
  serverTimestamp?: number;
}

const CustomersLayout: React.FC<CustomersLayoutProps> = ({
  customers,
  serverTimestamp,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isInvoicesModalOpen, setIsInvoicesModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [form, setForm] = useState({
    customerName: '',
    phoneNumber: '',
    address: '',
    email: '',
  });
  const [customerList, setCustomerList] = useState(customers);

  // React 19: Optimistic updates for customer operations
  const [optimisticCustomers, addOptimisticCustomer] = useOptimistic(
    customers,
    (state: any, newCustomer: any) => {
      if (newCustomer.action === 'delete') {
        return state.filter((customer: any) => customer.id !== newCustomer.id);
      }
      return [newCustomer, ...state];
    }
  );

  // React 19: useActionState for form handling
  const [createState, createAction, isPending] = useActionState(
    async (prevState: any, formData: FormData) => {
      const customerName = formData.get('customerName') as string;
      const phoneNumber = formData.get('phoneNumber') as string;
      const address = formData.get('address') as string;
      const email = formData.get('email') as string;

      if (!customerName?.trim() || !phoneNumber?.trim()) {
        toast.error('Customer name and phone number are required');
        return { error: 'Customer name and phone number are required' };
      }

      try {
        // Add optimistic update
        const newCustomer = {
          customerName: customerName.trim(),
          phoneNumber: phoneNumber.trim(),
          address: address?.trim() || '',
          email: email?.trim() || '',
          createdAt: new Date(),
          id: `temp-${Date.now()}`,
        };

        addOptimisticCustomer(newCustomer);

        const result = await createCustomer({
          customerName: customerName.trim(),
          phoneNumber: phoneNumber.trim(),
          address: address?.trim() || '',
          email: email?.trim() || '',
        });

        if (!result.success) {
          throw new Error(result.error || 'Failed to create customer');
        }

        // Refresh customers list
        const customersResult = await getCustomers();
        if (customersResult.success && Array.isArray(customersResult.data)) {
          setCustomerList(customersResult.data);
        }

        setForm({ customerName: '', phoneNumber: '', address: '', email: '' });
        setIsModalOpen(false);
        toast.success('Customer created successfully');
        return { success: true };
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : 'Failed to create customer'
        );
        return {
          error:
            error instanceof Error
              ? error.message
              : 'Failed to create customer',
        };
      }
    },
    null
  );

  const handleViewInvoices = useCallback((customer: any) => {
    setSelectedCustomer(customer);
    setIsInvoicesModalOpen(true);
  }, []);

  const handleCloseInvoicesModal = useCallback(() => {
    setIsInvoicesModalOpen(false);
    setSelectedCustomer(null);
  }, []);

  // React 19: Handle customer editing
  const handleEditCustomer = useCallback((customer: any) => {
    setForm({
      customerName: customer.customerName || '',
      phoneNumber: customer.phoneNumber || '',
      address: customer.address || '',
      email: customer.email || '',
    });
    setSelectedCustomer(customer);
    setIsModalOpen(true);
  }, []);

  // React 19: Handle customer deletion
  const handleDeleteCustomer = useCallback(async (customer: any) => {
    if (!confirm('Are you sure you want to delete this customer?')) {
      return;
    }

    try {
      // Add optimistic deletion
      addOptimisticCustomer({
        action: 'delete',
        id: customer._id
      });

      const response = await fetch(`/api/customers/${customer._id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Customer deleted successfully');
        await getCustomers();
      } else {
        throw new Error('Failed to delete customer');
      }
    } catch (error) {
      console.error('Error deleting customer:', error);
      toast.error('Failed to delete customer');
    }
  }, [addOptimisticCustomer]);

  // React 19: Enhanced columns with actions and better cell rendering
  const columns = useMemo<ColumnDef<any>[]>(
    () => [
      {
        accessorKey: 'customerName',
        header: 'Customer Name',
        // React 19: Better cell rendering with automatic memoization
        cell: (info) => (
          <span className='font-medium'>{info.getValue<string>()}</span>
        ),
      },
      {
        accessorKey: 'phoneNumber',
        header: 'Phone Number',
        cell: (info) => (
          <span className='text-blue-600'>{info.getValue<string>()}</span>
        ),
      },
      {
        accessorKey: 'email',
        header: 'Email',
        cell: (info) => {
          const email = info.getValue<string>();
          return email ? (
            <a
              href={`mailto:${email}`}
              className='text-blue-500 hover:underline'
            >
              {email}
            </a>
          ) : (
            <span className='text-gray-400'>No email</span>
          );
        },
      },
      {
        accessorKey: 'address',
        header: 'Address',
        cell: (info) => {
          const address = info.getValue<string>();
          return address || <span className='text-gray-400'>No address</span>;
        },
      },
      {
        accessorKey: 'createdAt',
        header: 'Created Date',
        cell: ({ row }) => {
          const date = row.original.createdAt;
          return date ? new Date(date).toLocaleDateString() : 'N/A';
        },
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => (
          <div className='flex gap-2'>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleViewInvoices(row.original);
              }}
              className='flex items-center gap-1 rounded bg-blue-500 px-2 py-1 text-xs text-white transition-colors hover:bg-blue-600'
              title='View Customer Invoices'
            >
              <FaEye size={10} />
              Invoices
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleEditCustomer(row.original);
              }}
              className='flex items-center gap-1 rounded bg-green-500 px-2 py-1 text-xs text-white transition-colors hover:bg-green-600'
              title='Edit Customer'
            >
              <FaEdit size={10} />
              Edit
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteCustomer(row.original);
              }}
              className='flex items-center gap-1 rounded bg-red-500 px-2 py-1 text-xs text-white transition-colors hover:bg-red-600'
              title='Delete Customer'
            >
              <FaTrash size={10} />
              Delete
            </button>
          </div>
        ),
      },
    ],
    [handleViewInvoices, handleEditCustomer, handleDeleteCustomer]
  );

  return (
    <div className='p-0 py-6 md:p-6'>
      <h1 className='text-2xl font-bold'>Customers</h1>

      <Table
        data={optimisticCustomers}
        columns={columns}
        enableSearch={true}
        searchPlaceholder='Search customers...'
        buttonTitle='Create Customer'
        buttonOnClick={() => {
          setSelectedCustomer(null);
          setForm({
            customerName: '',
            phoneNumber: '',
            address: '',
            email: '',
          });
          setIsModalOpen(true);
        }}
        showButton={true}
      />

      {/* Create Customer Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setForm({
            customerName: '',
            phoneNumber: '',
            address: '',
            email: '',
          });
          setSelectedCustomer(null);
        }}
        title={selectedCustomer ? 'Edit Customer' : 'Create Customer'}
      >
        {/* React 19: Modern form with useActionState */}
        <form action={createAction} className='mt-4 flex flex-col gap-4'>
          <Input
            label='Customer Name'
            name='customerName'
            value={form.customerName}
            onChange={(e) =>
              setForm((prev: any) => ({ ...prev, customerName: e.target.value }))
            }
            required
          />
          <Input
            label='Phone Number'
            name='phoneNumber'
            value={form.phoneNumber}
            onChange={(e) =>
              setForm((prev: any) => ({ ...prev, phoneNumber: e.target.value }))
            }
            required
          />
          <Input
            label='Address'
            name='address'
            value={form.address}
            onChange={(e) =>
              setForm((prev: any) => ({ ...prev, address: e.target.value }))
            }
          />
          <Input
            label='Email'
            name='email'
            type='email'
            value={form.email}
            onChange={(e) =>
              setForm((prev: any) => ({ ...prev, email: e.target.value }))
            }
          />
          <div className='flex gap-3'>
            <Button
              type='button'
              variant='outline'
              text='Cancel'
              onClick={() => {
                setIsModalOpen(false);
                setForm({
                  customerName: '',
                  phoneNumber: '',
                  address: '',
                  email: '',
                });
                setSelectedCustomer(null);
              }}
            />
            <Button
              type='submit'
              variant='fill'
              text={
                isPending
                  ? 'Creating...'
                  : selectedCustomer
                    ? 'Update'
                    : 'Create'
              }
              disabled={isPending}
            />
          </div>
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
