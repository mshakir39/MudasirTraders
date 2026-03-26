// src/features/invoice-management/ui/components/InvoiceProductsSection.tsx
// Invoice products section - <80 lines (includes accordion functionality)

'use client';

import React from 'react';
import { InvoiceFormData } from '@/entities/invoice';
import ProductSection from './product/ProductSectionRefactored';
import ChargingServiceSection from './ChargingServiceSection';
import { Toggle } from '@/components/toggle';

interface InvoiceProductsSectionProps {
  invoiceData: InvoiceFormData;
  setInvoiceData: (data: InvoiceFormData) => void;
  categories: any[];
  stock: any[];
  accordionData?: any;
  expandedAccordionIndex?: number;
  onAccordionClick?: (index: number) => void;
  accordionMethods?: any;
  brandOptions?: any[];
}

export const InvoiceProductsSection: React.FC<InvoiceProductsSectionProps> = ({
  invoiceData,
  setInvoiceData,
  categories,
  stock,
  accordionData,
  expandedAccordionIndex = -1,
  onAccordionClick,
  accordionMethods,
  brandOptions
}) => {
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
            setInvoiceData({
              ...invoiceData,
              isChargingService: checked,
              // Auto-create first service when enabling charging mode
              chargingServices: checked && (!invoiceData.chargingServices || invoiceData.chargingServices.length === 0)
                ? [{
                    id: Date.now().toString(),
                    description: '',
                    quantity: 1,
                    price: 0,
                    total: 0,
                  }]
                : invoiceData.chargingServices,
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
          onAccordionClick={onAccordionClick || (() => {})}
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

            setInvoiceData({
              ...invoiceData,
              chargingServices: updatedServices,
            });
          }}
          onServiceRemove={(index: number) => {
            const updatedServices = (invoiceData?.chargingServices || []).filter((_: any, i: number) => i !== index);
            setInvoiceData({
              ...invoiceData,
              chargingServices: updatedServices,
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
            setInvoiceData({
              ...invoiceData,
              chargingServices: [
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
          onAccordionClick={onAccordionClick || (() => {})}
          accordionMethods={accordionMethods}
          stock={normalizedStock}
        />
      )}
    </div>
  );
};
