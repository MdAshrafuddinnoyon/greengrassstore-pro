import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, MessageSquare, Bot, Store, Save, RefreshCw, Truck, RotateCcw, CreditCard, MapPin, Plus, Trash2, Percent } from "lucide-react";
import { ChatbotManager } from "./ChatbotManager";

interface WhatsAppSettings {
  phone: string;
  enabled: boolean;
  welcomeMessage: string;
}

interface SalesAgentSettings {
  enabled: boolean;
  name: string;
  responses: Record<string, string>;
}

interface StoreInfo {
  name: string;
  email: string;
  phone: string;
  address: string;
}

interface FooterFeature {
  id: string;
  icon: string;
  title: string;
  titleAr: string;
  description: string;
  descriptionAr: string;
  enabled: boolean;
}

interface TaxSettings {
  enabled: boolean;
  rate: number;
  label: string;
  includedInPrice: boolean;
}

interface ShippingZone {
  id: string;
  name: string;
  regions: string[];
  cost: number;
  enabled: boolean;
}

interface ShippingSettings {
  freeShippingEnabled: boolean;
  freeShippingThreshold: number;
  freeShippingMinItems: number;
  shippingCost: number;
  shippingLabel: string;
  shippingLabelAr: string;
  showProgressBar: boolean;
  zones: ShippingZone[];
}

const iconOptions = [
  { value: 'truck', label: 'Truck (Delivery)', icon: Truck },
  { value: 'rotate', label: 'Rotate (Returns)', icon: RotateCcw },
  { value: 'credit-card', label: 'Credit Card (Payment)', icon: CreditCard },
  { value: 'map-pin', label: 'Map Pin (Location)', icon: MapPin },
  { value: 'percent', label: 'Percent (Discount)', icon: Percent },
];

