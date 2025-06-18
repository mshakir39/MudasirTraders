import { create } from 'zustand';

interface Brand {
  id: string;
  brandName: string;
  // Add other fields as needed
}

interface BrandStore {
  brands: Brand[];
  setBrands: (brands: Brand[]) => void;
  fetchBrands: () => Promise<void>;
}

export const useBrandStore = create<BrandStore>((set) => ({
  brands: [],
  setBrands: (brands) => set({ brands }),
  fetchBrands: async () => {
    try {
      const res = await fetch('/api/brands');
      const data = await res.json();
      set({ brands: Array.isArray(data) ? data : [] });
    } catch (error) {
      set({ brands: [] });
    }
  },
})); 