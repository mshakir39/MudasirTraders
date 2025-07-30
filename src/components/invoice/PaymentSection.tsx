import React, { useCallback, useMemo } from 'react';
import { FaPlus } from 'react-icons/fa6';

import CheckboxGroup from '@/components/checkboxGroup';
import Input from '@/components/customInput';

const options = [
  { id: 'Cash', value: 'Cash', label: 'Cash' },
  { id: 'Card', value: 'Card', label: 'Card' },
  { id: 'Old Battery', value: 'Old Battery', label: 'Old Battery' },
  { id: 'Easy Paisa', value: 'Easy Paisa', label: 'Easy Paisa' },
  { id: 'Jazz Cash', value: 'Jazz Cash', label: 'Jazz Cash' },
  { id: 'Bank', value: 'Bank', label: 'Bank' },
  { id: 'Cheque', value: 'Cheque', label: 'Cheque' },
  { id: 'Pay Later', value: 'Pay Later', label: 'Pay Later' },
  { id: 'Other', value: 'Other', label: 'Other' },
];

interface PaymentSectionProps {
  invoiceData: any;
  onChange: (e: any) => void;
  setInvoiceData: (data: any) => void;
  accordionData: any;
}

const PaymentSection: React.FC<PaymentSectionProps> = ({
  invoiceData,
  onChange,
  setInvoiceData,
  accordionData,
}) => {
  // Calculate total amount from all products
  const totalAmount = useMemo(() => {
    return Object.values(accordionData).reduce((total: number, row: any) => {
      const price = parseFloat(String(row.productPrice)) || 0;
      const quantity = parseInt(String(row.quantity)) || 0;
      return total + (price * quantity);
    }, 0);
  }, [accordionData]);

  const handleCheckboxChange = useCallback(
    (values: string[]) => {
      console.log('Payment methods selected:', values);
      
      // FIXED: More robust state update with validation
      setInvoiceData((prev: any) => {
        const newState = {
          ...prev,
          paymentMethod: values,
        };
        
        console.log('Updated invoice data:', newState);
        return newState;
      });
    },
    [setInvoiceData]
  );

  const handleAddTotalAmount = useCallback(() => {
    setInvoiceData((prev: any) => ({
      ...prev,
      receivedAmount: totalAmount.toString(),
    }));
  }, [setInvoiceData, totalAmount]);

  // FIXED: Ensure paymentMethod is always an array
  const currentPaymentMethods = Array.isArray(invoiceData?.paymentMethod) 
    ? invoiceData.paymentMethod 
    : [];

  return (
    <>
      <div className='flex flex-col gap-2'>
        <span className='text-sm font-medium text-gray-700'>
          Payment Method: <span className="text-red-500">*</span>
        </span>
        <div className="p-4 bg-gray-50 rounded-md">
          <CheckboxGroup
            options={options}
            onChange={handleCheckboxChange}
            checkedValues={currentPaymentMethods}
          />
        </div>
      </div>

      <div className='flex w-full'>
        {currentPaymentMethods.includes('Old Battery') && (
          <div className='flex w-full gap-2'>
            <div className='mt-1 w-full'>
              <Input
                type='text'
                label='Battery Count and Weight'
                name='batteriesCountAndWeight'
                maxLength={50}
                onChange={onChange}
              />
            </div>
            <div className='mt-1 w-full'>
              <Input
                type='number'
                label='Batteries Total Rate'
                name='batteriesRate'
                min={0}
                step="0.01"
                onChange={onChange}
              />
            </div>
          </div>
        )}
      </div>

      <div className='mt-1'>
        <div className='flex items-center gap-4 mb-2'>
          <span className='text-sm font-medium text-gray-600'>
            Total Amount: Rs {totalAmount.toFixed(2)}
          </span>
          <button
            type="button"
            onClick={handleAddTotalAmount}
            className='flex items-center justify-center w-6 h-6 bg-blue-500 hover:bg-blue-600 text-white rounded-full transition-colors duration-200 cursor-pointer'
            title="Add total amount to received amount"
          >
            <FaPlus className='text-xs' />
          </button>
        </div>
        
        {currentPaymentMethods.includes('Pay Later') && (
          <div className="mb-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              💡 <strong>Pay Later:</strong> Customer can pay any amount now and the remaining balance can be paid later using the "Add Payment" button.
            </p>
          </div>
        )}
        
        <Input
          type='number'
          label='Amount Received'
          name='receivedAmount'
          value={invoiceData?.receivedAmount || ''}
          min={0}
          max={totalAmount}
          step="0.01"
          onChange={onChange}
          placeholder={`Max: Rs ${totalAmount.toFixed(2)}`}
        />
      </div>
    </>
  );
};

export default PaymentSection;