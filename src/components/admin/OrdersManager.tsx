import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Plus, Eye, FileText, Search, Printer, Trash2, RefreshCw, Truck, Mail } from "lucide-react";
import { ExportButtons } from "./ExportButtons";
import { format } from "date-fns";

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
}

interface Order {
  id: string;
  order_number: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  customer_address: string | null;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
  status: string;
  payment_method: string | null;
  notes: string | null;
  created_at: string;
}

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  processing: "bg-blue-100 text-blue-800",
  shipped: "bg-purple-100 text-purple-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

export const OrdersManager = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [sendingEmail, setSendingEmail] = useState<string | null>(null);
  
  const [newOrder, setNewOrder] = useState({
    customer_name: "",
    customer_email: "",
    customer_phone: "",
    customer_address: "",
    items: [{ name: "", quantity: 1, price: 0 }] as OrderItem[],
    shipping: 0,
    tax: 0,
    payment_method: "cash",
    notes: "",
  });

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Bulk Selection
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const ordersData = (data || []).map(order => ({
        ...order,
        items: (order.items as unknown as OrderItem[]) || []
      }));
      
      setOrders(ordersData);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();

    // Real-time subscription for orders
    const channel = supabase
      .channel('admin-orders-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        () => {
          fetchOrders();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const generateOrderNumber = () => {
    const prefix = "GG";
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 5).toUpperCase();
    return `${prefix}-${timestamp}-${random}`;
  };

  const calculateSubtotal = (items: OrderItem[]) => {
    return items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  const sendOrderEmail = async (order: Order, type: 'order_confirmation' | 'status_update', previousStatus?: string) => {
    try {
      setSendingEmail(order.id);
      
      const { data, error } = await supabase.functions.invoke('send-order-email', {
        body: {
          type,
          order,
          previous_status: previousStatus
        }
      });

      if (error) throw error;
      
      toast.success('Email sent successfully!');
    } catch (error: any) {
      console.error('Error sending email:', error);
      toast.error('Failed to send email');
    } finally {
      setSendingEmail(null);
    }
  };

  const createOrder = async () => {
    try {
      const subtotal = calculateSubtotal(newOrder.items);
      const total = subtotal + newOrder.tax + newOrder.shipping;
      const orderNumber = generateOrderNumber();

      const orderData = {
        order_number: orderNumber,
        customer_name: newOrder.customer_name,
        customer_email: newOrder.customer_email,
        customer_phone: newOrder.customer_phone || null,
        customer_address: newOrder.customer_address || null,
        items: JSON.parse(JSON.stringify(newOrder.items)),
        subtotal,
        tax: newOrder.tax,
        shipping: newOrder.shipping,
        total,
        payment_method: newOrder.payment_method,
        notes: newOrder.notes || null,
        status: 'pending',
      };

      const { data, error } = await supabase
        .from('orders')
        .insert([orderData])
        .select()
        .single();

      if (error) throw error;

      // Send confirmation email
      if (data) {
        const orderWithItems = {
          ...data,
          items: newOrder.items
        };
        await sendOrderEmail(orderWithItems as Order, 'order_confirmation');
      }

      toast.success('Order created successfully');
      setShowCreateDialog(false);
      setNewOrder({
        customer_name: "",
        customer_email: "",
        customer_phone: "",
        customer_address: "",
        items: [{ name: "", quantity: 1, price: 0 }],
        shipping: 0,
        tax: 0,
        payment_method: "cash",
        notes: "",
      });
      fetchOrders();
    } catch (error) {
      console.error('Error creating order:', error);
      toast.error('Failed to create order');
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const order = orders.find(o => o.id === orderId);
      if (!order) return;
      
      const previousStatus = order.status;

      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);

      if (error) throw error;
      
      // Send status update email
      const updatedOrder = { ...order, status: newStatus };
      await sendOrderEmail(updatedOrder, 'status_update', previousStatus);
      
      toast.success('Order status updated');
      fetchOrders();
    } catch (error) {
      console.error('Error updating order:', error);
      toast.error('Failed to update order');
    }
  };

  const deleteOrder = async (orderId: string) => {
    if (!confirm('Are you sure you want to delete this order?')) return;
    
    try {
      const { error } = await supabase
        .from('orders')
        .delete()
        .eq('id', orderId);

      if (error) throw error;
      toast.success('Order deleted');
      fetchOrders();
    } catch (error) {
      console.error('Error deleting order:', error);
      toast.error('Failed to delete order');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!confirm(`Are you sure you want to delete ${selectedIds.length} orders?`)) return;
    
    try {
      const { error } = await supabase.from('orders').delete().in('id', selectedIds);
      if (error) throw error;
      toast.success(`${selectedIds.length} orders deleted`);
      setSelectedIds([]);
      fetchOrders();
    } catch (error) {
      toast.error('Failed to delete orders');
    }
  };

  const handleBulkStatusUpdate = async (status: string) => {
    if (selectedIds.length === 0) return;
    
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status })
        .in('id', selectedIds);
      if (error) throw error;
      toast.success(`${selectedIds.length} orders updated to ${status}`);
      setSelectedIds([]);
      fetchOrders();
    } catch (error) {
      toast.error('Failed to update orders');
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === paginatedOrders.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(paginatedOrders.map(o => o.id));
    }
  };

  const [lastSelectedIndex, setLastSelectedIndex] = useState<number | null>(null);

  const toggleSelectOne = (id: string, event?: React.MouseEvent) => {
    const currentIndex = paginatedOrders.findIndex(o => o.id === id);
    
    // Shift+Click for range selection
    if (event?.shiftKey && lastSelectedIndex !== null) {
      const start = Math.min(lastSelectedIndex, currentIndex);
      const end = Math.max(lastSelectedIndex, currentIndex);
      const rangeIds = paginatedOrders.slice(start, end + 1).map(o => o.id);
      setSelectedIds(prev => [...new Set([...prev, ...rangeIds])]);
      return;
    }
    
    // Ctrl/Cmd+Click for toggle
    if (event?.ctrlKey || event?.metaKey) {
      if (selectedIds.includes(id)) {
        setSelectedIds(selectedIds.filter(i => i !== id));
      } else {
        setSelectedIds([...selectedIds, id]);
      }
      setLastSelectedIndex(currentIndex);
      return;
    }
    
    // Normal click
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(i => i !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
    setLastSelectedIndex(currentIndex);
  };


  const printInvoice = async (order: Order) => {
    // Fetch invoice template settings
    let template = {
      showLogo: true,
      logoUrl: '',
      companyName: 'GREEN GRASS STORE',
      address: 'Dubai, UAE',
      phone: '+971 54 775 1901',
      email: 'info@greengrassstore.com',
      website: 'www.greengrassstore.com',
      primaryColor: '#2d5a3d',
      footerText: 'Thank you for shopping with us!',
      showTaxBreakdown: true,
      taxLabel: 'VAT',
      currencySymbol: 'AED',
      invoiceTitle: 'INVOICE'
    };

    try {
      const { data } = await supabase
        .from('site_settings')
        .select('setting_value')
        .eq('setting_key', 'invoice_template')
        .single();
      if (data?.setting_value) {
        template = { ...template, ...data.setting_value as any };
      }
    } catch (e) {
      // Use defaults
    }

    // Fallback to branding if no invoice template logo
    if (!template.logoUrl) {
      try {
        const { data } = await supabase
          .from('site_settings')
          .select('setting_value')
          .eq('setting_key', 'branding')
          .single();
        if (data?.setting_value) {
          const branding = data.setting_value as any;
          template.logoUrl = branding.logoUrl || '';
          if (!template.companyName || template.companyName === 'GREEN GRASS STORE') {
            template.companyName = branding.siteName || 'GREEN GRASS STORE';
          }
        }
      } catch (e) {
        console.log('Could not fetch branding');
      }
    }

    const invoiceWindow = window.open('', '_blank');
    if (!invoiceWindow) return;

    const logoSection = template.showLogo && template.logoUrl 
      ? `<img src="${template.logoUrl}" alt="${template.companyName}" style="max-height: 60px; max-width: 200px; margin-bottom: 10px;" />`
      : `<h1 style="color: ${template.primaryColor}; margin: 0;">${template.companyName}</h1>`;

    const invoiceHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${template.invoiceTitle} - ${order.order_number}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; }
          .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid ${template.primaryColor}; padding-bottom: 20px; }
          .header h1 { color: ${template.primaryColor}; margin: 0; }
          .header p { color: #666; margin: 5px 0; }
          .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; }
          .info-box { background: #f9f9f9; padding: 15px; border-radius: 8px; }
          .info-box h3 { margin: 0 0 10px 0; color: ${template.primaryColor}; font-size: 14px; }
          .info-box p { margin: 3px 0; font-size: 13px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
          th { background: ${template.primaryColor}; color: white; }
          .totals { text-align: right; }
          .totals p { margin: 5px 0; }
          .total-row { font-size: 18px; font-weight: bold; color: ${template.primaryColor}; }
          .footer { text-align: center; margin-top: 40px; color: #666; font-size: 12px; border-top: 1px solid #ddd; padding-top: 20px; }
          @media print { body { padding: 20px; } }
        </style>
      </head>
      <body>
        <div class="header">
          ${logoSection}
          <p>${template.website}</p>
          <p>${template.address} | ${template.phone}</p>
        </div>
        
        <h2 style="text-align: center; color: ${template.primaryColor};">${template.invoiceTitle}</h2>
        
        <div class="info-grid">
          <div class="info-box">
            <h3>INVOICE TO:</h3>
            <p><strong>${order.customer_name}</strong></p>
            <p>${order.customer_email}</p>
            ${order.customer_phone ? `<p>${order.customer_phone}</p>` : ''}
            ${order.customer_address ? `<p>${order.customer_address}</p>` : ''}
          </div>
          <div class="info-box">
            <h3>INVOICE DETAILS:</h3>
            <p><strong>Invoice #:</strong> ${order.order_number}</p>
            <p><strong>Date:</strong> ${format(new Date(order.created_at), 'MMM dd, yyyy')}</p>
            <p><strong>Status:</strong> ${order.status.toUpperCase()}</p>
            <p><strong>Payment:</strong> ${order.payment_method || 'N/A'}</p>
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
            ${order.items.map(item => `
              <tr>
                <td>${item.name}</td>
                <td>${item.quantity}</td>
                <td>${template.currencySymbol} ${item.price.toFixed(2)}</td>
                <td>${template.currencySymbol} ${(item.price * item.quantity).toFixed(2)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="totals">
          <p>Subtotal: ${template.currencySymbol} ${order.subtotal.toFixed(2)}</p>
          ${template.showTaxBreakdown ? `<p>${template.taxLabel}: ${template.currencySymbol} ${order.tax.toFixed(2)}</p>` : ''}
          <p>Shipping: ${template.currencySymbol} ${order.shipping.toFixed(2)}</p>
          <p class="total-row">Total: ${template.currencySymbol} ${order.total.toFixed(2)}</p>
        </div>

        ${order.notes ? `<p><strong>Notes:</strong> ${order.notes}</p>` : ''}

        <div class="footer">
          <p>${template.footerText}</p>
          <p>For any queries, contact us at ${template.email}</p>
        </div>
      </body>
      </html>
    `;

    invoiceWindow.document.write(invoiceHTML);
    invoiceWindow.document.close();
    invoiceWindow.print();
  };

  const printDeliverySlip = async (order: Order) => {
    // Fetch invoice template settings
    let template = {
      showLogo: true,
      logoUrl: '',
      companyName: 'GREEN GRASS STORE',
      address: 'Dubai, UAE',
      phone: '+971 54 775 1901',
      email: 'info@greengrassstore.com',
      website: 'www.greengrassstore.com',
      primaryColor: '#2d5a3d',
      footerText: 'Thank you for shopping with us!',
      currencySymbol: 'AED',
      deliverySlipTitle: 'DELIVERY SLIP'
    };

    try {
      const { data } = await supabase
        .from('site_settings')
        .select('setting_value')
        .eq('setting_key', 'invoice_template')
        .single();
      if (data?.setting_value) {
        template = { ...template, ...data.setting_value as any };
      }
    } catch (e) {
      // Use defaults
    }

    // Fallback to branding if no invoice template logo
    if (!template.logoUrl) {
      try {
        const { data } = await supabase
          .from('site_settings')
          .select('setting_value')
          .eq('setting_key', 'branding')
          .single();
        if (data?.setting_value) {
          const branding = data.setting_value as any;
          template.logoUrl = branding.logoUrl || '';
          if (!template.companyName || template.companyName === 'GREEN GRASS STORE') {
            template.companyName = branding.siteName || 'GREEN GRASS STORE';
          }
        }
      } catch (e) {
        console.log('Could not fetch branding');
      }
    }

    const slipWindow = window.open('', '_blank');
    if (!slipWindow) return;

    const logoSection = template.showLogo && template.logoUrl 
      ? `<img src="${template.logoUrl}" alt="${template.companyName}" style="max-height: 50px; max-width: 150px; margin-bottom: 5px;" />`
      : `<p style="color: #666; margin: 5px 0; font-size: 12px;">${template.companyName}</p>`;

    const slipHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${template.deliverySlipTitle} - ${order.order_number}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 30px; max-width: 600px; margin: 0 auto; }
          .header { text-align: center; margin-bottom: 25px; border-bottom: 3px solid ${template.primaryColor}; padding-bottom: 15px; }
          .header h1 { color: ${template.primaryColor}; margin: 0; font-size: 22px; }
          .header p { color: #666; margin: 5px 0; font-size: 12px; }
          .badge { display: inline-block; padding: 6px 15px; background: ${template.primaryColor}; color: white; border-radius: 15px; font-size: 12px; margin-top: 10px; }
          .delivery-info { background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
          .delivery-info h2 { margin: 0 0 15px 0; font-size: 16px; color: #333; border-bottom: 1px solid #ddd; padding-bottom: 10px; }
          .delivery-info p { margin: 5px 0; font-size: 14px; }
          .items-list { margin-bottom: 20px; }
          .items-list h2 { font-size: 16px; margin: 0 0 15px 0; color: #333; }
          .item { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px dashed #ddd; }
          .item:last-child { border-bottom: none; }
          .checkbox { width: 20px; height: 20px; border: 2px solid ${template.primaryColor}; border-radius: 3px; margin-right: 10px; }
          .signature-box { border: 2px dashed #ccc; padding: 40px; margin-top: 30px; text-align: center; }
          .signature-box p { color: #999; font-size: 12px; }
          .footer { text-align: center; margin-top: 30px; font-size: 11px; color: #999; }
          @media print { body { padding: 15px; } }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>🚚 ${template.deliverySlipTitle}</h1>
          ${logoSection}
          <span class="badge">Order #${order.order_number}</span>
        </div>

        <div class="delivery-info">
          <h2>📍 Delivery Address</h2>
          <p><strong>${order.customer_name}</strong></p>
          <p>${order.customer_address || 'Address not provided'}</p>
          <p>📞 ${order.customer_phone || 'No phone'}</p>
          <p>📧 ${order.customer_email}</p>
        </div>

        <div class="items-list">
          <h2>📦 Items to Deliver (${order.items.length})</h2>
          ${order.items.map(item => `
            <div class="item">
              <div style="display: flex; align-items: center;">
                <div class="checkbox"></div>
                <span>${item.name}</span>
              </div>
              <span>× ${item.quantity}</span>
            </div>
          `).join('')}
        </div>

        <div style="background: #e8f5e9; padding: 15px; border-radius: 8px; text-align: center;">
          <p style="margin: 0; font-weight: bold; color: ${template.primaryColor};">
            💰 Amount to Collect: ${template.currencySymbol} ${order.total.toFixed(2)}
          </p>
          <p style="margin: 5px 0 0; font-size: 12px; color: #666;">
            Payment: ${order.payment_method || 'Cash on Delivery'}
          </p>
        </div>

        <div class="signature-box">
          <p>Customer Signature</p>
          <p style="margin-top: 30px; font-size: 11px;">Date: ________________</p>
        </div>

        <div class="footer">
          <p>${template.footerText}</p>
          <p>${template.phone} | ${template.website}</p>
        </div>
      </body>
      </html>
    `;

    slipWindow.document.write(slipHTML);
    slipWindow.document.close();
    slipWindow.print();
  };

  const filteredOrders = orders.filter(order =>
    order.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.customer_email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Pagination logic
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const paginatedOrders = filteredOrders.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Keyboard shortcuts for bulk selection - must be after paginatedOrders is defined
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'a' && (e.ctrlKey || e.metaKey) && paginatedOrders.length > 0) {
        e.preventDefault();
        setSelectedIds(paginatedOrders.map(o => o.id));
      }
      if (e.key === 'Escape') {
        setSelectedIds([]);
        setLastSelectedIndex(null);
      }
      if (e.key === 'Delete' && selectedIds.length > 0) {
        handleBulkDelete();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [paginatedOrders, selectedIds]);

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Orders & Invoices
            </CardTitle>
            <CardDescription>Manage orders, invoices, and delivery slips</CardDescription>
          </div>
          
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" size="sm" onClick={fetchOrders}>
              <RefreshCw className="w-4 h-4 mr-1" />
              Refresh
            </Button>
            <ExportButtons 
              data={orders.map(o => ({
                order_number: o.order_number,
                customer_name: o.customer_name,
                customer_email: o.customer_email,
                customer_phone: o.customer_phone || '',
                total: `AED ${o.total.toFixed(2)}`,
                status: o.status,
                payment_method: o.payment_method || '',
                date: new Date(o.created_at).toLocaleDateString()
              }))} 
              filename={`orders-${new Date().toISOString().split('T')[0]}`}
            />
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Order
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create New Order</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Customer Name *</Label>
                    <Input
                      value={newOrder.customer_name}
                      onChange={(e) => setNewOrder(prev => ({ ...prev, customer_name: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Customer Email *</Label>
                    <Input
                      type="email"
                      value={newOrder.customer_email}
                      onChange={(e) => setNewOrder(prev => ({ ...prev, customer_email: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Phone</Label>
                    <Input
                      value={newOrder.customer_phone}
                      onChange={(e) => setNewOrder(prev => ({ ...prev, customer_phone: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Address</Label>
                    <Input
                      value={newOrder.customer_address}
                      onChange={(e) => setNewOrder(prev => ({ ...prev, customer_address: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Order Items</Label>
                  {newOrder.items.map((item, index) => (
                    <div key={index} className="grid grid-cols-4 gap-2">
                      <Input
                        placeholder="Product name"
                        className="col-span-2"
                        value={item.name}
                        onChange={(e) => {
                          const items = [...newOrder.items];
                          items[index].name = e.target.value;
                          setNewOrder(prev => ({ ...prev, items }));
                        }}
                      />
                      <Input
                        type="number"
                        placeholder="Qty"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => {
                          const items = [...newOrder.items];
                          items[index].quantity = parseInt(e.target.value) || 1;
                          setNewOrder(prev => ({ ...prev, items }));
                        }}
                      />
                      <Input
                        type="number"
                        placeholder="Price"
                        min="0"
                        step="0.01"
                        value={item.price}
                        onChange={(e) => {
                          const items = [...newOrder.items];
                          items[index].price = parseFloat(e.target.value) || 0;
                          setNewOrder(prev => ({ ...prev, items }));
                        }}
                      />
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setNewOrder(prev => ({
                      ...prev,
                      items: [...prev.items, { name: "", quantity: 1, price: 0 }]
                    }))}
                  >
                    Add Item
                  </Button>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Tax (AED)</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={newOrder.tax}
                      onChange={(e) => setNewOrder(prev => ({ ...prev, tax: parseFloat(e.target.value) || 0 }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Shipping (AED)</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={newOrder.shipping}
                      onChange={(e) => setNewOrder(prev => ({ ...prev, shipping: parseFloat(e.target.value) || 0 }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Payment Method</Label>
                    <Select
                      value={newOrder.payment_method}
                      onValueChange={(value) => setNewOrder(prev => ({ ...prev, payment_method: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cash">Cash on Delivery</SelectItem>
                        <SelectItem value="card">Card</SelectItem>
                        <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                        <SelectItem value="whatsapp">WhatsApp Order</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Notes</Label>
                  <Textarea
                    value={newOrder.notes}
                    onChange={(e) => setNewOrder(prev => ({ ...prev, notes: e.target.value }))}
                    rows={2}
                  />
                </div>

                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm">
                    <strong>Subtotal:</strong> AED {calculateSubtotal(newOrder.items).toFixed(2)}
                  </p>
                  <p className="text-sm">
                    <strong>Tax:</strong> AED {newOrder.tax.toFixed(2)}
                  </p>
                  <p className="text-sm">
                    <strong>Shipping:</strong> AED {newOrder.shipping.toFixed(2)}
                  </p>
                  <p className="text-lg font-bold text-primary">
                    Total: AED {(calculateSubtotal(newOrder.items) + newOrder.tax + newOrder.shipping).toFixed(2)}
                  </p>
                </div>

                <Button 
                  onClick={createOrder} 
                  className="w-full"
                  disabled={!newOrder.customer_name || !newOrder.customer_email || newOrder.items.every(i => !i.name)}
                >
                  Create Order & Send Invoice
                </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Search and Pagination Controls */}
        <div className="mb-4 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search orders..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Show:</span>
            <Select value={String(itemsPerPage)} onValueChange={(v) => { setItemsPerPage(Number(v)); setCurrentPage(1); }}>
              <SelectTrigger className="w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedIds.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 p-3 bg-muted/50 rounded-lg mb-4">
            <span className="text-sm font-medium">{selectedIds.length} selected</span>
            <Button size="sm" variant="outline" onClick={() => handleBulkStatusUpdate('processing')}>
              Mark Processing
            </Button>
            <Button size="sm" variant="outline" onClick={() => handleBulkStatusUpdate('shipped')}>
              Mark Shipped
            </Button>
            <Button size="sm" variant="outline" onClick={() => handleBulkStatusUpdate('delivered')}>
              Mark Delivered
            </Button>
            <Button size="sm" variant="destructive" onClick={handleBulkDelete}>
              <Trash2 className="w-4 h-4 mr-1" />
              Delete
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setSelectedIds([])}>
              Clear
            </Button>
            <span className="text-xs text-muted-foreground ml-2 hidden md:inline">
              Tip: Ctrl+A select all, Shift+Click range, Escape clear
            </span>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No orders found</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10 md:w-12">
                      <Checkbox 
                        checked={selectedIds.length === paginatedOrders.length && paginatedOrders.length > 0}
                        onCheckedChange={toggleSelectAll}
                      />
                    </TableHead>
                    <TableHead className="min-w-[90px]">Order #</TableHead>
                    <TableHead className="min-w-[120px]">Customer</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead className="hidden sm:table-cell">Status</TableHead>
                    <TableHead className="hidden md:table-cell">Date</TableHead>
                    <TableHead className="text-right w-20">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell>
                        <Checkbox 
                          checked={selectedIds.includes(order.id)}
                          onCheckedChange={() => toggleSelectOne(order.id)}
                        />
                      </TableCell>
                      <TableCell className="font-mono text-sm">{order.order_number}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{order.customer_name}</p>
                          <p className="text-xs text-muted-foreground">{order.customer_email}</p>
                        </div>
                      </TableCell>
                      <TableCell className="font-semibold whitespace-nowrap">AED {order.total.toFixed(2)}</TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <Select
                          value={order.status}
                          onValueChange={(value) => updateOrderStatus(order.id, value)}
                        >
                          <SelectTrigger className="w-28">
                            <Badge className={statusColors[order.status] || "bg-gray-100"}>
                              {order.status}
                            </Badge>
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="processing">Processing</SelectItem>
                            <SelectItem value="shipped">Shipped</SelectItem>
                            <SelectItem value="delivered">Delivered</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-sm whitespace-nowrap">
                        {format(new Date(order.created_at), 'MMM dd, yyyy')}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setSelectedOrder(order)}
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => printInvoice(order)}
                            title="Print Invoice"
                          >
                            <Printer className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => printDeliverySlip(order)}
                            title="Print Delivery Slip"
                          >
                            <Truck className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => sendOrderEmail(order, 'order_confirmation')}
                            title="Resend Invoice Email"
                            disabled={sendingEmail === order.id}
                          >
                            {sendingEmail === order.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Mail className="w-4 h-4" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteOrder(order.id)}
                            title="Delete Order"
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4 pt-4 border-t">
                <p className="text-sm text-muted-foreground">
                  Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredOrders.length)} of {filteredOrders.length} orders
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <span className="text-sm px-2">
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        )}

        {/* Order Details Dialog */}
        <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Order Details - {selectedOrder?.order_number}</DialogTitle>
            </DialogHeader>
            {selectedOrder && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Customer</p>
                    <p className="font-medium">{selectedOrder.customer_name}</p>
                    <p className="text-sm">{selectedOrder.customer_email}</p>
                    {selectedOrder.customer_phone && <p className="text-sm">{selectedOrder.customer_phone}</p>}
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <Badge className={statusColors[selectedOrder.status]}>{selectedOrder.status}</Badge>
                    <p className="text-sm mt-1">{format(new Date(selectedOrder.created_at), 'PPpp')}</p>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground mb-2">Items</p>
                  <div className="space-y-2">
                    {selectedOrder.items.map((item, index) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span>{item.name} × {item.quantity}</span>
                        <span>AED {(item.price * item.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border-t pt-2 space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal</span>
                    <span>AED {selectedOrder.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Tax</span>
                    <span>AED {selectedOrder.tax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Shipping</span>
                    <span>AED {selectedOrder.shipping.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span>AED {selectedOrder.total.toFixed(2)}</span>
                  </div>
                </div>

                {selectedOrder.notes && (
                  <div>
                    <p className="text-sm text-muted-foreground">Notes</p>
                    <p className="text-sm">{selectedOrder.notes}</p>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button onClick={() => printInvoice(selectedOrder)} className="flex-1">
                    <Printer className="w-4 h-4 mr-2" />
                    Invoice
                  </Button>
                  <Button variant="outline" onClick={() => printDeliverySlip(selectedOrder)} className="flex-1">
                    <Truck className="w-4 h-4 mr-2" />
                    Delivery Slip
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};
