import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { 
  Mail, 
  Save, 
  TestTube,
  Server,
  Shield,
  CheckCircle,
  AlertCircle,
  Loader2,
  Eye,
  EyeOff
} from "lucide-react";

interface SMTPSettings {
  provider: 'resend' | 'smtp' | 'none';
  resend_api_key: string;
  smtp_host: string;
  smtp_port: number;
  smtp_user: string;
  smtp_password: string;
  smtp_encryption: 'none' | 'ssl' | 'tls';
  from_email: string;
  from_name: string;
  reply_to: string;
  is_configured: boolean;
}

const defaultSettings: SMTPSettings = {
  provider: 'none',
  resend_api_key: '',
  smtp_host: '',
  smtp_port: 587,
  smtp_user: '',
  smtp_password: '',
  smtp_encryption: 'tls',
  from_email: '',
  from_name: 'Green Grass Store',
  reply_to: '',
  is_configured: false
};

// Common SMTP presets
const smtpPresets: Record<string, Partial<SMTPSettings>> = {
  hostinger: { smtp_host: 'smtp.hostinger.com', smtp_port: 465, smtp_encryption: 'ssl' },
  gmail: { smtp_host: 'smtp.gmail.com', smtp_port: 587, smtp_encryption: 'tls' },
  outlook: { smtp_host: 'smtp-mail.outlook.com', smtp_port: 587, smtp_encryption: 'tls' },
  custom: {}
};

