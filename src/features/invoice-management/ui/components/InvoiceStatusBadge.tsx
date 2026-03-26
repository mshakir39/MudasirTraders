'use client';

import React from 'react';
import { Invoice } from '@/entities/invoice/model/types';

interface InvoiceStatusBadgeProps {
  invoice: Invoice;
  showTransferLinks?: boolean;
  onPreviewReplacement?: (replacementInvoiceId: string) => void;
}

const InvoiceStatusBadge: React.FC<InvoiceStatusBadgeProps> = ({ 
  invoice, 
  showTransferLinks = false,
  onPreviewReplacement
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'voided':
        return 'bg-red-100 text-red-800';
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'deleted':
        return 'bg-gray-100 text-gray-800';
      case 'archived':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'voided':
        return 'VOIDED';
      case 'active':
        return 'ACTIVE';
      case 'deleted':
        return 'DELETED';
      case 'archived':
        return 'ARCHIVED';
      default:
        return status?.toUpperCase() || 'UNKNOWN';
    }
  };

  const isConsolidated = invoice.consolidatedFrom && invoice.consolidatedFrom.length > 0;
  const isVoided = invoice.status === 'voided';

  return (
    <div className="flex flex-col space-y-1">
      {/* Status Badge */}
      <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(invoice.status || 'active')}`}>
        {getStatusText(invoice.status || 'active')}
      </div>

      {/* Consolidation Badge */}
      {isConsolidated && (
        <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
          CONSOLIDATED ({invoice.consolidatedFrom?.length})
        </div>
      )}

      {/* Transfer Links */}
      {showTransferLinks && (
        <div className="space-y-1">
          {invoice.replacedBy && (
            <button 
              onClick={() => onPreviewReplacement?.(invoice.replacedBy!)}
              className="text-blue-600 hover:text-blue-800 text-xs hover:underline bg-transparent border-none cursor-pointer"
            >
              View Replacement →
            </button>
          )}
          
          {isVoided && invoice.replacesInvoice && (
            <div className="text-gray-500 text-xs">
              Replaced #{invoice.replacesInvoice.slice(-6)}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default InvoiceStatusBadge;
