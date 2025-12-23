import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { 
  Leaf, Flower2, Package, Shrub, Sparkles, Gift, Tag, Loader2,
  TreeDeciduous, Palmtree, Cherry, TreePine, Scissors, Droplets,
  Home, Lamp, Frame, Sofa, Brush, Palette, Box, ShoppingBag,
  ChevronLeft, ChevronRight
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";

interface Category {
  id: string;
  name: string;
  name_ar: string | null;
  slug: string;
  image: string | null;
  image_url?: string | null;
  description: string | null;
}

// Extended icon mapping - matches category names dynamically
const getIconForCategory = (handle: string, title: string): typeof Leaf => {
  const lowerHandle = handle.toLowerCase();
  const lowerTitle = title.toLowerCase();
  
  // Plants & Trees
  if (lowerHandle.includes("plant") || lowerTitle.includes("plant")) return Leaf;
  if (lowerHandle.includes("tree") || lowerTitle.includes("tree")) return TreeDeciduous;
  if (lowerHandle.includes("palm") || lowerTitle.includes("palm")) return Palmtree;
  if (lowerHandle.includes("ficus") || lowerTitle.includes("ficus")) return TreePine;
  if (lowerHandle.includes("olive") || lowerTitle.includes("olive")) return Cherry;
  if (lowerHandle.includes("bamboo") || lowerTitle.includes("bamboo")) return TreePine;
  
  // Flowers
  if (lowerHandle.includes("flower") || lowerTitle.includes("flower")) return Flower2;
  if (lowerHandle.includes("bouquet") || lowerTitle.includes("bouquet")) return Flower2;
  if (lowerHandle.includes("rose") || lowerTitle.includes("rose")) return Cherry;
  
  // Pots & Planters
  if (lowerHandle.includes("pot") || lowerTitle.includes("pot")) return Package;
  if (lowerHandle.includes("planter") || lowerTitle.includes("planter")) return Box;
  if (lowerHandle.includes("ceramic") || lowerTitle.includes("ceramic")) return Package;
  if (lowerHandle.includes("fiber") || lowerTitle.includes("fiber")) return Package;
  
  // Greenery
  if (lowerHandle.includes("green") || lowerTitle.includes("green")) return Shrub;
  if (lowerHandle.includes("moss") || lowerTitle.includes("moss")) return Shrub;
  if (lowerHandle.includes("grass") || lowerTitle.includes("grass")) return Shrub;
  if (lowerHandle.includes("wall") || lowerTitle.includes("wall")) return Frame;
  
  // Vases & Decor
  if (lowerHandle.includes("vase") || lowerTitle.includes("vase")) return Sparkles;
  if (lowerHandle.includes("decor") || lowerTitle.includes("decor")) return Lamp;
  if (lowerHandle.includes("home") || lowerTitle.includes("home")) return Home;
  
  // Gifts
  if (lowerHandle.includes("gift") || lowerTitle.includes("gift")) return Gift;
  
  // Sale & Offers
  if (lowerHandle.includes("sale") || lowerTitle.includes("sale")) return Tag;
  if (lowerHandle.includes("offer") || lowerTitle.includes("offer")) return Tag;
  if (lowerHandle.includes("discount") || lowerTitle.includes("discount")) return Tag;
  
  // Hanging
  if (lowerHandle.includes("hang") || lowerTitle.includes("hang")) return Droplets;
  
  // Care & Accessories
  if (lowerHandle.includes("care") || lowerTitle.includes("care")) return Scissors;
  if (lowerHandle.includes("tool") || lowerTitle.includes("tool")) return Brush;
  if (lowerHandle.includes("accessory") || lowerTitle.includes("accessory")) return Palette;
  
  // Furniture
  if (lowerHandle.includes("furniture") || lowerTitle.includes("furniture")) return Sofa;
  
  // New & Featured
  if (lowerHandle.includes("new") || lowerTitle.includes("new")) return Sparkles;
  if (lowerHandle.includes("featured") || lowerTitle.includes("featured")) return Sparkles;
  if (lowerHandle.includes("best") || lowerTitle.includes("best")) return ShoppingBag;
  
  // Default
  return Leaf;
};

interface CategoryGridSettings {
  displayCount: number;
  displayCountMobile: number;
  autoplaySpeed: number;
  showArrows: boolean;
  imageScale: number;
  shape?: 'circle' | 'square' | 'rounded';
  gap?: number;
}

export const CategoriesGrid = () => {
  const { t, language } = useLanguage();
  const isArabic = language === 'ar';
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [settings, setSettings] = useState<CategoryGridSettings>({
    displayCount: 10,
    displayCountMobile: 6,
    autoplaySpeed: 3000,
    showArrows: true,
    imageScale: 1,
    shape: 'circle',
    gap: 24
  });

  // Detect mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const [emblaRef, emblaApi] = useEmblaCarousel(
    { 
      loop: true, 
      align: "start",
      dragFree: true,
    },
    [Autoplay({ delay: settings.autoplaySpeed, stopOnInteraction: true })]
  );

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        // Fetch categories
        const { data, error } = await supabase
          .from('categories')
          .select('*')
          .eq('is_active', true)
          .order('display_order', { ascending: true });
        
        if (error) throw error;
        setCategories(data || []);

        // Fetch settings
        const { data: settingsData } = await supabase
          .from('site_settings')
          .select('setting_value')
          .eq('setting_key', 'category_grid_settings')
          .single();

        if (settingsData?.setting_value) {
          setSettings(settingsData.setting_value as unknown as CategoryGridSettings);
        }
      } catch (error) {
        console.error("Failed to fetch categories:", error);
      } finally {
        setLoading(false);
      }
    };
    loadCategories();
  }, []);

  // Map categories to display data with dynamic icons - limit by settings based on device
  const displayLimit = isMobile ? (settings.displayCountMobile || 6) : settings.displayCount;
  const displayCategories = categories.slice(0, displayLimit).map((category) => {
    const isSale = category.slug === "sale" || category.slug.includes("sale");
    // Use image_url first (from admin), then fallback to image
    const categoryImage = category.image_url || category.image;
    
    return {
      id: category.id,
      name: isArabic && category.name_ar ? category.name_ar : category.name,
      slug: category.slug,
      icon: getIconForCategory(category.slug, category.name),
      href: `/shop?category=${category.slug}`,
      isSale,
      image: categoryImage,
    };
  });

  if (loading) {
    return (
      <section className="py-10 md:py-14 bg-background">
        <div className="container mx-auto px-4 flex justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      </section>
    );
  }

  if (displayCategories.length === 0) {
    return null;
  }

  return (
    <section className="py-10 md:py-14 bg-background border-b border-border/50">
      <div className="container mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="text-center mb-8 md:mb-10"
        >
          <span className="inline-block text-xs uppercase tracking-[0.2em] text-muted-foreground font-medium mb-2">
            {t("categories.browse")}
          </span>
          <h2 className="font-display text-2xl md:text-3xl font-light text-foreground">
            {t("categories.title")}
          </h2>
        </motion.div>

        {/* Carousel with Navigation */}
        <div className="relative group">
          {/* Previous Button */}
          {settings.showArrows && (
            <button
              onClick={scrollPrev}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white/90 hover:bg-white shadow-lg rounded-full p-2 opacity-0 group-hover:opacity-100 transition-all duration-300 -translate-x-1/2 hidden md:flex items-center justify-center"
            >
              <ChevronLeft className="w-5 h-5 text-foreground" />
            </button>
          )}

          {/* Next Button */}
          {settings.showArrows && (
            <button
              onClick={scrollNext}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white/90 hover:bg-white shadow-lg rounded-full p-2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-1/2 hidden md:flex items-center justify-center"
            >
              <ChevronRight className="w-5 h-5 text-foreground" />
            </button>
          )}

          {/* Embla Carousel */}
          <div className="overflow-hidden" ref={emblaRef}>
            <div 
              className="flex"
              style={{ gap: `${settings.gap || 24}px` }}
            >
              {displayCategories.map((category, index) => {
                const IconComponent = category.icon;
                const shapeClass = settings.shape === 'square' 
                  ? 'rounded-none' 
                  : settings.shape === 'rounded' 
                    ? 'rounded-xl' 
                    : 'rounded-full';
                
                return (
                  <motion.div
                    key={category.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.03 }}
                    viewport={{ once: true }}
                    className="flex-shrink-0"
                    style={{ 
                      minWidth: `${Math.round(80 * settings.imageScale) + 20}px`,
                    }}
                  >
                    <Link
                      to={category.href}
                      className="group/item flex flex-col items-center gap-3"
                    >
                      {/* Icon Circle or Image */}
                      <div 
                        className={`relative ${shapeClass} bg-[#f8f8f5] group-hover/item:bg-primary/10 border border-border/50 group-hover/item:border-primary/30 flex items-center justify-center transition-all duration-300 group-hover/item:shadow-lg overflow-hidden`}
                        style={{
                          width: `${Math.round(80 * settings.imageScale)}px`,
                          height: `${Math.round(80 * settings.imageScale)}px`,
                        }}
                      >
                        {category.image ? (
                          <img 
                            src={category.image} 
                            alt={category.name}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover/item:scale-105"
                          />
                        ) : (
                          <IconComponent className="w-6 h-6 md:w-8 md:h-8 text-foreground/70 group-hover/item:text-primary transition-colors duration-300" />
                        )}
                        
                        {/* Sale Badge */}
                        {category.isSale && (
                          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full animate-pulse">
                            %
                          </span>
                        )}
                      </div>
                      
                      {/* Category Name */}
                      <span className="text-xs md:text-sm font-medium text-foreground/80 group-hover/item:text-primary text-center transition-colors whitespace-nowrap max-w-[90px] truncate">
                        {category.name}
                      </span>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};