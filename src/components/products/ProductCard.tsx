import { useState } from "react";
import { Heart, ShoppingBag, Eye } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";

export interface Product {
  id: string;
  name: string;
  nameAr?: string;
  price: number;
  originalPrice?: number;
  image: string;
  hoverImage?: string;
  category: string;
  badge?: "sale" | "new" | "soldOut";
}

interface ProductCardProps {
  product: Product;
}

export const ProductCard = ({ product }: ProductCardProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const { language } = useLanguage();

  const discount = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  const displayName = language === "ar" && product.nameAr ? product.nameAr : product.name;

  return (
    <div
      className="group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Image Container */}
      <div className="relative aspect-square overflow-hidden bg-[#f5f5f5] mb-3">
        <img
          src={product.image}
          alt={displayName}
          className={cn(
            "w-full h-full object-cover transition-all duration-500",
            isHovered && product.hoverImage ? "opacity-0" : "opacity-100"
          )}
        />
        {product.hoverImage && (
          <img
            src={product.hoverImage}
            alt={displayName}
            className={cn(
              "absolute inset-0 w-full h-full object-cover transition-all duration-500",
              isHovered ? "opacity-100" : "opacity-0"
            )}
          />
        )}

        {/* Badge */}
        {product.badge && (
          <span
            className={cn(
              "absolute top-2 left-2 px-2 py-0.5 text-[10px] uppercase tracking-wider font-medium",
              product.badge === "sale" && "bg-red-500 text-white",
              product.badge === "new" && "bg-gray-900 text-white",
              product.badge === "soldOut" && "bg-gray-400 text-white"
            )}
          >
            {product.badge === "sale" && `-${discount}%`}
            {product.badge === "new" && "NEW"}
            {product.badge === "soldOut" && "SOLD OUT"}
          </span>
        )}

        {/* Wishlist */}
        <button
          onClick={(e) => {
            e.preventDefault();
            setIsWishlisted(!isWishlisted);
          }}
          className={cn(
            "absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300",
            isWishlisted
              ? "bg-red-500 text-white"
              : "bg-white/90 hover:bg-white opacity-0 group-hover:opacity-100"
          )}
        >
          <Heart className={cn("w-4 h-4", isWishlisted && "fill-current")} />
        </button>

        {/* Quick Actions */}
        <div
          className={cn(
            "absolute bottom-0 left-0 right-0 p-2 flex gap-2 transition-all duration-300",
            isHovered ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          )}
        >
          <button
            className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-gray-900 text-white text-[10px] uppercase tracking-wider font-medium hover:bg-gray-800 transition-colors"
            disabled={product.badge === "soldOut"}
          >
            <ShoppingBag className="w-3 h-3" />
            Add to Cart
          </button>
          <button className="w-8 h-8 flex items-center justify-center bg-white hover:bg-gray-100 transition-colors">
            <Eye className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Product Info */}
      <div>
        <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">
          {product.category}
        </p>
        <h3 className="text-sm font-normal text-gray-900 mb-1 line-clamp-2 group-hover:text-green-700 transition-colors">
          {displayName}
        </h3>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-900">
            AED {product.price}
          </span>
          {product.originalPrice && (
            <span className="text-xs text-gray-400 line-through">
              AED {product.originalPrice}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
