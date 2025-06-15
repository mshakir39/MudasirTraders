import React, { useMemo } from 'react';
import DataGridDemo from "@/components/dataGrid";

interface SalesDataGridProps {
  filteredSales: any[];
  onViewProducts: (sale: any) => void;
}

const SalesDataGrid: React.FC<SalesDataGridProps> = ({ 
  filteredSales, 
  onViewProducts 
}) => {
  const columns = useMemo(() => [
    { 
      field: "date", 
      headerName: "Date", 
      width: 180, 
      renderCell: (item: any) => {
        // Use consistent date formatting to avoid hydration mismatch
        const date = new Date(item.row.date);
        return date.toLocaleDateString('en-GB', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        });
      }
    },
    { 
      field: "customerName", 
      headerName: "Customer", 
      width: 180 
    },
    {
      field: "products",
      headerName: "Products",
      width: 300,
      renderCell: (item: any) => {
        const products = item.row.products || [];
        const productCount = products.length;
        
        if (productCount === 0) {
          return <span className="text-gray-400">No products</span>;
        }
        
        if (productCount === 1) {
          const product = products[0];
          return (
            <div className="text-sm">
              {product.series || product.batteryDetails?.name} × {product.quantity}
            </div>
          );
        }
        
        // For multiple products, show clickable summary
        const firstProduct = products[0];
        const remainingCount = productCount - 1;
        
        return (
          <div 
            className="text-sm cursor-pointer hover:bg-blue-50 p-1 rounded transition-colors"
            onClick={() => onViewProducts(item.row)}
          >
            <div className="font-medium text-blue-600">
              {firstProduct.series || firstProduct.batteryDetails?.name} × {firstProduct.quantity}
            </div>
            {remainingCount > 0 && (
              <div className="text-xs text-gray-500 mt-1">
                +{remainingCount} more product{remainingCount > 1 ? 's' : ''} - Click to view all
              </div>
            )}
          </div>
        );
      },
    },
    { 
      field: "totalAmount", 
      headerName: "Total Amount", 
      width: 150,
      renderCell: (item: any) => `Rs ${item.row.totalAmount?.toLocaleString() || 0}`
    },
    { 
      field: "paymentMethod", 
      headerName: "Payment Method", 
      width: 200, 
      renderCell: (item: any) => item.row.paymentMethod?.join(", ") 
    },
  ], [onViewProducts]);

  // Add an id to each row for DataGrid
  const rows = useMemo(() => 
    filteredSales.map((sale, idx) => ({ 
      id: sale.id || sale._id || idx, 
      ...sale 
    }))
  , [filteredSales]);

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      {filteredSales.length > 0 ? (
        <DataGridDemo 
          rows={rows} 
          columns={columns} 
          showButton={false} 
        />
      ) : (
        <div className="text-center py-12">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="mt-2 text-lg font-medium text-gray-900">No sales found</h3>
          <p className="mt-1 text-gray-500">
            No sales data available for the selected date range.
          </p>
        </div>
      )}
    </div>
  );
};

export default SalesDataGrid;