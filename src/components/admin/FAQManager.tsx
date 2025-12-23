import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useRolePermissions } from "@/hooks/useRolePermissions";
import {
  Loader2, HelpCircle, Plus, Trash2, Pencil, RefreshCw, FolderPlus, ChevronDown, ChevronUp
} from "lucide-react";
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

interface FAQCategory {
  id: string;
  name: string;
  description: string | null;
  display_order: number;
  is_active: boolean;
  created_at: string;
}

interface FAQQuestion {
  id: string;
  category_id: string;
  question: string;
  answer: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
}

export const FAQManager = () => {
  const { hasPermission } = useRolePermissions();
  const canManageSettings = hasPermission('canEditSettings');
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<FAQCategory[]>([]);
  const [questions, setQuestions] = useState<Map<string, FAQQuestion[]>>(new Map());
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  // Category Dialog
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<FAQCategory | null>(null);
  const [categoryForm, setCategoryForm] = useState({ name: "", description: "" });
  const [categoryLoading, setCategoryLoading] = useState(false);

  // Question Dialog
  const [questionDialogOpen, setQuestionDialogOpen] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
  const [editingQuestion, setEditingQuestion] = useState<FAQQuestion | null>(null);
  const [questionForm, setQuestionForm] = useState({ question: "", answer: "" });
  const [questionLoading, setQuestionLoading] = useState(false);

  // Delete Confirmation
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ type: "category" | "question"; id: string; name: string } | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchFAQData = async () => {
    setLoading(true);
    try {
      // Fetch categories
      const { data: categoryData, error: categoryError } = await (supabase as any)
        .from("faq_categories")
        .select("*")
        .order("display_order");

      if (categoryError) throw categoryError;

      setCategories((categoryData || []) as FAQCategory[]);

      // Fetch questions for each category
      const questionMap = new Map<string, FAQQuestion[]>();
      if (categoryData) {
        for (const category of categoryData) {
          const { data: questionData, error: questionError } = await (supabase as any)
            .from("faq_questions")
            .select("*")
            .eq("category_id", category.id)
            .order("display_order");

          if (questionError) throw questionError;
          questionMap.set(category.id, (questionData || []) as FAQQuestion[]);
        }
      }
      setQuestions(questionMap);
    } catch (error: any) {
      console.error("Error fetching FAQ data:", error);
      toast.error("Failed to load FAQ data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFAQData();

    // Real-time subscription
      const channel = supabase
      .channel("admin-faq-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "faq_categories" },
        () => fetchFAQData()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "faq_questions" },
        () => fetchFAQData()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleAddCategory = async () => {
    if (!categoryForm.name.trim()) {
      toast.error("Category name is required");
      return;
    }

    setCategoryLoading(true);
    try {
      const maxOrder = Math.max(0, ...categories.map(c => c.display_order));
      
      if (editingCategory) {
        // Update category
        const { error } = await (supabase as any)
          .from("faq_categories")
          .update({
            name: categoryForm.name,
            description: categoryForm.description || null
          })
          .eq("id", editingCategory.id);

        if (error) throw error;
        toast.success("Category updated successfully");
      } else {
        // Create category
        const { error } = await (supabase as any)
          .from("faq_categories")
          .insert({
            name: categoryForm.name,
            description: categoryForm.description || null,
            display_order: maxOrder + 1,
            is_active: true
          });

        if (error) throw error;
        toast.success("Category added successfully");
      }

      setCategoryDialogOpen(false);
      setCategoryForm({ name: "", description: "" });
      setEditingCategory(null);
      fetchFAQData();
    } catch (error: any) {
      console.error("Error saving category:", error);
      toast.error(error.message || "Failed to save category");
    } finally {
      setCategoryLoading(false);
    }
  };

  const handleAddQuestion = async () => {
    if (!questionForm.question.trim() || !questionForm.answer.trim()) {
      toast.error("Question and answer are required");
      return;
    }

    if (!selectedCategoryId) {
      toast.error("Please select a category");
      return;
    }

    setQuestionLoading(true);
    try {
      const categoryQuestions = questions.get(selectedCategoryId) || [];
      const maxOrder = Math.max(0, ...categoryQuestions.map(q => q.display_order));

      if (editingQuestion) {
        // Update question
        const { error } = await (supabase as any)
          .from("faq_questions")
          .update({
            question: questionForm.question,
            answer: questionForm.answer
          })
          .eq("id", editingQuestion.id);

        if (error) throw error;
        toast.success("Question updated successfully");
      } else {
        // Create question
        const { error } = await (supabase as any)
          .from("faq_questions")
          .insert({
            category_id: selectedCategoryId,
            question: questionForm.question,
            answer: questionForm.answer,
            display_order: maxOrder + 1,
            is_active: true
          });

        if (error) throw error;
        toast.success("Question added successfully");
      }

      setQuestionDialogOpen(false);
      setQuestionForm({ question: "", answer: "" });
      setEditingQuestion(null);
      setSelectedCategoryId("");
      fetchFAQData();
    } catch (error: any) {
      console.error("Error saving question:", error);
      toast.error(error.message || "Failed to save question");
    } finally {
      setQuestionLoading(false);
    }
  };

  const handleDeleteItem = async () => {
    if (!itemToDelete) return;

    setDeleteLoading(true);
    try {
      if (itemToDelete.type === "category") {
        // Delete category and its questions
        const { error: questionsError } = await (supabase as any)
          .from("faq_questions")
          .delete()
          .eq("category_id", itemToDelete.id);

        if (questionsError) throw questionsError;

        const { error: categoryError } = await (supabase as any)
          .from("faq_categories")
          .delete()
          .eq("id", itemToDelete.id);

        if (categoryError) throw categoryError;
        toast.success("Category deleted successfully");
      } else {
        // Delete question
        const { error } = await (supabase as any)
          .from("faq_questions")
          .delete()
          .eq("id", itemToDelete.id);

        if (error) throw error;
        toast.success("Question deleted successfully");
      }

      setDeleteConfirmOpen(false);
      setItemToDelete(null);
      fetchFAQData();
    } catch (error: any) {
      console.error("Error deleting item:", error);
      toast.error("Failed to delete item");
    } finally {
      setDeleteLoading(false);
    }
  };

  const toggleCategoryExpansion = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!canManageSettings) {
    return (
      <Card className="border-destructive">
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <HelpCircle className="w-12 h-12 mx-auto text-destructive mb-3 opacity-50" />
            <h3 className="font-semibold mb-1">Access Denied</h3>
            <p className="text-sm text-muted-foreground">You don't have permission to manage FAQ content.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-primary" />
                FAQ Management
              </CardTitle>
              <CardDescription>
                {categories.length} categories with {Array.from(questions.values()).reduce((a, b) => a + b.length, 0)} questions
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={fetchFAQData}>
                <RefreshCw className="w-4 h-4 mr-1" />
                Refresh
              </Button>
              <Button size="sm" onClick={() => {
                setCategoryDialogOpen(true);
                setEditingCategory(null);
                setCategoryForm({ name: "", description: "" });
              }}>
                <FolderPlus className="w-4 h-4 mr-1" />
                Add Category
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {categories.length === 0 ? (
            <div className="text-center py-12">
              <HelpCircle className="w-12 h-12 mx-auto text-muted-foreground mb-3 opacity-50" />
              <p className="text-muted-foreground mb-4">No FAQ categories yet. Start by creating one!</p>
              <Button onClick={() => {
                setCategoryDialogOpen(true);
                setEditingCategory(null);
                setCategoryForm({ name: "", description: "" });
              }}>
                <FolderPlus className="w-4 h-4 mr-1" />
                Create First Category
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {categories.map((category) => (
                <div key={category.id} className="border rounded-lg">
                  <div className="flex items-center justify-between p-4 hover:bg-muted/30 cursor-pointer" onClick={() => toggleCategoryExpansion(category.id)}>
                    <div className="flex items-center gap-3 flex-1">
                      {expandedCategories.has(category.id) ? (
                        <ChevronUp className="w-4 h-4 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-muted-foreground" />
                      )}
                      <div>
                        <h3 className="font-semibold">{category.name}</h3>
                        {category.description && (
                          <p className="text-sm text-muted-foreground">{category.description}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{(questions.get(category.id) || []).length} Q&A</Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-green-600 hover:text-green-700"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingCategory(category);
                          setCategoryForm({ name: category.name, description: category.description || "" });
                          setCategoryDialogOpen(true);
                        }}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-blue-600 hover:text-blue-700"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedCategoryId(category.id);
                          setEditingQuestion(null);
                          setQuestionForm({ question: "", answer: "" });
                          setQuestionDialogOpen(true);
                        }}
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          setItemToDelete({ type: "category", id: category.id, name: category.name });
                          setDeleteConfirmOpen(true);
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Questions List */}
                  {expandedCategories.has(category.id) && (
                    <div className="bg-muted/30 border-t">
                      {(questions.get(category.id) || []).length === 0 ? (
                        <div className="p-4 text-center text-muted-foreground text-sm">
                          No questions in this category. Add one using the + button above.
                        </div>
                      ) : (
                        <div className="divide-y">
                          {(questions.get(category.id) || []).map((question) => (
                            <div key={question.id} className="p-4">
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex-1">
                                  <h4 className="font-medium mb-2">{question.question}</h4>
                                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{question.answer}</p>
                                </div>
                                <div className="flex gap-1">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-green-600 hover:text-green-700"
                                    onClick={() => {
                                      setEditingQuestion(question);
                                      setSelectedCategoryId(category.id);
                                      setQuestionForm({ question: question.question, answer: question.answer });
                                      setQuestionDialogOpen(true);
                                    }}
                                  >
                                    <Pencil className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-destructive hover:text-destructive"
                                    onClick={() => {
                                      setItemToDelete({ type: "question", id: question.id, name: question.question });
                                      setDeleteConfirmOpen(true);
                                    }}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Category Dialog */}
      <Dialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? "Edit Category" : "Add New Category"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="category-name">Category Name *</Label>
              <Input
                id="category-name"
                value={categoryForm.name}
                onChange={(e) => setCategoryForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Shipping, Returns, Billing"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category-description">Description</Label>
              <Textarea
                id="category-description"
                value={categoryForm.description}
                onChange={(e) => setCategoryForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Optional description for this category"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCategoryDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddCategory} disabled={categoryLoading}>
              {categoryLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {editingCategory ? "Update" : "Add"} Category
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Question Dialog */}
      <Dialog open={questionDialogOpen} onOpenChange={setQuestionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingQuestion ? "Edit Question" : "Add New Question"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Category</Label>
              <div className="text-sm font-medium p-2 bg-muted rounded">
                {categories.find(c => c.id === selectedCategoryId)?.name || "Select a category"}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="question">Question *</Label>
              <Input
                id="question"
                value={questionForm.question}
                onChange={(e) => setQuestionForm(prev => ({ ...prev, question: e.target.value }))}
                placeholder="e.g., How long does shipping take?"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="answer">Answer *</Label>
              <Textarea
                id="answer"
                value={questionForm.answer}
                onChange={(e) => setQuestionForm(prev => ({ ...prev, answer: e.target.value }))}
                placeholder="Provide a detailed answer"
                rows={5}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setQuestionDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddQuestion} disabled={questionLoading}>
              {questionLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {editingQuestion ? "Update" : "Add"} Question
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {itemToDelete?.type === "category" ? "Category" : "Question"}</AlertDialogTitle>
            <AlertDialogDescription>
              {itemToDelete?.type === "category"
                ? `Are you sure you want to delete "${itemToDelete.name}" and all its questions? This action cannot be undone.`
                : `Are you sure you want to delete this question? This action cannot be undone.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteItem}
              disabled={deleteLoading}
              className="bg-destructive hover:bg-destructive/90"
            >
              {deleteLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
