import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Save, Eye, FileText, Palette } from "lucide-react";
import { MediaPicker } from "./MediaPicker";
import type { Json } from "@/integrations/supabase/types";

export interface InvoiceTemplateSettings {
  showLogo: boolean;
  logoUrl: string;
  companyName: string;
  companyNameAr: string;
  address: string;
  addressAr: string;
  phone: string;
  email: string;
  website: string;
  primaryColor: string;
  footerText: string;
  footerTextAr: string;
  showTaxBreakdown: boolean;
  taxLabel: string;
  taxLabelAr: string;
  currencySymbol: string;
  invoiceTitle: string;
  invoiceTitleAr: string;
  deliverySlipTitle: string;
  deliverySlipTitleAr: string;
}

const defaultInvoiceTemplate: InvoiceTemplateSettings = {
  showLogo: true,
  logoUrl: "",
  companyName: "GREEN GRASS STORE",
  companyNameAr: "جرين جراس ستور",
  address: "Dubai, UAE",
  addressAr: "دبي، الإمارات",
  phone: "+971 54 775 1901",
  email: "info@greengrassstore.com",
  website: "www.greengrassstore.com",
  primaryColor: "#2d5a3d",
  footerText: "Thank you for shopping with us!",
  footerTextAr: "شكراً لتسوقكم معنا!",
  showTaxBreakdown: true,
  taxLabel: "VAT",
  taxLabelAr: "ضريبة القيمة المضافة",
  currencySymbol: "AED",
  invoiceTitle: "INVOICE",
  invoiceTitleAr: "فاتورة",
  deliverySlipTitle: "DELIVERY SLIP",
  deliverySlipTitleAr: "إيصال التسليم"
};

