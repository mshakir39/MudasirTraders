import { useState, useEffect } from 'react';
import { getCustomers } from '@/actions/customerActions';

export const useCustomers = () => {
  const [customers, setCustomers] = useState<any[]>([]);

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const result = await getCustomers();
        if (result.success && Array.isArray(result.data)) {
          setCustomers(result.data);
        }
      } catch (error) {
        console.error('Error fetching customers:', error);
      }
    };
    fetchCustomers();
  }, []);

  return { customers };
};