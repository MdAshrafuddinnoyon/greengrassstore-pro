import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { 
  Loader2, 
  ImageIcon, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  RefreshCw, 
  Trash2,
  ExternalLink,
  Search
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ImageCheckResult {
  productId: string;
  productName: string;
  imageUrl: string;
  imageType: 'main' | 'gallery';
  status: 'valid' | 'broken' | 'checking';
  error?: string;
}

export const ImageURLChecker = () => {
  const [checking, setChecking] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<ImageCheckResult[]>([]);
  const [hasChecked, setHasChecked] = useState(false);
  const [deletingUrls, setDeletingUrls] = useState<string[]>([]);
  const [confirmDelete, setConfirmDelete] = useState<ImageCheckResult | null>(null);

  const checkImageUrl = async (url: string): Promise<boolean> => {
    if (!url || url.trim() === '') return false;
    
    try {
      const response = await fetch(url, { method: 'HEAD', mode: 'no-cors' });
      // no-cors mode always returns opaque response, so we just check if it didn't throw
      return true;
    } catch (error) {
      // Try with GET as fallback
      try {
        const img = new Image();
        return new Promise((resolve) => {
          img.onload = () => resolve(true);
          img.onerror = () => resolve(false);
          img.src = url;
          // Timeout after 5 seconds
          setTimeout(() => resolve(false), 5000);
        });
      } catch {
        return false;
      }
    }
  };

  const checkAllImages = async () => {
    setChecking(true);
    setProgress(0);
    setResults([]);
    setHasChecked(true);

    try {
      const { data: products, error } = await supabase
        .from('products')
        .select('id, name, featured_image, images');

      if (error) throw error;

      if (!products || products.length === 0) {
        toast.info('No products found in database');
        setChecking(false);
        return;
      }

      const allImages: ImageCheckResult[] = [];

      // Collect all images to check
      products.forEach(product => {
        // Main image (featured_image)
        if (product.featured_image) {
          allImages.push({
            productId: product.id,
            productName: product.name || 'Unnamed Product',
            imageUrl: product.featured_image,
            imageType: 'main',
            status: 'checking'
          });
        }

        // Gallery images
        if (product.images && Array.isArray(product.images)) {
          product.images.forEach((img: string) => {
            if (img) {
              allImages.push({
                productId: product.id,
                productName: product.name || 'Unnamed Product',
                imageUrl: img,
                imageType: 'gallery',
                status: 'checking'
              });
            }
          });
        }
      });

      setResults(allImages);

      // Check each image
      for (let i = 0; i < allImages.length; i++) {
        const imageResult = allImages[i];
        const isValid = await checkImageUrl(imageResult.imageUrl);
        
        setResults(prev => prev.map((r, idx) => 
          idx === i 
            ? { ...r, status: isValid ? 'valid' : 'broken' }
            : r
        ));

        setProgress(Math.round(((i + 1) / allImages.length) * 100));
      }

      const brokenCount = allImages.filter((_, i) => {
        const result = allImages[i];
        return result.status === 'broken';
      }).length;

      // Re-count after checking
      const finalResults = await new Promise<ImageCheckResult[]>((resolve) => {
        setTimeout(() => {
          setResults(current => {
            resolve(current);
            return current;
          });
        }, 100);
      });

      const finalBrokenCount = finalResults.filter(r => r.status === 'broken').length;

      if (finalBrokenCount > 0) {
        toast.warning(`Found ${finalBrokenCount} broken image(s)`);
      } else {
        toast.success('All images are valid!');
      }

    } catch (error) {
      console.error('Error checking images:', error);
      toast.error('Failed to check images');
    } finally {
      setChecking(false);
    }
  };

  const removeBrokenUrl = async (result: ImageCheckResult) => {
    setDeletingUrls(prev => [...prev, result.imageUrl]);

    try {
      if (result.imageType === 'main') {
        // Remove main image (featured_image)
        const { error } = await supabase
          .from('products')
          .update({ featured_image: null })
          .eq('id', result.productId);

        if (error) throw error;
      } else {
        // Remove from gallery images
        const { data: product, error: fetchError } = await supabase
          .from('products')
          .select('images')
          .eq('id', result.productId)
          .single();

        if (fetchError) throw fetchError;

        const updatedImages = (product.images || []).filter(
          (img: string) => img !== result.imageUrl
        );

        const { error: updateError } = await supabase
          .from('products')
          .update({ images: updatedImages })
          .eq('id', result.productId);

        if (updateError) throw updateError;
      }

      // Remove from results
      setResults(prev => prev.filter(r => 
        !(r.productId === result.productId && r.imageUrl === result.imageUrl)
      ));

      toast.success('Broken image URL removed');
    } catch (error) {
      console.error('Error removing URL:', error);
      toast.error('Failed to remove broken URL');
    } finally {
      setDeletingUrls(prev => prev.filter(url => url !== result.imageUrl));
      setConfirmDelete(null);
    }
  };

  const removeAllBrokenUrls = async () => {
    const brokenResults = results.filter(r => r.status === 'broken');
    
    for (const result of brokenResults) {
      await removeBrokenUrl(result);
    }

    toast.success(`Removed ${brokenResults.length} broken image URLs`);
  };

  const brokenCount = results.filter(r => r.status === 'broken').length;
  const validCount = results.filter(r => r.status === 'valid').length;
  const checkingCount = results.filter(r => r.status === 'checking').length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="w-5 h-5 text-primary" />
          Image URL Checker
        </CardTitle>
        <CardDescription>
          Scan all product images and identify broken or invalid URLs
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3">
          <Button 
            onClick={checkAllImages} 
            disabled={checking}
            className="gap-2"
          >
            {checking ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            {checking ? 'Checking...' : 'Check All Images'}
          </Button>

          {brokenCount > 0 && (
            <Button 
              variant="destructive" 
              onClick={removeAllBrokenUrls}
              disabled={checking}
              className="gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Remove All Broken ({brokenCount})
            </Button>
          )}
        </div>

        {/* Progress */}
        {checking && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Checking images...</span>
              <span>{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}

        {/* Summary Stats */}
        {hasChecked && !checking && results.length > 0 && (
          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800 text-center">
              <CheckCircle2 className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-green-700 dark:text-green-400">{validCount}</div>
              <div className="text-sm text-green-600 dark:text-green-500">Valid Images</div>
            </div>
            <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800 text-center">
              <XCircle className="w-8 h-8 text-red-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-red-700 dark:text-red-400">{brokenCount}</div>
              <div className="text-sm text-red-600 dark:text-red-500">Broken Images</div>
            </div>
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800 text-center">
              <ImageIcon className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-blue-700 dark:text-blue-400">{results.length}</div>
              <div className="text-sm text-blue-600 dark:text-blue-500">Total Images</div>
            </div>
          </div>
        )}

        {/* Results Table - Only show broken images */}
        {hasChecked && brokenCount > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-4 h-4" />
              Broken Images ({brokenCount})
            </h4>
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Image Type</TableHead>
                    <TableHead>URL</TableHead>
                    <TableHead className="w-[100px]">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {results
                    .filter(r => r.status === 'broken')
                    .map((result, idx) => (
                      <TableRow key={`${result.productId}-${idx}`}>
                        <TableCell className="font-medium">
                          {result.productName}
                        </TableCell>
                        <TableCell>
                          <Badge variant={result.imageType === 'main' ? 'default' : 'secondary'}>
                            {result.imageType === 'main' ? 'Main' : 'Gallery'}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-[300px]">
                          <div className="flex items-center gap-2">
                            <span className="truncate text-xs text-muted-foreground">
                              {result.imageUrl}
                            </span>
                            <a 
                              href={result.imageUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-primary hover:text-primary/80"
                            >
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            disabled={deletingUrls.includes(result.imageUrl)}
                            onClick={() => setConfirmDelete(result)}
                          >
                            {deletingUrls.includes(result.imageUrl) ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        {/* No broken images message */}
        {hasChecked && !checking && brokenCount === 0 && results.length > 0 && (
          <div className="p-6 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800 text-center">
            <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto mb-3" />
            <h4 className="font-medium text-green-700 dark:text-green-400 mb-1">
              All Images are Valid!
            </h4>
            <p className="text-sm text-green-600 dark:text-green-500">
              No broken image URLs found in your products
            </p>
          </div>
        )}

        {/* Empty state */}
        {!hasChecked && (
          <div className="p-8 text-center border-2 border-dashed rounded-lg">
            <ImageIcon className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
            <h4 className="font-medium text-muted-foreground mb-1">
              No scan performed yet
            </h4>
            <p className="text-sm text-muted-foreground">
              Click "Check All Images" to scan product images for broken URLs
            </p>
          </div>
        )}

        {/* Confirm Delete Dialog */}
        <AlertDialog open={!!confirmDelete} onOpenChange={() => setConfirmDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Remove Broken Image URL?</AlertDialogTitle>
              <AlertDialogDescription>
                This will remove the broken image URL from "{confirmDelete?.productName}". 
                This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={() => confirmDelete && removeBrokenUrl(confirmDelete)}
                className="bg-red-600 hover:bg-red-700"
              >
                Remove
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
};
