'use client';

import React, { useState } from 'react';
import Modal from '@/components/modal';

interface HistoryEntry {
  brandName: string;
  series: string;
  oldQuantity: number;
  newQuantity: number;
  quantityDifference: number;
  oldCost: number;
  newCost: number;
  costDifference: number;
  historyDate: string;
}

interface StockHistoryModalProps {
  isOpen: boolean;
  isLoading: boolean;
  stockHistory: HistoryEntry[];
  onClose: () => void;
}

function DiffBadge({ value }: { value: number }) {
  const cls =
    value > 0
      ? 'bg-green-100 text-green-800'
      : value < 0
        ? 'bg-red-100 text-red-800'
        : 'bg-gray-100 text-gray-800';
  return (
    <span className={`rounded px-2 py-1 text-xs ${cls}`}>
      {value > 0 ? '+' : ''}
      {value}
    </span>
  );
}

export function StockHistoryModal({
  isOpen,
  isLoading,
  stockHistory,
  onClose,
}: StockHistoryModalProps) {
  const [selectedEntry, setSelectedEntry] = useState<HistoryEntry | null>(null);

  const handleClose = () => {
    setSelectedEntry(null);
    onClose();
  };

  return (
    <Modal
      size='large'
      isOpen={isOpen}
      onClose={handleClose}
      title='Stock History'
    >
      <div className='max-h-[80vh] overflow-y-auto'>
        {isLoading ? (
          <div className='flex items-center justify-center py-8'>
            <div className='h-8 w-8 animate-spin rounded-full border-b-2 border-blue-500' />
          </div>
        ) : stockHistory.length === 0 ? (
          <div className='py-8 text-center text-gray-500'>
            No stock history available
          </div>
        ) : !selectedEntry ? (
          <div className='grid gap-4'>
            {stockHistory.map((entry, index) => (
              <div
                key={index}
                className='cursor-pointer rounded-lg border p-4 hover:bg-gray-50'
                onClick={() => setSelectedEntry(entry)}
              >
                <div className='flex items-center justify-between'>
                  <div>
                    <h3 className='font-medium'>
                      {entry.brandName} - {entry.series}
                    </h3>
                    <div className='mt-1 text-sm text-gray-500'>
                      <span className='mr-4'>
                        Quantity: {entry.oldQuantity} → {entry.newQuantity} (
                        {entry.quantityDifference > 0 ? '+' : ''}
                        {entry.quantityDifference})
                      </span>
                      <span>
                        Cost: Rs {entry.oldCost} → Rs {entry.newCost} (
                        {entry.costDifference > 0 ? '+' : ''}Rs{' '}
                        {entry.costDifference})
                      </span>
                    </div>
                  </div>
                  <div className='text-right'>
                    <p className='text-sm text-gray-600'>
                      {new Date(entry.historyDate).toLocaleDateString()}
                    </p>
                    <p className='text-xs text-gray-500'>
                      {new Date(entry.historyDate).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div>
            <button
              onClick={() => setSelectedEntry(null)}
              className='mb-4 flex items-center gap-1 text-blue-600 hover:text-blue-800'
            >
              <svg
                xmlns='http://www.w3.org/2000/svg'
                className='h-4 w-4'
                fill='none'
                viewBox='0 0 24 24'
                stroke='currentColor'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M15 19l-7-7 7-7'
                />
              </svg>
              Back to History List
            </button>

            <div className='mb-4 border-l-4 border-yellow-400 bg-yellow-50 p-4'>
              <p className='text-sm text-yellow-700'>
                This is a historical view from{' '}
                {new Date(selectedEntry.historyDate).toLocaleString()}
              </p>
            </div>

            <div className='rounded-lg bg-white p-4 shadow'>
              <div className='grid grid-cols-2 gap-4 md:grid-cols-4'>
                <div>
                  <span className='text-sm text-gray-500'>Brand</span>
                  <p className='font-medium text-gray-900'>
                    {selectedEntry.brandName}
                  </p>
                </div>
                <div>
                  <span className='text-sm text-gray-500'>Series</span>
                  <p className='font-medium text-gray-900'>
                    {selectedEntry.series}
                  </p>
                </div>
                <div>
                  <span className='text-sm text-gray-500'>Quantity Change</span>
                  <div className='flex items-center gap-2'>
                    <span className='text-red-600'>
                      {selectedEntry.oldQuantity}
                    </span>
                    <span>→</span>
                    <span className='font-medium text-green-600'>
                      {selectedEntry.newQuantity}
                    </span>
                    <DiffBadge value={selectedEntry.quantityDifference} />
                  </div>
                </div>
                <div>
                  <span className='text-sm text-gray-500'>Cost Change</span>
                  <div className='flex items-center gap-2'>
                    <span className='text-red-600'>
                      Rs {selectedEntry.oldCost}
                    </span>
                    <span>→</span>
                    <span className='font-medium text-green-600'>
                      Rs {selectedEntry.newCost}
                    </span>
                    <span
                      className={`rounded px-2 py-1 text-xs ${selectedEntry.costDifference > 0 ? 'bg-green-100 text-green-800' : selectedEntry.costDifference < 0 ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'}`}
                    >
                      {selectedEntry.costDifference > 0 ? '+' : ''}Rs{' '}
                      {selectedEntry.costDifference}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
