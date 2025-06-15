import React, { useCallback, useMemo } from 'react';
import { FaPlus } from 'react-icons/fa6';

const CheckboxGroup = React.lazy(() => import('@/components/checkboxGroup'));
const Input = React.lazy(() => import('@/components/customInput'));

const options = [
  { id: 'Credit', value: 'Credit', label: 'Credit' },
  { id: 'Old Battery', value: 'Old Battery', label: 'Old Battery' },
  { id: 'Easy Paisa', value: 'Easy Paisa', label: 'Easy Paisa' },
  { id: 'Jazz Cash', value: 'Jazz Cash', label: 'Jazz Cash' },
  { id: 'Bank', value: 'Bank', label: 'Bank' },
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
      setInvoiceData((prev: any) => ({
        ...prev,
        paymentMethod: values,
      }));
    },
    [setInvoiceData]
  );

  const handleAddTotalAmount = useCallback(() => {
    setInvoiceData((prev: any) => ({
      ...prev,
      receivedAmount: totalAmount.toString(),
    }));
  }, [setInvoiceData, totalAmount]);

  return (
    <>
      <div className='flex flex-col'>
        <span className='text-sm font-medium text-gray-500'>
          Payment Method: <span className="text-red-500">*</span>
        </span>
        <CheckboxGroup
          options={options}
          onChange={(value) => handleCheckboxChange(value)}
        />
      </div>

      <div className='flex w-full'>
        {invoiceData?.paymentMethod?.includes('Old Battery') && (
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