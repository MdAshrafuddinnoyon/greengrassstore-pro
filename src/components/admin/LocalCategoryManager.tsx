import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, FolderTree, Plus, Pencil, Trash2, Save, RefreshCw } from "lucide-react";
import { MediaPicker } from "./MediaPicker";
import { ExportButtons } from "./ExportButtons";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

interface Category {
  id: string;
  name: string;
  name_ar: string | null;
  slug: string;
  description: string | null;
  description_ar: string | null;
  image: string | null;
  parent_id: string | null;
  is_active: boolean;
  display_order: number;
}

export const LocalCategoryManager = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Partial<Category> | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Bulk Selection
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

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

    // Real-time subscription for categories
    const channel = supabase
      .channel('admin-categories-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'categories' },
        () => {
          fetchCategories();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleSave = async () => {
    if (!editingCategory?.name) {
      toast.error('Category name is required');
      return;
    }

    setSaving(true);
    try {
      const slug = editingCategory.slug || editingCategory.name.toLowerCase().replace(/\s+/g, '-');
      
      if (editingCategory.id) {
        const { error } = await supabase
          .from('categories')
          .update({
            name: editingCategory.name,
            name_ar: editingCategory.name_ar,
            slug,
            description: editingCategory.description,
            description_ar: editingCategory.description_ar,
            image: editingCategory.image,
            is_active: editingCategory.is_active ?? true,
            display_order: editingCategory.display_order || 0
          })
          .eq('id', editingCategory.id);
        
        if (error) throw error;
        toast.success('Category updated');
      } else {
        const { error } = await supabase
          .from('categories')
          .insert({
            name: editingCategory.name,
            name_ar: editingCategory.name_ar,
            slug,
            description: editingCategory.description,
            description_ar: editingCategory.description_ar,
            image: editingCategory.image,
            is_active: editingCategory.is_active ?? true,
            display_order: editingCategory.display_order || categories.length + 1
          });
        
        if (error) throw error;
        toast.success('Category created');
      }

      setIsDialogOpen(false);
      setEditingCategory(null);
      fetchCategories();
    } catch (error: any) {
      console.error('Error saving category:', error);
      toast.error(error.message || 'Failed to save category');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
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
      console.error('Error deleting category:', error);
      toast.error(error.message || 'Failed to delete category');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!confirm(`Are you sure you want to delete ${selectedIds.length} categories?`)) return;
    
    try {
      const { error } = await supabase.from('categories').delete().in('id', selectedIds);
      if (error) throw error;
      toast.success(`${selectedIds.length} categories deleted`);
      setSelectedIds([]);
      fetchCategories();
    } catch (error) {
      toast.error('Failed to delete categories');
    }
  };

  const handleBulkActivate = async (activate: boolean) => {
    if (selectedIds.length === 0) return;
    
    try {
      const { error } = await supabase
        .from('categories')
        .update({ is_active: activate })
        .in('id', selectedIds);
      if (error) throw error;
      toast.success(`${selectedIds.length} categories ${activate ? 'activated' : 'deactivated'}`);
      setSelectedIds([]);
      fetchCategories();
    } catch (error) {
      toast.error('Failed to update categories');
    }
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setIsDialogOpen(true);
  };

  const handleAdd = () => {
    setEditingCategory({
      name: '',
      name_ar: '',
      slug: '',
      description: '',
      image: '',
      is_active: true,
      display_order: categories.length + 1
    });
    setIsDialogOpen(true);
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === paginatedCategories.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(paginatedCategories.map(c => c.id));
    }
  };

  const toggleSelectOne = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(i => i !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const filteredCategories = categories.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.slug.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Pagination
  const totalPages = Math.ceil(filteredCategories.length / itemsPerPage);
  const paginatedCategories = filteredCategories.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FolderTree className="w-5 h-5 text-primary" />
                Category Management
              </CardTitle>
              <CardDescription>
                {categories.length} categories
              </CardDescription>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button variant="outline" size="sm" onClick={fetchCategories}>
                <RefreshCw className="w-4 h-4 mr-1" />
                Refresh
              </Button>
              <ExportButtons 
                data={categories} 
                filename={`categories-${new Date().toISOString().split('T')[0]}`}
              />
              <Button onClick={handleAdd}>
                <Plus className="w-4 h-4 mr-1" />
                Add Category
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between mb-4">
            <Input
              placeholder="Search categories..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
            <div className="flex gap-2 items-center">
              <span className="text-sm text-muted-foreground">Show:</span>
              <Select value={itemsPerPage.toString()} onValueChange={(v) => { setItemsPerPage(Number(v)); setCurrentPage(1); }}>
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Bulk Actions */}
          {selectedIds.length > 0 && (
            <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg mb-4">
              <span className="text-sm font-medium">{selectedIds.length} selected</span>
              <Button size="sm" variant="outline" onClick={() => handleBulkActivate(true)}>
                Activate
              </Button>
              <Button size="sm" variant="outline" onClick={() => handleBulkActivate(false)}>
                Deactivate
              </Button>
              <Button size="sm" variant="destructive" onClick={handleBulkDelete}>
                <Trash2 className="w-4 h-4 mr-1" />
                Delete
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setSelectedIds([])}>
                Clear
              </Button>
            </div>
          )}

          <div className="rounded-lg border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="w-12">
                    <Checkbox 
                      checked={selectedIds.length === paginatedCategories.length && paginatedCategories.length > 0}
                      onCheckedChange={toggleSelectAll}
                    />
                  </TableHead>
                  <TableHead>Order</TableHead>
                  <TableHead>Image</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedCategories.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <FolderTree className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                      <p className="text-muted-foreground">No categories found</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedCategories.map((category) => (
                    <TableRow key={category.id}>
                      <TableCell>
                        <Checkbox 
                          checked={selectedIds.includes(category.id)}
                          onCheckedChange={() => toggleSelectOne(category.id)}
                        />
                      </TableCell>
                      <TableCell>{category.display_order}</TableCell>
                      <TableCell>
                        {category.image ? (
                          <img 
                            src={category.image} 
                            alt={category.name}
                            className="w-12 h-12 object-cover rounded"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-muted rounded flex items-center justify-center">
                            <FolderTree className="w-5 h-5 text-muted-foreground" />
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{category.name}</div>
                        {category.name_ar && (
                          <div className="text-sm text-muted-foreground" dir="rtl">{category.name_ar}</div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-mono text-xs">
                          {category.slug}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={category.is_active ? "default" : "secondary"}>
                          {category.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
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
                            className="text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-muted-foreground">
                Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredCategories.length)} of {filteredCategories.length}
              </p>
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious 
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                    />
                  </PaginationItem>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    return (
                      <PaginationItem key={pageNum}>
                        <PaginationLink
                          onClick={() => setCurrentPage(pageNum)}
                          isActive={currentPage === pageNum}
                          className="cursor-pointer"
                        >
                          {pageNum}
                        </PaginationLink>
                      </PaginationItem>
                    );
                  })}
                  <PaginationItem>
                    <PaginationNext 
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingCategory?.id ? 'Edit Category' : 'Add Category'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <MediaPicker
              label="Category Image"
              value={editingCategory?.image || ''}
              onChange={(url) => setEditingCategory(prev => ({ ...prev, image: url }))}
              folder="categories"
            />

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Name (EN) *</Label>
                <Input
                  value={editingCategory?.name || ''}
                  onChange={(e) => setEditingCategory(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Category name"
                />
              </div>
              <div className="space-y-2">
                <Label>Name (AR)</Label>
                <Input
                  value={editingCategory?.name_ar || ''}
                  onChange={(e) => setEditingCategory(prev => ({ ...prev, name_ar: e.target.value }))}
                  placeholder="اسم الفئة"
                  dir="rtl"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Slug</Label>
              <Input
                value={editingCategory?.slug || ''}
                onChange={(e) => setEditingCategory(prev => ({ ...prev, slug: e.target.value }))}
                placeholder="category-slug (auto-generated if empty)"
              />
            </div>

            <div className="space-y-2">
              <Label>Display Order</Label>
              <Input
                type="number"
                value={editingCategory?.display_order || 0}
                onChange={(e) => setEditingCategory(prev => ({ ...prev, display_order: parseInt(e.target.value) || 0 }))}
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
              <Label>Active</Label>
              <Switch
                checked={editingCategory?.is_active ?? true}
                onCheckedChange={(checked) => setEditingCategory(prev => ({ ...prev, is_active: checked }))}
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                Save
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};