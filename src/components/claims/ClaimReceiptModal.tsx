'use client';

import React from 'react';
import Modal from '@/components/modal';
import { FaPrint, FaCarBattery, FaCheckCircle } from 'react-icons/fa';

interface ClaimReceiptModalProps {
  claim: any | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function ClaimReceiptModal({
  claim,
  isOpen,
  onClose,
}: ClaimReceiptModalProps) {
  if (!claim) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Warranty Claim Slip"
      size="medium"
    >
      <div className="p-6 space-y-6">
        {/* Printable Area */}
        <div id="printable-claim" className="border border-gray-200 rounded-lg p-6 bg-white space-y-5 text-gray-800">
          <div className="text-center border-b pb-4">
            <h2 className="text-xl font-bold text-gray-900 tracking-wide">MUDASIR TRADERS</h2>
            <p className="text-xs text-gray-500">Battery Warranty Claim & Replacement Voucher</p>
            <div className="mt-2 inline-block bg-blue-50 text-blue-800 text-xs px-3 py-1 rounded font-semibold">
              Claim #: {claim.claimNumber}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-gray-500 block">Date & Time:</span>
              <span className="font-semibold">{new Date(claim.claimDate || claim.createdAt).toLocaleString()}</span>
            </div>
            <div>
              <span className="text-gray-500 block">Customer Name:</span>
              <span className="font-semibold">{claim.customerName}</span>
            </div>
            <div>
              <span className="text-gray-500 block">Customer Contact:</span>
              <span className="font-semibold">{claim.customerPhone}</span>
            </div>
            {claim.originalInvoiceNumber && (
              <div>
                <span className="text-gray-500 block">Original Invoice #:</span>
                <span className="font-semibold">{claim.originalInvoiceNumber}</span>
              </div>
            )}
          </div>

          <div className="border border-red-100 bg-red-50/50 rounded p-3 text-xs">
            <h4 className="font-bold text-red-800 mb-1">Defective / Faulty Battery Handed In:</h4>
            <div className="grid grid-cols-3 gap-2">
              <div><strong>Brand:</strong> {claim.faultyBrand}</div>
              <div><strong>Model:</strong> {claim.faultySeries}</div>
              <div><strong>Serial #:</strong> {claim.faultySerial}</div>
            </div>
            {claim.issueDescription && (
              <p className="mt-1 text-gray-600"><strong>Fault Reason:</strong> {claim.issueDescription}</p>
            )}
          </div>

          <div className="border border-green-100 bg-green-50/50 rounded p-3 text-xs">
            <h4 className="font-bold text-green-800 mb-1">New Replacement Battery Handed Out:</h4>
            <div className="grid grid-cols-3 gap-2">
              <div><strong>Brand:</strong> {claim.replacementBrand}</div>
              <div><strong>Model:</strong> {claim.replacementSeries}</div>
              <div><strong>Serial #:</strong> {claim.replacementSerial}</div>
            </div>
            <div className="mt-2 font-bold text-green-700">
              Total Amount Charged: Rs. 0 (Warranty Replacement)
            </div>
          </div>

          <div className="pt-6 flex justify-between text-xs text-gray-500 border-t">
            <div>
              <p>Customer Signature: __________________</p>
            </div>
            <div className="text-right">
              <p>Authorized Sign / Stamp: __________________</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50"
          >
            Close
          </button>
          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 flex items-center gap-2"
          >
            <FaPrint /> Print Voucher
          </button>
        </div>
      </div>
    </Modal>
  );
}
