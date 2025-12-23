import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { useLanguage } from "@/contexts/LanguageContext";
import { useSiteSettings } from "@/contexts/SiteSettingsContext";
import { useCartStore, getProductInfo } from "@/stores/cartStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PhoneInput, validatePhoneNumber } from "@/components/ui/phone-input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { motion } from "framer-motion";

import { supabase } from "@/integrations/supabase/client";
import { 
  ShoppingCart, 
  Minus, 
  Plus, 
  Trash2, 
  Truck, 
  Shield, 
  CreditCard, 
  ChevronRight,
  Loader2,
  ArrowLeft,
  Package,
  RotateCcw,
  MapPin
} from "lucide-react";
import { toast } from "sonner";

const WHATSAPP_URL = "https://wa.me/+971547751901";

const Checkout = () => {
  const { language } = useLanguage();
  const isArabic = language === "ar";
  const navigate = useNavigate();
  const { shippingSettings, branding } = useSiteSettings();
  const { items, updateQuantity, removeItem, clearCart, isLoading } = useCartStore();
  const [paymentMethod, setPaymentMethod] = useState<"online" | "whatsapp" | "home_delivery" | "bank_transfer">("home_delivery");
  const [guestCheckout, setGuestCheckout] = useState(true);
  const [createAccount, setCreateAccount] = useState(false);
  const [password, setPassword] = useState("");
  const [customerInfo, setCustomerInfo] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    notes: "",
  });
  
  const [couponCode, setCouponCode] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    discount_type: string;
    discount_value: number;
    id: string;
  } | null>(null);

  const [acceptedTerms, setAcceptedTerms] = useState(false);

  // Payment settings from database
  interface PaymentSettings {
    enabled: boolean;
    label?: string;
    labelAr?: string;
    phoneNumber?: string;
    instructions?: string;
  }
  
  interface BankTransferSettings {
    enabled: boolean;
    bankName: string;
    accountName: string;
    accountNumber: string;
    iban: string;
    swiftCode: string;
    instructions: string;
  }
  
  const [codSettings, setCodSettings] = useState<PaymentSettings>({ enabled: true, label: "Cash on Delivery", labelAr: "الدفع عند الاستلام" });
  const [whatsappSettings, setWhatsappSettings] = useState<PaymentSettings>({ enabled: true, phoneNumber: "+971547751901", label: "Order via WhatsApp", labelAr: "اطلب عبر واتساب" });
  const [onlinePaymentEnabled, setOnlinePaymentEnabled] = useState(false);
  const [bankSettings, setBankSettings] = useState<BankTransferSettings>({
    enabled: false,
    bankName: "",
    accountName: "",
    accountNumber: "",
    iban: "",
    swiftCode: "",
    instructions: ""
  });

  // Fetch payment settings
  useEffect(() => {
    const fetchPaymentSettings = async () => {
      try {
        const { data, error } = await supabase
          .from('site_settings')
          .select('*')
          .in('setting_key', ['cod_settings', 'whatsapp_settings', 'stripe_settings', 'paypal_settings', 'bank_transfer_settings', 'payoneer_settings']);

        if (error) throw error;

        let codEnabled = true;
        let whatsappEnabled = true;
        let onlineEnabled = false;
        let bankEnabled = false;

        data?.forEach((setting) => {
          const value = setting.setting_value as Record<string, unknown>;
          if (setting.setting_key === 'cod_settings') {
            setCodSettings(value as unknown as PaymentSettings);
            codEnabled = (value as any).enabled ?? true;
          } else if (setting.setting_key === 'whatsapp_settings') {
            setWhatsappSettings(value as unknown as PaymentSettings);
            whatsappEnabled = (value as any).enabled ?? true;
          } else if (setting.setting_key === 'stripe_settings' || setting.setting_key === 'paypal_settings') {
            if ((value as any).enabled) {
              onlineEnabled = true;
            }
          } else if (setting.setting_key === 'bank_transfer_settings') {
            setBankSettings(value as unknown as BankTransferSettings);
            bankEnabled = (value as any).enabled ?? false;
          }
        });

        setOnlinePaymentEnabled(onlineEnabled);

        // Set default payment method based on what's enabled (priority order)
        if (codEnabled) {
          setPaymentMethod("home_delivery");
        } else if (whatsappEnabled) {
          setPaymentMethod("whatsapp");
        } else if (onlineEnabled) {
          setPaymentMethod("online");
        }
      } catch (error) {
        console.error('Error fetching payment settings:', error);
      }
    };

    fetchPaymentSettings();
  }, []);
  
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name, phone, address, city')
            .eq('user_id', user.id)
            .maybeSingle();
          
          if (profile) {
            setCustomerInfo(prev => ({
              ...prev,
              name: profile.full_name || prev.name,
              phone: profile.phone || prev.phone,
              address: profile.address || prev.address,
              city: profile.city || prev.city,
              email: user.email || prev.email,
            }));
          } else {
            setCustomerInfo(prev => ({
              ...prev,
              email: user.email || prev.email,
            }));
          }
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
      }
    };

    fetchUserProfile();
  }, []);

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = items.reduce((sum, item) => sum + (parseFloat(item.price.amount) * item.quantity), 0);
  
  const couponDiscount = appliedCoupon 
    ? appliedCoupon.discount_type === 'percentage'
      ? (subtotal * appliedCoupon.discount_value / 100)
      : appliedCoupon.discount_value
    : 0;
  
  const subtotalAfterCoupon = subtotal - couponDiscount;
  
  const freeShippingThreshold = shippingSettings.freeShippingThreshold;
  const shippingCost = shippingSettings.shippingCost;
  const shipping = shippingSettings.freeShippingEnabled && subtotalAfterCoupon >= freeShippingThreshold ? 0 : shippingCost;
  
  const total = subtotalAfterCoupon + shipping;
  const currency = items[0]?.price.currencyCode || "AED";

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      toast.error(isArabic ? "يرجى إدخال كود الخصم" : "Please enter a coupon code");
      return;
    }

    setCouponLoading(true);
    try {
      const { data, error } = await supabase
        .from('discount_coupons')
        .select('*')
        .eq('code', couponCode.trim().toUpperCase())
        .eq('is_active', true)
        .single();

      if (error || !data) {
        toast.error(isArabic ? "كود الخصم غير صالح" : "Invalid coupon code");
        return;
      }

      if (data.expires_at && new Date(data.expires_at) < new Date()) {
        toast.error(isArabic ? "كود الخصم منتهي الصلاحية" : "Coupon has expired");
        return;
      }

      if (data.min_order_amount && subtotal < data.min_order_amount) {
        toast.error(
          isArabic 
            ? `الحد الأدنى للطلب ${data.min_order_amount} درهم` 
            : `Minimum order amount is AED ${data.min_order_amount}`
        );
        return;
      }

      if (data.max_uses && data.used_count >= data.max_uses) {
        toast.error(isArabic ? "تم استخدام كود الخصم بالكامل" : "Coupon usage limit reached");
        return;
      }

      setAppliedCoupon({
        code: data.code,
        discount_type: data.discount_type,
        discount_value: Number(data.discount_value),
        id: data.id
      });

      toast.success(
        isArabic 
          ? `تم تطبيق الخصم: ${data.discount_type === 'percentage' ? `${data.discount_value}%` : `${data.discount_value} درهم`}` 
          : `Discount applied: ${data.discount_type === 'percentage' ? `${data.discount_value}%` : `AED ${data.discount_value}`}`
      );
    } catch (error) {
      console.error('Coupon error:', error);
      toast.error(isArabic ? "حدث خطأ" : "An error occurred");
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode("");
    toast.success(isArabic ? "تم إزالة كود الخصم" : "Coupon removed");
  };

  const generateOrderMessage = (paymentType: string) => {
    const itemsList = items.map((item, index) => {
      const productInfo = getProductInfo(item.product);
      return `${index + 1}. ${productInfo.name}
   ${item.selectedOptions.map(opt => `${opt.name}: ${opt.value}`).join(', ')}
   Qty: ${item.quantity} × ${currency} ${parseFloat(item.price.amount).toFixed(2)} = ${currency} ${(parseFloat(item.price.amount) * item.quantity).toFixed(2)}`;
    }).join('\n\n');

    return `🛒 *New Order - Green Grass Store*

💳 *Payment Method:* ${paymentType}

👤 *Customer Details:*
Name: ${customerInfo.name}
Phone: ${customerInfo.phone}
Email: ${customerInfo.email || "Not provided"}
Address: ${customerInfo.address || "Not provided"}
City: ${customerInfo.city || "Not provided"}

📦 *Order Items:*
${itemsList}

💰 *Order Summary:*
Subtotal: ${currency} ${subtotal.toFixed(2)}
Shipping: ${shipping === 0 ? "FREE" : `${currency} ${shipping.toFixed(2)}`}
*Total: ${currency} ${total.toFixed(2)}*

📝 *Notes:* ${customerInfo.notes || "None"}

---
Please confirm my order. Thank you!`;
  };

  const handleWhatsAppOrder = () => {
    if (!customerInfo.name || !customerInfo.phone) {
      toast.error(isArabic ? "يرجى إدخال الاسم ورقم الهاتف" : "Please enter name and phone number");
      return;
    }
    
    if (!validatePhoneNumber(customerInfo.phone)) {
      toast.error(isArabic ? "يرجى إدخال رقم هاتف صحيح" : "Please enter a valid phone number");
      return;
    }

    const message = generateOrderMessage("📱 WhatsApp Order");
    const encodedMessage = encodeURIComponent(message);
    window.open(`${WHATSAPP_URL}?text=${encodedMessage}`, '_blank', 'noopener,noreferrer');
  };

  const handleHomeDeliveryOrder = async () => {
    if (!customerInfo.name || !customerInfo.phone || !customerInfo.address) {
      toast.error(isArabic ? "يرجى إدخال الاسم ورقم الهاتف والعنوان" : "Please enter name, phone and address");
      return;
    }
    
    if (!validatePhoneNumber(customerInfo.phone)) {
      toast.error(isArabic ? "يرجى إدخال رقم هاتف صحيح" : "Please enter a valid phone number");
      return;
    }

    try {
      const orderNumber = `ORD-${Date.now().toString(36).toUpperCase()}`;
      const orderItems = items.map(item => {
        const productInfo = getProductInfo(item.product);
        return {
          name: productInfo.name,
          productId: productInfo.id,
          options: item.selectedOptions.map(o => o.value).join(', '),
          quantity: item.quantity,
          price: parseFloat(item.price.amount),
          total: parseFloat(item.price.amount) * item.quantity,
          image: productInfo.featured_image
        };
      });

      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase.from('orders').insert({
        order_number: orderNumber,
        customer_name: customerInfo.name,
        customer_email: customerInfo.email || user?.email || '',
        customer_phone: customerInfo.phone,
        customer_address: `${customerInfo.address}, ${customerInfo.city}`,
        items: orderItems,
        subtotal: subtotal,
        shipping: shipping,
        tax: 0,
        total: total,
        payment_method: 'home_delivery',
        notes: customerInfo.notes,
        status: 'pending',
        user_id: user?.id || null
      });

      if (error) throw error;

      for (const item of items) {
        const productInfo = getProductInfo(item.product);
        if (productInfo.id) {
          const { data: productData } = await supabase
            .from('products')
            .select('stock_quantity')
            .eq('id', productInfo.id)
            .single();
          
          if (productData) {
            const newStock = Math.max(0, (productData.stock_quantity || 0) - item.quantity);
            await supabase
              .from('products')
              .update({ stock_quantity: newStock })
              .eq('id', productInfo.id);
          }
        }
      }

      if (appliedCoupon) {
        await supabase
          .from('discount_coupons')
          .update({ used_count: (await supabase.from('discount_coupons').select('used_count').eq('id', appliedCoupon.id).single()).data?.used_count + 1 || 1 })
          .eq('id', appliedCoupon.id);
      }

      toast.success(isArabic ? "تم تأكيد طلبك! رقم الطلب: " + orderNumber : "Order confirmed! Order #: " + orderNumber);
      clearCart();
      navigate('/thank-you?order=' + orderNumber);
    } catch (error) {
      console.error('Error creating order:', error);
      toast.error(isArabic ? "حدث خطأ في إنشاء الطلب" : "Error creating order");
    }
  };

  const handleBankTransferOrder = async () => {
    if (!customerInfo.name || !customerInfo.phone) {
      toast.error(isArabic ? "يرجى إدخال الاسم ورقم الهاتف" : "Please enter name and phone number");
      return;
    }
    
    if (!validatePhoneNumber(customerInfo.phone)) {
      toast.error(isArabic ? "يرجى إدخال رقم هاتف صحيح" : "Please enter a valid phone number");
      return;
    }

    try {
      const orderNumber = `ORD-${Date.now().toString(36).toUpperCase()}`;
      const orderItems = items.map(item => {
        const productInfo = getProductInfo(item.product);
        return {
          name: productInfo.name,
          productId: productInfo.id,
          options: item.selectedOptions.map(o => o.value).join(', '),
          quantity: item.quantity,
          price: parseFloat(item.price.amount),
          total: parseFloat(item.price.amount) * item.quantity,
          image: productInfo.featured_image
        };
      });

      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase.from('orders').insert({
        order_number: orderNumber,
        customer_name: customerInfo.name,
        customer_email: customerInfo.email || user?.email || '',
        customer_phone: customerInfo.phone,
        customer_address: `${customerInfo.address}, ${customerInfo.city}`,
        items: orderItems,
        subtotal: subtotal,
        shipping: shipping,
        tax: 0,
        total: total,
        payment_method: 'bank_transfer',
        notes: `${customerInfo.notes || ''}\n\nBank Transfer - Pending payment confirmation`,
        status: 'awaiting_payment',
        user_id: user?.id || null
      });

      if (error) throw error;

      if (appliedCoupon) {
        await supabase
          .from('discount_coupons')
          .update({ used_count: (await supabase.from('discount_coupons').select('used_count').eq('id', appliedCoupon.id).single()).data?.used_count + 1 || 1 })
          .eq('id', appliedCoupon.id);
      }

      toast.success(isArabic ? "تم إنشاء طلبك! يرجى إتمام التحويل البنكي" : "Order created! Please complete the bank transfer");
      clearCart();
      navigate('/thank-you?order=' + orderNumber + '&payment=bank');
    } catch (error) {
      console.error('Error creating order:', error);
      toast.error(isArabic ? "حدث خطأ في إنشاء الطلب" : "Error creating order");
    }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex flex-col bg-background" dir={isArabic ? "rtl" : "ltr"}>
        <Header />
        <main className="flex-1 flex items-center justify-center px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-md"
          >
            <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
              <ShoppingCart className="w-12 h-12 text-muted-foreground" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-3">
              {isArabic ? "سلة التسوق فارغة" : "Your Cart is Empty"}
            </h1>
            <p className="text-muted-foreground mb-6">
              {isArabic 
                ? "لم تقم بإضافة أي منتجات إلى سلة التسوق بعد"
                : "You haven't added any products to your cart yet"
              }
            </p>
            <Link to="/shop">
              <Button className="bg-[#2d5a3d] hover:bg-[#234830]">
                <Package className="w-4 h-4 mr-2" />
                {isArabic ? "تسوق الآن" : "Shop Now"}
              </Button>
            </Link>
          </motion.div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-muted/30" dir={isArabic ? "rtl" : "ltr"}>
      <Header />
      
      <main className="flex-1 pb-24 lg:pb-0">
        {/* Breadcrumb */}
        <div className="bg-background border-b">
          <div className="container mx-auto px-4 py-3">
            <nav className="flex items-center gap-2 text-sm">
              <Link to="/" className="text-muted-foreground hover:text-foreground">
                {isArabic ? "الرئيسية" : "Home"}
              </Link>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
              <Link to="/shop" className="text-muted-foreground hover:text-foreground">
                {isArabic ? "المتجر" : "Shop"}
              </Link>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
              <span className="text-foreground font-medium">
                {isArabic ? "إتمام الطلب" : "Checkout"}
              </span>
            </nav>
          </div>
        </div>

        <div className="container mx-auto px-4 py-6">
          {/* Back Button & Title */}
          <div className="flex items-center gap-3 mb-6">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => navigate(-1)}
              className="rounded-full h-8 w-8"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <h1 className="text-xl font-semibold text-foreground">
              {isArabic ? "إتمام الطلب" : "Checkout"}
            </h1>
          </div>

          <div className="grid lg:grid-cols-5 gap-6">
            {/* Left Column - Cart & Form */}
            <div className="lg:col-span-3 space-y-6">
              {/* Cart Items */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-background rounded-xl p-4 border border-border"
              >
                <h2 className="text-sm font-medium mb-4 flex items-center gap-2">
                  <ShoppingCart className="w-4 h-4 text-[#2d5a3d]" />
                  {isArabic ? "المنتجات" : "Cart Items"} ({totalItems})
                </h2>
                
                <div className="space-y-4">
                  {items.map((item) => {
                    const productInfo = getProductInfo(item.product);
                    return (
                    <div key={item.variantId} className="flex gap-4 pb-4 border-b border-border last:border-0 last:pb-0">
                      <div className="w-20 h-20 bg-muted rounded-lg overflow-hidden flex-shrink-0">
                        {productInfo.featured_image && (
                          <img
                            src={productInfo.featured_image}
                            alt={productInfo.name}
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h3 className="font-medium text-foreground text-sm line-clamp-2">
                              {productInfo.name}
                            </h3>
                            {item.selectedOptions.length > 0 && (
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {item.selectedOptions.map(opt => `${opt.name}: ${opt.value}`).join(' • ')}
                              </p>
                            )}
                            <p className="font-semibold text-[#2d5a3d] text-sm mt-1">
                              {currency} {parseFloat(item.price.amount).toFixed(2)}
                            </p>
                          </div>
                          <button
                            onClick={() => removeItem(item.variantId)}
                            className="text-muted-foreground hover:text-destructive transition-colors p-1"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        
                        <div className="flex items-center mt-2">
                          <div className="flex items-center border border-border rounded-lg">
                            <button
                              onClick={() => updateQuantity(item.variantId, item.quantity - 1)}
                              className="p-1.5 hover:bg-muted rounded-l-lg"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="w-8 text-center text-sm font-medium">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateQuantity(item.variantId, item.quantity + 1)}
                              className="p-1.5 hover:bg-muted rounded-r-lg"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                    );
                  })}
                </div>
              </motion.div>

              {/* Customer Information */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-background rounded-xl p-4 border border-border"
              >
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-medium">
                    {isArabic ? "معلومات العميل" : "Customer Information"}
                  </h2>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      {isArabic ? "إنشاء حساب؟" : "Create account?"}
                    </span>
                    <Switch
                      checked={createAccount}
                      onCheckedChange={setCreateAccount}
                      className="data-[state=checked]:bg-[#2d5a3d]"
                    />
                  </div>
                </div>
                
                <p className="text-xs text-muted-foreground mb-4">
                  {createAccount 
                    ? (isArabic ? "أنشئ حسابك لتتبع طلباتك وإدارة عنوانك." : "Create your account to track orders and manage your address.")
                    : (isArabic ? "اطلب بدون حساب. سنرسل لك رابط تتبع الطلب." : "Order without an account. We'll send you an order tracking link.")
                  }
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-foreground mb-1.5 block">
                      {isArabic ? "الاسم الكامل" : "Full Name"} *
                    </label>
                    <Input
                      value={customerInfo.name}
                      onChange={(e) => setCustomerInfo({ ...customerInfo, name: e.target.value })}
                      placeholder={isArabic ? "أدخل اسمك" : "Enter your name"}
                      className="text-sm h-10"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-foreground mb-1.5 block">
                      {isArabic ? "رقم الهاتف" : "Phone"} *
                    </label>
                    <PhoneInput
                      value={customerInfo.phone}
                      onChange={(phone) => setCustomerInfo({ ...customerInfo, phone })}
                      placeholder="XX XXX XXXX"
                      defaultCountry="+971"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-foreground mb-1.5 block">
                      {isArabic ? "البريد الإلكتروني" : "Email"}
                    </label>
                    <Input
                      type="email"
                      value={customerInfo.email}
                      onChange={(e) => setCustomerInfo({ ...customerInfo, email: e.target.value })}
                      placeholder={isArabic ? "بريدك الإلكتروني" : "your@email.com"}
                      className="text-sm h-10"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-foreground mb-1.5 block">
                      {isArabic ? "المدينة" : "City"}
                    </label>
                    <Input
                      value={customerInfo.city}
                      onChange={(e) => setCustomerInfo({ ...customerInfo, city: e.target.value })}
                      placeholder={isArabic ? "دبي، أبوظبي..." : "Dubai, Abu Dhabi..."}
                      className="text-sm h-10"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-xs font-medium text-foreground mb-1.5 block">
                      {isArabic ? "العنوان" : "Address"}
                    </label>
                    <Input
                      value={customerInfo.address}
                      onChange={(e) => setCustomerInfo({ ...customerInfo, address: e.target.value })}
                      placeholder={isArabic ? "عنوان التوصيل الكامل" : "Full delivery address"}
                      className="text-sm h-10"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-xs font-medium text-foreground mb-1.5 block">
                      {isArabic ? "ملاحظات" : "Notes"}
                    </label>
                    <Textarea
                      value={customerInfo.notes}
                      onChange={(e) => setCustomerInfo({ ...customerInfo, notes: e.target.value })}
                      placeholder={isArabic ? "ملاحظات إضافية للتوصيل" : "Additional delivery notes"}
                      className="text-sm min-h-[80px] resize-none"
                    />
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Right Column - Order Summary */}
            <div className="lg:col-span-2">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-background rounded-xl p-4 border border-border lg:sticky lg:top-4"
              >
                <h2 className="text-sm font-medium mb-4">
                  {isArabic ? "ملخص الطلب" : "Order Summary"}
                </h2>
                
                {/* Coupon Code */}
                <div className="mb-4">
                  <label className="text-xs font-medium text-foreground mb-2 block">
                    {isArabic ? "كود الخصم" : "Coupon Code"}
                  </label>
                  {appliedCoupon ? (
                    <div className="flex items-center justify-between p-2.5 bg-green-50 border border-green-200 rounded-lg">
                      <div>
                        <span className="text-sm font-medium text-green-700">{appliedCoupon.code}</span>
                        <span className="text-xs text-green-600 ml-2">
                          ({appliedCoupon.discount_type === 'percentage' ? `${appliedCoupon.discount_value}%` : `${currency} ${appliedCoupon.discount_value}`})
                        </span>
                      </div>
                      <button
                        onClick={handleRemoveCoupon}
                        className="text-red-500 hover:text-red-700 text-xs font-medium"
                      >
                        {isArabic ? "إزالة" : "Remove"}
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <Input
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                        placeholder={isArabic ? "أدخل كود الخصم" : "ENTER COUPON CODE"}
                        className="flex-1 text-sm h-9 uppercase"
                      />
                      <Button
                        onClick={handleApplyCoupon}
                        disabled={couponLoading}
                        variant="outline"
                        size="sm"
                        className="px-4 h-9"
                      >
                        {couponLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : (isArabic ? "تطبيق" : "Apply")}
                      </Button>
                    </div>
                  )}
                </div>
                
                {/* Summary */}
                <div className="space-y-2.5 text-sm border-t border-border pt-4">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{isArabic ? "المجموع الفرعي" : "Subtotal"}</span>
                    <span className="font-medium">{currency} {subtotal.toFixed(2)}</span>
                  </div>
                  {appliedCoupon && couponDiscount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>{isArabic ? "خصم الكوبون" : "Discount"}</span>
                      <span className="font-medium">-{currency} {couponDiscount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{isArabic ? "الشحن" : "Shipping"}</span>
                    <span className={`font-medium ${shipping === 0 ? 'text-green-600' : ''}`}>
                      {shipping === 0 ? (isArabic ? "مجاني" : "Free") : `${currency} ${shipping.toFixed(2)}`}
                    </span>
                  </div>
                  <hr className="border-border" />
                  <div className="flex justify-between text-base font-bold">
                    <span>{isArabic ? "الإجمالي" : "Total"}</span>
                    <span className="text-[#2d5a3d]">{currency} {total.toFixed(2)}</span>
                  </div>
                </div>

                {/* Payment Methods */}
                <div className="mt-5 space-y-3">
                  <h3 className="text-xs font-medium text-foreground">
                    {isArabic ? "طريقة الدفع" : "Payment Method"}
                  </h3>
                  
                  {/* Pay Online - only show if enabled */}
                  {onlinePaymentEnabled && (
                    <label 
                      className={`flex items-center gap-3 p-3 border-2 rounded-xl cursor-pointer transition-all ${
                        paymentMethod === "online" 
                          ? "border-[#2d5a3d] bg-[#2d5a3d]/5" 
                          : "border-border hover:border-muted-foreground/30"
                      }`}
                    >
                      <input
                        type="radio"
                        name="payment"
                        checked={paymentMethod === "online"}
                        onChange={() => setPaymentMethod("online")}
                        className="w-4 h-4 text-[#2d5a3d] accent-[#2d5a3d]"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <CreditCard className="w-4 h-4 text-blue-600" />
                          <span className="font-medium text-sm">{isArabic ? "الدفع الإلكتروني" : "Pay Online"}</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {isArabic ? "بطاقة ائتمان / Apple Pay" : "Credit Card / Apple Pay"}
                        </p>
                      </div>
                    </label>
                  )}

                  {/* WhatsApp - only show if enabled */}
                  {whatsappSettings.enabled && (
                    <label 
                      className={`flex items-center gap-3 p-3 border-2 rounded-xl cursor-pointer transition-all ${
                        paymentMethod === "whatsapp" 
                          ? "border-[#25D366] bg-[#25D366]/5" 
                          : "border-border hover:border-muted-foreground/30"
                      }`}
                    >
                      <input
                        type="radio"
                        name="payment"
                        checked={paymentMethod === "whatsapp"}
                        onChange={() => setPaymentMethod("whatsapp")}
                        className="w-4 h-4 text-[#25D366] accent-[#25D366]"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#25D366" className="w-4 h-4">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                          </svg>
                          <span className="font-medium text-sm">{isArabic ? (whatsappSettings.labelAr || "طلب عبر واتساب") : (whatsappSettings.label || "Order via WhatsApp")}</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {isArabic ? "تواصل معنا مباشرة" : "Contact us directly"}
                        </p>
                      </div>
                    </label>
                  )}

                  {/* Cash on Delivery - only show if enabled */}
                  {codSettings.enabled && (
                    <label 
                      className={`flex items-center gap-3 p-3 border-2 rounded-xl cursor-pointer transition-all ${
                        paymentMethod === "home_delivery" 
                          ? "border-amber-500 bg-amber-50" 
                          : "border-border hover:border-muted-foreground/30"
                      }`}
                    >
                      <input
                        type="radio"
                        name="payment"
                        checked={paymentMethod === "home_delivery"}
                        onChange={() => setPaymentMethod("home_delivery")}
                        className="w-4 h-4 text-amber-500 accent-amber-500"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Truck className="w-4 h-4 text-amber-600" />
                          <span className="font-medium text-sm">{isArabic ? (codSettings.labelAr || "الدفع عند الاستلام") : (codSettings.label || "Cash on Delivery")}</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {codSettings.instructions || (isArabic ? "ادفع نقداً عند الاستلام" : "Pay when you receive")}
                        </p>
                      </div>
                    </label>
                  )}

                  {/* Bank Transfer - only show if enabled */}
                  {bankSettings.enabled && (
                    <label 
                      className={`flex items-start gap-3 p-3 border-2 rounded-xl cursor-pointer transition-all ${
                        paymentMethod === "bank_transfer" 
                          ? "border-blue-500 bg-blue-50" 
                          : "border-border hover:border-muted-foreground/30"
                      }`}
                    >
                      <input
                        type="radio"
                        name="payment"
                        checked={paymentMethod === "bank_transfer"}
                        onChange={() => setPaymentMethod("bank_transfer" as any)}
                        className="w-4 h-4 text-blue-500 accent-blue-500 mt-0.5"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-blue-600">
                            <rect x="3" y="3" width="18" height="18" rx="2"/>
                            <path d="M3 9h18"/>
                            <path d="M9 21V9"/>
                          </svg>
                          <span className="font-medium text-sm">{isArabic ? "تحويل بنكي" : "Bank Transfer"}</span>
                        </div>
                        {paymentMethod === "bank_transfer" && bankSettings.bankName && (
                          <div className="mt-2 p-2 bg-blue-100 rounded-lg text-xs space-y-1">
                            <p><strong>{isArabic ? "البنك:" : "Bank:"}</strong> {bankSettings.bankName}</p>
                            <p><strong>{isArabic ? "اسم الحساب:" : "Account Name:"}</strong> {bankSettings.accountName}</p>
                            <p><strong>{isArabic ? "رقم الحساب:" : "Account No:"}</strong> {bankSettings.accountNumber}</p>
                            {bankSettings.iban && <p><strong>IBAN:</strong> {bankSettings.iban}</p>}
                            {bankSettings.swiftCode && <p><strong>SWIFT:</strong> {bankSettings.swiftCode}</p>}
                            {bankSettings.instructions && (
                              <p className="text-blue-700 mt-1">{bankSettings.instructions}</p>
                            )}
                          </div>
                        )}
                        {paymentMethod !== "bank_transfer" && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {isArabic ? "تحويل مباشر إلى حسابنا البنكي" : "Direct transfer to our bank account"}
                          </p>
                        )}
                      </div>
                    </label>
                  )}

                  {/* Terms */}
                  <div className="flex items-start gap-2 pt-2">
                    <input
                      type="checkbox"
                      id="accept-terms"
                      checked={acceptedTerms}
                      onChange={(e) => setAcceptedTerms(e.target.checked)}
                      className="mt-0.5 h-4 w-4 rounded border-border text-[#2d5a3d] accent-[#2d5a3d]"
                    />
                    <label htmlFor="accept-terms" className="text-xs text-muted-foreground">
                      {isArabic ? (
                        <>
                          أوافق على{" "}
                          <Link to="/privacy-policy" className="text-[#2d5a3d] hover:underline">سياسة الخصوصية</Link>
                          {" "}و{" "}
                          <Link to="/terms-of-service" className="text-[#2d5a3d] hover:underline">الشروط والأحكام</Link>
                        </>
                      ) : (
                        <>
                          I agree to the{" "}
                          <Link to="/privacy-policy" className="text-[#2d5a3d] hover:underline">Privacy Policy</Link>
                          {" "}and{" "}
                          <Link to="/terms-of-service" className="text-[#2d5a3d] hover:underline">Terms of Service</Link>
                        </>
                      )}
                    </label>
                  </div>

                  {/* Payment & Security Banner (Dynamic) */}
                  {branding?.showPaymentBanner && branding?.paymentBannerImage && (
                    <div className="mt-4 mb-2">
                      {branding.paymentBannerLink ? (
                        <a href={branding.paymentBannerLink} target="_blank" rel="noopener noreferrer">
                          <img src={branding.paymentBannerImage} alt="Payment Methods" className="w-full rounded-lg border" />
                        </a>
                      ) : (
                        <img src={branding.paymentBannerImage} alt="Payment Methods" className="w-full rounded-lg border" />
                      )}
                    </div>
                  )}


                  {/* Pay Button */}
                  <Button
                    onClick={
                      paymentMethod === "home_delivery" ? handleHomeDeliveryOrder :
                      paymentMethod === "bank_transfer" ? handleBankTransferOrder :
                      handleWhatsAppOrder
                    }
                    disabled={isLoading || !acceptedTerms}
                    className={`w-full h-11 text-sm font-semibold ${
                      paymentMethod === "whatsapp" 
                        ? "bg-[#25D366] hover:bg-[#128C7E] text-white"
                        : paymentMethod === "home_delivery"
                        ? "bg-amber-500 hover:bg-amber-600 text-white"
                        : paymentMethod === "bank_transfer"
                        ? "bg-blue-600 hover:bg-blue-700 text-white"
                        : "bg-[#2d5a3d] hover:bg-[#234830] text-white"
                    } disabled:opacity-50`}
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : paymentMethod === "online" ? (
                      <>
                        <CreditCard className="w-4 h-4 mr-2" />
                        {isArabic ? "الدفع الآن" : "Pay Now"}
                      </>
                    ) : paymentMethod === "home_delivery" ? (
                      <>
                        <Truck className="w-4 h-4 mr-2" />
                        {isArabic ? "تأكيد الطلب" : "Confirm Order"}
                      </>
                    ) : paymentMethod === "bank_transfer" ? (
                      <>
                        <CreditCard className="w-4 h-4 mr-2" />
                        {isArabic ? "تأكيد وإظهار بيانات البنك" : "Confirm & Show Bank Details"}
                      </>
                    ) : (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 mr-2">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                        </svg>
                        {isArabic ? "طلب عبر واتساب" : "Order via WhatsApp"}
                      </>
                    )}
                  </Button>

                  {!acceptedTerms && (
                    <p className="text-[10px] text-amber-600 text-center">
                      {isArabic ? "يجب الموافقة على الشروط والأحكام للمتابعة" : "Please accept the terms and conditions to proceed"}
                    </p>
                  )}
                </div>

              </motion.div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Checkout;
