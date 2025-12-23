import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { LocalProductCard } from "@/components/products/LocalProductCard";
import { useProducts } from "@/hooks/useProducts";
import { useLanguage } from "@/contexts/LanguageContext";

interface LocalProductGridProps {
  title?: string;
  titleAr?: string;
  subtitle?: string;
  subtitleAr?: string;
  category?: string;
  subcategory?: string;
  featured?: boolean;
  onSale?: boolean;
  isNew?: boolean;
  limit?: number;
}

export const LocalProductGrid = ({
  title = "Our Products",
  titleAr = "منتجاتنا",
  subtitle = "Discover our curated selection",
  subtitleAr = "اكتشف مجموعتنا المختارة",
  category,
  subcategory,
  featured,
  onSale,
  isNew,
  limit = 8
}: LocalProductGridProps) => {
  const { language } = useLanguage();
  const isArabic = language === 'ar';
  
  const { products, loading, error } = useProducts({
    category,
    subcategory,
    featured,
    onSale,
    isNew,
    limit
  });

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="flex justify-center items-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="text-center py-20">
          <p className="text-muted-foreground">
            {isArabic ? 'فشل في تحميل المنتجات' : 'Failed to load products'}
          </p>
        </div>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="text-center py-20">
          <p className="text-muted-foreground">
            {isArabic ? 'لا توجد منتجات متاحة' : 'No products available'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        viewport={{ once: true }}
        className="text-center mb-10"
      >
        <h2 className="text-2xl md:text-3xl lg:text-4xl font-display font-light text-foreground mb-3">
          {isArabic ? titleAr : title}
        </h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          {isArabic ? subtitleAr : subtitle}
        </p>
      </motion.div>

      {/* Products Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
        {products.map((product, index) => (
          <motion.div
            key={product.id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
            viewport={{ once: true }}
          >
            <LocalProductCard product={product} isArabic={isArabic} />
          </motion.div>
        ))}
      </div>
    </div>
  );
};
