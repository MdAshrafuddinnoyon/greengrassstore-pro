import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Upload, FileText, Download, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface WordPressPost {
  title: string;
  content: string;
  excerpt: string;
  pubDate: string;
  creator: string;
  category: string[];
  guid: string;
  description?: string;
}

export const WordPressImporter = () => {
  const [isImporting, setIsImporting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [importResults, setImportResults] = useState<{ success: number; failed: number } | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const parseWordPressXML = (xmlText: string): WordPressPost[] => {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlText, "text/xml");
    
    const items = xmlDoc.getElementsByTagName("item");
    const posts: WordPressPost[] = [];

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      
      // Check if it's a post (not page or other post type)
      const postType = item.getElementsByTagName("wp:post_type")[0]?.textContent;
      const status = item.getElementsByTagName("wp:status")[0]?.textContent;
      
      if (postType === "post" && status === "publish") {
        const title = item.getElementsByTagName("title")[0]?.textContent || "";
        const content = item.getElementsByTagName("content:encoded")[0]?.textContent || "";
        const excerpt = item.getElementsByTagName("excerpt:encoded")[0]?.textContent || "";
        const pubDate = item.getElementsByTagName("pubDate")[0]?.textContent || "";
        const creator = item.getElementsByTagName("dc:creator")[0]?.textContent || "Admin";
        const guid = item.getElementsByTagName("guid")[0]?.textContent || "";
        const description = item.getElementsByTagName("description")[0]?.textContent || "";

        // Get categories
        const categories: string[] = [];
        const categoryElements = item.getElementsByTagName("category");
        for (let j = 0; j < categoryElements.length; j++) {
          const catDomain = categoryElements[j].getAttribute("domain");
          if (catDomain === "category") {
            const catName = categoryElements[j].textContent;
            if (catName) categories.push(catName);
          }
        }

        posts.push({
          title,
          content: content || description,
          excerpt: excerpt || description?.substring(0, 160) || "",
          pubDate,
          creator,
          category: categories,
          guid,
          description
        });
      }
    }

    return posts;
  };

  const parseWordPressCSV = (csvText: string): WordPressPost[] => {
    const lines = csvText.split('\n');
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    const posts: WordPressPost[] = [];

    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue;
      
      const values = lines[i].match(/(".*?"|[^,]+)(?=\s*,|\s*$)/g)?.map(v => v.trim().replace(/^"|"$/g, '')) || [];
      
      if (values.length >= 3) {
        const post: Partial<WordPressPost> = {};
        headers.forEach((header, index) => {
          const value = values[index] || '';
          switch (header.toLowerCase()) {
            case 'title':
              post.title = value;
              break;
            case 'content':
            case 'post_content':
              post.content = value;
              break;
            case 'excerpt':
            case 'post_excerpt':
              post.excerpt = value;
              break;
            case 'date':
            case 'post_date':
            case 'published':
              post.pubDate = value;
              break;
            case 'author':
            case 'post_author':
              post.creator = value;
              break;
            case 'category':
            case 'categories':
              post.category = value ? value.split('|').map(c => c.trim()) : ['General'];
              break;
          }
        });

        if (post.title && post.content) {
          posts.push({
            title: post.title,
            content: post.content,
            excerpt: post.excerpt || post.content.substring(0, 160),
            pubDate: post.pubDate || new Date().toISOString(),
            creator: post.creator || 'Admin',
            category: post.category || ['General'],
            guid: '',
            description: post.excerpt
          });
        }
      }
    }

    return posts;
  };

  const baseSlug = (title: string): string => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  const generateUniqueSlug = async (title: string): Promise<string> => {
    const base = baseSlug(title) || "post";
    let candidate = base;
    let counter = 1;

    // Try until unique
    while (true) {
      const { data: existing } = await supabase
        .from('blog_posts')
        .select('id')
        .eq('slug', candidate)
        .maybeSingle();

      if (!existing) return candidate;
      candidate = `${base}-${counter++}`;
    }
  };

  const estimateReadingTime = (content: string): number => {
    const wordsPerMinute = 200;
    const words = content.split(/\s+/).length;
    return Math.max(1, Math.ceil(words / wordsPerMinute));
  };

  const handleFileImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const fileType = file.name.toLowerCase().endsWith('.xml') ? 'xml' : 'csv';
    
    setIsImporting(true);
    setProgress(0);
    setImportResults(null);

    try {
      const text = await file.text();
      const posts = fileType === 'xml' ? parseWordPressXML(text) : parseWordPressCSV(text);

      if (posts.length === 0) {
        toast.error("No valid posts found in file");
        setIsImporting(false);
        return;
      }

      let successCount = 0;
      let failedCount = 0;

      for (let i = 0; i < posts.length; i++) {
        const post = posts[i];
        setProgress(((i + 1) / posts.length) * 100);

        try {
          const slug = await generateUniqueSlug(post.title);
          const category = post.category?.[0] || 'General';
          
          // Check if post already exists by slug
          const { data: existing } = await supabase
            .from('blog_posts')
            .select('id')
            .eq('slug', slug)
            .single();

          if (existing) {
            console.log(`Post "${post.title}" already exists, skipping...`);
            failedCount++;
            continue;
          }

          const { error } = await supabase
            .from('blog_posts')
            .insert({
              title: post.title,
              slug,
              content: post.content,
              excerpt: post.excerpt,
              category,
              status: 'published',
              author_name: post.creator,
              reading_time: estimateReadingTime(post.content),
              published_at: new Date(post.pubDate).toISOString(),
              view_count: 0,
              is_featured: false
            });

          if (error) {
            console.error(`Error importing "${post.title}":`, error);
            failedCount++;
          } else {
            successCount++;
          }
        } catch (err) {
          console.error(`Error processing "${post.title}":`, err);
          failedCount++;
        }

        // Small delay to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      setImportResults({ success: successCount, failed: failedCount });
      toast.success(`Import complete! ${successCount} posts imported, ${failedCount} failed/skipped`);
    } catch (error) {
      console.error("Import error:", error);
      toast.error("Failed to import posts. Check file format.");
    } finally {
      setIsImporting(false);
      setProgress(0);
    }
  };

  const handleExportToWordPress = async () => {
    setIsExporting(true);
    try {
      const { data: posts, error } = await supabase
        .from('blog_posts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (!posts || posts.length === 0) {
        toast.error("No posts to export");
        return;
      }

      // Generate WordPress WXR (WordPress eXtended RSS) format
      let wxr = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
  xmlns:excerpt="http://wordpress.org/export/1.2/excerpt/"
  xmlns:content="http://purl.org/rss/1.0/modules/content/"
  xmlns:wfw="http://wellformedweb.org/CommentAPI/"
  xmlns:dc="http://purl.org/dc/elements/1.1/"
  xmlns:wp="http://wordpress.org/export/1.2/">
  <channel>
    <title>Green Grass Store Blog</title>
    <link>https://greengrassstore.com</link>
    <description>Blog Export</description>
    <pubDate>${new Date().toUTCString()}</pubDate>
    <language>en-US</language>
    <wp:wxr_version>1.2</wp:wxr_version>
    <wp:base_blog_url>https://greengrassstore.com</wp:base_blog_url>
`;

      posts.forEach(post => {
        const pubDate = post.published_at ? new Date(post.published_at).toUTCString() : new Date().toUTCString();
        wxr += `
    <item>
      <title><![CDATA[${post.title}]]></title>
      <link>https://greengrassstore.com/blog/${post.slug}</link>
      <pubDate>${pubDate}</pubDate>
      <dc:creator><![CDATA[${post.author_name}]]></dc:creator>
      <guid isPermaLink="false">https://greengrassstore.com/blog/${post.slug}</guid>
      <description><![CDATA[${post.excerpt}]]></description>
      <content:encoded><![CDATA[${post.content}]]></content:encoded>
      <excerpt:encoded><![CDATA[${post.excerpt}]]></excerpt:encoded>
      <wp:post_id>${post.id}</wp:post_id>
      <wp:post_date><![CDATA[${pubDate}]]></wp:post_date>
      <wp:post_date_gmt><![CDATA[${pubDate}]]></wp:post_date_gmt>
      <wp:post_type><![CDATA[post]]></wp:post_type>
      <wp:status><![CDATA[${post.status}]]></wp:status>
      <category domain="category" nicename="${post.category.toLowerCase()}"><![CDATA[${post.category}]]></category>
    </item>`;
      });

      wxr += `
  </channel>
</rss>`;

      // Download file
      const blob = new Blob([wxr], { type: 'application/xml' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `greengrassstore-blog-export-${new Date().toISOString().split('T')[0]}.xml`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success(`Exported ${posts.length} blog posts to WordPress XML`);
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Failed to export posts");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Upload className="w-4 h-4" />
          WordPress Import/Export
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>WordPress Blog Import/Export</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Import Section */}
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-start gap-3">
                <Upload className="w-5 h-5 text-primary mt-1" />
                <div className="flex-1">
                  <h3 className="font-semibold mb-2">Import from WordPress</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Upload a WordPress export file (XML or CSV format). Posts will be imported with their content, 
                    categories, authors, and publish dates.
                  </p>
                  
                  <div className="space-y-3">
                    <Label htmlFor="wordpress-file" className="cursor-pointer">
                      <div className="flex items-center justify-center w-full h-32 border-2 border-dashed rounded-lg hover:border-primary transition-colors">
                        {isImporting ? (
                          <div className="text-center space-y-2">
                            <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
                            <p className="text-sm font-medium">Importing posts...</p>
                            <Progress value={progress} className="w-48 mx-auto" />
                            <p className="text-xs text-muted-foreground">{Math.round(progress)}%</p>
                          </div>
                        ) : (
                          <div className="text-center">
                            <FileText className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                            <p className="text-sm font-medium">Click to upload XML or CSV file</p>
                            <p className="text-xs text-muted-foreground mt-1">WordPress export format</p>
                          </div>
                        )}
                      </div>
                      <input
                        id="wordpress-file"
                        type="file"
                        accept=".xml,.csv"
                        onChange={handleFileImport}
                        disabled={isImporting}
                        className="hidden"
                      />
                    </Label>

                    {importResults && (
                      <div className="p-3 bg-muted rounded-lg">
                        <p className="text-sm font-medium mb-1">Import Results:</p>
                        <p className="text-sm text-green-600">✓ {importResults.success} posts imported successfully</p>
                        {importResults.failed > 0 && (
                          <p className="text-sm text-amber-600">⚠ {importResults.failed} posts failed/skipped</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Export Section */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <Download className="w-5 h-5 text-primary mt-1" />
                <div className="flex-1">
                  <h3 className="font-semibold mb-2">Export to WordPress</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Export all blog posts to WordPress XML format (WXR). This file can be imported into any WordPress site.
                  </p>
                  <Button 
                    onClick={handleExportToWordPress}
                    disabled={isExporting}
                    className="w-full"
                  >
                    {isExporting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Exporting...
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4 mr-2" />
                        Export to WordPress XML
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Format Guide */}
          <div className="p-4 bg-muted/50 rounded-lg text-xs space-y-2">
            <p className="font-semibold">Supported Formats:</p>
            <ul className="space-y-1 ml-4 list-disc text-muted-foreground">
              <li><strong>XML:</strong> WordPress WXR export file (Tools → Export → Posts)</li>
              <li><strong>CSV:</strong> Columns: title, content, excerpt, date, author, category</li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
