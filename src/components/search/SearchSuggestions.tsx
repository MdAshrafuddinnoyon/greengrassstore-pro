import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface LocalProduct {
  id: string;
  name: string;
  slug: string;
  price: number;
  currency: string;
  featured_image: string | null;
}

interface SearchSuggestionsProps {
  className?: string;
  placeholder?: string;
  onClose?: () => void;
}

export const SearchSuggestions = ({ className, placeholder = "What are you looking for?", onClose }: SearchSuggestionsProps) => {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<LocalProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout>();

  // Debounced search - now searches local Supabase products
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (query.trim().length < 2) {
      setResults([]);
      setShowDropdown(false);
      return;
    }

    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const { data, error } = await supabase
          .from('products')
          .select('id, name, slug, price, currency, featured_image')
          .eq('is_active', true)
          .or(`name.ilike.%${query.trim()}%,description.ilike.%${query.trim()}%,category.ilike.%${query.trim()}%`)
          .limit(8);

        if (error) throw error;
        setResults(data || []);
        setShowDropdown(true);
      } catch (error) {
        console.error("Search error:", error);
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [query]);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/shop?q=${encodeURIComponent(query.trim())}`);
      setQuery("");
      setShowDropdown(false);
      onClose?.();
    }
  };

  const handleProductClick = (slug: string) => {
    navigate(`/product/${slug}`);
    setQuery("");
    setShowDropdown(false);
    onClose?.();
  };

  const handleViewAll = () => {
    navigate(`/shop?q=${encodeURIComponent(query.trim())}`);
    setQuery("");
    setShowDropdown(false);
    onClose?.();
  };

  return (
    <div className={cn("relative w-full", className)}>
      <form onSubmit={handleSearch} className="relative">
        <input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.trim().length >= 2 && results.length > 0 && setShowDropdown(true)}
          className="w-full pl-4 pr-10 py-2.5 bg-gray-100 border-0 rounded-md text-sm text-gray-700 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#2d5a3d]/20"
        />
        <button 
          type="submit" 
          className="absolute right-0 top-0 h-full px-3 bg-gray-200 rounded-r-md hover:bg-gray-300 transition-colors"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 text-gray-600 animate-spin" />
          ) : (
            <Search className="w-4 h-4 text-gray-600" />
          )}
        </button>
      </form>

      {/* Dropdown Results */}
      {showDropdown && (
        <div 
          ref={dropdownRef}
          className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-xl border border-gray-200 z-[100] max-h-[400px] overflow-y-auto"
        >
          {loading ? (
            <div className="p-4 text-center">
              <Loader2 className="w-5 h-5 animate-spin mx-auto text-[#2d5a3d]" />
              <p className="text-sm text-gray-500 mt-2">Searching...</p>
            </div>
          ) : results.length > 0 ? (
            <>
              <div className="p-2">
                {results.map((product) => (
                  <button
                    key={product.id}
                    onClick={() => handleProductClick(product.slug)}
                    className="w-full flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg transition-colors text-left"
                  >
                    {product.featured_image && (
                      <img
                        src={product.featured_image}
                        alt={product.name}
                        className="w-12 h-12 object-cover rounded-md"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {product.name}
                      </p>
                      <p className="text-sm text-[#2d5a3d] font-medium">
                        {product.currency} {product.price.toFixed(2)}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
              <div className="border-t border-gray-100 p-2">
                <button
                  onClick={handleViewAll}
                  className="w-full py-2 text-sm font-medium text-[#2d5a3d] hover:bg-gray-50 rounded-lg transition-colors"
                >
                  View all results for "{query}"
                </button>
              </div>
            </>
          ) : query.trim().length >= 2 ? (
            <div className="p-4 text-center">
              <p className="text-sm text-gray-500">No products found for "{query}"</p>
              <button
                onClick={handleViewAll}
                className="mt-2 text-sm text-[#2d5a3d] hover:underline"
              >
                Search in shop
              </button>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
};
