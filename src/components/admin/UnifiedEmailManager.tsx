import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  Mail, 
  Save, 
  Eye, 
  Copy, 
  RefreshCw,
  CheckCircle,
  Truck,
  Package,
  Bell,
  ShoppingBag,
  MessageSquare,
  FileText,
  Send,
  CheckCircle2,
  Plus,
  X,
  Users,
  Loader2,
  Image,
  Link,
  Facebook,
  Instagram,
  Twitter,
  Palette,
  Settings2
} from "lucide-react";

// ========== TYPES ==========
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
}

interface EmailBranding {
  logoUrl: string;
  bannerUrl: string;
  primaryColor: string;
  secondaryColor: string;
  footerText: string;
  socialLinks: {
    facebook: string;
    instagram: string;
    twitter: string;
    youtube: string;
    whatsapp: string;
  };
  companyAddress: string;
  companyPhone: string;
}

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  variables: string[];
}

// ========== DEFAULT DATA ==========
const defaultNotificationSettings: EmailNotificationSettings = {
  enabled: false,
  adminEmail: "",
  additionalEmails: [],
  sendOnNewOrder: true,
  sendOnCustomRequest: true,
  sendOnContactForm: true,
  sendOnNewsletter: false,
  fromName: "Green Grass Store",
  fromEmail: "noreply@example.com"
};

const defaultBranding: EmailBranding = {
  logoUrl: "",
  bannerUrl: "",
  primaryColor: "#2d5a3d",
  secondaryColor: "#f9f9f9",
  footerText: "Thank you for shopping with us!",
  socialLinks: {
    facebook: "",
    instagram: "",
    twitter: "",
    youtube: "",
    whatsapp: ""
  },
  companyAddress: "",
  companyPhone: ""
};

const defaultTemplates: EmailTemplate[] = [
  {
    id: "order_confirmation",
    name: "Order Confirmation",
    subject: "Order Confirmed - {{order_number}}",
    body: `<h2>Thank you for your order, {{customer_name}}!</h2>
<p>Your order <strong>{{order_number}}</strong> has been confirmed.</p>

<div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
  <h3>Order Summary</h3>
  {{order_items}}
  <hr>
  <p><strong>Total: {{order_total}}</strong></p>
</div>

<p>We will notify you when your order is shipped.</p>

<p style="text-align: center;">
  <a href="{{tracking_url}}" class="btn">Track Your Order</a>
</p>`,
    variables: ["customer_name", "order_number", "order_items", "order_total", "tracking_url"]
  },
  {
    id: "order_shipped",
    name: "Order Shipped",
    subject: "Your Order is on the Way - {{order_number}}",
    body: `<h2>Great news, {{customer_name}}!</h2>
<p>Your order <strong>{{order_number}}</strong> has been shipped and is on its way to you.</p>

<div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
  <h3>📦 Tracking Information</h3>
  <p>Tracking Number: <strong>{{tracking_number}}</strong></p>
  <p>Carrier: {{carrier_name}}</p>
  <p>Estimated Delivery: {{estimated_delivery}}</p>
  <br>
  <a href="{{tracking_url}}" class="btn">Track Package</a>
</div>

<p>Shipping Address:</p>
<p>{{shipping_address}}</p>`,
    variables: ["customer_name", "order_number", "tracking_number", "carrier_name", "estimated_delivery", "tracking_url", "shipping_address"]
  },
  {
    id: "order_delivered",
    name: "Order Delivered",
    subject: "Your Order Has Been Delivered - {{order_number}}",
    body: `<h2>🎉 Your order has arrived, {{customer_name}}!</h2>
<p>Order <strong>{{order_number}}</strong> has been successfully delivered.</p>

<p>We hope you love your purchase! If you have any questions or concerns, please don't hesitate to contact us.</p>

<p style="text-align: center; margin: 30px 0;">
  <a href="{{review_url}}" class="btn">Leave a Review</a>
</p>

<p>Thank you for shopping with us!</p>`,
    variables: ["customer_name", "order_number", "review_url"]
  },
  {
    id: "welcome_email",
    name: "Welcome Email",
    subject: "Welcome to {{store_name}}!",
    body: `<h2>Hello {{customer_name}},</h2>
<p>Thank you for joining our community! We're excited to have you.</p>

<p>Here's what you can expect:</p>
<ul>
  <li>Exclusive access to new products</li>
  <li>Special discounts and offers</li>
  <li>Expert plant care tips</li>
</ul>

<p style="text-align: center; margin: 30px 0;">
  <a href="{{shop_url}}" class="btn">Start Shopping</a>
</p>`,
    variables: ["customer_name", "shop_url", "store_name"]
  }
];

