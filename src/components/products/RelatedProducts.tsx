import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { LocalProductCard, LocalProduct } from "./LocalProductCard";

interface RelatedProductsProps {
  currentProductId: string;
  category?: string;
  tags?: string[];
}

export const RelatedProducts = ({ currentProductId, category, tags }: RelatedProductsProps) => {
  const [products, setProducts] = useState<LocalProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadRelatedProducts = async () => {
      setLoading(true);
      try {
        let query = supabase
          .from('products')
          .select('*')
          .eq('is_active', true)
          .neq('id', currentProductId)
          .limit(8);

        // Filter by category if provided
        if (category) {
          query = query.eq('category', category);
        }

        const { data, error } = await query;

        if (error) throw error;
        
        setProducts((data || []).slice(0, 4));
      } catch (error) {
        console.error("Error loading related products:", error);
      } finally {
        setLoading(false);
      }
    };

    loadRelatedProducts();
  }, [currentProductId, category]);

  if (loading) {
    return (
      <div className="py-12 bg-muted/30">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-serif font-semibold text-foreground mb-8">
            Related Products
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
      </div>
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
          You May Also Like
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
