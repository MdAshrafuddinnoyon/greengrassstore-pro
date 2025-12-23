import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ShoppingCart, Heart, Eye, Tag, Sparkles, Percent, GitCompare, ImageOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCartStore } from "@/stores/cartStore";
import { useWishlistStore } from "@/stores/wishlistStore";
import { useCompareStore } from "@/stores/compareStore";
import { toast } from "sonner";
import { LocalQuickViewModal } from "./LocalQuickViewModal";

export interface LocalProduct {
  id: string;
  name: string;
  name_ar?: string;
  slug: string;
  description?: string;
  description_ar?: string;
  price: number;
  compare_at_price?: number;
  currency: string;
  category: string;
  subcategory?: string;
  images?: string[];
  featured_image?: string;
  is_featured?: boolean;
  is_on_sale?: boolean;
  is_new?: boolean;
  is_active?: boolean;
  stock_quantity?: number;
}

interface LocalProductCardProps {
  product: LocalProduct;
  isArabic?: boolean;
}

export const LocalProductCard = ({ product, isArabic = false }: LocalProductCardProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const [showQuickView, setShowQuickView] = useState(false);
  const [imageError, setImageError] = useState(false);
  const addItem = useCartStore(state => state.addItem);
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlistStore();
  const { addItem: addToCompare, removeItem: removeFromCompare, isInCompare } = useCompareStore();
  
  const isWishlisted = isInWishlist(product.id);
  const isCompared = isInCompare(product.id);
  const discountPercentage = product.compare_at_price 
    ? Math.round((1 - product.price / product.compare_at_price) * 100)
    : 0;

  const displayName = isArabic && product.name_ar ? product.name_ar : product.name;
  const displayImage = product.featured_image || product.images?.[0] || '';

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    addItem({
      product: { ...product, featured_image: displayImage },
      variantId: product.id,
      variantTitle: 'Default',
      price: {
        amount: product.price.toString(),
        currencyCode: product.currency
      },
      quantity: 1,
      selectedOptions: []
    });
    toast.success(isArabic ? 'تمت الإضافة إلى السلة' : 'Added to cart');
  };

  const handleToggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isWishlisted) {
      removeFromWishlist(product.id);
      toast.success(isArabic ? 'تمت الإزالة من المفضلة' : 'Removed from wishlist');
    } else {
      addToWishlist({
        id: product.id,
        title: product.name,
        price: `${product.currency} ${product.price}`,
        image: displayImage
      });
      toast.success(isArabic ? 'تمت الإضافة إلى المفضلة' : 'Added to wishlist');
    }
  };

  const handleQuickView = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowQuickView(true);
  };

  const handleToggleCompare = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isCompared) {
      removeFromCompare(product.id);
      toast.success(isArabic ? 'تمت الإزالة من المقارنة' : 'Removed from compare');
    } else {
      const added = addToCompare({ ...product, featured_image: displayImage });
      if (added) {
        toast.success(isArabic ? 'تمت الإضافة للمقارنة' : 'Added to compare');
      } else {
        toast.error(isArabic ? 'قائمة المقارنة ممتلئة (4 كحد أقصى)' : 'Compare list is full (max 4)');
      }
    }
  };

  return (
    <>
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="group relative bg-background rounded-xl overflow-hidden border border-border/50 hover:border-primary/30 hover:shadow-xl transition-all duration-300"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Link to={`/product/${product.slug}`}>
        {/* Image Container - Fixed height */}
        <div className="relative aspect-[4/5] overflow-hidden bg-muted/50">
          {!imageError && displayImage ? (
            <img
              src={displayImage}
              alt={displayName}
              className={cn(
                "w-full h-full object-cover transition-transform duration-500",
                isHovered && "scale-110"
              )}
              loading="lazy"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-muted/30">
              <ImageOff className="w-12 h-12 text-muted-foreground/40 mb-2" />
              <span className="text-xs text-muted-foreground/60">No Image</span>
            </div>
          )}
          
          {/* Badges */}
          <div className="absolute top-2 sm:top-3 left-2 sm:left-3 flex flex-col gap-1.5 sm:gap-2 z-10">
            {product.is_on_sale && discountPercentage > 0 && (
              <span className="flex items-center gap-0.5 sm:gap-1 px-1.5 sm:px-2.5 py-0.5 sm:py-1 bg-red-500 text-white text-[10px] sm:text-xs font-bold rounded-full shadow-lg">
                <Percent className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                {discountPercentage}% OFF
              </span>
            )}
            {product.is_new && (
              <span className="flex items-center gap-0.5 sm:gap-1 px-1.5 sm:px-2.5 py-0.5 sm:py-1 bg-emerald-500 text-white text-[10px] sm:text-xs font-bold rounded-full shadow-lg">
                <Sparkles className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                {isArabic ? 'جديد' : 'NEW'}
              </span>
            )}
            {product.is_featured && !product.is_new && !product.is_on_sale && (
              <span className="flex items-center gap-0.5 sm:gap-1 px-1.5 sm:px-2.5 py-0.5 sm:py-1 bg-amber-500 text-white text-[10px] sm:text-xs font-bold rounded-full shadow-lg">
                <Tag className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                {isArabic ? 'مميز' : 'FEATURED'}
              </span>
            )}
          </div>

          {/* Quick Actions - Always visible on mobile, hover on desktop */}
          <div className="absolute top-2 sm:top-3 right-2 sm:right-3 flex flex-col gap-1.5 sm:gap-2 z-10">
            {/* Wishlist - Always visible */}
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={handleToggleWishlist}
              className={cn(
                "p-2 sm:p-2.5 rounded-full shadow-md transition-colors",
                isWishlisted 
                  ? "bg-red-500 text-white" 
                  : "bg-white/90 backdrop-blur-sm hover:bg-red-500 hover:text-white text-gray-600"
              )}
              aria-label="Add to wishlist"
            >
              <Heart className={cn("w-4 h-4 sm:w-5 sm:h-5", isWishlisted && "fill-current")} />
            </motion.button>

            {/* Quick View - Always visible */}
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={handleQuickView}
              className="p-2 sm:p-2.5 bg-white/90 backdrop-blur-sm rounded-full shadow-md hover:bg-primary hover:text-white transition-colors text-gray-600"
              aria-label="Quick view"
            >
              <Eye className="w-4 h-4 sm:w-5 sm:h-5" />
            </motion.button>
          </div>

          {/* Add to Cart - Bottom overlay on hover (desktop) or always visible (mobile) */}
          <div className={cn(
            "absolute bottom-0 left-0 right-0 p-2 sm:p-3 bg-gradient-to-t from-black/60 to-transparent transition-opacity duration-300",
            "opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
          )}>
            <div className="flex gap-2">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={handleAddToCart}
                className="flex-1 flex items-center justify-center gap-1.5 sm:gap-2 py-2 sm:py-2.5 bg-white text-foreground rounded-lg sm:rounded-xl text-xs sm:text-sm font-medium hover:bg-primary hover:text-white transition-colors"
              >
                <ShoppingCart className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span>{isArabic ? 'أضف للسلة' : 'Add to Cart'}</span>
              </motion.button>
              
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={handleToggleCompare}
                className={cn(
                  "p-2 sm:p-2.5 rounded-lg sm:rounded-xl transition-colors",
                  isCompared 
                    ? "bg-primary text-white" 
                    : "bg-white text-foreground hover:bg-primary hover:text-white"
                )}
                aria-label="Compare"
              >
                <GitCompare className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </motion.button>
            </div>
          </div>
        </div>

        {/* Content - Fixed height for consistent cards */}
        <div className="p-3 sm:p-4 flex flex-col h-[140px] sm:h-[160px]">
          <Link 
            to={`/shop?category=${product.category.toLowerCase()}`}
            onClick={(e) => e.stopPropagation()}
            className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wide mb-0.5 sm:mb-1 hover:text-primary transition-colors"
          >
            {product.category}
          </Link>
          <h3 className="font-medium text-foreground text-sm sm:text-base line-clamp-2 group-hover:text-primary transition-colors flex-shrink-0">
            {displayName}
          </h3>
          
          <div className="mt-auto pt-2 flex items-baseline gap-1.5 sm:gap-2 flex-wrap">
            <span className="text-sm sm:text-lg font-bold text-primary">
              {product.currency} {product.price.toFixed(2)}
            </span>
            {product.compare_at_price && product.compare_at_price > product.price && (
              <span className="text-xs sm:text-sm text-muted-foreground line-through">
                {product.currency} {product.compare_at_price.toFixed(2)}
              </span>
            )}
          </div>

          {/* Stock Status */}
          {product.stock_quantity !== undefined && product.stock_quantity <= 5 && product.stock_quantity > 0 && (
            <p className="mt-1 text-[10px] sm:text-xs text-amber-600 font-medium">
              {isArabic ? `${product.stock_quantity} فقط متبقي` : `Only ${product.stock_quantity} left`}
            </p>
          )}
        </div>
      </Link>
    </motion.div>
    
    <LocalQuickViewModal
      isOpen={showQuickView}
      onClose={() => setShowQuickView(false)}
      product={product}
    />
    </>
  );
};
