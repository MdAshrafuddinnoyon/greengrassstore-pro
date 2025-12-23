import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useCartStore, CartItem } from "@/stores/cartStore";
import { useWishlistStore } from "@/stores/wishlistStore";
import { useCompareStore } from "@/stores/compareStore";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Minus, Plus, ShoppingCart, Heart, Share2, Truck, Shield, RotateCcw, ChevronRight, Check, GitCompare, ImageOff } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";
import { useSiteSettings } from "@/contexts/SiteSettingsContext";
import { LocalRelatedProducts } from "@/components/products/LocalRelatedProducts";

interface LocalProduct {
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
  featured_image?: string;
  images?: string[];
  is_featured: boolean;
  is_on_sale: boolean;
  is_new: boolean;
  is_active: boolean;
  stock_quantity: number;
  sku?: string;
  tags?: string[];
  product_type: 'simple' | 'variable';
  option1_name?: string;
  option1_values?: string[];
  option2_name?: string;
  option2_values?: string[];
  option3_name?: string;
  option3_values?: string[];
}

interface ProductVariant {
  id: string;
  price: number;
  compare_at_price?: number;
  stock_quantity: number;
  is_active: boolean;
  option1_name?: string;
  option1_value?: string;
  option2_name?: string;
  option2_value?: string;
  option3_name?: string;
  option3_value?: string;
  image_url?: string;
}

interface TrustBadge {
  id: string;
  icon: string;
  title: string;
  titleAr: string;
  subtitle: string;
  subtitleAr: string;
  enabled: boolean;
}

interface ProductDetailSettings {
  showTrustBadges: boolean;
  showWhatsAppButton: boolean;
  showPaymentBanner: boolean;
  paymentBannerImage: string;
  paymentBannerLink: string;
  trustBadges: TrustBadge[];
}