export const InvoiceTemplateManager = () => {
  const [settings, setSettings] = useState<InvoiceTemplateSettings>(defaultInvoiceTemplate);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('site_settings')
        .select('setting_value')
        .eq('setting_key', 'invoice_template')
        .single();

      if (data?.setting_value) {
        setSettings({ ...defaultInvoiceTemplate, ...data.setting_value as unknown as InvoiceTemplateSettings });
      }
    } catch (error) {
      console.log('No existing invoice template settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();

    // Real-time subscription
    const channel = supabase
      .channel('invoice-template-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'site_settings', filter: "setting_key=eq.invoice_template" },
        () => fetchSettings()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const saveSettings = async () => {
    setSaving(true);
    try {
      const { data: existing } = await supabase
        .from('site_settings')
        .select('id')
        .eq('setting_key', 'invoice_template')
        .maybeSingle();

      const jsonValue = settings as unknown as Json;

      if (existing) {
        const { error } = await supabase
          .from('site_settings')
          .update({ setting_value: jsonValue, updated_at: new Date().toISOString() })
          .eq('setting_key', 'invoice_template');
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('site_settings')
          .insert({ setting_key: 'invoice_template', setting_value: jsonValue });
        if (error) throw error;
      }

      toast.success("Invoice template saved successfully!");
    } catch (error) {
      console.error('Error saving invoice template:', error);
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const previewInvoice = () => {
    const previewWindow = window.open('', '_blank');
    if (!previewWindow) return;

    const logoSection = settings.showLogo && settings.logoUrl
      ? `<img src="${settings.logoUrl}" alt="${settings.companyName}" style="max-height: 60px; max-width: 200px; margin-bottom: 10px;" />`
      : `<h1 style="color: ${settings.primaryColor}; margin: 0;">${settings.companyName}</h1>`;

    const previewHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${settings.invoiceTitle} - Preview</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; }
          .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid ${settings.primaryColor}; padding-bottom: 20px; }
          .header h1 { color: ${settings.primaryColor}; margin: 0; }
          .header p { color: #666; margin: 5px 0; }
          .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; }
          .info-box { background: #f9f9f9; padding: 15px; border-radius: 8px; }
          .info-box h3 { margin: 0 0 10px 0; color: ${settings.primaryColor}; font-size: 14px; }
          .info-box p { margin: 3px 0; font-size: 13px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
          th { background: ${settings.primaryColor}; color: white; }
          .totals { text-align: right; }
          .totals p { margin: 5px 0; }
          .total-row { font-size: 18px; font-weight: bold; color: ${settings.primaryColor}; }
          .footer { text-align: center; margin-top: 40px; color: #666; font-size: 12px; border-top: 1px solid #ddd; padding-top: 20px; }
          .preview-badge { position: fixed; top: 10px; right: 10px; background: #ff6b6b; color: white; padding: 5px 10px; border-radius: 4px; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="preview-badge">PREVIEW</div>
        <div class="header">
          ${logoSection}
          <p>${settings.website}</p>
          <p>${settings.address} | ${settings.phone}</p>
        </div>
        
        <h2 style="text-align: center; color: ${settings.primaryColor};">${settings.invoiceTitle}</h2>
        
        <div class="info-grid">
          <div class="info-box">
            <h3>INVOICE TO:</h3>
            <p><strong>Sample Customer</strong></p>
            <p>customer@example.com</p>
            <p>+971 50 123 4567</p>
            <p>123 Sample Street, Dubai, UAE</p>
          </div>
          <div class="info-box">
            <h3>INVOICE DETAILS:</h3>
            <p><strong>Invoice #:</strong> GG-SAMPLE-001</p>
            <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
            <p><strong>Status:</strong> PENDING</p>
            <p><strong>Payment:</strong> Cash on Delivery</p>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Item</th>
              <th>Qty</th>
              <th>Price</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Sample Plant Product</td>
              <td>2</td>
              <td>${settings.currencySymbol} 150.00</td>
              <td>${settings.currencySymbol} 300.00</td>
            </tr>
            <tr>
              <td>Ceramic Pot</td>
              <td>1</td>
              <td>${settings.currencySymbol} 75.00</td>
              <td>${settings.currencySymbol} 75.00</td>
            </tr>
          </tbody>
        </table>

        <div class="totals">
          <p>Subtotal: ${settings.currencySymbol} 375.00</p>
          ${settings.showTaxBreakdown ? `<p>${settings.taxLabel}: ${settings.currencySymbol} 18.75</p>` : ''}
          <p>Shipping: ${settings.currencySymbol} 25.00</p>
          <p class="total-row">Total: ${settings.currencySymbol} 418.75</p>
        </div>

        <div class="footer">
          <p>${settings.footerText}</p>
          <p>For any queries, contact us at ${settings.email}</p>
        </div>
      </body>
      </html>
    `;

    previewWindow.document.write(previewHTML);
    previewWindow.document.close();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-foreground flex items-center gap-2">
            <FileText className="w-5 h-5 md:w-6 md:h-6" />
            Invoice Template
          </h2>
          <p className="text-sm text-muted-foreground">
            Customize your invoice and delivery slip templates
          </p>
        </div>
        <Button onClick={previewInvoice} variant="outline" className="gap-2">
          <Eye className="w-4 h-4" />
          Preview
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Company Logo */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Company Logo</CardTitle>
            <CardDescription className="text-xs md:text-sm">
              Logo to display on invoices
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
              <div>
                <Label className="text-sm">Show Logo</Label>
                <p className="text-xs text-muted-foreground">Display logo instead of text</p>
              </div>
              <Switch
                checked={settings.showLogo}
                onCheckedChange={(checked) => setSettings(prev => ({ ...prev, showLogo: checked }))}
              />
            </div>
            {settings.showLogo && (
              <div className="space-y-2">
                <Label className="text-sm">Logo Image</Label>
                <MediaPicker
                  value={settings.logoUrl}
                  onChange={(url) => setSettings(prev => ({ ...prev, logoUrl: url }))}
                  label="Invoice Logo"
                  folder="logos"
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Theme Color */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <Palette className="w-4 h-4" />
              Theme Color
            </CardTitle>
            <CardDescription className="text-xs md:text-sm">
              Primary color for invoice styling
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={settings.primaryColor}
                onChange={(e) => setSettings(prev => ({ ...prev, primaryColor: e.target.value }))}
                className="w-12 h-12 rounded cursor-pointer border-0"
              />
              <Input
                value={settings.primaryColor}
                onChange={(e) => setSettings(prev => ({ ...prev, primaryColor: e.target.value }))}
                className="flex-1"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs">Currency Symbol</Label>
                <Input
                  value={settings.currencySymbol}
                  onChange={(e) => setSettings(prev => ({ ...prev, currencySymbol: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Tax Label</Label>
                <Input
                  value={settings.taxLabel}
                  onChange={(e) => setSettings(prev => ({ ...prev, taxLabel: e.target.value }))}
                />
              </div>
            </div>
            <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
              <div>
                <Label className="text-sm">Show Tax Breakdown</Label>
                <p className="text-xs text-muted-foreground">Display separate tax line</p>
              </div>
              <Switch
                checked={settings.showTaxBreakdown}
                onCheckedChange={(checked) => setSettings(prev => ({ ...prev, showTaxBreakdown: checked }))}
              />
            </div>
          </CardContent>
        </Card>

        {/* Company Info */}
        <Card className="md:col-span-2">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Company Information</CardTitle>
            <CardDescription className="text-xs md:text-sm">
              Details displayed on invoice header
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm">Company Name (EN)</Label>
                <Input
                  value={settings.companyName}
                  onChange={(e) => setSettings(prev => ({ ...prev, companyName: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm">Company Name (AR)</Label>
                <Input
                  value={settings.companyNameAr}
                  onChange={(e) => setSettings(prev => ({ ...prev, companyNameAr: e.target.value }))}
                  dir="rtl"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm">Address (EN)</Label>
                <Input
                  value={settings.address}
                  onChange={(e) => setSettings(prev => ({ ...prev, address: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm">Address (AR)</Label>
                <Input
                  value={settings.addressAr}
                  onChange={(e) => setSettings(prev => ({ ...prev, addressAr: e.target.value }))}
                  dir="rtl"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm">Phone</Label>
                <Input
                  value={settings.phone}
                  onChange={(e) => setSettings(prev => ({ ...prev, phone: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm">Email</Label>
                <Input
                  value={settings.email}
                  onChange={(e) => setSettings(prev => ({ ...prev, email: e.target.value }))}
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label className="text-sm">Website</Label>
                <Input
                  value={settings.website}
                  onChange={(e) => setSettings(prev => ({ ...prev, website: e.target.value }))}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Document Titles */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Document Titles</CardTitle>
            <CardDescription className="text-xs md:text-sm">
              Customize titles for documents
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs">Invoice Title (EN)</Label>
                <Input
                  value={settings.invoiceTitle}
                  onChange={(e) => setSettings(prev => ({ ...prev, invoiceTitle: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Invoice Title (AR)</Label>
                <Input
                  value={settings.invoiceTitleAr}
                  onChange={(e) => setSettings(prev => ({ ...prev, invoiceTitleAr: e.target.value }))}
                  dir="rtl"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Delivery Slip Title (EN)</Label>
                <Input
                  value={settings.deliverySlipTitle}
                  onChange={(e) => setSettings(prev => ({ ...prev, deliverySlipTitle: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Delivery Slip Title (AR)</Label>
                <Input
                  value={settings.deliverySlipTitleAr}
                  onChange={(e) => setSettings(prev => ({ ...prev, deliverySlipTitleAr: e.target.value }))}
                  dir="rtl"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer Message */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Footer Message</CardTitle>
            <CardDescription className="text-xs md:text-sm">
              Thank you message on invoices
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs">Footer Text (EN)</Label>
              <Textarea
                value={settings.footerText}
                onChange={(e) => setSettings(prev => ({ ...prev, footerText: e.target.value }))}
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Footer Text (AR)</Label>
              <Textarea
                value={settings.footerTextAr}
                onChange={(e) => setSettings(prev => ({ ...prev, footerTextAr: e.target.value }))}
                rows={2}
                dir="rtl"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <Button onClick={saveSettings} disabled={saving} className="w-full sm:w-auto gap-2">
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        Save Invoice Template
      </Button>
    </div>
  );
};
