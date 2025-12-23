import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sparkles, Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface AIContentGeneratorProps {
  type: 'product' | 'blog';
  onGenerate: (content: { title?: string; description?: string; content?: string }) => void;
  context?: string;
}

export const AIContentGenerator = ({ type, onGenerate, context }: AIContentGeneratorProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [contentType, setContentType] = useState<'title' | 'description' | 'full'>('description');
  const [apiKeyMissing, setApiKeyMissing] = useState(false);

  const generateContent = async () => {
    if (!prompt.trim()) {
      toast.error("Please enter a prompt");
      return;
    }

    setLoading(true);
    setApiKeyMissing(false);

    try {
      const systemPrompt = type === 'product'
        ? `You are a professional e-commerce copywriter specializing in home and garden products. Write compelling, SEO-friendly content for products.`
        : `You are a professional blog writer specializing in home, garden, and plant care topics. Write engaging, informative content.`;

      let userPrompt = '';
      if (contentType === 'title') {
        userPrompt = `Generate a catchy, SEO-friendly ${type} title for: ${prompt}. ${context ? `Context: ${context}` : ''} Return ONLY the title, no quotes or extra text.`;
      } else if (contentType === 'description') {
        userPrompt = `Write a compelling ${type === 'product' ? 'product description' : 'blog excerpt'} for: ${prompt}. ${context ? `Context: ${context}` : ''} Keep it under 200 words. Return ONLY the description.`;
      } else {
        userPrompt = `Write a complete ${type === 'product' ? 'product description with features and benefits' : 'blog post'} about: ${prompt}. ${context ? `Context: ${context}` : ''} ${type === 'blog' ? 'Include introduction, main points, and conclusion. Use proper headings.' : 'Include key features, benefits, and a call to action.'}`;
      }

      const { data, error } = await supabase.functions.invoke('generate-ai-content', {
        body: { systemPrompt, userPrompt, type: contentType }
      });

      if (error) {
        if (error.message?.includes('API key') || error.message?.includes('not configured')) {
          setApiKeyMissing(true);
          toast.error("AI API key not configured. Please add it in Settings.");
          return;
        }
        throw error;
      }

      if (data?.content) {
        if (contentType === 'title') {
          onGenerate({ title: data.content });
        } else if (contentType === 'description') {
          onGenerate({ description: data.content });
        } else {
          onGenerate({ content: data.content });
        }
        toast.success("Content generated successfully!");
        setOpen(false);
        setPrompt("");
      }
    } catch (error: any) {
      console.error("AI generation error:", error);
      if (error.message?.includes('API key') || error.message?.includes('not configured')) {
        setApiKeyMissing(true);
        toast.error("AI API key not configured. Please add it in Settings.");
      } else {
        toast.error("Failed to generate content. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" type="button">
          <Sparkles className="w-4 h-4 mr-2" />
          AI Generate
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            AI Content Generator
          </DialogTitle>
        </DialogHeader>

        {apiKeyMissing ? (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
              <div>
                <p className="font-medium text-amber-900">API Key Required</p>
                <p className="text-sm text-amber-700 mt-1">
                  To use AI content generation, please add your API key in the 
                  <strong> Admin Dashboard → Settings → API Settings</strong> section.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3"
                  onClick={() => setOpen(false)}
                >
                  Go to Settings
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>What to generate?</Label>
              <Select value={contentType} onValueChange={(v) => setContentType(v as any)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="title">Title Only</SelectItem>
                  <SelectItem value="description">
                    {type === 'product' ? 'Product Description' : 'Blog Excerpt'}
                  </SelectItem>
                  <SelectItem value="full">
                    {type === 'product' ? 'Full Description' : 'Full Blog Post'}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Describe what you want</Label>
              <Textarea
                placeholder={type === 'product' 
                  ? "e.g., A modern ceramic pot for indoor plants, white color, minimalist design"
                  : "e.g., How to care for indoor plants during winter months"
                }
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={4}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button onClick={generateContent} disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
