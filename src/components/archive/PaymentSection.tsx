import React from 'react';
import Input from '@/components/customInput';

interface PaymentSectionProps {
  invoiceData: any;
  onChange: (field: string, value: any) => void;
  setInvoiceData: (data: any) => void;
  accordionData: any;
}

const PaymentSection: React.FC<PaymentSectionProps> = ({
  invoiceData,
  onChange,
  setInvoiceData,
  accordionData,
}) => {
  const totalAmount =
    invoiceData.products?.reduce(
      (sum: number, product: any) => sum + (product.totalPrice || 0),
      0
    ) || 0;

  const receivedAmount = invoiceData.receivedAmount || 0;
  const batteriesRate = invoiceData.batteriesRate || 0;
  const remainingAmount = totalAmount - receivedAmount - batteriesRate;

  const handlePaymentMethodChange = (method: string, checked: boolean) => {
    const currentMethods = invoiceData.paymentMethod || [];
    let updatedMethods;

    if (checked) {
      updatedMethods = [...currentMethods, method];
    } else {
      updatedMethods = currentMethods.filter((m: string) => m !== method);
    }

    onChange('paymentMethod', updatedMethods);
  };

  return (
    <div className='space-y-4'>
      <h3 className='text-lg font-semibold'>Payment Details</h3>

      <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
        <div>
          <label className='mb-1 block text-sm font-medium text-gray-700'>
            Total Amount
          </label>
          <Input
            type='number'
            value={totalAmount}
            disabled
            className='bg-gray-50'
          />
        </div>

        <div>
          <label className='mb-1 block text-sm font-medium text-gray-700'>
            Received Amount
          </label>
          <Input
            type='number'
            value={receivedAmount}
            onChange={(e) =>
              onChange('receivedAmount', parseFloat(e.target.value) || 0)
            }
            placeholder='Enter received amount'
          />
        </div>

        <div>
          <label className='mb-1 block text-sm font-medium text-gray-700'>
            Battery Rate
          </label>
          <Input
            type='number'
            value={batteriesRate}
            onChange={(e) =>
              onChange('batteriesRate', parseFloat(e.target.value) || 0)
            }
            placeholder='Enter battery rate'
          />
        </div>

        <div>
          <label className='mb-1 block text-sm font-medium text-gray-700'>
            Remaining Amount
          </label>
          <Input
            type='number'
            value={remainingAmount}
            disabled
            className='bg-gray-50'
          />
        </div>
      </div>

      <div>
        <label className='mb-2 block text-sm font-medium text-gray-700'>
          Payment Method
        </label>
        <div className='space-y-2'>
          {['Cash', 'Bank Transfer', 'Cheque', 'Old Battery'].map((method) => (
            <label key={method} className='flex items-center'>
              <input
                type='checkbox'
                checked={invoiceData.paymentMethod?.includes(method) || false}
                onChange={(e) =>
                  handlePaymentMethodChange(method, e.target.checked)
                }
                className='mr-2'
              />
              <span className='text-sm'>{method}</span>
            </label>
          ))}
        </div>
      </div>

      <div className='mt-4 rounded bg-gray-50 p-3'>
        <div className='text-sm text-gray-600'>
          <div>Total: Rs {totalAmount.toLocaleString()}</div>
          <div>Received: Rs {receivedAmount.toLocaleString()}</div>
          {batteriesRate > 0 && (
            <div>Battery: Rs {batteriesRate.toLocaleString()}</div>
          )}
          <div
            className={`font-semibold ${remainingAmount > 0 ? 'text-red-600' : 'text-green-600'}`}
          >
            Remaining: Rs {remainingAmount.toLocaleString()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentSection;
