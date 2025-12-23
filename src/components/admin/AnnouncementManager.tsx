import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Megaphone, Save, RefreshCw, Plus, Trash2, GripVertical, Eye, EyeOff } from "lucide-react";

interface Announcement {
  id: string;
  text: string;
  textAr: string;
  link: string;
  isActive: boolean;
  order: number;
}

interface AnnouncementBarSettings {
  enabled: boolean;
  backgroundColor: string;
  textColor: string;
  autoRotate: boolean;
  rotationSpeed: number;
  announcements: Announcement[];
}

export const AnnouncementManager = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [settings, setSettings] = useState<AnnouncementBarSettings>({
    enabled: true,
    backgroundColor: "#3d3d35",
    textColor: "#ffffff",
    autoRotate: true,
    rotationSpeed: 5000,
    announcements: [
      { id: '1', text: 'Shop Now, Pay Later With Tabby', textAr: 'تسوق الآن وادفع لاحقاً مع تابي', link: '', isActive: true, order: 1 },
      { id: '2', text: 'Free Delivery on Orders Above AED 200', textAr: 'توصيل مجاني للطلبات فوق 200 درهم', link: '', isActive: true, order: 2 },
    ]
  });

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('site_settings')
        .select('*')
        .eq('setting_key', 'announcement_bar')
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      if (data) {
        setSettings(data.setting_value as unknown as AnnouncementBarSettings);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const saveSettings = async () => {
    setSaving(true);
    try {
      const { data: existing } = await supabase
        .from('site_settings')
        .select('id')
        .eq('setting_key', 'announcement_bar')
        .single();

      if (existing) {
        const { error } = await supabase
          .from('site_settings')
          .update({ setting_value: JSON.parse(JSON.stringify(settings)) })
          .eq('setting_key', 'announcement_bar');
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('site_settings')
          .insert({ setting_key: 'announcement_bar', setting_value: JSON.parse(JSON.stringify(settings)) });
        if (error) throw error;
      }
      
      toast.success('Announcement settings saved');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const addAnnouncement = () => {
    const newAnnouncement: Announcement = {
      id: Date.now().toString(),
      text: 'New Announcement',
      textAr: 'إعلان جديد',
      link: '',
      isActive: true,
      order: settings.announcements.length + 1
    };
    setSettings(prev => ({
      ...prev,
      announcements: [...prev.announcements, newAnnouncement]
    }));
  };

  const removeAnnouncement = (id: string) => {
    setSettings(prev => ({
      ...prev,
      announcements: prev.announcements.filter(a => a.id !== id)
    }));
  };

  const updateAnnouncement = (id: string, field: keyof Announcement, value: string | boolean | number) => {
    setSettings(prev => ({
      ...prev,
      announcements: prev.announcements.map(a =>
        a.id === id ? { ...a, [field]: value } : a
      )
    }));
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
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Megaphone className="w-5 h-5 text-primary" />
            Announcement Bar
          </CardTitle>
          <CardDescription>
            Manage the top announcement bar messages
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Main Settings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                <div>
                  <Label>Enable Announcement Bar</Label>
                  <p className="text-sm text-muted-foreground">Show/hide the top bar</p>
                </div>
                <Switch
                  checked={settings.enabled}
                  onCheckedChange={(checked) => 
                    setSettings(prev => ({ ...prev, enabled: checked }))
                  }
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                <div>
                  <Label>Auto Rotate</Label>
                  <p className="text-sm text-muted-foreground">Automatically cycle messages</p>
                </div>
                <Switch
                  checked={settings.autoRotate}
                  onCheckedChange={(checked) => 
                    setSettings(prev => ({ ...prev, autoRotate: checked }))
                  }
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Background Color</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={settings.backgroundColor}
                      onChange={(e) => setSettings(prev => ({ ...prev, backgroundColor: e.target.value }))}
                      className="w-12 h-10 p-1"
                    />
                    <Input
                      value={settings.backgroundColor}
                      onChange={(e) => setSettings(prev => ({ ...prev, backgroundColor: e.target.value }))}
                      className="flex-1"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Text Color</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={settings.textColor}
                      onChange={(e) => setSettings(prev => ({ ...prev, textColor: e.target.value }))}
                      className="w-12 h-10 p-1"
                    />
                    <Input
                      value={settings.textColor}
                      onChange={(e) => setSettings(prev => ({ ...prev, textColor: e.target.value }))}
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>

              {settings.autoRotate && (
                <div className="space-y-2">
                  <Label>Rotation Speed (ms)</Label>
                  <Input
                    type="number"
                    value={settings.rotationSpeed}
                    onChange={(e) => setSettings(prev => ({ ...prev, rotationSpeed: parseInt(e.target.value) || 5000 }))}
                    min={1000}
                    max={30000}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Preview */}
          <div 
            className="p-3 rounded-lg text-center text-sm"
            style={{ 
              backgroundColor: settings.backgroundColor, 
              color: settings.textColor 
            }}
          >
            {settings.announcements.find(a => a.isActive)?.text || "No active announcements"}
          </div>

          {/* Announcements List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Announcements</h4>
              <Badge variant="outline">
                {settings.announcements.filter(a => a.isActive).length} Active
              </Badge>
            </div>

            {settings.announcements.map((announcement, index) => (
              <div 
                key={announcement.id} 
                className={`p-4 rounded-lg border ${announcement.isActive ? 'bg-white border-primary/20' : 'bg-muted/30 border-muted'}`}
              >
                <div className="flex items-start gap-3">
                  <GripVertical className="w-4 h-4 text-muted-foreground mt-3 cursor-move" />
                  <span className="text-sm text-muted-foreground mt-2.5 w-6">{index + 1}</span>
                  
                  <div className="flex-1 space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <Input
                        value={announcement.text}
                        onChange={(e) => updateAnnouncement(announcement.id, 'text', e.target.value)}
                        placeholder="Text (English)"
                      />
                      <Input
                        value={announcement.textAr}
                        onChange={(e) => updateAnnouncement(announcement.id, 'textAr', e.target.value)}
                        placeholder="Text (Arabic)"
                        dir="rtl"
                      />
                    </div>
                    <Input
                      value={announcement.link}
                      onChange={(e) => updateAnnouncement(announcement.id, 'link', e.target.value)}
                      placeholder="Link URL (optional)"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => updateAnnouncement(announcement.id, 'isActive', !announcement.isActive)}
                      className={announcement.isActive ? 'text-primary' : 'text-muted-foreground'}
                    >
                      {announcement.isActive ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeAnnouncement(announcement.id)}
                      className="text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}

            <Button variant="outline" onClick={addAnnouncement} className="w-full">
              <Plus className="w-4 h-4 mr-2" />
              Add Announcement
            </Button>
          </div>

          <div className="flex gap-2">
            <Button onClick={saveSettings} disabled={saving} className="flex-1">
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              Save Settings
            </Button>
            <Button variant="outline" onClick={fetchSettings}>
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};