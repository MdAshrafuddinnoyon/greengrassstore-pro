import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { LocalProductCard } from "./LocalProductCard";
import { useLanguage } from "@/contexts/LanguageContext";

interface LocalProduct {
  id: string;
  name: string;
  name_ar?: string;
  slug: string;
  description?: string;
  price: number;
  compare_at_price?: number;
  currency: string;
  category: string;
  featured_image?: string;
  images?: string[];
  is_featured: boolean;
  is_on_sale: boolean;
  is_new: boolean;
  is_active: boolean;
  stock_quantity: number;
}

interface LocalRelatedProductsProps {
  currentProductId: string;
  category: string;
}

export const LocalRelatedProducts = ({ currentProductId, category }: LocalRelatedProductsProps) => {
  const { language } = useLanguage();
  const isArabic = language === 'ar';
  const [products, setProducts] = useState<LocalProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadRelatedProducts = async () => {
      setLoading(true);
      try {
        // First try to get products from the same category
        let { data, error } = await supabase
          .from('products')
          .select('*')
          .eq('is_active', true)
          .ilike('category', category)
          .neq('id', currentProductId)
          .limit(4);

        if (error) throw error;

        // If no products found in same category, get random products
        if (!data || data.length === 0) {
          const { data: randomData, error: randomError } = await supabase
            .from('products')
            .select('*')
            .eq('is_active', true)
            .neq('id', currentProductId)
            .limit(4);
          
          if (randomError) throw randomError;
          data = randomData;
        }

        setProducts(data || []);
      } catch (error) {
        console.error("Error loading related products:", error);
      } finally {
        setLoading(false);
      }
    };

    if (currentProductId) {
      loadRelatedProducts();
    }
  }, [currentProductId, category]);

  if (loading) {
    return (
      <section className="py-12 bg-muted/30">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-serif font-semibold text-foreground mb-8">
            {isArabic ? 'منتجات قد تعجبك' : 'You May Also Like'}
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-background rounded-xl overflow-hidden animate-pulse">
                <div className="aspect-square bg-muted" />
                <div className="p-4 space-y-3">
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-4 bg-muted rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (products.length === 0) {
    return null;
  }

  return (
    <section className="py-12 bg-muted/30">
      <div className="container mx-auto px-4">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-2xl font-serif font-semibold text-foreground mb-8"
        >
          {isArabic ? 'منتجات قد تعجبك' : 'You May Also Like'}
        </motion.h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {products.map((product, index) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
            >
              <LocalProductCard product={product} />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
