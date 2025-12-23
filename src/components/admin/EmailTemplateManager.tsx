import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { 
  Mail, 
  Save, 
  Eye, 
  Copy, 
  RefreshCw,
  FileText,
  CheckCircle,
  Truck,
  Package,
  AlertCircle
} from "lucide-react";

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  variables: string[];
}

const defaultTemplates: EmailTemplate[] = [
  {
    id: "order_confirmation",
    name: "Order Confirmation",
    subject: "Order Confirmed - {{order_number}}",
    body: `<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #2d5a3d; color: white; padding: 20px; text-align: center; }
    .content { padding: 30px 20px; background: #f9f9f9; }
    .order-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
    .btn { display: inline-block; background: #2d5a3d; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>{{store_name}}</h1>
    </div>
    <div class="content">
      <h2>Thank you for your order, {{customer_name}}!</h2>
      <p>Your order <strong>{{order_number}}</strong> has been confirmed.</p>
      
      <div class="order-details">
        <h3>Order Summary</h3>
        {{order_items}}
        <hr>
        <p><strong>Total: {{order_total}}</strong></p>
      </div>
      
      <p>We will notify you when your order is shipped.</p>
      
      <p style="text-align: center;">
        <a href="{{tracking_url}}" class="btn">Track Your Order</a>
      </p>
    </div>
    <div class="footer">
      <p>© {{year}} {{store_name}}. All rights reserved.</p>
      <p>{{store_address}}</p>
    </div>
  </div>
</body>
</html>`,
    variables: ["store_name", "customer_name", "order_number", "order_items", "order_total", "tracking_url", "year", "store_address"]
  },
  {
    id: "order_shipped",
    name: "Order Shipped",
    subject: "Your Order is on the Way - {{order_number}}",
    body: `<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #2d5a3d; color: white; padding: 20px; text-align: center; }
    .content { padding: 30px 20px; background: #f9f9f9; }
    .tracking-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
    .btn { display: inline-block; background: #2d5a3d; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>{{store_name}}</h1>
    </div>
    <div class="content">
      <h2>Great news, {{customer_name}}!</h2>
      <p>Your order <strong>{{order_number}}</strong> has been shipped and is on its way to you.</p>
      
      <div class="tracking-box">
        <h3>📦 Tracking Information</h3>
        <p>Tracking Number: <strong>{{tracking_number}}</strong></p>
        <p>Carrier: {{carrier_name}}</p>
        <p>Estimated Delivery: {{estimated_delivery}}</p>
        <br>
        <a href="{{tracking_url}}" class="btn">Track Package</a>
      </div>
      
      <p>Shipping Address:</p>
      <p>{{shipping_address}}</p>
    </div>
    <div class="footer">
      <p>© {{year}} {{store_name}}. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`,
    variables: ["store_name", "customer_name", "order_number", "tracking_number", "carrier_name", "estimated_delivery", "tracking_url", "shipping_address", "year"]
  },
  {
    id: "order_delivered",
    name: "Order Delivered",
    subject: "Your Order Has Been Delivered - {{order_number}}",
    body: `<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #2d5a3d; color: white; padding: 20px; text-align: center; }
    .content { padding: 30px 20px; background: #f9f9f9; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
    .btn { display: inline-block; background: #2d5a3d; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>{{store_name}}</h1>
    </div>
    <div class="content">
      <h2>🎉 Your order has arrived, {{customer_name}}!</h2>
      <p>Order <strong>{{order_number}}</strong> has been successfully delivered.</p>
      
      <p>We hope you love your purchase! If you have any questions or concerns, please don't hesitate to contact us.</p>
      
      <p style="text-align: center; margin: 30px 0;">
        <a href="{{review_url}}" class="btn">Leave a Review</a>
      </p>
      
      <p>Thank you for shopping with us!</p>
    </div>
    <div class="footer">
      <p>© {{year}} {{store_name}}. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`,
    variables: ["store_name", "customer_name", "order_number", "review_url", "year"]
  },
  {
    id: "welcome_email",
    name: "Welcome Email",
    subject: "Welcome to {{store_name}}!",
    body: `<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #2d5a3d; color: white; padding: 20px; text-align: center; }
    .content { padding: 30px 20px; background: #f9f9f9; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
    .btn { display: inline-block; background: #2d5a3d; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Welcome to {{store_name}}!</h1>
    </div>
    <div class="content">
      <h2>Hello {{customer_name}},</h2>
      <p>Thank you for joining our community! We're excited to have you.</p>
      
      <p>Here's what you can expect:</p>
      <ul>
        <li>Exclusive access to new products</li>
        <li>Special discounts and offers</li>
        <li>Expert plant care tips</li>
      </ul>
      
      <p style="text-align: center; margin: 30px 0;">
        <a href="{{shop_url}}" class="btn">Start Shopping</a>
      </p>
    </div>
    <div class="footer">
      <p>© {{year}} {{store_name}}. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`,
    variables: ["store_name", "customer_name", "shop_url", "year"]
  }
];

