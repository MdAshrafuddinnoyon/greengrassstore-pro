import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Sparkles, ImagePlus, Download, Copy, ShoppingBag, FileText, Wand2 } from "lucide-react";

export const AIImageGenerator = () => {
  const [loading, setLoading] = useState(false);
  const [productPrompt, setProductPrompt] = useState("");
  const [blogPrompt, setBlogPrompt] = useState("");
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [imageDescription, setImageDescription] = useState("");
  const [activeTab, setActiveTab] = useState("product");

  const generateImage = async (prompt: string, type: 'product' | 'blog') => {
    if (!prompt.trim()) {
      toast.error('Please enter a prompt');
      return;
    }

    setLoading(true);
    setGeneratedImage(null);

    try {
      const { data, error } = await supabase.functions.invoke('generate-image', {
        body: { prompt, type }
      });

      if (error) throw error;

      if (data.error) {
        if (data.error.includes('Rate limit')) {
          toast.error('Rate limit exceeded. Please try again in a moment.');
        } else if (data.error.includes('Payment')) {
          toast.error('Credits required. Please add credits to your Lovable workspace.');
        } else {
          throw new Error(data.error);
        }
        return;
      }

      setGeneratedImage(data.imageUrl);
      setImageDescription(data.description || '');
      toast.success('Image generated successfully!');
    } catch (error) {
      console.error('Error generating image:', error);
      toast.error('Failed to generate image. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const copyImageUrl = () => {
    if (generatedImage) {
      navigator.clipboard.writeText(generatedImage);
      toast.success('Image URL copied to clipboard');
    }
  };

  const downloadImage = () => {
    if (!generatedImage) return;
    
    const link = document.createElement('a');
    link.href = generatedImage;
    link.download = `ai-generated-${Date.now()}.png`;
    link.click();
    toast.success('Image download started');
  };

  const productSuggestions = [
    "Indoor plant in a modern ceramic pot with soft lighting",
    "Artificial flowers arrangement in a glass vase on white background",
    "Minimalist fiber pot with succulents, clean studio shot",
    "Luxury home decor vase with dried pampas grass",
    "Green monstera plant in terracotta pot, lifestyle shot"
  ];

  const blogSuggestions = [
    "Modern living room with indoor plants, cozy atmosphere",
    "Urban jungle bedroom with various houseplants",
    "Plant care tips infographic style illustration",
    "Sustainable home gardening concept art",
    "Mediterranean terrace with potted plants and flowers"
  ];

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-violet-50 to-purple-50 border-b">
          <CardTitle className="flex items-center gap-2">
            <div className="p-2 bg-gradient-to-br from-violet-500 to-purple-600 rounded-lg">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            AI Image Generator
          </CardTitle>
          <CardDescription>
            Generate professional images for products and blog posts using AI
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid grid-cols-2 w-full max-w-md">
              <TabsTrigger value="product" className="gap-2">
                <ShoppingBag className="w-4 h-4" />
                Product Image
              </TabsTrigger>
              <TabsTrigger value="blog" className="gap-2">
                <FileText className="w-4 h-4" />
                Blog Image
              </TabsTrigger>
            </TabsList>

            {/* Product Image Tab */}
            <TabsContent value="product" className="space-y-4">
              <div className="space-y-2">
                <Label>Describe the product image you want to generate</Label>
                <Textarea
                  value={productPrompt}
                  onChange={(e) => setProductPrompt(e.target.value)}
                  placeholder="e.g., A beautiful fiddle leaf fig plant in a modern white ceramic pot, studio lighting, white background..."
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">Quick suggestions:</Label>
                <div className="flex flex-wrap gap-2">
                  {productSuggestions.map((suggestion, i) => (
                    <Button
                      key={i}
                      variant="outline"
                      size="sm"
                      onClick={() => setProductPrompt(suggestion)}
                      className="text-xs"
                    >
                      {suggestion.slice(0, 40)}...
                    </Button>
                  ))}
                </div>
              </div>

              <Button
                onClick={() => generateImage(productPrompt, 'product')}
                disabled={loading || !productPrompt.trim()}
                className="w-full bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Wand2 className="w-4 h-4 mr-2" />
                    Generate Product Image
                  </>
                )}
              </Button>
            </TabsContent>

            {/* Blog Image Tab */}
            <TabsContent value="blog" className="space-y-4">
              <div className="space-y-2">
                <Label>Describe the blog featured image you want to generate</Label>
                <Textarea
                  value={blogPrompt}
                  onChange={(e) => setBlogPrompt(e.target.value)}
                  placeholder="e.g., A bright, airy living room filled with lush green plants, natural light streaming through windows..."
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">Quick suggestions:</Label>
                <div className="flex flex-wrap gap-2">
                  {blogSuggestions.map((suggestion, i) => (
                    <Button
                      key={i}
                      variant="outline"
                      size="sm"
                      onClick={() => setBlogPrompt(suggestion)}
                      className="text-xs"
                    >
                      {suggestion.slice(0, 40)}...
                    </Button>
                  ))}
                </div>
              </div>

              <Button
                onClick={() => generateImage(blogPrompt, 'blog')}
                disabled={loading || !blogPrompt.trim()}
                className="w-full bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Wand2 className="w-4 h-4 mr-2" />
                    Generate Blog Image
                  </>
                )}
              </Button>
            </TabsContent>
          </Tabs>

          {/* Generated Image Display */}
          {generatedImage && (
            <div className="mt-6 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium flex items-center gap-2">
                  <ImagePlus className="w-4 h-4 text-primary" />
                  Generated Image
                </h4>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={copyImageUrl}>
                    <Copy className="w-4 h-4 mr-1" />
                    Copy URL
                  </Button>
                  <Button variant="outline" size="sm" onClick={downloadImage}>
                    <Download className="w-4 h-4 mr-1" />
                    Download
                  </Button>
                </div>
              </div>

              <div className="border rounded-lg overflow-hidden bg-muted/30">
                <img 
                  src={generatedImage} 
                  alt="AI Generated" 
                  className="w-full max-h-[500px] object-contain"
                />
              </div>

              {imageDescription && (
                <div className="p-4 bg-muted/30 rounded-lg">
                  <p className="text-sm text-muted-foreground">{imageDescription}</p>
                </div>
              )}

              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Tip:</strong> Copy the image URL above and paste it in the product/blog image field, 
                  or upload to Media Library for permanent storage.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};