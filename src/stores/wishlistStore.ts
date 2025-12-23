import { create } from "zustand";
import { supabase } from "@/integrations/supabase/client";

export interface WishlistItem {
  id: string;
  product_id: string;
  product_title: string;
  product_image: string | null;
  product_price: string | null;
  created_at: string;
}

interface WishlistState {
  items: WishlistItem[];
  loading: boolean;
  fetchWishlist: () => Promise<void>;
  addToWishlist: (product: {
    id: string;
    title: string;
    image?: string;
    price?: string;
  }) => Promise<boolean>;
  removeFromWishlist: (productId: string) => Promise<boolean>;
  isInWishlist: (productId: string) => boolean;
  clearWishlist: () => void;
}

export const useWishlistStore = create<WishlistState>((set, get) => ({
  items: [],
  loading: false,

  fetchWishlist: async () => {
    set({ loading: true });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        set({ items: [], loading: false });
        return;
      }

      const { data, error } = await supabase
        .from("wishlist")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      set({ items: data || [], loading: false });
    } catch (error) {
      console.error("Error fetching wishlist:", error);
      set({ loading: false });
    }
  },

  addToWishlist: async (product) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { error } = await supabase.from("wishlist").insert({
        user_id: user.id,
        product_id: product.id,
        product_title: product.title,
        product_image: product.image || null,
        product_price: product.price || null,
      });

      if (error) {
        if (error.code === "23505") {
          // Already exists
          return true;
        }
        throw error;
      }

      await get().fetchWishlist();
      return true;
    } catch (error) {
      console.error("Error adding to wishlist:", error);
      return false;
    }
  },

  removeFromWishlist: async (productId) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { error } = await supabase
        .from("wishlist")
        .delete()
        .eq("user_id", user.id)
        .eq("product_id", productId);

      if (error) throw error;

      set((state) => ({
        items: state.items.filter((item) => item.product_id !== productId),
      }));
      return true;
    } catch (error) {
      console.error("Error removing from wishlist:", error);
      return false;
    }
  },

  isInWishlist: (productId) => {
    return get().items.some((item) => item.product_id === productId);
  },

  clearWishlist: () => {
    set({ items: [] });
  },
}));