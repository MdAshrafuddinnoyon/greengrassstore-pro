import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Image, Save, RefreshCw } from "lucide-react";
import { MediaPicker } from "./MediaPicker";

interface BrandingContent {
  logoUrl: string;
  faviconUrl: string;
  siteName: string;
  siteNameAr: string;
  tagline: string;
  taglineAr: string;
}

export const SiteContentManager = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [branding, setBranding] = useState<BrandingContent>({
    logoUrl: "",
    faviconUrl: "",
    siteName: "Green Grass",
    siteNameAr: "جرين جراس",
    tagline: "Plants & Pots Store",
    taglineAr: "متجر النباتات والأواني"
  });

  const fetchContent = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('site_settings')
        .select('*')
        .eq('setting_key', 'branding')
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      if (data) {
        setBranding(data.setting_value as unknown as BrandingContent);
      }
    } catch (error) {
      console.error('Error fetching content:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContent();
  }, []);

  const saveContent = async () => {
    setSaving(true);
    try {
      const { data: existing } = await supabase
        .from('site_settings')
        .select('id')
        .eq('setting_key', 'branding')
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from('site_settings')
          .update({ setting_value: JSON.parse(JSON.stringify(branding)), updated_at: new Date().toISOString() })
          .eq('setting_key', 'branding');
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('site_settings')
          .insert({ setting_key: 'branding', setting_value: JSON.parse(JSON.stringify(branding)) });
        if (error) throw error;
      }
      
      toast.success('Branding saved successfully');
    } catch (error) {
      console.error('Error saving content:', error);
      toast.error('Failed to save branding');
    } finally {
      setSaving(false);
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
            <Image className="w-5 h-5 text-primary" />
            Logo & Branding
          </CardTitle>
          <CardDescription>
            Manage your site's logo, favicon and branding
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <MediaPicker
                label="Header Logo"
                value={branding.logoUrl}
                onChange={(url) => setBranding(prev => ({ ...prev, logoUrl: url }))}
                placeholder="Select or enter logo URL"
              />

              <MediaPicker
                label="Favicon"
                value={branding.faviconUrl}
                onChange={(url) => setBranding(prev => ({ ...prev, faviconUrl: url }))}
                placeholder="Select or enter favicon URL"
              />
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="site-name">Site Name (EN)</Label>
                  <Input
                    id="site-name"
                    value={branding.siteName}
                    onChange={(e) => setBranding(prev => ({ ...prev, siteName: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="site-name-ar">Site Name (AR)</Label>
                  <Input
                    id="site-name-ar"
                    value={branding.siteNameAr}
                    onChange={(e) => setBranding(prev => ({ ...prev, siteNameAr: e.target.value }))}
                    dir="rtl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tagline">Tagline (EN)</Label>
                  <Input
                    id="tagline"
                    value={branding.tagline}
                    onChange={(e) => setBranding(prev => ({ ...prev, tagline: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tagline-ar">Tagline (AR)</Label>
                  <Input
                    id="tagline-ar"
                    value={branding.taglineAr}
                    onChange={(e) => setBranding(prev => ({ ...prev, taglineAr: e.target.value }))}
                    dir="rtl"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Preview */}
          {(branding.logoUrl || branding.siteName) && (
            <div className="p-4 bg-muted/30 rounded-lg">
              <p className="text-sm font-medium mb-2">Preview</p>
              <div className="flex items-center gap-3">
                {branding.logoUrl && (
                  <img src={branding.logoUrl} alt="Logo" className="h-10 w-10 object-contain" />
                )}
                <div>
                  <p className="font-bold">{branding.siteName}</p>
                  <p className="text-xs text-muted-foreground">{branding.tagline}</p>
                </div>
              </div>
            </div>
          )}

          <Button 
            onClick={saveContent}
            disabled={saving}
            className="w-full"
          >
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Save Branding
          </Button>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button variant="outline" onClick={fetchContent}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh Content
        </Button>
      </div>
    </div>
  );
};