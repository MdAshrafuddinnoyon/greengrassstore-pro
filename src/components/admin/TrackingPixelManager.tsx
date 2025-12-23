import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { 
  Save, 
  Facebook, 
  BarChart3, 
  Code,
  Check,
  AlertCircle
} from "lucide-react";

interface TrackingSettings {
  facebookPixel: {
    enabled: boolean;
    pixelId: string;
  };
  googleAnalytics: {
    enabled: boolean;
    measurementId: string;
  };
  googleTagManager: {
    enabled: boolean;
    containerId: string;
  };
  tiktokPixel: {
    enabled: boolean;
    pixelId: string;
  };
  snapchatPixel: {
    enabled: boolean;
    pixelId: string;
  };
  customScripts: {
    headScripts: string;
    bodyScripts: string;
  };
}

const defaultSettings: TrackingSettings = {
  facebookPixel: { enabled: false, pixelId: "" },
  googleAnalytics: { enabled: false, measurementId: "" },
  googleTagManager: { enabled: false, containerId: "" },
  tiktokPixel: { enabled: false, pixelId: "" },
  snapchatPixel: { enabled: false, pixelId: "" },
  customScripts: { headScripts: "", bodyScripts: "" }
};

export const TrackingPixelManager = () => {
  const [settings, setSettings] = useState<TrackingSettings>(defaultSettings);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('site_settings')
        .select('setting_value')
        .eq('setting_key', 'tracking_pixels')
        .maybeSingle();

      if (data && !error) {
        setSettings({ ...defaultSettings, ...(data.setting_value as unknown as TrackingSettings) });
      }
    } catch (error) {
      console.error('Error loading tracking settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveSettings = async () => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('site_settings')
        .upsert({
          setting_key: 'tracking_pixels',
          setting_value: settings as any,
          updated_at: new Date().toISOString()
        }, { onConflict: 'setting_key' });

      if (error) throw error;
      toast.success("Tracking settings saved successfully");
    } catch (error) {
      console.error('Error saving tracking settings:', error);
      toast.error("Failed to save settings");
    } finally {
      setIsSaving(false);
    }
  };

  const updateSetting = (
    platform: keyof Omit<TrackingSettings, 'customScripts'>,
    field: string,
    value: any
  ) => {
    setSettings(prev => ({
      ...prev,
      [platform]: {
        ...prev[platform],
        [field]: value
      }
    }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Tracking & Pixels</h2>
          <p className="text-gray-600">Configure analytics and tracking pixels for your store</p>
        </div>
        <Button onClick={saveSettings} disabled={isSaving} className="gap-2">
          <Save className="w-4 h-4" />
          {isSaving ? "Saving..." : "Save Settings"}
        </Button>
      </div>

      <Tabs defaultValue="facebook" className="space-y-6">
        <TabsList className="grid grid-cols-3 lg:grid-cols-6 gap-2">
          <TabsTrigger value="facebook" className="gap-2">
            <Facebook className="w-4 h-4" />
            <span className="hidden sm:inline">Facebook</span>
          </TabsTrigger>
          <TabsTrigger value="google" className="gap-2">
            <BarChart3 className="w-4 h-4" />
            <span className="hidden sm:inline">Google</span>
          </TabsTrigger>
          <TabsTrigger value="gtm" className="gap-2">
            <Code className="w-4 h-4" />
            <span className="hidden sm:inline">GTM</span>
          </TabsTrigger>
          <TabsTrigger value="tiktok" className="gap-2">
            <span className="text-lg">📱</span>
            <span className="hidden sm:inline">TikTok</span>
          </TabsTrigger>
          <TabsTrigger value="snapchat" className="gap-2">
            <span className="text-lg">👻</span>
            <span className="hidden sm:inline">Snapchat</span>
          </TabsTrigger>
          <TabsTrigger value="custom" className="gap-2">
            <Code className="w-4 h-4" />
            <span className="hidden sm:inline">Custom</span>
          </TabsTrigger>
        </TabsList>

        {/* Facebook Pixel */}
        <TabsContent value="facebook">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Facebook className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <CardTitle>Facebook Pixel</CardTitle>
                  <CardDescription>Track conversions and optimize your Facebook ads</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="fb-enabled">Enable Facebook Pixel</Label>
                <Switch
                  id="fb-enabled"
                  checked={settings.facebookPixel.enabled}
                  onCheckedChange={(checked) => updateSetting('facebookPixel', 'enabled', checked)}
                />
              </div>
              <div>
                <Label htmlFor="fb-pixel-id">Pixel ID</Label>
                <Input
                  id="fb-pixel-id"
                  value={settings.facebookPixel.pixelId}
                  onChange={(e) => updateSetting('facebookPixel', 'pixelId', e.target.value)}
                  placeholder="123456789012345"
                  disabled={!settings.facebookPixel.enabled}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Find your Pixel ID in Facebook Events Manager → Data Sources
                </p>
              </div>
              {settings.facebookPixel.enabled && settings.facebookPixel.pixelId && (
                <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 p-3 rounded-lg">
                  <Check className="w-4 h-4" />
                  Facebook Pixel is configured and will track page views and events
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Google Analytics */}
        <TabsContent value="google">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                  <BarChart3 className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <CardTitle>Google Analytics 4</CardTitle>
                  <CardDescription>Track website traffic and user behavior</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="ga-enabled">Enable Google Analytics</Label>
                <Switch
                  id="ga-enabled"
                  checked={settings.googleAnalytics.enabled}
                  onCheckedChange={(checked) => updateSetting('googleAnalytics', 'enabled', checked)}
                />
              </div>
              <div>
                <Label htmlFor="ga-measurement-id">Measurement ID</Label>
                <Input
                  id="ga-measurement-id"
                  value={settings.googleAnalytics.measurementId}
                  onChange={(e) => updateSetting('googleAnalytics', 'measurementId', e.target.value)}
                  placeholder="G-XXXXXXXXXX"
                  disabled={!settings.googleAnalytics.enabled}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Find your Measurement ID in Google Analytics → Admin → Data Streams
                </p>
              </div>
              {settings.googleAnalytics.enabled && settings.googleAnalytics.measurementId && (
                <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 p-3 rounded-lg">
                  <Check className="w-4 h-4" />
                  Google Analytics is configured and will track page views
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Google Tag Manager */}
        <TabsContent value="gtm">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Code className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <CardTitle>Google Tag Manager</CardTitle>
                  <CardDescription>Manage all your marketing tags in one place</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="gtm-enabled">Enable Google Tag Manager</Label>
                <Switch
                  id="gtm-enabled"
                  checked={settings.googleTagManager.enabled}
                  onCheckedChange={(checked) => updateSetting('googleTagManager', 'enabled', checked)}
                />
              </div>
              <div>
                <Label htmlFor="gtm-container-id">Container ID</Label>
                <Input
                  id="gtm-container-id"
                  value={settings.googleTagManager.containerId}
                  onChange={(e) => updateSetting('googleTagManager', 'containerId', e.target.value)}
                  placeholder="GTM-XXXXXXX"
                  disabled={!settings.googleTagManager.enabled}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Find your Container ID in Google Tag Manager → Admin → Container Settings
                </p>
              </div>
              <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 p-3 rounded-lg">
                <AlertCircle className="w-4 h-4" />
                If using GTM, you can disable individual pixels and manage them through GTM instead
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TikTok Pixel */}
        <TabsContent value="tiktok">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gray-900 rounded-xl flex items-center justify-center">
                  <span className="text-2xl">📱</span>
                </div>
                <div>
                  <CardTitle>TikTok Pixel</CardTitle>
                  <CardDescription>Track conversions from TikTok ads</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="tiktok-enabled">Enable TikTok Pixel</Label>
                <Switch
                  id="tiktok-enabled"
                  checked={settings.tiktokPixel.enabled}
                  onCheckedChange={(checked) => updateSetting('tiktokPixel', 'enabled', checked)}
                />
              </div>
              <div>
                <Label htmlFor="tiktok-pixel-id">Pixel ID</Label>
                <Input
                  id="tiktok-pixel-id"
                  value={settings.tiktokPixel.pixelId}
                  onChange={(e) => updateSetting('tiktokPixel', 'pixelId', e.target.value)}
                  placeholder="CXXXXXXXXXXXXXXXXX"
                  disabled={!settings.tiktokPixel.enabled}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Find your Pixel ID in TikTok Ads Manager → Assets → Events
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Snapchat Pixel */}
        <TabsContent value="snapchat">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                  <span className="text-2xl">👻</span>
                </div>
                <div>
                  <CardTitle>Snapchat Pixel</CardTitle>
                  <CardDescription>Track conversions from Snapchat ads</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="snap-enabled">Enable Snapchat Pixel</Label>
                <Switch
                  id="snap-enabled"
                  checked={settings.snapchatPixel.enabled}
                  onCheckedChange={(checked) => updateSetting('snapchatPixel', 'enabled', checked)}
                />
              </div>
              <div>
                <Label htmlFor="snap-pixel-id">Pixel ID</Label>
                <Input
                  id="snap-pixel-id"
                  value={settings.snapchatPixel.pixelId}
                  onChange={(e) => updateSetting('snapchatPixel', 'pixelId', e.target.value)}
                  placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                  disabled={!settings.snapchatPixel.enabled}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Find your Pixel ID in Snapchat Ads Manager → Events Manager
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Custom Scripts */}
        <TabsContent value="custom">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                  <Code className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <CardTitle>Custom Scripts</CardTitle>
                  <CardDescription>Add custom tracking or integration scripts</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="head-scripts">Head Scripts</Label>
                <textarea
                  id="head-scripts"
                  value={settings.customScripts.headScripts}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    customScripts: { ...prev.customScripts, headScripts: e.target.value }
                  }))}
                  placeholder="<script>...</script>"
                  rows={6}
                  className="w-full px-3 py-2 border rounded-lg font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Scripts placed in the &lt;head&gt; section
                </p>
              </div>
              <div>
                <Label htmlFor="body-scripts">Body Scripts</Label>
                <textarea
                  id="body-scripts"
                  value={settings.customScripts.bodyScripts}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    customScripts: { ...prev.customScripts, bodyScripts: e.target.value }
                  }))}
                  placeholder="<script>...</script>"
                  rows={6}
                  className="w-full px-3 py-2 border rounded-lg font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Scripts placed before the closing &lt;/body&gt; tag
                </p>
              </div>
              <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 p-3 rounded-lg">
                <AlertCircle className="w-4 h-4" />
                Only add scripts from trusted sources. Malicious scripts can harm your site.
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
