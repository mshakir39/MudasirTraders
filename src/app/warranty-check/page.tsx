'use client';

import React, { useState } from 'react';
import Input from '@/components/customInput';
import { searchWarranty } from '@/actions/warrantyActions';
import WarrantyDetails from '@/components/warranty/WarrantyDetails';
import { toast } from 'react-toastify';
import { FaSearch, FaShieldAlt, FaInfoCircle } from 'react-icons/fa';

export default function WarrantyCheckPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [warrantyData, setWarrantyData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedSearchTerm = searchTerm.trim();
    if (!trimmedSearchTerm) {
      toast.error('Please enter a warranty code');
      return;
    }

    setLoading(true);
    try {
      const result = await searchWarranty(trimmedSearchTerm);
      if (result.success) {
        setWarrantyData(result.data);
      } else {
        toast.error(result.error || 'No warranty found');
        setWarrantyData(null);
      }
    } catch (error) {
      console.error('Error searching warranty:', error);
      toast.error('Error searching warranty');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='container mx-auto px-4 py-8'>
      <div className='mx-auto max-w-4xl'>
        {/* Header Section */}
        <div className='mb-8 text-center'>
          <div className='mb-4 flex items-center justify-center'>
            <FaShieldAlt className='mr-3 text-4xl text-blue-600' />
            <h1 className='text-3xl font-bold'>Battery Warranty Check</h1>
          </div>
          <p className='text-gray-600'>
            Enter your warranty code to check the status of your battery
            warranty
          </p>
        </div>

        {/* Search Section */}
        <div className='mb-8 rounded-lg bg-white p-6 shadow-md'>
          <form onSubmit={handleSearch}>
            <div className='flex gap-4'>
              <div className='flex-1'>
                <Input
                  type='text'
                  placeholder='Enter warranty code(s) - supports multiple codes separated by comma or space'
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  parentClass='w-full'
                  label='Warranty Code'
                />
              </div>
              <button
                type='submit'
                disabled={loading}
                className='mt-6 h-[42px] rounded-md bg-blue-600 px-6 py-2 text-white hover:bg-blue-700 disabled:bg-blue-300'
              >
                {loading ? (
                  'Searching...'
                ) : (
                  <div className='flex items-center'>
                    <FaSearch className='mr-2' />
                    Search
                  </div>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Information Section (shown when no search result) */}
        {!warrantyData && !loading && (
          <div className='rounded-lg border border-blue-200 bg-blue-50 p-6'>
            <div className='mb-4 flex items-start'>
              <FaInfoCircle className='mr-3 mt-1 text-xl text-blue-600' />
              <h2 className='text-xl font-semibold text-blue-800'>
                How to Find Your Warranty Code
              </h2>
            </div>
            <div className='ml-8'>
              <p className='mb-4 text-gray-700'>
                Your warranty code can be found:
              </p>
              <ul className='list-inside list-disc space-y-2 text-gray-700'>
                <li>On your battery purchase invoice</li>
                <li>On the warranty card provided with your battery</li>
                <li>In the warranty section of your sales receipt</li>
              </ul>
              <div className='mt-4 text-sm text-gray-600'>
                <p><strong>Multiple Codes:</strong> You can enter multiple warranty codes separated by comma or space</p>
                <p><strong>Examples:</strong> &quot;ABC123, DEF456&quot; or &quot;ABC123 DEF456&quot; or &quot;1646603376 1291636542&quot;</p>
                <p>The warranty code format looks like: XXX-XXXXXXX</p>
                <p>
                  If you cannot find your warranty code, please contact our
                  support team.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Warranty Details */}
        {warrantyData && <WarrantyDetails warranty={warrantyData} />}
      </div>
    </div>
  );
}
