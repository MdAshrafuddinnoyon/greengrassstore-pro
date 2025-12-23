import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Gift, ImageOff } from "lucide-react";
import { Link } from "react-router-dom";
import { useSiteSettings } from "@/contexts/SiteSettingsContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";

// Product image component with error handling
const ProductImage = ({ src, alt }: { src: string; alt: string }) => {
  const [hasError, setHasError] = useState(false);
  
  if (!src || hasError) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-muted/50">
        <ImageOff className="w-10 h-10 text-muted-foreground/40 mb-2" />
        <span className="text-xs text-muted-foreground/60">No Image</span>
      </div>
    );
  }
  
  return (
    <img
      src={src}
      alt={alt}
      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
      onError={() => setHasError(true)}
      loading="lazy"
    />
  );
};

interface GiftProduct {
  id: string;
  name: string;
  name_ar: string | null;
  price: number;
  featured_image: string | null;
  slug: string;
}

export const GiftSection = () => {
  const { giftSection, loading } = useSiteSettings();
  const { language } = useLanguage();
  const isArabic = language === "ar";
  const [giftProducts, setGiftProducts] = useState<GiftProduct[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);

  // Fetch gift products from database
  useEffect(() => {
    const fetchGiftProducts = async () => {
      try {
        const productsLimit = giftSection.productsLimit || 6;
        // Fetch all active products
        const { data, error } = await supabase
          .from('products')
          .select('id, name, name_ar, price, featured_image, slug, category, subcategory, tags')
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .limit(100);
        
        if (error) throw error;
        
        // Filter products that match gift criteria (case-insensitive)
        const filteredProducts = (data || []).filter(product => {
          const categoryLower = product.category?.toLowerCase() || '';
          const subcategoryLower = product.subcategory?.toLowerCase() || '';
          const categoryMatch = categoryLower.includes('gift') || categoryLower === 'gifts';
          const subcategoryMatch = subcategoryLower.includes('gift') || subcategoryLower === 'gifts';
          const tagsMatch = product.tags?.some((tag: string) => 
            tag.toLowerCase().includes('gift') || tag.toLowerCase() === 'gifts'
          );
          return categoryMatch || subcategoryMatch || tagsMatch;
        }).slice(0, productsLimit);
        
        // If no gift products found, show any active products as fallback
        if (filteredProducts.length === 0) {
          setGiftProducts((data || []).slice(0, productsLimit));
        } else {
          setGiftProducts(filteredProducts);
        }
      } catch (error) {
        console.error('Error fetching gift products:', error);
      } finally {
        setProductsLoading(false);
      }
    };

    fetchGiftProducts();

    // Real-time subscription for product updates
    const channel = supabase
      .channel('gift-products-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'products' },
        () => {
          fetchGiftProducts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [giftSection.productsLimit]);

  if (!giftSection.enabled && !loading) return null;

  const title = isArabic ? giftSection.titleAr : giftSection.title;
  const subtitle = isArabic ? giftSection.subtitleAr : giftSection.subtitle;
  const buttonText = isArabic ? giftSection.buttonTextAr : giftSection.buttonText;
  

  // Use admin-selected products if set, otherwise fallback to dynamic filtering
  let displayItems: {
    id: string;
    name: string;
    nameAr: string;
    price: number;
    image: string;
    href: string;
  }[] = [];

  if (giftSection.items && giftSection.items.length > 0) {
    displayItems = giftSection.items;
  } else if (giftProducts.length > 0) {
    displayItems = giftProducts.map(p => ({
      id: p.id,
      name: p.name,
      nameAr: p.name_ar || p.name,
      price: p.price,
      image: p.featured_image || 'https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=500',
      href: `/product/${p.slug}`
    }));
  }

  if (displayItems.length === 0 && !productsLoading) return null;

  return (
    <section className="py-8 md:py-16 bg-gradient-to-b from-background to-muted">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="text-center mb-6 md:mb-10"
        >
          <div className="flex items-center justify-center gap-2 mb-2">
            <Gift className="w-4 md:w-5 h-4 md:h-5 text-primary" />
            <p className="text-[10px] uppercase tracking-widest text-primary font-semibold">
              {isArabic ? "هدايا مثالية" : "Perfect Presents"}
            </p>
          </div>
          <h2 className="font-display text-xl md:text-3xl font-normal text-foreground mb-2 md:mb-3">
            {title}
          </h2>
          <p className="text-muted-foreground max-w-md mx-auto text-xs md:text-sm">
            {subtitle}
          </p>
        </motion.div>

        {productsLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-square bg-muted rounded-xl mb-2" />
                <div className="h-4 bg-muted rounded w-3/4 mb-1" />
                <div className="h-4 bg-muted rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : (
          <>
            {/* Mobile Horizontal Scroll */}
            <div className="md:hidden -mx-4 px-4">
              <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory">
                {displayItems.slice(0, giftSection.productsLimit || 6).map((item, index) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    viewport={{ once: true }}
                    className="snap-start flex-shrink-0 w-[200px]"
                  >
                    <Link to={item.href} className="group block">
                      <div className="aspect-square overflow-hidden bg-muted rounded-2xl mb-2">
                        <ProductImage 
                          src={item.image} 
                          alt={isArabic ? item.nameAr : item.name} 
                        />
                      </div>
                      <h3 className="text-sm font-medium text-foreground mb-1 line-clamp-1">
                        {isArabic ? item.nameAr : item.name}
                      </h3>
                      <p className="text-sm font-bold text-primary">AED {item.price}</p>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Desktop Grid */}
            <div className="hidden md:grid grid-cols-3 lg:grid-cols-4 gap-6">
              {displayItems.slice(0, giftSection.productsLimit || 6).map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  viewport={{ once: true }}
                >
                  <Link
                    to={item.href}
                    className="group block"
                  >
                    <div className="aspect-square overflow-hidden bg-muted rounded-xl mb-3">
                      <ProductImage 
                        src={item.image} 
                        alt={isArabic ? item.nameAr : item.name}
                      />
                    </div>
                    <h3 className="text-sm font-medium text-foreground mb-1 group-hover:text-primary transition-colors">
                      {isArabic ? item.nameAr : item.name}
                    </h3>
                    <p className="text-sm font-bold text-foreground">AED {item.price}</p>
                  </Link>
                </motion.div>
              ))}
            </div>
          </>
        )}

        <div className="text-center mt-6 md:mt-8">
          <Link
            to={giftSection.buttonLink}
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-5 md:px-6 py-2.5 md:py-3 rounded-full text-xs uppercase tracking-widest font-medium hover:bg-primary/90 transition-colors"
          >
            <Gift className="w-4 h-4" />
            {buttonText}
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>
    </section>
  );
};