import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Palette, Type, Image as ImageIcon, Save, RefreshCw, Eye } from "lucide-react";
import { MediaPicker } from "./MediaPicker";
import type { Json } from "@/integrations/supabase/types";

interface BrandingSettings {
  logoUrl: string;
  faviconUrl: string;
  siteName: string;
  siteNameAr: string;
  tagline: string;
  taglineAr: string;
  logoSizeDesktop: number;
  logoSizeMobile: number;
  logoSizeTablet: number;
  logoAlignment: 'left' | 'center' | 'right';
  showDomainText: boolean;
  domainText: string;
  // Payment Banner & Security
  showPaymentBanner?: boolean;
  paymentBannerImage?: string;
  paymentBannerLink?: string;
  securePaymentText?: string;
  securePaymentTextAr?: string;
  showSecurePayment?: boolean;
  easyReturnText?: string;
  easyReturnTextAr?: string;
  showEasyReturn?: boolean;
}

interface ThemeColors {
  primaryColor: string;
  primaryForeground: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  foregroundColor: string;
  headerBackground: string;
  footerBackground: string;
}

interface TypographySettings {
  headingFont: string;
  bodyFont: string;
  headingFontAr: string;
  bodyFontAr: string;
}

const defaultBranding: BrandingSettings = {
  logoUrl: "",
  faviconUrl: "",
  siteName: "Green Grass",
  siteNameAr: "جرين جراس",
  tagline: "Plants & Pots Store",
  taglineAr: "متجر النباتات والأواني",
  logoSizeDesktop: 120,
  logoSizeMobile: 80,
  logoSizeTablet: 100,
  logoAlignment: "left",
  showDomainText: true,
  domainText: "www.greengrassstore.com",
  showPaymentBanner: true,
  paymentBannerImage: "",
  paymentBannerLink: "",
  securePaymentText: "100% Secure Payment",
  securePaymentTextAr: "دفع آمن 100%",
  showSecurePayment: true,
  easyReturnText: "Easy Returns",
  easyReturnTextAr: "إرجاع سهل",
  showEasyReturn: true
};

const defaultThemeColors: ThemeColors = {
  primaryColor: "#2d5a3d",
  primaryForeground: "#ffffff",
  secondaryColor: "#f5f3ef",
  accentColor: "#e8e4dd",
  backgroundColor: "#fefefe",
  foregroundColor: "#1f1f1f",
  headerBackground: "#ffffff",
  footerBackground: "#3d3d35"
};

const defaultTypography: TypographySettings = {
  headingFont: "Cormorant Garamond",
  bodyFont: "Inter",
  headingFontAr: "Cairo",
  bodyFontAr: "Cairo"
};

const fontOptions = [
  { value: "Inter", label: "Inter" },
  { value: "Cormorant Garamond", label: "Cormorant Garamond" },
  { value: "Playfair Display", label: "Playfair Display" },
  { value: "Poppins", label: "Poppins" },
  { value: "Roboto", label: "Roboto" },
  { value: "Open Sans", label: "Open Sans" },
  { value: "Montserrat", label: "Montserrat" },
  { value: "Lato", label: "Lato" },
  { value: "Raleway", label: "Raleway" },
  { value: "Nunito", label: "Nunito" }
];

const arabicFontOptions = [
  { value: "Cairo", label: "Cairo" },
  { value: "Tajawal", label: "Tajawal" },
  { value: "Almarai", label: "Almarai" },
  { value: "Noto Sans Arabic", label: "Noto Sans Arabic" },
  { value: "IBM Plex Sans Arabic", label: "IBM Plex Sans Arabic" }
];

