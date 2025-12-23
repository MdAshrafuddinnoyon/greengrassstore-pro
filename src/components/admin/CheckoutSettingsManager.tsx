import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { 
  Loader2, 
  Save, 
  ShoppingCart, 
  CreditCard, 
  Truck, 
  FileText,
  CheckCircle,
  Shield,
  RotateCcw,
  Package,
  Plus,
  Trash2,
  GripVertical
} from "lucide-react";

interface CheckoutTrustBadge {
  id: string;
  icon: string;
  text: string;
  textAr: string;
  enabled: boolean;
}

interface CheckoutSettings {
  // Layout
  layout: 'single-column' | 'two-column';
  showOrderSummary: boolean;
  showProductImages: boolean;
  
  // Form Fields
  requireAddress: boolean;
  requireCity: boolean;
  requireEmail: boolean;
  showNotes: boolean;
  
  // Trust & Security
  showTrustBadges: boolean;
  trustBadges: CheckoutTrustBadge[];
  
  // Order Summary
  showSubtotal: boolean;
  showShipping: boolean;
  showDiscount: boolean;
  
  // Terms
  requireTerms: boolean;
  termsText: string;
  termsTextAr: string;
  termsLink: string;
  
  // Thank You Page
  thankYouTitle: string;
  thankYouTitleAr: string;
  thankYouMessage: string;
  thankYouMessageAr: string;
  showOrderTracking: boolean;
  showContinueShopping: boolean;
}

const defaultSettings: CheckoutSettings = {
  layout: 'two-column',
  showOrderSummary: true,
  showProductImages: true,
  
  requireAddress: true,
  requireCity: true,
  requireEmail: false,
  showNotes: true,
  
  showTrustBadges: true,
  trustBadges: [
    { id: '1', icon: 'shield', text: 'Secure Checkout', textAr: 'دفع آمن', enabled: true },
    { id: '2', icon: 'truck', text: 'Fast Delivery', textAr: 'توصيل سريع', enabled: true },
    { id: '3', icon: 'rotate', text: 'Easy Returns', textAr: 'إرجاع سهل', enabled: true },
  ],
  
  showSubtotal: true,
  showShipping: true,
  showDiscount: true,
  
  requireTerms: true,
  termsText: 'I agree to the Terms of Service and Privacy Policy',
  termsTextAr: 'أوافق على شروط الخدمة وسياسة الخصوصية',
  termsLink: '/terms-of-service',
  
  thankYouTitle: 'Thank You for Your Order!',
  thankYouTitleAr: 'شكراً لطلبك!',
  thankYouMessage: 'Your order has been placed successfully. You will receive an email confirmation shortly.',
  thankYouMessageAr: 'تم تقديم طلبك بنجاح. ستتلقى رسالة تأكيد بالبريد الإلكتروني قريباً.',
  showOrderTracking: true,
  showContinueShopping: true,
};

const iconOptions = [
  { value: 'shield', label: 'Shield (Security)' },
  { value: 'truck', label: 'Truck (Shipping)' },
  { value: 'rotate', label: 'Rotate (Returns)' },
  { value: 'package', label: 'Package' },
  { value: 'check', label: 'Check' },
  { value: 'credit-card', label: 'Credit Card' },
];

