import React from 'react';
import { FaExclamationTriangle } from 'react-icons/fa';

interface AlertsBannerProps {
  alerts: {
    lowStock: number;
    outOfStock: number;
    pendingPayments: number;
  };
}

export const AlertsBanner: React.FC<AlertsBannerProps> = ({ alerts }) => {
  const hasAlerts =
    alerts.lowStock > 0 || alerts.outOfStock > 0 || alerts.pendingPayments > 0;

  if (!hasAlerts) return null;

  return (
    <div
      className='mb-6 rounded-r-lg border-l-4 p-4'
      style={{ borderLeftColor: '#0ea5e9', backgroundColor: '#f0f9ff' }}
    >
      <div className='flex items-center'>
        <FaExclamationTriangle className='mr-3' style={{ color: '#0ea5e9' }} />
        <div>
          <h3 className='text-sm font-medium' style={{ color: '#075985' }}>
            Attention Required
          </h3>
          <div className='mt-1 text-sm' style={{ color: '#0c4a6e' }}>
            {alerts.lowStock > 0 && (
              <span className='mr-4'>
                • {alerts.lowStock} items low on stock
              </span>
            )}
            {alerts.outOfStock > 0 && (
              <span className='mr-4'>
                • {alerts.outOfStock} items out of stock
              </span>
            )}
            {alerts.pendingPayments > 0 && (
              <span>
                • Rs {alerts.pendingPayments.toLocaleString('en-PK')} pending
                payments
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
