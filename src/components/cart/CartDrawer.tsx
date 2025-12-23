import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ShoppingCart, Minus, Plus, Trash2, Truck, ShoppingBag } from "lucide-react";
import { useCartStore, getProductInfo } from "@/stores/cartStore";
import { useSiteSettings } from "@/contexts/SiteSettingsContext";

const WHATSAPP_NUMBER = "971547751901";

export const CartDrawer = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { shippingSettings } = useSiteSettings();
  const { 
    items, 
    updateQuantity, 
    removeItem
  } = useCartStore();
  
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = items.reduce((sum, item) => sum + (parseFloat(item.price.amount) * item.quantity), 0);

  // Dynamic shipping calculation based on settings
  const freeShippingThreshold = shippingSettings?.freeShippingThreshold || 200;
  const freeShippingMinItems = shippingSettings?.freeShippingMinItems || 0;
  const freeShippingEnabled = shippingSettings?.freeShippingEnabled ?? true;
  const showProgressBar = shippingSettings?.showProgressBar ?? true;
  
  // When freeShippingEnabled is false, ALL shipping is free
  // When enabled, check threshold and min items rules
  const qualifiesForFreeShipping = !freeShippingEnabled || (
    (freeShippingThreshold <= 0 || totalPrice >= freeShippingThreshold) &&
    (freeShippingMinItems <= 0 || totalItems >= freeShippingMinItems)
  );
  
  const amountForFreeShipping = Math.max(0, freeShippingThreshold - totalPrice);
  const progressPercent = freeShippingThreshold > 0 
    ? Math.min(100, (totalPrice / freeShippingThreshold) * 100)
    : 100;

  const handleWhatsAppCheckout = () => {
    const itemsList = items.map(item => {
      const productInfo = getProductInfo(item.product);
      return `• ${productInfo.name} (${item.selectedOptions.map(o => o.value).join(', ')}) x${item.quantity} - ${item.price.currencyCode} ${parseFloat(item.price.amount).toFixed(2)}`;
    }).join('\n');
    
    const message = `Hi! I want to place an order:\n\n${itemsList}\n\n💰 Total: ${items[0]?.price.currencyCode || 'AED'} ${totalPrice.toFixed(2)}\n\nPlease confirm and process my order.`;
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');
    setIsOpen(false);
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <ShoppingCart className="h-5 w-5" />
          {totalItems > 0 && (
            <Badge className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs bg-accent text-accent-foreground">
              {totalItems}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      
      <SheetContent className="w-full sm:max-w-lg flex flex-col h-full">
        <SheetHeader className="flex-shrink-0">
          <SheetTitle>Shopping Cart</SheetTitle>
          <SheetDescription>
            {totalItems === 0 ? "Your cart is empty" : `${totalItems} item${totalItems !== 1 ? 's' : ''} in your cart`}
          </SheetDescription>
        </SheetHeader>
        
        <div className="flex flex-col flex-1 pt-6 min-h-0">
          {items.length === 0 ? (
            <div className="flex-1 flex items-center justify-center px-4">
              <div className="text-center max-w-xs mx-auto">
                <div className="relative mx-auto mb-6 w-20 h-20 sm:w-24 sm:h-24">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-primary/5 rounded-full animate-pulse" />
                  <div className="absolute inset-2 bg-gradient-to-br from-muted to-muted/50 rounded-full flex items-center justify-center shadow-inner">
                    <ShoppingCart className="h-8 w-8 sm:h-10 sm:w-10 text-muted-foreground/70" />
                  </div>
                </div>
                
                <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-2">
                  Your Cart is Empty
                </h3>
                
                <p className="text-sm sm:text-base text-muted-foreground mb-6 leading-relaxed">
                  You haven't added any products to your cart yet
                </p>
                
                <Link to="/shop" onClick={() => setIsOpen(false)}>
                  <Button 
                    className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 sm:px-8 py-2.5 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5"
                  >
                    <ShoppingBag className="w-4 h-4 mr-2" />
                    Shop Now
                  </Button>
                </Link>
                
                {showProgressBar && (
                  <div className="mt-8 flex items-center justify-center gap-2 text-xs text-muted-foreground/60">
                    <span className="w-8 h-px bg-border" />
                    <span>
                      {freeShippingEnabled 
                        ? `Free shipping on orders over AED ${freeShippingThreshold}`
                        : "Free shipping on all orders!"
                      }
                    </span>
                    <span className="w-8 h-px bg-border" />
                  </div>
                )}
              </div>
            </div>
          ) : (
            <>
              {/* Free Shipping Progress Bar - Only show when shipping rules are enabled */}
              {freeShippingEnabled && showProgressBar && (
                <div className="mb-4 p-3 bg-muted/30 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Truck className="w-4 h-4 text-primary" />
                    {qualifiesForFreeShipping ? (
                      <span className="text-sm font-medium text-primary">
                        🎉 You qualify for FREE shipping!
                      </span>
                    ) : (
                      <span className="text-sm text-muted-foreground">
                        {freeShippingThreshold > 0 && amountForFreeShipping > 0 && (
                          <>Add <span className="font-semibold text-foreground">AED {amountForFreeShipping.toFixed(2)}</span> more for free shipping</>
                        )}
                        {freeShippingMinItems > 0 && totalItems < freeShippingMinItems && (
                          <> (need {freeShippingMinItems - totalItems} more item{freeShippingMinItems - totalItems !== 1 ? 's' : ''})</>
                        )}
                      </span>
                    )}
                  </div>
                  <Progress value={progressPercent} className="h-2" />
                </div>
              )}
              
              {/* All shipping free message when disabled */}
              {!freeShippingEnabled && showProgressBar && (
                <div className="mb-4 p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Truck className="w-4 h-4 text-emerald-600" />
                    <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                      ✅ FREE shipping on all orders!
                    </span>
                  </div>
                </div>
              )}

              <div className="flex-1 overflow-y-auto pr-2 min-h-0">
                <div className="space-y-4">
                  {items.map((item) => {
                    const productInfo = getProductInfo(item.product);
                    return (
                      <div key={item.variantId} className="flex gap-4 p-2 border-b">
                        <div className="w-16 h-16 bg-secondary/20 rounded-md overflow-hidden flex-shrink-0">
                          {productInfo.featured_image && (
                            <img
                              src={productInfo.featured_image}
                              alt={productInfo.name}
                              className="w-full h-full object-cover"
                            />
                          )}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium truncate">{productInfo.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {item.selectedOptions.map(option => option.value).join(' • ')}
                          </p>
                          <p className="font-semibold">
                            {item.price.currencyCode} {parseFloat(item.price.amount).toFixed(2)}
                          </p>
                        </div>
                      
                      <div className="flex flex-col items-end gap-2 flex-shrink-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => removeItem(item.variantId)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                        
                        <div className="flex items-center gap-1">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => updateQuantity(item.variantId, item.quantity - 1)}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-8 text-center text-sm">{item.quantity}</span>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => updateQuantity(item.variantId, item.quantity + 1)}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                    );
                  })}
                </div>
              </div>
              
              <div className="flex-shrink-0 space-y-3 pt-4 border-t bg-background">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold">Total</span>
                  <span className="text-xl font-bold">
                    {items[0]?.price.currencyCode || 'AED'} {totalPrice.toFixed(2)}
                  </span>
                </div>
                
                <Link to="/checkout" onClick={() => setIsOpen(false)} className="block">
                  <Button 
                    className="w-full bg-[#2d5a3d] hover:bg-[#234830]" 
                    size="lg"
                  >
                    <ShoppingBag className="w-4 h-4 mr-2" />
                    Proceed to Checkout
                  </Button>
                </Link>
                
                <Button 
                  onClick={handleWhatsAppCheckout}
                  className="w-full bg-[#25D366] hover:bg-[#20BD5A] text-white" 
                  size="lg"
                  disabled={items.length === 0}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="w-4 h-4 mr-2"
                  >
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                  </svg>
                  Order via WhatsApp
                </Button>
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};
