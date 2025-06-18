import { create } from 'zustand';

interface Category {
  id: string;
  brandName: string;
  series: string[];
  salesTax: string;
  // Add other fields as needed
}

interface CategoryStore {
  categories: Category[];
  setCategories: (categories: Category[]) => void;
  fetchCategories: () => Promise<void>;
}

export const useCategoryStore = create<CategoryStore>((set) => ({
  categories: [],
  setCategories: (categories) => set({ categories }),
  fetchCategories: async () => {
    try {
      const res = await fetch('/api/categories');
      const data = await res.json();
      set({ categories: Array.isArray(data) ? data : [] });
    } catch (error) {
      set({ categories: [] });
    }
  },
})); 