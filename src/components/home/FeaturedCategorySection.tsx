import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, ChevronLeft, ChevronRight, Loader2, ShoppingCart, Heart, Percent, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCartStore } from "@/stores/cartStore";
import { toast } from "sonner";

import ficusPlant from "@/assets/ficus-plant.jpg";
import flowerPot from "@/assets/flower-pot.jpg";
import bluePot from "@/assets/blue-pot.jpg";
import gardenFlowers from "@/assets/garden-flowers.jpg";

interface LocalProduct {
  id: string;
  name: string;
  name_ar?: string;
  slug: string;
  price: number;
  compare_at_price?: number;
  currency: string;
  featured_image?: string;
  images?: string[];
  is_on_sale?: boolean;
  is_new?: boolean;
  category?: string;
  subcategory?: string;
}

const fallbackBanners: Record<string, string> = {
  pots: bluePot,
  plants: ficusPlant,
  flowers: flowerPot,
  gifts: gardenFlowers,
};

interface CategoryWithProducts {
  category: {
    id: string;
    name: string;
    nameAr: string;
    href: string;
    image: string;
  };
  products: LocalProduct[];
}

export const FeaturedCategorySection = () => {
  const [categories, setCategories] = useState<CategoryWithProducts[]>([]);
  const [loading, setLoading] = useState(true);
  const [sectionSettings, setSectionSettings] = useState<{
    enabled: boolean;
    categoriesLimit: number;
    productsPerCategory: number;
    selectedCategories: string[];
    images: Record<string, string>;
  }>({
    enabled: true,
    categoriesLimit: 4,
    productsPerCategory: 6,
    selectedCategories: [],
    images: {}
  });

  // Load settings from database
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const { data } = await supabase
          .from('site_settings')
          .select('setting_value')
          .eq('setting_key', 'featured_category_section')
          .single();
        
        if (data?.setting_value) {
          const settings = data.setting_value as any;
          setSectionSettings({
            enabled: settings.enabled ?? true,
            categoriesLimit: settings.categoriesLimit || 4,
            productsPerCategory: settings.productsPerCategory || 6,
            selectedCategories: settings.selectedCategories || [],
            images: settings.images || {}
          });
        }
      } catch (error) {
        console.error('Failed to load featured category settings:', error);
      }
    };
    loadSettings();
  }, []);

  useEffect(() => {
    // Don't load data until settings are fetched
    if (!sectionSettings.enabled) {
      setLoading(false);
      return;
    }

    const loadData = async () => {
      setLoading(true);
      try {
        const categoriesLimit = sectionSettings.categoriesLimit || 4;
        const productsPerCategory = sectionSettings.productsPerCategory || 6;
        const selectedCategories = sectionSettings.selectedCategories || [];
        const adminImages = sectionSettings.images || {};

        console.log('Loading featured categories with settings:', { categoriesLimit, productsPerCategory, selectedCategories });

        // Fetch all categories to build parent-child mapping
        const { data: allCategoriesData, error: allCatError } = await supabase
          .from('categories')
          .select('*')
          .eq('is_active', true)
          .order('display_order', { ascending: true });
        
        if (allCatError) throw allCatError;

        // Get only main categories (parent_id is null)
        let mainCategories = (allCategoriesData || []).filter(cat => 
          cat.parent_id === null
        );

        console.log('Available main categories:', mainCategories.map(c => ({ id: c.id, name: c.name, slug: c.slug })));
        
        // If specific categories are selected in admin, filter and order them by selection order
        if (selectedCategories.length > 0) {
          const selectedMainCategories = selectedCategories
            .map(id => mainCategories.find(cat => cat.id === id))
            .filter(Boolean) as typeof mainCategories;
          
          if (selectedMainCategories.length > 0) {
            mainCategories = selectedMainCategories;
          }
          console.log('Selected categories from admin:', selectedMainCategories.map(c => c.name));
        }
        
        mainCategories = mainCategories.slice(0, categoriesLimit);

        // Build a map of parent categories to their child slugs for product matching
        const parentToChildSlugs: Record<string, string[]> = {};
        mainCategories.forEach(parent => {
          const children = (allCategoriesData || []).filter(cat => 
            cat.parent_id === parent.id
          );
          parentToChildSlugs[parent.slug.toLowerCase()] = [
            parent.slug.toLowerCase(),
            parent.name.toLowerCase(),
            ...children.map(c => c.slug.toLowerCase()),
            ...children.map(c => c.name.toLowerCase()),
          ];
        });

        // Get products from Supabase
        const { data: products, error: prodError } = await supabase
          .from('products')
          .select('*')
          .eq('is_active', true)
          .order('is_featured', { ascending: false })
          .limit(200);

        if (prodError) throw prodError;

        console.log('Total products loaded:', products?.length);

        // Map products to parent categories - show categories even if no products
        const categoriesWithProducts = mainCategories.map((cat) => {
          const categorySlug = cat.slug.toLowerCase();
          const categoryName = cat.name.toLowerCase();
          const childSlugs = parentToChildSlugs[categorySlug] || [categorySlug, categoryName];

          // Match products that belong to this category or any of its children
          const matchedProducts = (products || []).filter((product) => {
            const prodCategory = product.category?.toLowerCase() || '';
            const prodSubcategory = product.subcategory?.toLowerCase() || '';
            const prodTags = (product.tags || []).map((t: string) => t.toLowerCase());

            // Check if product matches parent category directly
            if (childSlugs.includes(prodCategory)) return true;

            // Check if product's subcategory matches any child category
            if (prodSubcategory && childSlugs.includes(prodSubcategory)) return true;

            // Check tags for category match
            if (prodTags.some((tag: string) => childSlugs.includes(tag))) return true;

            // Flexible matching - check if category slug is contained in product category
            if (prodCategory.includes(categorySlug) || categorySlug.includes(prodCategory)) return true;

            // Special cases for common category names
            if (categorySlug.includes('pot') && prodCategory.includes('pot')) return true;
            if (categorySlug.includes('plant') && prodCategory.includes('plant')) return true;
            if (categorySlug.includes('flower') && prodCategory.includes('flower')) return true;
            if (categorySlug.includes('gift') && (prodCategory.includes('gift') || prodTags.includes('gift'))) return true;

            return false;
          });

          // Use admin-selected image if set, else fallback
          const adminImage = adminImages[cat.id];

          console.log(`Category "${cat.name}" matched ${matchedProducts.length} products`);

          return {
            category: {
              id: cat.id,
              name: cat.name,
              nameAr: cat.name_ar || cat.name,
              href: `/shop?category=${cat.slug}`,
              image: adminImage || cat.image || fallbackBanners[categorySlug] || ficusPlant,
            },
            products: matchedProducts.slice(0, productsPerCategory),
          };
        });

        // Show all selected categories, even those without products (with empty array)
        // But filter out categories with no products for display
        const displayCategories = categoriesWithProducts.filter(cat => cat.products.length > 0);

        console.log('Final categories to display:', displayCategories.map(c => `${c.category.name} (${c.products.length} products)`));

        setCategories(displayCategories);
      } catch (error) {
        console.error("Failed to fetch featured categories:", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [sectionSettings]);

  // If section is disabled, return null
  if (!sectionSettings.enabled) {
    return null;
  }

  if (loading) {
    return (
      <section className="py-12 md:py-20 bg-muted/30">
        <div className="container mx-auto px-4 flex justify-center py-10">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </section>
    );
  }

  if (categories.length === 0) {
    return null;
  }

  return (
    <section className="py-12 md:py-20 bg-muted/30">
      <div className="container mx-auto px-4 space-y-12 md:space-y-16">
        {categories.map((category, index) => {
          // Defensive: skip if category or category.category is missing
          if (!category || !category.category || !category.category.id) return null;
          return (
            <CategoryBannerSlider
              key={category.category.id}
              category={category.category}
              products={category.products}
              reverse={index % 2 === 1}
            />
          );
        })}
      </div>
    </section>
  );
};

// Product Image component with error handling
const ProductImage = ({ src, alt }: { src: string; alt: string }) => {
  const [hasError, setHasError] = useState(false);
  
  if (hasError || !src) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-muted/30">
        <div className="w-12 h-12 text-muted-foreground/40 mb-1">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-full h-full">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
          </svg>
        </div>
        <span className="text-[10px] text-muted-foreground/50">No Image</span>
      </div>
    );
  }
  
  return (
    <img
      src={src}
      alt={alt}
      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
      loading="lazy"
      onError={() => setHasError(true)}
    />
  );
};

interface CategoryBannerSliderProps {
  category: {
    id: string;
    name: string;
    nameAr: string;
    href: string;
    image: string;
  };
  products: LocalProduct[];
  reverse?: boolean;
}

const CategoryBannerSlider = ({ category, products, reverse }: CategoryBannerSliderProps) => {
  const { language } = useLanguage();
  const isArabic = language === 'ar';
  const addItem = useCartStore(state => state.addItem);

  const [emblaRef, emblaApi] = useEmblaCarousel(
    { loop: true, align: "start" },
    [Autoplay({ delay: 4000, stopOnInteraction: true })]
  );

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  const handleAddToCart = (product: LocalProduct, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const displayImage = product.featured_image || product.images?.[0] || '/placeholder.svg';
    
    addItem({
      product: { ...product, featured_image: displayImage } as any,
      variantId: product.id,
      variantTitle: 'Default',
      price: { amount: product.price.toString(), currencyCode: product.currency },
      quantity: 1,
      selectedOptions: []
    });
    
    toast.success(isArabic ? 'تمت الإضافة إلى السلة' : 'Added to cart');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      viewport={{ once: true }}
      className={`grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 items-stretch ${reverse ? "lg:flex-row-reverse" : ""}`}
    >
      {/* Banner Side */}
      <div className={`relative rounded-2xl overflow-hidden min-h-[280px] md:min-h-[400px] ${reverse ? "lg:order-2" : ""}`}>
        <img
          src={category.image}
          alt={isArabic ? category.nameAr : category.name}
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
        
        {/* Banner Content */}
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
          <span className="inline-block px-3 py-1 bg-white/20 backdrop-blur-sm text-white text-xs font-medium rounded-full mb-3">
            {isArabic ? 'مجموعة مميزة' : 'Featured Collection'}
          </span>
          <h3 className="text-2xl md:text-3xl lg:text-4xl font-display font-light text-white mb-2">
            {isArabic ? category.nameAr : category.name}
          </h3>
          <Button
            asChild
            size="sm"
            className="bg-white text-foreground hover:bg-white/90"
          >
            <Link to={category.href} className="inline-flex items-center gap-2">
              {isArabic ? `تسوق ${category.nameAr}` : `Shop ${category.name}`}
              <ArrowRight className="w-4 h-4" />
            </Link>
          </Button>
        </div>
      </div>

      {/* Products Slider Side */}
      <div className={`relative ${reverse ? "lg:order-1" : ""}`}>
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-base md:text-lg font-medium text-foreground">
            {isArabic ? `شائع في ${category.nameAr}` : `Popular in ${category.name}`}
          </h4>
          <div className="flex gap-2">
            <button
              onClick={scrollPrev}
              className="p-2 rounded-full bg-background border border-border/50 hover:bg-primary/10 hover:border-primary/30 transition-all"
              title="Scroll previous"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={scrollNext}
              className="p-2 rounded-full bg-background border border-border/50 hover:bg-primary/10 hover:border-primary/30 transition-all"
              title="Scroll next"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Products Carousel */}
        <div className="overflow-hidden -mx-2" ref={emblaRef}>
          <div className="flex">
            {products.map((product) => {
              const displayImage = product.featured_image || product.images?.[0] || '';
              const discountPercentage = product.compare_at_price 
                ? Math.round((1 - product.price / product.compare_at_price) * 100)
                : 0;

              // Defensive: skip if product or product.id is missing
              if (!product || !product.id) return null;
              return (
                <div key={product.id} className="flex-none w-[180px] md:w-[230px] px-2">
                  <div className="group block relative">
                    <Link to={`/product/${product.slug}`}
                      className="relative aspect-square rounded-2xl overflow-hidden mb-3 border border-border/20 bg-muted/50 shadow-md group-hover:shadow-xl group-hover:-translate-y-1 transition-all duration-300 block">
                      {displayImage ? (
                        <ProductImage 
                          src={displayImage} 
                          alt={isArabic && product.name_ar ? product.name_ar : product.name} 
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-muted/30">
                          <div className="w-12 h-12 text-muted-foreground/40 mb-1">
                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-full h-full">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                            </svg>
                          </div>
                          <span className="text-[10px] text-muted-foreground/50">No Image</span>
                        </div>
                      )}
                      {/* Badges */}
                      <div className="absolute top-2 left-2 flex flex-col gap-1 z-10">
                        {product.is_on_sale && discountPercentage > 0 && (
                          <span className="flex items-center gap-1 px-2 py-0.5 bg-gradient-to-r from-red-500 to-pink-500 text-white text-[11px] font-bold rounded-full shadow">
                            <Percent className="w-2.5 h-2.5" />
                            {discountPercentage}%
                          </span>
                        )}
                        {product.is_new && (
                          <span className="flex items-center gap-1 px-2 py-0.5 bg-gradient-to-r from-emerald-500 to-green-400 text-white text-[11px] font-bold rounded-full shadow">
                            <Sparkles className="w-2.5 h-2.5" />
                            {isArabic ? 'جديد' : 'NEW'}
                          </span>
                        )}
                      </div>
                      {/* Quick Add Button - inside the image container */}
                      <button
                        className="absolute bottom-2 right-2 p-2 bg-primary text-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-all hover:bg-primary/90 z-20"
                        onClick={(e) => handleAddToCart(product, e)}
                      >
                        <ShoppingCart className="w-4 h-4" />
                      </button>
                    </Link>
                    <h5 className="font-semibold text-sm text-foreground line-clamp-2 group-hover:text-primary transition-colors min-h-[2.5rem]">
                      {isArabic && product.name_ar ? product.name_ar : product.name}
                    </h5>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-base text-primary font-bold">
                        {product.currency} {product.price.toFixed(0)}
                      </span>
                      {product.compare_at_price && product.compare_at_price > product.price && (
                        <span className="text-xs text-muted-foreground line-through">
                          {product.currency} {product.compare_at_price.toFixed(0)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* View All Link */}
        <Link
          to={category.href}
          className="inline-flex items-center gap-1 text-sm text-primary font-medium mt-4 hover:gap-2 transition-all"
        >
          {isArabic ? `عرض الكل ${category.nameAr}` : `View All ${category.name}`}
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </motion.div>
  );
};
