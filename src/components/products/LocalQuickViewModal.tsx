import { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useCartStore } from "@/stores/cartStore";
import { useWishlistStore } from "@/stores/wishlistStore";
import { useCompareStore } from "@/stores/compareStore";
import { LocalProduct } from "./LocalProductCard";
import { ShoppingCart, Heart, GitCompare, Plus, Minus, Tag, Sparkles, Percent, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProductVariant {
  id: string;
  sku?: string;
  price: number;
  compare_at_price?: number;
  stock_quantity: number;
  option1_name?: string;
  option1_value?: string;
  option2_name?: string;
  option2_value?: string;
  option3_name?: string;
  option3_value?: string;
  image_url?: string;
}

interface LocalQuickViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: LocalProduct | null;
}

export const LocalQuickViewModal = ({ isOpen, onClose, product }: LocalQuickViewModalProps) => {
  const [quantity, setQuantity] = useState(1);
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  const addItem = useCartStore(state => state.addItem);
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlistStore();
  const { addItem: addToCompare, removeItem: removeFromCompare, isInCompare } = useCompareStore();

  const isWishlisted = product ? isInWishlist(product.id) : false;
  const isCompared = product ? isInCompare(product.id) : false;

  useEffect(() => {
    if (product && isOpen) {
      setQuantity(1);
      setCurrentImageIndex(0);
      fetchVariants();
    }
  }, [product, isOpen]);

  const fetchVariants = async () => {
    if (!product) return;
    
    const { data } = await supabase
      .from('product_variants')
      .select('*')
      .eq('product_id', product.id)
      .eq('is_active', true);
    
    setVariants(data || []);
    if (data && data.length > 0) {
      setSelectedVariant(data[0]);
    }
  };

  if (!product) return null;

  const images = [product.featured_image, ...(product.images || [])].filter(Boolean) as string[];
  const displayImage = images[currentImageIndex] || '/placeholder.svg';
  
  const currentPrice = selectedVariant?.price || product.price;
  const comparePrice = selectedVariant?.compare_at_price || product.compare_at_price;
  const discountPercentage = comparePrice 
    ? Math.round((1 - currentPrice / comparePrice) * 100)
    : 0;

  // Get unique option values
  const getUniqueOptions = (optionKey: 'option1' | 'option2' | 'option3') => {
    const nameKey = `${optionKey}_name` as keyof ProductVariant;
    const valueKey = `${optionKey}_value` as keyof ProductVariant;
    
    const optionName = variants[0]?.[nameKey] as string | undefined;
    if (!optionName) return null;
    
    const values = [...new Set(variants.map(v => v[valueKey] as string).filter(Boolean))];
    return { name: optionName, values };
  };

  const option1 = getUniqueOptions('option1');
  const option2 = getUniqueOptions('option2');
  const option3 = getUniqueOptions('option3');

  const handleOptionChange = (optionName: string, value: string) => {
    const newOptions = { ...selectedOptions, [optionName]: value };
    setSelectedOptions(newOptions);
    
    // Find matching variant
    const matchingVariant = variants.find(v => {
      const matches1 = !option1 || v.option1_value === newOptions[option1.name];
      const matches2 = !option2 || v.option2_value === newOptions[option2.name];
      const matches3 = !option3 || v.option3_value === newOptions[option3.name];
      return matches1 && matches2 && matches3;
    });
    
    if (matchingVariant) {
      setSelectedVariant(matchingVariant);
      if (matchingVariant.image_url) {
        const imgIndex = images.findIndex(img => img === matchingVariant.image_url);
        if (imgIndex >= 0) setCurrentImageIndex(imgIndex);
      }
    }
  };

  const handleAddToCart = () => {
    addItem({
      product: { ...product, featured_image: displayImage },
      variantId: selectedVariant?.id || product.id,
      variantTitle: selectedVariant 
        ? [selectedVariant.option1_value, selectedVariant.option2_value, selectedVariant.option3_value].filter(Boolean).join(' / ')
        : 'Default',
      price: { amount: currentPrice.toString(), currencyCode: product.currency },
      quantity,
      selectedOptions: Object.entries(selectedOptions).map(([name, value]) => ({ name, value }))
    });
    
    toast.success('Added to cart');
    onClose();
  };

  const handleToggleWishlist = () => {
    if (isWishlisted) {
      removeFromWishlist(product.id);
      toast.success('Removed from wishlist');
    } else {
      addToWishlist({
        id: product.id,
        title: product.name,
        price: `${product.currency} ${currentPrice}`,
        image: displayImage
      });
      toast.success('Added to wishlist');
    }
  };

  const handleToggleCompare = () => {
    if (isCompared) {
      removeFromCompare(product.id);
      toast.success('Removed from compare');
    } else {
      const added = addToCompare({ ...product, featured_image: displayImage });
      if (added) {
        toast.success('Added to compare');
      } else {
        toast.error('Compare list is full (max 4)');
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0">
        <button 
          onClick={onClose}
          className="absolute right-4 top-4 z-10 p-1 rounded-full bg-background/80 hover:bg-background transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
        
        <div className="grid md:grid-cols-2 gap-0">
          {/* Images */}
          <div className="relative bg-muted/30">
            <div className="aspect-square overflow-hidden">
              <img
                src={displayImage}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </div>
            
            {/* Badges */}
            <div className="absolute top-4 left-4 flex flex-col gap-2">
              {product.is_on_sale && discountPercentage > 0 && (
                <Badge className="bg-red-500 text-white">
                  <Percent className="w-3 h-3 mr-1" />
                  {discountPercentage}% OFF
                </Badge>
              )}
              {product.is_new && (
                <Badge className="bg-emerald-500 text-white">
                  <Sparkles className="w-3 h-3 mr-1" />
                  NEW
                </Badge>
              )}
              {product.is_featured && (
                <Badge className="bg-amber-500 text-white">
                  <Tag className="w-3 h-3 mr-1" />
                  FEATURED
                </Badge>
              )}
            </div>

            {/* Thumbnails */}
            {images.length > 1 && (
              <div className="flex gap-2 p-4 overflow-x-auto">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentImageIndex(idx)}
                    className={cn(
                      "w-16 h-16 rounded-lg overflow-hidden border-2 flex-shrink-0 transition-colors",
                      currentImageIndex === idx ? "border-primary" : "border-transparent"
                    )}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details */}
          <div className="p-6 space-y-5">
            <div>
              <p className="text-sm text-muted-foreground uppercase tracking-wide mb-1">
                {product.category} {product.subcategory && `/ ${product.subcategory}`}
              </p>
              <h2 className="text-2xl font-bold">{product.name}</h2>
            </div>

            {/* Price */}
            <div className="flex items-center gap-3">
              <span className="text-3xl font-bold text-primary">
                {product.currency} {currentPrice.toFixed(2)}
              </span>
              {comparePrice && comparePrice > currentPrice && (
                <span className="text-lg text-muted-foreground line-through">
                  {product.currency} {comparePrice.toFixed(2)}
                </span>
              )}
            </div>

            {product.description && (
              <p className="text-muted-foreground">{product.description}</p>
            )}

            {/* Variant Options */}
            {variants.length > 0 && (
              <div className="space-y-4">
                {option1 && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">{option1.name}</label>
                    <Select 
                      value={selectedOptions[option1.name] || option1.values[0]}
                      onValueChange={(v) => handleOptionChange(option1.name, v)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {option1.values.map(v => (
                          <SelectItem key={v} value={v}>{v}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                
                {option2 && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">{option2.name}</label>
                    <Select 
                      value={selectedOptions[option2.name] || option2.values[0]}
                      onValueChange={(v) => handleOptionChange(option2.name, v)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {option2.values.map(v => (
                          <SelectItem key={v} value={v}>{v}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                
                {option3 && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">{option3.name}</label>
                    <Select 
                      value={selectedOptions[option3.name] || option3.values[0]}
                      onValueChange={(v) => handleOptionChange(option3.name, v)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {option3.values.map(v => (
                          <SelectItem key={v} value={v}>{v}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            )}

            {/* Quantity */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Quantity</label>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                >
                  <Minus className="w-4 h-4" />
                </Button>
                <span className="w-12 text-center font-medium">{quantity}</span>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setQuantity(quantity + 1)}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-3 pt-4">
              <Button onClick={handleAddToCart} size="lg" className="w-full">
                <ShoppingCart className="w-5 h-5 mr-2" />
                Add to Cart
              </Button>
              
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={handleToggleWishlist}
                >
                  <Heart className={cn("w-4 h-4 mr-2", isWishlisted && "fill-red-500 text-red-500")} />
                  {isWishlisted ? 'Remove' : 'Wishlist'}
                </Button>
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={handleToggleCompare}
                >
                  <GitCompare className={cn("w-4 h-4 mr-2", isCompared && "text-primary")} />
                  {isCompared ? 'Remove' : 'Compare'}
                </Button>
              </div>
            </div>

            {/* Stock Status */}
            {selectedVariant && selectedVariant.stock_quantity <= 5 && selectedVariant.stock_quantity > 0 && (
              <p className="text-sm text-amber-600 font-medium">
                Only {selectedVariant.stock_quantity} left in stock!
              </p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
