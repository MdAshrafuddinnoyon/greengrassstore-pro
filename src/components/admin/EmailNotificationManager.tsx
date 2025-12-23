import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Mail, Save, Bell, ShoppingBag, MessageSquare, FileText, Send, CheckCircle2, Plus, X, Users } from "lucide-react";

interface EmailNotificationSettings {
  enabled: boolean;
  adminEmail: string;
  additionalEmails: string[];
  sendOnNewOrder: boolean;
  sendOnCustomRequest: boolean;
  sendOnContactForm: boolean;
  sendOnNewsletter: boolean;
  fromName: string;
  fromEmail: string;
  orderNotificationChannel: 'email' | 'both';
  telegramBotToken: string;
  telegramChatId: string;
  telegramEnabled: boolean;
}

export const EmailNotificationManager = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testingSend, setTestingSend] = useState(false);
  
  const [settings, setSettings] = useState<EmailNotificationSettings>({
    enabled: false,
    adminEmail: "",
    additionalEmails: [],
    sendOnNewOrder: true,
    sendOnCustomRequest: true,
    sendOnContactForm: true,
    sendOnNewsletter: false,
    fromName: "Green Grass Store",
    fromEmail: "noreply@example.com",
    orderNotificationChannel: 'email',
    telegramBotToken: "",
    telegramChatId: "",
    telegramEnabled: false
  });
  const [newEmail, setNewEmail] = useState("");

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('site_settings')
        .select('*')
        .eq('setting_key', 'email_notification_settings')
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (data?.setting_value) {
        setSettings(data.setting_value as unknown as EmailNotificationSettings);
      }
    } catch (error) {
      console.error('Error fetching email settings:', error);
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
        .eq('setting_key', 'email_notification_settings')
        .single();

      if (existing) {
        const { error } = await supabase
          .from('site_settings')
          .update({ setting_value: JSON.parse(JSON.stringify(settings)) })
          .eq('setting_key', 'email_notification_settings');
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('site_settings')
          .insert({ 
            setting_key: 'email_notification_settings', 
            setting_value: JSON.parse(JSON.stringify(settings)) 
          });
        if (error) throw error;
      }
      
      toast.success('Email notification settings saved');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const sendTestEmail = async () => {
    if (!settings.adminEmail) {
      toast.error('Please enter an admin email first');
      return;
    }
    
    setTestingSend(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-order-email', {
        body: {
          to: settings.adminEmail,
          subject: 'Test Email from Green Grass Store',
          type: 'test',
          data: {
            message: 'This is a test email to verify your email notification settings are working correctly.'
          }
        }
      });

      if (error) throw error;
      toast.success('Test email sent successfully! Check your inbox.');
    } catch (error: any) {
      console.error('Error sending test email:', error);
      toast.error('Failed to send test email. Please check your email configuration.');
    } finally {
      setTestingSend(false);
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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="w-5 h-5 text-primary" />
          Email Notification Settings
        </CardTitle>
        <CardDescription>
          Configure email notifications for orders, custom requests, and contact form submissions
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Master Toggle */}
        <div className="flex items-center justify-between p-4 bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg border border-primary/20">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/20 rounded-lg">
              <Bell className="w-5 h-5 text-primary" />
            </div>
            <div>
              <Label className="text-base font-medium">Enable Email Notifications</Label>
              <p className="text-sm text-muted-foreground">Receive email alerts for store activities</p>
            </div>
          </div>
          <Switch
            checked={settings.enabled}
            onCheckedChange={(checked) => 
              setSettings(prev => ({ ...prev, enabled: checked }))
            }
          />
        </div>

        {/* Admin Email */}
        <div className="space-y-2">
          <Label htmlFor="admin-email" className="flex items-center gap-2">
            <Mail className="w-4 h-4 text-muted-foreground" />
            Admin Email Address
          </Label>
          <div className="flex gap-2">
            <Input
              id="admin-email"
              type="email"
              value={settings.adminEmail}
              onChange={(e) => 
                setSettings(prev => ({ ...prev, adminEmail: e.target.value }))
              }
              placeholder="admin@yourdomain.com"
              className="flex-1"
            />
            <Button 
              variant="outline" 
              onClick={sendTestEmail}
              disabled={testingSend || !settings.adminEmail}
            >
              {testingSend ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Send className="w-4 h-4 mr-2" />
              )}
              Test
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Primary admin email address for notifications
          </p>
        </div>

        {/* Additional Email Recipients */}
        <div className="space-y-3">
          <Label className="flex items-center gap-2">
            <Users className="w-4 h-4 text-muted-foreground" />
            Additional Email Recipients
          </Label>
          <div className="flex gap-2">
            <Input
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="another@email.com"
              className="flex-1"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && newEmail && newEmail.includes('@')) {
                  e.preventDefault();
                  if (!settings.additionalEmails.includes(newEmail)) {
                    setSettings(prev => ({
                      ...prev,
                      additionalEmails: [...prev.additionalEmails, newEmail]
                    }));
                    setNewEmail('');
                  }
                }
              }}
            />
            <Button 
              variant="outline"
              onClick={() => {
                if (newEmail && newEmail.includes('@') && !settings.additionalEmails.includes(newEmail)) {
                  setSettings(prev => ({
                    ...prev,
                    additionalEmails: [...prev.additionalEmails, newEmail]
                  }));
                  setNewEmail('');
                }
              }}
              disabled={!newEmail || !newEmail.includes('@')}
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          {settings.additionalEmails.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {settings.additionalEmails.map((email, index) => (
                <div 
                  key={index} 
                  className="flex items-center gap-1 px-2 py-1 bg-muted rounded-md text-sm"
                >
                  <span>{email}</span>
                  <button
                    onClick={() => {
                      setSettings(prev => ({
                        ...prev,
                        additionalEmails: prev.additionalEmails.filter((_, i) => i !== index)
                      }));
                    }}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
          <p className="text-xs text-muted-foreground">
            These emails will also receive notification copies
          </p>
        </div>

        {/* From Email Settings */}
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="from-name">From Name</Label>
            <Input
              id="from-name"
              value={settings.fromName}
              onChange={(e) => 
                setSettings(prev => ({ ...prev, fromName: e.target.value }))
              }
              placeholder="Your Store Name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="from-email">From Email (Reply-To)</Label>
            <Input
              id="from-email"
              type="email"
              value={settings.fromEmail}
              onChange={(e) => 
                setSettings(prev => ({ ...prev, fromEmail: e.target.value }))
              }
              placeholder="noreply@yourdomain.com"
            />
          </div>
        </div>

        {/* Notification Types */}
        <div className="border rounded-lg divide-y">
          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <ShoppingBag className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <Label className="font-medium">New Order Notifications</Label>
                <p className="text-xs text-muted-foreground">Get notified when customers place orders</p>
              </div>
            </div>
            <Switch
              checked={settings.sendOnNewOrder}
              onCheckedChange={(checked) => 
                setSettings(prev => ({ ...prev, sendOnNewOrder: checked }))
              }
            />
          </div>

          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <MessageSquare className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <Label className="font-medium">Custom Request Notifications</Label>
                <p className="text-xs text-muted-foreground">Get notified for custom requirements</p>
              </div>
            </div>
            <Switch
              checked={settings.sendOnCustomRequest}
              onCheckedChange={(checked) => 
                setSettings(prev => ({ ...prev, sendOnCustomRequest: checked }))
              }
            />
          </div>

          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <FileText className="w-4 h-4 text-purple-600" />
              </div>
              <div>
                <Label className="font-medium">Contact Form Notifications</Label>
                <p className="text-xs text-muted-foreground">Get notified for contact form messages</p>
              </div>
            </div>
            <Switch
              checked={settings.sendOnContactForm}
              onCheckedChange={(checked) => 
                setSettings(prev => ({ ...prev, sendOnContactForm: checked }))
              }
            />
          </div>

          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 rounded-lg">
                <Mail className="w-4 h-4 text-amber-600" />
              </div>
              <div>
                <Label className="font-medium">Newsletter Subscriptions</Label>
                <p className="text-xs text-muted-foreground">Get notified for new subscribers</p>
              </div>
            </div>
            <Switch
              checked={settings.sendOnNewsletter}
              onCheckedChange={(checked) => 
                setSettings(prev => ({ ...prev, sendOnNewsletter: checked }))
              }
            />
          </div>
        </div>

        {/* Status Indicator */}
        {settings.enabled && settings.adminEmail && (
          <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
            <span className="text-sm text-green-700">
              Email notifications are active and will be sent to <strong>{settings.adminEmail}</strong>
            </span>
          </div>
        )}

        <Button 
          onClick={saveSettings}
          disabled={saving}
          className="w-full"
        >
          {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          Save Email Settings
        </Button>
      </CardContent>
    </Card>
  );
};
