'use client';

import React, { useState } from 'react';
import Modal from '@/components/modal';
import Button from '@/components/button';
import { toast } from 'react-toastify';
import { FaShieldAlt, FaCarBattery, FaSearch } from 'react-icons/fa';
import { normalizeSeriesForMatching } from '@/utils/seriesNormalization';

interface CreateClaimModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  stockList: any[];
}

export default function CreateClaimModal({
  isOpen,
  onClose,
  onSuccess,
  stockList,
}: CreateClaimModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSearchingWarranty, setIsSearchingWarranty] = useState(false);
  const [warrantyLookupCode, setWarrantyLookupCode] = useState('');

  // Form Fields
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [originalInvoiceNumber, setOriginalInvoiceNumber] = useState('');

  const [faultyBrand, setFaultyBrand] = useState('');
  const [faultySeries, setFaultySeries] = useState('');
  const [faultySerial, setFaultySerial] = useState('');
  const [issueDescription, setIssueDescription] = useState('Dead cell / Backup failure');

  const [replacementBrand, setReplacementBrand] = useState('');
  const [replacementSeries, setReplacementSeries] = useState('');
  const [replacementSerial, setReplacementSerial] = useState('');
  const [notes, setNotes] = useState('');

  // Handle Quick Warranty Search Auto-Fill
  const handleSearchWarranty = async () => {
    if (!warrantyLookupCode.trim()) {
      toast.warning('Please enter a warranty code / serial number to search');
      return;
    }
    setIsSearchingWarranty(true);
    try {
      const res = await fetch(`/api/warranty/search?warrantyCode=${encodeURIComponent(warrantyLookupCode.trim())}`);
      const data = await res.json();
      if (data.success && data.data) {
        const item = data.data;
        const brand = item.brandName || '';
        const series = item.series || '';

        setFaultySerial(item.warrentyCode || warrantyLookupCode.trim());
        setCustomerName(item.customerName || '');
        setCustomerPhone(item.customerContactNumber || '');
        setOriginalInvoiceNumber(item.invoiceNumber || '');

        // Find matching brand in stockList (case-insensitive)
        const matchedBrand = stockList.find(
          (b) => b.brandName.toLowerCase().trim() === brand.toLowerCase().trim()
        );

        if (matchedBrand) {
          const canonicalBrand = matchedBrand.brandName;
          setFaultyBrand(canonicalBrand);
          setReplacementBrand(canonicalBrand);

          // Find matching series in that brand's seriesStock
          const matchedSeries = matchedBrand.seriesStock?.find(
            (s: any) =>
              s.series.toLowerCase().trim() === series.toLowerCase().trim() ||
              normalizeSeriesForMatching(s.series) === normalizeSeriesForMatching(series)
          );

          if (matchedSeries) {
            setFaultySeries(matchedSeries.series);
            setReplacementSeries(matchedSeries.series);
          } else {
            setFaultySeries(series);
            setReplacementSeries(series);
          }
        } else {
          setFaultyBrand(brand);
          setFaultySeries(series);
          setReplacementBrand(brand);
          setReplacementSeries(series);
        }

        toast.success('Warranty record found! Brand & Series auto-selected.');
      } else {
        toast.info('No matching registered warranty found. You can still fill manually.');
        setFaultySerial(warrantyLookupCode.trim());
      }
    } catch (err: any) {
      toast.error('Search failed: ' + err.message);
    } finally {
      setIsSearchingWarranty(false);
    }
  };

  // Deduplicate brands from stockList
  const uniqueBrands = React.useMemo(() => {
    const map = new Map<string, any>();
    (stockList || []).forEach((item) => {
      const name = item?.brandName?.trim();
      if (name && !map.has(name)) {
        map.set(name, item);
      }
    });
    return Array.from(map.values());
  }, [stockList]);

  // Series options for Faulty brand (deduplicated by series name)
  const faultySeriesOptions = React.useMemo(() => {
    if (!faultyBrand) return [];
    const brandItem = uniqueBrands.find((b) => b.brandName === faultyBrand);
    const seriesStock = brandItem?.seriesStock || [];
    const seen = new Set<string>();
    const result: any[] = [];
    seriesStock.forEach((s: any) => {
      const sName = s?.series?.trim();
      if (sName && !seen.has(sName)) {
        seen.add(sName);
        result.push(s);
      }
    });
    return result;
  }, [uniqueBrands, faultyBrand]);

  // Series options for Replacement brand (deduplicated by series name)
  const availableSeries = React.useMemo(() => {
    if (!replacementBrand) return [];
    const brandItem = uniqueBrands.find((b) => b.brandName === replacementBrand);
    const seriesStock = brandItem?.seriesStock || [];
    const seen = new Set<string>();
    const result: any[] = [];
    seriesStock.forEach((s: any) => {
      const sName = s?.series?.trim();
      if (sName && !seen.has(sName)) {
        seen.add(sName);
        result.push(s);
      }
    });
    return result;
  }, [uniqueBrands, replacementBrand]);

  const selectedSeriesStock = availableSeries.find((s: any) => s.series === replacementSeries);
  const inStockQty = selectedSeriesStock ? parseInt(selectedSeriesStock.inStock) || 0 : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!customerName || !customerPhone) {
      toast.error('Please enter customer name and phone');
      return;
    }
    if (!faultyBrand || !faultySeries || !faultySerial) {
      toast.error('Please fill faulty battery brand, model, and serial number');
      return;
    }
    if (!replacementBrand || !replacementSeries || !replacementSerial) {
      toast.error('Please fill replacement battery brand, model, and new serial number');
      return;
    }
    if (inStockQty < 1) {
      toast.error(`Cannot proceed: ${replacementBrand} - ${replacementSeries} has 0 in stock!`);
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/claims', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName,
          customerPhone,
          originalInvoiceNumber,
          faultyBrand,
          faultySeries,
          faultySerial,
          issueDescription,
          replacementBrand,
          replacementSeries,
          replacementSerial,
          notes,
        }),
      });

      const result = await res.json();
      if (!res.ok || !result.success) {
        throw new Error(result.error || 'Failed to submit claim');
      }

      toast.success(`Claim ${result.claimNumber} created! 1 unit deducted from stock.`);
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Error creating claim');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2 text-lg font-bold text-white">
          <FaCarBattery className="text-white" />
          <span className="text-white">New Battery Warranty Claim</span>
        </div>
      }
      size="large"
    >
      <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-5 max-h-[80vh] overflow-y-auto">
        {/* Quick Search */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <label className="block text-xs font-semibold text-blue-900 mb-1">
            Auto-fill from Warranty Serial / Code (Optional)
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="e.g. EX-98234 or serial #..."
              value={warrantyLookupCode}
              onChange={(e) => setWarrantyLookupCode(e.target.value)}
              className="flex-1 rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <button
              type="button"
              onClick={handleSearchWarranty}
              disabled={isSearchingWarranty}
              className="px-3 py-1.5 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1.5"
            >
              <FaSearch size={12} />
              {isSearchingWarranty ? 'Searching...' : 'Lookup'}
            </button>
          </div>
        </div>

        {/* Customer Information */}
        <div>
          <h4 className="text-sm font-bold text-gray-700 mb-2 border-b pb-1">1. Customer Information</h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Customer Name *</label>
              <input
                type="text"
                required
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="e.g. Muhammad Ali"
                className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:ring-1 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Phone Number *</label>
              <input
                type="text"
                required
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="0300-1234567"
                className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:ring-1 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Original Invoice # (Optional)</label>
              <input
                type="text"
                value={originalInvoiceNumber}
                onChange={(e) => setOriginalInvoiceNumber(e.target.value)}
                placeholder="e.g. INV-1042"
                className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:ring-1 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Faulty Battery */}
        <div>
          <h4 className="text-sm font-bold text-red-600 mb-2 border-b pb-1">2. Faulty (Defective) Battery Returned</h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Brand Name *</label>
              <select
                required
                value={faultyBrand}
                onChange={(e) => {
                  const val = e.target.value;
                  setFaultyBrand(val);
                  setReplacementBrand(val);
                  setFaultySeries('');
                  setReplacementSeries('');
                }}
                className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm bg-white focus:ring-1 focus:ring-blue-500 focus:outline-none"
              >
                <option value="">Select Brand</option>
                {uniqueBrands.map((b, idx) => (
                  <option key={`faulty-b-${b.brandName || idx}`} value={b.brandName}>
                    {b.brandName}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Model / Series *</label>
              <select
                required
                disabled={!faultyBrand}
                value={faultySeries}
                onChange={(e) => {
                  const val = e.target.value;
                  setFaultySeries(val);
                  setReplacementSeries(val);
                }}
                className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm bg-white focus:ring-1 focus:ring-blue-500 focus:outline-none disabled:opacity-50"
              >
                <option value="">Select Model</option>
                {faultySeriesOptions.map((s: any, idx) => (
                  <option key={`faulty-s-${s.series || idx}`} value={s.series}>
                    {s.series}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Old Battery Serial # *</label>
              <input
                type="text"
                required
                value={faultySerial}
                onChange={(e) => setFaultySerial(e.target.value)}
                placeholder="e.g. EX-837492"
                className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm uppercase focus:ring-1 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>
          <div className="mt-2">
            <label className="block text-xs font-medium text-gray-700 mb-1">Issue / Defect Description</label>
            <input
              type="text"
              value={issueDescription}
              onChange={(e) => setIssueDescription(e.target.value)}
              placeholder="Dead cell, won't charge, acid leak, etc."
              className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:ring-1 focus:ring-blue-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Replacement Battery Given to Customer */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <div className="flex justify-between items-center mb-2 border-b border-green-200 pb-1">
            <h4 className="text-sm font-bold text-green-800">3. Replacement Battery Given to Customer</h4>
            <span className="text-xs bg-green-200 text-green-800 px-2 py-0.5 rounded font-semibold">
              Payment: Rs. 0 (Free Replacement)
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Replacement Brand *</label>
              <select
                required
                value={replacementBrand}
                onChange={(e) => {
                  setReplacementBrand(e.target.value);
                  setReplacementSeries('');
                }}
                className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm bg-white focus:ring-1 focus:ring-green-500 focus:outline-none"
              >
                <option value="">Select Brand</option>
                {uniqueBrands.map((b, idx) => (
                  <option key={`rep-b-${b.brandName || idx}`} value={b.brandName}>
                    {b.brandName}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Replacement Model / Series *</label>
              <select
                required
                value={replacementSeries}
                onChange={(e) => setReplacementSeries(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm bg-white focus:ring-1 focus:ring-green-500 focus:outline-none"
              >
                <option value="">Select Model</option>
                {availableSeries.map((s: any, idx) => (
                  <option key={`rep-s-${s.series || idx}`} value={s.series}>
                    {s.series} ({s.inStock || 0} in stock)
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">New Battery Serial # *</label>
              <input
                type="text"
                required
                value={replacementSerial}
                onChange={(e) => setReplacementSerial(e.target.value)}
                placeholder="e.g. EX-992104"
                className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm uppercase focus:ring-1 focus:ring-green-500 focus:outline-none"
              />
            </div>
          </div>

          {replacementSeries && (
            <div className="mt-2 text-xs text-gray-600 flex items-center justify-between">
              <span>
                Available Stock:{' '}
                <strong className={inStockQty > 0 ? 'text-green-700' : 'text-red-600'}>
                  {inStockQty} units
                </strong>
              </span>
              <span className="text-gray-500">
                ⚠️ Will automatically decrease stock by <strong>1 unit</strong> upon saving.
              </span>
            </div>
          )}
        </div>

        {/* Additional Notes */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Remarks / Notes</label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Sent via dealer representative or handed directly to customer"
            className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:ring-1 focus:ring-blue-500 focus:outline-none"
          />
        </div>

        {/* Footer Buttons */}
        <div className="flex justify-end gap-3 pt-3 border-t">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting || inStockQty < 1}
            className="bg-blue-600 text-white px-5 py-2 rounded-md hover:bg-blue-700 font-medium text-sm disabled:opacity-50 flex items-center gap-2"
          >
            {isSubmitting ? 'Processing...' : 'Confirm & Deduct Stock'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
