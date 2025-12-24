import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Plus, Pencil, Trash2, Package, RefreshCw, X, Copy, Eye, Upload, CheckSquare, Square, FileDown, Download } from "lucide-react";
import { MediaPicker } from "./MediaPicker";
import { ExportButtons } from "./ExportButtons";
import { ProductCSVImporter } from "./ProductCSVImporter";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

interface ProductVariant {
  id?: string;
  sku?: string;
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

interface DigitalFile {
  id?: string;
  name: string;
  url: string;
  size?: number;
  download_limit?: number;
  expiry_days?: number;
}

interface Product {
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
  is_digital?: boolean;
  stock_quantity: number;
  sku?: string;
  tags?: string[];
  product_type: 'simple' | 'variable' | 'digital';
  option1_name?: string;
  option1_values?: string[];
  option2_name?: string;
  option2_values?: string[];
  option3_name?: string;
  option3_values?: string[];
  variants?: ProductVariant[];
  digital_files?: DigitalFile[];
  download_limit?: number;
  download_expiry_days?: number;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  parent_id?: string;
}

// Inline Editable Cell Component
const InlineEditableCell = ({ 
  value, 
  onSave, 
  type = "text",
  prefix = "",
  multiline = false,
  className = ""
}: { 
  value: string; 
  onSave: (value: string) => Promise<void>; 
  type?: "text" | "number";
  prefix?: string;
  multiline?: boolean;
  className?: string;
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (editValue === value) {
      setIsEditing(false);
      return;
    }
    setSaving(true);
    try {
      await onSave(editValue);
      toast.success("Updated");
    } catch (e: any) {
      toast.error(e.message || "Update failed");
      setEditValue(value);
    } finally {
      setSaving(false);
      setIsEditing(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !multiline) handleSave();
    if (e.key === 'Enter' && multiline && e.ctrlKey) handleSave();
    if (e.key === 'Escape') {
      setEditValue(value);
      setIsEditing(false);
    }
  };

  if (isEditing) {
    return (
      <div className="flex items-start gap-1">
        {prefix && <span className="text-muted-foreground text-sm">{prefix}</span>}
        {multiline ? (
          <Textarea
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={handleSave}
            onKeyDown={handleKeyDown}
            className="min-h-[60px] text-sm"
            autoFocus
            disabled={saving}
            placeholder="Enter description..."
          />
        ) : (
          <Input
            type={type}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={handleSave}
            onKeyDown={handleKeyDown}
            className="h-8 w-24 text-sm"
            autoFocus
            disabled={saving}
          />
        )}
      </div>
    );
  }

  return (
    <div
      onClick={() => { setIsEditing(true); setEditValue(value); }}
      className={`cursor-pointer hover:bg-muted/50 px-2 py-1 rounded transition-colors font-medium min-w-[60px] ${className}`}
      title="Click to edit"
    >
      {prefix}{value || <span className="text-muted-foreground italic text-xs">Click to add</span>}
    </div>
  );
};

export const ProductManager = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("general");
  const [mainTab, setMainTab] = useState("products");
  const [newOptionValue, setNewOptionValue] = useState({ opt1: "", opt2: "", opt3: "" });
  const [discountPercentage, setDiscountPercentage] = useState<number>(0);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Filters
  const [filterCategory, setFilterCategory] = useState<string>("_all_");
  const [filterSubcategory, setFilterSubcategory] = useState<string>("_all_");
  const [filterProductType, setFilterProductType] = useState<string>("_all_");
  const [filterStatus, setFilterStatus] = useState<string>("_all_");

  // Bulk Selection
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkCategory, setBulkCategory] = useState<string>("");
  const [bulkSubcategory, setBulkSubcategory] = useState<string>("");

  const fetchCategories = async () => {
    const { data } = await supabase.from('categories').select('*').eq('is_active', true).order('display_order');
    setCategories(data || []);
  };

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      const productsWithVariants = await Promise.all((data || []).map(async (product) => {
        const typedProduct = {
          ...product,
          product_type: (product.product_type || 'simple') as 'simple' | 'variable',
        };
        
        if (typedProduct.product_type === 'variable') {
          const { data: variants } = await supabase
            .from('product_variants')
            .select('*')
            .eq('product_id', product.id);
          return { ...typedProduct, variants: variants || [] };
        }
        return typedProduct;
      }));
      