export const SMTPSettingsManager = () => {
  const [settings, setSettings] = useState<SMTPSettings>(defaultSettings);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState('');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('site_settings')
        .select('setting_value')
        .eq('setting_key', 'smtp_settings')
        .single();

      if (data && !error) {
        const savedSettings = data.setting_value as unknown as SMTPSettings;
        setSettings({ ...defaultSettings, ...savedSettings });
      }
    } catch (error) {
      console.error('Error loading SMTP settings:', error);
    }
  };

  const saveSettings = async () => {
    setIsSaving(true);
    try {
      // Determine if properly configured
      const isConfigured = settings.provider === 'resend' 
        ? !!settings.resend_api_key
        : settings.provider === 'smtp' 
          ? !!settings.smtp_host && !!settings.smtp_user && !!settings.smtp_password
          : false;

      const updatedSettings = { ...settings, is_configured: isConfigured };

      const { error } = await supabase
        .from('site_settings')
        .upsert({
          setting_key: 'smtp_settings',
          setting_value: updatedSettings as any,
          updated_at: new Date().toISOString()
        }, { onConflict: 'setting_key' });

      if (error) throw error;
      
      setSettings(updatedSettings);
      toast.success("SMTP settings saved successfully");
    } catch (error) {
      console.error('Error saving SMTP settings:', error);
      toast.error("Failed to save settings");
    } finally {
      setIsSaving(false);
    }
  };

  const testEmailConnection = async () => {
    if (!testEmail) {
      toast.error("Please enter a test email address");
      return;
    }

    setIsTesting(true);
    setTestResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('send-order-email', {
        body: {
          type: 'test_email',
          test_email: testEmail,
          smtp_settings: settings
        }
      });

      if (error) throw error;
      
      setTestResult('success');
      toast.success("Test email sent successfully! Check your inbox.");
    } catch (error: any) {
      console.error('Error testing email:', error);
      setTestResult('error');
      toast.error("Failed to send test email: " + (error.message || 'Unknown error'));
    } finally {
      setIsTesting(false);
    }
  };

  const applyPreset = (preset: string) => {
    setSelectedPreset(preset);
    if (smtpPresets[preset]) {
      setSettings(prev => ({ ...prev, ...smtpPresets[preset] }));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-foreground">Email Configuration</h2>
          <p className="text-muted-foreground text-sm sm:text-base">Configure your email service provider for sending transactional emails</p>
        </div>
        <Button onClick={saveSettings} disabled={isSaving} className="gap-2">
          <Save className="w-4 h-4" />
          {isSaving ? "Saving..." : "Save Settings"}
        </Button>
      </div>

      {/* Provider Selection */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base flex items-center gap-2">
            <Server className="w-5 h-5 text-primary" />
            Email Provider
          </CardTitle>
          <CardDescription>Choose your email service provider</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <button
              onClick={() => setSettings(prev => ({ ...prev, provider: 'resend' }))}
              className={`p-4 border-2 rounded-xl text-left transition-all ${
                settings.provider === 'resend' 
                  ? 'border-primary bg-primary/5' 
                  : 'border-border hover:border-muted-foreground/30'
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <Mail className="w-5 h-5 text-primary" />
                <span className="font-semibold">Resend</span>
              </div>
              <p className="text-xs text-muted-foreground">Modern email API service with great deliverability</p>
            </button>

            <button
              onClick={() => setSettings(prev => ({ ...prev, provider: 'smtp' }))}
              className={`p-4 border-2 rounded-xl text-left transition-all ${
                settings.provider === 'smtp' 
                  ? 'border-primary bg-primary/5' 
                  : 'border-border hover:border-muted-foreground/30'
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <Server className="w-5 h-5 text-primary" />
                <span className="font-semibold">SMTP Server</span>
              </div>
              <p className="text-xs text-muted-foreground">Use Hostinger, Gmail, or any SMTP server</p>
            </button>

            <button
              onClick={() => setSettings(prev => ({ ...prev, provider: 'none' }))}
              className={`p-4 border-2 rounded-xl text-left transition-all ${
                settings.provider === 'none' 
                  ? 'border-primary bg-primary/5' 
                  : 'border-border hover:border-muted-foreground/30'
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="w-5 h-5 text-muted-foreground" />
                <span className="font-semibold">Disabled</span>
              </div>
              <p className="text-xs text-muted-foreground">Email functionality will be disabled</p>
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Resend Configuration */}
      {settings.provider === 'resend' && (
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              Resend API Configuration
            </CardTitle>
            <CardDescription>
              Get your API key from <a href="https://resend.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-primary underline">resend.com/api-keys</a>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>API Key</Label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={settings.resend_api_key}
                  onChange={(e) => setSettings(prev => ({ ...prev, resend_api_key: e.target.value }))}
                  placeholder="re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
              <h4 className="font-medium text-amber-800 dark:text-amber-200 mb-2">Important: Domain Verification</h4>
              <p className="text-sm text-amber-700 dark:text-amber-300">
                For production use, verify your domain at{' '}
                <a href="https://resend.com/domains" target="_blank" rel="noopener noreferrer" className="underline">resend.com/domains</a>.
                Without verification, emails can only be sent from onboarding@resend.dev.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* SMTP Configuration */}
      {settings.provider === 'smtp' && (
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base flex items-center gap-2">
              <Server className="w-5 h-5 text-primary" />
              SMTP Server Configuration
            </CardTitle>
            <CardDescription>Configure your SMTP server details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Preset Selection */}
            <div className="space-y-2">
              <Label>Quick Setup Preset</Label>
              <Select value={selectedPreset} onValueChange={applyPreset}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a preset or enter manually" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hostinger">Hostinger Email</SelectItem>
                  <SelectItem value="gmail">Gmail SMTP</SelectItem>
                  <SelectItem value="outlook">Outlook/Office 365</SelectItem>
                  <SelectItem value="custom">Custom SMTP Server</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>SMTP Host</Label>
                <Input
                  value={settings.smtp_host}
                  onChange={(e) => setSettings(prev => ({ ...prev, smtp_host: e.target.value }))}
                  placeholder="smtp.hostinger.com"
                />
              </div>

              <div className="space-y-2">
                <Label>SMTP Port</Label>
                <Input
                  type="number"
                  value={settings.smtp_port}
                  onChange={(e) => setSettings(prev => ({ ...prev, smtp_port: parseInt(e.target.value) || 587 }))}
                  placeholder="587"
                />
              </div>

              <div className="space-y-2">
                <Label>Username / Email</Label>
                <Input
                  value={settings.smtp_user}
                  onChange={(e) => setSettings(prev => ({ ...prev, smtp_user: e.target.value }))}
                  placeholder="your-email@domain.com"
                />
              </div>

              <div className="space-y-2">
                <Label>Password</Label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={settings.smtp_password}
                    onChange={(e) => setSettings(prev => ({ ...prev, smtp_password: e.target.value }))}
                    placeholder="Your email password"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label>Encryption</Label>
                <Select 
                  value={settings.smtp_encryption} 
                  onValueChange={(value: 'none' | 'ssl' | 'tls') => setSettings(prev => ({ ...prev, smtp_encryption: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tls">TLS (Recommended)</SelectItem>
                    <SelectItem value="ssl">SSL</SelectItem>
                    <SelectItem value="none">None (Not Recommended)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {selectedPreset === 'gmail' && (
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">Gmail Setup</h4>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  For Gmail, you need to create an App Password. Go to{' '}
                  <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noopener noreferrer" className="underline">
                    Google Account → App Passwords
                  </a>{' '}
                  and generate a new password for "Mail".
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Sender Settings */}
      {settings.provider !== 'none' && (
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base flex items-center gap-2">
              <Mail className="w-5 h-5 text-primary" />
              Sender Information
            </CardTitle>
            <CardDescription>Configure the sender details for outgoing emails</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>From Name</Label>
                <Input
                  value={settings.from_name}
                  onChange={(e) => setSettings(prev => ({ ...prev, from_name: e.target.value }))}
                  placeholder="Green Grass Store"
                />
              </div>

              <div className="space-y-2">
                <Label>From Email</Label>
                <Input
                  type="email"
                  value={settings.from_email}
                  onChange={(e) => setSettings(prev => ({ ...prev, from_email: e.target.value }))}
                  placeholder="orders@yourstore.com"
                />
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label>Reply-To Email (Optional)</Label>
                <Input
                  type="email"
                  value={settings.reply_to}
                  onChange={(e) => setSettings(prev => ({ ...prev, reply_to: e.target.value }))}
                  placeholder="support@yourstore.com"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Test Email */}
      {settings.provider !== 'none' && (
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base flex items-center gap-2">
              <TestTube className="w-5 h-5 text-primary" />
              Test Email Connection
            </CardTitle>
            <CardDescription>Send a test email to verify your configuration</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <Input
                  type="email"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  placeholder="Enter your email to receive test"
                />
              </div>
              <Button 
                onClick={testEmailConnection} 
                disabled={isTesting || !settings.is_configured}
                variant="outline"
                className="gap-2"
              >
                {isTesting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Mail className="w-4 h-4" />
                    Send Test Email
                  </>
                )}
              </Button>
            </div>

            {testResult && (
              <div className={`mt-4 p-4 rounded-lg flex items-center gap-3 ${
                testResult === 'success' 
                  ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300' 
                  : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'
              }`}>
                {testResult === 'success' ? (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    <span>Test email sent successfully! Check your inbox.</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-5 h-5" />
                    <span>Failed to send test email. Please check your settings.</span>
                  </>
                )}
              </div>
            )}

            {!settings.is_configured && (
              <p className="text-sm text-muted-foreground mt-4">
                Save your settings first before testing the email connection.
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Status Card */}
      <Card className={settings.is_configured ? 'border-green-200 bg-green-50/50 dark:bg-green-900/10' : 'border-amber-200 bg-amber-50/50 dark:bg-amber-900/10'}>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            {settings.is_configured ? (
              <>
                <div className="w-12 h-12 bg-green-100 dark:bg-green-800 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-300" />
                </div>
                <div>
                  <h3 className="font-semibold text-green-800 dark:text-green-200">Email Configured</h3>
                  <p className="text-sm text-green-600 dark:text-green-300">
                    Using {settings.provider === 'resend' ? 'Resend API' : 'SMTP Server'} for sending emails
                  </p>
                </div>
              </>
            ) : (
              <>
                <div className="w-12 h-12 bg-amber-100 dark:bg-amber-800 rounded-full flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-amber-600 dark:text-amber-300" />
                </div>
                <div>
                  <h3 className="font-semibold text-amber-800 dark:text-amber-200">Email Not Configured</h3>
                  <p className="text-sm text-amber-600 dark:text-amber-300">
                    Complete the configuration and save to enable email functionality
                  </p>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
