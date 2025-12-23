import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Pencil, Trash2, Eye, Loader2, FolderPlus, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { MediaPicker } from "./MediaPicker";
import { ExportButtons } from "./ExportButtons";
import { RichTextEditor } from "./RichTextEditor";
import { AIContentGenerator } from "./AIContentGenerator";

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  category: string;
  status: string;
  featured_image: string | null;
  author_name: string;
  reading_time: number;
  view_count: number;
  is_featured: boolean;
  published_at: string | null;
  created_at: string;
}

const DEFAULT_CATEGORIES = ["General", "Plant Care", "Tips & Tricks", "Inspiration", "News"];

export const BlogManager = () => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [selectedPosts, setSelectedPosts] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [categories, setCategories] = useState<string[]>(DEFAULT_CATEGORIES);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [showNewCategoryInput, setShowNewCategoryInput] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    excerpt: "",
    content: "",
    category: "General",
    status: "draft",
    featured_image: "",
    author_name: "Green Grass Team",
    reading_time: 5,
  });

  const fetchPosts = async () => {
    const { data, error } = await supabase
      .from("blog_posts")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching posts:", error);
    } else {
      setPosts(data || []);
      // Extract unique categories from posts
      const postCategories = [...new Set((data || []).map(p => p.category))];
      setCategories([...new Set([...DEFAULT_CATEGORIES, ...postCategories])]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPosts();

    const channel = supabase
      .channel('admin-blog-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'blog_posts' },
        () => {
          fetchPosts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'a') {
          e.preventDefault();
          if (selectedPosts.length === filteredPosts.length) {
            setSelectedPosts([]);
          } else {
            setSelectedPosts(filteredPosts.map(p => p.id));
          }
        }
      }
      if (e.key === 'Escape') {
        setSelectedPosts([]);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedPosts.length]);

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const postData = {
      ...formData,
      slug: formData.slug || generateSlug(formData.title),
      published_at: formData.status === "published" ? new Date().toISOString() : null,
    };

    if (editingPost) {
      const { error } = await supabase
        .from("blog_posts")
        .update(postData)
        .eq("id", editingPost.id);

      if (error) {
        toast.error("Failed to update post");
        console.error(error);
      } else {
        toast.success("Post updated successfully");
        setIsDialogOpen(false);
        fetchPosts();
      }
    } else {
      const { error } = await supabase
        .from("blog_posts")
        .insert([postData]);

      if (error) {
        toast.error("Failed to create post");
        console.error(error);
      } else {
        toast.success("Post created successfully");
        setIsDialogOpen(false);
        fetchPosts();
      }
    }

    resetForm();
  };

  const handleEdit = (post: BlogPost) => {
    setEditingPost(post);
    setFormData({
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt,
      content: post.content,
      category: post.category,
      status: post.status,
      featured_image: post.featured_image || "",
      author_name: post.author_name,
      reading_time: post.reading_time,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this post?")) return;

    const { error } = await supabase
      .from("blog_posts")
      .delete()
      .eq("id", id);

    if (error) {
      toast.error("Failed to delete post");
      console.error(error);
    } else {
      toast.success("Post deleted successfully");
      fetchPosts();
    }
  };

  const handleBulkDelete = async () => {
    if (selectedPosts.length === 0) return;
    if (!confirm(`Are you sure you want to delete ${selectedPosts.length} posts?`)) return;

    const { error } = await supabase
      .from("blog_posts")
      .delete()
      .in("id", selectedPosts);

    if (error) {
      toast.error("Failed to delete posts");
      console.error(error);
    } else {
      toast.success(`${selectedPosts.length} posts deleted successfully`);
      setSelectedPosts([]);
      fetchPosts();
    }
  };

  const handleBulkCategoryChange = async (category: string) => {
    if (selectedPosts.length === 0) return;

    const { error } = await supabase
      .from("blog_posts")
      .update({ category })
      .in("id", selectedPosts);

    if (error) {
      toast.error("Failed to update category");
      console.error(error);
    } else {
      toast.success(`${selectedPosts.length} posts moved to ${category}`);
      setSelectedPosts([]);
      fetchPosts();
    }
  };

  const handleAddNewCategory = () => {
    if (newCategoryName.trim() && !categories.includes(newCategoryName.trim())) {
      setCategories([...categories, newCategoryName.trim()]);
      setNewCategoryName("");
      setShowNewCategoryInput(false);
      toast.success(`Category "${newCategoryName}" added`);
    }
  };

  const toggleSelectPost = (id: string) => {
    setSelectedPosts(prev => 
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedPosts.length === filteredPosts.length) {
      setSelectedPosts([]);
    } else {
      setSelectedPosts(filteredPosts.map(p => p.id));
    }
  };

  const resetForm = () => {
    setEditingPost(null);
    setFormData({
      title: "",
      slug: "",
      excerpt: "",
      content: "",
      category: "General",
      status: "draft",
      featured_image: "",
      author_name: "Green Grass Team",
      reading_time: 5,
    });
  };

  const openNewPostDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const filteredPosts = posts.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         post.excerpt.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = filterCategory === "all" || post.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <CardTitle>Blog Posts</CardTitle>
            <CardDescription>Manage your blog content</CardDescription>
          </div>
          <div className="flex gap-2 flex-wrap">
            <ExportButtons data={posts} filename="blog_posts" />
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={openNewPostDialog}>
                  <Plus className="w-4 h-4 mr-2" />
                  New Post
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{editingPost ? "Edit Post" : "Create New Post"}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="title">Title</Label>
                        <AIContentGenerator 
                          type="blog" 
                          onGenerate={(c) => c.title && setFormData({ ...formData, title: c.title })} 
                        />
                      </div>
                      <Input
                        id="title"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="slug">Slug</Label>
                      <Input
                        id="slug"
                        value={formData.slug}
                        onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                        placeholder="Auto-generated from title"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="excerpt">Excerpt</Label>
                    <Input
                      id="excerpt"
                      value={formData.excerpt}
                      onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                      required
                      placeholder="Short description for the blog post"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Content</Label>
                    <RichTextEditor
                      content={formData.content}
                      onChange={(content) => setFormData({ ...formData, content })}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>Category</Label>
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="sm"
                          onClick={() => setShowNewCategoryInput(!showNewCategoryInput)}
                        >
                          <FolderPlus className="w-3 h-3" />
                        </Button>
                      </div>
                      {showNewCategoryInput ? (
                        <div className="flex gap-2">
                          <Input
                            value={newCategoryName}
                            onChange={(e) => setNewCategoryName(e.target.value)}
                            placeholder="New category"
                            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddNewCategory())}
                          />
                          <Button type="button" size="sm" onClick={handleAddNewCategory}>Add</Button>
                        </div>
                      ) : (
                        <Select
                          value={formData.category}
                          onValueChange={(value) => setFormData({ ...formData, category: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {categories.map(cat => (
                              <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label>Status</Label>
                      <Select
                        value={formData.status}
                        onValueChange={(value) => setFormData({ ...formData, status: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="draft">Draft</SelectItem>
                          <SelectItem value="published">Published</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="reading_time">Reading Time (min)</Label>
                      <Input
                        id="reading_time"
                        type="number"
                        value={formData.reading_time}
                        onChange={(e) => setFormData({ ...formData, reading_time: parseInt(e.target.value) || 5 })}
                      />
                    </div>
                  </div>

                  <MediaPicker
                    label="Featured Image"
                    value={formData.featured_image}
                    onChange={(url) => setFormData({ ...formData, featured_image: url })}
                    placeholder="Select or enter image URL"
                    folder="blog"
                  />

                  <div className="flex justify-end gap-2 pt-4">
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit">
                      {editingPost ? "Update Post" : "Create Post"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Search and Filter Row */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search posts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Filter by category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map(cat => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Bulk Actions */}
        {selectedPosts.length > 0 && (
          <div className="bg-muted/50 rounded-lg p-3 mb-4 flex flex-wrap items-center gap-3">
            <span className="text-sm font-medium">{selectedPosts.length} selected</span>
            <Select onValueChange={handleBulkCategoryChange}>
              <SelectTrigger className="w-[150px] h-8">
                <SelectValue placeholder="Move to..." />
              </SelectTrigger>
              <SelectContent>
                {categories.map(cat => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button 
              variant="destructive" 
              size="sm"
              onClick={handleBulkDelete}
            >
              <Trash2 className="w-3 h-3 mr-1" />
              Delete
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setSelectedPosts([])}
            >
              Clear
            </Button>
            <span className="text-xs text-muted-foreground ml-auto">
              Ctrl+A to select all, Esc to clear
            </span>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        ) : filteredPosts.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">No blog posts found</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40px]">
                    <Checkbox
                      checked={selectedPosts.length === filteredPosts.length && filteredPosts.length > 0}
                      onCheckedChange={toggleSelectAll}
                    />
                  </TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead className="hidden sm:table-cell">Category</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden sm:table-cell">Views</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPosts.map((post) => (
                  <TableRow 
                    key={post.id}
                    className={selectedPosts.includes(post.id) ? "bg-muted/50" : ""}
                  >
                    <TableCell>
                      <Checkbox
                        checked={selectedPosts.includes(post.id)}
                        onCheckedChange={() => toggleSelectPost(post.id)}
                      />
                    </TableCell>
                    <TableCell className="font-medium">
                      <div>
                        {post.title}
                        <span className="sm:hidden block text-xs text-muted-foreground">{post.category}</span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">{post.category}</TableCell>
                    <TableCell>
                      <Badge variant={post.status === "published" ? "default" : "secondary"}>
                        {post.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">{post.view_count}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button size="icon" variant="ghost" className="h-8 w-8" asChild>
                          <a href={`/blog/${post.slug}`} target="_blank">
                            <Eye className="w-4 h-4" />
                          </a>
                        </Button>
                        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => handleEdit(post)}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => handleDelete(post.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};