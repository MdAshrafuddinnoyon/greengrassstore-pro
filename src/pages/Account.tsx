import { useState, useEffect, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { User, MapPin, Phone, Mail, Package, Heart, LogOut, Edit2, Save, Loader2, ChevronRight, Settings, Trash2, ShoppingBag, FileText, Clock, CheckCircle, AlertCircle, Plus, Download, Eye, Lock, Bell, X, KeyRound, Crown, RotateCcw, MessageSquare, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { useWishlistStore, WishlistItem } from "@/stores/wishlistStore";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { CustomRequestModal } from "@/components/custom-request/CustomRequestModal";
import { VIPMembershipCard } from "@/components/account/VIPMembershipCard";
import { toast } from "sonner";
import type { User as SupabaseUser, Session } from "@supabase/supabase-js";
import type { Json } from "@/integrations/supabase/types";

interface CustomRequest {
  id: string;
  title: string;
  description: string;
  requirement_type: string;
  status: string;
  created_at: string;
  budget: string | null;
  timeline: string | null;
  admin_notes: string | null;
}

interface OrderItem {
  name: string;
  options?: string;
  quantity: number;
  price: number;
  total: number;
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
  shipping: number;
  tax: number;
  total: number;
  payment_method: string | null;
  status: string;
  notes: string | null;
  created_at: string;
}

interface Profile {
  id: string;
  user_id: string;
  full_name: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  country: string | null;
  avatar_url: string | null;
}

const Account = () => {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");
  const [customRequests, setCustomRequests] = useState<CustomRequest[]>([]);
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  
  // Return Request states
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [returnOrderId, setReturnOrderId] = useState<string | null>(null);
  const [returnReason, setReturnReason] = useState("");
  const [returnSubmitting, setReturnSubmitting] = useState(false);
  
  // Admin Messages states
  const [adminMessages, setAdminMessages] = useState<{id: string; message: string; from_admin: boolean; created_at: string}[]>([]);
  const [showMessagesModal, setShowMessagesModal] = useState(false);
  const [selectedRequestForChat, setSelectedRequestForChat] = useState<CustomRequest | null>(null);
  const [newMessage, setNewMessage] = useState("");
  
  // Password change states
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordChanging, setPasswordChanging] = useState(false);
  
  // Notifications state
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<{ id: string; message: string; type: string; created_at: string; read: boolean }[]>([]);
  
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const isArabic = language === "ar";
  const { items: wishlistItems, fetchWishlist, removeFromWishlist, loading: wishlistLoading } = useWishlistStore();

  // Form states
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (!session?.user) {
          navigate("/auth");
        } else {
          setTimeout(() => {
            fetchProfile(session.user.id);
            fetchWishlist();
          }, 0);
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (!session?.user) {
        navigate("/auth");
      } else {
        fetchProfile(session.user.id);
        fetchWishlist();
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, fetchWishlist]);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (error && error.code !== "PGRST116") {
        throw error;
      }

      if (data) {
        setProfile(data);
        setFullName(data.full_name || "");
        setPhone(data.phone || "");
        setAddress(data.address || "");
        setCity(data.city || "");
      }
    } catch (error: any) {
      console.error("Error fetching profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    setSaving(true);

    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: fullName,
          phone,
          address,
          city,
        })
        .eq("user_id", user.id);

      if (error) throw error;

      setProfile((prev) => prev ? { ...prev, full_name: fullName, phone, address, city } : null);
      setIsEditing(false);
      toast.success(t("account.profileUpdated"));
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success(t("account.loggedOut"));
    navigate("/");
  };

  const handleRemoveFromWishlist = async (productId: string) => {
    const success = await removeFromWishlist(productId);
    if (success) {
      toast.success(isArabic ? "تمت الإزالة من المفضلة" : "Removed from wishlist");
    }
  };

  const fetchCustomRequests = async () => {
    if (!user) return;
    setRequestsLoading(true);
    try {
      const { data, error } = await supabase
        .from("custom_requirements")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setCustomRequests(data || []);
    } catch (error: any) {
      console.error("Error fetching requests:", error);
    } finally {
      setRequestsLoading(false);
    }
  };

  const fetchOrders = async () => {
    if (!user) return;
    setOrdersLoading(true);
    try {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      // Parse items from JSON
      const parsedOrders: Order[] = (data || []).map(order => ({
        ...order,
        items: Array.isArray(order.items) ? order.items as unknown as OrderItem[] : []
      }));
      
      setOrders(parsedOrders);
    } catch (error: any) {
      console.error("Error fetching orders:", error);
    } finally {
      setOrdersLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "requests" && user) {
      fetchCustomRequests();
    }
    if (activeTab === "orders" && user) {
      fetchOrders();
    }
  }, [activeTab, user]);

  // Real-time subscription for orders
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('user-orders-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newOrder = payload.new as any;
            setOrders((prev) => [{
              ...newOrder,
              items: Array.isArray(newOrder.items) ? newOrder.items : []
            }, ...prev]);
            
            // Add notification
            const notification = {
              id: `order-${newOrder.id}`,
              message: isArabic ? `تم إنشاء طلب جديد: ${newOrder.order_number}` : `New order created: ${newOrder.order_number}`,
              type: 'order',
              created_at: new Date().toISOString(),
              read: false
            };
            setNotifications(prev => [notification, ...prev]);
            toast.success(notification.message);
          } else if (payload.eventType === 'UPDATE') {
            const updatedOrder = payload.new as any;
            setOrders((prev) => prev.map(order => 
              order.id === updatedOrder.id 
                ? { ...updatedOrder, items: Array.isArray(updatedOrder.items) ? updatedOrder.items : [] }
                : order
            ));
            
            // Update selected order if viewing
            if (selectedOrder?.id === updatedOrder.id) {
              setSelectedOrder({
                ...updatedOrder,
                items: Array.isArray(updatedOrder.items) ? updatedOrder.items : []
              });
            }
            
            // Add notification for status change
            const notification = {
              id: `status-${updatedOrder.id}-${Date.now()}`,
              message: isArabic 
                ? `تم تحديث حالة الطلب ${updatedOrder.order_number} إلى: ${getStatusLabel(updatedOrder.status)}`
                : `Order ${updatedOrder.order_number} status updated to: ${getStatusLabel(updatedOrder.status)}`,
              type: 'status',
              created_at: new Date().toISOString(),
              read: false
            };
            setNotifications(prev => [notification, ...prev]);
            toast.info(notification.message);
          } else if (payload.eventType === 'DELETE') {
            const deletedOrder = payload.old as any;
            setOrders((prev) => prev.filter(order => order.id !== deletedOrder.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, isArabic, selectedOrder?.id]);

  // Password change handler
  const handlePasswordChange = async () => {
    if (!user) return;
    
    if (newPassword.length < 6) {
      toast.error(isArabic ? "كلمة المرور يجب أن تكون 6 أحرف على الأقل" : "Password must be at least 6 characters");
      return;
    }
    
    if (newPassword !== confirmPassword) {
      toast.error(isArabic ? "كلمات المرور غير متطابقة" : "Passwords do not match");
      return;
    }

    setPasswordChanging(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      toast.success(isArabic ? "تم تغيير كلمة المرور بنجاح" : "Password changed successfully");
      setShowPasswordModal(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setPasswordChanging(false);
    }
  };

  const markNotificationAsRead = (notificationId: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
    );
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
      case "delivered":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "processing":
      case "shipped":
        return <Clock className="w-4 h-4 text-amber-500" />;
      case "cancelled":
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getStatusLabel = (status: string) => {
    const statusLabels: Record<string, { en: string; ar: string }> = {
      pending: { en: "Pending", ar: "قيد الانتظار" },
      processing: { en: "Processing", ar: "جاري المعالجة" },
      shipped: { en: "Shipped", ar: "تم الشحن" },
      delivered: { en: "Delivered", ar: "تم التوصيل" },
      completed: { en: "Completed", ar: "مكتمل" },
      cancelled: { en: "Cancelled", ar: "ملغى" },
    };
    return statusLabels[status]?.[isArabic ? "ar" : "en"] || status;
  };

  const getTypeLabel = (type: string) => {
    const types: Record<string, { en: string; ar: string }> = {
      custom_plant: { en: "Custom Plant", ar: "نباتات مخصصة" },
      bulk_order: { en: "Bulk Order", ar: "طلب بالجملة" },
      corporate_gift: { en: "Corporate Gift", ar: "هدايا الشركات" },
      event_decoration: { en: "Event Decoration", ar: "تزيين المناسبات" },
      landscaping: { en: "Landscaping", ar: "تنسيق الحدائق" },
      other: { en: "Other", ar: "أخرى" },
    };
    return types[type]?.[isArabic ? "ar" : "en"] || type;
  };

  const downloadInvoice = (order: Order) => {
    const invoiceHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Invoice - ${order.order_number}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; }
          .header { text-align: center; border-bottom: 2px solid #2d5a3d; padding-bottom: 20px; margin-bottom: 30px; }
          .header h1 { color: #2d5a3d; margin: 0; }
          .header p { color: #666; margin: 5px 0; }
          .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-bottom: 30px; }
          .info-box h3 { color: #2d5a3d; margin: 0 0 10px 0; font-size: 14px; }
          .info-box p { margin: 5px 0; color: #333; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
          th, td { padding: 12px; text-align: left; border-bottom: 1px solid #eee; }
          th { background: #f5f5f5; font-weight: 600; }
          .total-row { font-weight: bold; background: #f0f7f3; }
          .footer { text-align: center; color: #666; font-size: 12px; margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; }
          .status { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; }
          .status-pending { background: #fef3c7; color: #92400e; }
          .status-completed, .status-delivered { background: #d1fae5; color: #065f46; }
          .status-processing, .status-shipped { background: #dbeafe; color: #1e40af; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>GREEN GRASS</h1>
          <p>www.greengrassstore.com</p>
          <p>Dubai, UAE</p>
        </div>
        
        <div class="info-grid">
          <div class="info-box">
            <h3>INVOICE TO</h3>
            <p><strong>${order.customer_name}</strong></p>
            <p>${order.customer_email}</p>
            <p>${order.customer_phone || ''}</p>
            <p>${order.customer_address || ''}</p>
          </div>
          <div class="info-box" style="text-align: right;">
            <h3>INVOICE DETAILS</h3>
            <p><strong>Order #:</strong> ${order.order_number}</p>
            <p><strong>Date:</strong> ${new Date(order.created_at).toLocaleDateString()}</p>
            <p><strong>Payment:</strong> ${order.payment_method || 'N/A'}</p>
            <p><strong>Status:</strong> <span class="status status-${order.status}">${order.status.toUpperCase()}</span></p>
          </div>
        </div>
        
        <table>
          <thead>
            <tr>
              <th>Item</th>
              <th>Options</th>
              <th style="text-align: center;">Qty</th>
              <th style="text-align: right;">Price</th>
              <th style="text-align: right;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${order.items.map(item => `
              <tr>
                <td>${item.name}</td>
                <td>${item.options || '-'}</td>
                <td style="text-align: center;">${item.quantity}</td>
                <td style="text-align: right;">AED ${item.price.toFixed(2)}</td>
                <td style="text-align: right;">AED ${item.total.toFixed(2)}</td>
              </tr>
            `).join('')}
            <tr>
              <td colspan="4" style="text-align: right;"><strong>Subtotal</strong></td>
              <td style="text-align: right;">AED ${order.subtotal.toFixed(2)}</td>
            </tr>
            <tr>
              <td colspan="4" style="text-align: right;"><strong>Shipping</strong></td>
              <td style="text-align: right;">${order.shipping === 0 ? 'FREE' : `AED ${order.shipping.toFixed(2)}`}</td>
            </tr>
            ${order.tax > 0 ? `
              <tr>
                <td colspan="4" style="text-align: right;"><strong>Tax</strong></td>
                <td style="text-align: right;">AED ${order.tax.toFixed(2)}</td>
              </tr>
            ` : ''}
            <tr class="total-row">
              <td colspan="4" style="text-align: right;"><strong>TOTAL</strong></td>
              <td style="text-align: right;"><strong>AED ${order.total.toFixed(2)}</strong></td>
            </tr>
          </tbody>
        </table>
        
        ${order.notes ? `<p><strong>Notes:</strong> ${order.notes}</p>` : ''}
        
        <div class="footer">
          <p>Thank you for shopping with Green Grass!</p>
          <p>For any queries, contact us at: +971 54 775 1901</p>
        </div>
      </body>
      </html>
    `;

    const blob = new Blob([invoiceHTML], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const printWindow = window.open(url, '_blank');
    
    if (printWindow) {
      printWindow.onload = () => {
        printWindow.print();
      };
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const tabs = [
    { id: "profile", label: t("account.profile"), icon: User },
    { id: "vip", label: isArabic ? "VIP" : "VIP", icon: Crown },
    { id: "orders", label: t("account.orders"), icon: Package },
    { id: "returns", label: isArabic ? "طلبات الإرجاع" : "Returns", icon: RotateCcw },
    { id: "wishlist", label: t("account.wishlist"), icon: Heart, count: wishlistItems.length },
    { id: "requests", label: t("account.myRequests"), icon: FileText, count: customRequests.length },
    { id: "settings", label: t("account.settings"), icon: Settings },
  ];

  // Handle return request submission
  const handleReturnRequest = async () => {
    if (!returnOrderId || !returnReason.trim()) {
      toast.error(isArabic ? "يرجى إدخال سبب الإرجاع" : "Please enter return reason");
      return;
    }
    
    setReturnSubmitting(true);
    try {
      // Create return request in custom_requirements table
      const order = orders.find(o => o.id === returnOrderId);
      const { error } = await supabase.from('custom_requirements').insert({
        user_id: user?.id,
        name: profile?.full_name || 'Customer',
        email: user?.email || '',
        phone: profile?.phone || '',
        title: `Return Request - Order #${order?.order_number}`,
        description: returnReason,
        requirement_type: 'return_request',
        status: 'pending'
      });
      
      if (error) throw error;
      
      toast.success(isArabic ? "تم إرسال طلب الإرجاع بنجاح" : "Return request submitted successfully");
      setShowReturnModal(false);
      setReturnOrderId(null);
      setReturnReason("");
      fetchCustomRequests();
    } catch (error) {
      console.error('Error submitting return request:', error);
      toast.error(isArabic ? "فشل إرسال الطلب" : "Failed to submit request");
    } finally {
      setReturnSubmitting(false);
    }
  };

  // Fetch admin messages for a request
  const fetchAdminMessages = async (requestId: string) => {
    try {
      const { data } = await supabase
        .from('custom_requirements')
        .select('admin_notes')
        .eq('id', requestId)
        .single();
      
      if (data?.admin_notes) {
        // Parse admin notes as messages (simple format: each line is a message)
        const messages = data.admin_notes.split('\n').filter(Boolean).map((msg: string, idx: number) => ({
          id: idx.toString(),
          message: msg.replace(/^\[(Admin|Customer)\]: /, ''),
          from_admin: msg.startsWith('[Admin]:'),
          created_at: new Date().toISOString()
        }));
        setAdminMessages(messages);
      } else {
        setAdminMessages([]);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  // Send message to admin
  const sendMessageToAdmin = async () => {
    if (!selectedRequestForChat || !newMessage.trim()) return;
    
    try {
      const currentNotes = selectedRequestForChat.admin_notes || '';
      const updatedNotes = currentNotes 
        ? `${currentNotes}\n[Customer]: ${newMessage.trim()}`
        : `[Customer]: ${newMessage.trim()}`;
      
      const { error } = await supabase
        .from('custom_requirements')
        .update({ admin_notes: updatedNotes })
        .eq('id', selectedRequestForChat.id);
      
      if (error) throw error;
      
      setNewMessage("");
      fetchAdminMessages(selectedRequestForChat.id);
      toast.success(isArabic ? "تم إرسال الرسالة" : "Message sent");
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error(isArabic ? "فشل إرسال الرسالة" : "Failed to send message");
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1 py-6 md:py-12 pb-24 md:pb-12">
        <div className="container mx-auto px-4">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 md:mb-8"
          >
            <h1 className="text-xl md:text-3xl font-display font-semibold text-foreground">
              {t("account.myAccount")}
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              {t("account.manageProfile")}
            </p>
          </motion.div>

          <div className="grid md:grid-cols-4 gap-6">
            {/* Sidebar - Desktop */}
            <div className="hidden md:block">
              <div className="bg-card rounded-2xl border border-border p-4 sticky top-24">
                {/* User Info */}
                <div className="flex items-center gap-3 mb-6 pb-6 border-b border-border">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{profile?.full_name || t("account.guest")}</p>
                    <p className="text-xs text-muted-foreground">{user?.email}</p>
                  </div>
                </div>

                {/* Navigation */}
                <nav className="space-y-1">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                        activeTab === tab.id
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      <span className="flex items-center gap-3">
                        <tab.icon className="w-5 h-5" />
                        {tab.label}
                      </span>
                      {tab.count !== undefined && tab.count > 0 && (
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          activeTab === tab.id ? "bg-white/20" : "bg-primary/10 text-primary"
                        }`}>
                          {tab.count}
                        </span>
                      )}
                    </button>
                  ))}
                </nav>

                {/* Logout */}
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors mt-4"
                >
                  <LogOut className="w-5 h-5" />
                  {t("account.logout")}
                </button>
              </div>
            </div>

            {/* Mobile Tabs */}
            <div className="md:hidden mb-6">
              <div className="flex gap-2 overflow-x-auto pb-3 -mx-4 px-4 scrollbar-hide snap-x snap-mandatory">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all snap-start flex-shrink-0 ${
                      activeTab === tab.id
                        ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    <tab.icon className="w-4 h-4" />
                    <span className="hidden xs:inline">{tab.label}</span>
                    {tab.count !== undefined && tab.count > 0 && (
                      <span className={`text-xs px-1.5 rounded-full ${
                        activeTab === tab.id ? "bg-white/20" : "bg-primary/10 text-primary"
                      }`}>
                        {tab.count}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Content */}
            <div className="md:col-span-3">
              {activeTab === "profile" && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-card rounded-2xl border border-border p-4 sm:p-6"
                >
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-semibold text-foreground">
                      {t("account.personalInfo")}
                    </h2>
                    {!isEditing ? (
                      <button
                        onClick={() => setIsEditing(true)}
                        className="flex items-center gap-2 text-sm text-primary hover:underline"
                      >
                        <Edit2 className="w-4 h-4" />
                        {t("account.edit")}
                      </button>
                    ) : (
                      <button
                        onClick={handleSaveProfile}
                        disabled={saving}
                        className="flex items-center gap-2 text-sm bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
                      >
                        {saving ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Save className="w-4 h-4" />
                        )}
                        {t("account.save")}
                      </button>
                    )}
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-muted-foreground mb-1.5">
                        {t("account.fullName")}
                      </label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          className="w-full px-4 py-3 bg-muted border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50"
                        />
                      ) : (
                        <div className="flex items-center gap-2 px-4 py-3 bg-muted rounded-xl">
                          <User className="w-4 h-4 text-muted-foreground" />
                          <span className="text-foreground">{fullName || "-"}</span>
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-muted-foreground mb-1.5">
                        {t("account.email")}
                      </label>
                      <div className="flex items-center gap-2 px-4 py-3 bg-muted rounded-xl">
                        <Mail className="w-4 h-4 text-muted-foreground" />
                        <span className="text-foreground">{user?.email}</span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-muted-foreground mb-1.5">
                        {t("account.phone")}
                      </label>
                      {isEditing ? (
                        <input
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className="w-full px-4 py-3 bg-muted border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50"
                        />
                      ) : (
                        <div className="flex items-center gap-2 px-4 py-3 bg-muted rounded-xl">
                          <Phone className="w-4 h-4 text-muted-foreground" />
                          <span className="text-foreground">{phone || "-"}</span>
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-muted-foreground mb-1.5">
                        {t("account.city")}
                      </label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          className="w-full px-4 py-3 bg-muted border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50"
                        />
                      ) : (
                        <div className="flex items-center gap-2 px-4 py-3 bg-muted rounded-xl">
                          <MapPin className="w-4 h-4 text-muted-foreground" />
                          <span className="text-foreground">{city || "-"}</span>
                        </div>
                      )}
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-sm font-medium text-muted-foreground mb-1.5">
                        {t("account.address")}
                      </label>
                      {isEditing ? (
                        <textarea
                          value={address}
                          onChange={(e) => setAddress(e.target.value)}
                          rows={2}
                          className="w-full px-4 py-3 bg-muted border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                        />
                      ) : (
                        <div className="flex items-start gap-2 px-4 py-3 bg-muted rounded-xl">
                          <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
                          <span className="text-foreground">{address || "-"}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === "vip" && user && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-6"
                >
                  <div className="bg-card rounded-2xl border border-border p-4 sm:p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                        <Crown className="w-5 h-5 text-amber-500" />
                        {isArabic ? "عضوية VIP" : "VIP Membership"}
                      </h2>
                      <Link 
                        to="/vip" 
                        className="text-sm text-primary hover:underline flex items-center gap-1"
                      >
                        {isArabic ? "اعرف المزيد" : "Learn More"}
                        <ChevronRight className="w-4 h-4" />
                      </Link>
                    </div>
                    
                    <VIPMembershipCard userId={user.id} />
                  </div>
                </motion.div>
              )}

              {activeTab === "orders" && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-card rounded-2xl border border-border p-4 sm:p-6"
                >
                  <h2 className="text-lg font-semibold text-foreground mb-6">
                    {t("account.myOrders")}
                  </h2>
                  
                  {ordersLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    </div>
                  ) : orders.length === 0 ? (
                    <div className="text-center py-12">
                      <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground mb-4">{t("account.noOrders")}</p>
                      <Link 
                        to="/shop"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-full text-sm font-medium hover:bg-primary/90 transition-colors"
                      >
                        <ShoppingBag className="w-4 h-4" />
                        {isArabic ? "تسوق الآن" : "Start Shopping"}
                      </Link>
                    </div>
                  ) : selectedOrder ? (
                    // Order Detail View
                    <div>
                      <button
                        onClick={() => setSelectedOrder(null)}
                        className="flex items-center gap-2 text-sm text-primary hover:underline mb-6"
                      >
                        <ChevronRight className={`w-4 h-4 ${isArabic ? '' : 'rotate-180'}`} />
                        {isArabic ? "العودة للطلبات" : "Back to Orders"}
                      </button>
                      
                      <div className="space-y-6">
                        {/* Order Header */}
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-border">
                          <div>
                            <h3 className="text-lg font-semibold">{selectedOrder.order_number}</h3>
                            <p className="text-sm text-muted-foreground">
                              {new Date(selectedOrder.created_at).toLocaleDateString(isArabic ? 'ar-AE' : 'en-AE', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })}
                            </p>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${
                              selectedOrder.status === 'delivered' || selectedOrder.status === 'completed' 
                                ? 'bg-green-100 text-green-700' 
                                : selectedOrder.status === 'cancelled' 
                                  ? 'bg-red-100 text-red-700'
                                  : 'bg-amber-100 text-amber-700'
                            }`}>
                              {getStatusIcon(selectedOrder.status)}
                              {getStatusLabel(selectedOrder.status)}
                            </span>
                            <button
                              onClick={() => downloadInvoice(selectedOrder)}
                              className="flex items-center gap-2 px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-medium hover:bg-primary/90 transition-colors"
                            >
                              <Download className="w-3.5 h-3.5" />
                              {isArabic ? "تحميل الفاتورة" : "Download Invoice"}
                            </button>
                          </div>
                        </div>
                        
                        {/* Order Items */}
                        <div>
                          <h4 className="font-medium mb-3">{isArabic ? "المنتجات" : "Items"}</h4>
                          <div className="space-y-3">
                            {selectedOrder.items.map((item, idx) => (
                              <div key={idx} className="flex justify-between items-start p-3 bg-muted rounded-xl">
                                <div>
                                  <p className="font-medium text-foreground">{item.name}</p>
                                  {item.options && (
                                    <p className="text-xs text-muted-foreground">{item.options}</p>
                                  )}
                                  <p className="text-sm text-muted-foreground">
                                    {item.quantity} × AED {item.price.toFixed(2)}
                                  </p>
                                </div>
                                <p className="font-semibold text-primary">AED {item.total.toFixed(2)}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                        
                        {/* Order Summary */}
                        <div className="bg-muted rounded-xl p-4 space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">{isArabic ? "المجموع الفرعي" : "Subtotal"}</span>
                            <span>AED {selectedOrder.subtotal.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">{isArabic ? "الشحن" : "Shipping"}</span>
                            <span>{selectedOrder.shipping === 0 ? (isArabic ? "مجاني" : "FREE") : `AED ${selectedOrder.shipping.toFixed(2)}`}</span>
                          </div>
                          {selectedOrder.tax > 0 && (
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">{isArabic ? "الضريبة" : "Tax"}</span>
                              <span>AED {selectedOrder.tax.toFixed(2)}</span>
                            </div>
                          )}
                          <hr className="border-border" />
                          <div className="flex justify-between font-semibold">
                            <span>{isArabic ? "الإجمالي" : "Total"}</span>
                            <span className="text-primary">AED {selectedOrder.total.toFixed(2)}</span>
                          </div>
                        </div>
                        
                        {/* Shipping Info */}
                        <div className="grid sm:grid-cols-2 gap-4">
                          <div className="p-4 bg-muted rounded-xl">
                            <h4 className="font-medium mb-2 text-sm">{isArabic ? "عنوان التوصيل" : "Shipping Address"}</h4>
                            <p className="text-sm text-muted-foreground">{selectedOrder.customer_name}</p>
                            <p className="text-sm text-muted-foreground">{selectedOrder.customer_address || '-'}</p>
                            <p className="text-sm text-muted-foreground">{selectedOrder.customer_phone || '-'}</p>
                          </div>
                          <div className="p-4 bg-muted rounded-xl">
                            <h4 className="font-medium mb-2 text-sm">{isArabic ? "طريقة الدفع" : "Payment Method"}</h4>
                            <p className="text-sm text-muted-foreground capitalize">{selectedOrder.payment_method?.replace('_', ' ') || '-'}</p>
                            {selectedOrder.notes && (
                              <>
                                <h4 className="font-medium mb-1 mt-3 text-sm">{isArabic ? "ملاحظات" : "Notes"}</h4>
                                <p className="text-sm text-muted-foreground">{selectedOrder.notes}</p>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    // Orders List
                    <div className="space-y-3">
                      {orders.map((order) => (
                        <motion.div
                          key={order.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="border border-border rounded-xl p-4 hover:bg-muted/50 transition-colors cursor-pointer"
                          onClick={() => setSelectedOrder(order)}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <span className="font-semibold text-foreground">{order.order_number}</span>
                                <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                                  order.status === 'delivered' || order.status === 'completed' 
                                    ? 'bg-green-100 text-green-700' 
                                    : order.status === 'cancelled' 
                                      ? 'bg-red-100 text-red-700'
                                      : 'bg-amber-100 text-amber-700'
                                }`}>
                                  {getStatusIcon(order.status)}
                                  {getStatusLabel(order.status)}
                                </span>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {new Date(order.created_at).toLocaleDateString(isArabic ? 'ar-AE' : 'en-AE')} • {order.items.length} {isArabic ? "منتجات" : "items"}
                              </p>
                            </div>
                            <div className="flex items-center gap-4">
                              <span className="font-bold text-primary">AED {order.total.toFixed(2)}</span>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    downloadInvoice(order);
                                  }}
                                  className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                                  title={isArabic ? "تحميل الفاتورة" : "Download Invoice"}
                                >
                                  <Download className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedOrder(order);
                                  }}
                                  className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                                  title={isArabic ? "عرض التفاصيل" : "View Details"}
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                                <ChevronRight className={`w-5 h-5 text-muted-foreground ${isArabic ? 'rotate-180' : ''}`} />
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}

              {activeTab === "wishlist" && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-card rounded-2xl border border-border p-6"
                >
                  <h2 className="text-lg font-semibold text-foreground mb-6">
                    {t("account.myWishlist")}
                  </h2>
                  
                  {wishlistLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    </div>
                  ) : wishlistItems.length === 0 ? (
                    <div className="text-center py-12">
                      <Heart className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground mb-4">{t("account.noWishlist")}</p>
                      <Link 
                        to="/shop"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-full text-sm font-medium hover:bg-primary/90 transition-colors"
                      >
                        <ShoppingBag className="w-4 h-4" />
                        Start Shopping
                      </Link>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                      {wishlistItems.map((item) => (
                        <motion.div
                          key={item.id}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="group relative bg-muted rounded-xl overflow-hidden"
                        >
                          <div className="aspect-square">
                            {item.product_image ? (
                              <img
                                src={item.product_image}
                                alt={item.product_title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-gray-100">
                                <Heart className="w-8 h-8 text-gray-300" />
                              </div>
                            )}
                          </div>
                          <div className="p-2 sm:p-3">
                            <h4 className="text-xs sm:text-sm font-medium text-foreground line-clamp-2 mb-1">
                              {item.product_title}
                            </h4>
                            {item.product_price && (
                              <p className="text-xs sm:text-sm font-bold text-primary">{item.product_price}</p>
                            )}
                          </div>
                          <button
                            onClick={() => handleRemoveFromWishlist(item.product_id)}
                            className="absolute top-2 right-2 w-7 h-7 sm:w-8 sm:h-8 bg-white/90 rounded-full flex items-center justify-center sm:opacity-0 sm:group-hover:opacity-100 transition-opacity hover:bg-red-50"
                          >
                            <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-500" />
                          </button>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}

              {/* Returns Tab */}
              {activeTab === "returns" && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-card rounded-2xl border border-border p-4 sm:p-6"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                    <h2 className="text-lg font-semibold text-foreground">
                      {isArabic ? "طلبات الإرجاع" : "Return Requests"}
                    </h2>
                  </div>
                  
                  {/* Return Requests List */}
                  {customRequests.filter(r => r.requirement_type === 'return_request').length === 0 ? (
                    <div className="text-center py-12">
                      <RotateCcw className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground mb-4">
                        {isArabic ? "لا توجد طلبات إرجاع" : "No return requests"}
                      </p>
                      <p className="text-sm text-muted-foreground mb-4">
                        {isArabic ? "حدد طلب من قائمة الطلبات لإنشاء طلب إرجاع" : "Select an order from your orders to create a return request"}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {customRequests.filter(r => r.requirement_type === 'return_request').map((request) => (
                        <div key={request.id} className="p-4 bg-muted rounded-xl">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium text-foreground text-sm">{request.title}</h4>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                              request.status === 'completed' ? 'bg-green-100 text-green-700' :
                              request.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-blue-100 text-blue-700'
                            }`}>
                              {getStatusLabel(request.status)}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground">{request.description}</p>
                          <p className="text-xs text-muted-foreground mt-2">
                            {new Date(request.created_at).toLocaleDateString()}
                          </p>
                          {request.admin_notes && (
                            <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200">
                              <p className="text-xs text-blue-700 dark:text-blue-300">{request.admin_notes}</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Create Return Request from Order */}
                  <div className="mt-6 pt-6 border-t border-border">
                    <h3 className="font-medium text-foreground mb-4">
                      {isArabic ? "إنشاء طلب إرجاع جديد" : "Create New Return Request"}
                    </h3>
                    {orders.filter(o => o.status === 'delivered' || o.status === 'completed').length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        {isArabic ? "لا توجد طلبات مكتملة للإرجاع" : "No completed orders available for return"}
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {orders.filter(o => o.status === 'delivered' || o.status === 'completed').slice(0, 5).map((order) => (
                          <div key={order.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                            <div>
                              <p className="text-sm font-medium">{order.order_number}</p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(order.created_at).toLocaleDateString()} - AED {order.total.toFixed(2)}
                              </p>
                            </div>
                            <button
                              onClick={() => {
                                setReturnOrderId(order.id);
                                setShowReturnModal(true);
                              }}
                              className="text-xs px-3 py-1.5 bg-primary text-primary-foreground rounded-lg"
                            >
                              {isArabic ? "طلب إرجاع" : "Request Return"}
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {activeTab === "settings" && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-card rounded-2xl border border-border p-6"
                >
                  <h2 className="text-lg font-semibold text-foreground mb-6">
                    {t("account.accountSettings")}
                  </h2>
                  <div className="space-y-4">
                    {/* Change Password */}
                    <button 
                      onClick={() => setShowPasswordModal(true)}
                      className="w-full flex items-center justify-between p-4 bg-muted rounded-xl hover:bg-muted/80 transition-colors"
                    >
                      <span className="flex items-center gap-3">
                        <Lock className="w-5 h-5 text-muted-foreground" />
                        <span className="text-foreground">{t("account.changePassword")}</span>
                      </span>
                      <ChevronRight className={`w-5 h-5 text-muted-foreground ${isArabic ? 'rotate-180' : ''}`} />
                    </button>
                    
                    {/* Notifications */}
                    <button 
                      onClick={() => setShowNotifications(true)}
                      className="w-full flex items-center justify-between p-4 bg-muted rounded-xl hover:bg-muted/80 transition-colors"
                    >
                      <span className="flex items-center gap-3">
                        <Bell className="w-5 h-5 text-muted-foreground" />
                        <span className="text-foreground">{t("account.notifications")}</span>
                        {unreadCount > 0 && (
                          <span className="px-2 py-0.5 bg-primary text-primary-foreground text-xs rounded-full">
                            {unreadCount}
                          </span>
                        )}
                      </span>
                      <ChevronRight className={`w-5 h-5 text-muted-foreground ${isArabic ? 'rotate-180' : ''}`} />
                    </button>
                    
                    {/* Delete Account Warning */}
                    <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800">
                      <p className="text-sm text-amber-700 dark:text-amber-400">
                        {isArabic 
                          ? "لحذف حسابك، يرجى التواصل مع خدمة العملاء عبر واتساب"
                          : "To delete your account, please contact customer support via WhatsApp"}
                      </p>
                    </div>
                    
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center justify-center gap-2 p-4 bg-destructive/10 text-destructive rounded-xl hover:bg-destructive/20 transition-colors md:hidden"
                    >
                      <LogOut className="w-5 h-5" />
                      {t("account.logout")}
                    </button>
                  </div>
                </motion.div>
              )}

              {activeTab === "requests" && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-card rounded-2xl border border-border p-4 sm:p-6"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                    <h2 className="text-lg font-semibold text-foreground">
                      {t("account.myRequests")}
                    </h2>
                    <button
                      onClick={() => setShowRequestModal(true)}
                      className="flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors w-full sm:w-auto"
                    >
                      <Plus className="w-4 h-4" />
                      {isArabic ? "طলب جديد" : "New Request"}
                    </button>
                  </div>
                  
                  {requestsLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    </div>
                  ) : customRequests.length === 0 ? (
                    <div className="text-center py-12">
                      <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground mb-4">{t("account.noRequests")}</p>
                      <button
                        onClick={() => setShowRequestModal(true)}
                        className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-full text-sm font-medium hover:bg-primary/90 transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                        {t("account.submitRequest")}
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3 sm:space-y-4">
                      {customRequests.map((request) => (
                        <motion.div
                          key={request.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="p-3 sm:p-4 bg-muted rounded-xl"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 sm:gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-wrap items-center gap-2 mb-2">
                                <span className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded-full">
                                  {getTypeLabel(request.requirement_type)}
                                </span>
                                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                  {getStatusIcon(request.status)}
                                  {getStatusLabel(request.status)}
                                </span>
                              </div>
                              <h4 className="font-medium text-foreground mb-1 text-sm sm:text-base">{request.title}</h4>
                              <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">{request.description}</p>
                              <div className="flex flex-wrap items-center gap-3 sm:gap-4 mt-2 text-xs text-muted-foreground">
                                <span>
                                  {new Date(request.created_at).toLocaleDateString(isArabic ? "ar-AE" : "en-AE", {
                                    year: "numeric",
                                    month: "short",
                                    day: "numeric"
                                  })}
                                </span>
                                {request.budget && (
                                  <span>{isArabic ? "الميزانية:" : "Budget:"} {request.budget}</span>
                                )}
                              </div>
                              {/* Admin Response Display */}
                              {request.admin_notes && (
                                <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                                  <p className="text-xs font-medium text-blue-700 dark:text-blue-400 mb-1">
                                    {isArabic ? "رد الإدارة:" : "Admin Response:"}
                                  </p>
                                  <p className="text-xs text-blue-600 dark:text-blue-300">{request.admin_notes}</p>
                                </div>
                              )}
                            </div>
                            <button
                              onClick={() => {
                                setSelectedRequestForChat(request);
                                fetchAdminMessages(request.id);
                                setShowMessagesModal(true);
                              }}
                              className="flex items-center gap-1 text-xs text-primary hover:underline"
                            >
                              <MessageSquare className="w-4 h-4" />
                              {isArabic ? "المحادثة" : "Chat"}
                            </button>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
      
      {/* Custom Request Modal */}
      <CustomRequestModal
        isOpen={showRequestModal}
        onClose={() => {
          setShowRequestModal(false);
          fetchCustomRequests();
        }}
        user={user ? { id: user.id, email: user.email || "" } : null}
      />

      {/* Password Change Modal */}
      <AnimatePresence>
        {showPasswordModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={() => setShowPasswordModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-card rounded-2xl border border-border p-6 w-full max-w-md"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                  <KeyRound className="w-5 h-5 text-primary" />
                  {isArabic ? "تغيير كلمة المرور" : "Change Password"}
                </h3>
                <button
                  onClick={() => setShowPasswordModal(false)}
                  className="p-2 hover:bg-muted rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1.5">
                    {isArabic ? "كلمة المرور الجديدة" : "New Password"}
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-4 py-3 bg-muted border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1.5">
                    {isArabic ? "تأكيد كلمة المرور" : "Confirm Password"}
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-4 py-3 bg-muted border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>

                <div className="text-xs text-muted-foreground space-y-1 bg-muted/50 p-3 rounded-lg">
                  <p className="font-medium text-foreground mb-2">
                    {isArabic ? "متطلبات كلمة المرور:" : "Password Requirements:"}
                  </p>
                  <ul className="space-y-1">
                    <li className={`flex items-center gap-2 ${newPassword.length >= 8 ? 'text-green-600' : ''}`}>
                      {newPassword.length >= 8 ? '✓' : '○'} {isArabic ? "8 أحرف على الأقل" : "At least 8 characters"}
                    </li>
                    <li className={`flex items-center gap-2 ${/[A-Z]/.test(newPassword) ? 'text-green-600' : ''}`}>
                      {/[A-Z]/.test(newPassword) ? '✓' : '○'} {isArabic ? "حرف كبير واحد على الأقل" : "At least 1 uppercase letter"}
                    </li>
                    <li className={`flex items-center gap-2 ${/[a-z]/.test(newPassword) ? 'text-green-600' : ''}`}>
                      {/[a-z]/.test(newPassword) ? '✓' : '○'} {isArabic ? "حرف صغير واحد على الأقل" : "At least 1 lowercase letter"}
                    </li>
                    <li className={`flex items-center gap-2 ${/[0-9]/.test(newPassword) ? 'text-green-600' : ''}`}>
                      {/[0-9]/.test(newPassword) ? '✓' : '○'} {isArabic ? "رقم واحد على الأقل" : "At least 1 number"}
                    </li>
                    <li className={`flex items-center gap-2 ${/[!@#$%^&*(),.?":{}|<>]/.test(newPassword) ? 'text-green-600' : ''}`}>
                      {/[!@#$%^&*(),.?":{}|<>]/.test(newPassword) ? '✓' : '○'} {isArabic ? "رمز خاص واحد على الأقل" : "At least 1 special character"}
                    </li>
                  </ul>
                </div>

                <button
                  onClick={handlePasswordChange}
                  disabled={passwordChanging || !newPassword || !confirmPassword}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {passwordChanging ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <Lock className="w-4 h-4" />
                      {isArabic ? "تحديث كلمة المرور" : "Update Password"}
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Notifications Modal */}
      <AnimatePresence>
        {showNotifications && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={() => setShowNotifications(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-card rounded-2xl border border-border p-6 w-full max-w-md max-h-[70vh] overflow-hidden flex flex-col"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                  <Bell className="w-5 h-5 text-primary" />
                  {isArabic ? "الإشعارات" : "Notifications"}
                  {unreadCount > 0 && (
                    <span className="px-2 py-0.5 bg-primary text-primary-foreground text-xs rounded-full">
                      {unreadCount}
                    </span>
                  )}
                </h3>
                <div className="flex items-center gap-2">
                  {notifications.length > 0 && (
                    <button
                      onClick={clearAllNotifications}
                      className="text-xs text-muted-foreground hover:text-destructive transition-colors"
                    >
                      {isArabic ? "مسح الكل" : "Clear All"}
                    </button>
                  )}
                  <button
                    onClick={() => setShowNotifications(false)}
                    className="p-2 hover:bg-muted rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-muted-foreground" />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="text-center py-12">
                    <Bell className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                    <p className="text-muted-foreground">
                      {isArabic ? "لا توجد إشعارات" : "No notifications"}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {notifications.map((notification) => (
                      <motion.div
                        key={notification.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className={`p-4 rounded-xl cursor-pointer transition-colors ${
                          notification.read 
                            ? 'bg-muted/50' 
                            : 'bg-primary/5 border border-primary/20'
                        }`}
                        onClick={() => markNotificationAsRead(notification.id)}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`w-2 h-2 rounded-full mt-2 ${
                            notification.read ? 'bg-muted-foreground' : 'bg-primary'
                          }`} />
                          <div className="flex-1">
                            <p className="text-sm text-foreground">{notification.message}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {new Date(notification.created_at).toLocaleString(isArabic ? 'ar-AE' : 'en-AE')}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Return Request Modal */}
      <AnimatePresence>
        {showReturnModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={() => setShowReturnModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-card rounded-2xl border border-border p-6 w-full max-w-md"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                  <RotateCcw className="w-5 h-5 text-primary" />
                  {isArabic ? "طلب إرجاع" : "Return Request"}
                </h3>
                <button
                  onClick={() => setShowReturnModal(false)}
                  className="p-2 hover:bg-muted rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1.5">
                    {isArabic ? "سبب الإرجاع" : "Reason for Return"}
                  </label>
                  <textarea
                    value={returnReason}
                    onChange={(e) => setReturnReason(e.target.value)}
                    placeholder={isArabic ? "يرجى شرح سبب الإرجاع..." : "Please explain the reason for return..."}
                    rows={4}
                    className="w-full px-4 py-3 bg-muted border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                  />
                </div>

                <button
                  onClick={handleReturnRequest}
                  disabled={returnSubmitting || !returnReason.trim()}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {returnSubmitting ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      {isArabic ? "إرسال الطلب" : "Submit Request"}
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Messages Modal */}
      <AnimatePresence>
        {showMessagesModal && selectedRequestForChat && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={() => setShowMessagesModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-card rounded-2xl border border-border p-6 w-full max-w-lg max-h-[80vh] flex flex-col"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-primary" />
                  {isArabic ? "المحادثة" : "Messages"}
                </h3>
                <button
                  onClick={() => setShowMessagesModal(false)}
                  className="p-2 hover:bg-muted rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>

              <div className="text-sm text-muted-foreground mb-4 pb-4 border-b">
                <p className="font-medium text-foreground">{selectedRequestForChat.title}</p>
                <p className="text-xs">{selectedRequestForChat.status}</p>
              </div>

              {/* Messages List */}
              <div className="flex-1 overflow-y-auto space-y-3 mb-4 min-h-[200px] max-h-[300px]">
                {adminMessages.length === 0 ? (
                  <p className="text-center text-muted-foreground text-sm py-8">
                    {isArabic ? "لا توجد رسائل بعد" : "No messages yet"}
                  </p>
                ) : (
                  adminMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`p-3 rounded-lg max-w-[80%] ${
                        msg.from_admin
                          ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 ml-0 mr-auto'
                          : 'bg-primary/10 border border-primary/20 mr-0 ml-auto'
                      }`}
                    >
                      <p className="text-xs font-medium mb-1">
                        {msg.from_admin ? (isArabic ? 'الإدارة' : 'Admin') : (isArabic ? 'أنت' : 'You')}
                      </p>
                      <p className="text-sm">{msg.message}</p>
                    </div>
                  ))
                )}
              </div>

              {/* Send Message */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder={isArabic ? "اكتب رسالتك..." : "Type your message..."}
                  className="flex-1 px-4 py-2.5 bg-muted border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50"
                  onKeyDown={(e) => e.key === 'Enter' && sendMessageToAdmin()}
                />
                <button
                  onClick={sendMessageToAdmin}
                  disabled={!newMessage.trim()}
                  className="px-4 py-2.5 bg-primary text-primary-foreground rounded-xl disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Account;