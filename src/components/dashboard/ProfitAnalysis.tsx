import React, { useState } from 'react';

interface ProfitData {
  totalRevenue: number;
  totalCost: number;
  totalProfit: number;
  profitMargin: number;
  saleCount: number;
  profitDetails: Array<{
    saleDate: string;
    brandName: string;
    series: string;
    quantity: number;
    sellingPrice: number;
    historicalCost: number;
    saleRevenue: number;
    saleCost: number;
    saleProfit: number;
  }>;
}

interface ProfitAnalysisProps {
  className?: string;
}

const ProfitAnalysis: React.FC<ProfitAnalysisProps> = ({ className = '' }) => {
  const [startDate, setStartDate] = useState<string>(
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [loading, setLoading] = useState<boolean>(false);
  const [profitData, setProfitData] = useState<ProfitData | null>(null);
  const [error, setError] = useState<string>('');

  const fetchProfitData = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch(
        `/api/dashboard/profit?startDate=${startDate}&endDate=${endDate}`
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch profit data');
      }

      const data = await response.json();
      setProfitData(data);
    } catch (err: any) {
      setError(err.message);
      setProfitData(null);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number): string => {
    return `Rs ${amount.toLocaleString('en-PK', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-PK');
  };

  return (
    <div className={`rounded-lg bg-white p-6 shadow ${className}`}>
      <h2 className='mb-6 text-2xl font-bold text-gray-900'>Profit Analysis</h2>

      {/* Date Range Selector */}
      <div className='mb-6 flex flex-wrap items-end gap-4'>
        <div>
          <label className='mb-1 block text-sm font-medium text-gray-700'>
            Start Date
          </label>
          <input
            type='date'
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className='block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500'
          />
        </div>

        <div>
          <label className='mb-1 block text-sm font-medium text-gray-700'>
            End Date
          </label>
          <input
            type='date'
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className='block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500'
          />
        </div>

        <button
          onClick={fetchProfitData}
          disabled={loading}
          className='rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-400'
        >
          {loading ? 'Calculating...' : 'Calculate Profit'}
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className='mb-4 rounded-md border border-red-200 bg-red-50 p-4'>
          <p className='text-red-700'>{error}</p>
        </div>
      )}

      {/* Profit Summary Cards */}
      {profitData && (
        <div className='mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4'>
          <div className='rounded-lg border border-green-200 bg-green-50 p-4'>
            <h3 className='mb-1 text-sm font-medium text-green-700'>
              Total Revenue
            </h3>
            <p className='text-2xl font-bold text-green-900'>
              {formatCurrency(profitData.totalRevenue)}
            </p>
          </div>

          <div className='rounded-lg border border-red-200 bg-red-50 p-4'>
            <h3 className='mb-1 text-sm font-medium text-red-700'>
              Total Cost
            </h3>
            <p className='text-2xl font-bold text-red-900'>
              {formatCurrency(profitData.totalCost)}
            </p>
          </div>

          <div className='rounded-lg border border-blue-200 bg-blue-50 p-4'>
            <h3 className='mb-1 text-sm font-medium text-blue-700'>
              Total Profit
            </h3>
            <p className='text-2xl font-bold text-blue-900'>
              {formatCurrency(profitData.totalProfit)}
            </p>
          </div>

          <div className='rounded-lg border border-purple-200 bg-purple-50 p-4'>
            <h3 className='mb-1 text-sm font-medium text-purple-700'>
              Profit Margin
            </h3>
            <p className='text-2xl font-bold text-purple-900'>
              {profitData.profitMargin.toFixed(1)}%
            </p>
          </div>
        </div>
      )}

      {/* Profit Details Table */}
      {profitData && profitData.profitDetails.length > 0 && (
        <div className='mt-6'>
          <h3 className='mb-4 text-lg font-semibold text-gray-900'>
            Profit Details
          </h3>
          <div className='overflow-x-auto'>
            <table className='min-w-full divide-y divide-gray-200'>
              <thead className='bg-gray-50'>
                <tr>
                  <th className='px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500'>
                    Date
                  </th>
                  <th className='px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500'>
                    Brand
                  </th>
                  <th className='px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500'>
                    Series
                  </th>
                  <th className='px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500'>
                    Quantity
                  </th>
                  <th className='px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500'>
                    Selling Price
                  </th>
                  <th className='px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500'>
                    Historical Cost
                  </th>
                  <th className='px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500'>
                    Profit
                  </th>
                </tr>
              </thead>
              <tbody className='divide-y divide-gray-200 bg-white'>
                {profitData.profitDetails.map((detail, index) => (
                  <tr key={index}>
                    <td className='whitespace-nowrap px-6 py-4 text-sm text-gray-900'>
                      {formatDate(detail.saleDate)}
                    </td>
                    <td className='whitespace-nowrap px-6 py-4 text-sm text-gray-900'>
                      {detail.brandName}
                    </td>
                    <td className='whitespace-nowrap px-6 py-4 text-sm text-gray-900'>
                      {detail.series}
                    </td>
                    <td className='whitespace-nowrap px-6 py-4 text-sm text-gray-900'>
                      {detail.quantity}
                    </td>
                    <td className='whitespace-nowrap px-6 py-4 text-sm text-gray-900'>
                      {formatCurrency(detail.sellingPrice)}
                    </td>
                    <td className='whitespace-nowrap px-6 py-4 text-sm text-gray-900'>
                      {formatCurrency(detail.historicalCost)}
                    </td>
                    <td className='whitespace-nowrap px-6 py-4 text-sm'>
                      <span
                        className={`font-medium ${
                          detail.saleProfit >= 0
                            ? 'text-green-600'
                            : 'text-red-600'
                        }`}
                      >
                        {formatCurrency(detail.saleProfit)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* No Data Message */}
      {profitData && profitData.profitDetails.length === 0 && (
        <div className='mt-6 rounded-lg bg-gray-50 py-8 text-center'>
          <p className='text-gray-500'>
            No sales data found for the selected date range
          </p>
        </div>
      )}
    </div>
  );
};

export default ProfitAnalysis;
