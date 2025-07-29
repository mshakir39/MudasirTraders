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
    if (!searchTerm.trim()) {
      toast.error('Please enter a warranty code');
      return;
    }

    setLoading(true);
    try {
      const result = await searchWarranty(searchTerm);
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
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header Section */}
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center mb-4">
            <FaShieldAlt className="text-4xl text-blue-600 mr-3" />
            <h1 className="text-3xl font-bold">Battery Warranty Check</h1>
          </div>
          <p className="text-gray-600">Enter your warranty code to check the status of your battery warranty</p>
        </div>

        {/* Search Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <form onSubmit={handleSearch}>
            <div className="flex gap-4">
              <div className="flex-1">
                <Input
                  type="text"
                  placeholder="Enter warranty code (e.g., ABC123XYZ)"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  parentClass="w-full"
                  label="Warranty Code"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-300 h-[42px] mt-6"
              >
                {loading ? (
                  'Searching...'
                ) : (
                  <div className="flex items-center">
                    <FaSearch className="mr-2" />
                    Search
                  </div>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Information Section (shown when no search result) */}
        {!warrantyData && !loading && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <div className="flex items-start mb-4">
              <FaInfoCircle className="text-blue-600 text-xl mt-1 mr-3" />
              <h2 className="text-xl font-semibold text-blue-800">How to Find Your Warranty Code</h2>
            </div>
            <div className="ml-8">
              <p className="text-gray-700 mb-4">Your warranty code can be found:</p>
              <ul className="list-disc list-inside text-gray-700 space-y-2">
                <li>On your battery purchase invoice</li>
                <li>On the warranty card provided with your battery</li>
                <li>In the warranty section of your sales receipt</li>
              </ul>
              <div className="mt-4 text-sm text-gray-600">
                <p>The warranty code format looks like: XXX-XXXXXXX</p>
                <p>If you cannot find your warranty code, please contact our support team.</p>
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