export const SiteSettingsManager = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [whatsappSettings, setWhatsappSettings] = useState<WhatsAppSettings>({
    phone: "+971547751901",
    enabled: true,
    welcomeMessage: "Hello! Welcome to Green Grass Store. How can we help you today?"
  });

  const [salesAgentSettings, setSalesAgentSettings] = useState<SalesAgentSettings>({
    enabled: true,
    name: "Sales Assistant",
    responses: {}
  });

  const [storeInfo, setStoreInfo] = useState<StoreInfo>({
    name: "Green Grass Store",
    email: "info@greengrassstore.com",
    phone: "+971547751901",
    address: "Dubai, UAE"
  });

  const [footerFeatures, setFooterFeatures] = useState<FooterFeature[]>([
    { id: '1', icon: 'truck', title: 'Free Delivery', titleAr: 'توصيل مجاني', description: 'Free Delivery On Orders Over 300 AED', descriptionAr: 'توصيل مجاني للطلبات فوق 300 درهم', enabled: true },
    { id: '2', icon: 'rotate', title: 'Hassle-Free Returns', titleAr: 'إرجاع سهل', description: 'Within 7 days of delivery.', descriptionAr: 'خلال 7 أيام من التسليم', enabled: true },
    { id: '3', icon: 'credit-card', title: 'Easy Installments', titleAr: 'أقساط سهلة', description: 'Pay Later with tabby.', descriptionAr: 'ادفع لاحقاً مع تابي', enabled: true },
    { id: '4', icon: 'map-pin', title: 'Visit Us In-Store', titleAr: 'زورنا في المتجر', description: 'In Abu Dhabi and Dubai.', descriptionAr: 'في أبوظبي ودبي', enabled: true },
  ]);

  const [taxSettings, setTaxSettings] = useState<TaxSettings>({
    enabled: false,
    rate: 5,
    label: "VAT",
    includedInPrice: true
  });

  const [shippingSettings, setShippingSettings] = useState<ShippingSettings>({
    freeShippingEnabled: true,
    freeShippingThreshold: 200,
    freeShippingMinItems: 0,
    shippingCost: 25,
    shippingLabel: "Shipping",
    shippingLabelAr: "الشحن",
    showProgressBar: true,
    zones: []
  });

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('site_settings')
        .select('*');

      if (error) throw error;

      data?.forEach((setting) => {
        const value = setting.setting_value as Record<string, unknown>;
        if (setting.setting_key === 'whatsapp') {
          setWhatsappSettings(value as unknown as WhatsAppSettings);
        } else if (setting.setting_key === 'sales_agent') {
          setSalesAgentSettings(value as unknown as SalesAgentSettings);
        } else if (setting.setting_key === 'store_info') {
          setStoreInfo(value as unknown as StoreInfo);
        } else if (setting.setting_key === 'footer_features') {
          setFooterFeatures(value as unknown as FooterFeature[]);
        } else if (setting.setting_key === 'tax_settings') {
          setTaxSettings(value as unknown as TaxSettings);
        } else if (setting.setting_key === 'shipping_settings') {
          setShippingSettings(value as unknown as ShippingSettings);
        }
      });
    } catch (error) {
      console.error('Error fetching settings:', error);
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();

    // Real-time subscription for site settings
    const channel = supabase
      .channel('admin-site-settings-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'site_settings' },
        () => {
          fetchSettings();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const saveSettings = async (key: string, value: object) => {
    setSaving(true);
    try {
      const { data: existing } = await supabase
        .from('site_settings')
        .select('id')
        .eq('setting_key', key)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from('site_settings')
          .update({ setting_value: JSON.parse(JSON.stringify(value)), updated_at: new Date().toISOString() })
          .eq('setting_key', key);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('site_settings')
          .insert({ setting_key: key, setting_value: JSON.parse(JSON.stringify(value)) });
        if (error) throw error;
      }
      toast.success('Settings saved successfully');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const addFooterFeature = () => {
    setFooterFeatures([...footerFeatures, {
      id: Date.now().toString(),
      icon: 'truck',
      title: 'New Feature',
      titleAr: 'ميزة جديدة',
      description: 'Feature description',
      descriptionAr: 'وصف الميزة',
      enabled: true
    }]);
  };

  const removeFooterFeature = (id: string) => {
    setFooterFeatures(footerFeatures.filter(f => f.id !== id));
  };

  const updateFooterFeature = (id: string, field: keyof FooterFeature, value: string | boolean) => {
    setFooterFeatures(footerFeatures.map(f => f.id === id ? { ...f, [field]: value } : f));
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
      <Tabs defaultValue="whatsapp" className="space-y-4">
        <TabsList className="flex flex-wrap gap-1 h-auto p-1">
          <TabsTrigger value="whatsapp" className="gap-2">
            <MessageSquare className="w-4 h-4" />
            WhatsApp
          </TabsTrigger>
          <TabsTrigger value="sales-agent" className="gap-2">
            <Bot className="w-4 h-4" />
            Sales Agent
          </TabsTrigger>
          <TabsTrigger value="store" className="gap-2">
            <Store className="w-4 h-4" />
            Store Info
          </TabsTrigger>
          <TabsTrigger value="footer" className="gap-2">
            <Truck className="w-4 h-4" />
            Footer Features
          </TabsTrigger>
          <TabsTrigger value="tax" className="gap-2">
            <Percent className="w-4 h-4" />
            Tax
          </TabsTrigger>
          <TabsTrigger value="shipping" className="gap-2">
            <Truck className="w-4 h-4" />
            Shipping
          </TabsTrigger>
        </TabsList>

        {/* WhatsApp Settings */}
        <TabsContent value="whatsapp">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-green-500" />
                WhatsApp Settings
              </CardTitle>
              <CardDescription>
                Configure WhatsApp chat widget and order functionality
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Enable WhatsApp</Label>
                  <p className="text-sm text-muted-foreground">Show WhatsApp chat button</p>
                </div>
                <Switch
                  checked={whatsappSettings.enabled}
                  onCheckedChange={(checked) => 
                    setWhatsappSettings(prev => ({ ...prev, enabled: checked }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="whatsapp-phone">WhatsApp Phone Number</Label>
                <Input
                  id="whatsapp-phone"
                  value={whatsappSettings.phone}
                  onChange={(e) => 
                    setWhatsappSettings(prev => ({ ...prev, phone: e.target.value }))
                  }
                  placeholder="+971XXXXXXXXX"
                />
                <p className="text-xs text-muted-foreground">
                  Include country code (e.g., +971 for UAE)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="welcome-message">Welcome Message</Label>
                <Textarea
                  id="welcome-message"
                  value={whatsappSettings.welcomeMessage}
                  onChange={(e) => 
                    setWhatsappSettings(prev => ({ ...prev, welcomeMessage: e.target.value }))
                  }
                  rows={3}
                />
              </div>

              <Button 
                onClick={() => saveSettings('whatsapp', whatsappSettings)}
                disabled={saving}
                className="w-full"
              >
                {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                Save WhatsApp Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sales Agent Settings - AI Chatbot */}
        <TabsContent value="sales-agent">
          <ChatbotManager />
        </TabsContent>

        {/* Store Info */}
        <TabsContent value="store">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Store className="w-5 h-5 text-primary" />
                Store Information
              </CardTitle>
              <CardDescription>
                Basic store information for invoices and contact
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="store-name">Store Name</Label>
                  <Input
                    id="store-name"
                    value={storeInfo.name}
                    onChange={(e) => 
                      setStoreInfo(prev => ({ ...prev, name: e.target.value }))
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="store-email">Email</Label>
                  <Input
                    id="store-email"
                    type="email"
                    value={storeInfo.email}
                    onChange={(e) => 
                      setStoreInfo(prev => ({ ...prev, email: e.target.value }))
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="store-phone">Phone</Label>
                  <Input
                    id="store-phone"
                    value={storeInfo.phone}
                    onChange={(e) => 
                      setStoreInfo(prev => ({ ...prev, phone: e.target.value }))
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="store-address">Address</Label>
                  <Input
                    id="store-address"
                    value={storeInfo.address}
                    onChange={(e) => 
                      setStoreInfo(prev => ({ ...prev, address: e.target.value }))
                    }
                  />
                </div>
              </div>

              <Button 
                onClick={() => saveSettings('store_info', storeInfo)}
                disabled={saving}
                className="w-full"
              >
                {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                Save Store Info
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Footer Features */}
        <TabsContent value="footer">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="w-5 h-5 text-primary" />
                Footer Features
              </CardTitle>
              <CardDescription>
                Manage footer feature icons and text (Free Delivery, Returns, etc.)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {footerFeatures.map((feature, index) => (
                <div key={feature.id} className="border rounded-lg p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Feature #{index + 1}</span>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={feature.enabled}
                        onCheckedChange={(c) => updateFooterFeature(feature.id, 'enabled', c)}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive"
                        onClick={() => removeFooterFeature(feature.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Icon</Label>
                      <Select 
                        value={feature.icon} 
                        onValueChange={(v) => updateFooterFeature(feature.id, 'icon', v)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {iconOptions.map(opt => (
                            <SelectItem key={opt.value} value={opt.value}>
                              <span className="flex items-center gap-2">
                                <opt.icon className="w-4 h-4" />
                                {opt.label}
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Title (EN)</Label>
                      <Input
                        value={feature.title}
                        onChange={(e) => updateFooterFeature(feature.id, 'title', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Title (AR)</Label>
                      <Input
                        value={feature.titleAr}
                        onChange={(e) => updateFooterFeature(feature.id, 'titleAr', e.target.value)}
                        dir="rtl"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Description (EN)</Label>
                      <Input
                        value={feature.description}
                        onChange={(e) => updateFooterFeature(feature.id, 'description', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label>Description (AR)</Label>
                      <Input
                        value={feature.descriptionAr}
                        onChange={(e) => updateFooterFeature(feature.id, 'descriptionAr', e.target.value)}
                        dir="rtl"
                      />
                    </div>
                  </div>
                </div>
              ))}

              <Button variant="outline" onClick={addFooterFeature} className="w-full">
                <Plus className="w-4 h-4 mr-2" />
                Add Feature
              </Button>

              <Button 
                onClick={() => saveSettings('footer_features', footerFeatures)}
                disabled={saving}
                className="w-full"
              >
                {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                Save Footer Features
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tax Settings */}
        <TabsContent value="tax">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Percent className="w-5 h-5 text-primary" />
                Tax Settings
              </CardTitle>
              <CardDescription>
                Configure VAT and tax settings for checkout
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                <div>
                  <Label>Enable Tax</Label>
                  <p className="text-sm text-muted-foreground">Apply tax to orders</p>
                </div>
                <Switch
                  checked={taxSettings.enabled}
                  onCheckedChange={(checked) => 
                    setTaxSettings(prev => ({ ...prev, enabled: checked }))
                  }
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tax Label</Label>
                  <Input
                    value={taxSettings.label}
                    onChange={(e) => setTaxSettings(prev => ({ ...prev, label: e.target.value }))}
                    placeholder="VAT"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Tax Rate (%)</Label>
                  <Input
                    type="number"
                    value={taxSettings.rate}
                    onChange={(e) => setTaxSettings(prev => ({ ...prev, rate: parseFloat(e.target.value) || 0 }))}
                    placeholder="5"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                <div>
                  <Label>Tax Included in Price</Label>
                  <p className="text-sm text-muted-foreground">Prices already include tax</p>
                </div>
                <Switch
                  checked={taxSettings.includedInPrice}
                  onCheckedChange={(checked) => 
                    setTaxSettings(prev => ({ ...prev, includedInPrice: checked }))
                  }
                />
              </div>

              <Button 
                onClick={() => saveSettings('tax_settings', taxSettings)}
                disabled={saving}
                className="w-full"
              >
                {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                Save Tax Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Shipping Settings */}
        <TabsContent value="shipping">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="w-5 h-5 text-primary" />
                Shipping Settings
              </CardTitle>
              <CardDescription>
                Configure free shipping threshold, shipping costs, and rules
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Free Shipping Toggle */}
              <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                <div>
                  <Label className="text-base font-medium">Enable Shipping Charges</Label>
                  <p className="text-sm text-muted-foreground">
                    When disabled, ALL shipping is FREE. When enabled, shipping rules apply.
                  </p>
                </div>
                <Switch
                  checked={shippingSettings.freeShippingEnabled}
                  onCheckedChange={(checked) => 
                    setShippingSettings(prev => ({ ...prev, freeShippingEnabled: checked }))
                  }
                />
              </div>

              {/* Shipping Rules - Only show when enabled */}
              {shippingSettings.freeShippingEnabled && (
                <div className="space-y-4 p-4 border rounded-lg">
                  <h4 className="font-medium flex items-center gap-2">
                    <Truck className="w-4 h-4" />
                    Free Shipping Rules
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Minimum Order Amount (AED)</Label>
                      <Input
                        type="number"
                        value={shippingSettings.freeShippingThreshold}
                        onChange={(e) => setShippingSettings(prev => ({ ...prev, freeShippingThreshold: parseFloat(e.target.value) || 0 }))}
                        placeholder="200"
                      />
                      <p className="text-xs text-muted-foreground">0 = no minimum amount</p>
                    </div>
                    <div className="space-y-2">
                      <Label>Minimum Items Count</Label>
                      <Input
                        type="number"
                        value={shippingSettings.freeShippingMinItems || 0}
                        onChange={(e) => setShippingSettings(prev => ({ ...prev, freeShippingMinItems: parseInt(e.target.value) || 0 }))}
                        placeholder="0"
                      />
                      <p className="text-xs text-muted-foreground">0 = no minimum items</p>
                    </div>
                    <div className="space-y-2">
                      <Label>Standard Shipping Cost (AED)</Label>
                      <Input
                        type="number"
                        value={shippingSettings.shippingCost}
                        onChange={(e) => setShippingSettings(prev => ({ ...prev, shippingCost: parseFloat(e.target.value) || 0 }))}
                        placeholder="25"
                      />
                      <p className="text-xs text-muted-foreground">Cost when rules not met</p>
                    </div>
                  </div>

                  {/* Show Progress Bar Toggle */}
                  <div className="flex items-center justify-between p-3 bg-muted/20 rounded-lg">
                    <div>
                      <Label>Show Progress Bar in Cart</Label>
                      <p className="text-sm text-muted-foreground">Display progress toward free shipping</p>
                    </div>
                    <Switch
                      checked={shippingSettings.showProgressBar ?? true}
                      onCheckedChange={(checked) => 
                        setShippingSettings(prev => ({ ...prev, showProgressBar: checked }))
                      }
                    />
                  </div>
                </div>
              )}

              {/* Labels */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Shipping Label (English)</Label>
                  <Input
                    value={shippingSettings.shippingLabel}
                    onChange={(e) => setShippingSettings(prev => ({ ...prev, shippingLabel: e.target.value }))}
                    placeholder="Shipping"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Shipping Label (Arabic)</Label>
                  <Input
                    value={shippingSettings.shippingLabelAr}
                    onChange={(e) => setShippingSettings(prev => ({ ...prev, shippingLabelAr: e.target.value }))}
                    placeholder="الشحن"
                    dir="rtl"
                  />
                </div>
              </div>

              {/* Preview */}
              <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-lg">
                <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300 mb-2">📦 Shipping Preview:</p>
                <p className="text-sm text-emerald-600 dark:text-emerald-400">
                  {!shippingSettings.freeShippingEnabled 
                    ? "✅ ALL orders get FREE shipping (shipping charges disabled)"
                    : shippingSettings.freeShippingThreshold > 0 && (shippingSettings.freeShippingMinItems || 0) > 0
                    ? `Free shipping for orders above AED ${shippingSettings.freeShippingThreshold} AND with ${shippingSettings.freeShippingMinItems}+ items. Otherwise AED ${shippingSettings.shippingCost}.`
                    : shippingSettings.freeShippingThreshold > 0
                    ? `Free shipping for orders above AED ${shippingSettings.freeShippingThreshold}. Orders below will be charged AED ${shippingSettings.shippingCost}.`
                    : (shippingSettings.freeShippingMinItems || 0) > 0
                    ? `Free shipping for orders with ${shippingSettings.freeShippingMinItems}+ items. Otherwise AED ${shippingSettings.shippingCost}.`
                    : `All orders will be charged AED ${shippingSettings.shippingCost} for shipping.`
                  }
                </p>
              </div>

              <Button 
                onClick={() => saveSettings('shipping_settings', shippingSettings)}
                disabled={saving}
                className="w-full"
              >
                {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                Save Shipping Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end">
        <Button variant="outline" onClick={fetchSettings}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh Settings
        </Button>
      </div>
    </div>
  );
};
