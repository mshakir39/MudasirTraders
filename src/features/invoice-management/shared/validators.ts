// src/features/invoice-management/shared/validators.ts
// Invoice form validation functions

import { InvoiceFormData } from '@/entities/invoice';
import { toast } from 'react-toastify';

export const validateCustomerInfo = (invoiceData: InvoiceFormData): boolean => {
  if (!invoiceData.customerName?.trim()) {
    toast.error('Please enter customer name');
    return false;
  }
  
  if (!invoiceData.customerContactNumber?.trim()) {
    toast.error('Please enter customer contact number');
    return false;
  }

  // Allow "-" as valid phone number for walk-in customers
  if (invoiceData.customerContactNumber.trim() !== '-') {
    const cleanPhone = invoiceData.customerContactNumber.replace(/\D/g, '');
    if (cleanPhone.length < 10 || cleanPhone.length > 15) {
      toast.error('Invalid phone number format');
      return false;
    }
  }

  return true;
};

export const validateProducts = (accordionData: any): boolean => {
  const accordionKeys = Object.keys(accordionData);
  if (accordionKeys.length === 0) {
    toast.error('Please add at least one product');
    return false;
  }

  for (const key of accordionKeys) {
    const item = accordionData[parseInt(key)];
    if (!item.brandName) {
      toast.error(`Please select brand for Row ${key}`);
      return false;
    }
    if (!item.series) {
      toast.error(`Please select series for Row ${key}`);
      return false;
    }
    if (!item.productPrice || Number(item.productPrice) <= 0) {
      toast.error(`Please enter valid product price for Row ${key}`);
      return false;
    }
    if (!item.quantity || Number(item.quantity) <= 0) {
      toast.error(`Please enter valid quantity for Row ${key}`);
      return false;
    }
    if (!item.noWarranty && !item.warrentyCode?.trim()) {
      toast.error(`Please enter warranty code for Row ${key}`);
      return false;
    }
  }

  return true;
};

export const validatePaymentMethod = (invoiceData: InvoiceFormData): boolean => {
  if (!invoiceData?.paymentMethod || invoiceData?.paymentMethod.length === 0) {
    toast.error('Please select at least one payment method');
    return false;
  }
  return true;
};

export const validateCustomDate = (invoiceData: InvoiceFormData): boolean => {
  if (invoiceData?.useCustomDate === true) {
    if (!invoiceData?.customDate) {
      toast.error('Please select a date and time for the invoice');
      return false;
    }

    const selectedDate = new Date(invoiceData.customDate);
    if (isNaN(selectedDate.getTime())) {
      toast.error('Please select a valid date and time');
      return false;
    }
  }
  return true;
};

export const validateForm = (invoiceData: InvoiceFormData, accordionData: any): boolean => {
  if (!validateCustomerInfo(invoiceData)) return false;
  
  if (!invoiceData.isChargingService) {
    if (!validateProducts(accordionData)) return false;
  }
  
  if (!validatePaymentMethod(invoiceData)) return false;
  
  if (!validateCustomDate(invoiceData)) return false;

  return true;
};
