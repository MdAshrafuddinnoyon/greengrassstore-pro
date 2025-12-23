import { useState, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Upload, FileText, Download, AlertCircle, CheckCircle2, Loader2, FileSpreadsheet, Store } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

type ImportSource = 'wordpress-xml' | 'wordpress-csv' | 'standard-csv';

interface BlogPost {
  title: string;
  title_ar?: string;
  content: string;
  content_ar?: string;
  excerpt: string;
  excerpt_ar?: string;
  slug: string;
  date: string;
  author: string;
  category: string;
  tags: string[];
  status: string;
  featuredImage?: string;
}

interface ImportResult {
  total: number;
  success: number;
  failed: number;
  errors: string[];
}

interface BlogImporterProps {
  onImportComplete?: () => void;
}

export const BlogImporter = ({ onImportComplete }: BlogImporterProps) => {
  const [importing, setImporting] = useState(false);
  const [blogs, setBlogs] = useState<BlogPost[]>([]);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [detectedSource, setDetectedSource] = useState<ImportSource>('wordpress-xml');
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Real-time subscription for blog updates
  useEffect(() => {
    const channel = supabase
      .channel('blog_imports')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'blog_posts' }, () => {
        // Blog updated - could trigger refresh if needed
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const generateSlug = (title: string) => {
    return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  };

  // Parse WordPress XML (WXR) format
  const parseWordPressXML = (xmlText: string): BlogPost[] => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xmlText, 'text/xml');
    const items = doc.querySelectorAll('item');
    const blogs: BlogPost[] = [];

    items.forEach((item) => {
      const postType = item.querySelector('wp\\:post_type, post_type')?.textContent;
      if (postType !== 'post') return;

      const title = item.querySelector('title')?.textContent || '';
      const contentEncoded = item.querySelector('content\\:encoded, encoded')?.textContent || '';
      const excerptEncoded = item.querySelector('excerpt\\:encoded')?.textContent || '';
      const slug = item.querySelector('wp\\:post_name, post_name')?.textContent || '';
      const date = item.querySelector('wp\\:post_date, post_date')?.textContent || '';
      const author = item.querySelector('dc\\:creator, creator')?.textContent || '';
      const status = item.querySelector('wp\\:status, status')?.textContent || 'draft';

      // Get featured image
      const attachmentUrl = item.querySelector('wp\\:attachment_url, attachment_url')?.textContent || '';

      const categories: string[] = [];
      const tags: string[] = [];
      
      item.querySelectorAll('category').forEach((cat) => {
        const domain = cat.getAttribute('domain');
        const value = cat.textContent || '';
        if (domain === 'category') {
          categories.push(value);
        } else if (domain === 'post_tag') {
          tags.push(value);
        }
      });

      if (title) {
        blogs.push({
          title,
          content: contentEncoded,
          excerpt: excerptEncoded || contentEncoded.substring(0, 200),
          slug: slug || generateSlug(title),
          date,
          author,
          category: categories[0] || 'General',
          tags,
          status: status === 'publish' ? 'published' : 'draft',
          featuredImage: attachmentUrl
        });
      }
    });

    return blogs;
  };

  // Parse WordPress CSV export format
  const parseWordPressCSV = (text: string): BlogPost[] => {
    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length < 2) return [];

    const headers = parseCSVLine(lines[0]).map(h => h.trim().toLowerCase().replace(/\s+/g, '_'));
    const blogs: BlogPost[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i]);
      const data: Record<string, string> = {};
      
      headers.forEach((header, index) => {
        data[header] = values[index]?.trim() || '';
      });

      const title = data['post_title'] || data['title'] || '';
      if (!title) continue;

      blogs.push({
        title,
        content: data['post_content'] || data['content'] || '',
        excerpt: data['post_excerpt'] || data['excerpt'] || '',
        slug: data['post_name'] || data['slug'] || generateSlug(title),
        date: data['post_date'] || data['date'] || new Date().toISOString(),
        author: data['post_author'] || data['author'] || 'Green Grass Team',
        category: data['category'] || data['categories'] || 'General',
        tags: (data['tags'] || data['post_tag'] || '').split(',').map(t => t.trim()).filter(Boolean),
        status: data['post_status'] === 'publish' || data['status'] === 'published' ? 'published' : 'draft',
        featuredImage: data['featured_image'] || data['image'] || ''
      });
    }

    return blogs;
  };


  // Parse Standard Blog CSV format
  const parseStandardCSV = (text: string): BlogPost[] => {
    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length < 2) return [];

    const headers = parseCSVLine(lines[0]).map(h => h.trim().toLowerCase().replace(/\s+/g, '_'));
    const blogs: BlogPost[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i]);
      const data: Record<string, string> = {};
      
      headers.forEach((header, index) => {
        data[header] = values[index]?.trim() || '';
      });

      const title = data['title'] || '';
      if (!title) continue;

      blogs.push({
        title,
        title_ar: data['title_ar'] || data['arabic_title'] || '',
        content: data['content'] || data['body'] || '',
        content_ar: data['content_ar'] || data['arabic_content'] || '',
        excerpt: data['excerpt'] || data['summary'] || '',
        excerpt_ar: data['excerpt_ar'] || data['arabic_excerpt'] || '',
        slug: data['slug'] || data['handle'] || generateSlug(title),
        date: data['date'] || data['published_at'] || new Date().toISOString(),
        author: data['author'] || data['author_name'] || 'Green Grass Team',
        category: data['category'] || 'General',
        tags: (data['tags'] || '').split(',').map(t => t.trim()).filter(Boolean),
        status: data['status'] === 'published' || data['status'] === 'publish' ? 'published' : 'draft',
        featuredImage: data['featured_image'] || data['image'] || ''
      });
    }

    return blogs;
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

  const detectFileType = (content: string, fileName: string): ImportSource => {
    // Check if it's XML
    if (content.trim().startsWith('<?xml') || content.includes('<rss') || content.includes('<wp:')) {
      return 'wordpress-xml';
    }

    // Check CSV headers
    const firstLine = content.split('\n')[0].toLowerCase();
    
    
    if (firstLine.includes('post_title') || firstLine.includes('post_content') || firstLine.includes('post_status')) {
      return 'wordpress-csv';
    }

    return 'standard-csv';
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const source = detectFileType(text, file.name);
      setDetectedSource(source);

      let parsedBlogs: BlogPost[] = [];
      
      switch (source) {
        case 'wordpress-xml':
          parsedBlogs = parseWordPressXML(text);
          break;
        case 'wordpress-csv':
          parsedBlogs = parseWordPressCSV(text);
          break;
        default:
          parsedBlogs = parseStandardCSV(text);
      }

      setBlogs(parsedBlogs);
      setImportResult(null);
      setProgress(0);
      
      if (parsedBlogs.length === 0) {
        toast.error('No valid blog posts found');
      } else {
        toast.success(`Found ${parsedBlogs.length} blog posts (${source.replace('-', ' ').toUpperCase()} format)`);
      }
    };
    reader.readAsText(file);
  };

  // Helper function to validate and process image URL
  const processImageUrl = (url: string): string | null => {
    if (!url || url.trim() === '') return null;
    const trimmedUrl = url.trim();
    
    // Check if it's a valid URL
    if (trimmedUrl.startsWith('http://') || trimmedUrl.startsWith('https://')) {
      return trimmedUrl;
    }
    
    // Check if it's a relative path
    if (trimmedUrl.startsWith('/')) {
      return trimmedUrl;
    }
    
    // Try to add https:// if it looks like a domain
    if (trimmedUrl.includes('.') && !trimmedUrl.includes(' ')) {
      return `https://${trimmedUrl}`;
    }
    
    return null;
  };

  // Extract images from WordPress content
  const extractImagesFromContent = (content: string): string[] => {
    const imgRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi;
    const images: string[] = [];
    let match;
    
    while ((match = imgRegex.exec(content)) !== null) {
      const imageUrl = processImageUrl(match[1]);
      if (imageUrl) {
        images.push(imageUrl);
      }
    }
    
    return images;
  };

  const handleImport = async () => {
    if (blogs.length === 0) {
      toast.error('No blogs to import');
      return;
    }

    setImporting(true);
    const result: ImportResult = { total: blogs.length, success: 0, failed: 0, errors: [] };

    for (let i = 0; i < blogs.length; i++) {
      const blog = blogs[i];
      setProgress(Math.round(((i + 1) / blogs.length) * 100));

      try {
        // Calculate reading time (approx 200 words per minute)
        const wordCount = blog.content.split(/\s+/).length;
        const readingTime = Math.max(1, Math.ceil(wordCount / 200));

        // Process featured image URL
        let featuredImageUrl = processImageUrl(blog.featuredImage || '');
        
        // If no featured image, try to extract first image from content
        if (!featuredImageUrl && blog.content) {
          const contentImages = extractImagesFromContent(blog.content);
          if (contentImages.length > 0) {
            featuredImageUrl = contentImages[0];
          }
        }

        const { error } = await supabase
          .from('blog_posts')
          .insert({
            title: blog.title,
            title_ar: blog.title_ar || null,
            content: blog.content,
            content_ar: blog.content_ar || null,
            excerpt: blog.excerpt.substring(0, 300) || blog.content.substring(0, 300),
            excerpt_ar: blog.excerpt_ar || null,
            slug: blog.slug,
            author_name: blog.author || 'Green Grass Team',
            category: blog.category || 'General',
            tags: blog.tags,
            status: blog.status,
            reading_time: readingTime,
            featured_image: featuredImageUrl,
            published_at: blog.status === 'published' ? new Date(blog.date).toISOString() : null
          });

        if (error) {
          if (error.code === '23505') {
            result.failed++;
            result.errors.push(`Duplicate: ${blog.title} (slug exists)`);
          } else {
            throw error;
          }
        } else {
          result.success++;
        }
      } catch (error: any) {
        result.failed++;
        result.errors.push(`Failed: ${blog.title} - ${error.message || 'Unknown error'}`);
        console.error('Import error:', error);
      }
    }

    setImportResult(result);
    setImporting(false);
    
    if (result.success > 0) {
      toast.success(`Imported ${result.success} blog posts successfully`);
      onImportComplete?.();
    }
    if (result.failed > 0) {
      toast.error(`Failed to import ${result.failed} posts`);
    }
  };

  const downloadTemplate = (type: ImportSource) => {
    let template = '';
    let filename = '';
    let mimeType = 'text/csv';

    switch (type) {
      case 'wordpress-xml':
        template = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
  xmlns:excerpt="http://wordpress.org/export/1.2/excerpt/"
  xmlns:content="http://purl.org/rss/1.0/modules/content/"
  xmlns:dc="http://purl.org/dc/elements/1.1/"
  xmlns:wp="http://wordpress.org/export/1.2/"
>
<channel>
  <item>
    <title>Sample Blog Post</title>
    <dc:creator><![CDATA[Author Name]]></dc:creator>
    <content:encoded><![CDATA[<p>Your blog content goes here with HTML formatting.</p>]]></content:encoded>
    <excerpt:encoded><![CDATA[Brief excerpt of the blog post.]]></excerpt:encoded>
    <wp:post_name><![CDATA[sample-blog-post]]></wp:post_name>
    <wp:post_date><![CDATA[2024-01-15 10:00:00]]></wp:post_date>
    <wp:status><![CDATA[publish]]></wp:status>
    <wp:post_type><![CDATA[post]]></wp:post_type>
    <category domain="category"><![CDATA[Plant Care]]></category>
    <category domain="post_tag"><![CDATA[tips]]></category>
    <category domain="post_tag"><![CDATA[indoor plants]]></category>
  </item>
</channel>
</rss>`;
        filename = 'wordpress_export_template.xml';
        mimeType = 'application/xml';
        break;

      case 'wordpress-csv':
        template = `post_title,post_content,post_excerpt,post_name,post_date,post_author,post_status,category,tags,featured_image
"Sample Blog Post","<p>Your blog content with HTML.</p>","Brief excerpt","sample-blog-post","2024-01-15 10:00:00","Author Name","publish","Plant Care","tips,indoor plants","https://example.com/image.jpg"`;
        filename = 'wordpress_csv_template.csv';
        break;


      default:
        template = `title,title_ar,content,content_ar,excerpt,excerpt_ar,slug,author,category,tags,status,featured_image,date
"Sample Blog Post","مقال نموذجي","<p>Your blog content with HTML.</p>","<p>محتوى المدونة</p>","Brief excerpt","مقتطف مختصر","sample-blog-post","Author Name","Plant Care","tips,indoor plants","published","https://example.com/image.jpg","2024-01-15"`;
        filename = 'blog_import_template.csv';
    }

    const blob = new Blob([template], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getSourceBadge = () => {
    switch (detectedSource) {
      case 'wordpress-xml':
        return <Badge className="bg-blue-100 text-blue-800"><FileText className="w-3 h-3 mr-1" /> WordPress XML</Badge>;
      case 'wordpress-csv':
        return <Badge className="bg-blue-100 text-blue-800"><Store className="w-3 h-3 mr-1" /> WordPress CSV</Badge>;
      default:
        return <Badge variant="secondary">Standard CSV</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Blog Importer</h2>
          <p className="text-sm text-muted-foreground">
            Import blog posts from WordPress or CSV
          </p>
        </div>
      </div>

      {/* Template Downloads */}
      <Tabs defaultValue="wordpress-xml" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="wordpress-xml" className="text-xs sm:text-sm">WP XML</TabsTrigger>
          <TabsTrigger value="wordpress-csv" className="text-xs sm:text-sm">WP CSV</TabsTrigger>
          <TabsTrigger value="standard-csv" className="text-xs sm:text-sm">Standard</TabsTrigger>
        </TabsList>
        
        <TabsContent value="wordpress-xml" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <FileText className="w-4 h-4" />
                WordPress XML Export (WXR)
              </CardTitle>
              <CardDescription>
                Export from WordPress Admin: Tools → Export → Posts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" size="sm" onClick={() => downloadTemplate('wordpress-xml')}>
                <Download className="w-4 h-4 mr-2" />
                Download XML Template
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="wordpress-csv" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Store className="w-4 h-4" />
                WordPress CSV Export
              </CardTitle>
              <CardDescription>
                Use WP All Export plugin for CSV format
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" size="sm" onClick={() => downloadTemplate('wordpress-csv')}>
                <Download className="w-4 h-4 mr-2" />
                Download WP CSV Template
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
        
        
        <TabsContent value="standard-csv" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4" />
                Standard CSV Format
              </CardTitle>
              <CardDescription>
                Basic CSV with all blog fields including Arabic support
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" size="sm" onClick={() => downloadTemplate('standard-csv')}>
                <Download className="w-4 h-4 mr-2" />
                Download Standard Template
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Upload Area */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Upload Blog Export</CardTitle>
          <CardDescription>
            Upload your WordPress XML, Shopify CSV, or standard CSV file
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div 
            className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="font-medium">Click to upload file</p>
            <p className="text-sm text-muted-foreground mt-1">
              Supports XML and CSV formats - Auto-detects source
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xml,.csv"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>
        </CardContent>
      </Card>

      {/* Preview */}
      {blogs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
              {blogs.length} Blog Posts Found
              <span className="ml-2">{getSourceBadge()}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-h-64 overflow-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted sticky top-0">
                  <tr>
                    <th className="text-left p-2">Title</th>
                    <th className="text-left p-2">Author</th>
                    <th className="text-left p-2">Category</th>
                    <th className="text-left p-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {blogs.slice(0, 10).map((blog, index) => (
                    <tr key={index} className="border-b">
                      <td className="p-2">{blog.title}</td>
                      <td className="p-2">{blog.author}</td>
                      <td className="p-2">{blog.category || '-'}</td>
                      <td className="p-2">
                        <span className={`px-2 py-0.5 rounded text-xs ${
                          blog.status === 'published' 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {blog.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {blogs.length > 10 && (
                <p className="text-sm text-muted-foreground text-center py-2">
                  +{blogs.length - 10} more posts
                </p>
              )}
            </div>

            {importing && (
              <div className="my-4">
                <Progress value={progress} className="h-2" />
                <p className="text-sm text-muted-foreground text-center mt-2">
                  Importing... {progress}%
                </p>
              </div>
            )}
            
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
                    Import All Posts
                  </>
                )}
              </Button>
              <Button variant="outline" onClick={() => { setBlogs([]); setImportResult(null); }}>
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
            <p>{importResult.success} posts imported successfully, {importResult.failed} failed.</p>
            {importResult.errors.length > 0 && (
              <ul className="mt-2 text-sm list-disc list-inside max-h-32 overflow-auto">
                {importResult.errors.slice(0, 10).map((error, i) => (
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
            <li><strong>WordPress XML:</strong> Tools → Export → Posts (WXR format)</li>
            <li><strong>WordPress CSV:</strong> Using WP All Export plugin</li>
            <li><strong>Standard CSV:</strong> Any CSV with title, content columns</li>
          </ul>
        </AlertDescription>
      </Alert>
    </div>
  );
};
