import { useState, useCallback } from 'react';

export const useInvoiceForm = () => {
  const [invoiceData, setInvoiceData] = useState<any>({ 
    customerType: 'WalkIn Customer',
    customerName: '',
    customerAddress: '',
    customerContactNumber: '',
    clientName: '',
    customerId: null
  });

  const handleChange = useCallback((e: any) => {
    const { name, value } = e.target;
    setInvoiceData((prevInv: any) => ({ ...prevInv, [name]: value }));
  }, []);

  const resetInvoiceData = () => {
    setInvoiceData({ 
      customerType: 'WalkIn Customer',
      customerName: '',
      customerAddress: '',
      customerContactNumber: '',
      clientName: '',
      customerId: null
    });
  };

  return {
    invoiceData,
    setInvoiceData,
    handleChange,
    resetInvoiceData,
  };
};