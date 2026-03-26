// src/store/invoiceAtoms.ts
// Jotai atoms for invoice state management - carefully designed to avoid breaking existing functionality

import { atom } from 'jotai';
import { Invoice, InvoiceFormData, InvoiceModalState } from '@/entities/invoice';

// AccordionData interface (from useAccordionData.tsx)
interface AccordionData {
  [key: number]: {
    brandName: string;
    series: string;
    productPrice: string;
    quantity: string;
    warrentyStartDate: string;
    warrentyEndDate: string;
    warrentyCode: string;
    warrentyDuration: string;
    noWarranty: boolean;
    seriesOption: SeriesOption[];
    batteryDetails?: BatteryDetails;
  };
}

interface SeriesOption {
  label: string;
  value: string;
  batteryDetails?: BatteryDetails;
}

interface BatteryDetails {
  name: string;
  plate: string;
  ah: number;
  type?: string;
}

// Default invoice form data
const getDefaultInvoiceFormData = (): InvoiceFormData => ({
  invoiceNo: '',
  customerType: 'WalkIn Customer',
  customerName: '',
  customerAddress: '',
  customerContactNumber: '',
  products: [],
  subtotal: 0,
  taxAmount: 0,
  totalAmount: 0,
  receivedAmount: 0,
  remainingAmount: 0,
  paymentMethod: [],
  paymentStatus: 'pending',
  useCustomDate: false,
  customDate: undefined,
  batteriesRate: 0,
  batteriesCountAndWeight: '',
  isChargingService: false,
  chargingServices: [],
});

// Core atoms
export const invoiceFormDataAtom = atom<InvoiceFormData>(getDefaultInvoiceFormData());

// Modal state atom
export const invoiceModalStateAtom = atom<InvoiceModalState>({
  isOpen: false,
  type: 'create',
  data: undefined,
});

// Accordion state atoms
export const accordionDataAtom = atom<AccordionData>({});
export const expandedAccordionIndexAtom = atom<number>(-1);

// Loading state atom
export const invoiceLoadingAtom = atom<boolean>(false);

// Error state atom
export const invoiceErrorAtom = atom<string | null>(null);

// Derived atoms for computed values
export const invoiceTotalsAtom = atom((get) => {
  const formData = get(invoiceFormDataAtom);
  const accordionData = get(accordionDataAtom);
  
  // Import transformers dynamically to avoid circular dependencies
  const { transformAccordionData, calculateInvoiceTotals } = require('@/features/invoice-management/shared/transformers');
  
  try {
    const transformedProducts = transformAccordionData(accordionData);
    return calculateInvoiceTotals(
      formData.isChargingService || false,
      transformedProducts,
      formData.chargingServices || [],
      formData.taxAmount || 0,
      formData.receivedAmount || 0
    );
  } catch (error) {
    console.error('Error calculating invoice totals:', error);
    return {
      subtotal: 0,
      totalAmount: 0,
      remainingAmount: 0,
    };
  }
});

// Action atoms for state updates
export const updateInvoiceFieldAtom = atom(
  null,
  (get, set, { field, value }: { field: keyof InvoiceFormData, value: any }) => {
    set(invoiceFormDataAtom, (prev) => ({
      ...prev,
      [field]: value,
    }));
  }
);

export const resetInvoiceFormDataAtom = atom(
  null,
  (get, set) => {
    set(invoiceFormDataAtom, getDefaultInvoiceFormData());
  }
);

export const setInvoiceFormDataAtom = atom(
  null,
  (get, set, data: InvoiceFormData) => {
    set(invoiceFormDataAtom, data);
  }
);

// Accordion action atoms
export const updateAccordionFieldAtom = atom(
  null,
  (get, set, { index, field, value }: { index: number, field: string, value: any }) => {
    set(accordionDataAtom, (prev) => ({
      ...prev,
      [index]: {
        ...prev[index],
        [field]: value,
      },
    }));
  }
);

export const resetAccordionDataAtom = atom(
  null,
  (get, set) => {
    set(accordionDataAtom, {});
    set(expandedAccordionIndexAtom, -1);
  }
);

export const setAccordionDataAtom = atom(
  null,
  (get, set, data: AccordionData) => {
    set(accordionDataAtom, data);
  }
);

export const setExpandedAccordionIndexAtom = atom(
  null,
  (get, set, index: number) => {
    set(expandedAccordionIndexAtom, index);
  }
);

// Modal action atoms
export const openInvoiceModalAtom = atom(
  null,
  (get, set, { type, data }: { type: InvoiceModalState['type'], data?: Invoice }) => {
    set(invoiceModalStateAtom, {
      isOpen: true,
      type,
      data,
    });
  }
);

export const closeInvoiceModalAtom = atom(
  null,
  (get, set) => {
    set(invoiceModalStateAtom, {
      isOpen: false,
      type: 'create',
      data: undefined,
    });
  }
);

// Utility atoms
export const isInvoiceModalOpenAtom = atom((get) => get(invoiceModalStateAtom).isOpen);
export const invoiceModalTypeAtom = atom((get) => get(invoiceModalStateAtom).type);
export const invoiceModalDataAtom = atom((get) => get(invoiceModalStateAtom).data);
