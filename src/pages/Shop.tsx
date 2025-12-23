import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { LocalProductCard, LocalProduct } from "@/components/products/LocalProductCard";
import { ProductFilters } from "@/components/products/ProductFilters";
import { supabase } from "@/integrations/supabase/client";
import { Search, SlidersHorizontal, Grid3X3, LayoutGrid, ChevronDown, X, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useLanguage } from "@/contexts/LanguageContext";

const sortOptions = [
  { value: "featured", label: "Featured" },
  { value: "price-low", label: "Price: Low to High" },
  { value: "price-high", label: "Price: High to Low" },
  { value: "name-asc", label: "Name: A to Z" },
  { value: "name-desc", label: "Name: Z to A" },
];

const ITEMS_PER_PAGE = 12;

interface Category {
  id: string;
  name: string;
  slug: string;
}

export default function Shop() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState<LocalProduct[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get("category") || "all");
  const [sortBy, setSortBy] = useState("featured");
  const [gridView, setGridView] = useState<"large" | "small">("large");
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [selectedMaterials, setSelectedMaterials] = useState<string[]>([]);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const { language } = useLanguage();
  
  // Handle focus params from mobile nav
  useEffect(() => {
    const focusParam = searchParams.get("focus");
    if (focusParam === "search") {
      // Focus on search input using ID
      setTimeout(() => {
        const searchInput = document.getElementById('shop-search-input') as HTMLInputElement;
        if (searchInput) {
          searchInput.focus();
          searchInput.click();
        }
      }, 300);
      // Remove the focus param from URL
      const newParams = new URLSearchParams(searchParams);
      newParams.delete("focus");
      setSearchParams(newParams, { replace: true });
    } else if (focusParam === "filters") {
      // Open mobile filters drawer
      setTimeout(() => {
        setMobileFiltersOpen(true);
      }, 100);
      // Remove the focus param from URL
      const newParams = new URLSearchParams(searchParams);
      newParams.delete("focus");
      setSearchParams(newParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);
  const isArabic = language === 'ar';

  // Build categories list
  const categoryOptions = useMemo(() => {
    const dynamicCategories = categories.map((c) => ({
      key: c.slug,
      label: c.name,
      isParent: true,
    }));
    return [{ key: "all", label: isArabic ? "جميع المنتجات" : "All Products" }, ...dynamicCategories];
  }, [categories, isArabic]);

  // Extract unique colors from products dynamically
  const availableColors = useMemo(() => {
    const colorSet = new Set<string>();
    products.forEach((p: any) => {
      // Check option1 for color
      if (p.option1_name?.toLowerCase().includes('color') && p.option1_values) {
        p.option1_values.forEach((c: string) => colorSet.add(c));
      }
      // Check option2 for color  
      if (p.option2_name?.toLowerCase().includes('color') && p.option2_values) {
        p.option2_values.forEach((c: string) => colorSet.add(c));
      }
      // Check tags for colors
      if (p.tags) {
        const colorKeywords = ['White', 'Black', 'Green', 'Brown', 'Terracotta', 'Blue', 'Gray', 'Beige', 'Red', 'Yellow', 'Pink', 'Orange'];
        p.tags.forEach((tag: string) => {
          if (colorKeywords.includes(tag)) {
            colorSet.add(tag);
          }
        });
      }
    });
    return Array.from(colorSet);
  }, [products]);

  // Extract unique sizes from products dynamically
  const availableSizes = useMemo(() => {
    const sizeSet = new Set<string>();
    products.forEach((p: any) => {
      if (p.option1_name?.toLowerCase().includes('size') && p.option1_values) {
        p.option1_values.forEach((s: string) => sizeSet.add(s));
      }
      if (p.option2_name?.toLowerCase().includes('size') && p.option2_values) {
        p.option2_values.forEach((s: string) => sizeSet.add(s));
      }
      if (p.option3_name?.toLowerCase().includes('size') && p.option3_values) {
        p.option3_values.forEach((s: string) => sizeSet.add(s));
      }
    });
    return Array.from(sizeSet);
  }, [products]);

  // Extract unique materials from products dynamically
  const availableMaterials = useMemo(() => {
    const materialSet = new Set<string>();
    products.forEach((p: any) => {
      if (p.option1_name?.toLowerCase().includes('material') && p.option1_values) {
        p.option1_values.forEach((m: string) => materialSet.add(m));
      }
      if (p.option2_name?.toLowerCase().includes('material') && p.option2_values) {
        p.option2_values.forEach((m: string) => materialSet.add(m));
      }
      if (p.option3_name?.toLowerCase().includes('material') && p.option3_values) {
        p.option3_values.forEach((m: string) => materialSet.add(m));
      }
    });
    return Array.from(materialSet);
  }, [products]);

  // Calculate max price
  const maxPrice = useMemo(() => {
    if (products.length === 0) return 1000;
    const prices = products.map((p) => p.price);
    return Math.ceil(Math.max(...prices, 1000) / 100) * 100;
  }, [products]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const query = searchParams.get("q") || "";
        
        // Fetch products
        let productsQuery = supabase
          .from('products')
          .select('*')
          .eq('is_active', true);
        
        if (query) {
          productsQuery = productsQuery.or(`name.ilike.%${query}%,description.ilike.%${query}%`);
        }
        
        const { data: productsData, error: productsError } = await productsQuery.order('created_at', { ascending: false });
        
        if (productsError) throw productsError;
        setProducts(productsData || []);

        // Fetch categories
        const { data: categoriesData, error: categoriesError } = await supabase
          .from('categories')
          .select('*')
          .eq('is_active', true)
          .order('display_order', { ascending: true });
        
        if (categoriesError) throw categoriesError;
        setCategories(categoriesData || []);
        
      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [searchParams]);

  // Sync selected category with URL params
  useEffect(() => {
    const categoryParam = searchParams.get("category") || "all";
    setSelectedCategory(categoryParam);
  }, [searchParams]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSearching(true);
    const params = new URLSearchParams(searchParams);
    if (searchQuery.trim()) {
      params.set("q", searchQuery.trim());
    } else {
      params.delete("q");
    }
    setSearchParams(params);
    setTimeout(() => setIsSearching(false), 500);
  };

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    const params = new URLSearchParams(searchParams);
    if (category !== "all") {
      params.set("category", category);
    } else {
      params.delete("category");
    }
    setSearchParams(params);
  };

  const handleClearAll = () => {
    setSelectedCategory("all");
    setPriceRange([0, maxPrice]);
    setSelectedTags([]);
    setSelectedColors([]);
    setSelectedSizes([]);
    setSelectedMaterials([]);
    setSelectedSizes([]);
    setSearchQuery("");
    setSearchParams(new URLSearchParams());
  };

  // Filter and sort products
  const filteredAndSortedProducts = useMemo(() => {
    let result = [...products];

    // Category filter
    if (selectedCategory && selectedCategory !== "all") {
      if (selectedCategory === "sale") {
        result = result.filter(p => p.is_on_sale);
      } else {
        result = result.filter(p => 
          p.category?.toLowerCase() === selectedCategory.toLowerCase() ||
          p.subcategory?.toLowerCase() === selectedCategory.toLowerCase()
        );
      }
    }

    // Price filter
    result = result.filter((p) => {
      return p.price >= priceRange[0] && p.price <= priceRange[1];
    });

    // Color filter
    if (selectedColors.length > 0) {
      result = result.filter((p: any) => {
        const productColors: string[] = [];
        if (p.option1_name?.toLowerCase().includes('color') && p.option1_values) {
          productColors.push(...p.option1_values);
        }
        if (p.option2_name?.toLowerCase().includes('color') && p.option2_values) {
          productColors.push(...p.option2_values);
        }
        if (p.tags) {
          productColors.push(...p.tags);
        }
        return selectedColors.some(c => productColors.includes(c));
      });
    }

    // Size filter
    if (selectedSizes.length > 0) {
      result = result.filter((p: any) => {
        const productSizes: string[] = [];
        if (p.option1_name?.toLowerCase().includes('size') && p.option1_values) {
          productSizes.push(...p.option1_values);
        }
        if (p.option2_name?.toLowerCase().includes('size') && p.option2_values) {
          productSizes.push(...p.option2_values);
        }
        if (p.option3_name?.toLowerCase().includes('size') && p.option3_values) {
          productSizes.push(...p.option3_values);
        }
        return selectedSizes.some(s => productSizes.includes(s));
      });
    }

    // Material filter
    if (selectedMaterials.length > 0) {
      result = result.filter((p: any) => {
        const productMaterials: string[] = [];
        if (p.option1_name?.toLowerCase().includes('material') && p.option1_values) {
          productMaterials.push(...p.option1_values);
        }
        if (p.option2_name?.toLowerCase().includes('material') && p.option2_values) {
          productMaterials.push(...p.option2_values);
        }
        if (p.option3_name?.toLowerCase().includes('material') && p.option3_values) {
          productMaterials.push(...p.option3_values);
        }
        return selectedMaterials.some(m => productMaterials.includes(m));
      });
    }

    // Sort
    switch (sortBy) {
      case "price-low":
        result.sort((a, b) => a.price - b.price);
        break;
      case "price-high":
        result.sort((a, b) => b.price - a.price);
        break;
      case "name-asc":
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "name-desc":
        result.sort((a, b) => b.name.localeCompare(a.name));
        break;
      case "featured":
        result.sort((a, b) => (b.is_featured ? 1 : 0) - (a.is_featured ? 1 : 0));
        break;
    }

    return result;
  }, [products, selectedCategory, priceRange, selectedColors, selectedSizes, selectedMaterials, sortBy]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredAndSortedProducts.length / ITEMS_PER_PAGE);
  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredAndSortedProducts.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredAndSortedProducts, currentPage]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory, priceRange, selectedColors, selectedSizes, selectedMaterials, searchParams]);

  const activeFiltersCount = 
    (selectedCategory !== "all" ? 1 : 0) + 
    (priceRange[0] > 0 || priceRange[1] < maxPrice ? 1 : 0) + 
    selectedTags.length +
    selectedColors.length +
    selectedSizes.length +
    selectedMaterials.length;

  const FilterSidebar = () => (
    <ProductFilters
      categories={categoryOptions}
      selectedCategory={selectedCategory}
      onCategoryChange={handleCategoryChange}
      priceRange={priceRange}
      onPriceRangeChange={setPriceRange}
      maxPrice={maxPrice}
      tags={[]}
      selectedTags={selectedTags}
      onTagsChange={setSelectedTags}
      colors={availableColors}
      selectedColors={selectedColors}
      onColorsChange={setSelectedColors}
      sizes={availableSizes}
      selectedSizes={selectedSizes}
      onSizesChange={setSelectedSizes}
      materials={availableMaterials}
      selectedMaterials={selectedMaterials}
      onMaterialsChange={setSelectedMaterials}
      onClearAll={handleClearAll}
    />
  );

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 bg-muted/30 pb-24 lg:pb-0">
        {/* Hero Banner */}
        <div className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground py-12 md:py-16">
          <div className="container mx-auto px-4 text-center">
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-3xl md:text-5xl font-serif font-bold mb-4"
            >
              {searchParams.get("q") 
                ? `${isArabic ? 'بحث:' : 'Search:'} "${searchParams.get("q")}"` 
                : selectedCategory !== "all" 
                  ? categoryOptions.find(c => c.key === selectedCategory)?.label || (isArabic ? "التسوق" : "Shop")
                  : isArabic ? "جميع المنتجات" : "Shop All Products"
              }
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-primary-foreground/80 max-w-2xl mx-auto text-lg"
            >
              {isArabic 
                ? "اكتشف مجموعتنا المختارة من النباتات والأواني وديكور المنزل"
                : "Discover our curated collection of plants, pots, and home decor"
              }
            </motion.p>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">
          <div className="flex gap-8">
            {/* Desktop Sidebar */}
            <aside className="hidden lg:block w-72 flex-shrink-0">
              <div className="sticky top-24">
                <FilterSidebar />
              </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 min-w-0">
              {/* Top Bar */}
              <div className="bg-background rounded-xl shadow-sm p-4 mb-6">
              {/* Mobile-optimized layout */}
              <div className="flex flex-col gap-3">
                {/* Search - Full width on mobile */}
                <form onSubmit={handleSearch} className="w-full">
                  <div className="relative">
                    <input
                      id="shop-search-input"
                      type="text"
                      placeholder={isArabic ? "البحث حسب الاسم، الفئة..." : "Search by name, category..."}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-4 pr-12 py-2.5 sm:py-3 bg-muted border-0 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                    <button 
                      type="submit"
                      disabled={isSearching}
                      className="absolute right-1.5 top-1.5 bottom-1.5 px-3 sm:px-4 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
                    >
                      {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                    </button>
                  </div>
                </form>

                {/* Filter & Sort Row - Compact on mobile */}
                <div className="flex items-center gap-2 sm:gap-3">
                  {/* Mobile Filter Button */}
                  <Sheet open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
                    <SheetTrigger asChild>
                      <button className="lg:hidden flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-muted rounded-xl text-xs sm:text-sm font-medium hover:bg-muted/80 transition-colors">
                        <SlidersHorizontal className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        <span className="hidden xs:inline">{isArabic ? "فلترة" : "Filters"}</span>
                        {activeFiltersCount > 0 && (
                          <span className="px-1.5 py-0.5 bg-primary text-primary-foreground rounded-full text-[10px] sm:text-xs min-w-[18px] text-center">
                            {activeFiltersCount}
                          </span>
                        )}
                      </button>
                    </SheetTrigger>
                    <SheetContent side="left" className="w-[280px] sm:w-[320px] p-0">
                      <SheetHeader className="p-3 sm:p-4 border-b">
                        <SheetTitle className="text-base sm:text-lg">{isArabic ? "فلترة" : "Filters"}</SheetTitle>
                      </SheetHeader>
                      <div className="p-3 sm:p-4 overflow-y-auto max-h-[calc(100vh-80px)]">
                        <FilterSidebar />
                      </div>
                    </SheetContent>
                  </Sheet>

                  {/* Sort - Compact on mobile */}
                  <div className="relative flex-1 sm:flex-none">
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="w-full sm:w-auto appearance-none bg-muted px-3 sm:px-4 py-2 sm:py-2.5 pr-8 sm:pr-10 rounded-xl text-xs sm:text-sm cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/20"
                    >
                      {sortOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-2.5 sm:right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground pointer-events-none" />
                  </div>

                    {/* Grid View Toggle - Desktop only */}
                    <div className="hidden md:flex items-center border border-border rounded-xl p-1 bg-muted/50">
                      <button
                        onClick={() => setGridView("large")}
                        className={`p-2 rounded-lg transition-colors ${
                          gridView === "large" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-background"
                        }`}
                        aria-label="Large grid view"
                      >
                        <LayoutGrid className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setGridView("small")}
                        className={`p-2 rounded-lg transition-colors ${
                          gridView === "small" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-background"
                        }`}
                        aria-label="Small grid view"
                      >
                        <Grid3X3 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Active Filters Pills - More compact on mobile */}
                {activeFiltersCount > 0 && (
                  <div className="flex items-center gap-1.5 sm:gap-2 mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-border flex-wrap">
                    <span className="text-xs sm:text-sm text-muted-foreground w-full sm:w-auto mb-1 sm:mb-0">{isArabic ? "فلاتر نشطة:" : "Active filters:"}</span>
                    {selectedCategory !== "all" && (
                      <span className="inline-flex items-center gap-1 px-2 sm:px-3 py-0.5 sm:py-1 bg-primary/10 text-primary rounded-full text-xs sm:text-sm">
                        <span className="max-w-[80px] sm:max-w-none truncate">{categoryOptions.find(c => c.key === selectedCategory)?.label}</span>
                        <button onClick={() => handleCategoryChange("all")} className="shrink-0">
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    )}
                    {(priceRange[0] > 0 || priceRange[1] < maxPrice) && (
                      <span className="inline-flex items-center gap-1 px-2 sm:px-3 py-0.5 sm:py-1 bg-primary/10 text-primary rounded-full text-xs sm:text-sm">
                        AED {priceRange[0]} - {priceRange[1]}
                        <button onClick={() => setPriceRange([0, maxPrice])} className="shrink-0">
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    )}
                    <button
                      onClick={handleClearAll}
                      className="text-xs sm:text-sm text-muted-foreground hover:text-foreground underline"
                    >
                      {isArabic ? "مسح الكل" : "Clear all"}
                    </button>
                  </div>
                )}
              </div>

              {/* Results Count */}
              <div className="flex items-center justify-between mb-6">
                <p className="text-muted-foreground">
                  {loading 
                    ? (isArabic ? "جاري التحميل..." : "Loading...") 
                    : `${filteredAndSortedProducts.length} ${isArabic ? "منتج" : "products found"}`
                  }
                </p>
              </div>

              {/* Products Grid */}
              {loading ? (
                <div className={`grid gap-3 sm:gap-4 md:gap-6 ${
                  gridView === "large" 
                    ? "grid-cols-2 lg:grid-cols-3" 
                    : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4"
                }`}>
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="bg-background rounded-xl overflow-hidden animate-pulse">
                      <div className="aspect-square bg-muted" />
                      <div className="p-3 md:p-4 space-y-2 md:space-y-3">
                        <div className="h-3 md:h-4 bg-muted rounded w-3/4" />
                        <div className="h-3 md:h-4 bg-muted rounded w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : filteredAndSortedProducts.length > 0 ? (
                <>
                  <div className={`grid gap-3 sm:gap-4 md:gap-6 ${
                    gridView === "large" 
                      ? "grid-cols-2 lg:grid-cols-3" 
                      : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4"
                  }`}>
                    {paginatedProducts.map((product) => (
                      <LocalProductCard key={product.id} product={product} isArabic={isArabic} />
                    ))}
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex flex-col items-center gap-4 mt-10">
                      {/* Desktop pagination info */}
                      <p className="hidden sm:block text-sm text-muted-foreground">
                        {isArabic 
                          ? `عرض ${((currentPage - 1) * ITEMS_PER_PAGE) + 1}-${Math.min(currentPage * ITEMS_PER_PAGE, filteredAndSortedProducts.length)} من ${filteredAndSortedProducts.length} منتج`
                          : `Showing ${((currentPage - 1) * ITEMS_PER_PAGE) + 1}-${Math.min(currentPage * ITEMS_PER_PAGE, filteredAndSortedProducts.length)} of ${filteredAndSortedProducts.length} products`
                        }
                      </p>
                      
                      {/* Mobile pagination - simple */}
                      <p className="sm:hidden text-xs text-muted-foreground">
                        {isArabic 
                          ? `صفحة ${currentPage} من ${totalPages}`
                          : `Page ${currentPage} of ${totalPages}`
                        }
                      </p>
                      
                      {/* Desktop: Full pagination */}
                      <div className="hidden sm:flex items-center gap-2">
                        <button
                          onClick={() => {
                            setCurrentPage(prev => Math.max(1, prev - 1));
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                          disabled={currentPage === 1}
                          className="px-4 py-2 text-sm font-medium bg-background border border-border rounded-lg hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          {isArabic ? "السابق" : "Previous"}
                        </button>
                        
                        <div className="flex items-center gap-1">
                          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                            const showPage = page === 1 || 
                              page === totalPages || 
                              Math.abs(page - currentPage) <= 1;
                            const showEllipsis = page === 2 && currentPage > 3 || 
                              page === totalPages - 1 && currentPage < totalPages - 2;
                            
                            if (!showPage && !showEllipsis) return null;
                            
                            if (showEllipsis && !showPage) {
                              return (
                                <span key={page} className="px-2 text-muted-foreground">
                                  ...
                                </span>
                              );
                            }
                            
                            return (
                              <button
                                key={page}
                                onClick={() => {
                                  setCurrentPage(page);
                                  window.scrollTo({ top: 0, behavior: 'smooth' });
                                }}
                                className={`w-10 h-10 text-sm font-medium rounded-lg transition-colors ${
                                  currentPage === page
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-background border border-border hover:bg-muted"
                                }`}
                              >
                                {page}
                              </button>
                            );
                          })}
                        </div>

                        <button
                          onClick={() => {
                            setCurrentPage(prev => Math.min(totalPages, prev + 1));
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                          disabled={currentPage === totalPages}
                          className="px-4 py-2 text-sm font-medium bg-background border border-border rounded-lg hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          {isArabic ? "التالي" : "Next"}
                        </button>
                      </div>
                      
                      {/* Mobile: Load more button */}
                      <div className="sm:hidden w-full space-y-3">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => {
                              setCurrentPage(prev => Math.max(1, prev - 1));
                              window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                            disabled={currentPage === 1}
                            className="flex-1 py-2.5 text-sm font-medium bg-background border border-border rounded-lg hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            {isArabic ? "السابق" : "← Prev"}
                          </button>
                          <button
                            onClick={() => {
                              setCurrentPage(prev => Math.min(totalPages, prev + 1));
                              window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                            disabled={currentPage === totalPages}
                            className="flex-1 py-2.5 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            {isArabic ? "التالي" : "Next →"}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center py-16"
                >
                  <div className="w-20 h-20 mx-auto mb-6 bg-muted rounded-full flex items-center justify-center">
                    <Search className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">
                    {isArabic ? "لم يتم العثور على منتجات" : "No products found"}
                  </h3>
                  <p className="text-muted-foreground mb-6">
                    {isArabic 
                      ? "جرب تغيير معايير البحث أو تصفح الفئات"
                      : "Try adjusting your search criteria or browse our categories"
                    }
                  </p>
                  <button
                    onClick={handleClearAll}
                    className="px-6 py-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                  >
                    {isArabic ? "مسح الفلاتر" : "Clear Filters"}
                  </button>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}