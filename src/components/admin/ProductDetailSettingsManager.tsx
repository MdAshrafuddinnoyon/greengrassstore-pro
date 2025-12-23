import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Save, Plus, Trash2, Truck, Shield, RotateCcw, CreditCard, GripVertical } from "lucide-react";
import { MediaPicker } from "./MediaPicker";

interface TrustBadge {
  id: string;
  icon: string;
  title: string;
  titleAr: string;
  subtitle: string;
  subtitleAr: string;
  enabled: boolean;
  order: number;
}

interface ProductDetailSettings {
  showTrustBadges: boolean;
  showWhatsAppButton: boolean;
  showPaymentBanner: boolean;
  paymentBannerImage: string;
  paymentBannerLink: string;
  trustBadges: TrustBadge[];
}

const iconOptions = [
  { value: 'truck', label: 'Truck (Shipping)', icon: Truck },
  { value: 'shield', label: 'Shield (Security)', icon: Shield },
  { value: 'rotate', label: 'Rotate (Returns)', icon: RotateCcw },
  { value: 'credit-card', label: 'Credit Card (Payment)', icon: CreditCard },
];

export const ProductDetailSettingsManager = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<ProductDetailSettings>({
    showTrustBadges: true,
    showWhatsAppButton: true,
    showPaymentBanner: false,
    paymentBannerImage: "",
    paymentBannerLink: "",
    trustBadges: [
      { id: '1', icon: 'truck', title: 'Free Shipping', titleAr: 'شحن مجاني', subtitle: 'Over AED 200', subtitleAr: 'فوق 200 درهم', enabled: true, order: 1 },
      { id: '2', icon: 'shield', title: 'Secure Payment', titleAr: 'دفع آمن', subtitle: '100% Protected', subtitleAr: 'محمي 100%', enabled: true, order: 2 },
      { id: '3', icon: 'rotate', title: 'Easy Returns', titleAr: 'إرجاع سهل', subtitle: '14 Days', subtitleAr: '14 يوم', enabled: true, order: 3 },
    ],
  });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data } = await supabase
          .from('site_settings')
          .select('setting_value')
          .eq('setting_key', 'product_detail_settings')
          .single();

        if (data?.setting_value) {
          setSettings(data.setting_value as unknown as ProductDetailSettings);
        }
      } catch (error) {
        console.error('Error fetching product detail settings:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data: existing } = await supabase
        .from('site_settings')
        .select('id')
        .eq('setting_key', 'product_detail_settings')
        .maybeSingle();

      if (existing) {
        await supabase
          .from('site_settings')
          .update({ setting_value: JSON.parse(JSON.stringify(settings)) })
          .eq('setting_key', 'product_detail_settings');
      } else {
        await supabase
          .from('site_settings')
          .insert({ setting_key: 'product_detail_settings', setting_value: JSON.parse(JSON.stringify(settings)) });
      }
      toast.success('Product detail settings saved');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const addTrustBadge = () => {
    const newBadge: TrustBadge = {
      id: Date.now().toString(),
      icon: 'truck',
      title: 'New Badge',
      titleAr: 'شارة جديدة',
      subtitle: 'Description',
      subtitleAr: 'الوصف',
      enabled: true,
      order: settings.trustBadges.length + 1,
    };
    setSettings(prev => ({
      ...prev,
      trustBadges: [...prev.trustBadges, newBadge],
    }));
  };

  const updateTrustBadge = (id: string, field: keyof TrustBadge, value: string | boolean | number) => {
    setSettings(prev => ({
      ...prev,
      trustBadges: prev.trustBadges.map(badge =>
        badge.id === id ? { ...badge, [field]: value } : badge
      ),
    }));
  };

  const removeTrustBadge = (id: string) => {
    setSettings(prev => ({
      ...prev,
      trustBadges: prev.trustBadges.filter(badge => badge.id !== id),
    }));
  };

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'truck': return Truck;
      case 'shield': return Shield;
      case 'rotate': return RotateCcw;
      case 'credit-card': return CreditCard;
      default: return Truck;
    }
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
          <CardTitle>Product Detail Page Settings</CardTitle>
          <CardDescription>
            Customize trust badges, WhatsApp button, and payment banner on product pages
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Toggle Options */}
          <div className="grid gap-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <Label className="font-medium">Show Trust Badges</Label>
                <p className="text-sm text-muted-foreground">Display trust badges below add to cart</p>
              </div>
              <Switch
                checked={settings.showTrustBadges}
                onCheckedChange={(checked) => setSettings(prev => ({ ...prev, showTrustBadges: checked }))}
              />
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <Label className="font-medium">Show WhatsApp Button</Label>
                <p className="text-sm text-muted-foreground">Display order via WhatsApp button</p>
              </div>
              <Switch
                checked={settings.showWhatsAppButton}
                onCheckedChange={(checked) => setSettings(prev => ({ ...prev, showWhatsAppButton: checked }))}
              />
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <Label className="font-medium">Show Payment Banner</Label>
                <p className="text-sm text-muted-foreground">Display payment gateway banner image</p>
              </div>
              <Switch
                checked={settings.showPaymentBanner}
                onCheckedChange={(checked) => setSettings(prev => ({ ...prev, showPaymentBanner: checked }))}
              />
            </div>
          </div>

          {/* Payment Banner */}
          {settings.showPaymentBanner && (
            <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
              <Label className="font-medium">Payment Banner</Label>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Banner Image</Label>
                  <MediaPicker
                    value={settings.paymentBannerImage}
                    onChange={(url) => setSettings(prev => ({ ...prev, paymentBannerImage: url }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Banner Link (optional)</Label>
                  <Input
                    value={settings.paymentBannerLink}
                    onChange={(e) => setSettings(prev => ({ ...prev, paymentBannerLink: e.target.value }))}
                    placeholder="https://..."
                  />
                </div>
              </div>
            </div>
          )}

          {/* Trust Badges */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="font-medium">Trust Badges</Label>
              <Button variant="outline" size="sm" onClick={addTrustBadge}>
                <Plus className="w-4 h-4 mr-1" /> Add Badge
              </Button>
            </div>

            <div className="space-y-3">
              {settings.trustBadges.map((badge) => {
                const IconComponent = getIcon(badge.icon);
                return (
                  <div key={badge.id} className="p-4 border rounded-lg space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <GripVertical className="w-4 h-4 text-muted-foreground" />
                        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                          <IconComponent className="w-5 h-5 text-primary" />
                        </div>
                        <span className="font-medium">{badge.title}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={badge.enabled}
                          onCheckedChange={(checked) => updateTrustBadge(badge.id, 'enabled', checked)}
                        />
                        <Button variant="ghost" size="icon" onClick={() => removeTrustBadge(badge.id)}>
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs">Icon</Label>
                        <select
                          value={badge.icon}
                          onChange={(e) => updateTrustBadge(badge.id, 'icon', e.target.value)}
                          className="w-full px-3 py-2 border rounded-md text-sm"
                        >
                          {iconOptions.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Title (EN)</Label>
                        <Input
                          value={badge.title}
                          onChange={(e) => updateTrustBadge(badge.id, 'title', e.target.value)}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Title (AR)</Label>
                        <Input
                          value={badge.titleAr}
                          onChange={(e) => updateTrustBadge(badge.id, 'titleAr', e.target.value)}
                          dir="rtl"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Subtitle (EN)</Label>
                        <Input
                          value={badge.subtitle}
                          onChange={(e) => updateTrustBadge(badge.id, 'subtitle', e.target.value)}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Subtitle (AR)</Label>
                        <Input
                          value={badge.subtitleAr}
                          onChange={(e) => updateTrustBadge(badge.id, 'subtitleAr', e.target.value)}
                          dir="rtl"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <Button onClick={handleSave} disabled={saving} className="w-full">
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Save Settings
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
