import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ShoppingBag, Minus, Plus, X } from "lucide-react";
import { useState } from "react";
import { useCartStore } from "@/stores/cartStore";
import { toast } from "sonner";
import { LocalProduct } from "./LocalProductCard";

interface QuickViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: LocalProduct | null;
}

export const QuickViewModal = ({ isOpen, onClose, product }: QuickViewModalProps) => {
  const [quantity, setQuantity] = useState(1);
  const addItem = useCartStore((state) => state.addItem);

  if (!product) return null;

  const displayImage = product.featured_image || '/placeholder.svg';
  const price = product.price;
  const currency = product.currency || 'AED';

  const handleAddToCart = () => {
    addItem({
      product,
      variantId: product.id,
      variantTitle: 'Default',
      price: {
        amount: String(price),
        currencyCode: currency,
      },
      quantity,
      selectedOptions: [],
    });

    toast.success(`Added ${quantity} item(s) to cart`, {
      description: product.name,
      position: "top-center",
    });
    onClose();
    setQuantity(1);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl p-0 overflow-hidden">
        <button 
          onClick={onClose}
          className="absolute right-4 top-4 z-10 rounded-full bg-white/90 p-2 hover:bg-white transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
        
        <div className="grid md:grid-cols-2 gap-0">
          {/* Image */}
          <div className="aspect-square bg-gray-100">
            <img
              src={displayImage}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Details */}
          <div className="p-6 flex flex-col">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-left">{product.name}</DialogTitle>
            </DialogHeader>

            <p className="text-2xl font-bold text-[#2d5a3d] mt-2">
              {currency} {price.toFixed(2)}
            </p>

            {product.description && (
              <p className="text-gray-600 text-sm mt-4 line-clamp-4">
                {product.description}
              </p>
            )}

            {/* Quantity */}
            <div className="mt-auto pt-6">
              <div className="flex items-center gap-4 mb-4">
                <span className="text-sm font-medium">Quantity:</span>
                <div className="flex items-center border rounded-md">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="p-2 hover:bg-gray-100 transition-colors"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="px-4 py-2 min-w-[3rem] text-center">{quantity}</span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="p-2 hover:bg-gray-100 transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <Button
                onClick={handleAddToCart}
                className="w-full bg-[#2d5a3d] hover:bg-[#234a31] text-white"
                size="lg"
              >
                <ShoppingBag className="w-4 h-4 mr-2" />
                Add to Cart
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
