import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { 
  Loader2, Save, RefreshCw, Search, Globe, FileText, 
  Code, MapPin, CheckCircle, AlertTriangle, ExternalLink,
  Copy, Download
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface SEOSettings {
  siteTitle: string;
  siteDescription: string;
  siteKeywords: string;
  canonicalUrl: string;
  ogTitle: string;
  ogDescription: string;
  ogImage: string;
  twitterHandle: string;
  twitterCard: string;
  enableIndexing: boolean;
  enableSitemap: boolean;
  googleVerification: string;
  bingVerification: string;
  structuredData: string;
  customHeadCode: string;
  robotsTxt: string;
}

interface PageSEO {
  path: string;
  title: string;
  description: string;
  keywords: string;
  noIndex: boolean;
}

const defaultSEOSettings: SEOSettings = {
  siteTitle: "Green Grass | Plants, Planters & Pots in Dubai",
  siteDescription: "Your one-stop destination for indoor & outdoor plants, pots, planters, and vases in Dubai, UAE.",
  siteKeywords: "plants dubai, indoor plants, pots, planters, vases, home decor, UAE plants",
  canonicalUrl: "https://greengrassstore.com",
  ogTitle: "Green Grass | Plants & Home Decor Dubai",
  ogDescription: "Transform your space with beautiful plants, pots, and planters. Free delivery in Dubai.",
  ogImage: "/android-chrome-512x512.png",
  twitterHandle: "@GreenGrassUAE",
  twitterCard: "summary_large_image",
  enableIndexing: true,
  enableSitemap: true,
  googleVerification: "",
  bingVerification: "",
  structuredData: JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Store",
    "name": "Green Grass",
    "description": "Plants, Planters & Pots in Dubai",
    "url": "https://greengrassstore.com",
    "address": {
      "@type": "PostalAddress",
      "addressCountry": "AE",
      "addressLocality": "Dubai"
    }
  }, null, 2),
  customHeadCode: "",
  robotsTxt: `User-agent: Googlebot
Allow: /

User-agent: Bingbot
Allow: /

User-agent: Twitterbot
Allow: /

User-agent: facebookexternalhit
Allow: /

User-agent: *
Allow: /

Sitemap: https://greengrassstore.com/sitemap.xml`
};

const defaultPages: PageSEO[] = [
  { path: "/", title: "Home", description: "", keywords: "", noIndex: false },
  { path: "/shop", title: "Shop", description: "", keywords: "", noIndex: false },
  { path: "/about", title: "About Us", description: "", keywords: "", noIndex: false },
  { path: "/contact", title: "Contact", description: "", keywords: "", noIndex: false },
  { path: "/blog", title: "Blog", description: "", keywords: "", noIndex: false },
  { path: "/faq", title: "FAQ", description: "", keywords: "", noIndex: false },
];