const templateIcons: Record<string, any> = {
  order_confirmation: CheckCircle,
  order_shipped: Truck,
  order_delivered: Package,
  welcome_email: Mail
};

export const EmailTemplateManager = () => {
  const [templates, setTemplates] = useState<EmailTemplate[]>(defaultTemplates);
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate>(defaultTemplates[0]);
  const [previewMode, setPreviewMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('site_settings')
        .select('setting_value')
        .eq('setting_key', 'email_templates')
        .single();

      if (data && !error) {
        const savedTemplates = data.setting_value as unknown as EmailTemplate[];
        if (Array.isArray(savedTemplates) && savedTemplates.length > 0) {
          setTemplates(savedTemplates);
          setSelectedTemplate(savedTemplates[0]);
        }
      }
    } catch (error) {
      console.error('Error loading templates:', error);
    }
  };

  const saveTemplates = async () => {
    setIsSaving(true);
    try {
      const updatedTemplates = templates.map(t => 
        t.id === selectedTemplate.id ? selectedTemplate : t
      );
      setTemplates(updatedTemplates);

      const { error } = await supabase
        .from('site_settings')
        .upsert({
          setting_key: 'email_templates',
          setting_value: updatedTemplates as any,
          updated_at: new Date().toISOString()
        }, { onConflict: 'setting_key' });

      if (error) throw error;
      toast.success("Email templates saved successfully");
    } catch (error) {
      console.error('Error saving templates:', error);
      toast.error("Failed to save templates");
    } finally {
      setIsSaving(false);
    }
  };

  const handleTemplateChange = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (template) {
      setSelectedTemplate(template);
    }
  };

  const copyVariable = (variable: string) => {
    navigator.clipboard.writeText(`{{${variable}}}`);
    toast.success(`Copied {{${variable}}} to clipboard`);
  };

  const resetToDefault = () => {
    const defaultTemplate = defaultTemplates.find(t => t.id === selectedTemplate.id);
    if (defaultTemplate) {
      setSelectedTemplate(defaultTemplate);
      toast.info("Template reset to default");
    }
  };

  const getPreviewHtml = () => {
    let html = selectedTemplate.body;
    // Replace variables with sample data
    const sampleData: Record<string, string> = {
      store_name: "Green Grass Store",
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
      year: new Date().getFullYear().toString(),
      store_address: "Abu Dhabi & Dubai, UAE"
    };

    for (const [key, value] of Object.entries(sampleData)) {
      html = html.replace(new RegExp(`{{${key}}}`, 'g'), value);
    }
    return html;
  };

  const Icon = templateIcons[selectedTemplate.id] || Mail;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Email Templates</h2>
          <p className="text-gray-600">Design and customize email templates for customer communications</p>
        </div>
        <Button onClick={saveTemplates} disabled={isSaving} className="gap-2">
          <Save className="w-4 h-4" />
          {isSaving ? "Saving..." : "Save Templates"}
        </Button>
      </div>

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
                  onClick={() => handleTemplateChange(template.id)}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors ${
                    selectedTemplate.id === template.id
                      ? 'bg-[#2d5a3d] text-white'
                      : 'hover:bg-gray-100'
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
                <div className="w-10 h-10 bg-[#2d5a3d]/10 rounded-lg flex items-center justify-center">
                  <Icon className="w-5 h-5 text-[#2d5a3d]" />
                </div>
                <div>
                  <CardTitle className="text-base">{selectedTemplate.name}</CardTitle>
                  <CardDescription>Edit template content</CardDescription>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={resetToDefault}>
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
                <div className="bg-gray-100 px-4 py-2 text-sm text-gray-600 border-b">
                  Preview Mode
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
                        className="cursor-pointer hover:bg-gray-100"
                        onClick={() => copyVariable(variable)}
                      >
                        <Copy className="w-3 h-3 mr-1" />
                        {`{{${variable}}}`}
                      </Badge>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Click on a variable to copy it to clipboard
                  </p>
                </div>

                <div>
                  <Label>Email Body (HTML)</Label>
                  <Textarea
                    value={selectedTemplate.body}
                    onChange={(e) => setSelectedTemplate({
                      ...selectedTemplate,
                      body: e.target.value
                    })}
                    placeholder="Email HTML content"
                    rows={20}
                    className="font-mono text-sm"
                  />
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Email Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-amber-500" />
            Email Configuration Required
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 mb-4">
            To send emails to customers, you need to configure an email service provider in the API Settings tab. 
            We recommend using <strong>Resend</strong> for reliable email delivery.
          </p>
          <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600">
            <li>Go to <a href="https://resend.com" target="_blank" rel="noopener noreferrer" className="text-[#2d5a3d] underline">resend.com</a> and create an account</li>
            <li>Verify your email domain at <a href="https://resend.com/domains" target="_blank" rel="noopener noreferrer" className="text-[#2d5a3d] underline">resend.com/domains</a></li>
            <li>Create an API key at <a href="https://resend.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-[#2d5a3d] underline">resend.com/api-keys</a></li>
            <li>Add the API key in <strong>Settings → API → Email</strong> tab</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
};
