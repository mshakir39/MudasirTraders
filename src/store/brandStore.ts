import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

interface Brand {
  id?: string;
  brandName: string;
  // Add other fields as needed
}

interface BrandStore {
  brands: Brand[];
  setBrands: (brands: Brand[]) => void;
  fetchBrands: () => Promise<void>;
  // React 19: Add optimistic update support
  optimisticAdd: (brand: Brand) => void;
  optimisticRemove: (id: string) => void;
  // React 19: Enhanced error handling
  error: string | null;
  isLoading: boolean;
  setError: (error: string | null) => void;
  setLoading: (loading: boolean) => void;
}

export const useBrandStore = create<BrandStore>()(
  subscribeWithSelector((set, get) => ({
    brands: [],
    error: null,
    isLoading: false,

    setBrands: (brands) => set({ brands }),

    setError: (error) => set({ error }),

    setLoading: (isLoading) => set({ isLoading }),

    // React 19: Optimistic add for instant UI updates
    optimisticAdd: (brand) =>
      set((state) => ({
        brands: [...state.brands, { ...brand, id: `temp-${Date.now()}` }],
      })),

    // React 19: Optimistic remove for instant UI updates
    optimisticRemove: (id) =>
      set((state) => ({
        brands: state.brands.filter((brand) => brand.id !== id),
      })),

    fetchBrands: async () => {
      const { setLoading, setError } = get();

      setLoading(true);
      setError(null);

      try {
        const res = await fetch('/api/brands');

        if (!res.ok) {
          throw new Error(`Failed to fetch brands: ${res.status}`);
        }

        const data = await res.json();
        set({ brands: Array.isArray(data) ? data : [] });
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to fetch brands';
        setError(errorMessage);
        set({ brands: [] });
      } finally {
        setLoading(false);
      }
    },
  }))
);
