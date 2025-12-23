import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Save, Plus, Trash2, GripVertical, Image as ImageIcon, Play, Pause } from "lucide-react";
import { MediaPicker } from "./MediaPicker";

interface HeroSlide {
  id: string;
  title: string;
  titleAr: string;
  subtitle: string;
  subtitleAr: string;
  description: string;
  descriptionAr: string;
  buttonText: string;
  buttonTextAr: string;
  buttonLink: string;
  backgroundImage: string;
  order: number;
}

interface HeroSliderSettings {
  enabled: boolean;
  autoPlay: boolean;
  autoPlayInterval: number;
  slides: HeroSlide[];
}

export const HeroSliderManager = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<HeroSliderSettings>({
    enabled: true,
    autoPlay: true,
    autoPlayInterval: 5000,
    slides: [{
      id: '1',
      title: 'Bring Nature',
      titleAr: 'أحضر الطبيعة',
      subtitle: 'Into Your Home',
      subtitleAr: 'إلى منزلك',
      description: 'Discover our premium collection of plants, pots, and home décor.',
      descriptionAr: 'اكتشف مجموعتنا المميزة من النباتات والأواني.',
      buttonText: 'Shop Now',
      buttonTextAr: 'تسوق الآن',
      buttonLink: '/shop',
      backgroundImage: '',
      order: 1
    }]
  });

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('site_settings')
        .select('*')
        .eq('setting_key', 'hero_slider')
        .maybeSingle();

      if (error) throw error;
      
      if (data?.setting_value) {
        setSettings(data.setting_value as unknown as HeroSliderSettings);
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
      // Create a clean object for saving
      const settingsToSave = {
        enabled: settings.enabled,
        autoPlay: settings.autoPlay,
        autoPlayInterval: settings.autoPlayInterval,
        slides: settings.slides.map(slide => ({
          id: slide.id,
          title: slide.title,
          titleAr: slide.titleAr,
          subtitle: slide.subtitle,
          subtitleAr: slide.subtitleAr,
          description: slide.description,
          descriptionAr: slide.descriptionAr,
          buttonText: slide.buttonText,
          buttonTextAr: slide.buttonTextAr,
          buttonLink: slide.buttonLink,
          backgroundImage: slide.backgroundImage,
          order: slide.order
        }))
      };

      const { data: existing } = await supabase
        .from('site_settings')
        .select('id')
        .eq('setting_key', 'hero_slider')
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from('site_settings')
          .update({ 
            setting_value: settingsToSave,
            updated_at: new Date().toISOString()
          })
          .eq('setting_key', 'hero_slider');
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('site_settings')
          .insert({ 
            setting_key: 'hero_slider', 
            setting_value: settingsToSave 
          });
        if (error) throw error;
      }
      
      toast.success('Hero slider settings saved successfully!');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const addSlide = () => {
    const newSlide: HeroSlide = {
      id: Date.now().toString(),
      title: 'New Slide',
      titleAr: 'شريحة جديدة',
      subtitle: 'Subtitle Here',
      subtitleAr: 'العنوان الفرعي',
      description: 'Add your description here',
      descriptionAr: 'أضف وصفك هنا',
      buttonText: 'Shop Now',
      buttonTextAr: 'تسوق الآن',
      buttonLink: '/shop',
      backgroundImage: '',
      order: settings.slides.length + 1
    };
    setSettings(prev => ({
      ...prev,
      slides: [...prev.slides, newSlide]
    }));
  };

  const removeSlide = (id: string) => {
    if (settings.slides.length <= 1) {
      toast.error('At least one slide is required');
      return;
    }
    setSettings(prev => ({
      ...prev,
      slides: prev.slides.filter(s => s.id !== id)
    }));
  };

  const updateSlide = (id: string, field: keyof HeroSlide, value: string | number) => {
    setSettings(prev => ({
      ...prev,
      slides: prev.slides.map(s => 
        s.id === id ? { ...s, [field]: value } : s
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
            <ImageIcon className="w-5 h-5 text-primary" />
            Hero Slider Settings
          </CardTitle>
          <CardDescription>
            Configure hero banner slides and animation settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* General Settings */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted/30 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <Label>Enable Hero Section</Label>
                <p className="text-xs text-muted-foreground">Show/hide hero</p>
              </div>
              <Switch
                checked={settings.enabled}
                onCheckedChange={(checked) => setSettings(prev => ({ ...prev, enabled: checked }))}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label>Auto Play</Label>
                <p className="text-xs text-muted-foreground">Automatic slide transition</p>
              </div>
              <Switch
                checked={settings.autoPlay}
                onCheckedChange={(checked) => setSettings(prev => ({ ...prev, autoPlay: checked }))}
              />
            </div>

            <div className="space-y-2">
              <Label>Interval (ms)</Label>
              <Input
                type="number"
                value={settings.autoPlayInterval}
                onChange={(e) => setSettings(prev => ({ ...prev, autoPlayInterval: parseInt(e.target.value) || 5000 }))}
                min={2000}
                max={10000}
                step={500}
              />
            </div>
          </div>

          {/* Slides */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Slides ({settings.slides.length})</h3>
              <Button onClick={addSlide} size="sm">
                <Plus className="w-4 h-4 mr-1" />
                Add Slide
              </Button>
            </div>

            {settings.slides.map((slide, index) => (
              <Card key={slide.id} className="border-l-4 border-l-primary">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <GripVertical className="w-4 h-4 text-muted-foreground cursor-move" />
                      <span className="font-medium">Slide {index + 1}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeSlide(slide.id)}
                      className="text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Background Image */}
                  <MediaPicker
                    label="Background Image"
                    value={slide.backgroundImage}
                    onChange={(url) => updateSlide(slide.id, 'backgroundImage', url)}
                    placeholder="Select or enter image URL"
                    folder="sliders"
                  />

                  {/* Titles */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Title (EN)</Label>
                      <Input
                        value={slide.title}
                        onChange={(e) => updateSlide(slide.id, 'title', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Title (AR)</Label>
                      <Input
                        value={slide.titleAr}
                        onChange={(e) => updateSlide(slide.id, 'titleAr', e.target.value)}
                        dir="rtl"
                      />
                    </div>
                  </div>

                  {/* Subtitles */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Subtitle (EN)</Label>
                      <Input
                        value={slide.subtitle}
                        onChange={(e) => updateSlide(slide.id, 'subtitle', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Subtitle (AR)</Label>
                      <Input
                        value={slide.subtitleAr}
                        onChange={(e) => updateSlide(slide.id, 'subtitleAr', e.target.value)}
                        dir="rtl"
                      />
                    </div>
                  </div>

                  {/* Descriptions */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Description (EN)</Label>
                      <Textarea
                        value={slide.description}
                        onChange={(e) => updateSlide(slide.id, 'description', e.target.value)}
                        rows={2}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Description (AR)</Label>
                      <Textarea
                        value={slide.descriptionAr}
                        onChange={(e) => updateSlide(slide.id, 'descriptionAr', e.target.value)}
                        rows={2}
                        dir="rtl"
                      />
                    </div>
                  </div>

                  {/* Button */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Button Text (EN)</Label>
                      <Input
                        value={slide.buttonText}
                        onChange={(e) => updateSlide(slide.id, 'buttonText', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Button Text (AR)</Label>
                      <Input
                        value={slide.buttonTextAr}
                        onChange={(e) => updateSlide(slide.id, 'buttonTextAr', e.target.value)}
                        dir="rtl"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Button Link</Label>
                      <Input
                        value={slide.buttonLink}
                        onChange={(e) => updateSlide(slide.id, 'buttonLink', e.target.value)}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Button onClick={saveSettings} disabled={saving} className="w-full">
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Save Hero Slider Settings
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
