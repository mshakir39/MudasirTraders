import { useState, useEffect, useCallback } from 'react';

export const useCustomers = () => {
  const [customers, setCustomers] = useState<any[]>([]);

  const fetchCustomers = useCallback(async () => {
    try {
      const response = await fetch('/api/customers');
      const result = await response.json();
      if (result.success && Array.isArray(result.data)) {
        setCustomers(result.data);
      }
    } catch (error) {}
  }, []);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  return { customers, refetchCustomers: fetchCustomers };
};
