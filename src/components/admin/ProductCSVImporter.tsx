import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Upload, FileSpreadsheet, Download, AlertCircle, CheckCircle2, Loader2, ShoppingBag, Store } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

type ImportSource = 'standard' | 'woocommerce' | 'shopify';

interface CSVProduct {
  name: string;
  name_ar?: string;
  slug?: string;
  description?: string;
  description_ar?: string;
  category: string;
  subcategory?: string;
  price: string;
  compare_at_price?: string;
  sku?: string;
  stock_quantity?: string;
  featured_image?: string;
  images?: string;
  tags?: string;
  is_featured?: string;
  is_on_sale?: string;
  is_new?: string;
  discount_percentage?: string;
  weight?: string;
  dimensions?: string;
}

interface ImportResult {
  total: number;
  success: number;
  failed: number;
  errors: string[];
}

interface ProductCSVImporterProps {
  onImportComplete?: () => void;
}

export const ProductCSVImporter = ({ onImportComplete }: ProductCSVImporterProps) => {
  const [importing, setImporting] = useState(false);
  const [csvData, setCsvData] = useState<CSVProduct[]>([]);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [progress, setProgress] = useState(0);
  const [detectedSource, setDetectedSource] = useState<ImportSource>('standard');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const generateSlug = (name: string) => {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  };

  // Detect import source from CSV headers
  const detectSource = (headers: string[]): ImportSource => {
    const headerStr = headers.join(',').toLowerCase();
    
    // Shopify specific headers - check for actual Shopify export format
    if (headerStr.includes('handle') && (headerStr.includes('variant sku') || headerStr.includes('variant_sku') ||
        headerStr.includes('image src') || headerStr.includes('image_src') || 
        headerStr.includes('variant price') || headerStr.includes('variant_price') ||
        headerStr.includes('variant grams') || headerStr.includes('variant_grams'))) {
      return 'shopify';
    }
    
    // WooCommerce specific headers - check for actual WooCommerce export format
    if ((headerStr.includes('regular price') || headerStr.includes('regular_price') ||
        headerStr.includes('sale price') || headerStr.includes('sale_price')) &&
        (headerStr.includes('type') || headerStr.includes('sku'))) {
      return 'woocommerce';
    }
    
    return 'standard';
  };

  // Parse Shopify CSV format - Updated for actual Shopify export format
  const parseShopifyCSV = (lines: string[], headers: string[]): CSVProduct[] => {
    const products: CSVProduct[] = [];
    const productMap = new Map<string, CSVProduct>();

    // Normalize headers
    const normalizedHeaders = headers.map(h => h.toLowerCase().replace(/\s+/g, '_').replace(/[()]/g, ''));

    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i]);
      const data: Record<string, string> = {};
      
      normalizedHeaders.forEach((header, index) => {
        data[header] = values[index]?.trim() || '';
      });

      const handle = data['handle'] || '';
      const title = data['title'] || '';
      
      // Skip rows without handle (variant continuation rows with only images)
      if (!handle) continue;
      
      // Shopify exports multiple rows per product (variants)
      if (!productMap.has(handle)) {
        // Extract gallery images from dedicated column if exists
        const galleryImages = data['gallery_image_urls'] || '';
        
        productMap.set(handle, {
          name: title,
          slug: handle,
          description: data['body_html'] || data['body'] || '',
          category: data['type'] || data['product_category'] || 'general',
          subcategory: data['vendor'] || '',
          price: data['variant_price'] || '0',
          compare_at_price: data['variant_compare_at_price'] || '',
          sku: data['variant_sku'] || '',
          stock_quantity: data['variant_inventory_qty'] || '10',
          featured_image: data['image_src'] || '',
          images: galleryImages,
          tags: data['tags'] || '',
          is_featured: (data['published'] || '').toLowerCase() === 'true' ? 'true' : 'false',
          is_on_sale: (data['variant_compare_at_price'] && parseFloat(data['variant_compare_at_price']) > parseFloat(data['variant_price'] || '0')) ? 'true' : 'false',
          is_new: 'false',
          weight: data['variant_grams'] || '',
        });
      } else if (productMap.has(handle)) {
        // Add additional images from variants
        const existing = productMap.get(handle)!;
        const newImage = data['image_src'];
        if (newImage && existing.featured_image !== newImage && !existing.images?.includes(newImage)) {
          existing.images = existing.images ? `${existing.images}|${newImage}` : newImage;
        }
      }
    }

    productMap.forEach(product => products.push(product));
    return products;
  };

  // Parse WooCommerce CSV format - Updated for actual WooCommerce export format
  const parseWooCommerceCSV = (lines: string[], headers: string[]): CSVProduct[] => {
    const products: CSVProduct[] = [];

    // Normalize headers - WooCommerce uses spaces and special characters
    const normalizedHeaders = headers.map(h => h.toLowerCase().replace(/\s+/g, '_').replace(/[?()]/g, ''));

    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i]);
      const data: Record<string, string> = {};
      
      normalizedHeaders.forEach((header, index) => {
        data[header] = values[index]?.trim() || '';
      });

      // Skip variation products (type === 'variation') - only import main products
      const productType = data['type'] || '';
      if (productType === 'variation') continue;
      
      // Skip variable parent products - import simple products or variable parents with data
      if (productType === 'variable') {
        // For variable products, we still need to capture main product info
        const name = data['name'] || '';
        if (!name) continue;
        
        // Extract first image from comma-separated list
        const imagesList = data['images'] || '';
        const imagesArray = imagesList.split(',').map(img => img.trim()).filter(Boolean);
        const featuredImage = imagesArray[0] || '';
        const galleryImages = imagesArray.slice(1).join('|');
        
        // For variable products, try to find a sensible price
        const regularPrice = data['regular_price'] || '0';
        const salePrice = data['sale_price'] || '';
        
        products.push({
          name,
          slug: data['sku'] ? data['sku'].replace(/-parent$/, '') : generateSlug(name),
          description: data['description'] || data['short_description'] || '',
          category: data['categories'] || 'general',
          subcategory: '',
          price: salePrice || regularPrice || '0',
          compare_at_price: salePrice && regularPrice ? regularPrice : '',
          sku: data['sku'] || '',
          stock_quantity: data['stock'] || '10',
          featured_image: featuredImage,
          images: galleryImages || data['gallery_image_urls'] || '',
          tags: data['tags'] || '',
          is_featured: data['is_featured'] === '1' ? 'true' : 'false',
          is_on_sale: salePrice ? 'true' : 'false',
          is_new: 'false',
          weight: data['weight_kg'] || '',
        });
        continue;
      }

      const name = data['name'] || '';
      if (!name) continue;

      const regularPrice = data['regular_price'] || '0';
      const salePrice = data['sale_price'] || '';
      
      // Extract images
      const imagesList = data['images'] || '';
      const imagesArray = imagesList.split(',').map(img => img.trim()).filter(Boolean);
      const featuredImage = imagesArray[0] || '';
      const galleryImages = imagesArray.slice(1).join('|');

      products.push({
        name,
        slug: data['sku'] || generateSlug(name),
        description: data['description'] || data['short_description'] || '',
        category: data['categories'] || 'general',
        subcategory: '',
        price: salePrice || regularPrice,
        compare_at_price: salePrice && regularPrice ? regularPrice : '',
        sku: data['sku'] || '',
        stock_quantity: data['stock'] || '10',
        featured_image: featuredImage,
        images: galleryImages || data['gallery_image_urls'] || '',
        tags: data['tags'] || '',
        is_featured: data['is_featured'] === '1' ? 'true' : 'false',
        is_on_sale: salePrice ? 'true' : 'false',
        is_new: 'false',
        weight: data['weight_kg'] || '',
      });
    }

    return products;
  };

  // Parse standard CSV format
  const parseStandardCSV = (lines: string[], headers: string[]): CSVProduct[] => {
    const products: CSVProduct[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i]);
      const product: CSVProduct = { name: '', category: 'general', price: '0' };

      headers.forEach((header, index) => {
        const value = values[index]?.trim() || '';
        const h = header.toLowerCase().replace(/\s+/g, '_');
        
        switch (h) {
          case 'name':
          case 'title':
          case 'product_name':
            product.name = value;
            break;
          case 'name_ar':
          case 'arabic_name':
            product.name_ar = value;
            break;
          case 'slug':
          case 'handle':
            product.slug = value;
            break;
          case 'description':
          case 'body':
          case 'body_html':
          case 'body_(html)':
            product.description = value;
            break;
          case 'description_ar':
          case 'arabic_description':
            product.description_ar = value;
            break;
          case 'category':
          case 'product_type':
          case 'type':
          case 'categories':
            product.category = value || 'general';
            break;
          case 'subcategory':
          case 'vendor':
            product.subcategory = value;
            break;
          case 'price':
          case 'variant_price':
          case 'regular_price':
            product.price = value || '0';
            break;
          case 'compare_at_price':
          case 'compare_price':
          case 'original_price':
          case 'variant_compare_at_price':
            product.compare_at_price = value;
            break;
          case 'sku':
          case 'variant_sku':
          case '_sku':
            product.sku = value;
            break;
          case 'stock':
          case 'stock_quantity':
          case 'inventory_quantity':
          case 'variant_inventory_qty':
          case '_stock':
            product.stock_quantity = value;
            break;
          case 'featured_image':
          case 'image_src':
          case 'image':
          case 'image_url':
          case 'images':
            if (!product.featured_image) product.featured_image = value;
            break;
          case 'gallery':
          case 'additional_images':
          case 'product_gallery':
            product.images = value;
            break;
          case 'tags':
            product.tags = value;
            break;
          case 'is_featured':
          case 'featured':
            product.is_featured = value;
            break;
          case 'is_on_sale':
          case 'on_sale':
          case 'sale':
            product.is_on_sale = value;
            break;
          case 'is_new':
          case 'new':
            product.is_new = value;
            break;
          case 'discount_percentage':
          case 'discount':
          case 'discount_percent':
            product.discount_percentage = value;
            break;
        }
      });

      if (product.name) {
        products.push(product);
      }
    }

    return products;
  };

  const parseCSV = (text: string): CSVProduct[] => {
    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length < 2) return [];

    const headers = parseCSVLine(lines[0]).map(h => h.trim());
    const source = detectSource(headers);
    setDetectedSource(source);

    switch (source) {
      case 'shopify':
        return parseShopifyCSV(lines, headers);
      case 'woocommerce':
        return parseWooCommerceCSV(lines, headers);
      default:
        return parseStandardCSV(lines, headers);
    }
  };

  const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.replace(/^"|"$/g, ''));
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.replace(/^"|"$/g, ''));

    return result;
  };

  const toBool = (value?: string): boolean => {
    if (!value) return false;
    return ['true', 'yes', '1', 'on'].includes(value.toLowerCase());
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const products = parseCSV(text);
      setCsvData(products);
      setImportResult(null);
      setProgress(0);
      
      if (products.length === 0) {
        toast.error('No valid products found in CSV');
      } else {
        toast.success(`Found ${products.length} products (${detectedSource.toUpperCase()} format detected)`);
      }
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    if (csvData.length === 0) {
      toast.error('No products to import');
      return;
    }

    setImporting(true);
    const result: ImportResult = { total: csvData.length, success: 0, failed: 0, errors: [] };

    for (let i = 0; i < csvData.length; i++) {
      const product = csvData[i];
      setProgress(Math.round(((i + 1) / csvData.length) * 100));

      try {
        const price = parseFloat(product.price) || 0;
        const comparePrice = product.compare_at_price ? parseFloat(product.compare_at_price) : null;
        
        let finalComparePrice = comparePrice;
        if (product.discount_percentage && !comparePrice) {
          const discount = parseFloat(product.discount_percentage);
          if (discount > 0 && discount < 100) {
            finalComparePrice = price / (1 - discount / 100);
          }
        }

        // Handle images (pipe-separated or comma-separated)
        const imagesArray = product.images 
          ? product.images.split(/[|,]/).map(img => img.trim()).filter(Boolean)
          : [];

        // Handle tags (comma-separated)
        const tagsArray = product.tags 
          ? product.tags.split(',').map(tag => tag.trim()).filter(Boolean)
          : [];

        // Extract first category if multiple are provided
        const categoryParts = product.category.split(/[,>]/).map(c => c.trim());
        const mainCategory = categoryParts[0] || 'general';
        const subCategory = categoryParts[1] || product.subcategory || null;

        const productData = {
          name: product.name,
          name_ar: product.name_ar || null,
          slug: product.slug || generateSlug(product.name),
          description: product.description || null,
          description_ar: product.description_ar || null,
          category: mainCategory,
          subcategory: subCategory,
          price,
          compare_at_price: finalComparePrice,
          currency: 'AED',
          sku: product.sku || null,
          stock_quantity: parseInt(product.stock_quantity || '10'),
          featured_image: product.featured_image || null,
          images: imagesArray,
          tags: tagsArray,
          is_featured: Boolean(toBool(product.is_featured)),
          is_on_sale: Boolean(toBool(product.is_on_sale) || (finalComparePrice && finalComparePrice > price)),
          is_new: Boolean(toBool(product.is_new)),
          is_active: true,
          product_type: 'simple' as const,
        };

        const { error } = await supabase.from('products').insert(productData);
        
        if (error) throw error;
        result.success++;
      } catch (error: any) {
        result.failed++;
        result.errors.push(`${product.name}: ${error.message || 'Unknown error'}`);
      }
    }

    setImportResult(result);
    setImporting(false);
    
    if (result.success > 0) {
      toast.success(`Imported ${result.success} products successfully`);
      onImportComplete?.();
    }
    if (result.failed > 0) {
      toast.error(`Failed to import ${result.failed} products`);
    }
  };

  const downloadTemplate = (type: ImportSource) => {
    let template = '';
    let filename = '';

    switch (type) {
      case 'shopify':
        template = `Handle,Title,Body (HTML),Vendor,Type,Tags,Published,Option1 Name,Option1 Value,Variant SKU,Variant Grams,Variant Inventory Qty,Variant Price,Variant Compare At Price,Image Src
"example-plant","Example Plant","<p>Beautiful indoor plant</p>","Green Grass","Plants","indoor,green","TRUE","Size","Medium","PLANT-001","500","50","29.99","39.99","https://example.com/image.jpg"
"ceramic-pot","Ceramic Pot","<p>Elegant ceramic pot</p>","Green Grass","Pots","ceramic,home","TRUE","Size","Large","POT-001","1000","100","19.99","","https://example.com/pot.jpg"`;
        filename = 'shopify_product_template.csv';
        break;

      case 'woocommerce':
        template = `ID,Type,SKU,Name,Published,Featured,Short description,Description,Regular price,Sale price,Categories,Tags,Images,Stock
"","simple","PLANT-001","Example Plant","1","1","Beautiful indoor plant","<p>Beautiful indoor plant for your home</p>","39.99","29.99","Plants > Mixed Plant","indoor,green","https://example.com/image.jpg","50"
"","simple","POT-001","Ceramic Pot","1","0","Elegant ceramic pot","<p>Elegant ceramic pot for your plants</p>","19.99","","Pots > Ceramic Pot","ceramic,home","https://example.com/pot.jpg","100"`;
        filename = 'woocommerce_product_template.csv';
        break;

      default:
        template = `name,name_ar,category,subcategory,price,compare_at_price,discount_percentage,sku,stock_quantity,featured_image,images,tags,is_featured,is_on_sale,is_new,description,description_ar
"Example Plant","نبتة مثال","Plants","Mixed Plant",29.99,39.99,,PLANT-001,50,https://example.com/image.jpg,https://example.com/img2.jpg|https://example.com/img3.jpg,"indoor,green",true,true,false,"Beautiful indoor plant","نبتة داخلية جميلة"
"Ceramic Pot","وعاء سيراميك","Pots","Ceramic Pot",19.99,,10,POT-001,100,https://example.com/pot.jpg,,"ceramic,home",false,true,true,"Elegant ceramic pot","وعاء سيراميك أنيق"`;
        filename = 'product_import_template.csv';
    }

    const blob = new Blob([template], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getSourceBadge = () => {
    switch (detectedSource) {
      case 'shopify':
        return <Badge className="bg-green-100 text-green-800"><ShoppingBag className="w-3 h-3 mr-1" /> Shopify</Badge>;
      case 'woocommerce':
        return <Badge className="bg-purple-100 text-purple-800"><Store className="w-3 h-3 mr-1" /> WooCommerce</Badge>;
      default:
        return <Badge variant="secondary">Standard CSV</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Product Import</h3>
          <p className="text-sm text-muted-foreground">
            Import products from Shopify, WooCommerce, or CSV
          </p>
        </div>
      </div>

      {/* Template Downloads */}
      <Tabs defaultValue="standard" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="standard">Standard CSV</TabsTrigger>
          <TabsTrigger value="shopify">Shopify</TabsTrigger>
          <TabsTrigger value="woocommerce">WooCommerce</TabsTrigger>
        </TabsList>
        
        <TabsContent value="standard" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Standard CSV Format</CardTitle>
              <CardDescription>Basic CSV with all product fields</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" size="sm" onClick={() => downloadTemplate('standard')}>
                <Download className="w-4 h-4 mr-2" />
                Download Template
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="shopify" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <ShoppingBag className="w-4 h-4" />
                Shopify Export Format
              </CardTitle>
              <CardDescription>
                Export from Shopify Admin: Products → Export → CSV for Excel
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" size="sm" onClick={() => downloadTemplate('shopify')}>
                <Download className="w-4 h-4 mr-2" />
                Download Shopify Template
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="woocommerce" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Store className="w-4 h-4" />
                WooCommerce Export Format
              </CardTitle>
              <CardDescription>
                Export from WordPress: WooCommerce → Products → Export
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" size="sm" onClick={() => downloadTemplate('woocommerce')}>
                <Download className="w-4 h-4 mr-2" />
                Download WooCommerce Template
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Upload Area */}
      <Card>
        <CardContent className="pt-6">
          <div 
            className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            <FileSpreadsheet className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="font-medium">Click to upload CSV file</p>
            <p className="text-sm text-muted-foreground mt-1">
              Auto-detects Shopify, WooCommerce, or Standard format
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>
        </CardContent>
      </Card>

      {/* Preview */}
      {csvData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
              {csvData.length} Products Found
              <span className="ml-2">{getSourceBadge()}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-h-64 overflow-auto mb-4">
              <table className="w-full text-sm">
                <thead className="bg-muted sticky top-0">
                  <tr>
                    <th className="text-left p-2">Name</th>
                    <th className="text-left p-2">Category</th>
                    <th className="text-left p-2">Price</th>
                    <th className="text-left p-2">Discount</th>
                    <th className="text-left p-2">SKU</th>
                  </tr>
                </thead>
                <tbody>
                  {csvData.slice(0, 10).map((product, index) => {
                    const discount = product.compare_at_price && parseFloat(product.price) > 0
                      ? Math.round((1 - parseFloat(product.price) / parseFloat(product.compare_at_price)) * 100)
                      : product.discount_percentage 
                        ? parseFloat(product.discount_percentage)
                        : 0;
                    
                    return (
                      <tr key={index} className="border-b">
                        <td className="p-2">{product.name}</td>
                        <td className="p-2">{product.category}</td>
                        <td className="p-2">AED {product.price}</td>
                        <td className="p-2">
                          {discount > 0 ? (
                            <span className="text-red-600 font-medium">{discount}% OFF</span>
                          ) : '-'}
                        </td>
                        <td className="p-2">{product.sku || '-'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {csvData.length > 10 && (
                <p className="text-sm text-muted-foreground text-center py-2">
                  +{csvData.length - 10} more products
                </p>
              )}
            </div>

            {importing && (
              <div className="mb-4">
                <Progress value={progress} className="h-2" />
                <p className="text-sm text-muted-foreground text-center mt-2">
                  Importing... {progress}%
                </p>
              </div>
            )}
            
            <div className="flex gap-2">
              <Button onClick={handleImport} disabled={importing}>
                {importing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Import to Database
                  </>
                )}
              </Button>
              <Button variant="outline" onClick={() => { setCsvData([]); setImportResult(null); }}>
                Clear
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Import Result */}
      {importResult && (
        <Alert variant={importResult.failed > 0 ? "destructive" : "default"}>
          {importResult.failed > 0 ? (
            <AlertCircle className="h-4 w-4" />
          ) : (
            <CheckCircle2 className="h-4 w-4" />
          )}
          <AlertTitle>Import Complete</AlertTitle>
          <AlertDescription>
            <p>{importResult.success} products imported successfully, {importResult.failed} failed.</p>
            {importResult.errors.length > 0 && (
              <ul className="mt-2 text-sm list-disc list-inside max-h-32 overflow-auto">
                {importResult.errors.map((error, i) => (
                  <li key={i}>{error}</li>
                ))}
              </ul>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Info */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Supported Formats</AlertTitle>
        <AlertDescription className="space-y-2">
          <ul className="list-disc list-inside text-sm space-y-1">
            <li><strong>Shopify:</strong> Export from Shopify Admin → Products → Export</li>
            <li><strong>WooCommerce:</strong> Export from WooCommerce → Products → Export</li>
            <li><strong>Standard:</strong> Any CSV with name, price, category columns</li>
            <li>Format is auto-detected from CSV headers</li>
          </ul>
        </AlertDescription>
      </Alert>
    </div>
  );
};
