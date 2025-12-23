import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { LocalProduct } from '@/components/products/LocalProductCard';

interface CompareStore {
  items: LocalProduct[];
  maxItems: number;
  isOpen: boolean;
  
  // Actions
  addItem: (product: LocalProduct) => boolean;
  removeItem: (productId: string) => void;
  clearAll: () => void;
  isInCompare: (productId: string) => boolean;
  toggleCompareDrawer: (open?: boolean) => void;
}

export const useCompareStore = create<CompareStore>()(
  persist(
    (set, get) => ({
      items: [],
      maxItems: 4,
      isOpen: false,

      addItem: (product) => {
        const { items, maxItems } = get();
        
        // Check if already in compare
        if (items.some(item => item.id === product.id)) {
          return false;
        }
        
        // Check max limit
        if (items.length >= maxItems) {
          return false;
        }
        
        set({ items: [...items, product] });
        return true;
      },

      removeItem: (productId) => {
        set({
          items: get().items.filter(item => item.id !== productId)
        });
      },

      clearAll: () => {
        set({ items: [], isOpen: false });
      },

      isInCompare: (productId) => {
        return get().items.some(item => item.id === productId);
      },

      toggleCompareDrawer: (open) => {
        set({ isOpen: open ?? !get().isOpen });
      },
    }),
    {
      name: 'product-compare',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ items: state.items }),
    }
  )
);