const templateIcons: Record<string, any> = {
  order_confirmation: CheckCircle,
  order_shipped: Truck,
  order_delivered: Package,
  welcome_email: Mail
};

// ========== MAIN COMPONENT ==========
export const UnifiedEmailManager = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testingSend, setTestingSend] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  
  // Notification Settings
  const [notificationSettings, setNotificationSettings] = useState<EmailNotificationSettings>(defaultNotificationSettings);
  
  // Branding
  const [branding, setBranding] = useState<EmailBranding>(defaultBranding);
  const [showLogoPicker, setShowLogoPicker] = useState(false);
  const [showBannerPicker, setShowBannerPicker] = useState(false);
  
  // Templates
  const [templates, setTemplates] = useState<EmailTemplate[]>(defaultTemplates);
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate>(defaultTemplates[0]);
  const [previewMode, setPreviewMode] = useState(false);

  useEffect(() => {
    loadAllSettings();
  }, []);

  const loadAllSettings = async () => {
    setLoading(true);
    try {
      // Load notification settings
      const { data: notifData } = await supabase
        .from('site_settings')
        .select('setting_value')
        .eq('setting_key', 'email_notification_settings')
        .single();

      if (notifData?.setting_value) {
        setNotificationSettings({ ...defaultNotificationSettings, ...notifData.setting_value as any });
      }

      // Load branding
      const { data: brandData } = await supabase
        .from('site_settings')
        .select('setting_value')
        .eq('setting_key', 'email_branding')
        .single();

      if (brandData?.setting_value) {
        setBranding({ ...defaultBranding, ...brandData.setting_value as any });
      }

      // Load templates
      const { data: templateData } = await supabase
        .from('site_settings')
        .select('setting_value')
        .eq('setting_key', 'email_templates')
        .single();

      if (templateData?.setting_value) {
        const savedTemplates = templateData.setting_value as unknown as EmailTemplate[];
        if (Array.isArray(savedTemplates) && savedTemplates.length > 0) {
          setTemplates(savedTemplates);
          setSelectedTemplate(savedTemplates[0]);
        }
      }
    } catch (error) {
      console.error('Error loading email settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveAllSettings = async () => {
    setSaving(true);
    try {
      // Update current template in templates array
      const updatedTemplates = templates.map(t => 
        t.id === selectedTemplate.id ? selectedTemplate : t
      );
      setTemplates(updatedTemplates);

      // Save all settings
      await Promise.all([
        supabase.from('site_settings').upsert({
          setting_key: 'email_notification_settings',
          setting_value: JSON.parse(JSON.stringify(notificationSettings)),
          updated_at: new Date().toISOString()
        }, { onConflict: 'setting_key' }),
        
        supabase.from('site_settings').upsert({
          setting_key: 'email_branding',
          setting_value: JSON.parse(JSON.stringify(branding)),
          updated_at: new Date().toISOString()
        }, { onConflict: 'setting_key' }),
        
        supabase.from('site_settings').upsert({
          setting_key: 'email_templates',
          setting_value: updatedTemplates as any,
          updated_at: new Date().toISOString()
        }, { onConflict: 'setting_key' })
      ]);

      toast.success('Email settings saved successfully');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const sendTestEmail = async () => {
    if (!notificationSettings.adminEmail) {
      toast.error('Please enter an admin email first');
      return;
    }
    
    setTestingSend(true);
    try {
      const { error } = await supabase.functions.invoke('send-order-email', {
        body: {
          to: notificationSettings.adminEmail,
          subject: 'Test Email from Green Grass Store',
          type: 'test',
          data: {
            message: 'This is a test email to verify your email notification settings are working correctly.'
          }
        }
      });

      if (error) throw error;
      toast.success('Test email sent successfully!');
    } catch (error: any) {
      console.error('Error sending test email:', error);
      toast.error('Failed to send test email');
    } finally {
      setTestingSend(false);
    }
  };

  const copyVariable = (variable: string) => {
    navigator.clipboard.writeText(`{{${variable}}}`);
    toast.success(`Copied {{${variable}}} to clipboard`);
  };

  const resetTemplateToDefault = () => {
    const defaultTemplate = defaultTemplates.find(t => t.id === selectedTemplate.id);
    if (defaultTemplate) {
      setSelectedTemplate(defaultTemplate);
      toast.info("Template reset to default");
    }
  };

  const getPreviewHtml = () => {
    const sampleData: Record<string, string> = {
      store_name: notificationSettings.fromName || "Green Grass Store",
      customer_name: "John Doe",
      order_number: "ORD-123456",
      order_items: "<p>Palm Tree × 2 - AED 150.00</p><p>Ceramic Pot × 1 - AED 75.00</p>",
      order_total: "AED 225.00",
      tracking_url: "#",
      tracking_number: "TRK-987654321",
      carrier_name: "DHL Express",
      estimated_delivery: "Dec 10, 2025",
      shipping_address: "123 Main Street, Dubai, UAE",
      review_url: "#",
      shop_url: "#",
      year: new Date().getFullYear().toString()
    };

    let content = selectedTemplate.body;
    for (const [key, value] of Object.entries(sampleData)) {
      content = content.replace(new RegExp(`{{${key}}}`, 'g'), value);
    }

    // Build social links HTML
    let socialLinksHtml = '';
    if (branding.socialLinks.facebook || branding.socialLinks.instagram || branding.socialLinks.twitter) {
      socialLinksHtml = `
        <div style="text-align: center; margin: 20px 0;">
          ${branding.socialLinks.facebook ? `<a href="${branding.socialLinks.facebook}" style="margin: 0 10px; color: ${branding.primaryColor};">Facebook</a>` : ''}
          ${branding.socialLinks.instagram ? `<a href="${branding.socialLinks.instagram}" style="margin: 0 10px; color: ${branding.primaryColor};">Instagram</a>` : ''}
          ${branding.socialLinks.twitter ? `<a href="${branding.socialLinks.twitter}" style="margin: 0 10px; color: ${branding.primaryColor};">Twitter</a>` : ''}
          ${branding.socialLinks.youtube ? `<a href="${branding.socialLinks.youtube}" style="margin: 0 10px; color: ${branding.primaryColor};">YouTube</a>` : ''}
          ${branding.socialLinks.whatsapp ? `<a href="https://wa.me/${branding.socialLinks.whatsapp}" style="margin: 0 10px; color: ${branding.primaryColor};">WhatsApp</a>` : ''}
        </div>
      `;
    }

    return `<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; }
    .header { background: ${branding.primaryColor}; color: white; padding: 20px; text-align: center; }
    .header img { max-height: 60px; margin-bottom: 10px; }
    .banner { width: 100%; max-height: 200px; object-fit: cover; }
    .content { padding: 30px 20px; background: ${branding.secondaryColor}; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; background: #f1f1f1; }
    .btn { display: inline-block; background: ${branding.primaryColor}; color: white !important; padding: 12px 24px; text-decoration: none; border-radius: 4px; }
    a { color: ${branding.primaryColor}; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      ${branding.logoUrl ? `<img src="${branding.logoUrl}" alt="Logo">` : ''}
      <h1 style="margin: 0;">${notificationSettings.fromName || 'Green Grass Store'}</h1>
    </div>
    ${branding.bannerUrl ? `<img src="${branding.bannerUrl}" class="banner" alt="Banner">` : ''}
    <div class="content">
      ${content}
    </div>
    <div class="footer">
      ${socialLinksHtml}
      <p>${branding.footerText}</p>
      ${branding.companyAddress ? `<p>${branding.companyAddress}</p>` : ''}
      ${branding.companyPhone ? `<p>Phone: ${branding.companyPhone}</p>` : ''}
      <p>© ${new Date().getFullYear()} ${notificationSettings.fromName || 'Green Grass Store'}. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const Icon = templateIcons[selectedTemplate.id] || Mail;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Email Settings</h2>
          <p className="text-muted-foreground">Configure notifications, branding, and email templates</p>
        </div>
        <Button onClick={saveAllSettings} disabled={saving} className="gap-2">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? "Saving..." : "Save All Settings"}
        </Button>
      </div>

      <Tabs defaultValue="notifications" className="space-y-6">
        <TabsList className="bg-muted/50 p-1 flex-wrap h-auto gap-1">
          <TabsTrigger value="notifications" className="gap-2">
            <Bell className="w-4 h-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="branding" className="gap-2">
            <Palette className="w-4 h-4" />
            Branding & Design
          </TabsTrigger>
          <TabsTrigger value="templates" className="gap-2">
            <FileText className="w-4 h-4" />
            Templates
          </TabsTrigger>
        </TabsList>

        {/* ========== NOTIFICATIONS TAB ========== */}
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="w-5 h-5 text-primary" />
                Email Notification Settings
              </CardTitle>
              <CardDescription>
                Configure when and where to receive email notifications
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
                  checked={notificationSettings.enabled}
                  onCheckedChange={(checked) => 
                    setNotificationSettings(prev => ({ ...prev, enabled: checked }))
                  }
                />
              </div>

              {/* Admin Email */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  Primary Admin Email
                </Label>
                <div className="flex gap-2">
                  <Input
                    type="email"
                    value={notificationSettings.adminEmail}
                    onChange={(e) => 
                      setNotificationSettings(prev => ({ ...prev, adminEmail: e.target.value }))
                    }
                    placeholder="admin@yourdomain.com"
                    className="flex-1"
                  />
                  <Button 
                    variant="outline" 
                    onClick={sendTestEmail}
                    disabled={testingSend || !notificationSettings.adminEmail}
                  >
                    {testingSend ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4 mr-2" />
                    )}
                    Test
                  </Button>
                </div>
              </div>

              {/* Additional Emails */}
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
                        if (!notificationSettings.additionalEmails.includes(newEmail)) {
                          setNotificationSettings(prev => ({
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
                      if (newEmail && newEmail.includes('@') && !notificationSettings.additionalEmails.includes(newEmail)) {
                        setNotificationSettings(prev => ({
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
                {notificationSettings.additionalEmails.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {notificationSettings.additionalEmails.map((email, index) => (
                      <div key={index} className="flex items-center gap-1 px-2 py-1 bg-muted rounded-md text-sm">
                        <span>{email}</span>
                        <button
                          onClick={() => {
                            setNotificationSettings(prev => ({
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
              </div>

              {/* From Settings */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>From Name</Label>
                  <Input
                    value={notificationSettings.fromName}
                    onChange={(e) => 
                      setNotificationSettings(prev => ({ ...prev, fromName: e.target.value }))
                    }
                    placeholder="Your Store Name"
                  />
                </div>
                <div className="space-y-2">
                  <Label>From Email</Label>
                  <Input
                    type="email"
                    value={notificationSettings.fromEmail}
                    onChange={(e) => 
                      setNotificationSettings(prev => ({ ...prev, fromEmail: e.target.value }))
                    }
                    placeholder="noreply@yourdomain.com"
                  />
                </div>
              </div>

              {/* Notification Types */}
              <div className="border rounded-lg divide-y">
                <div className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                      <ShoppingBag className="w-4 h-4 text-green-600" />
                    </div>
                    <div>
                      <Label className="font-medium">New Order Notifications</Label>
                      <p className="text-xs text-muted-foreground">Get notified when customers place orders</p>
                    </div>
                  </div>
                  <Switch
                    checked={notificationSettings.sendOnNewOrder}
                    onCheckedChange={(checked) => 
                      setNotificationSettings(prev => ({ ...prev, sendOnNewOrder: checked }))
                    }
                  />
                </div>

                <div className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                      <MessageSquare className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <Label className="font-medium">Custom Request Notifications</Label>
                      <p className="text-xs text-muted-foreground">Get notified for custom requirements</p>
                    </div>
                  </div>
                  <Switch
                    checked={notificationSettings.sendOnCustomRequest}
                    onCheckedChange={(checked) => 
                      setNotificationSettings(prev => ({ ...prev, sendOnCustomRequest: checked }))
                    }
                  />
                </div>

                <div className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                      <FileText className="w-4 h-4 text-purple-600" />
                    </div>
                    <div>
                      <Label className="font-medium">Contact Form Notifications</Label>
                      <p className="text-xs text-muted-foreground">Get notified for contact form messages</p>
                    </div>
                  </div>
                  <Switch
                    checked={notificationSettings.sendOnContactForm}
                    onCheckedChange={(checked) => 
                      setNotificationSettings(prev => ({ ...prev, sendOnContactForm: checked }))
                    }
                  />
                </div>

                <div className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                      <Mail className="w-4 h-4 text-amber-600" />
                    </div>
                    <div>
                      <Label className="font-medium">Newsletter Subscriptions</Label>
                      <p className="text-xs text-muted-foreground">Get notified for new subscribers</p>
                    </div>
                  </div>
                  <Switch
                    checked={notificationSettings.sendOnNewsletter}
                    onCheckedChange={(checked) => 
                      setNotificationSettings(prev => ({ ...prev, sendOnNewsletter: checked }))
                    }
                  />
                </div>
              </div>

              {/* Status */}
              {notificationSettings.enabled && notificationSettings.adminEmail && (
                <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  <span className="text-sm text-green-700 dark:text-green-400">
                    Email notifications are active
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ========== BRANDING TAB ========== */}
        <TabsContent value="branding" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="w-5 h-5 text-primary" />
                Email Branding & Design
              </CardTitle>
              <CardDescription>
                Customize the look and feel of your email templates
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Logo & Banner */}
              <div className="grid sm:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label className="flex items-center gap-2">
                    <Image className="w-4 h-4" />
                    Logo
                  </Label>
                  {branding.logoUrl ? (
                    <div className="relative border rounded-lg p-4 bg-muted/30">
                      <img src={branding.logoUrl} alt="Logo" className="max-h-16 mx-auto" />
                      <Button
                        size="sm"
                        variant="ghost"
                        className="absolute top-2 right-2"
                        onClick={() => setBranding(prev => ({ ...prev, logoUrl: '' }))}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <Button variant="outline" className="w-full" onClick={() => setShowLogoPicker(true)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Logo
                    </Button>
                  )}
                </div>

                <div className="space-y-3">
                  <Label className="flex items-center gap-2">
                    <Image className="w-4 h-4" />
                    Header Banner
                  </Label>
                  {branding.bannerUrl ? (
                    <div className="relative border rounded-lg overflow-hidden">
                      <img src={branding.bannerUrl} alt="Banner" className="w-full h-24 object-cover" />
                      <Button
                        size="sm"
                        variant="ghost"
                        className="absolute top-2 right-2 bg-background/80"
                        onClick={() => setBranding(prev => ({ ...prev, bannerUrl: '' }))}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <Button variant="outline" className="w-full" onClick={() => setShowBannerPicker(true)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Banner
                    </Button>
                  )}
                </div>
              </div>

              {/* Colors */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Primary Color (Header & Buttons)</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={branding.primaryColor}
                      onChange={(e) => setBranding(prev => ({ ...prev, primaryColor: e.target.value }))}
                      className="w-12 h-10 p-1 cursor-pointer"
                    />
                    <Input
                      value={branding.primaryColor}
                      onChange={(e) => setBranding(prev => ({ ...prev, primaryColor: e.target.value }))}
                      placeholder="#2d5a3d"
                      className="flex-1"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Background Color</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={branding.secondaryColor}
                      onChange={(e) => setBranding(prev => ({ ...prev, secondaryColor: e.target.value }))}
                      className="w-12 h-10 p-1 cursor-pointer"
                    />
                    <Input
                      value={branding.secondaryColor}
                      onChange={(e) => setBranding(prev => ({ ...prev, secondaryColor: e.target.value }))}
                      placeholder="#f9f9f9"
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>

              {/* Social Links */}
              <div className="space-y-4">
                <Label className="text-base font-medium">Social Media Links</Label>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2 text-sm">
                      <Facebook className="w-4 h-4 text-blue-600" />
                      Facebook
                    </Label>
                    <Input
                      value={branding.socialLinks.facebook}
                      onChange={(e) => setBranding(prev => ({
                        ...prev,
                        socialLinks: { ...prev.socialLinks, facebook: e.target.value }
                      }))}
                      placeholder="https://facebook.com/yourpage"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2 text-sm">
                      <Instagram className="w-4 h-4 text-pink-600" />
                      Instagram
                    </Label>
                    <Input
                      value={branding.socialLinks.instagram}
                      onChange={(e) => setBranding(prev => ({
                        ...prev,
                        socialLinks: { ...prev.socialLinks, instagram: e.target.value }
                      }))}
                      placeholder="https://instagram.com/yourhandle"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2 text-sm">
                      <Twitter className="w-4 h-4" />
                      Twitter/X
                    </Label>
                    <Input
                      value={branding.socialLinks.twitter}
                      onChange={(e) => setBranding(prev => ({
                        ...prev,
                        socialLinks: { ...prev.socialLinks, twitter: e.target.value }
                      }))}
                      placeholder="https://twitter.com/yourhandle"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2 text-sm">
                      <MessageSquare className="w-4 h-4 text-green-600" />
                      WhatsApp Number
                    </Label>
                    <Input
                      value={branding.socialLinks.whatsapp}
                      onChange={(e) => setBranding(prev => ({
                        ...prev,
                        socialLinks: { ...prev.socialLinks, whatsapp: e.target.value }
                      }))}
                      placeholder="+971501234567"
                    />
                  </div>
                </div>
              </div>

              {/* Footer Info */}
              <div className="space-y-4">
                <Label className="text-base font-medium">Footer Information</Label>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Footer Text</Label>
                    <Input
                      value={branding.footerText}
                      onChange={(e) => setBranding(prev => ({ ...prev, footerText: e.target.value }))}
                      placeholder="Thank you for shopping with us!"
                    />
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Company Address</Label>
                      <Input
                        value={branding.companyAddress}
                        onChange={(e) => setBranding(prev => ({ ...prev, companyAddress: e.target.value }))}
                        placeholder="123 Main Street, Dubai, UAE"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Phone Number</Label>
                      <Input
                        value={branding.companyPhone}
                        onChange={(e) => setBranding(prev => ({ ...prev, companyPhone: e.target.value }))}
                        placeholder="+971 50 123 4567"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ========== TEMPLATES TAB ========== */}
        <TabsContent value="templates" className="space-y-6">
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Template List */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle className="text-base">Templates</CardTitle>
                <CardDescription>Select a template to edit</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {templates.map((template) => {
                  const TIcon = templateIcons[template.id] || Mail;
                  return (
                    <button
                      key={template.id}
                      onClick={() => setSelectedTemplate(template)}
                      className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors ${
                        selectedTemplate.id === template.id
                          ? 'bg-primary text-primary-foreground'
                          : 'hover:bg-muted'
                      }`}
                    >
                      <TIcon className="w-5 h-5" />
                      <span className="font-medium text-sm">{template.name}</span>
                    </button>
                  );
                })}
              </CardContent>
            </Card>

            {/* Template Editor */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{selectedTemplate.name}</CardTitle>
                      <CardDescription>Edit template content</CardDescription>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={resetTemplateToDefault}>
                      <RefreshCw className="w-4 h-4 mr-1" />
                      Reset
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setPreviewMode(!previewMode)}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      {previewMode ? 'Edit' : 'Preview'}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {previewMode ? (
                  <div className="border rounded-lg overflow-hidden">
                    <div className="bg-muted px-4 py-2 text-sm text-muted-foreground border-b">
                      Preview Mode (with your branding applied)
                    </div>
                    <iframe
                      srcDoc={getPreviewHtml()}
                      className="w-full h-[500px] bg-white"
                      title="Email Preview"
                    />
                  </div>
                ) : (
                  <>
                    <div>
                      <Label>Subject Line</Label>
                      <Input
                        value={selectedTemplate.subject}
                        onChange={(e) => setSelectedTemplate({
                          ...selectedTemplate,
                          subject: e.target.value
                        })}
                        placeholder="Email subject"
                      />
                    </div>

                    <div>
                      <Label>Available Variables</Label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {selectedTemplate.variables.map((variable) => (
                          <Badge
                            key={variable}
                            variant="outline"
                            className="cursor-pointer hover:bg-muted"
                            onClick={() => copyVariable(variable)}
                          >
                            <Copy className="w-3 h-3 mr-1" />
                            {`{{${variable}}}`}
                          </Badge>
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        Click to copy. Header, footer, logo, and social links are added automatically.
                      </p>
                    </div>

                    <div>
                      <Label>Email Content (HTML)</Label>
                      <Textarea
                        value={selectedTemplate.body}
                        onChange={(e) => setSelectedTemplate({
                          ...selectedTemplate,
                          body: e.target.value
                        })}
                        placeholder="Email HTML content"
                        rows={16}
                        className="font-mono text-sm"
                      />
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Logo Picker Dialog */}
      <Dialog open={showLogoPicker} onOpenChange={setShowLogoPicker}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Select Logo</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Logo URL</Label>
              <Input
                placeholder="https://example.com/logo.png"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const target = e.target as HTMLInputElement;
                    setBranding(prev => ({ ...prev, logoUrl: target.value }));
                    setShowLogoPicker(false);
                  }
                }}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Enter a logo URL or upload via Media Library first
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Banner Picker Dialog */}
      <Dialog open={showBannerPicker} onOpenChange={setShowBannerPicker}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Select Banner</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Banner URL</Label>
              <Input
                placeholder="https://example.com/banner.png"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const target = e.target as HTMLInputElement;
                    setBranding(prev => ({ ...prev, bannerUrl: target.value }));
                    setShowBannerPicker(false);
                  }
                }}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Enter a banner URL or upload via Media Library first
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
