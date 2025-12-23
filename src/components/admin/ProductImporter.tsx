import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Upload, FileSpreadsheet, Download, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface CSVProduct {
  title: string;
  body?: string;
  vendor?: string;
  product_type?: string;
  tags?: string;
  price?: string;
  sku?: string;
  weight?: string;
  option1_name?: string;
  option1_value?: string;
  option2_name?: string;
  option2_value?: string;
  image_url?: string;
}

interface ImportResult {
  total: number;
  success: number;
  failed: number;
  errors: string[];
}

export const ProductImporter = () => {
  const [importing, setImporting] = useState(false);
  const [csvData, setCsvData] = useState<CSVProduct[]>([]);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const generateSlug = (name: string) => {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  };

  const parseCSV = (text: string): CSVProduct[] => {
    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/\s+/g, '_'));
    const products: CSVProduct[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i]);
      const product: CSVProduct = { title: '' };

      headers.forEach((header, index) => {
        const value = values[index]?.trim() || '';
        switch (header) {
          case 'title':
          case 'handle':
          case 'name':
            product.title = value || product.title;
            break;
          case 'body':
          case 'body_html':
          case 'description':
            product.body = value;
            break;
          case 'vendor':
            product.vendor = value;
            break;
          case 'product_type':
          case 'type':
          case 'category':
            product.product_type = value;
            break;
          case 'tags':
            product.tags = value;
            break;
          case 'price':
          case 'variant_price':
            product.price = value;
            break;
          case 'sku':
          case 'variant_sku':
            product.sku = value;
            break;
          case 'weight':
          case 'variant_weight':
            product.weight = value;
            break;
          case 'option1_name':
            product.option1_name = value;
            break;
          case 'option1_value':
            product.option1_value = value;
            break;
          case 'option2_name':
            product.option2_name = value;
            break;
          case 'option2_value':
            product.option2_value = value;
            break;
          case 'image_src':
          case 'image_url':
          case 'image':
            product.image_url = value;
            break;
        }
      });

      if (product.title) {
        products.push(product);
      }
    }

    return products;
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

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const products = parseCSV(text);
      setCsvData(products);
      setImportResult(null);
      
      if (products.length === 0) {
        toast.error('No valid products found in CSV');
      } else {
        toast.success(`Found ${products.length} products ready to import`);
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

    for (const product of csvData) {
      try {
        const price = parseFloat(product.price || '0') || 0;
        const tagsArray = product.tags 
          ? product.tags.split(',').map(tag => tag.trim()).filter(Boolean)
          : [];

        const productData = {
          name: product.title,
          slug: generateSlug(product.title),
          description: product.body || null,
          category: product.product_type || 'general',
          price,
          currency: 'AED',
          sku: product.sku || null,
          stock_quantity: 10,
          featured_image: product.image_url || null,
          tags: tagsArray,
          is_active: true,
          product_type: 'simple' as const,
        };

        const { error } = await supabase.from('products').insert(productData);
        
        if (error) throw error;
        result.success++;
      } catch (error: any) {
        result.failed++;
        result.errors.push(`${product.title}: ${error.message || 'Unknown error'}`);
      }
    }

    setImportResult(result);
    setImporting(false);
    
    if (result.success > 0) {
      toast.success(`Imported ${result.success} products successfully`);
    }
    if (result.failed > 0) {
      toast.error(`Failed to import ${result.failed} products`);
    }
  };

  const downloadTemplate = () => {
    const template = `Title,Body (HTML),Vendor,Product Type,Tags,Price,SKU,Weight,Option1 Name,Option1 Value,Image Src
"Example Plant","<p>Beautiful indoor plant</p>","Green Grass","Plants","indoor, green",29.99,PLANT-001,0.5,Size,Small,https://example.com/image.jpg
"Ceramic Pot","<p>Elegant ceramic pot</p>","Green Grass","Pots","ceramic, home",19.99,POT-001,1.2,Color,White,https://example.com/pot.jpg`;

    const blob = new Blob([template], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'product_import_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Product Importer</h2>
          <p className="text-sm text-muted-foreground">Import products from CSV file</p>
        </div>
        
        <Button variant="outline" onClick={downloadTemplate}>
          <Download className="w-4 h-4 mr-2" />
          Download Template
        </Button>
      </div>

      {/* Upload Area */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Upload CSV File</CardTitle>
          <CardDescription>
            Upload a CSV file with product data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div 
            className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            <FileSpreadsheet className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="font-medium">Click to upload CSV file</p>
            <p className="text-sm text-muted-foreground mt-1">or drag and drop</p>
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
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-h-64 overflow-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted sticky top-0">
                  <tr>
                    <th className="text-left p-2">Title</th>
                    <th className="text-left p-2">Type</th>
                    <th className="text-left p-2">Price</th>
                    <th className="text-left p-2">SKU</th>
                  </tr>
                </thead>
                <tbody>
                  {csvData.slice(0, 10).map((product, index) => (
                    <tr key={index} className="border-b">
                      <td className="p-2">{product.title}</td>
                      <td className="p-2">{product.product_type || '-'}</td>
                      <td className="p-2">{product.price ? `AED ${product.price}` : '-'}</td>
                      <td className="p-2">{product.sku || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {csvData.length > 10 && (
                <p className="text-sm text-muted-foreground text-center py-2">
                  +{csvData.length - 10} more products
                </p>
              )}
            </div>
            
            <div className="flex gap-2 mt-4">
              <Button onClick={handleImport} disabled={importing}>
                {importing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Import Products
                  </>
                )}
              </Button>
              <Button variant="outline" onClick={() => setCsvData([])}>
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
              <ul className="mt-2 text-sm list-disc list-inside">
                {importResult.errors.slice(0, 5).map((error, i) => (
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
        <AlertTitle>CSV Format</AlertTitle>
        <AlertDescription className="space-y-2">
          <p>Your CSV should include these columns:</p>
          <ul className="list-disc list-inside text-sm space-y-1">
            <li><strong>Title:</strong> Product name (required)</li>
            <li><strong>Price:</strong> Product price</li>
            <li><strong>Product Type:</strong> Category</li>
            <li><strong>Image Src:</strong> Product image URL</li>
            <li><strong>Tags:</strong> Comma-separated tags</li>
          </ul>
        </AlertDescription>
      </Alert>
    </div>
  );
};
