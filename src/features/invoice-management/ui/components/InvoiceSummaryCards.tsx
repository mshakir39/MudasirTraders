// src/features/invoice-management/ui/components/InvoiceSummaryCards.tsx
// Invoice summary cards component - <60 lines

'use client';

import React from 'react';
import { InvoiceSummary } from '@/entities/invoice';
import { InvoiceApi } from '@/entities/invoice';

interface InvoiceSummaryCardsProps {
  summary: InvoiceSummary;
  className?: string;
}

export const InvoiceSummaryCards: React.FC<InvoiceSummaryCardsProps> = ({
  summary,
  className = '',
}) => {
  const cards = [
    {
      title: 'Total Invoices',
      value: summary.totalInvoices.toString(),
      icon: '📄',
      bgColor: 'bg-blue-100',
      textColor: 'text-blue-800',
    },
    {
      title: 'Total Revenue',
      value: InvoiceApi.formatCurrency(summary.totalAmount),
      icon: '💰',
      bgColor: 'bg-green-100',
      textColor: 'text-green-800',
    },
    {
      title: 'Paid Invoices',
      value: `${summary.paidInvoices} (${summary.paidInvoices > 0 ? Math.round((summary.paidInvoices / summary.totalInvoices) * 100) : 0}%)`,
      icon: '✅',
      bgColor: 'bg-emerald-100',
      textColor: 'text-emerald-800',
    },
    {
      title: 'Pending Amount',
      value: InvoiceApi.formatCurrency(summary.pendingAmount),
      icon: '⏳',
      bgColor: 'bg-yellow-100',
      textColor: 'text-yellow-800',
    },
    {
      title: 'Overdue Amount',
      value: InvoiceApi.formatCurrency(summary.overdueAmount),
      icon: '⚠️',
      bgColor: 'bg-red-100',
      textColor: 'text-red-800',
    },
    {
      title: 'Average Invoice',
      value: InvoiceApi.formatCurrency(summary.averageInvoiceValue),
      icon: '📊',
      bgColor: 'bg-purple-100',
      textColor: 'text-purple-800',
    },
  ];

  return (
    <div
      className={`grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 ${className}`}
    >
      {cards.map((card, index) => (
        <div
          key={index}
          className='rounded-lg border border-gray-200 bg-white p-4 shadow-sm'
        >
          <div className='flex items-center'>
            <div className={`p-2 ${card.bgColor} mr-3 rounded-lg`}>
              <span className='text-2xl'>{card.icon}</span>
            </div>
            <div>
              <p className='text-sm font-medium text-gray-600'>{card.title}</p>
              <p className={`text-lg font-bold ${card.textColor}`}>
                {card.value}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
