import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Key, Shield, Lock, Save, RefreshCw, ExternalLink, AlertTriangle, Sparkles, Bot } from "lucide-react";

interface GoogleSettings {
  enabled: boolean;
  analyticsId: string;
  recaptchaSiteKey: string;
  mapsApiKey: string;
}

interface SecuritySettings {
  recaptchaEnabled: boolean;
  adminUrlPath: string;
  maintenanceMode: boolean;
}

interface IntegrationSettings {
  mailchimpApiKey: string;
  sendgridApiKey: string;
  cloudinaryCloudName: string;
}

interface AISettings {
  enabled: boolean;
  provider: 'lovable' | 'openai' | 'google';
  openaiApiKey: string;
  googleApiKey: string;
  defaultModel: string;
  enableBlogGeneration: boolean;
  enableProductGeneration: boolean;
  enableImageGeneration: boolean;
}

export const APISettingsManager = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [googleSettings, setGoogleSettings] = useState<GoogleSettings>({
    enabled: false,
    analyticsId: "",
    recaptchaSiteKey: "",
    mapsApiKey: ""
  });

  const [securitySettings, setSecuritySettings] = useState<SecuritySettings>({
    recaptchaEnabled: false,
    adminUrlPath: "admin",
    maintenanceMode: false
  });

  const [integrationSettings, setIntegrationSettings] = useState<IntegrationSettings>({
    mailchimpApiKey: "",
    sendgridApiKey: "",
    cloudinaryCloudName: ""
  });

  const [aiSettings, setAiSettings] = useState<AISettings>({
    enabled: true,
    provider: 'lovable',
    openaiApiKey: "",
    googleApiKey: "",
    defaultModel: "google/gemini-2.5-flash",
    enableBlogGeneration: true,
    enableProductGeneration: true,
    enableImageGeneration: true
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
        if (setting.setting_key === 'google_settings') {
          setGoogleSettings(value as unknown as GoogleSettings);
        } else if (setting.setting_key === 'security_settings') {
          setSecuritySettings(value as unknown as SecuritySettings);
        } else if (setting.setting_key === 'integration_settings') {
          setIntegrationSettings(value as unknown as IntegrationSettings);
        } else if (setting.setting_key === 'ai_settings') {
          setAiSettings(value as unknown as AISettings);
        }
      });
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const saveSettings = async (key: string, value: object) => {
    setSaving(true);
    try {
      const { data: existing } = await supabase
        .from('site_settings')
        .select('id')
        .eq('setting_key', key)
        .single();

      if (existing) {
        const { error } = await supabase
          .from('site_settings')
          .update({ setting_value: JSON.parse(JSON.stringify(value)) })
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="ai" className="space-y-4">
        <TabsList className="grid grid-cols-4 w-full max-w-lg">
          <TabsTrigger value="ai" className="gap-2">
            <Sparkles className="w-4 h-4" />
            AI
          </TabsTrigger>
          <TabsTrigger value="google" className="gap-2">
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Google
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-2">
            <Shield className="w-4 h-4" />
            Security
          </TabsTrigger>
          <TabsTrigger value="integrations" className="gap-2">
            <Key className="w-4 h-4" />
            Other
          </TabsTrigger>
        </TabsList>

        {/* AI Settings */}
        <TabsContent value="ai">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                AI Integration Settings
              </CardTitle>
              <CardDescription>
                Configure AI for generating blog posts, product descriptions, and images
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border">
                <div>
                  <Label>Enable AI Features</Label>
                  <p className="text-sm text-muted-foreground">Use AI for content generation</p>
                </div>
                <Switch
                  checked={aiSettings.enabled}
                  onCheckedChange={(checked) => 
                    setAiSettings(prev => ({ ...prev, enabled: checked }))
                  }
                />
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>AI Provider</Label>
                  <Select 
                    value={aiSettings.provider} 
                    onValueChange={(v) => setAiSettings(prev => ({ ...prev, provider: v as 'lovable' | 'openai' | 'google' }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="lovable">
                        <span className="flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-purple-500" />
                          websearchbd AI (Recommended - No API Key Required)
                        </span>
                      </SelectItem>
                      <SelectItem value="google">
                        <span className="flex items-center gap-2">
                          <Bot className="w-4 h-4 text-blue-500" />
                          Google AI (Gemini)
                        </span>
                      </SelectItem>
                      <SelectItem value="openai">
                        <span className="flex items-center gap-2">
                          <Bot className="w-4 h-4 text-green-500" />
                          OpenAI (GPT)
                        </span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    websearchbd AI is pre-configured and ready to use. Other providers require API keys.
                  </p>
                </div>

                {aiSettings.provider === 'google' && (
                  <div className="space-y-2">
                    <Label htmlFor="google-ai-key">Google AI API Key</Label>
                    <div className="flex gap-2">
                      <Input
                        id="google-ai-key"
                        value={aiSettings.googleApiKey}
                        onChange={(e) => 
                          setAiSettings(prev => ({ ...prev, googleApiKey: e.target.value }))
                        }
                        placeholder="AIza..."
                        type="password"
                      />
                      <Button variant="outline" size="icon" asChild>
                        <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </Button>
                    </div>
                  </div>
                )}

                {aiSettings.provider === 'openai' && (
                  <div className="space-y-2">
                    <Label htmlFor="openai-key">OpenAI API Key</Label>
                    <div className="flex gap-2">
                      <Input
                        id="openai-key"
                        value={aiSettings.openaiApiKey}
                        onChange={(e) => 
                          setAiSettings(prev => ({ ...prev, openaiApiKey: e.target.value }))
                        }
                        placeholder="sk-..."
                        type="password"
                      />
                      <Button variant="outline" size="icon" asChild>
                        <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </Button>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Default AI Model</Label>
                  <Select 
                    value={aiSettings.defaultModel} 
                    onValueChange={(v) => setAiSettings(prev => ({ ...prev, defaultModel: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="google/gemini-2.5-flash">Gemini 2.5 Flash (Fast & Balanced)</SelectItem>
                      <SelectItem value="google/gemini-2.5-pro">Gemini 2.5 Pro (Most Capable)</SelectItem>
                      <SelectItem value="google/gemini-2.5-flash-lite">Gemini Flash Lite (Fastest)</SelectItem>
                      <SelectItem value="openai/gpt-5">GPT-5 (Premium)</SelectItem>
                      <SelectItem value="openai/gpt-5-mini">GPT-5 Mini (Balanced)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="border rounded-lg p-4 space-y-4">
                  <h4 className="font-medium">AI Feature Toggles</h4>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Blog Content Generation</Label>
                      <p className="text-xs text-muted-foreground">Generate blog post titles, content, and excerpts</p>
                    </div>
                    <Switch
                      checked={aiSettings.enableBlogGeneration}
                      onCheckedChange={(checked) => 
                        setAiSettings(prev => ({ ...prev, enableBlogGeneration: checked }))
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Product Content Generation</Label>
                      <p className="text-xs text-muted-foreground">Generate product titles, descriptions, and tags</p>
                    </div>
                    <Switch
                      checked={aiSettings.enableProductGeneration}
                      onCheckedChange={(checked) => 
                        setAiSettings(prev => ({ ...prev, enableProductGeneration: checked }))
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Image Generation</Label>
                      <p className="text-xs text-muted-foreground">Generate product and blog images with AI</p>
                    </div>
                    <Switch
                      checked={aiSettings.enableImageGeneration}
                      onCheckedChange={(checked) => 
                        setAiSettings(prev => ({ ...prev, enableImageGeneration: checked }))
                      }
                    />
                  </div>
                </div>
              </div>

              <Button 
                onClick={() => saveSettings('ai_settings', aiSettings)}
                disabled={saving}
                className="w-full"
              >
                {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                Save AI Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Google Settings */}
        <TabsContent value="google">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Google Services
              </CardTitle>
              <CardDescription>
                Configure Google Analytics, reCAPTCHA, and Maps
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                <div>
                  <Label>Enable Google Services</Label>
                  <p className="text-sm text-muted-foreground">Use Google integrations on your site</p>
                </div>
                <Switch
                  checked={googleSettings.enabled}
                  onCheckedChange={(checked) => 
                    setGoogleSettings(prev => ({ ...prev, enabled: checked }))
                  }
                />
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="analytics-id">Google Analytics ID</Label>
                  <div className="flex gap-2">
                    <Input
                      id="analytics-id"
                      value={googleSettings.analyticsId}
                      onChange={(e) => 
                        setGoogleSettings(prev => ({ ...prev, analyticsId: e.target.value }))
                      }
                      placeholder="G-XXXXXXXXXX"
                    />
                    <Button variant="outline" size="icon" asChild>
                      <a href="https://analytics.google.com" target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="recaptcha-key">reCAPTCHA Site Key</Label>
                  <div className="flex gap-2">
                    <Input
                      id="recaptcha-key"
                      value={googleSettings.recaptchaSiteKey}
                      onChange={(e) => 
                        setGoogleSettings(prev => ({ ...prev, recaptchaSiteKey: e.target.value }))
                      }
                      placeholder="6Lc..."
                    />
                    <Button variant="outline" size="icon" asChild>
                      <a href="https://www.google.com/recaptcha/admin" target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maps-key">Google Maps API Key</Label>
                  <div className="flex gap-2">
                    <Input
                      id="maps-key"
                      value={googleSettings.mapsApiKey}
                      onChange={(e) => 
                        setGoogleSettings(prev => ({ ...prev, mapsApiKey: e.target.value }))
                      }
                      placeholder="AIza..."
                      type="password"
                    />
                    <Button variant="outline" size="icon" asChild>
                      <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </Button>
                  </div>
                </div>
              </div>

              <Button 
                onClick={() => saveSettings('google_settings', googleSettings)}
                disabled={saving}
                className="w-full"
              >
                {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                Save Google Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Settings */}
        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                Security Settings
              </CardTitle>
              <CardDescription>
                Configure security options and admin access
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                <div>
                  <Label>Enable reCAPTCHA</Label>
                  <p className="text-sm text-muted-foreground">Protect forms with Google reCAPTCHA</p>
                </div>
                <Switch
                  checked={securitySettings.recaptchaEnabled}
                  onCheckedChange={(checked) => 
                    setSecuritySettings(prev => ({ ...prev, recaptchaEnabled: checked }))
                  }
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <div>
                  <Label className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    Maintenance Mode
                  </Label>
                  <p className="text-sm text-muted-foreground">Show maintenance page to visitors</p>
                </div>
                <Switch
                  checked={securitySettings.maintenanceMode}
                  onCheckedChange={(checked) => 
                    setSecuritySettings(prev => ({ ...prev, maintenanceMode: checked }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="admin-url">Admin URL Path</Label>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">/</span>
                  <Input
                    id="admin-url"
                    value={securitySettings.adminUrlPath}
                    onChange={(e) => 
                      setSecuritySettings(prev => ({ ...prev, adminUrlPath: e.target.value.replace(/[^a-z0-9-]/gi, '') }))
                    }
                    placeholder="admin"
                    className="flex-1"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Change the admin panel URL for security (e.g., /dashboard, /manage)
                </p>
                <Badge variant="outline" className="text-xs">
                  Current: /{securitySettings.adminUrlPath}
                </Badge>
              </div>

              <Button 
                onClick={() => saveSettings('security_settings', securitySettings)}
                disabled={saving}
                className="w-full"
              >
                {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                Save Security Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Integrations */}
        <TabsContent value="integrations">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="w-5 h-5 text-primary" />
                Third-Party Integrations
              </CardTitle>
              <CardDescription>
                Configure API keys for external services
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <Lock className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-blue-900">API Keys Security</p>
                    <p className="text-sm text-blue-700">
                      API keys are stored securely in the database. For maximum security, 
                      consider using environment variables for sensitive keys.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="mailchimp-key">Mailchimp API Key</Label>
                  <Input
                    id="mailchimp-key"
                    value={integrationSettings.mailchimpApiKey}
                    onChange={(e) => 
                      setIntegrationSettings(prev => ({ ...prev, mailchimpApiKey: e.target.value }))
                    }
                    placeholder="xxxxxxxx-us1"
                    type="password"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sendgrid-key">SendGrid API Key</Label>
                  <Input
                    id="sendgrid-key"
                    value={integrationSettings.sendgridApiKey}
                    onChange={(e) => 
                      setIntegrationSettings(prev => ({ ...prev, sendgridApiKey: e.target.value }))
                    }
                    placeholder="SG.xxxxx"
                    type="password"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cloudinary-name">Cloudinary Cloud Name</Label>
                  <Input
                    id="cloudinary-name"
                    value={integrationSettings.cloudinaryCloudName}
                    onChange={(e) => 
                      setIntegrationSettings(prev => ({ ...prev, cloudinaryCloudName: e.target.value }))
                    }
                    placeholder="your-cloud-name"
                  />
                </div>
              </div>

              <Button 
                onClick={() => saveSettings('integration_settings', integrationSettings)}
                disabled={saving}
                className="w-full"
              >
                {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                Save Integration Settings
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