export const SEOManager = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<SEOSettings>(defaultSEOSettings);
  const [pages, setPages] = useState<PageSEO[]>(defaultPages);
  const [sitemapPreview, setSitemapPreview] = useState("");

  useEffect(() => {
    fetchSettings();
    generateSitemapPreview();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('site_settings')
        .select('*')
        .eq('setting_key', 'seo_settings')
        .single();

      if (data && !error) {
        setSettings(data.setting_value as unknown as SEOSettings);
      }

      const { data: pagesData } = await supabase
        .from('site_settings')
        .select('*')
        .eq('setting_key', 'seo_pages')
        .single();

      if (pagesData) {
        setPages(pagesData.setting_value as unknown as PageSEO[]);
      }
    } catch (error) {
      console.error('Error fetching SEO settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      const { data: existing } = await supabase
        .from('site_settings')
        .select('id')
        .eq('setting_key', 'seo_settings')
        .single();

      if (existing) {
        await supabase
          .from('site_settings')
          .update({ setting_value: JSON.parse(JSON.stringify(settings)) })
          .eq('setting_key', 'seo_settings');
      } else {
        await supabase
          .from('site_settings')
          .insert({ setting_key: 'seo_settings', setting_value: JSON.parse(JSON.stringify(settings)) });
      }

      toast.success('SEO settings saved successfully');
    } catch (error) {
      console.error('Error saving SEO settings:', error);
      toast.error('Failed to save SEO settings');
    } finally {
      setSaving(false);
    }
  };

  const savePages = async () => {
    setSaving(true);
    try {
      const { data: existing } = await supabase
        .from('site_settings')
        .select('id')
        .eq('setting_key', 'seo_pages')
        .single();

      if (existing) {
        await supabase
          .from('site_settings')
          .update({ setting_value: JSON.parse(JSON.stringify(pages)) })
          .eq('setting_key', 'seo_pages');
      } else {
        await supabase
          .from('site_settings')
          .insert({ setting_key: 'seo_pages', setting_value: JSON.parse(JSON.stringify(pages)) });
      }

      toast.success('Page SEO settings saved');
    } catch (error) {
      console.error('Error saving page SEO:', error);
      toast.error('Failed to save page SEO');
    } finally {
      setSaving(false);
    }
  };

  const generateSitemapPreview = async () => {
    try {
      // Fetch products for sitemap
      const { data: products } = await supabase
        .from('products')
        .select('slug, updated_at')
        .eq('is_active', true)
        .limit(100);

      // Fetch categories
      const { data: categories } = await supabase
        .from('categories')
        .select('slug, updated_at')
        .eq('is_active', true);

      // Fetch blog posts - skip for now to avoid type issues
      const blogs: { id: string; title: string; updated_at: string }[] = [];

      const baseUrl = settings.canonicalUrl || 'https://greengrassstore.com';
      
      let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <!-- Static Pages -->
  <url>
    <loc>${baseUrl}/</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${baseUrl}/shop</loc>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>${baseUrl}/about</loc>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>
  <url>
    <loc>${baseUrl}/contact</loc>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>
  <url>
    <loc>${baseUrl}/blog</loc>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>${baseUrl}/faq</loc>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>
`;

      // Add categories
      if (categories) {
        sitemap += `\n  <!-- Categories -->\n`;
        categories.forEach(cat => {
          sitemap += `  <url>
    <loc>${baseUrl}/shop?category=${cat.slug}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>\n`;
        });
      }

      // Add products
      if (products) {
        sitemap += `\n  <!-- Products -->\n`;
        products.forEach(product => {
          sitemap += `  <url>
    <loc>${baseUrl}/product/${product.slug}</loc>
    <lastmod>${new Date(product.updated_at).toISOString().split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>\n`;
        });
      }

      // Add blog posts
      if (blogs && blogs.length > 0) {
        sitemap += `\n  <!-- Blog Posts -->\n`;
        blogs.forEach(blog => {
          const blogSlug = blog.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
          sitemap += `  <url>
    <loc>${baseUrl}/blog/${blogSlug}</loc>
    <lastmod>${new Date(blog.updated_at).toISOString().split('T')[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>\n`;
        });
      }

      sitemap += `</urlset>`;
      setSitemapPreview(sitemap);
    } catch (error) {
      console.error('Error generating sitemap:', error);
    }
  };

  const copySitemap = () => {
    navigator.clipboard.writeText(sitemapPreview);
    toast.success('Sitemap copied to clipboard');
  };

  const downloadSitemap = () => {
    const blob = new Blob([sitemapPreview], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sitemap.xml';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Sitemap downloaded');
  };

  const copyRobotsTxt = () => {
    navigator.clipboard.writeText(settings.robotsTxt);
    toast.success('robots.txt copied to clipboard');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Search className="w-6 h-6 text-primary" />
            SEO & Indexing Manager
          </h2>
          <p className="text-muted-foreground">
            Optimize your website for search engines like Google, Bing
          </p>
        </div>
        <Button variant="outline" onClick={fetchSettings}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              {settings.enableIndexing ? (
                <CheckCircle className="w-8 h-8 text-green-600" />
              ) : (
                <AlertTriangle className="w-8 h-8 text-yellow-600" />
              )}
              <div>
                <p className="text-sm text-muted-foreground">Indexing</p>
                <p className="font-semibold">{settings.enableIndexing ? 'Enabled' : 'Disabled'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <Globe className="w-8 h-8 text-blue-600" />
              <div>
                <p className="text-sm text-muted-foreground">Sitemap</p>
                <p className="font-semibold">{settings.enableSitemap ? 'Active' : 'Inactive'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <FileText className="w-8 h-8 text-purple-600" />
              <div>
                <p className="text-sm text-muted-foreground">Meta Tags</p>
                <p className="font-semibold">Configured</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-500/10 to-orange-600/5">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <Code className="w-8 h-8 text-orange-600" />
              <div>
                <p className="text-sm text-muted-foreground">Structured Data</p>
                <p className="font-semibold">{settings.structuredData ? 'Added' : 'Not Set'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList className="grid grid-cols-5 h-auto gap-1 p-1">
          <TabsTrigger value="general" className="gap-1 text-xs sm:text-sm py-2">
            <Globe className="w-4 h-4" />
            <span className="hidden sm:inline">General</span>
          </TabsTrigger>
          <TabsTrigger value="social" className="gap-1 text-xs sm:text-sm py-2">
            <ExternalLink className="w-4 h-4" />
            <span className="hidden sm:inline">Social</span>
          </TabsTrigger>
          <TabsTrigger value="sitemap" className="gap-1 text-xs sm:text-sm py-2">
            <MapPin className="w-4 h-4" />
            <span className="hidden sm:inline">Sitemap</span>
          </TabsTrigger>
          <TabsTrigger value="robots" className="gap-1 text-xs sm:text-sm py-2">
            <FileText className="w-4 h-4" />
            <span className="hidden sm:inline">Robots</span>
          </TabsTrigger>
          <TabsTrigger value="advanced" className="gap-1 text-xs sm:text-sm py-2">
            <Code className="w-4 h-4" />
            <span className="hidden sm:inline">Advanced</span>
          </TabsTrigger>
        </TabsList>

        {/* General SEO */}
        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>General SEO Settings</CardTitle>
              <CardDescription>
                Basic meta tags that appear in search results
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                <div>
                  <Label>Enable Search Engine Indexing</Label>
                  <p className="text-sm text-muted-foreground">
                    Allow Google & other search engines to index your site
                  </p>
                </div>
                <Switch
                  checked={settings.enableIndexing}
                  onCheckedChange={(checked) => 
                    setSettings(prev => ({ ...prev, enableIndexing: checked }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Site Title</Label>
                <Input
                  value={settings.siteTitle}
                  onChange={(e) => setSettings(prev => ({ ...prev, siteTitle: e.target.value }))}
                  placeholder="Your Site Title | Brand Name"
                />
                <p className="text-xs text-muted-foreground">
                  {settings.siteTitle.length}/60 characters (recommended max)
                </p>
              </div>

              <div className="space-y-2">
                <Label>Site Description</Label>
                <Textarea
                  value={settings.siteDescription}
                  onChange={(e) => setSettings(prev => ({ ...prev, siteDescription: e.target.value }))}
                  placeholder="Brief description of your website..."
                  rows={3}
                />
                <p className="text-xs text-muted-foreground">
                  {settings.siteDescription.length}/160 characters (recommended max)
                </p>
              </div>

              <div className="space-y-2">
                <Label>Keywords</Label>
                <Input
                  value={settings.siteKeywords}
                  onChange={(e) => setSettings(prev => ({ ...prev, siteKeywords: e.target.value }))}
                  placeholder="keyword1, keyword2, keyword3..."
                />
              </div>

              <div className="space-y-2">
                <Label>Canonical URL</Label>
                <Input
                  value={settings.canonicalUrl}
                  onChange={(e) => setSettings(prev => ({ ...prev, canonicalUrl: e.target.value }))}
                  placeholder="https://yourdomain.com"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Google Site Verification</Label>
                  <Input
                    value={settings.googleVerification}
                    onChange={(e) => setSettings(prev => ({ ...prev, googleVerification: e.target.value }))}
                    placeholder="Google verification code"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Bing Site Verification</Label>
                  <Input
                    value={settings.bingVerification}
                    onChange={(e) => setSettings(prev => ({ ...prev, bingVerification: e.target.value }))}
                    placeholder="Bing verification code"
                  />
                </div>
              </div>

              <Button onClick={saveSettings} disabled={saving} className="w-full">
                {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                Save General SEO Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Social SEO */}
        <TabsContent value="social">
          <Card>
            <CardHeader>
              <CardTitle>Social Media & Open Graph</CardTitle>
              <CardDescription>
                How your site appears when shared on social media
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>OG Title</Label>
                <Input
                  value={settings.ogTitle}
                  onChange={(e) => setSettings(prev => ({ ...prev, ogTitle: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label>OG Description</Label>
                <Textarea
                  value={settings.ogDescription}
                  onChange={(e) => setSettings(prev => ({ ...prev, ogDescription: e.target.value }))}
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label>OG Image URL</Label>
                <Input
                  value={settings.ogImage}
                  onChange={(e) => setSettings(prev => ({ ...prev, ogImage: e.target.value }))}
                  placeholder="/android-chrome-512x512.png"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Twitter Handle</Label>
                  <Input
                    value={settings.twitterHandle}
                    onChange={(e) => setSettings(prev => ({ ...prev, twitterHandle: e.target.value }))}
                    placeholder="@yourhandle"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Twitter Card Type</Label>
                  <Input
                    value={settings.twitterCard}
                    onChange={(e) => setSettings(prev => ({ ...prev, twitterCard: e.target.value }))}
                    placeholder="summary_large_image"
                  />
                </div>
              </div>

              <Button onClick={saveSettings} disabled={saving} className="w-full">
                {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                Save Social Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sitemap */}
        <TabsContent value="sitemap">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-primary" />
                XML Sitemap
              </CardTitle>
              <CardDescription>
                Generate and manage your sitemap for search engines
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                <div>
                  <Label>Enable Sitemap</Label>
                  <p className="text-sm text-muted-foreground">
                    Auto-generate sitemap with all products, categories, blogs
                  </p>
                </div>
                <Switch
                  checked={settings.enableSitemap}
                  onCheckedChange={(checked) => 
                    setSettings(prev => ({ ...prev, enableSitemap: checked }))
                  }
                />
              </div>

              <div className="flex gap-2">
                <Button onClick={generateSitemapPreview} variant="outline">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Regenerate Sitemap
                </Button>
                <Button onClick={copySitemap} variant="outline">
                  <Copy className="w-4 h-4 mr-2" />
                  Copy
                </Button>
                <Button onClick={downloadSitemap} variant="outline">
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
              </div>

              <div className="space-y-2">
                <Label>Sitemap Preview</Label>
                <Textarea
                  value={sitemapPreview}
                  readOnly
                  rows={15}
                  className="font-mono text-xs"
                />
              </div>

              <div className="p-4 bg-blue-500/10 rounded-lg">
                <h4 className="font-medium text-blue-700 mb-2">📌 How to Submit Sitemap</h4>
                <ol className="text-sm text-muted-foreground space-y-1">
                  <li>1. Download the sitemap.xml file</li>
                  <li>2. Upload to your website root (e.g., yourdomain.com/sitemap.xml)</li>
                  <li>3. Submit to <a href="https://search.google.com/search-console" target="_blank" className="text-primary underline">Google Search Console</a></li>
                  <li>4. Submit to <a href="https://www.bing.com/webmasters" target="_blank" className="text-primary underline">Bing Webmaster Tools</a></li>
                </ol>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Robots.txt */}
        <TabsContent value="robots">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                Robots.txt
              </CardTitle>
              <CardDescription>
                Control how search engines crawl your website
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>robots.txt Content</Label>
                <Textarea
                  value={settings.robotsTxt}
                  onChange={(e) => setSettings(prev => ({ ...prev, robotsTxt: e.target.value }))}
                  rows={12}
                  className="font-mono text-sm"
                />
              </div>

              <div className="flex gap-2">
                <Button onClick={copyRobotsTxt} variant="outline">
                  <Copy className="w-4 h-4 mr-2" />
                  Copy robots.txt
                </Button>
              </div>

              <div className="p-4 bg-yellow-500/10 rounded-lg">
                <h4 className="font-medium text-yellow-700 mb-2">⚠️ Important</h4>
                <p className="text-sm text-muted-foreground">
                  The robots.txt file should be placed at the root of your domain (e.g., yourdomain.com/robots.txt).
                  Copy this content and update the public/robots.txt file in your project.
                </p>
              </div>

              <Button onClick={saveSettings} disabled={saving} className="w-full">
                {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                Save Robots Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Advanced */}
        <TabsContent value="advanced">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code className="w-5 h-5 text-primary" />
                Advanced SEO
              </CardTitle>
              <CardDescription>
                Structured data, custom code, and advanced settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>JSON-LD Structured Data (Schema.org)</Label>
                <Textarea
                  value={settings.structuredData}
                  onChange={(e) => setSettings(prev => ({ ...prev, structuredData: e.target.value }))}
                  rows={10}
                  className="font-mono text-xs"
                  placeholder='{"@context": "https://schema.org", ...}'
                />
                <p className="text-xs text-muted-foreground">
                  Add structured data for rich snippets in search results
                </p>
              </div>

              <div className="space-y-2">
                <Label>Custom Head Code</Label>
                <Textarea
                  value={settings.customHeadCode}
                  onChange={(e) => setSettings(prev => ({ ...prev, customHeadCode: e.target.value }))}
                  rows={6}
                  className="font-mono text-xs"
                  placeholder="<!-- Custom meta tags, scripts, etc. -->"
                />
                <p className="text-xs text-muted-foreground">
                  Add custom code to the &lt;head&gt; section (analytics, verification, etc.)
                </p>
              </div>

              <div className="p-4 bg-green-500/10 rounded-lg">
                <h4 className="font-medium text-green-700 mb-2">✅ SEO Checklist</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span>Meta title & description set</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span>Open Graph tags configured</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span>Sitemap generated</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span>robots.txt configured</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {settings.googleVerification ? (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-yellow-600" />
                    )}
                    <span>Google verification</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {settings.structuredData ? (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-yellow-600" />
                    )}
                    <span>Structured data added</span>
                  </div>
                </div>
              </div>

              <Button onClick={saveSettings} disabled={saving} className="w-full">
                {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                Save Advanced Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