export const CheckoutSettingsManager = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<CheckoutSettings>(defaultSettings);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data } = await supabase
          .from('site_settings')
          .select('setting_value')
          .eq('setting_key', 'checkout_settings')
          .single();

        if (data?.setting_value) {
          setSettings({ ...defaultSettings, ...data.setting_value as any });
        }
      } catch (error) {
        console.error('Error fetching checkout settings:', error);
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
        .eq('setting_key', 'checkout_settings')
        .maybeSingle();

      if (existing) {
        await supabase
          .from('site_settings')
          .update({ setting_value: JSON.parse(JSON.stringify(settings)) })
          .eq('setting_key', 'checkout_settings');
      } else {
        await supabase
          .from('site_settings')
          .insert({ setting_key: 'checkout_settings', setting_value: JSON.parse(JSON.stringify(settings)) });
      }
      toast.success('Checkout settings saved');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const addTrustBadge = () => {
    const newBadge: CheckoutTrustBadge = {
      id: Date.now().toString(),
      icon: 'check',
      text: 'New Badge',
      textAr: 'شارة جديدة',
      enabled: true,
    };
    setSettings(prev => ({
      ...prev,
      trustBadges: [...prev.trustBadges, newBadge],
    }));
  };

  const updateTrustBadge = (id: string, field: keyof CheckoutTrustBadge, value: any) => {
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
      case 'shield': return Shield;
      case 'truck': return Truck;
      case 'rotate': return RotateCcw;
      case 'package': return Package;
      case 'check': return CheckCircle;
      case 'credit-card': return CreditCard;
      default: return CheckCircle;
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
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-primary" />
            Checkout Page Settings
          </CardTitle>
          <CardDescription>
            Customize the checkout page layout, form fields, and thank you page
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="layout" className="space-y-6">
            <TabsList className="grid grid-cols-4 w-full">
              <TabsTrigger value="layout">Layout</TabsTrigger>
              <TabsTrigger value="form">Form Fields</TabsTrigger>
              <TabsTrigger value="trust">Trust Badges</TabsTrigger>
              <TabsTrigger value="thankyou">Thank You</TabsTrigger>
            </TabsList>

            {/* Layout Tab */}
            <TabsContent value="layout" className="space-y-4">
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label>Page Layout</Label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="layout"
                        checked={settings.layout === 'two-column'}
                        onChange={() => setSettings(prev => ({ ...prev, layout: 'two-column' }))}
                        className="w-4 h-4"
                      />
                      <span>Two Column</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="layout"
                        checked={settings.layout === 'single-column'}
                        onChange={() => setSettings(prev => ({ ...prev, layout: 'single-column' }))}
                        className="w-4 h-4"
                      />
                      <span>Single Column</span>
                    </label>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <Label className="font-medium">Show Order Summary</Label>
                    <p className="text-sm text-muted-foreground">Display order items summary</p>
                  </div>
                  <Switch
                    checked={settings.showOrderSummary}
                    onCheckedChange={(checked) => setSettings(prev => ({ ...prev, showOrderSummary: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <Label className="font-medium">Show Product Images</Label>
                    <p className="text-sm text-muted-foreground">Display product thumbnails in cart</p>
                  </div>
                  <Switch
                    checked={settings.showProductImages}
                    onCheckedChange={(checked) => setSettings(prev => ({ ...prev, showProductImages: checked }))}
                  />
                </div>
              </div>
            </TabsContent>

            {/* Form Fields Tab */}
            <TabsContent value="form" className="space-y-4">
              <div className="grid gap-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <Label className="font-medium">Require Email</Label>
                    <p className="text-sm text-muted-foreground">Make email field mandatory</p>
                  </div>
                  <Switch
                    checked={settings.requireEmail}
                    onCheckedChange={(checked) => setSettings(prev => ({ ...prev, requireEmail: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <Label className="font-medium">Require Address</Label>
                    <p className="text-sm text-muted-foreground">Make address field mandatory</p>
                  </div>
                  <Switch
                    checked={settings.requireAddress}
                    onCheckedChange={(checked) => setSettings(prev => ({ ...prev, requireAddress: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <Label className="font-medium">Require City</Label>
                    <p className="text-sm text-muted-foreground">Make city field mandatory</p>
                  </div>
                  <Switch
                    checked={settings.requireCity}
                    onCheckedChange={(checked) => setSettings(prev => ({ ...prev, requireCity: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <Label className="font-medium">Show Notes Field</Label>
                    <p className="text-sm text-muted-foreground">Allow customers to add order notes</p>
                  </div>
                  <Switch
                    checked={settings.showNotes}
                    onCheckedChange={(checked) => setSettings(prev => ({ ...prev, showNotes: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <Label className="font-medium">Require Terms Agreement</Label>
                    <p className="text-sm text-muted-foreground">Require accepting terms before checkout</p>
                  </div>
                  <Switch
                    checked={settings.requireTerms}
                    onCheckedChange={(checked) => setSettings(prev => ({ ...prev, requireTerms: checked }))}
                  />
                </div>

                {settings.requireTerms && (
                  <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
                    <div className="space-y-2">
                      <Label>Terms Text (EN)</Label>
                      <Input
                        value={settings.termsText}
                        onChange={(e) => setSettings(prev => ({ ...prev, termsText: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Terms Text (AR)</Label>
                      <Input
                        value={settings.termsTextAr}
                        onChange={(e) => setSettings(prev => ({ ...prev, termsTextAr: e.target.value }))}
                        dir="rtl"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Terms Link</Label>
                      <Input
                        value={settings.termsLink}
                        onChange={(e) => setSettings(prev => ({ ...prev, termsLink: e.target.value }))}
                        placeholder="/terms-of-service"
                      />
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Trust Badges Tab */}
            <TabsContent value="trust" className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <Label className="font-medium">Show Trust Badges</Label>
                  <p className="text-sm text-muted-foreground">Display trust indicators on checkout</p>
                </div>
                <Switch
                  checked={settings.showTrustBadges}
                  onCheckedChange={(checked) => setSettings(prev => ({ ...prev, showTrustBadges: checked }))}
                />
              </div>

              {settings.showTrustBadges && (
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
                        <div key={badge.id} className="p-4 border rounded-lg">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <GripVertical className="w-4 h-4 text-muted-foreground" />
                              <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                                <IconComponent className="w-4 h-4 text-primary" />
                              </div>
                              <span className="font-medium text-sm">{badge.text}</span>
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
                          <div className="grid grid-cols-3 gap-3">
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
                              <Label className="text-xs">Text (EN)</Label>
                              <Input
                                value={badge.text}
                                onChange={(e) => updateTrustBadge(badge.id, 'text', e.target.value)}
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">Text (AR)</Label>
                              <Input
                                value={badge.textAr}
                                onChange={(e) => updateTrustBadge(badge.id, 'textAr', e.target.value)}
                                dir="rtl"
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </TabsContent>

            {/* Thank You Tab */}
            <TabsContent value="thankyou" className="space-y-4">
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label>Title (EN)</Label>
                  <Input
                    value={settings.thankYouTitle}
                    onChange={(e) => setSettings(prev => ({ ...prev, thankYouTitle: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Title (AR)</Label>
                  <Input
                    value={settings.thankYouTitleAr}
                    onChange={(e) => setSettings(prev => ({ ...prev, thankYouTitleAr: e.target.value }))}
                    dir="rtl"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Message (EN)</Label>
                  <Textarea
                    value={settings.thankYouMessage}
                    onChange={(e) => setSettings(prev => ({ ...prev, thankYouMessage: e.target.value }))}
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Message (AR)</Label>
                  <Textarea
                    value={settings.thankYouMessageAr}
                    onChange={(e) => setSettings(prev => ({ ...prev, thankYouMessageAr: e.target.value }))}
                    dir="rtl"
                    rows={3}
                  />
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <Label className="font-medium">Show Order Tracking Button</Label>
                    <p className="text-sm text-muted-foreground">Display track order button</p>
                  </div>
                  <Switch
                    checked={settings.showOrderTracking}
                    onCheckedChange={(checked) => setSettings(prev => ({ ...prev, showOrderTracking: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <Label className="font-medium">Show Continue Shopping Button</Label>
                    <p className="text-sm text-muted-foreground">Display continue shopping button</p>
                  </div>
                  <Switch
                    checked={settings.showContinueShopping}
                    onCheckedChange={(checked) => setSettings(prev => ({ ...prev, showContinueShopping: checked }))}
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <Button onClick={handleSave} disabled={saving} className="w-full mt-6">
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Save Checkout Settings
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
