import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { 
  Loader2, 
  Save, 
  MessageCircle, 
  Send, 
  Instagram, 
  Facebook, 
  Twitter, 
  Linkedin,
  ExternalLink,
  TestTube,
  CheckCircle2,
  XCircle
} from "lucide-react";

interface SocialSettings {
  whatsapp: {
    enabled: boolean;
    demoMode: boolean;
    phoneNumber: string;
    defaultMessage: string;
    defaultMessageAr: string;
  };
  telegram: {
    enabled: boolean;
    demoMode: boolean;
    botToken: string;
    chatId: string;
    username: string;
  };
  instagram: {
    enabled: boolean;
    username: string;
    profileUrl: string;
  };
  facebook: {
    enabled: boolean;
    pageUrl: string;
    messengerLink: string;
    messengerChatEnabled: boolean;
    pageId: string;
  };
  twitter: {
    enabled: boolean;
    username: string;
    profileUrl: string;
  };
  linkedin: {
    enabled: boolean;
    companyUrl: string;
  };
}

const defaultSettings: SocialSettings = {
  whatsapp: {
    enabled: true,
    demoMode: true,
    phoneNumber: "+971547751901",
    defaultMessage: "Hi! I'm interested in your products.",
    defaultMessageAr: "مرحبًا! أنا مهتم بمنتجاتكم."
  },
  telegram: {
    enabled: false,
    demoMode: true,
    botToken: "",
    chatId: "",
    username: "greengrassstore"
  },
  instagram: {
    enabled: false,
    username: "",
    profileUrl: ""
  },
  facebook: {
    enabled: false,
    pageUrl: "",
    messengerLink: "",
    messengerChatEnabled: false,
    pageId: ""
  },
  twitter: {
    enabled: false,
    username: "",
    profileUrl: ""
  },
  linkedin: {
    enabled: false,
    companyUrl: ""
  }
};