const ProductDetail = () => {
  const { handle } = useParams<{ handle: string }>();
  const { language } = useLanguage();
  const isArabic = language === 'ar';
  const [product, setProduct] = useState<LocalProduct | null>(null);
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const [quantity, setQuantity] = useState(1);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [imageErrors, setImageErrors] = useState<Record<number, boolean>>({});
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const { branding } = useSiteSettings();
  const addItem = useCartStore((state) => state.addItem);
  const { addToWishlist, removeFromWishlist, isInWishlist, fetchWishlist } = useWishlistStore();
  const { addItem: addToCompare, isInCompare } = useCompareStore();
  const [pageSettings, setPageSettings] = useState<ProductDetailSettings | null>(null);

  // Fetch product detail page settings
  useEffect(() => {
    const fetchPageSettings = async () => {
      try {
        const { data } = await supabase
          .from('site_settings')
          .select('setting_value')
          .eq('setting_key', 'product_detail_settings')
          .single();

        if (data?.setting_value) {
          setPageSettings(data.setting_value as unknown as ProductDetailSettings);
        }
      } catch (error) {
        console.error('Error fetching product detail settings:', error);
      }
    };
    fetchPageSettings();
  }, []);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setIsAuthenticated(!!user);
      if (user) {
        fetchWishlist();
      }
    };
    checkAuth();
  }, [fetchWishlist]);

  useEffect(() => {
    const loadProduct = async () => {
      if (!handle) return;
      try {
        setLoading(true);
        setQuantity(1);
        setSelectedOptions({});
        setSelectedImageIndex(0);
        
        const { data: productData, error: productError } = await supabase
          .from('products')
          .select('*')
          .eq('slug', handle)
          .eq('is_active', true)
          .single();

        if (productError) throw productError;
        
        if (productData) {
          const typedProduct: LocalProduct = {
            ...productData,
            product_type: (productData.product_type || 'simple') as 'simple' | 'variable',
          };
          setProduct(typedProduct);

          const newOptions: Record<string, string> = {};
          if (typedProduct.option1_values?.length) {
            newOptions[typedProduct.option1_name || 'Option 1'] = typedProduct.option1_values[0];
          }
          if (typedProduct.option2_values?.length) {
            newOptions[typedProduct.option2_name || 'Option 2'] = typedProduct.option2_values[0];
          }
          if (typedProduct.option3_values?.length) {
            newOptions[typedProduct.option3_name || 'Option 3'] = typedProduct.option3_values[0];
          }
          setSelectedOptions(newOptions);

          if (typedProduct.product_type === 'variable') {
            const { data: variantsData } = await supabase
              .from('product_variants')
              .select('*')
              .eq('product_id', productData.id)
              .eq('is_active', true);
            setVariants(variantsData || []);
          } else {
            setVariants([]);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadProduct();
  }, [handle]);

  useEffect(() => {
    if (!product?.id) return;

    const channel = supabase
      .channel(`product-stock-${product.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'products',
          filter: `id=eq.${product.id}`
        },
        (payload) => {
          setProduct(prev => prev ? { ...prev, stock_quantity: payload.new.stock_quantity } : prev);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'product_variants',
          filter: `product_id=eq.${product.id}`
        },
        (payload) => {
          setVariants(prev => prev.map(v => 
            v.id === payload.new.id ? { ...v, stock_quantity: payload.new.stock_quantity } : v
          ));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [product?.id]);

  const selectedVariant = variants.find(v => {
    if (product?.option1_name && v.option1_value !== selectedOptions[product.option1_name]) return false;
    if (product?.option2_name && v.option2_value !== selectedOptions[product.option2_name]) return false;
    if (product?.option3_name && v.option3_value !== selectedOptions[product.option3_name]) return false;
    return true;
  });

  const currentPrice = selectedVariant?.price ?? product?.price ?? 0;
  const currentComparePrice = selectedVariant?.compare_at_price ?? product?.compare_at_price;
  const currentStock = selectedVariant?.stock_quantity ?? product?.stock_quantity ?? 0;
  const hasDiscount = currentComparePrice && currentComparePrice > currentPrice;

  const allImages = product?.images?.length 
    ? [product.featured_image, ...product.images].filter(Boolean) as string[]
    : product?.featured_image 
      ? [product.featured_image] 
      : [];

  const handleAddToCart = () => {
    if (!product) return;

    const cartItem: CartItem = {
      product: { ...product, featured_image: allImages[0] || product.featured_image },
      variantId: selectedVariant?.id || product.id,
      variantTitle: Object.values(selectedOptions).filter(Boolean).join(' / ') || 'Default',
      price: {
        amount: String(currentPrice),
        currencyCode: product.currency,
      },
      quantity,
      selectedOptions: Object.entries(selectedOptions).map(([name, value]) => ({ name, value })),
    };

    addItem(cartItem);
    toast.success(isArabic ? "تمت الإضافة إلى السلة" : "Added to cart", {
      description: `${product.name} x ${quantity}`,
      position: "top-center",
    });
  };

  const handleBuyNow = () => {
    handleAddToCart();
    window.location.href = '/checkout';
  };

  const handleShare = async () => {
    try {
      await navigator.share({
        title: product?.name,
        text: product?.description,
        url: window.location.href,
      });
    } catch {
      navigator.clipboard.writeText(window.location.href);
      toast.success(isArabic ? "تم نسخ الرابط" : "Link copied to clipboard");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
        <Footer />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center flex-col gap-4">
          <p className="text-muted-foreground text-lg">{isArabic ? 'المنتج غير موجود' : 'Product not found'}</p>
          <Link to="/shop" className="text-primary hover:underline">
            ← {isArabic ? 'العودة إلى المتجر' : 'Back to Shop'}
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1 pb-24 lg:pb-0">
        {/* Breadcrumb */}
        <div className="bg-muted/50 border-b">
          <div className="container mx-auto px-4 py-3">
            <nav className="flex items-center gap-2 text-sm">
              <Link to="/" className="text-muted-foreground hover:text-foreground">{isArabic ? 'الرئيسية' : 'Home'}</Link>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
              <Link to="/shop" className="text-muted-foreground hover:text-foreground">{isArabic ? 'المتجر' : 'Shop'}</Link>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
              <Link 
                to={`/shop?category=${product.category}`} 
                className="text-muted-foreground hover:text-foreground capitalize"
              >
                {product.category}
              </Link>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
              <span className="text-foreground font-medium truncate max-w-[200px]">
                {isArabic && product.name_ar ? product.name_ar : product.name}
              </span>
            </nav>
          </div>
        </div>

        {/* Product Section */}
        <div className="container mx-auto px-4 py-8 lg:py-12">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
            {/* Gallery */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4 }}
            >
              {/* Main Image */}
              <div className="relative aspect-square bg-muted rounded-2xl overflow-hidden mb-4">
                {allImages.length > 0 && !imageErrors[selectedImageIndex] ? (
                  <img
                    src={allImages[selectedImageIndex]}
                    alt={product.name}
                    className="w-full h-full object-cover"
                    onError={() => setImageErrors(prev => ({ ...prev, [selectedImageIndex]: true }))}
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground bg-muted/50">
                    <ImageOff className="w-16 h-16 mb-3 opacity-40" />
                    <span className="text-sm">{isArabic ? 'لا توجد صورة' : 'No image available'}</span>
                  </div>
                )}
                
                {/* SKU Badge */}
                {product.sku && (
                  <div className="absolute bottom-4 left-4 bg-black/70 text-white text-xs px-3 py-1.5 rounded-lg">
                    <div className="font-medium">{product.sku}</div>
                    {product.subcategory && <div className="text-white/70">{product.subcategory}</div>}
                    <div className="text-white/70">CTN : 20 PCS</div>
                  </div>
                )}
                
                {/* Image Counter */}
                {allImages.length > 1 && (
                  <div className="absolute bottom-4 right-4 bg-black/70 text-white text-xs px-3 py-1.5 rounded-lg">
                    {selectedImageIndex + 1} / {allImages.length}
                  </div>
                )}
              </div>

              {/* Thumbnails */}
              {allImages.length > 1 && (
                <div className="flex gap-3 overflow-x-auto pb-2">
                  {allImages.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedImageIndex(idx)}
                      className={`relative w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden border-2 transition-all ${
                        selectedImageIndex === idx
                          ? "border-primary ring-2 ring-primary/20"
                          : "border-transparent hover:border-border"
                      }`}
                    >
                      {!imageErrors[idx] ? (
                        <img
                          src={img}
                          alt={`${product.name} ${idx + 1}`}
                          className="w-full h-full object-cover"
                          onError={() => setImageErrors(prev => ({ ...prev, [idx]: true }))}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-muted/50">
                          <ImageOff className="w-6 h-6 text-muted-foreground/40" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </motion.div>

            {/* Product Info */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="space-y-5"
            >
              {/* Badges */}
              <div className="flex items-center gap-2 flex-wrap">
                <Link to={`/shop?category=${product.category.toLowerCase()}`}>
                  <Badge className="bg-[#2d5a3d] text-white hover:bg-[#234830] capitalize cursor-pointer">
                    {product.category}
                  </Badge>
                </Link>
                {product.is_new && <Badge className="bg-blue-500 text-white">New</Badge>}
                {product.is_on_sale && <Badge className="bg-orange-500 text-white">Sale</Badge>}
                {product.is_featured && <Badge className="bg-teal-500 text-white">Featured</Badge>}
              </div>

              {/* Title */}
              <h1 className="text-2xl md:text-3xl font-semibold text-foreground leading-tight">
                {isArabic && product.name_ar ? product.name_ar : product.name}
              </h1>

              {/* Price */}
              <div className="flex items-baseline gap-3">
                <span className="text-2xl md:text-3xl font-bold text-[#2d5a3d]">
                  {product.currency} {currentPrice.toFixed(2)}
                </span>
                {hasDiscount && (
                  <span className="text-lg text-muted-foreground line-through">
                    {product.currency} {currentComparePrice?.toFixed(2)}
                  </span>
                )}
              </div>

              {/* Availability */}
              <div className="flex items-center gap-2">
                {currentStock > 0 ? (
                  <>
                    <Check className="w-4 h-4 text-green-600" />
                    <span className="text-green-600 text-sm font-medium">
                      {isArabic ? 'متوفر' : 'In Stock'} ({currentStock})
                    </span>
                  </>
                ) : (
                  <span className="text-red-500 text-sm font-medium">{isArabic ? 'غير متوفر' : 'Out of Stock'}</span>
                )}
              </div>

              {/* Description */}
              {(product.description || product.description_ar) && (
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {isArabic && product.description_ar ? product.description_ar : product.description}
                </p>
              )}

              <hr className="border-border" />

              {/* Option 1 */}
              {product.option1_name && product.option1_values?.length ? (
                <div className="space-y-3">
                  <label className="text-sm font-medium text-foreground uppercase tracking-wide">
                    {product.option1_name}: <span className="text-muted-foreground">{selectedOptions[product.option1_name]}</span>
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {product.option1_values.map((value) => (
                      <button
                        key={value}
                        onClick={() => setSelectedOptions({ ...selectedOptions, [product.option1_name!]: value })}
                        className={`px-4 py-2 text-sm font-medium border rounded-lg transition-all ${
                          selectedOptions[product.option1_name!] === value
                            ? "border-[#2d5a3d] bg-[#2d5a3d] text-white"
                            : "border-border text-foreground hover:border-[#2d5a3d]"
                        }`}
                      >
                        {value}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}

              {/* Option 2 */}
              {product.option2_name && product.option2_values?.length ? (
                <div className="space-y-3">
                  <label className="text-sm font-medium text-foreground uppercase tracking-wide">
                    {product.option2_name}: <span className="text-muted-foreground">{selectedOptions[product.option2_name]}</span>
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {product.option2_values.map((value) => (
                      <button
                        key={value}
                        onClick={() => setSelectedOptions({ ...selectedOptions, [product.option2_name!]: value })}
                        className={`px-4 py-2 text-sm font-medium border rounded-lg transition-all ${
                          selectedOptions[product.option2_name!] === value
                            ? "border-[#2d5a3d] bg-[#2d5a3d] text-white"
                            : "border-border text-foreground hover:border-[#2d5a3d]"
                        }`}
                      >
                        {value}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}

              {/* Option 3 */}
              {product.option3_name && product.option3_values?.length ? (
                <div className="space-y-3">
                  <label className="text-sm font-medium text-foreground uppercase tracking-wide">
                    {product.option3_name}: <span className="text-muted-foreground">{selectedOptions[product.option3_name]}</span>
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {product.option3_values.map((value) => (
                      <button
                        key={value}
                        onClick={() => setSelectedOptions({ ...selectedOptions, [product.option3_name!]: value })}
                        className={`px-4 py-2 text-sm font-medium border rounded-lg transition-all ${
                          selectedOptions[product.option3_name!] === value
                            ? "border-[#2d5a3d] bg-[#2d5a3d] text-white"
                            : "border-border text-foreground hover:border-[#2d5a3d]"
                        }`}
                      >
                        {value}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}

              {/* Quantity & Actions Row */}
              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-foreground uppercase tracking-wide">
                    {isArabic ? 'الكمية' : 'Quantity'}
                  </span>
                  <div className="flex items-center border border-border rounded-lg">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="rounded-l-lg rounded-r-none h-10 w-10"
                    >
                      <Minus className="w-4 h-4" />
                    </Button>
                    <span className="w-10 text-center font-medium">{quantity}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setQuantity(Math.min(currentStock, quantity + 1))}
                      className="rounded-r-lg rounded-l-none h-10 w-10"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                
                {/* Wishlist & Compare */}
                <div className="flex gap-2 ml-auto">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={async () => {
                      if (!isAuthenticated) {
                        toast.error(isArabic ? 'يرجى تسجيل الدخول لإضافة إلى المفضلة' : 'Please login to add to wishlist');
                        return;
                      }
                      if (!product) return;
                      
                      if (isInWishlist(product.id)) {
                        const success = await removeFromWishlist(product.id);
                        if (success) toast.success(isArabic ? 'تمت الإزالة من المفضلة' : 'Removed from wishlist');
                      } else {
                        const success = await addToWishlist({
                          id: product.id,
                          title: product.name,
                          image: product.featured_image,
                          price: `${product.currency} ${currentPrice.toFixed(2)}`,
                        });
                        if (success) toast.success(isArabic ? 'تمت الإضافة إلى المفضلة' : 'Added to wishlist');
                      }
                    }}
                    className={`h-10 w-10 rounded-lg ${
                      isInWishlist(product.id) ? "bg-red-50 border-red-200 text-red-500" : ""
                    }`}
                  >
                    <Heart className={`w-4 h-4 ${isInWishlist(product.id) ? "fill-current" : ""}`} />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => {
                      addToCompare({
                        id: product.id,
                        name: product.name,
                        price: currentPrice,
                        currency: product.currency,
                        featured_image: product.featured_image || '',
                        category: product.category,
                        slug: product.slug,
                      });
                      toast.success(isArabic ? 'تمت الإضافة للمقارنة' : 'Added to compare');
                    }}
                    className={`h-10 w-10 rounded-lg ${
                      isInCompare(product.id) ? "bg-blue-50 border-blue-200 text-blue-500" : ""
                    }`}
                  >
                    <GitCompare className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleShare}
                    className="h-10 w-10 rounded-lg"
                  >
                    <Share2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3">
                <Button
                  onClick={handleAddToCart}
                  disabled={currentStock === 0}
                  variant="outline"
                  size="lg"
                  className="h-12 text-sm font-semibold rounded-lg border-2 border-[#2d5a3d] text-[#2d5a3d] hover:bg-[#2d5a3d] hover:text-white"
                >
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  {isArabic ? 'أضف إلى السلة' : 'Add to Cart'}
                </Button>
                <Button
                  onClick={handleBuyNow}
                  disabled={currentStock === 0}
                  size="lg"
                  className="h-12 text-sm font-semibold rounded-lg bg-[#2d5a3d] hover:bg-[#234830] text-white"
                >
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  {isArabic ? 'اشتري الآن' : 'Buy Now'}
                </Button>
              </div>

              {/* WhatsApp Button */}
              <button
                onClick={() => {
                  const message = `Hi! I want to order:\n\n🛒 Product: ${product.name}\n${Object.values(selectedOptions).filter(Boolean).length ? `📦 Options: ${Object.values(selectedOptions).join(' / ')}\n` : ''}💰 Price: ${product.currency} ${currentPrice.toFixed(2)}\n📊 Quantity: ${quantity}\n\nPlease confirm availability.`;
                  const whatsappUrl = `https://wa.me/+971547751901?text=${encodeURIComponent(message)}`;
                  window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
                }}
                className="w-full h-12 flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#20BD5A] text-white font-semibold rounded-lg transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                </svg>
                {isArabic ? 'اطلب عبر واتساب' : 'Order via WhatsApp'}
              </button>

              {/* Trust Badges Section */}
              {pageSettings?.showTrustBadges !== false && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-4 border-t border-b border-border">
                  {pageSettings?.trustBadges?.filter(b => b.enabled).map((badge) => {
                    const iconMap: Record<string, React.ReactNode> = {
                      'truck': <Truck className="w-5 h-5" />,
                      'shield': <Shield className="w-5 h-5" />,
                      'rotate': <RotateCcw className="w-5 h-5" />,
                      'check': <Check className="w-5 h-5" />,
                    };
                    return (
                      <div key={badge.id} className="flex flex-col items-center text-center p-2">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-1.5">
                          {iconMap[badge.icon] || <Check className="w-5 h-5" />}
                        </div>
                        <span className="text-xs font-medium text-foreground">
                          {isArabic ? badge.titleAr : badge.title}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {isArabic ? badge.subtitleAr : badge.subtitle}
                        </span>
                      </div>
                    );
                  }) || (
                    // Default badges if no custom badges set
                    <>
                      <div className="flex flex-col items-center text-center p-2">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-1.5">
                          <Truck className="w-5 h-5" />
                        </div>
                        <span className="text-xs font-medium text-foreground">
                          {isArabic ? 'توصيل مجاني' : 'Free Delivery'}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {isArabic ? 'للطلبات فوق 200 درهم' : 'On orders over AED 200'}
                        </span>
                      </div>
                      <div className="flex flex-col items-center text-center p-2">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-1.5">
                          <Shield className="w-5 h-5" />
                        </div>
                        <span className="text-xs font-medium text-foreground">
                          {isArabic ? 'دفع آمن' : 'Secure Payment'}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {isArabic ? '100% مضمون' : '100% Protected'}
                        </span>
                      </div>
                      <div className="flex flex-col items-center text-center p-2">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-1.5">
                          <RotateCcw className="w-5 h-5" />
                        </div>
                        <span className="text-xs font-medium text-foreground">
                          {isArabic ? 'إرجاع سهل' : 'Easy Returns'}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {isArabic ? 'خلال 7 أيام' : 'Within 7 Days'}
                        </span>
                      </div>
                      <div className="flex flex-col items-center text-center p-2">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-1.5">
                          <Check className="w-5 h-5" />
                        </div>
                        <span className="text-xs font-medium text-foreground">
                          {isArabic ? 'جودة عالية' : 'Top Quality'}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {isArabic ? 'منتجات أصلية' : 'Original Products'}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Payment Banner (Dynamic) */}
              {pageSettings?.showPaymentBanner && pageSettings?.paymentBannerImage && (
                <div className="pt-2">
                  {pageSettings.paymentBannerLink ? (
                    <a href={pageSettings.paymentBannerLink} target="_blank" rel="noopener noreferrer">
                      <img src={pageSettings.paymentBannerImage} alt="Payment Methods" className="w-full rounded-lg" />
                    </a>
                  ) : (
                    <img src={pageSettings.paymentBannerImage} alt="Payment Methods" className="w-full rounded-lg" />
                  )}
                </div>
              )}
            </motion.div>
          </div>
        </div>

        {/* Related Products */}
        <LocalRelatedProducts 
          currentProductId={product.id} 
          category={product.category} 
        />
      </main>

      <Footer />
    </div>
  );
};

export default ProductDetail;
