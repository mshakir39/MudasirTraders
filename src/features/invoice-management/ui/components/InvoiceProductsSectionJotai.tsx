// src/features/invoice-management/ui/components/InvoiceProductsSectionJotai.tsx
// Jotai version of InvoiceProductsSection - eliminates accordion prop drilling

'use client';

import React from 'react';
import { useAtom, useSetAtom } from 'jotai';
import { invoiceFormDataAtom, updateInvoiceFieldAtom } from '@/store/invoiceAtoms';
import { InvoiceFormData } from '@/entities/invoice';
import ProductSection from './product/ProductSectionRefactored';
import ChargingServiceSection from './ChargingServiceSection';
import { Toggle } from '@/components/toggle';
import { useAccordionDataJotai } from '../../lib/useAccordionDataJotai';

interface InvoiceProductsSectionJotaiProps {
  categories: any[];
  stock: any[];
  brandOptions?: any[];
}

export const InvoiceProductsSectionJotai: React.FC<InvoiceProductsSectionJotaiProps> = ({
  categories,
  stock,
  brandOptions
}) => {
  const [invoiceData, setInvoiceData] = useAtom(invoiceFormDataAtom);
  const updateInvoiceField = useSetAtom(updateInvoiceFieldAtom);
  
  // Use Jotai accordion hook
  const {
    accordionData,
    expandedAccordionIndex,
    setExpandedAccordionIndex,
    handleAccordionClick,
    accordionMethods,
    initializeAccordionData
  } = useAccordionDataJotai(categories, stock);

  // Initialize accordion data when component mounts
  React.useEffect(() => {
    initializeAccordionData();
  }, [initializeAccordionData]);

  const normalizedStock = React.useMemo(() => {
    if (!Array.isArray(stock)) return [];
    return stock.map(item => ({
      ...item,
      brandName: item.brandName || item.name || '',
      series: item.series || item.model || '',
      quantity: item.quantity || 0,
      productPrice: item.productPrice || item.price || 0,
    }));
  }, [stock]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Products</h3>
        <Toggle
          checked={invoiceData?.isChargingService || false}
          onChange={(checked) => {
            updateInvoiceField({ field: 'isChargingService', value: checked });
            // Auto-create first service when enabling charging mode
            updateInvoiceField({ 
              field: 'chargingServices', 
              value: checked && (!invoiceData.chargingServices || invoiceData.chargingServices.length === 0)
                ? [{
                    id: Date.now().toString(),
                    description: '',
                    quantity: 1,
                    price: 0,
                    total: 0,
                  }]
                : invoiceData.chargingServices
            });
          }}
          label="Charging Service Mode"
          size="sm"
          color="blue"
        />
      </div>

      {invoiceData?.isChargingService ? (
        <ChargingServiceSection
          chargingServices={invoiceData?.chargingServices || []}
          expandedAccordionIndex={expandedAccordionIndex}
          onAccordionClick={setExpandedAccordionIndex}
          onServiceChange={(index: number, field: string, value: any) => {
            const updatedServices = [...(invoiceData?.chargingServices || [])];
            updatedServices[index] = {
              ...updatedServices[index],
              [field]: value,
            };

            if (field === 'quantity' || field === 'price') {
              updatedServices[index].total =
                (updatedServices[index].quantity || 1) *
                (updatedServices[index].price || 0);
            }

            updateInvoiceField({
              field: 'chargingServices',
              value: updatedServices,
            });
          }}
          onServiceRemove={(index: number) => {
            const updatedServices = (invoiceData?.chargingServices || []).filter((_: any, i: number) => i !== index);
            updateInvoiceField({
              field: 'chargingServices',
              value: updatedServices,
            });
          }}
          onServiceAdd={() => {
            const newService = {
              id: Date.now().toString(),
              description: '',
              quantity: 1,
              price: 0,
              total: 0,
            };
            updateInvoiceField({
              field: 'chargingServices',
              value: [
                ...(invoiceData.chargingServices || []),
                newService,
              ],
            });
          }}
        />
      ) : (
        <ProductSection
          accordionData={accordionData}
          categories={categories}
          brandOptions={brandOptions || []}
          expandedAccordionIndex={expandedAccordionIndex}
          onAccordionClick={handleAccordionClick}
          accordionMethods={accordionMethods}
          stock={normalizedStock}
        />
      )}
    </div>
  );
};