export const SocialIntegrationManager = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<SocialSettings>(defaultSettings);
  const [testingWhatsApp, setTestingWhatsApp] = useState(false);
  const [testingTelegram, setTestingTelegram] = useState(false);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('site_settings')
        .select('*')
        .eq('setting_key', 'social_integrations')
        .maybeSingle();

      if (error) throw error;
      
      if (data?.setting_value) {
        setSettings({ ...defaultSettings, ...data.setting_value as unknown as SocialSettings });
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
        .eq('setting_key', 'social_integrations')
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from('site_settings')
          .update({ setting_value: JSON.parse(JSON.stringify(settings)) })
          .eq('setting_key', 'social_integrations');
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('site_settings')
          .insert({ setting_key: 'social_integrations', setting_value: JSON.parse(JSON.stringify(settings)) });
        if (error) throw error;
      }
      
      toast.success('Social integration settings saved');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const testWhatsApp = () => {
    setTestingWhatsApp(true);
    const phoneNumber = settings.whatsapp.phoneNumber.replace(/[^0-9+]/g, '');
    const message = encodeURIComponent(settings.whatsapp.defaultMessage);
    window.open(`https://wa.me/${phoneNumber}?text=${message}`, '_blank');
    setTimeout(() => setTestingWhatsApp(false), 1000);
    toast.success('WhatsApp test link opened');
  };

  const testTelegram = () => {
    setTestingTelegram(true);
    if (settings.telegram.username) {
      window.open(`https://t.me/${settings.telegram.username}`, '_blank');
      toast.success('Telegram test link opened');
    } else {
      toast.error('Please enter Telegram username first');
    }
    setTimeout(() => setTestingTelegram(false), 1000);
  };

  const updateWhatsApp = (field: keyof SocialSettings['whatsapp'], value: any) => {
    setSettings(prev => ({
      ...prev,
      whatsapp: { ...prev.whatsapp, [field]: value }
    }));
  };

  const updateTelegram = (field: keyof SocialSettings['telegram'], value: any) => {
    setSettings(prev => ({
      ...prev,
      telegram: { ...prev.telegram, [field]: value }
    }));
  };

  const updateSocialLink = (platform: 'instagram' | 'facebook' | 'twitter' | 'linkedin', field: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [platform]: { ...prev[platform], [field]: value }
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
            <MessageCircle className="w-5 h-5 text-primary" />
            Social Media & Messaging Integration
          </CardTitle>
          <CardDescription>
            Configure your social media links and messaging integrations for customer communication
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="whatsapp" className="space-y-6">
            <TabsList className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 h-auto gap-1 p-1">
              <TabsTrigger value="whatsapp" className="flex items-center gap-1.5 text-xs sm:text-sm">
                <MessageCircle className="w-4 h-4" />
                <span className="hidden sm:inline">WhatsApp</span>
              </TabsTrigger>
              <TabsTrigger value="telegram" className="flex items-center gap-1.5 text-xs sm:text-sm">
                <Send className="w-4 h-4" />
                <span className="hidden sm:inline">Telegram</span>
              </TabsTrigger>
              <TabsTrigger value="instagram" className="flex items-center gap-1.5 text-xs sm:text-sm">
                <Instagram className="w-4 h-4" />
                <span className="hidden sm:inline">Instagram</span>
              </TabsTrigger>
              <TabsTrigger value="facebook" className="flex items-center gap-1.5 text-xs sm:text-sm">
                <Facebook className="w-4 h-4" />
                <span className="hidden sm:inline">Facebook</span>
              </TabsTrigger>
              <TabsTrigger value="twitter" className="flex items-center gap-1.5 text-xs sm:text-sm">
                <Twitter className="w-4 h-4" />
                <span className="hidden sm:inline">Twitter</span>
              </TabsTrigger>
              <TabsTrigger value="linkedin" className="flex items-center gap-1.5 text-xs sm:text-sm">
                <Linkedin className="w-4 h-4" />
                <span className="hidden sm:inline">LinkedIn</span>
              </TabsTrigger>
            </TabsList>

            {/* WhatsApp Settings */}
            <TabsContent value="whatsapp" className="space-y-6">
              <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg p-4 space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-500 rounded-lg">
                      <MessageCircle className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">WhatsApp Business</h3>
                      <p className="text-sm text-muted-foreground">Connect with customers via WhatsApp</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={settings.whatsapp.enabled ? "default" : "secondary"}>
                      {settings.whatsapp.enabled ? "Enabled" : "Disabled"}
                    </Badge>
                    <Switch
                      checked={settings.whatsapp.enabled}
                      onCheckedChange={(v) => updateWhatsApp('enabled', v)}
                    />
                  </div>
                </div>

                {settings.whatsapp.enabled && (
                  <div className="space-y-4 pt-4 border-t border-green-200 dark:border-green-800">
                    <div className="flex items-center justify-between bg-background/50 p-3 rounded-lg">
                      <div className="flex items-center gap-2">
                        {settings.whatsapp.demoMode ? (
                          <XCircle className="w-5 h-5 text-amber-500" />
                        ) : (
                          <CheckCircle2 className="w-5 h-5 text-green-500" />
                        )}
                        <div>
                          <p className="font-medium text-sm">
                            {settings.whatsapp.demoMode ? "Demo Mode" : "Live Mode"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {settings.whatsapp.demoMode 
                              ? "Using sample data for preview" 
                              : "Connected to your WhatsApp Business"}
                          </p>
                        </div>
                      </div>
                      <Switch
                        checked={!settings.whatsapp.demoMode}
                        onCheckedChange={(v) => updateWhatsApp('demoMode', !v)}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Phone Number (with country code)</Label>
                        <Input
                          value={settings.whatsapp.phoneNumber}
                          onChange={(e) => updateWhatsApp('phoneNumber', e.target.value)}
                          placeholder="+971547751901"
                        />
                      </div>
                      <div className="space-y-2 flex items-end">
                        <Button 
                          variant="outline" 
                          onClick={testWhatsApp}
                          disabled={testingWhatsApp}
                          className="w-full"
                        >
                          {testingWhatsApp ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <TestTube className="w-4 h-4 mr-2" />
                          )}
                          Test WhatsApp
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Default Message (English)</Label>
                      <Input
                        value={settings.whatsapp.defaultMessage}
                        onChange={(e) => updateWhatsApp('defaultMessage', e.target.value)}
                        placeholder="Hi! I'm interested in your products."
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Default Message (Arabic)</Label>
                      <Input
                        value={settings.whatsapp.defaultMessageAr}
                        onChange={(e) => updateWhatsApp('defaultMessageAr', e.target.value)}
                        placeholder="مرحبًا! أنا مهتم بمنتجاتكم."
                        dir="rtl"
                      />
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Telegram Settings */}
            <TabsContent value="telegram" className="space-y-6">
              <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4 space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-500 rounded-lg">
                      <Send className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">Telegram</h3>
                      <p className="text-sm text-muted-foreground">Connect with customers via Telegram</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={settings.telegram.enabled ? "default" : "secondary"}>
                      {settings.telegram.enabled ? "Enabled" : "Disabled"}
                    </Badge>
                    <Switch
                      checked={settings.telegram.enabled}
                      onCheckedChange={(v) => updateTelegram('enabled', v)}
                    />
                  </div>
                </div>

                {settings.telegram.enabled && (
                  <div className="space-y-4 pt-4 border-t border-blue-200 dark:border-blue-800">
                    <div className="flex items-center justify-between bg-background/50 p-3 rounded-lg">
                      <div className="flex items-center gap-2">
                        {settings.telegram.demoMode ? (
                          <XCircle className="w-5 h-5 text-amber-500" />
                        ) : (
                          <CheckCircle2 className="w-5 h-5 text-green-500" />
                        )}
                        <div>
                          <p className="font-medium text-sm">
                            {settings.telegram.demoMode ? "Demo Mode" : "Live Mode"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {settings.telegram.demoMode 
                              ? "Using sample data for preview" 
                              : "Connected to your Telegram Bot"}
                          </p>
                        </div>
                      </div>
                      <Switch
                        checked={!settings.telegram.demoMode}
                        onCheckedChange={(v) => updateTelegram('demoMode', !v)}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Telegram Username</Label>
                        <Input
                          value={settings.telegram.username}
                          onChange={(e) => updateTelegram('username', e.target.value)}
                          placeholder="greengrassstore"
                        />
                        <p className="text-xs text-muted-foreground">Without @ symbol</p>
                      </div>
                      <div className="space-y-2 flex items-end">
                        <Button 
                          variant="outline" 
                          onClick={testTelegram}
                          disabled={testingTelegram}
                          className="w-full"
                        >
                          {testingTelegram ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <ExternalLink className="w-4 h-4 mr-2" />
                          )}
                          Test Telegram
                        </Button>
                      </div>
                    </div>

                    {!settings.telegram.demoMode && (
                      <>
                        <div className="space-y-2">
                          <Label>Bot Token (Optional - for notifications)</Label>
                          <Input
                            type="password"
                            value={settings.telegram.botToken}
                            onChange={(e) => updateTelegram('botToken', e.target.value)}
                            placeholder="123456789:ABCDEF..."
                          />
                          <p className="text-xs text-muted-foreground">Get from @BotFather on Telegram</p>
                        </div>

                        <div className="space-y-2">
                          <Label>Chat ID (Optional - for notifications)</Label>
                          <Input
                            value={settings.telegram.chatId}
                            onChange={(e) => updateTelegram('chatId', e.target.value)}
                            placeholder="-100123456789"
                          />
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Instagram Settings */}
            <TabsContent value="instagram" className="space-y-6">
              <div className="bg-pink-50 dark:bg-pink-950/30 border border-pink-200 dark:border-pink-800 rounded-lg p-4 space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg">
                      <Instagram className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">Instagram</h3>
                      <p className="text-sm text-muted-foreground">Link your Instagram profile</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Switch
                      checked={settings.instagram.enabled}
                      onCheckedChange={(v) => updateSocialLink('instagram', 'enabled', v)}
                    />
                  </div>
                </div>

                {settings.instagram.enabled && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-pink-200 dark:border-pink-800">
                    <div className="space-y-2">
                      <Label>Username</Label>
                      <Input
                        value={settings.instagram.username}
                        onChange={(e) => updateSocialLink('instagram', 'username', e.target.value)}
                        placeholder="greengrassstore"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Profile URL</Label>
                      <Input
                        value={settings.instagram.profileUrl}
                        onChange={(e) => updateSocialLink('instagram', 'profileUrl', e.target.value)}
                        placeholder="https://instagram.com/greengrassstore"
                      />
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Facebook Settings */}
            <TabsContent value="facebook" className="space-y-6">
              <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4 space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-600 rounded-lg">
                      <Facebook className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">Facebook</h3>
                      <p className="text-sm text-muted-foreground">Link your Facebook page</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Switch
                      checked={settings.facebook.enabled}
                      onCheckedChange={(v) => updateSocialLink('facebook', 'enabled', v)}
                    />
                  </div>
                </div>

                {settings.facebook.enabled && (
                  <div className="space-y-4 pt-4 border-t border-blue-200 dark:border-blue-800">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Page URL</Label>
                        <Input
                          value={settings.facebook.pageUrl}
                          onChange={(e) => updateSocialLink('facebook', 'pageUrl', e.target.value)}
                          placeholder="https://facebook.com/greengrassstore"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Messenger Link</Label>
                        <Input
                          value={settings.facebook.messengerLink}
                          onChange={(e) => updateSocialLink('facebook', 'messengerLink', e.target.value)}
                          placeholder="https://m.me/greengrassstore"
                        />
                      </div>
                    </div>

                    {/* Facebook Messenger Chat Widget */}
                    <div className="bg-background/50 p-4 rounded-lg space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-sm">Messenger Chat Widget</h4>
                          <p className="text-xs text-muted-foreground">
                            Show Facebook Messenger chat bubble on your website
                          </p>
                        </div>
                        <Switch
                          checked={settings.facebook.messengerChatEnabled || false}
                          onCheckedChange={(v) => updateSocialLink('facebook', 'messengerChatEnabled', v)}
                        />
                      </div>
                      
                      {settings.facebook.messengerChatEnabled && (
                        <div className="space-y-2">
                          <Label>Facebook Page ID</Label>
                          <Input
                            value={settings.facebook.pageId || ''}
                            onChange={(e) => updateSocialLink('facebook', 'pageId', e.target.value)}
                            placeholder="Enter your Facebook Page ID (e.g., 123456789012345)"
                          />
                          <p className="text-xs text-muted-foreground">
                            Find your Page ID in Facebook Page Settings → About → Page ID
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Twitter Settings */}
            <TabsContent value="twitter" className="space-y-6">
              <div className="bg-sky-50 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-800 rounded-lg p-4 space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-sky-500 rounded-lg">
                      <Twitter className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">Twitter / X</h3>
                      <p className="text-sm text-muted-foreground">Link your Twitter profile</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Switch
                      checked={settings.twitter.enabled}
                      onCheckedChange={(v) => updateSocialLink('twitter', 'enabled', v)}
                    />
                  </div>
                </div>

                {settings.twitter.enabled && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-sky-200 dark:border-sky-800">
                    <div className="space-y-2">
                      <Label>Username</Label>
                      <Input
                        value={settings.twitter.username}
                        onChange={(e) => updateSocialLink('twitter', 'username', e.target.value)}
                        placeholder="greengrassstore"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Profile URL</Label>
                      <Input
                        value={settings.twitter.profileUrl}
                        onChange={(e) => updateSocialLink('twitter', 'profileUrl', e.target.value)}
                        placeholder="https://twitter.com/greengrassstore"
                      />
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* LinkedIn Settings */}
            <TabsContent value="linkedin" className="space-y-6">
              <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4 space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-700 rounded-lg">
                      <Linkedin className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">LinkedIn</h3>
                      <p className="text-sm text-muted-foreground">Link your company page</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Switch
                      checked={settings.linkedin.enabled}
                      onCheckedChange={(v) => updateSocialLink('linkedin', 'enabled', v)}
                    />
                  </div>
                </div>

                {settings.linkedin.enabled && (
                  <div className="pt-4 border-t border-blue-200 dark:border-blue-800">
                    <div className="space-y-2">
                      <Label>Company Page URL</Label>
                      <Input
                        value={settings.linkedin.companyUrl}
                        onChange={(e) => updateSocialLink('linkedin', 'companyUrl', e.target.value)}
                        placeholder="https://linkedin.com/company/greengrassstore"
                      />
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>

          <Button onClick={saveSettings} disabled={saving} className="w-full mt-6">
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Save Social Integration Settings
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};