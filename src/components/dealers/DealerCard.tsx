import React from 'react';
import {
  FaEdit,
  FaToggleOn,
  FaToggleOff,
  FaTrash,
  FaPlus,
  FaCreditCard,
  FaFileInvoice,
  FaMoneyBillWave,
} from 'react-icons/fa';
import { IDealer } from '@/interfaces';
import Button from '@/components/button';

interface DealerCardProps {
  dealer: IDealer;
  onEdit: (dealer: IDealer) => void;
  onToggleStatus: (dealer: IDealer) => void;
  onDelete: (dealer: IDealer) => void;
  onAddBill: (dealer: IDealer) => void;
  onAddPayment: (dealer: IDealer) => void;
  onViewDetails: (dealer: IDealer) => void;
}

const DealerCard: React.FC<DealerCardProps> = ({
  dealer,
  onEdit,
  onToggleStatus,
  onDelete,
  onAddBill,
  onAddPayment,
  onViewDetails,
}) => {
  return (
    <div className='rounded-lg bg-white p-6 shadow-md'>
      <div className='mb-4 flex items-start justify-between'>
        <div className='flex-1'>
          <h3 className='text-lg font-semibold text-secondary-900'>
            {dealer.dealerName}
          </h3>
          <p className='text-sm text-secondary-500'>
            {dealer.businessType || 'Supplier'}
          </p>
          <div
            className={`mt-2 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
              dealer.isActive
                ? 'bg-success-100 text-success-800'
                : 'bg-error-100 text-error-800'
            }`}
          >
            {dealer.isActive ? 'Active' : 'Inactive'}
          </div>
        </div>
      </div>

      <div className='mb-4 space-y-2'>
        {dealer.contactPerson && (
          <div className='flex justify-between'>
            <span className='text-sm text-secondary-600'>Contact:</span>
            <span className='text-sm font-medium'>{dealer.contactPerson}</span>
          </div>
        )}
        {dealer.phone && (
          <div className='flex justify-between'>
            <span className='text-sm text-secondary-600'>Phone:</span>
            <span className='text-sm font-medium'>{dealer.phone}</span>
          </div>
        )}
        {dealer.email && (
          <div className='flex justify-between'>
            <span className='text-sm text-secondary-600'>Email:</span>
            <span className='text-sm font-medium'>{dealer.email}</span>
          </div>
        )}
      </div>

      {/* Last Payment Date */}
      <div className='mb-4'>
        <div className='flex justify-between'>
          <span className='text-sm text-secondary-600'>Last Payment:</span>
          <span className='text-sm font-medium'>{dealer.lastPaymentDate}</span>
        </div>
        <div className='mt-2 flex justify-between'>
          <span className='text-sm text-secondary-600'>First Payment:</span>
          <span className='text-sm font-medium'>{dealer.firstPaymentDate}</span>
        </div>
      </div>

      {/* Current Bill Information */}
      {dealer.currentBillId && (
        <div className='mb-4 border-t pt-4'>
          <div className='mb-2 flex items-center gap-2'>
            <FaFileInvoice className='text-primary-600' />
            <span className='text-sm font-semibold text-secondary-900'>
              Current Bill
            </span>
            {dealer.isOverdue && (
              <span className='rounded-full bg-error-100 px-2 py-1 text-xs text-error-800'>
                Overdue
              </span>
            )}
          </div>
          <div className='space-y-1 text-sm'>
            <div className='flex justify-between'>
              <span className='text-secondary-600'>Bill Amount:</span>
              <span className='font-medium'>
                Rs{' '}
                {(dealer.currentBillAmount || 0).toLocaleString('en-PK', {
                  maximumFractionDigits: 0,
                })}
              </span>
            </div>
            <div className='flex justify-between'>
              <span className='text-secondary-600'>Outstanding:</span>
              <span className='font-medium' style={{ color: '#dc2626' }}>
                Rs{' '}
                {(dealer.currentBillOutstanding || 0).toLocaleString('en-PK', {
                  maximumFractionDigits: 0,
                })}
              </span>
            </div>
            {dealer.currentBillDueDate && (
              <div className='flex justify-between'>
                <span className='text-secondary-600'>Due Date:</span>
                <span className='font-medium'>{dealer.currentBillDueDate}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Bills Summary Section */}
      <div className='mb-4 border-t pt-4'>
        <div className='mb-3 flex items-center justify-between'>
          <div className='flex items-center gap-2'>
            <FaMoneyBillWave className='text-primary-600' />
            <span className='text-sm font-semibold text-secondary-900'>
              Bills Summary
            </span>
          </div>
          <div className='flex gap-2'>
            <Button
              variant='outline'
              text='Add Bill'
              icon={<FaPlus />}
              onClick={() => onAddBill(dealer)}
              className='px-2 py-1 text-xs !text-success-600 hover:!bg-success-50'
            />
            <Button
              variant='outline'
              text='Add Payment'
              icon={<FaCreditCard />}
              onClick={() => onAddPayment(dealer)}
              className='px-2 py-1 text-xs !text-accent-600 hover:!bg-accent-50'
            />
            <Button
              variant='outline'
              text='View Details'
              icon={<FaFileInvoice />}
              onClick={() => onViewDetails(dealer)}
              className='px-2 py-1 text-xs !text-primary-600 hover:!bg-primary-50'
            />
          </div>
        </div>
        <div className='grid grid-cols-3 gap-2 text-center'>
          <div className='rounded bg-secondary-50 p-2'>
            <div className='text-xs text-secondary-500'>Total Bills</div>
            <div className='text-sm font-semibold text-secondary-900'>
              {dealer.totalBillsCount || 0}
            </div>
          </div>
          <div className='rounded bg-success-50 p-2'>
            <div className='text-xs text-secondary-500'>Total Paid</div>
            <div className='text-sm font-semibold' style={{ color: '#059669' }}>
              Rs{' '}
              {(dealer.totalPaidAllTime || 0).toLocaleString('en-PK', {
                maximumFractionDigits: 0,
              })}
            </div>
          </div>
          <div className='rounded bg-error-50 p-2'>
            <div className='text-xs text-secondary-500'>Outstanding</div>
            <div className='text-sm font-semibold' style={{ color: '#dc2626' }}>
              Rs{' '}
              {(dealer.currentBillOutstanding || 0).toLocaleString('en-PK', {
                maximumFractionDigits: 0,
              })}
            </div>
          </div>
        </div>
      </div>

      <div className='flex flex-wrap gap-2'>
        <Button
          variant='outline'
          text='Edit'
          icon={<FaEdit />}
          onClick={() => onEdit(dealer)}
          className='px-3 py-2 text-xs'
        />
        <Button
          variant='outline'
          text={dealer.isActive ? 'Deactivate' : 'Activate'}
          icon={dealer.isActive ? <FaToggleOff /> : <FaToggleOn />}
          onClick={() => onToggleStatus(dealer)}
          className={`px-3 py-2 text-xs ${
            dealer.isActive
              ? '!text-warning-600 hover:!bg-warning-50'
              : '!text-success-600 hover:!bg-success-50'
          }`}
        />
        <Button
          variant='outline'
          text='Delete'
          icon={<FaTrash />}
          onClick={() => onDelete(dealer)}
          className='px-3 py-2 text-xs !text-error-600 hover:!bg-error-50'
        />
      </div>
    </div>
  );
};

export default DealerCard;
