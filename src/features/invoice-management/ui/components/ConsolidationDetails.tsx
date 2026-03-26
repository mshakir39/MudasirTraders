'use client';

import React from 'react';
import { Invoice, InvoiceUtils } from '@/entities/invoice/model/types';
import { FaLink, FaExclamationTriangle } from 'react-icons/fa';

interface ConsolidationDetailsProps {
  invoice: Invoice;
  showActions?: boolean;
  onViewTransferChain?: (invoiceId: string) => void;
}

const ConsolidationDetails: React.FC<ConsolidationDetailsProps> = ({
  invoice,
  showActions = false,
  onViewTransferChain,
}) => {
  const isConsolidated = InvoiceUtils.isConsolidated(invoice);
  const isVoided = invoice.status === 'voided';
  const hasReplacedBy = invoice.replacedBy;
  const hasReplacesInvoice = invoice.replacesInvoice;

  if (!isConsolidated && !isVoided && !hasReplacedBy && !hasReplacesInvoice) {
    return null;
  }

  const summary = InvoiceUtils.getConsolidationSummary(invoice);

  return (
    <div className='space-y-4'>
      {/* Consolidated Invoice Details */}
      {isConsolidated && summary && (
        <div className='rounded-lg border border-purple-200 bg-purple-50 p-3'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center'>
              <FaLink
                className='mr-2 h-4 w-4 text-purple-600'
                aria-hidden='true'
              />
              <span className='text-sm text-purple-700'>
                Consolidated from {summary.consolidatedCount} invoice(s):
              </span>
              <span className='ml-1 text-sm font-medium text-purple-800'>
                {invoice.consolidatedFrom
                  ?.map((id) => `#${id.slice(-6)}`)
                  .join(', ')}
              </span>
            </div>
            <span className='text-sm font-bold text-purple-900'>
              Rs {summary.consolidatedAmount.toLocaleString()}
            </span>
          </div>
        </div>
      )}

      {/* Voided Invoice Details */}
      {isVoided && (
        <div className='rounded-lg border border-red-200 bg-red-50 p-4'>
          <div className='flex items-start'>
            <div className='flex-shrink-0'>
              <FaExclamationTriangle
                className='h-5 w-5 text-red-600'
                aria-hidden='true'
              />
            </div>
            <div className='ml-3 flex-1'>
              <h3 className='text-sm font-medium text-red-800'>
                Voided Invoice
              </h3>
              <div className='mt-2 text-sm text-red-700'>
                <p>
                  This invoice was voided on{' '}
                  {invoice.voidedAt
                    ? new Date(invoice.voidedAt).toLocaleDateString()
                    : 'N/A'}
                </p>
                {invoice.voidReason && (
                  <p className='mt-1'>Reason: {invoice.voidReason}</p>
                )}
                {invoice.voidedBy && (
                  <p className='mt-1'>Voided by: {invoice.voidedBy}</p>
                )}

                {hasReplacedBy && (
                  <div className='mt-3'>
                    <a
                      href={`/invoices/${invoice.replacedBy}`}
                      className='text-sm font-medium text-red-600 hover:text-red-800 hover:underline'
                    >
                      View Replacement Invoice →
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Replaces Invoice Details */}
      {hasReplacesInvoice && !isVoided && (
        <div className='rounded-lg border border-orange-200 bg-orange-50 p-4'>
          <div className='flex items-start'>
            <div className='flex-shrink-0'>
              <FaLink className='h-5 w-5 text-orange-600' aria-hidden='true' />
            </div>
            <div className='ml-3 flex-1'>
              <h3 className='text-sm font-medium text-orange-800'>
                Replaces Previous Invoice
              </h3>
              <div className='mt-2 text-sm text-orange-700'>
                <p>This invoice replaces a previous invoice:</p>
                <div className='mt-1'>
                  <a
                    href={`/invoices/${invoice.replacesInvoice || ''}`}
                    className='text-sm font-medium text-orange-600 hover:text-orange-800 hover:underline'
                  >
                    View Original Invoice #
                    {invoice.replacesInvoice?.slice(-6) || 'N/A'} →
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConsolidationDetails;
