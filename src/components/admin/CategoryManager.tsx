import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Loader2, FolderTree, RefreshCw, Plus, Pencil, Trash2, ChevronRight, ChevronDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MediaPicker } from "./MediaPicker";

interface Category {
  id: string;
  name: string;
  name_ar?: string;
  slug: string;
  description?: string;
  image_url?: string;
  is_active: boolean;
  display_order: number;
  parent_id?: string | null;
}

export const CategoryManager = () => {
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [formData, setFormData] = useState({
    name: "",
    name_ar: "",
    slug: "",
    description: "",
    image_url: "",
    is_active: true,
    display_order: 0,
    parent_id: "" as string | null,
  });

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('display_order', { ascending: true });

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast.error('Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // Get parent categories (no parent_id)
  const parentCategories = categories.filter(c => !c.parent_id);
  
  // Get subcategories for a parent
  const getSubcategories = (parentId: string) => {
    return categories.filter(c => c.parent_id === parentId);
  };

  const filteredCategories = parentCategories.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.slug.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const dataToSave = {
        ...formData,
        parent_id: formData.parent_id || null,
      };

      if (editingCategory) {
        const { error } = await supabase
          .from('categories')
          .update(dataToSave)
          .eq('id', editingCategory.id);
        
        if (error) throw error;
        toast.success('Category updated');
      } else {
        const { error } = await supabase
          .from('categories')
          .insert([dataToSave]);
        
        if (error) throw error;
        toast.success('Category created');
      }
      
      setIsDialogOpen(false);
      setEditingCategory(null);
      setFormData({ name: "", name_ar: "", slug: "", description: "", image_url: "", is_active: true, display_order: 0, parent_id: null });
      fetchCategories();
    } catch (error: any) {
      toast.error(error.message || 'Failed to save category');
    }
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      name_ar: category.name_ar || "",
      slug: category.slug,
      description: category.description || "",
      image_url: category.image_url || "",
      is_active: category.is_active,
      display_order: category.display_order,
      parent_id: category.parent_id || null,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    // Check if category has subcategories
    const subcats = getSubcategories(id);
    if (subcats.length > 0) {
      toast.error('Cannot delete category with subcategories. Delete subcategories first.');
      return;
    }
    
    if (!confirm('Are you sure you want to delete this category?')) return;
    
    try {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      toast.success('Category deleted');
      fetchCategories();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete category');
    }
  };

  const generateSlug = (name: string) => {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  };

  const toggleExpand = (id: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedCategories(newExpanded);
  };

  const openAddSubcategory = (parentId: string) => {
    setEditingCategory(null);
    setFormData({
      name: "",
      name_ar: "",
      slug: "",
      description: "",
      image_url: "",
      is_active: true,
      display_order: categories.length,
      parent_id: parentId,
    });
    setIsDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const renderCategoryRow = (category: Category, isSubcategory: boolean = false) => {
    const subcats = getSubcategories(category.id);
    const hasSubcategories = subcats.length > 0;
    const isExpanded = expandedCategories.has(category.id);

    return (
      <>
        <TableRow key={category.id} className={isSubcategory ? "bg-muted/30" : ""}>
          <TableCell>
            <div className={`flex items-center gap-2 ${isSubcategory ? "pl-6" : ""}`}>
              {!isSubcategory && (
                <button
                  onClick={() => toggleExpand(category.id)}
                  className="p-1 hover:bg-muted rounded"
                  title={hasSubcategories ? (isExpanded ? "Collapse" : "Expand") : "No subcategories"}
                >
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronRight className={`w-4 h-4 ${!hasSubcategories ? 'opacity-30' : ''}`} />
                  )}
                </button>
              )}
              {isSubcategory && <div className="w-2" />}
              {category.image_url ? (
                <img 
                  src={category.image_url} 
                  alt={category.name}
                  className="w-10 h-10 object-cover rounded"
                />
              ) : (
                <div className="w-10 h-10 bg-muted rounded flex items-center justify-center">
                  <FolderTree className="w-4 h-4 text-muted-foreground" />
                </div>
              )}
            </div>
          </TableCell>
          <TableCell>
            <div className="flex flex-col">
              <span className="font-medium">{category.name}</span>
              {category.name_ar && (
                <span className="text-xs text-muted-foreground" dir="rtl">{category.name_ar}</span>
              )}
              {isSubcategory && (
                <Badge variant="outline" className="w-fit mt-1 text-xs">Subcategory</Badge>
              )}
              {!isSubcategory && (
                <span className="text-xs text-muted-foreground">
                  {subcats.length} subcategories
                </span>
              )}
            </div>
          </TableCell>
          <TableCell>
            <Badge variant="outline" className="font-mono text-xs">
              {category.slug}
            </Badge>
          </TableCell>
          <TableCell>
            <Badge variant={category.is_active ? "default" : "secondary"}>
              {category.is_active ? "Active" : "Inactive"}
            </Badge>
          </TableCell>
          <TableCell>{category.display_order}</TableCell>
          <TableCell className="text-right">
            <div className="flex justify-end gap-1">
              {!isSubcategory && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openAddSubcategory(category.id)}
                  title="Add subcategory"
                  className="gap-1 text-xs bg-primary/10 hover:bg-primary/20 border-primary/30"
                >
                  <Plus className="w-3 h-3" />
                  <span className="hidden sm:inline">Add Sub</span>
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleEdit(category)}
              >
                <Pencil className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDelete(category.id)}
              >
                <Trash2 className="w-4 h-4 text-destructive" />
              </Button>
            </div>
          </TableCell>
        </TableRow>
        {/* Render subcategories if expanded */}
        {!isSubcategory && isExpanded && (
          <>
            {subcats.map(subcat => renderCategoryRow(subcat, true))}
            {/* Add subcategory row at the end */}
            <TableRow className="bg-primary/5 border-dashed">
              <TableCell colSpan={6}>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => openAddSubcategory(category.id)}
                  className="w-full gap-2 text-primary hover:text-primary hover:bg-primary/10"
                >
                  <Plus className="w-4 h-4" />
                  Add New Subcategory to "{category.name}"
                </Button>
              </TableCell>
            </TableRow>
          </>
        )}
      </>
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FolderTree className="w-5 h-5 text-primary" />
                Categories
              </CardTitle>
              <CardDescription>
                {parentCategories.length} main categories, {categories.length - parentCategories.length} subcategories
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={fetchCategories}>
                <RefreshCw className="w-4 h-4 mr-1" />
                Refresh
              </Button>
              <Dialog open={isDialogOpen} onOpenChange={(open) => {
                setIsDialogOpen(open);
                if (!open) {
                  setEditingCategory(null);
                  setFormData({ name: "", name_ar: "", slug: "", description: "", image_url: "", is_active: true, display_order: 0, parent_id: null });
                }
              }}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="w-4 h-4 mr-1" />
                    Add Category
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg">
                  <DialogHeader>
                    <DialogTitle>
                      {editingCategory ? 'Edit Category' : formData.parent_id ? 'Add Subcategory' : 'Add Category'}
                    </DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Parent Category Selection */}
                    <div className="space-y-2">
                      <Label>Parent Category (leave empty for main category)</Label>
                      <Select 
                        value={formData.parent_id || "_none_"} 
                        onValueChange={(v) => setFormData({ ...formData, parent_id: v === "_none_" ? null : v })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="None (Main Category)" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="_none_">None (Main Category)</SelectItem>
                          {parentCategories
                            .filter(c => c.id !== editingCategory?.id)
                            .map(cat => (
                              <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                            ))
                          }
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Name (English)</Label>
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) => {
                            const name = e.target.value;
                            setFormData({ 
                              ...formData, 
                              name,
                              slug: editingCategory ? formData.slug : generateSlug(name)
                            });
                          }}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="name_ar">Name (Arabic)</Label>
                        <Input
                          id="name_ar"
                          value={formData.name_ar}
                          onChange={(e) => setFormData({ ...formData, name_ar: e.target.value })}
                          dir="rtl"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="slug">Slug</Label>
                      <Input
                        id="slug"
                        value={formData.slug}
                        onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Category Image</Label>
                      <MediaPicker
                        value={formData.image_url}
                        onChange={(url) => setFormData({ ...formData, image_url: url })}
                        folder="categories"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="display_order">Display Order</Label>
                        <Input
                          id="display_order"
                          type="number"
                          value={formData.display_order}
                          onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
                        />
                      </div>
                      <div className="flex items-center gap-2 pt-6">
                        <Switch
                          id="is_active"
                          checked={formData.is_active}
                          onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                        />
                        <Label htmlFor="is_active">Active</Label>
                      </div>
                    </div>

                    <Button type="submit" className="w-full">
                      {editingCategory ? 'Update Category' : 'Create Category'}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Search */}
          <div className="mb-4">
            <Input
              placeholder="Search categories..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Table */}
          <div className="rounded-lg border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="w-20">Image</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Order</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCategories.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <FolderTree className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                      <p className="text-muted-foreground">No categories found</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCategories.map((category) => renderCategoryRow(category))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
