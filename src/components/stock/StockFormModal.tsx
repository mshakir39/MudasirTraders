'use client';

import React from 'react';
import Modal from '@/components/modal';
import Input from '@/components/customInput';
import Button from '@/components/button';
import SeriesAutocomplete from '@/components/SeriesAutocomplete';
import { EditData, FormStockData, SeriesOption } from '@/interfaces';

interface StockFormModalProps {
  isOpen: boolean;
  modalType: 'add' | 'edit' | '';
  stockData: FormStockData;
  editModalData: EditData;
  seriesOptions: SeriesOption[];
  isLoading: boolean;
  onClose: () => void;
  onSubmitAdd: (e: React.FormEvent<HTMLFormElement>) => void;
  onSubmitEdit: (e: React.FormEvent<HTMLFormElement>) => void;
  onChangeAdd: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onChangeEdit: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSeriesChange: (value: string) => void;
}

export function StockFormModal({
  isOpen,
  modalType,
  stockData,
  editModalData,
  seriesOptions,
  isLoading,
  onClose,
  onSubmitAdd,
  onSubmitEdit,
  onChangeAdd,
  onChangeEdit,
  onSeriesChange,
}: StockFormModalProps) {
  const isAdd = modalType === 'add';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isAdd ? 'Add Stock' : 'Edit Stock'}
      dialogPanelClass='w-full max-w-sm sm:max-w-md md:max-w-lg mx-4 sm:mx-auto'
    >
      <form onSubmit={isAdd ? onSubmitAdd : onSubmitEdit} className='space-y-4'>
        <div className='flex w-full flex-col gap-4'>
          <div className='w-full'>
            <label className='mb-2 block text-sm font-medium text-gray-700'>
              Select Series
            </label>
            <div
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              className='relative w-full'
            >
              <SeriesAutocomplete
                series={seriesOptions.map((option) => ({
                  name: option.value,
                  plate: option.batteryDetails?.plate || 0,
                  ah: option.batteryDetails?.ah || 0,
                  retailPrice: option.batteryDetails?.retailPrice || 0,
                  type: option.batteryDetails?.type || '',
                  salesTax: option.batteryDetails?.salesTax || 0,
                  maxRetailPrice: option.batteryDetails?.maxRetailPrice || 0,
                }))}
                value={isAdd ? stockData.series : editModalData.series}
                onChange={onSeriesChange}
                placeholder='Search series...'
                className='w-full'
                disabled={false} // Enable for both add and edit modes
                showPrices={false}
              />
            </div>
          </div>

          <div className='w-full'>
            <Input
              type='number'
              label='Cost Per Product'
              name='productCost'
              value={
                isAdd
                  ? stockData.productCost || ''
                  : editModalData.productCost || ''
              }
              onChange={isAdd ? onChangeAdd : onChangeEdit}
              required={isAdd}
              className='h-12 w-full rounded-lg border border-gray-300 px-4 text-base focus:border-blue-500 focus:shadow-none focus:outline-none focus:ring-0'
              style={{ outline: 'none', boxShadow: 'none' }}
              inputMode='decimal'
              placeholder='0.00'
            />
          </div>

          <div className='w-full'>
            <Input
              type='number'
              label='Quantity'
              name='inStock'
              value={
                isAdd ? stockData.inStock || '' : editModalData.inStock || ''
              }
              onChange={isAdd ? onChangeAdd : onChangeEdit}
              required={isAdd}
              className='h-12 w-full rounded-lg border border-gray-300 px-4 text-base focus:border-blue-500 focus:shadow-none focus:outline-none focus:ring-0'
              style={{ outline: 'none', boxShadow: 'none' }}
              inputMode='numeric'
              placeholder='0'
              min='0'
              step='1'
            />
          </div>

          <div className='flex w-full flex-col gap-3 pt-4'>
            <Button
              className='h-12 w-full text-base font-medium focus:outline-none focus:ring-0'
              variant='fill'
              text={isAdd ? 'Add Stock' : 'Update Stock'}
              type='submit'
              isPending={isLoading}
              disabled={isLoading}
            />
            <Button
              className='h-12 w-full text-base focus:outline-none focus:ring-0'
              variant='outline'
              text='Cancel'
              type='button'
              onClick={onClose}
            />
          </div>
        </div>
      </form>
    </Modal>
  );
}