export const BrandingManager = () => {
  const [branding, setBranding] = useState<BrandingSettings>(defaultBranding);
  const [themeColors, setThemeColors] = useState<ThemeColors>(defaultThemeColors);
  const [typography, setTypography] = useState<TypographySettings>(defaultTypography);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSettings();

    // Real-time subscription for branding changes
    const channel = supabase
      .channel('branding-settings-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'site_settings' },
        (payload) => {
          const setting = payload.new as any;
          if (setting?.setting_key === 'branding' || 
              setting?.setting_key === 'theme_colors' || 
              setting?.setting_key === 'typography') {
            fetchSettings();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('site_settings')
        .select('*')
        .in('setting_key', ['branding', 'theme_colors', 'typography']);

      if (error) throw error;

      data?.forEach(setting => {
        const value = setting.setting_value as Record<string, unknown>;
        switch (setting.setting_key) {
          case 'branding':
            setBranding({ ...defaultBranding, ...value as unknown as BrandingSettings });
            break;
          case 'theme_colors':
            setThemeColors({ ...defaultThemeColors, ...value as unknown as ThemeColors });
            break;
          case 'typography':
            setTypography({ ...defaultTypography, ...value as unknown as TypographySettings });
            break;
        }
      });
    } catch (error) {
      console.error('Error fetching branding settings:', error);
      toast.error("Failed to load branding settings");
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async (key: string, value: Record<string, string>) => {
    setSaving(true);
    try {
      const { data: existing } = await supabase
        .from('site_settings')
        .select('id')
        .eq('setting_key', key)
        .maybeSingle();

      const jsonValue = value as unknown as Json;

      if (existing) {
        const { error } = await supabase
          .from('site_settings')
          .update({ setting_value: jsonValue, updated_at: new Date().toISOString() })
          .eq('setting_key', key);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('site_settings')
          .insert({ setting_key: key, setting_value: jsonValue });
        if (error) throw error;
      }

      toast.success("Settings saved successfully!");
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const saveBranding = () => saveSettings('branding', branding as unknown as Record<string, string>);
  const saveThemeColors = () => saveSettings('theme_colors', themeColors as unknown as Record<string, string>);
  const saveTypography = () => saveSettings('typography', typography as unknown as Record<string, string>);

  const applyThemeColors = () => {
    const root = document.documentElement;
    const hexToHSL = (hex: string) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      if (!result) return "0 0% 0%";
      let r = parseInt(result[1], 16) / 255;
      let g = parseInt(result[2], 16) / 255;
      let b = parseInt(result[3], 16) / 255;
      const max = Math.max(r, g, b), min = Math.min(r, g, b);
      let h = 0, s = 0;
      const l = (max + min) / 2;
      if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
          case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
          case g: h = ((b - r) / d + 2) / 6; break;
          case b: h = ((r - g) / d + 4) / 6; break;
        }
      }
      return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
    };

    root.style.setProperty('--primary', hexToHSL(themeColors.primaryColor));
    root.style.setProperty('--primary-foreground', hexToHSL(themeColors.primaryForeground));
    root.style.setProperty('--secondary', hexToHSL(themeColors.secondaryColor));
    root.style.setProperty('--accent', hexToHSL(themeColors.accentColor));
    root.style.setProperty('--background', hexToHSL(themeColors.backgroundColor));
    root.style.setProperty('--foreground', hexToHSL(themeColors.foregroundColor));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl md:text-2xl font-bold text-foreground">Branding & Design</h2>
        <p className="text-sm text-muted-foreground">
          Manage your site's logo, colors, and typography
        </p>
      </div>

      <Tabs defaultValue="branding" className="space-y-6">
        <TabsList className="w-full flex flex-wrap h-auto gap-1 p-1">
          <TabsTrigger value="branding" className="flex-1 min-w-[80px] gap-1 text-xs md:text-sm py-2">
            <ImageIcon className="w-3 h-3 md:w-4 md:h-4" />
            <span className="hidden sm:inline">Logo & Identity</span>
            <span className="sm:hidden">Logo</span>
          </TabsTrigger>
          <TabsTrigger value="colors" className="flex-1 min-w-[80px] gap-1 text-xs md:text-sm py-2">
            <Palette className="w-3 h-3 md:w-4 md:h-4" />
            <span>Colors</span>
          </TabsTrigger>
          <TabsTrigger value="typography" className="flex-1 min-w-[80px] gap-1 text-xs md:text-sm py-2">
            <Type className="w-3 h-3 md:w-4 md:h-4" />
            <span className="hidden sm:inline">Typography</span>
            <span className="sm:hidden">Fonts</span>
          </TabsTrigger>
        </TabsList>


        {/* Logo & Identity Tab */}
        <TabsContent value="branding" className="space-y-6">
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Site Logo</CardTitle>
              <CardDescription className="text-xs md:text-sm">
                Upload your logo for header and footer
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="w-32 h-20 border rounded-lg flex items-center justify-center bg-muted overflow-hidden">
                  {branding.logoUrl ? (
                    <img 
                      src={branding.logoUrl} 
                      alt="Logo" 
                      className="max-w-full max-h-full object-contain" 
                      style={{ maxWidth: branding.logoSizeDesktop || 120 }}
                    />
                  ) : (
                    <span className="text-xs text-muted-foreground">No logo</span>
                  )}
                </div>
                <div className="flex-1">
                  <MediaPicker
                    value={branding.logoUrl}
                    onChange={(url) => setBranding(prev => ({ ...prev, logoUrl: url }))}
                    label="Logo"
                    folder="logos"
                  />
                </div>
              </div>
              {/* Logo Size Controls */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 border-t">
                <div className="space-y-2">
                  <Label className="text-xs md:text-sm">Desktop Logo Width (px)</Label>
                  <div className="flex items-center gap-3">
                    <Input
                      type="range"
                      min="60"
                      max="200"
                      value={branding.logoSizeDesktop || 120}
                      onChange={(e) => setBranding(prev => ({ ...prev, logoSizeDesktop: parseInt(e.target.value) }))}
                      className="flex-1"
                    />
                    <span className="text-sm font-medium w-12 text-right">{branding.logoSizeDesktop || 120}px</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs md:text-sm">Tablet Logo Width (px)</Label>
                  <div className="flex items-center gap-3">
                    <Input
                      type="range"
                      min="50"
                      max="150"
                      value={branding.logoSizeTablet || 100}
                      onChange={(e) => setBranding(prev => ({ ...prev, logoSizeTablet: parseInt(e.target.value) }))}
                      className="flex-1"
                    />
                    <span className="text-sm font-medium w-12 text-right">{branding.logoSizeTablet || 100}px</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs md:text-sm">Mobile Logo Width (px)</Label>
                  <div className="flex items-center gap-3">
                    <Input
                      type="range"
                      min="40"
                      max="120"
                      value={branding.logoSizeMobile || 80}
                      onChange={(e) => setBranding(prev => ({ ...prev, logoSizeMobile: parseInt(e.target.value) }))}
                      className="flex-1"
                    />
                    <span className="text-sm font-medium w-12 text-right">{branding.logoSizeMobile || 80}px</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs md:text-sm">Logo Alignment</Label>
                  <Select
                    value={branding.logoAlignment || 'left'}
                    onValueChange={(value: 'left' | 'center' | 'right') => setBranding(prev => ({ ...prev, logoAlignment: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="left">Left</SelectItem>
                      <SelectItem value="center">Center</SelectItem>
                      <SelectItem value="right">Right</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Domain Text Settings */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={branding.showDomainText ?? true}
                      onCheckedChange={(checked) => setBranding(prev => ({ ...prev, showDomainText: checked }))}
                    />
                    <Label className="text-xs md:text-sm">Show Domain/URL Below Logo</Label>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Display your website URL below the logo in header
                  </p>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs md:text-sm">Domain Text</Label>
                  <Input
                    value={branding.domainText || 'www.greengrassstore.com'}
                    onChange={(e) => setBranding(prev => ({ ...prev, domainText: e.target.value }))}
                    placeholder="www.yourstore.com"
                    disabled={!branding.showDomainText}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Banner & Security Section */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Payment & Security Banner</CardTitle>
              <CardDescription className="text-xs md:text-sm">
                Configure payment banner and security/easy return info for product and checkout pages
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 space-y-2">
                  <Label>Show Payment Banner</Label>
                  <Switch
                    checked={branding.showPaymentBanner ?? true}
                    onCheckedChange={checked => setBranding(prev => ({ ...prev, showPaymentBanner: checked }))}
                  />
                  <Label>Banner Image</Label>
                  <MediaPicker
                    value={branding.paymentBannerImage || ''}
                    onChange={url => setBranding(prev => ({ ...prev, paymentBannerImage: url }))}
                    label="Payment Banner"
                    folder="banners"
                  />
                  <Label>Banner Link (optional)</Label>
                  <Input
                    value={branding.paymentBannerLink || ''}
                    onChange={e => setBranding(prev => ({ ...prev, paymentBannerLink: e.target.value }))}
                    placeholder="https://..."
                  />
                </div>
                <div className="flex-1 space-y-2">
                  <Label>Show Secure Payment</Label>
                  <Switch
                    checked={branding.showSecurePayment ?? true}
                    onCheckedChange={checked => setBranding(prev => ({ ...prev, showSecurePayment: checked }))}
                  />
                  <Label>Secure Payment Text (EN)</Label>
                  <Input
                    value={branding.securePaymentText || ''}
                    onChange={e => setBranding(prev => ({ ...prev, securePaymentText: e.target.value }))}
                    placeholder="100% Secure Payment"
                  />
                  <Label>Secure Payment Text (AR)</Label>
                  <Input
                    value={branding.securePaymentTextAr || ''}
                    onChange={e => setBranding(prev => ({ ...prev, securePaymentTextAr: e.target.value }))}
                    placeholder="دفع آمن 100%"
                    dir="rtl"
                  />
                  <Label>Show Easy Return</Label>
                  <Switch
                    checked={branding.showEasyReturn ?? true}
                    onCheckedChange={checked => setBranding(prev => ({ ...prev, showEasyReturn: checked }))}
                  />
                  <Label>Easy Return Text (EN)</Label>
                  <Input
                    value={branding.easyReturnText || ''}
                    onChange={e => setBranding(prev => ({ ...prev, easyReturnText: e.target.value }))}
                    placeholder="Easy Returns"
                  />
                  <Label>Easy Return Text (AR)</Label>
                  <Input
                    value={branding.easyReturnTextAr || ''}
                    onChange={e => setBranding(prev => ({ ...prev, easyReturnTextAr: e.target.value }))}
                    placeholder="إرجاع سهل"
                    dir="rtl"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Favicon</CardTitle>
              <CardDescription className="text-xs md:text-sm">
                Browser tab icon (recommended: 32x32 or 64x64 PNG)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="w-16 h-16 border rounded-lg flex items-center justify-center bg-muted overflow-hidden">
                  {branding.faviconUrl ? (
                    <img 
                      src={branding.faviconUrl} 
                      alt="Favicon" 
                      className="max-w-full max-h-full object-contain" 
                    />
                  ) : (
                    <span className="text-[10px] text-muted-foreground text-center">No favicon</span>
                  )}
                </div>
                <div className="flex-1">
                  <MediaPicker
                    value={branding.faviconUrl}
                    onChange={(url) => {
                      setBranding(prev => ({ ...prev, faviconUrl: url }));
                      // Update favicon in document
                      const link = document.querySelector("link[rel*='icon']") as HTMLLinkElement;
                      if (link && url) {
                        link.href = url;
                      }
                    }}
                    label="Favicon"
                    folder="logos"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Site Identity</CardTitle>
              <CardDescription className="text-xs md:text-sm">
                Site name and tagline
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs md:text-sm">Site Name (English)</Label>
                  <Input
                    value={branding.siteName}
                    onChange={(e) => setBranding(prev => ({ ...prev, siteName: e.target.value }))}
                    placeholder="Green Grass"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs md:text-sm">Site Name (Arabic)</Label>
                  <Input
                    value={branding.siteNameAr}
                    onChange={(e) => setBranding(prev => ({ ...prev, siteNameAr: e.target.value }))}
                    placeholder="جرين جراس"
                    dir="rtl"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs md:text-sm">Tagline (English)</Label>
                  <Input
                    value={branding.tagline}
                    onChange={(e) => setBranding(prev => ({ ...prev, tagline: e.target.value }))}
                    placeholder="Plants & Pots Store"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs md:text-sm">Tagline (Arabic)</Label>
                  <Input
                    value={branding.taglineAr}
                    onChange={(e) => setBranding(prev => ({ ...prev, taglineAr: e.target.value }))}
                    placeholder="متجر النباتات والأواني"
                    dir="rtl"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Button onClick={saveBranding} disabled={saving} className="w-full sm:w-auto gap-2">
            <Save className="w-4 h-4" />
            {saving ? "Saving..." : "Save Branding"}
          </Button>
        </TabsContent>

        {/* Colors Tab */}
        <TabsContent value="colors" className="space-y-6">
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Theme Colors</CardTitle>
              <CardDescription className="text-xs md:text-sm">
                Customize your website's color scheme
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs md:text-sm">Primary Color</Label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={themeColors.primaryColor}
                      onChange={(e) => setThemeColors(prev => ({ ...prev, primaryColor: e.target.value }))}
                      className="w-10 h-10 rounded cursor-pointer border-0"
                    />
                    <Input
                      value={themeColors.primaryColor}
                      onChange={(e) => setThemeColors(prev => ({ ...prev, primaryColor: e.target.value }))}
                      className="flex-1 text-xs"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs md:text-sm">Primary Text</Label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={themeColors.primaryForeground}
                      onChange={(e) => setThemeColors(prev => ({ ...prev, primaryForeground: e.target.value }))}
                      className="w-10 h-10 rounded cursor-pointer border-0"
                    />
                    <Input
                      value={themeColors.primaryForeground}
                      onChange={(e) => setThemeColors(prev => ({ ...prev, primaryForeground: e.target.value }))}
                      className="flex-1 text-xs"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs md:text-sm">Secondary Color</Label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={themeColors.secondaryColor}
                      onChange={(e) => setThemeColors(prev => ({ ...prev, secondaryColor: e.target.value }))}
                      className="w-10 h-10 rounded cursor-pointer border-0"
                    />
                    <Input
                      value={themeColors.secondaryColor}
                      onChange={(e) => setThemeColors(prev => ({ ...prev, secondaryColor: e.target.value }))}
                      className="flex-1 text-xs"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs md:text-sm">Accent Color</Label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={themeColors.accentColor}
                      onChange={(e) => setThemeColors(prev => ({ ...prev, accentColor: e.target.value }))}
                      className="w-10 h-10 rounded cursor-pointer border-0"
                    />
                    <Input
                      value={themeColors.accentColor}
                      onChange={(e) => setThemeColors(prev => ({ ...prev, accentColor: e.target.value }))}
                      className="flex-1 text-xs"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs md:text-sm">Background</Label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={themeColors.backgroundColor}
                      onChange={(e) => setThemeColors(prev => ({ ...prev, backgroundColor: e.target.value }))}
                      className="w-10 h-10 rounded cursor-pointer border-0"
                    />
                    <Input
                      value={themeColors.backgroundColor}
                      onChange={(e) => setThemeColors(prev => ({ ...prev, backgroundColor: e.target.value }))}
                      className="flex-1 text-xs"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs md:text-sm">Text Color</Label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={themeColors.foregroundColor}
                      onChange={(e) => setThemeColors(prev => ({ ...prev, foregroundColor: e.target.value }))}
                      className="w-10 h-10 rounded cursor-pointer border-0"
                    />
                    <Input
                      value={themeColors.foregroundColor}
                      onChange={(e) => setThemeColors(prev => ({ ...prev, foregroundColor: e.target.value }))}
                      className="flex-1 text-xs"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs md:text-sm">Header BG</Label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={themeColors.headerBackground}
                      onChange={(e) => setThemeColors(prev => ({ ...prev, headerBackground: e.target.value }))}
                      className="w-10 h-10 rounded cursor-pointer border-0"
                    />
                    <Input
                      value={themeColors.headerBackground}
                      onChange={(e) => setThemeColors(prev => ({ ...prev, headerBackground: e.target.value }))}
                      className="flex-1 text-xs"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs md:text-sm">Footer BG</Label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={themeColors.footerBackground}
                      onChange={(e) => setThemeColors(prev => ({ ...prev, footerBackground: e.target.value }))}
                      className="w-10 h-10 rounded cursor-pointer border-0"
                    />
                    <Input
                      value={themeColors.footerBackground}
                      onChange={(e) => setThemeColors(prev => ({ ...prev, footerBackground: e.target.value }))}
                      className="flex-1 text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Color Preview */}
              <div className="mt-6 p-4 rounded-lg border">
                <h4 className="text-sm font-medium mb-3">Preview</h4>
                <div className="flex flex-wrap gap-2">
                  <div 
                    className="px-4 py-2 rounded text-sm font-medium"
                    style={{ backgroundColor: themeColors.primaryColor, color: themeColors.primaryForeground }}
                  >
                    Primary Button
                  </div>
                  <div 
                    className="px-4 py-2 rounded text-sm font-medium border"
                    style={{ backgroundColor: themeColors.secondaryColor, color: themeColors.foregroundColor }}
                  >
                    Secondary
                  </div>
                  <div 
                    className="px-4 py-2 rounded text-sm font-medium"
                    style={{ backgroundColor: themeColors.accentColor, color: themeColors.foregroundColor }}
                  >
                    Accent
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex flex-wrap gap-2">
            <Button onClick={applyThemeColors} variant="outline" className="gap-2">
              <Eye className="w-4 h-4" />
              Preview Theme
            </Button>
            <Button onClick={saveThemeColors} disabled={saving} className="gap-2">
              <Save className="w-4 h-4" />
              {saving ? "Saving..." : "Save Colors"}
            </Button>
          </div>
        </TabsContent>

        {/* Typography Tab */}
        <TabsContent value="typography" className="space-y-6">
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Font Settings</CardTitle>
              <CardDescription className="text-xs md:text-sm">
                Choose fonts for headings and body text
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs md:text-sm">Heading Font (English)</Label>
                  <Select
                    value={typography.headingFont}
                    onValueChange={(value) => setTypography(prev => ({ ...prev, headingFont: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {fontOptions.map(font => (
                        <SelectItem key={font.value} value={font.value} style={{ fontFamily: font.value }}>
                          {font.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs md:text-sm">Body Font (English)</Label>
                  <Select
                    value={typography.bodyFont}
                    onValueChange={(value) => setTypography(prev => ({ ...prev, bodyFont: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {fontOptions.map(font => (
                        <SelectItem key={font.value} value={font.value} style={{ fontFamily: font.value }}>
                          {font.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs md:text-sm">Heading Font (Arabic)</Label>
                  <Select
                    value={typography.headingFontAr}
                    onValueChange={(value) => setTypography(prev => ({ ...prev, headingFontAr: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {arabicFontOptions.map(font => (
                        <SelectItem key={font.value} value={font.value} style={{ fontFamily: font.value }}>
                          {font.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs md:text-sm">Body Font (Arabic)</Label>
                  <Select
                    value={typography.bodyFontAr}
                    onValueChange={(value) => setTypography(prev => ({ ...prev, bodyFontAr: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {arabicFontOptions.map(font => (
                        <SelectItem key={font.value} value={font.value} style={{ fontFamily: font.value }}>
                          {font.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Typography Preview */}
              <div className="mt-6 p-4 rounded-lg border space-y-3">
                <h4 className="text-sm font-medium mb-3">Preview</h4>
                <h3 
                  className="text-2xl font-bold" 
                  style={{ fontFamily: typography.headingFont }}
                >
                  Heading Text Sample
                </h3>
                <p 
                  className="text-base" 
                  style={{ fontFamily: typography.bodyFont }}
                >
                  This is body text sample. The quick brown fox jumps over the lazy dog.
                </p>
                <h3 
                  className="text-2xl font-bold" 
                  style={{ fontFamily: typography.headingFontAr }}
                  dir="rtl"
                >
                  عنوان نص عربي
                </h3>
                <p 
                  className="text-base" 
                  style={{ fontFamily: typography.bodyFontAr }}
                  dir="rtl"
                >
                  هذا نص عربي للمعاينة. الخط الحالي يُظهر كيف ستبدو النصوص العربية.
                </p>
              </div>
            </CardContent>
          </Card>

          <Button onClick={saveTypography} disabled={saving} className="w-full sm:w-auto gap-2">
            <Save className="w-4 h-4" />
            {saving ? "Saving..." : "Save Typography"}
          </Button>
        </TabsContent>
      </Tabs>
    </div>
  );
};
