import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Plus, Pencil, Trash2, Bell, Eye, Image } from "lucide-react";
import { MediaPicker } from "./MediaPicker";

interface PopupNotification {
  id: string;
  title: string;
  title_ar?: string;
  description?: string;
  description_ar?: string;
  image_url?: string;
  button_text?: string;
  button_text_ar?: string;
  button_link?: string;
  is_active: boolean;
  start_date?: string;
  end_date?: string;
  display_frequency: string;
  created_at: string;
}

export const PopupManager = () => {
  const [popups, setPopups] = useState<PopupNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPopup, setEditingPopup] = useState<Partial<PopupNotification> | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  const fetchPopups = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('popup_notifications')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setPopups(data || []);
    } catch (error) {
      toast.error('Failed to load popups');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    fetchPopups(); 

    // Real-time subscription for popups
    const channel = supabase
      .channel('admin-popups-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'popup_notifications' },
        () => {
          fetchPopups();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleSave = async () => {
    if (!editingPopup?.title) { 
      toast.error('Title is required'); 
      return; 
    }
    
    setSaving(true);
    try {
      const popupData = {
        title: editingPopup.title,
        title_ar: editingPopup.title_ar || null,
        description: editingPopup.description || null,
        description_ar: editingPopup.description_ar || null,
        image_url: editingPopup.image_url || null,
        button_text: editingPopup.button_text || null,
        button_text_ar: editingPopup.button_text_ar || null,
        button_link: editingPopup.button_link || null,
        is_active: editingPopup.is_active || false,
        start_date: editingPopup.start_date || null,
        end_date: editingPopup.end_date || null,
        display_frequency: editingPopup.display_frequency || 'once_per_session',
      };

      if (editingPopup.id) {
        const { error } = await supabase
          .from('popup_notifications')
          .update(popupData)
          .eq('id', editingPopup.id);
        if (error) throw error;
        toast.success('Popup updated');
      } else {
        const { error } = await supabase
          .from('popup_notifications')
          .insert(popupData);
        if (error) throw error;
        toast.success('Popup created');
      }

      setIsDialogOpen(false);
      setEditingPopup(null);
      fetchPopups();
    } catch (error) {
      toast.error('Failed to save popup');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this popup?')) return;
    
    try {
      const { error } = await supabase
        .from('popup_notifications')
        .delete()
        .eq('id', id);
      if (error) throw error;
      toast.success('Popup deleted');
      fetchPopups();
    } catch (error) {
      toast.error('Failed to delete popup');
    }
  };

  const openNewPopup = () => {
    setEditingPopup({
      title: '',
      is_active: false,
      display_frequency: 'once_per_session'
    });
    setIsDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-primary" />
              Promotional Popups
            </CardTitle>
            <Button onClick={openNewPopup}>
              <Plus className="w-4 h-4 mr-2" />
              New Popup
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Preview</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Frequency</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Dates</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {popups.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No popups created yet
                    </TableCell>
                  </TableRow>
                ) : (
                  popups.map((popup) => (
                    <TableRow key={popup.id}>
                      <TableCell>
                        {popup.image_url ? (
                          <img src={popup.image_url} alt="" className="w-16 h-12 object-cover rounded" />
                        ) : (
                          <div className="w-16 h-12 bg-muted rounded flex items-center justify-center">
                            <Image className="w-4 h-4 text-muted-foreground" />
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="font-medium">{popup.title}</TableCell>
                      <TableCell className="capitalize">
                        {popup.display_frequency.replace(/_/g, ' ')}
                      </TableCell>
                      <TableCell>
                        <Badge variant={popup.is_active ? "default" : "secondary"}>
                          {popup.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {popup.start_date ? new Date(popup.start_date).toLocaleDateString() : 'No start'} - 
                        {popup.end_date ? new Date(popup.end_date).toLocaleDateString() : 'No end'}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setEditingPopup(popup);
                              setPreviewOpen(true);
                            }}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setEditingPopup(popup);
                              setIsDialogOpen(true);
                            }}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(popup.id)}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingPopup?.id ? 'Edit Popup' : 'Create Popup'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Title (English)</Label>
                <Input
                  value={editingPopup?.title || ''}
                  onChange={(e) => setEditingPopup(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter title"
                />
              </div>
              <div className="space-y-2">
                <Label>Title (Arabic)</Label>
                <Input
                  value={editingPopup?.title_ar || ''}
                  onChange={(e) => setEditingPopup(prev => ({ ...prev, title_ar: e.target.value }))}
                  placeholder="أدخل العنوان"
                  dir="rtl"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Description (English)</Label>
                <Textarea
                  value={editingPopup?.description || ''}
                  onChange={(e) => setEditingPopup(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Enter description"
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label>Description (Arabic)</Label>
                <Textarea
                  value={editingPopup?.description_ar || ''}
                  onChange={(e) => setEditingPopup(prev => ({ ...prev, description_ar: e.target.value }))}
                  placeholder="أدخل الوصف"
                  dir="rtl"
                  rows={3}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Popup Image</Label>
              <MediaPicker
                value={editingPopup?.image_url || ''}
                onChange={(url) => setEditingPopup(prev => ({ ...prev, image_url: url }))}
                label="Select Image"
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Button Text</Label>
                <Input
                  value={editingPopup?.button_text || ''}
                  onChange={(e) => setEditingPopup(prev => ({ ...prev, button_text: e.target.value }))}
                  placeholder="Shop Now"
                />
              </div>
              <div className="space-y-2">
                <Label>Button Text (Arabic)</Label>
                <Input
                  value={editingPopup?.button_text_ar || ''}
                  onChange={(e) => setEditingPopup(prev => ({ ...prev, button_text_ar: e.target.value }))}
                  placeholder="تسوق الآن"
                  dir="rtl"
                />
              </div>
              <div className="space-y-2">
                <Label>Button Link</Label>
                <Input
                  value={editingPopup?.button_link || ''}
                  onChange={(e) => setEditingPopup(prev => ({ ...prev, button_link: e.target.value }))}
                  placeholder="/shop"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Display Frequency</Label>
                <Select
                  value={editingPopup?.display_frequency || 'once_per_session'}
                  onValueChange={(value) => setEditingPopup(prev => ({ ...prev, display_frequency: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="once_per_session">Once Per Session</SelectItem>
                    <SelectItem value="every_visit">Every Visit</SelectItem>
                    <SelectItem value="once_per_day">Once Per Day</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Start Date</Label>
                <Input
                  type="datetime-local"
                  value={editingPopup?.start_date?.slice(0, 16) || ''}
                  onChange={(e) => setEditingPopup(prev => ({ ...prev, start_date: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>End Date</Label>
                <Input
                  type="datetime-local"
                  value={editingPopup?.end_date?.slice(0, 16) || ''}
                  onChange={(e) => setEditingPopup(prev => ({ ...prev, end_date: e.target.value }))}
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Switch
                checked={editingPopup?.is_active || false}
                onCheckedChange={(checked) => setEditingPopup(prev => ({ ...prev, is_active: checked }))}
              />
              <Label>Active</Label>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Save Popup
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-lg">
          <div className="text-center space-y-4">
            {editingPopup?.image_url && (
              <img 
                src={editingPopup.image_url} 
                alt="" 
                className="w-full h-48 object-cover rounded-lg"
              />
            )}
            <h2 className="text-2xl font-bold">{editingPopup?.title}</h2>
            {editingPopup?.description && (
              <p className="text-muted-foreground">{editingPopup.description}</p>
            )}
            {editingPopup?.button_text && (
              <Button className="w-full">
                {editingPopup.button_text}
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
