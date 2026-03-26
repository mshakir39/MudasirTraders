import { useState, useEffect } from 'react';

export const useCustomers = () => {
  const [customers, setCustomers] = useState<any[]>([]);

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const response = await fetch('/api/customers');
        const result = await response.json();
        if (result.success && Array.isArray(result.data)) {
          setCustomers(result.data);
        }
      } catch (error) {}
    };
    fetchCustomers();
  }, []);

  return { customers };
};
