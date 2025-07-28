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
    
    if (name === 'customerType' && value === 'WalkIn Customer') {
      setInvoiceData((prevInv: any) => ({
        ...prevInv,
        customerType: value,
        customerName: '',
        customerAddress: '',
        customerContactNumber: '',
        clientName: '',
        customerId: null,
      }));
    } else {
      setInvoiceData((prevInv: any) => ({ ...prevInv, [name]: value }));
    }
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