      setProducts(productsWithVariants as Product[]);
    } catch (error) {
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    fetchProducts(); 
    fetchCategories();

    // Real-time subscription for products
    const channel = supabase
      .channel('admin-products-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'products' },
        () => {
          fetchProducts();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'product_variants' },
        () => {
          fetchProducts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const generateSlug = (name: string) => {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  };

  const handleSave = async () => {
    if (!editingProduct?.name) { 
      toast.error('Product name is required'); 
      return; 
    }
    
    setSaving(true);
    try {
      const slug = editingProduct.slug || generateSlug(editingProduct.name);
      const category = editingProduct.category || 'general';
      
      const productData = {
        name: editingProduct.name,
        name_ar: editingProduct.name_ar || null,
        slug,
        description: editingProduct.description || null,
        description_ar: editingProduct.description_ar || null,
        price: editingProduct.price || 0,
        compare_at_price: editingProduct.compare_at_price || null,
        currency: editingProduct.currency || 'AED',
        category,
        subcategory: editingProduct.subcategory || null,
        featured_image: editingProduct.featured_image || null,
        images: editingProduct.images || [],
        is_featured: editingProduct.is_featured || false,
        is_on_sale: editingProduct.is_on_sale || false,
        is_new: editingProduct.is_new || false,
        is_active: editingProduct.is_active ?? true,
        stock_quantity: editingProduct.stock_quantity || 0,
        sku: editingProduct.sku || null,
        tags: editingProduct.tags || [],
        product_type: editingProduct.product_type || 'simple',
        option1_name: editingProduct.option1_name || null,
        option1_values: editingProduct.option1_values || [],
        option2_name: editingProduct.option2_name || null,
        option2_values: editingProduct.option2_values || [],
        option3_name: editingProduct.option3_name || null,
        option3_values: editingProduct.option3_values || [],
      };

      let productId = editingProduct.id;

      if (editingProduct.id) {
        const { error } = await supabase
          .from('products')
          .update(productData)
          .eq('id', editingProduct.id);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from('products')
          .insert(productData)
          .select()
          .single();
        if (error) throw error;
        productId = data.id;
      }

      if (editingProduct.product_type === 'variable' && productId) {
        await supabase.from('product_variants').delete().eq('product_id', productId);
        
        if (editingProduct.variants && editingProduct.variants.length > 0) {
          const variantsToInsert = editingProduct.variants.map(v => ({
            product_id: productId,
            sku: v.sku,
            price: v.price,
            compare_at_price: v.compare_at_price,
            stock_quantity: v.stock_quantity,
            is_active: v.is_active,
            option1_name: v.option1_name,
            option1_value: v.option1_value,
            option2_name: v.option2_name,
            option2_value: v.option2_value,
            option3_name: v.option3_name,
            option3_value: v.option3_value,
            image_url: v.image_url,
          }));
          
          const { error: variantError } = await supabase
            .from('product_variants')
            .insert(variantsToInsert);
          
          if (variantError) throw variantError;
        }
      }

      toast.success('Product saved successfully');
      setIsDialogOpen(false);
      setEditingProduct(null);
      fetchProducts();
    } catch (error) {
      console.error('Save error:', error);
      toast.error('Failed to save product');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    
    try {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) throw error;
      toast.success('Product deleted');
      fetchProducts();
    } catch (error) {
      toast.error('Failed to delete product');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!confirm(`Are you sure you want to delete ${selectedIds.length} products?`)) return;
    
    try {
      const { error } = await supabase.from('products').delete().in('id', selectedIds);
      if (error) throw error;
      toast.success(`${selectedIds.length} products deleted`);
      setSelectedIds([]);
      fetchProducts();
    } catch (error) {
      toast.error('Failed to delete products');
    }
  };

  const handleBulkActivate = async (activate: boolean) => {
    if (selectedIds.length === 0) return;
    
    try {
      const { error } = await supabase
        .from('products')
        .update({ is_active: activate })
        .in('id', selectedIds);
      if (error) throw error;
      toast.success(`${selectedIds.length} products ${activate ? 'activated' : 'deactivated'}`);
      setSelectedIds([]);
      fetchProducts();
    } catch (error) {
      toast.error('Failed to update products');
    }
  };

  const handleBulkFeatured = async (featured: boolean) => {
    if (selectedIds.length === 0) return;
    
    try {
      const { error } = await supabase
        .from('products')
        .update({ is_featured: featured })
        .in('id', selectedIds);
      if (error) throw error;
      toast.success(`${selectedIds.length} products ${featured ? 'marked as featured' : 'unmarked'}`);
      setSelectedIds([]);
      fetchProducts();
    } catch (error) {
      toast.error('Failed to update products');
    }
  };

  const handleBulkCategoryAssign = async () => {
    if (selectedIds.length === 0) {
      toast.error('No products selected');
      return;
    }
    if (!bulkCategory) {
      toast.error('Please select a category');
      return;
    }
    
    try {
      const updateData: { category: string; subcategory?: string } = { 
        category: bulkCategory 
      };
      
      if (bulkSubcategory) {
        updateData.subcategory = bulkSubcategory;
      }
      
      const { error } = await supabase
        .from('products')
        .update(updateData)
        .in('id', selectedIds);
      
      if (error) throw error;
      
      const categoryName = categories.find(c => c.slug === bulkCategory)?.name || bulkCategory;
      toast.success(`${selectedIds.length} products moved to "${categoryName}"`);
      setSelectedIds([]);
      setBulkCategory("");
      setBulkSubcategory("");
      fetchProducts();
    } catch (error) {
      console.error('Bulk category error:', error);
      toast.error('Failed to update product categories');
    }
  };

  // Get subcategories for selected parent category
  const getSubcategories = (parentSlug: string) => {
    const parent = categories.find(c => c.slug === parentSlug);
    if (!parent) return [];
    return categories.filter(c => c.parent_id === parent.id);
  };

  const handleDuplicate = (product: Product) => {
    const duplicated = {
      ...product,
      id: undefined,
      name: `${product.name} (Copy)`,
      slug: `${product.slug}-copy`,
      variants: product.variants?.map(v => ({ ...v, id: undefined })),
    };
    setEditingProduct(duplicated);
    setIsDialogOpen(true);
  };

  const openNewProduct = () => {
    setEditingProduct({
      is_active: true,
      currency: 'AED',
      category: categories[0]?.slug || 'general',
      stock_quantity: 10,
      price: 0,
      product_type: 'simple',
      images: [],
      tags: [],
      option1_values: [],
      option2_values: [],
      option3_values: [],
      variants: [],
    });
    setActiveTab("general");
    setIsDialogOpen(true);
  };

  const addOptionValue = (optionNum: 1 | 2 | 3) => {
    const key = `opt${optionNum}` as 'opt1' | 'opt2' | 'opt3';
    const value = newOptionValue[key].trim();
    if (!value) return;

    const valuesKey = `option${optionNum}_values` as keyof Product;
    const currentValues = (editingProduct?.[valuesKey] as string[]) || [];
    
    if (!currentValues.includes(value)) {
      setEditingProduct({
        ...editingProduct,
        [valuesKey]: [...currentValues, value],
      });
    }
    setNewOptionValue({ ...newOptionValue, [key]: "" });
  };

  const removeOptionValue = (optionNum: 1 | 2 | 3, value: string) => {
    const valuesKey = `option${optionNum}_values` as keyof Product;
    const currentValues = (editingProduct?.[valuesKey] as string[]) || [];
    setEditingProduct({
      ...editingProduct,
      [valuesKey]: currentValues.filter(v => v !== value),
    });
  };

  const generateVariants = () => {
    if (!editingProduct) return;
    
    const opt1Values = editingProduct.option1_values || [];
    const opt2Values = editingProduct.option2_values || [];
    const opt3Values = editingProduct.option3_values || [];
    
    const variants: ProductVariant[] = [];
    
    const addVariant = (o1?: string, o2?: string, o3?: string) => {
      variants.push({
        price: editingProduct.price || 0,
        stock_quantity: 10,
        is_active: true,
        option1_name: editingProduct.option1_name,
        option1_value: o1,
        option2_name: editingProduct.option2_name,
        option2_value: o2,
        option3_name: editingProduct.option3_name,
        option3_value: o3,
      });
    };

    if (opt1Values.length === 0) {
      addVariant();
    } else if (opt2Values.length === 0) {
      opt1Values.forEach(o1 => addVariant(o1));
    } else if (opt3Values.length === 0) {
      opt1Values.forEach(o1 => opt2Values.forEach(o2 => addVariant(o1, o2)));
    } else {
      opt1Values.forEach(o1 => opt2Values.forEach(o2 => opt3Values.forEach(o3 => addVariant(o1, o2, o3))));
    }

    setEditingProduct({ ...editingProduct, variants });
    toast.success(`Generated ${variants.length} variants`);
  };

  const updateVariant = (index: number, field: keyof ProductVariant, value: any) => {
    if (!editingProduct?.variants) return;
    const updated = [...editingProduct.variants];
    updated[index] = { ...updated[index], [field]: value };
    setEditingProduct({ ...editingProduct, variants: updated });
  };

  const removeVariant = (index: number) => {
    if (!editingProduct?.variants) return;
    setEditingProduct({
      ...editingProduct,
      variants: editingProduct.variants.filter((_, i) => i !== index),
    });
  };

  const addGalleryImage = (url: string) => {
    if (!url || !editingProduct) return;
    const images = editingProduct.images || [];
    if (!images.includes(url)) {
      setEditingProduct({ ...editingProduct, images: [...images, url] });
    }
  };

  const removeGalleryImage = (url: string) => {
    if (!editingProduct) return;
    setEditingProduct({
      ...editingProduct,
      images: (editingProduct.images || []).filter(img => img !== url),
    });
  };

  const [lastSelectedIndex, setLastSelectedIndex] = useState<number | null>(null);

  const toggleSelectAll = () => {
    if (selectedIds.length === paginatedProducts.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(paginatedProducts.map(p => p.id));
    }
  };

  const toggleSelectOne = (id: string, event?: React.MouseEvent) => {
    const currentIndex = paginatedProducts.findIndex(p => p.id === id);
    
    // Shift+Click for range selection
    if (event?.shiftKey && lastSelectedIndex !== null) {
      const start = Math.min(lastSelectedIndex, currentIndex);
      const end = Math.max(lastSelectedIndex, currentIndex);
      const rangeIds = paginatedProducts.slice(start, end + 1).map(p => p.id);
      setSelectedIds(prev => [...new Set([...prev, ...rangeIds])]);
      return;
    }
    
    // Ctrl/Cmd+Click for toggle
    if (event?.ctrlKey || event?.metaKey) {
      if (selectedIds.includes(id)) {
        setSelectedIds(selectedIds.filter(i => i !== id));
      } else {
        setSelectedIds([...selectedIds, id]);
      }
      setLastSelectedIndex(currentIndex);
      return;
    }
    
    // Normal click
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(i => i !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
    setLastSelectedIndex(currentIndex);
  };

  const filtered = products.filter(p => {
    // Search filter
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.sku && p.sku.toLowerCase().includes(searchTerm.toLowerCase()));
    
    // Category filter
    const matchesCategory = filterCategory === "_all_" || p.category === filterCategory;
    
    // Subcategory filter
    const matchesSubcategory = filterSubcategory === "_all_" || p.subcategory === filterSubcategory;
    
    // Product type filter
    const matchesProductType = filterProductType === "_all_" || p.product_type === filterProductType;
    
    // Status filter
    const matchesStatus = filterStatus === "_all_" || 
      (filterStatus === "active" && p.is_active) ||
      (filterStatus === "inactive" && !p.is_active) ||
      (filterStatus === "featured" && p.is_featured) ||
      (filterStatus === "on_sale" && p.is_on_sale) ||
      (filterStatus === "new" && p.is_new);
    
    return matchesSearch && matchesCategory && matchesSubcategory && matchesProductType && matchesStatus;
  });

  // Pagination
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginatedProducts = filtered.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Keyboard shortcuts for bulk selection
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd+A to select all
      if (e.key === 'a' && (e.ctrlKey || e.metaKey) && paginatedProducts.length > 0) {
        e.preventDefault();
        setSelectedIds(paginatedProducts.map(p => p.id));
      }
      // Escape to clear selection
      if (e.key === 'Escape') {
        setSelectedIds([]);
        setLastSelectedIndex(null);
      }
      // Delete key for bulk delete
      if (e.key === 'Delete' && selectedIds.length > 0) {
        handleBulkDelete();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [paginatedProducts, selectedIds]);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center flex-wrap gap-4">
          <CardTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            Products ({products.length})
          </CardTitle>
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" size="sm" onClick={fetchProducts}>
              <RefreshCw className="w-4 h-4" />
            </Button>
            <ExportButtons 
              data={products.map(p => ({
                name: p.name,
                slug: p.slug,
                category: p.category,
                subcategory: p.subcategory || '',
                price: `${p.currency} ${p.price}`,
                compare_at_price: p.compare_at_price ? `${p.currency} ${p.compare_at_price}` : '',
                discount: p.compare_at_price && p.compare_at_price > p.price 
                  ? `${Math.round((1 - p.price / p.compare_at_price) * 100)}%` 
                  : '',
                stock: p.stock_quantity,
                sku: p.sku || '',
                type: p.product_type,
                is_featured: p.is_featured ? 'Yes' : 'No',
                is_on_sale: p.is_on_sale ? 'Yes' : 'No',
                is_new: p.is_new ? 'Yes' : 'No',
                is_active: p.is_active ? 'Yes' : 'No'
              }))} 
              filename={`products-${new Date().toISOString().split('T')[0]}`}
            />
            <Button size="sm" onClick={openNewProduct}>
              <Plus className="w-4 h-4 mr-1" />
              Add Product
            </Button>
          </div>
            </div>

            {/* Filter Bar */}
            <div className="flex flex-wrap gap-3 p-3 bg-muted/30 rounded-lg border">
              <div className="flex flex-col gap-1">
                <Label className="text-xs text-muted-foreground">Category</Label>
                <Select value={filterCategory} onValueChange={(v) => { setFilterCategory(v); setFilterSubcategory("_all_"); setCurrentPage(1); }}>
                  <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_all_">All Categories</SelectItem>
                    {categories.filter(c => !c.parent_id).map(cat => (
                      <SelectItem key={cat.id} value={cat.slug}>{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {filterCategory !== "_all_" && (
                <div className="flex flex-col gap-1">
                  <Label className="text-xs text-muted-foreground">Subcategory</Label>
                  <Select value={filterSubcategory} onValueChange={(v) => { setFilterSubcategory(v); setCurrentPage(1); }}>
                    <SelectTrigger className="w-[160px]">
                      <SelectValue placeholder="All Subcategories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="_all_">All Subcategories</SelectItem>
                      {categories.filter(c => {
                        const parent = categories.find(p => p.slug === filterCategory);
                        return parent && c.parent_id === parent.id;
                      }).map(subcat => (
                        <SelectItem key={subcat.id} value={subcat.slug}>{subcat.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="flex flex-col gap-1">
                <Label className="text-xs text-muted-foreground">Product Type</Label>
                <Select value={filterProductType} onValueChange={(v) => { setFilterProductType(v); setCurrentPage(1); }}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_all_">All Types</SelectItem>
                    <SelectItem value="simple">Simple</SelectItem>
                    <SelectItem value="variable">Variable</SelectItem>
                    <SelectItem value="digital">Digital</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-1">
                <Label className="text-xs text-muted-foreground">Status</Label>
                <Select value={filterStatus} onValueChange={(v) => { setFilterStatus(v); setCurrentPage(1); }}>
                  <SelectTrigger className="w-[130px]">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_all_">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="featured">Featured</SelectItem>
                    <SelectItem value="on_sale">On Sale</SelectItem>
                    <SelectItem value="new">New</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {(filterCategory !== "_all_" || filterProductType !== "_all_" || filterStatus !== "_all_") && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="self-end"
                  onClick={() => {
                    setFilterCategory("_all_");
                    setFilterSubcategory("_all_");
                    setFilterProductType("_all_");
                    setFilterStatus("_all_");
                    setCurrentPage(1);
                  }}
                >
                  <X className="w-4 h-4 mr-1" />
                  Clear Filters
                </Button>
              )}
              
              <div className="ml-auto self-end text-xs text-muted-foreground">
                {filtered.length} of {products.length} products
              </div>
            </div>
      </CardHeader>
      <CardContent>
        <Tabs value={mainTab} onValueChange={setMainTab} className="space-y-4">
          <TabsList>
            <TabsTrigger value="products">All Products</TabsTrigger>
            <TabsTrigger value="import" className="gap-1">
              <Upload className="w-4 h-4" />
              CSV Import
            </TabsTrigger>
          </TabsList>

          <TabsContent value="products" className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <Input 
                placeholder="Search products..." 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
              <div className="flex gap-2 items-center">
                <span className="text-sm text-muted-foreground">Show:</span>
                <Select value={itemsPerPage.toString()} onValueChange={(v) => { setItemsPerPage(Number(v)); setCurrentPage(1); }}>
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Bulk Actions */}
            {selectedIds.length > 0 && (
              <div className="flex flex-col gap-3 p-4 bg-muted/50 rounded-lg border">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{selectedIds.length} product(s) selected</span>
                  <Button size="sm" variant="ghost" onClick={() => setSelectedIds([])}>
                    <X className="w-4 h-4 mr-1" />
                    Clear Selection
                  </Button>
                </div>
                
                {/* Bulk Category Assignment */}
                <div className="flex flex-wrap items-end gap-3 p-3 bg-background rounded-md border">
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-xs font-medium">Assign to Category</Label>
                    <Select value={bulkCategory} onValueChange={(v) => { setBulkCategory(v); setBulkSubcategory(""); }}>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map(cat => (
                          <SelectItem key={cat.id} value={cat.slug}>{cat.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {bulkCategory && getSubcategories(bulkCategory).length > 0 && (
                    <div className="flex flex-col gap-1.5">
                      <Label className="text-xs font-medium">Subcategory (Optional)</Label>
                      <Select value={bulkSubcategory || "_none_"} onValueChange={(v) => setBulkSubcategory(v === "_none_" ? "" : v)}>
                        <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder="Select subcategory" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="_none_">None</SelectItem>
                          {getSubcategories(bulkCategory).map(subcat => (
                            <SelectItem key={subcat.id} value={subcat.slug}>{subcat.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  
                  <Button size="sm" onClick={handleBulkCategoryAssign} disabled={!bulkCategory}>
                    Move to Category
                  </Button>
                </div>

                {/* Other Bulk Actions */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs text-muted-foreground">Quick Actions:</span>
                  <Button size="sm" variant="outline" onClick={() => handleBulkActivate(true)}>
                    Activate
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleBulkActivate(false)}>
                    Deactivate
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleBulkFeatured(true)}>
                    Mark Featured
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleBulkFeatured(false)}>
                    Unmark Featured
                  </Button>
                  <Button size="sm" variant="destructive" onClick={handleBulkDelete}>
                    <Trash2 className="w-4 h-4 mr-1" />
                    Delete
                  </Button>
                  <span className="text-xs text-muted-foreground ml-2 hidden md:inline">
                    Tip: Ctrl+A select all, Shift+Click range, Escape clear
                  </span>
                </div>
              </div>
            )}
            
            <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10 md:w-12">
                      <Checkbox 
                        checked={selectedIds.length === paginatedProducts.length && paginatedProducts.length > 0}
                        onCheckedChange={toggleSelectAll}
                      />
                    </TableHead>
                    <TableHead className="w-14 md:w-auto">Image</TableHead>
                    <TableHead className="min-w-[120px]">Name</TableHead>
                    <TableHead className="hidden xl:table-cell">Description</TableHead>
                    <TableHead className="hidden md:table-cell">Type</TableHead>
                    <TableHead className="hidden sm:table-cell">Category</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead className="hidden lg:table-cell">Discount</TableHead>
                    <TableHead className="hidden sm:table-cell">Stock</TableHead>
                    <TableHead className="hidden md:table-cell">Status</TableHead>
                    <TableHead className="w-20">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedProducts.map(p => {
                    const discountPct = p.compare_at_price && p.compare_at_price > p.price 
                      ? Math.round((1 - p.price / p.compare_at_price) * 100)
                      : 0;
                    
                    return (
                      <TableRow key={p.id}>
                        <TableCell>
                          <Checkbox 
                            checked={selectedIds.includes(p.id)}
                            onCheckedChange={() => toggleSelectOne(p.id)}
                            onClick={(e) => toggleSelectOne(p.id, e as unknown as React.MouseEvent)}
                          />
                        </TableCell>
                        <TableCell>
                          {p.featured_image ? (
                            <img src={p.featured_image} alt={p.name} className="w-12 h-12 object-cover rounded" />
                          ) : (
                            <div className="w-12 h-12 bg-muted rounded flex items-center justify-center">
                              <Package className="w-6 h-6 text-muted-foreground" />
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <InlineEditableCell
                            value={p.name}
                            onSave={async (newValue) => {
                              const { error } = await supabase
                                .from('products')
                                .update({ name: newValue, slug: newValue.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') })
                                .eq('id', p.id);
                              if (error) throw error;
                              fetchProducts();
                            }}
                          />
                        </TableCell>
                        <TableCell className="hidden lg:table-cell max-w-[200px]">
                          <InlineEditableCell
                            value={p.description || ''}
                            multiline
                            className="text-xs text-muted-foreground line-clamp-2"
                            onSave={async (newValue) => {
                              const { error } = await supabase
                                .from('products')
                                .update({ description: newValue })
                                .eq('id', p.id);
                              if (error) throw error;
                              fetchProducts();
                            }}
                          />
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <Badge variant={p.product_type === 'variable' ? 'default' : 'outline'}>
                            {p.product_type === 'variable' ? `Variable (${p.variants?.length || 0})` : 'Simple'}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell"><Badge variant="outline">{p.category}</Badge></TableCell>
                        <TableCell>
                          <InlineEditableCell
                            value={p.price.toString()}
                            type="number"
                            onSave={async (newValue) => {
                              const { error } = await supabase
                                .from('products')
                                .update({ price: parseFloat(newValue) })
                                .eq('id', p.id);
                              if (error) throw error;
                              fetchProducts();
                            }}
                            prefix={p.currency + " "}
                          />
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          {discountPct > 0 ? (
                            <Badge className="bg-red-100 text-red-800">{discountPct}% OFF</Badge>
                          ) : '-'}
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <InlineEditableCell
                            value={p.stock_quantity.toString()}
                            type="number"
                            onSave={async (newValue) => {
                              const { error } = await supabase
                                .from('products')
                                .update({ stock_quantity: parseInt(newValue) })
                                .eq('id', p.id);
                              if (error) throw error;
                              fetchProducts();
                            }}
                          />
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <div className="flex gap-1 flex-wrap">
                            <Badge variant={p.is_active ? "default" : "secondary"}>
                              {p.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                            {p.is_featured && <Badge className="bg-amber-100 text-amber-800">Featured</Badge>}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="sm" onClick={() => { setEditingProduct(p); setIsDialogOpen(true); setActiveTab("general"); }}>
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleDuplicate(p)}>
                              <Copy className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm" className="text-destructive" onClick={() => handleDelete(p.id)}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filtered.length)} of {filtered.length}
                </p>
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious 
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                      />
                    </PaginationItem>
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      return (
                        <PaginationItem key={pageNum}>
                          <PaginationLink
                            onClick={() => setCurrentPage(pageNum)}
                            isActive={currentPage === pageNum}
                            className="cursor-pointer"
                          >
                            {pageNum}
                          </PaginationLink>
                        </PaginationItem>
                      );
                    })}
                    <PaginationItem>
                      <PaginationNext 
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </TabsContent>

          <TabsContent value="import">
            <ProductCSVImporter onImportComplete={fetchProducts} />
          </TabsContent>
        </Tabs>
      </CardContent>

      {/* Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingProduct?.id ? 'Edit Product' : 'Add Product'}</DialogTitle>
          </DialogHeader>
          
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-5 w-full">
              <TabsTrigger value="general">General</TabsTrigger>
              <TabsTrigger value="images">Images</TabsTrigger>
              <TabsTrigger value="pricing">Pricing</TabsTrigger>
              <TabsTrigger value="variants">Variants</TabsTrigger>
              <TabsTrigger value="digital">Digital</TabsTrigger>
            </TabsList>

            <TabsContent value="general" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Product Name *</Label>
                  <Input
                    value={editingProduct?.name || ''}
                    onChange={(e) => setEditingProduct(p => ({ ...p, name: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Name (Arabic)</Label>
                  <Input
                    value={editingProduct?.name_ar || ''}
                    onChange={(e) => setEditingProduct(p => ({ ...p, name_ar: e.target.value }))}
                    dir="rtl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select
                    value={editingProduct?.category || ''}
                    onValueChange={(v) => setEditingProduct(p => ({ ...p, category: v, subcategory: '' }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.filter(c => !c.parent_id).map(c => (
                        <SelectItem key={c.id} value={c.slug}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Subcategory</Label>
                  <Select
                    value={editingProduct?.subcategory || '_none_'}
                    onValueChange={(v) => setEditingProduct(p => ({ ...p, subcategory: v === '_none_' ? '' : v }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select subcategory" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="_none_">None</SelectItem>
                      {getSubcategories(editingProduct?.category || '').map(c => (
                        <SelectItem key={c.id} value={c.slug}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>SKU</Label>
                  <Input
                    value={editingProduct?.sku || ''}
                    onChange={(e) => setEditingProduct(p => ({ ...p, sku: e.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={editingProduct?.description || ''}
                  onChange={(e) => setEditingProduct(p => ({ ...p, description: e.target.value }))}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label>Description (Arabic)</Label>
                <Textarea
                  value={editingProduct?.description_ar || ''}
                  onChange={(e) => setEditingProduct(p => ({ ...p, description_ar: e.target.value }))}
                  rows={3}
                  dir="rtl"
                />
              </div>

              <div className="flex flex-wrap gap-4">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={editingProduct?.is_active ?? true}
                    onCheckedChange={(v) => setEditingProduct(p => ({ ...p, is_active: v }))}
                  />
                  <Label>Active</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={editingProduct?.is_featured || false}
                    onCheckedChange={(v) => setEditingProduct(p => ({ ...p, is_featured: v }))}
                  />
                  <Label>Featured</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={editingProduct?.is_new || false}
                    onCheckedChange={(v) => setEditingProduct(p => ({ ...p, is_new: v }))}
                  />
                  <Label>New</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={editingProduct?.is_on_sale || false}
                    onCheckedChange={(v) => setEditingProduct(p => ({ ...p, is_on_sale: v }))}
                  />
                  <Label>On Sale</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={editingProduct?.category?.toLowerCase().includes('gift') || editingProduct?.subcategory?.toLowerCase().includes('gift') || false}
                    onCheckedChange={(v) => {
                      if (v) {
                        // Add "gift" to category or subcategory
                        setEditingProduct(p => ({ ...p, subcategory: 'gift' }));
                      } else {
                        // Remove gift from subcategory if it was gift
                        setEditingProduct(p => ({ 
                          ...p, 
                          subcategory: p?.subcategory?.toLowerCase() === 'gift' ? '' : p?.subcategory 
                        }));
                      }
                    }}
                  />
                  <Label className="text-amber-600 font-medium">🎁 Gift Item</Label>
                </div>
              </div>

              {/* Tags for multiple categorization */}
              <div className="space-y-2">
                <Label>Tags (for multiple categorization)</Label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {(editingProduct?.tags || []).map((tag, i) => (
                    <Badge key={i} variant="secondary" className="flex items-center gap-1">
                      {tag}
                      <X 
                        className="w-3 h-3 cursor-pointer hover:text-destructive" 
                        onClick={() => {
                          const newTags = [...(editingProduct?.tags || [])];
                          newTags.splice(i, 1);
                          setEditingProduct(p => ({ ...p, tags: newTags }));
                        }}
                      />
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="Add tag (e.g., plants, pots, gift)"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const value = (e.target as HTMLInputElement).value.trim();
                        if (value && !(editingProduct?.tags || []).includes(value)) {
                          setEditingProduct(p => ({ ...p, tags: [...(p?.tags || []), value] }));
                          (e.target as HTMLInputElement).value = '';
                        }
                      }
                    }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">Press Enter to add. Use tags to show product in multiple categories.</p>
              </div>
            </TabsContent>

            <TabsContent value="images" className="space-y-4 mt-4">
              <MediaPicker
                label="Featured Image"
                value={editingProduct?.featured_image || ''}
                onChange={(url) => setEditingProduct(p => ({ ...p, featured_image: url }))}
                folder="products"
              />

              <div className="space-y-2">
                <Label>Gallery Images</Label>
                <div className="grid grid-cols-4 gap-2">
                  {(editingProduct?.images || []).map((img, i) => (
                    <div key={i} className="relative group">
                      <img src={img} alt="" className="w-full aspect-square object-cover rounded" />
                      <Button
                        size="icon"
                        variant="destructive"
                        className="absolute top-1 right-1 w-6 h-6 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => removeGalleryImage(img)}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>
                <MediaPicker
                  label="Add Gallery Image"
                  value=""
                  onChange={addGalleryImage}
                  folder="products"
                />
              </div>
            </TabsContent>

            <TabsContent value="pricing" className="space-y-4 mt-4">
              {/* Discount Info Box */}
              {editingProduct?.compare_at_price && editingProduct.compare_at_price > (editingProduct?.price || 0) && (
                <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                  <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
                    <Badge className="bg-red-500 text-white">
                      {Math.round((1 - (editingProduct?.price || 0) / editingProduct.compare_at_price) * 100)}% OFF
                    </Badge>
                    <span className="text-sm font-medium">
                      Customer saves {editingProduct.currency || 'AED'} {(editingProduct.compare_at_price - (editingProduct?.price || 0)).toFixed(2)}
                    </span>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Sale Price (Current Price) *</Label>
                  <Input
                    type="number"
                    value={editingProduct?.price || 0}
                    onChange={(e) => setEditingProduct(p => ({ ...p, price: parseFloat(e.target.value) || 0 }))}
                    placeholder="e.g., 99"
                  />
                  <p className="text-xs text-muted-foreground">The price customer pays</p>
                </div>
                <div className="space-y-2">
                  <Label>Original Price (Compare at)</Label>
                  <Input
                    type="number"
                    value={editingProduct?.compare_at_price || ''}
                    onChange={(e) => setEditingProduct(p => ({ ...p, compare_at_price: parseFloat(e.target.value) || undefined }))}
                    placeholder="e.g., 149 (higher than sale price)"
                  />
                  <p className="text-xs text-muted-foreground">
                    Set higher than sale price to show discount. Leave empty if no discount.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>Stock Quantity</Label>
                  <Input
                    type="number"
                    value={editingProduct?.stock_quantity || 0}
                    onChange={(e) => setEditingProduct(p => ({ ...p, stock_quantity: parseInt(e.target.value) || 0 }))}
                    placeholder="e.g., 50"
                  />
                  <p className="text-xs text-muted-foreground">Available inventory</p>
                </div>
              </div>

              {/* Quick Discount Calculator */}
              <div className="p-4 border rounded-lg bg-muted/30">
                <Label className="mb-2 block">Quick Discount Calculator</Label>
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-sm text-muted-foreground">Apply discount:</span>
                  {[10, 15, 20, 25, 30, 40, 50].map((pct) => (
                    <Button
                      key={pct}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const currentPrice = editingProduct?.price || 0;
                        if (currentPrice > 0) {
                          const originalPrice = Math.round(currentPrice / (1 - pct / 100));
                          setEditingProduct(p => ({ ...p, compare_at_price: originalPrice, is_on_sale: true }));
                          toast.success(`${pct}% discount applied`);
                        } else {
                          toast.error('Set sale price first');
                        }
                      }}
                    >
                      {pct}%
                    </Button>
                  ))}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditingProduct(p => ({ ...p, compare_at_price: undefined, is_on_sale: false }))}
                  >
                    Clear
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="variants" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Product Type</Label>
                <Select
                  value={editingProduct?.product_type || 'simple'}
                  onValueChange={(v) => setEditingProduct(p => ({ ...p, product_type: v as 'simple' | 'variable' | 'digital', is_digital: v === 'digital' }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="simple">Simple Product</SelectItem>
                    <SelectItem value="variable">Variable Product</SelectItem>
                    <SelectItem value="digital">Digital Product</SelectItem>
                  </SelectContent>
                </Select>
                {editingProduct?.product_type === 'digital' && (
                  <p className="text-sm text-muted-foreground">
                    Digital products allow customers to download files after purchase.
                  </p>
                )}
              </div>

              {editingProduct?.product_type === 'variable' && (
                <>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Option 1 Name</Label>
                      <Input
                        value={editingProduct?.option1_name || ''}
                        onChange={(e) => setEditingProduct(p => ({ ...p, option1_name: e.target.value }))}
                        placeholder="e.g., Size"
                      />
                      <div className="flex gap-2">
                        <Input
                          value={newOptionValue.opt1}
                          onChange={(e) => setNewOptionValue(p => ({ ...p, opt1: e.target.value }))}
                          placeholder="Add value"
                        />
                        <Button size="sm" onClick={() => addOptionValue(1)}>+</Button>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {(editingProduct?.option1_values || []).map(v => (
                          <Badge key={v} variant="secondary" className="cursor-pointer" onClick={() => removeOptionValue(1, v)}>
                            {v} ×
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Option 2 Name</Label>
                      <Input
                        value={editingProduct?.option2_name || ''}
                        onChange={(e) => setEditingProduct(p => ({ ...p, option2_name: e.target.value }))}
                        placeholder="e.g., Color"
                      />
                      <div className="flex gap-2">
                        <Input
                          value={newOptionValue.opt2}
                          onChange={(e) => setNewOptionValue(p => ({ ...p, opt2: e.target.value }))}
                          placeholder="Add value"
                        />
                        <Button size="sm" onClick={() => addOptionValue(2)}>+</Button>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {(editingProduct?.option2_values || []).map(v => (
                          <Badge key={v} variant="secondary" className="cursor-pointer" onClick={() => removeOptionValue(2, v)}>
                            {v} ×
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Option 3 Name</Label>
                      <Input
                        value={editingProduct?.option3_name || ''}
                        onChange={(e) => setEditingProduct(p => ({ ...p, option3_name: e.target.value }))}
                        placeholder="e.g., Material"
                      />
                      <div className="flex gap-2">
                        <Input
                          value={newOptionValue.opt3}
                          onChange={(e) => setNewOptionValue(p => ({ ...p, opt3: e.target.value }))}
                          placeholder="Add value"
                        />
                        <Button size="sm" onClick={() => addOptionValue(3)}>+</Button>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {(editingProduct?.option3_values || []).map(v => (
                          <Badge key={v} variant="secondary" className="cursor-pointer" onClick={() => removeOptionValue(3, v)}>
                            {v} ×
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>

                  <Button onClick={generateVariants} variant="outline">
                    Generate Variants
                  </Button>

                  {(editingProduct?.variants || []).length > 0 && (
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {editingProduct?.variants?.map((v, i) => (
                        <div key={i} className="flex items-center gap-2 p-2 border rounded">
                          <span className="text-sm min-w-20">
                            {[v.option1_value, v.option2_value, v.option3_value].filter(Boolean).join(' / ')}
                          </span>
                          <Input
                            type="number"
                            value={v.price}
                            onChange={(e) => updateVariant(i, 'price', parseFloat(e.target.value) || 0)}
                            className="w-24"
                            placeholder="Price"
                          />
                          <Input
                            type="number"
                            value={v.stock_quantity}
                            onChange={(e) => updateVariant(i, 'stock_quantity', parseInt(e.target.value) || 0)}
                            className="w-20"
                            placeholder="Stock"
                          />
                          <Button size="icon" variant="ghost" className="text-destructive" onClick={() => removeVariant(i)}>
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </TabsContent>

            {/* Digital Products Tab */}
            <TabsContent value="digital" className="space-y-4 mt-4">
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <div className="flex items-center gap-2 text-blue-700 dark:text-blue-400 mb-2">
                  <FileDown className="w-5 h-5" />
                  <span className="font-medium">Digital Product Settings</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Upload downloadable files that customers can access after purchase.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  checked={editingProduct?.is_digital || editingProduct?.product_type === 'digital'}
                  onCheckedChange={(v) => setEditingProduct(p => ({ 
                    ...p, 
                    is_digital: v,
                    product_type: v ? 'digital' : 'simple'
                  }))}
                />
                <Label>This is a digital product</Label>
              </div>

              {(editingProduct?.is_digital || editingProduct?.product_type === 'digital') && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Download Limit (per purchase)</Label>
                      <Input
                        type="number"
                        value={editingProduct?.download_limit || ''}
                        onChange={(e) => setEditingProduct(p => ({ ...p, download_limit: parseInt(e.target.value) || undefined }))}
                        placeholder="Unlimited"
                      />
                      <p className="text-xs text-muted-foreground">Leave empty for unlimited downloads</p>
                    </div>
                    <div className="space-y-2">
                      <Label>Download Expiry (days)</Label>
                      <Input
                        type="number"
                        value={editingProduct?.download_expiry_days || ''}
                        onChange={(e) => setEditingProduct(p => ({ ...p, download_expiry_days: parseInt(e.target.value) || undefined }))}
                        placeholder="Never expires"
                      />
                      <p className="text-xs text-muted-foreground">Leave empty for no expiry</p>
                    </div>
                  </div>

                  {/* Digital Files List */}
                  <div className="space-y-3">
                    <Label>Downloadable Files</Label>
                    
                    {(editingProduct?.digital_files || []).length > 0 ? (
                      <div className="space-y-2">
                        {editingProduct?.digital_files?.map((file, index) => (
                          <div key={index} className="flex items-center gap-3 p-3 border rounded-lg bg-muted/30">
                            <Download className="w-5 h-5 text-blue-500" />
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">{file.name}</p>
                              <p className="text-xs text-muted-foreground truncate">{file.url}</p>
                              {file.size && (
                                <p className="text-xs text-muted-foreground">
                                  {(file.size / 1024 / 1024).toFixed(2)} MB
                                </p>
                              )}
                            </div>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="text-destructive"
                              onClick={() => {
                                const files = [...(editingProduct?.digital_files || [])];
                                files.splice(index, 1);
                                setEditingProduct(p => ({ ...p, digital_files: files }));
                              }}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-6 border-2 border-dashed rounded-lg text-center text-muted-foreground">
                        <FileDown className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No files added yet</p>
                      </div>
                    )}

                    {/* Add File via URL */}
                    <div className="space-y-2">
                      <Label className="text-sm">Add File from URL</Label>
                      <div className="flex gap-2">
                        <Input
                          id="digital-file-url"
                          placeholder="https://example.com/file.pdf"
                          className="flex-1"
                        />
                        <Input
                          id="digital-file-name"
                          placeholder="File name"
                          className="w-40"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            const urlInput = document.getElementById('digital-file-url') as HTMLInputElement;
                            const nameInput = document.getElementById('digital-file-name') as HTMLInputElement;
                            const url = urlInput?.value?.trim();
                            const name = nameInput?.value?.trim() || url?.split('/').pop() || 'file';
                            
                            if (url) {
                              const files = [...(editingProduct?.digital_files || [])];
                              files.push({ name, url });
                              setEditingProduct(p => ({ ...p, digital_files: files }));
                              urlInput.value = '';
                              nameInput.value = '';
                              toast.success('File added');
                            } else {
                              toast.error('Please enter a file URL');
                            }
                          }}
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Add files from Media Library or external URLs. Go to Media Library to upload new files.
                      </p>
                    </div>
                  </div>
                </>
              )}
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Save Product
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
};