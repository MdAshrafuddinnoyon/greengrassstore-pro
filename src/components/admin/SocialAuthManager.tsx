import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { 
  Loader2, 
  Save, 
  ExternalLink,
  Key,
  Shield,
  Info,
  Copy,
  CheckCircle2
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface SocialAuthSettings {
  google: {
    enabled: boolean;
    clientId: string;
    clientSecret: string;
  };
  facebook: {
    enabled: boolean;
    appId: string;
    appSecret: string;
  };
  github: {
    enabled: boolean;
    clientId: string;
    clientSecret: string;
  };
  twitter: {
    enabled: boolean;
    apiKey: string;
    apiSecret: string;
  };
}

const defaultSettings: SocialAuthSettings = {
  google: { enabled: false, clientId: '', clientSecret: '' },
  facebook: { enabled: false, appId: '', appSecret: '' },
  github: { enabled: false, clientId: '', clientSecret: '' },
  twitter: { enabled: false, apiKey: '', apiSecret: '' },
};

export const SocialAuthManager = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<SocialAuthSettings>(defaultSettings);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('site_settings')
        .select('*')
        .eq('setting_key', 'social_auth_settings')
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (data?.setting_value) {
        setSettings({ ...defaultSettings, ...data.setting_value as any });
      }
    } catch (error) {
      console.error('Error fetching social auth settings:', error);
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
        .eq('setting_key', 'social_auth_settings')
        .single();

      if (existing) {
        const { error } = await supabase
          .from('site_settings')
          .update({ setting_value: JSON.parse(JSON.stringify(settings)) })
          .eq('setting_key', 'social_auth_settings');
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('site_settings')
          .insert({ 
            setting_key: 'social_auth_settings', 
            setting_value: JSON.parse(JSON.stringify(settings)) 
          });
        if (error) throw error;
      }
      
      toast.success('Social login settings saved');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const updateProvider = (provider: keyof SocialAuthSettings, field: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [provider]: {
        ...prev[provider],
        [field]: value
      }
    }));
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const callbackUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/auth/callback` 
    : '';

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            Social Login Integration
          </CardTitle>
          <CardDescription>
            Enable social login providers for your customers. Configure API keys and enable/disable each provider.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Callback URL Info */}
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800 mb-6">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-600 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-medium text-blue-700 dark:text-blue-400 mb-1">
                  Callback URL (Required for all providers)
                </h4>
                <div className="flex items-center gap-2">
                  <code className="text-sm bg-blue-100 dark:bg-blue-800/50 px-2 py-1 rounded">
                    {callbackUrl}
                  </code>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => copyToClipboard(callbackUrl, 'callback')}
                    className="h-7 px-2"
                  >
                    {copiedField === 'callback' ? (
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-blue-600 dark:text-blue-500 mt-2">
                  Use this URL as the redirect/callback URL when configuring OAuth apps
                </p>
              </div>
            </div>
          </div>

          {/* Provider Cards */}
          <Accordion type="multiple" className="space-y-4">
            {/* Google */}
            <AccordionItem value="google" className="border rounded-lg px-4">
              <AccordionTrigger className="hover:no-underline py-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-white border flex items-center justify-center">
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                  </div>
                  <div className="text-left">
                    <div className="font-medium flex items-center gap-2">
                      Google
                      {settings.google.enabled && (
                        <Badge variant="default" className="bg-green-600">Active</Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">Sign in with Google Account</p>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-2 pb-4 space-y-4">
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <Label>Enable Google Login</Label>
                  <Switch
                    checked={settings.google.enabled}
                    onCheckedChange={(checked) => updateProvider('google', 'enabled', checked)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Client ID</Label>
                  <Input
                    value={settings.google.clientId}
                    onChange={(e) => updateProvider('google', 'clientId', e.target.value)}
                    placeholder="your-client-id.apps.googleusercontent.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Client Secret</Label>
                  <Input
                    type="password"
                    value={settings.google.clientSecret}
                    onChange={(e) => updateProvider('google', 'clientSecret', e.target.value)}
                    placeholder="GOCSPX-..."
                  />
                </div>

                <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                  <h5 className="font-medium text-amber-700 dark:text-amber-400 text-sm mb-2 flex items-center gap-2">
                    <Key className="w-4 h-4" />
                    How to get Google OAuth credentials
                  </h5>
                  <ol className="text-xs text-amber-600 dark:text-amber-500 space-y-1 list-decimal list-inside">
                    <li>Go to <a href="https://console.cloud.google.com" target="_blank" rel="noopener noreferrer" className="underline">Google Cloud Console</a></li>
                    <li>Create a new project or select existing one</li>
                    <li>Go to "APIs & Services" → "Credentials"</li>
                    <li>Click "Create Credentials" → "OAuth 2.0 Client IDs"</li>
                    <li>Choose "Web application" as application type</li>
                    <li>Add the callback URL to "Authorized redirect URIs"</li>
                    <li>Copy the Client ID and Client Secret</li>
                  </ol>
                  <a 
                    href="https://console.cloud.google.com/apis/credentials" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-amber-700 dark:text-amber-400 mt-2 hover:underline"
                  >
                    Open Google Cloud Console <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Facebook */}
            <AccordionItem value="facebook" className="border rounded-lg px-4">
              <AccordionTrigger className="hover:no-underline py-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#1877F2] flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                  </div>
                  <div className="text-left">
                    <div className="font-medium flex items-center gap-2">
                      Facebook
                      {settings.facebook.enabled && (
                        <Badge variant="default" className="bg-green-600">Active</Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">Sign in with Facebook</p>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-2 pb-4 space-y-4">
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <Label>Enable Facebook Login</Label>
                  <Switch
                    checked={settings.facebook.enabled}
                    onCheckedChange={(checked) => updateProvider('facebook', 'enabled', checked)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>App ID</Label>
                  <Input
                    value={settings.facebook.appId}
                    onChange={(e) => updateProvider('facebook', 'appId', e.target.value)}
                    placeholder="123456789012345"
                  />
                </div>

                <div className="space-y-2">
                  <Label>App Secret</Label>
                  <Input
                    type="password"
                    value={settings.facebook.appSecret}
                    onChange={(e) => updateProvider('facebook', 'appSecret', e.target.value)}
                    placeholder="abc123def456..."
                  />
                </div>

                <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                  <h5 className="font-medium text-amber-700 dark:text-amber-400 text-sm mb-2 flex items-center gap-2">
                    <Key className="w-4 h-4" />
                    How to get Facebook App credentials
                  </h5>
                  <ol className="text-xs text-amber-600 dark:text-amber-500 space-y-1 list-decimal list-inside">
                    <li>Go to <a href="https://developers.facebook.com" target="_blank" rel="noopener noreferrer" className="underline">Facebook Developers</a></li>
                    <li>Create a new app or select existing one</li>
                    <li>Choose "Consumer" or "Business" app type</li>
                    <li>Go to Settings → Basic to find App ID and App Secret</li>
                    <li>Add Facebook Login product to your app</li>
                    <li>In Facebook Login settings, add the callback URL to "Valid OAuth Redirect URIs"</li>
                  </ol>
                  <a 
                    href="https://developers.facebook.com/apps" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-amber-700 dark:text-amber-400 mt-2 hover:underline"
                  >
                    Open Facebook Developers <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* GitHub */}
            <AccordionItem value="github" className="border rounded-lg px-4">
              <AccordionTrigger className="hover:no-underline py-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#24292e] flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
                    </svg>
                  </div>
                  <div className="text-left">
                    <div className="font-medium flex items-center gap-2">
                      GitHub
                      {settings.github.enabled && (
                        <Badge variant="default" className="bg-green-600">Active</Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">Sign in with GitHub</p>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-2 pb-4 space-y-4">
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <Label>Enable GitHub Login</Label>
                  <Switch
                    checked={settings.github.enabled}
                    onCheckedChange={(checked) => updateProvider('github', 'enabled', checked)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Client ID</Label>
                  <Input
                    value={settings.github.clientId}
                    onChange={(e) => updateProvider('github', 'clientId', e.target.value)}
                    placeholder="Iv1.abc123..."
                  />
                </div>

                <div className="space-y-2">
                  <Label>Client Secret</Label>
                  <Input
                    type="password"
                    value={settings.github.clientSecret}
                    onChange={(e) => updateProvider('github', 'clientSecret', e.target.value)}
                    placeholder="abc123def456..."
                  />
                </div>

                <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                  <h5 className="font-medium text-amber-700 dark:text-amber-400 text-sm mb-2 flex items-center gap-2">
                    <Key className="w-4 h-4" />
                    How to get GitHub OAuth credentials
                  </h5>
                  <ol className="text-xs text-amber-600 dark:text-amber-500 space-y-1 list-decimal list-inside">
                    <li>Go to <a href="https://github.com/settings/developers" target="_blank" rel="noopener noreferrer" className="underline">GitHub Developer Settings</a></li>
                    <li>Click "New OAuth App"</li>
                    <li>Fill in your application details</li>
                    <li>Set "Authorization callback URL" to the callback URL above</li>
                    <li>After creating, click "Generate a new client secret"</li>
                    <li>Copy the Client ID and Client Secret</li>
                  </ol>
                  <a 
                    href="https://github.com/settings/developers" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-amber-700 dark:text-amber-400 mt-2 hover:underline"
                  >
                    Open GitHub Developer Settings <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Twitter/X */}
            <AccordionItem value="twitter" className="border rounded-lg px-4">
              <AccordionTrigger className="hover:no-underline py-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-black flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                    </svg>
                  </div>
                  <div className="text-left">
                    <div className="font-medium flex items-center gap-2">
                      Twitter / X
                      {settings.twitter.enabled && (
                        <Badge variant="default" className="bg-green-600">Active</Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">Sign in with X (Twitter)</p>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-2 pb-4 space-y-4">
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <Label>Enable Twitter/X Login</Label>
                  <Switch
                    checked={settings.twitter.enabled}
                    onCheckedChange={(checked) => updateProvider('twitter', 'enabled', checked)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>API Key (Consumer Key)</Label>
                  <Input
                    value={settings.twitter.apiKey}
                    onChange={(e) => updateProvider('twitter', 'apiKey', e.target.value)}
                    placeholder="abc123..."
                  />
                </div>

                <div className="space-y-2">
                  <Label>API Secret (Consumer Secret)</Label>
                  <Input
                    type="password"
                    value={settings.twitter.apiSecret}
                    onChange={(e) => updateProvider('twitter', 'apiSecret', e.target.value)}
                    placeholder="xyz789..."
                  />
                </div>

                <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                  <h5 className="font-medium text-amber-700 dark:text-amber-400 text-sm mb-2 flex items-center gap-2">
                    <Key className="w-4 h-4" />
                    How to get Twitter/X OAuth credentials
                  </h5>
                  <ol className="text-xs text-amber-600 dark:text-amber-500 space-y-1 list-decimal list-inside">
                    <li>Go to <a href="https://developer.twitter.com/en/portal/dashboard" target="_blank" rel="noopener noreferrer" className="underline">Twitter Developer Portal</a></li>
                    <li>Create a new Project and App</li>
                    <li>In "User authentication settings", enable OAuth 2.0</li>
                    <li>Set callback URL to the URL above</li>
                    <li>Go to "Keys and tokens" to get API Key and Secret</li>
                  </ol>
                  <a 
                    href="https://developer.twitter.com/en/portal/dashboard" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-amber-700 dark:text-amber-400 mt-2 hover:underline"
                  >
                    Open Twitter Developer Portal <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          {/* Save Button */}
          <Button 
            onClick={saveSettings}
            disabled={saving}
            className="w-full mt-6"
          >
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Save Social Login Settings
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
