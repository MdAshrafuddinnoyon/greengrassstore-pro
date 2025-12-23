import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Save, Plus, Trash2, GripVertical, Link2, ExternalLink, CreditCard, Image, Info } from "lucide-react";
import { MediaPicker } from "./MediaPicker";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";

interface FooterLink {
  id: string;
  label: string;
  labelAr: string;
  href: string;
  order: number;
}

interface FooterSection {
  id: string;
  title: string;
  titleAr: string;
  links: FooterLink[];
  order: number;
}

interface FooterMenuSettings {
  description: string;
  descriptionAr: string;
  websiteUrl: string;
  copyrightText: string;
  copyrightTextAr: string;
  logoUrl: string;
  logoSize: number;
  sections: FooterSection[];
  socialLinks: {
    instagram: string;
    facebook: string;
    whatsapp: string;
    twitter: string;
    youtube: string;
    tiktok: string;
    linkedin: string;
    telegram: string;
  };
  developerCredit: {
    enabled: boolean;
    name: string;
    url: string;
  };
  paymentBanner: {
    enabled: boolean;
    title: string;
    titleAr: string;
    images: string[];
    imageHeight: number;
  };
}

const defaultSettings: FooterMenuSettings = {
  description: "We craft timeless pieces that blend elegance and functionality, elevating every space into a masterpiece.",
  descriptionAr: "نصنع قطعًا خالدة تمزج بين الأناقة والوظائف، ترتقي بكل مساحة إلى تحفة فنية.",
  websiteUrl: "www.greengrassstore.com",
  copyrightText: "© 2025 Green Grass Store. All rights reserved.",
  copyrightTextAr: "© 2025 متجر جرين جراس. جميع الحقوق محفوظة.",
  logoUrl: "",
  logoSize: 64,
  sections: [
    {
      id: "1",
      title: "Plants & Flowers",
      titleAr: "النباتات والزهور",
      order: 1,
      links: [
        { id: "1-1", label: "Plants", labelAr: "النباتات", href: "/shop?category=plants", order: 1 },
        { id: "1-2", label: "Flowers", labelAr: "الزهور", href: "/shop?category=flowers", order: 2 },
        { id: "1-3", label: "Pots", labelAr: "الأواني", href: "/shop?category=pots", order: 3 },
        { id: "1-4", label: "Greenery", labelAr: "الخضرة", href: "/shop?category=greenery", order: 4 },
      ]
    },
    {
      id: "2",
      title: "Pots",
      titleAr: "الأواني",
      order: 2,
      links: [
        { id: "2-1", label: "Hanging", labelAr: "معلقات", href: "/shop?category=hanging", order: 1 },
        { id: "2-2", label: "Gifts", labelAr: "هدايا", href: "/shop?category=gifts", order: 2 },
        { id: "2-3", label: "Sale", labelAr: "تخفيضات", href: "/shop?category=sale", order: 3 },
        { id: "2-4", label: "Fiber Pot", labelAr: "أواني فايبر", href: "/shop?category=fiber-pot", order: 4 },
        { id: "2-5", label: "Plastic Pot", labelAr: "أواني بلاستيك", href: "/shop?category=plastic-pot", order: 5 },
        { id: "2-6", label: "Ceramic Pot", labelAr: "أواني سيراميك", href: "/shop?category=ceramic-pot", order: 6 },
      ]
    },
    {
      id: "3",
      title: "Help",
      titleAr: "المساعدة",
      order: 3,
      links: [
        { id: "3-1", label: "Contact us", labelAr: "اتصل بنا", href: "/contact", order: 1 },
        { id: "3-2", label: "FAQ", labelAr: "الأسئلة الشائعة", href: "/faq", order: 2 },
        { id: "3-3", label: "Track Order", labelAr: "تتبع الطلب", href: "/track-order", order: 3 },
        { id: "3-4", label: "Return Policy", labelAr: "سياسة الإرجاع", href: "/returns", order: 4 },
        { id: "3-5", label: "Privacy Policy", labelAr: "سياسة الخصوصية", href: "/privacy", order: 5 },
        { id: "3-6", label: "Terms of Service", labelAr: "شروط الخدمة", href: "/terms", order: 6 },
      ]
    },
    {
      id: "4",
      title: "About",
      titleAr: "عن المتجر",
      order: 4,
      links: [
        { id: "4-1", label: "About Us", labelAr: "من نحن", href: "/about", order: 1 },
        { id: "4-2", label: "Shop", labelAr: "المتجر", href: "/shop", order: 2 },
        { id: "4-3", label: "Latest Articles", labelAr: "أحدث المقالات", href: "/blog", order: 3 },
        { id: "4-4", label: "VIP Program", labelAr: "برنامج VIP", href: "/vip", order: 4 },
      ]
    }
  ],
  socialLinks: {
    instagram: "https://www.instagram.com/greengrass_decor",
    facebook: "https://www.facebook.com/greengrassstore",
    whatsapp: "+971547751901",
    twitter: "",
    youtube: "",
    tiktok: "",
    linkedin: "",
    telegram: ""
  },
  developerCredit: {
    enabled: true,
    name: "Web Search BD",
    url: "https://www.websearchbd.com"
  },
  paymentBanner: {
    enabled: true,
    title: "Payment Methods",
    titleAr: "طرق الدفع",
    images: [],
    imageHeight: 24
  }
};

export const FooterMenuManager = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<FooterMenuSettings>(defaultSettings);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('site_settings')
        .select('*')
        .eq('setting_key', 'footer_menu')
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      if (data) {
        setSettings(data.setting_value as unknown as FooterMenuSettings);
      }
    } catch (error) {
      console.error('Error fetching footer settings:', error);
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
        .eq('setting_key', 'footer_menu')
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from('site_settings')
          .update({ setting_value: JSON.parse(JSON.stringify(settings)), updated_at: new Date().toISOString() })
          .eq('setting_key', 'footer_menu');
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('site_settings')
          .insert({ setting_key: 'footer_menu', setting_value: JSON.parse(JSON.stringify(settings)) });
        if (error) throw error;
      }
      
      toast.success('Footer settings saved successfully');
    } catch (error) {
      console.error('Error saving footer settings:', error);
      toast.error('Failed to save footer settings');
    } finally {
      setSaving(false);
    }
  };

  const addSection = () => {
    const newSection: FooterSection = {
      id: Date.now().toString(),
      title: "New Section",
      titleAr: "قسم جديد",
      order: settings.sections.length + 1,
      links: []
    };
    setSettings(prev => ({
      ...prev,
      sections: [...prev.sections, newSection]
    }));
  };

  const removeSection = (sectionId: string) => {
    setSettings(prev => ({
      ...prev,
      sections: prev.sections.filter(s => s.id !== sectionId)
    }));
  };

  const updateSection = (sectionId: string, field: keyof FooterSection, value: any) => {
    setSettings(prev => ({
      ...prev,
      sections: prev.sections.map(s => 
        s.id === sectionId ? { ...s, [field]: value } : s
      )
    }));
  };

  const addLink = (sectionId: string) => {
    const newLink: FooterLink = {
      id: Date.now().toString(),
      label: "New Link",
      labelAr: "رابط جديد",
      href: "/",
      order: 1
    };
    setSettings(prev => ({
      ...prev,
      sections: prev.sections.map(s => 
        s.id === sectionId 
          ? { ...s, links: [...s.links, { ...newLink, order: s.links.length + 1 }] }
          : s
      )
    }));
  };

  const removeLink = (sectionId: string, linkId: string) => {
    setSettings(prev => ({
      ...prev,
      sections: prev.sections.map(s => 
        s.id === sectionId 
          ? { ...s, links: s.links.filter(l => l.id !== linkId) }
          : s
      )
    }));
  };

  const updateLink = (sectionId: string, linkId: string, field: keyof FooterLink, value: any) => {
    setSettings(prev => ({
      ...prev,
      sections: prev.sections.map(s => 
        s.id === sectionId 
          ? { 
              ...s, 
              links: s.links.map(l => 
                l.id === linkId ? { ...l, [field]: value } : l
              ) 
            }
          : s
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
      {/* Footer Logo */}
      <Card>
        <CardHeader>
          <CardTitle>Footer Logo</CardTitle>
          <CardDescription>Upload or select the logo displayed in the footer</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <MediaPicker
              label="Footer Logo"
              value={settings.logoUrl || ""}
              onChange={(url) => setSettings(prev => ({ ...prev, logoUrl: url }))}
              placeholder="Select or enter logo URL"
            />
            {settings.logoUrl && (
              <div className="flex items-center justify-center p-4 bg-muted/30 rounded-lg">
                <img 
                  src={settings.logoUrl} 
                  alt="Footer Logo Preview" 
                  className="object-contain"
                  style={{ height: `${settings.logoSize || 64}px` }}
                />
              </div>
            )}
          </div>
          {/* Logo Size Control */}
          <div className="space-y-2">
            <Label className="text-sm">Footer Logo Height (px)</Label>
            <div className="flex items-center gap-3">
              <Input
                type="range"
                min="32"
                max="120"
                value={settings.logoSize || 64}
                onChange={(e) => setSettings(prev => ({ ...prev, logoSize: parseInt(e.target.value) }))}
                className="flex-1"
              />
              <span className="text-sm font-medium w-16 text-right">{settings.logoSize || 64}px</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* General Footer Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Footer General Settings</CardTitle>
          <CardDescription>Configure footer description, copyright text, and website URL</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Description (EN)</Label>
              <Textarea
                value={settings.description}
                onChange={(e) => setSettings(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label>Description (AR)</Label>
              <Textarea
                value={settings.descriptionAr}
                onChange={(e) => setSettings(prev => ({ ...prev, descriptionAr: e.target.value }))}
                rows={3}
                dir="rtl"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Website URL</Label>
              <Input
                value={settings.websiteUrl}
                onChange={(e) => setSettings(prev => ({ ...prev, websiteUrl: e.target.value }))}
                placeholder="www.yourstore.com"
              />
            </div>
            <div className="space-y-2">
              <Label>Copyright Text (EN)</Label>
              <Input
                value={settings.copyrightText}
                onChange={(e) => setSettings(prev => ({ ...prev, copyrightText: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Copyright Text (AR)</Label>
              <Input
                value={settings.copyrightTextAr}
                onChange={(e) => setSettings(prev => ({ ...prev, copyrightTextAr: e.target.value }))}
                dir="rtl"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Social Links */}
      <Card>
        <CardHeader>
          <CardTitle>Social Links</CardTitle>
          <CardDescription>Configure your social media links</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Instagram URL</Label>
              <Input
                value={settings.socialLinks.instagram}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  socialLinks: { ...prev.socialLinks, instagram: e.target.value }
                }))}
                placeholder="https://instagram.com/yourstore"
              />
            </div>
            <div className="space-y-2">
              <Label>Facebook URL</Label>
              <Input
                value={settings.socialLinks.facebook}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  socialLinks: { ...prev.socialLinks, facebook: e.target.value }
                }))}
                placeholder="https://facebook.com/yourstore"
              />
            </div>
            <div className="space-y-2">
              <Label>WhatsApp Number</Label>
              <Input
                value={settings.socialLinks.whatsapp}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  socialLinks: { ...prev.socialLinks, whatsapp: e.target.value }
                }))}
                placeholder="+971547751901"
              />
            </div>
            <div className="space-y-2">
              <Label>Twitter/X URL</Label>
              <Input
                value={settings.socialLinks.twitter}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  socialLinks: { ...prev.socialLinks, twitter: e.target.value }
                }))}
                placeholder="https://twitter.com/yourstore"
              />
            </div>
            <div className="space-y-2">
              <Label>YouTube URL</Label>
              <Input
                value={settings.socialLinks.youtube}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  socialLinks: { ...prev.socialLinks, youtube: e.target.value }
                }))}
                placeholder="https://youtube.com/@yourstore"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Footer Menu Sections */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Footer Menu Sections</CardTitle>
            <CardDescription>Manage footer navigation menus</CardDescription>
          </div>
          <Button onClick={addSection} size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Add Section
          </Button>
        </CardHeader>
        <CardContent className="space-y-6">
          {settings.sections.map((section, sectionIndex) => (
            <Card key={section.id} className="border-dashed">
              <CardHeader className="py-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab" />
                    <div className="flex gap-2">
                      <Input
                        value={section.title}
                        onChange={(e) => updateSection(section.id, 'title', e.target.value)}
                        placeholder="Section Title (EN)"
                        className="w-40"
                      />
                      <Input
                        value={section.titleAr}
                        onChange={(e) => updateSection(section.id, 'titleAr', e.target.value)}
                        placeholder="Section Title (AR)"
                        className="w-40"
                        dir="rtl"
                      />
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => removeSection(section.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2">
                  {section.links.map((link) => (
                    <div key={link.id} className="flex items-center gap-2 bg-muted/50 p-2 rounded">
                      <Link2 className="w-4 h-4 text-muted-foreground" />
                      <Input
                        value={link.label}
                        onChange={(e) => updateLink(section.id, link.id, 'label', e.target.value)}
                        placeholder="Link Text (EN)"
                        className="flex-1"
                      />
                      <Input
                        value={link.labelAr}
                        onChange={(e) => updateLink(section.id, link.id, 'labelAr', e.target.value)}
                        placeholder="Link Text (AR)"
                        className="flex-1"
                        dir="rtl"
                      />
                      <Input
                        value={link.href}
                        onChange={(e) => updateLink(section.id, link.id, 'href', e.target.value)}
                        placeholder="/page-url"
                        className="w-40"
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeLink(section.id, link.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => addLink(section.id)}
                    className="w-full mt-2"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Link
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </CardContent>
      </Card>

      {/* Payment Banner Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-primary" />
            Payment Methods Banner
          </CardTitle>
          <CardDescription>
            Display payment method icons in footer
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
            <div>
              <Label>Enable Payment Banner</Label>
              <p className="text-sm text-muted-foreground">Show payment methods in footer</p>
            </div>
            <Switch
              checked={settings.paymentBanner?.enabled ?? true}
              onCheckedChange={(checked) => 
                setSettings(prev => ({
                  ...prev,
                  paymentBanner: { ...prev.paymentBanner, enabled: checked }
                }))
              }
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Banner Title (EN)</Label>
              <Input
                value={settings.paymentBanner?.title || "Payment Methods"}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  paymentBanner: { ...prev.paymentBanner, title: e.target.value }
                }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Banner Title (AR)</Label>
              <Input
                value={settings.paymentBanner?.titleAr || "طرق الدفع"}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  paymentBanner: { ...prev.paymentBanner, titleAr: e.target.value }
                }))}
                dir="rtl"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Image Height (px)</Label>
            <div className="flex items-center gap-4">
              <Input
                type="number"
                min={16}
                max={80}
                value={settings.paymentBanner?.imageHeight || 24}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  paymentBanner: { ...prev.paymentBanner, imageHeight: parseInt(e.target.value) || 24 }
                }))}
                className="w-32"
              />
              <p className="text-sm text-muted-foreground">Recommended: 24-32px</p>
            </div>
          </div>

          {/* Image Size Guidelines */}
          <div className="p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
            <div className="flex items-start gap-2">
              <Info className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-700 mb-1">Payment Icon Size Guidelines</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• <strong>Recommended Size:</strong> 80×50 px (PNG with transparent background)</li>
                  <li>• <strong>Max Width:</strong> 100px per icon</li>
                  <li>• <strong>Format:</strong> PNG or SVG with transparency</li>
                  <li>• <strong>Examples:</strong> Visa, Mastercard, PayPal, Apple Pay, etc.</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Payment Images */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Payment Method Icons</Label>
              <Badge variant="outline">{settings.paymentBanner?.images?.length || 0} icons</Badge>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {(settings.paymentBanner?.images || []).map((img, idx) => (
                <div key={idx} className="relative group border rounded-lg p-2 bg-muted/30">
                  <img 
                    src={img} 
                    alt={`Payment ${idx + 1}`} 
                    className="w-full h-12 object-contain"
                  />
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute -top-2 -right-2 w-6 h-6 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => {
                      setSettings(prev => ({
                        ...prev,
                        paymentBanner: {
                          ...prev.paymentBanner,
                          images: prev.paymentBanner.images.filter((_, i) => i !== idx)
                        }
                      }));
                    }}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              ))}
              
              {/* Add New Payment Icon */}
              <div className="border-2 border-dashed rounded-lg p-2 flex flex-col items-center justify-center min-h-[60px]">
                <MediaPicker
                  value=""
                  onChange={(url) => {
                    if (url) {
                      setSettings(prev => ({
                        ...prev,
                        paymentBanner: {
                          ...prev.paymentBanner,
                          images: [...(prev.paymentBanner?.images || []), url]
                        }
                      }));
                    }
                  }}
                  folder="payment-icons"
                />
              </div>
            </div>
          </div>

          {/* Preview */}
          {settings.paymentBanner?.enabled && settings.paymentBanner?.images?.length > 0 && (
            <div className="p-4 bg-gray-900 rounded-lg">
              <p className="text-xs text-gray-500 mb-2">{settings.paymentBanner.title || "Payment Methods"}</p>
              <div className="flex items-center gap-2 flex-wrap">
                {settings.paymentBanner.images.map((img, i) => (
                  <img 
                    key={i} 
                    src={img} 
                    alt="Payment" 
                    style={{ height: `${settings.paymentBanner.imageHeight || 24}px` }}
                    className="object-contain"
                  />
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Developer Credit - Read Only Display */}
      <Card>
        <CardHeader>
          <CardTitle>Developer Credit</CardTitle>
          <CardDescription>This credit is permanent and cannot be changed</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="p-4 bg-muted/50 rounded-lg border border-border">
            <p className="text-sm text-muted-foreground mb-2">
              The following credit is permanently displayed in the footer:
            </p>
            <p className="text-sm font-medium">
              Developed by{" "}
              <a 
                href="https://www.websearchbd.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Web Search BD
              </a>
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={saveSettings} disabled={saving} size="lg">
          {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          Save Footer Settings
        </Button>
      </div>
    </div>
  );
};
