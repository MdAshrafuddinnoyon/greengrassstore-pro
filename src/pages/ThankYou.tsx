import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { 
  CheckCircle, 
  Package, 
  Truck, 
  MapPin, 
  Phone, 
  Mail,
  ShoppingBag,
  ArrowRight,
  Copy,
  Printer
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface OrderItem {
  name: string;
  title?: string;
  options?: string;
  quantity: number;
  price: number;
  total: number;
  image?: string;
}

interface OrderData {
  id: string;
  order_number: string;
  status: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  customer_address: string | null;
  items: OrderItem[];
  subtotal: number;
  shipping: number;
  total: number;
  payment_method: string | null;
  created_at: string;
}

const ThankYou = () => {
  const { language } = useLanguage();
  const isArabic = language === "ar";
  const [searchParams] = useSearchParams();
  const orderNumber = searchParams.get("order");
  const [order, setOrder] = useState<OrderData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchOrder = async () => {
      if (!orderNumber) {
        setIsLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('orders')
          .select('*')
          .eq('order_number', orderNumber)
          .single();

        if (error) throw error;
        
        // Parse items if it's a string
        const parsedOrder = {
          ...data,
          items: typeof data.items === 'string' ? JSON.parse(data.items) : data.items
        };
        
        setOrder(parsedOrder as OrderData);
      } catch (error) {
        console.error('Error fetching order:', error);
        toast.error(isArabic ? "حدث خطأ في تحميل الطلب" : "Error loading order");
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrder();
  }, [orderNumber, isArabic]);

  const copyOrderNumber = () => {
    if (order?.order_number) {
      navigator.clipboard.writeText(order.order_number);
      toast.success(isArabic ? "تم نسخ رقم الطلب" : "Order number copied!");
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background" dir={isArabic ? "rtl" : "ltr"}>
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="animate-pulse text-center">
            <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">{isArabic ? "جارٍ التحميل..." : "Loading..."}</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex flex-col bg-background" dir={isArabic ? "rtl" : "ltr"}>
        <Header />
        <main className="flex-1 flex items-center justify-center px-4">
          <div className="text-center max-w-md">
            <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
              <Package className="w-10 h-10 text-muted-foreground" />
            </div>
            <h1 className="text-2xl font-bold mb-3">
              {isArabic ? "لم يتم العثور على الطلب" : "Order Not Found"}
            </h1>
            <p className="text-muted-foreground mb-6">
              {isArabic ? "يرجى التحقق من رقم الطلب" : "Please check your order number"}
            </p>
            <Link to="/shop">
              <Button>
                <ShoppingBag className="w-4 h-4 mr-2" />
                {isArabic ? "العودة للتسوق" : "Continue Shopping"}
              </Button>
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background print:bg-white" dir={isArabic ? "rtl" : "ltr"}>
      <div className="print:hidden">
        <Header />
      </div>
      
      <main className="flex-1 py-8 pb-24 lg:pb-12">
        <div className="container mx-auto px-4 max-w-4xl">
          {/* Success Header */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center mb-8"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6"
            >
              <CheckCircle className="w-12 h-12 text-green-600" />
            </motion.div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
              {isArabic ? "شكراً لك!" : "Thank You!"}
            </h1>
            <p className="text-lg text-muted-foreground mb-4">
              {isArabic 
                ? "تم استلام طلبك بنجاح"
                : "Your order has been received successfully"
              }
            </p>
            
            {/* Order Number */}
            <div className="inline-flex items-center gap-2 bg-muted/50 px-4 py-2 rounded-full">
              <span className="text-sm text-muted-foreground">
                {isArabic ? "رقم الطلب:" : "Order #:"}
              </span>
              <span className="font-bold text-primary">{order.order_number}</span>
              <button
                onClick={copyOrderNumber}
                className="p-1 hover:bg-muted rounded transition-colors print:hidden"
                title={isArabic ? "نسخ" : "Copy"}
              >
                <Copy className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
          </motion.div>

          {/* Order Items - Wishlist Style */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="mb-6">
              <CardHeader className="border-b bg-muted/30">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <ShoppingBag className="w-5 h-5 text-primary" />
                    {isArabic ? "المنتجات المطلوبة" : "Ordered Items"}
                    <Badge variant="secondary" className="ml-2">
                      {Array.isArray(order.items) ? order.items.length : 0}
                    </Badge>
                  </CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePrint}
                    className="print:hidden"
                  >
                    <Printer className="w-4 h-4 mr-2" />
                    {isArabic ? "طباعة" : "Print"}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y">
                  {Array.isArray(order.items) && order.items.map((item, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 * index }}
                      className="p-4 flex items-center gap-4 hover:bg-muted/30 transition-colors"
                    >
                      {/* Product Image Placeholder */}
                      <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden">
                        {item.image ? (
                          <img 
                            src={item.image} 
                            alt={item.name || item.title || 'Product'} 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Package className="w-8 h-8 text-primary/50" />
                        )}
                      </div>
                      
                      {/* Product Info */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-foreground line-clamp-2 mb-1">
                          {item.name || item.title || `Item ${index + 1}`}
                        </h3>
                        {item.options && (
                          <p className="text-sm text-muted-foreground mb-1">
                            {item.options}
                          </p>
                        )}
                        <div className="flex items-center gap-4 text-sm">
                          <span className="text-muted-foreground">
                            {isArabic ? "الكمية:" : "Qty:"} {item.quantity}
                          </span>
                          <span className="text-muted-foreground">×</span>
                          <span className="text-muted-foreground">
                            AED {item.price?.toFixed(2)}
                          </span>
                        </div>
                      </div>
                      
                      {/* Price */}
                      <div className="text-right">
                        <p className="font-bold text-primary text-lg">
                          AED {(item.total || (item.price * item.quantity))?.toFixed(2)}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Order Summary & Shipping */}
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            {/* Shipping Info */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card className="h-full">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Truck className="w-5 h-5 text-primary" />
                    {isArabic ? "معلومات التوصيل" : "Delivery Information"}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-muted rounded-lg flex items-center justify-center flex-shrink-0">
                      <Package className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium">{order.customer_name}</p>
                      <p className="text-sm text-muted-foreground">{isArabic ? "اسم العميل" : "Customer Name"}</p>
                    </div>
                  </div>
                  
                  {order.customer_phone && (
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-muted rounded-lg flex items-center justify-center flex-shrink-0">
                        <Phone className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-medium">{order.customer_phone}</p>
                        <p className="text-sm text-muted-foreground">{isArabic ? "رقم الهاتف" : "Phone"}</p>
                      </div>
                    </div>
                  )}
                  
                  {order.customer_email && (
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-muted rounded-lg flex items-center justify-center flex-shrink-0">
                        <Mail className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-medium text-sm break-all">{order.customer_email}</p>
                        <p className="text-sm text-muted-foreground">{isArabic ? "البريد الإلكتروني" : "Email"}</p>
                      </div>
                    </div>
                  )}
                  
                  {order.customer_address && (
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-muted rounded-lg flex items-center justify-center flex-shrink-0">
                        <MapPin className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{order.customer_address}</p>
                        <p className="text-sm text-muted-foreground">{isArabic ? "عنوان التوصيل" : "Delivery Address"}</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Order Summary */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <Card className="h-full">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">
                    {isArabic ? "ملخص الطلب" : "Order Summary"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{isArabic ? "المجموع الفرعي" : "Subtotal"}</span>
                      <span>AED {order.subtotal?.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{isArabic ? "الشحن" : "Shipping"}</span>
                      <span className={order.shipping === 0 ? "text-green-600 font-medium" : ""}>
                        {order.shipping === 0 ? (isArabic ? "مجاني" : "FREE") : `AED ${order.shipping?.toFixed(2)}`}
                      </span>
                    </div>
                    <hr className="my-2" />
                    <div className="flex justify-between text-lg font-bold">
                      <span>{isArabic ? "الإجمالي" : "Total"}</span>
                      <span className="text-primary">AED {order.total?.toFixed(2)}</span>
                    </div>
                    
                    <div className="mt-4 pt-4 border-t space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">{isArabic ? "طريقة الدفع" : "Payment Method"}</span>
                        <Badge variant="outline">
                          {order.payment_method === 'home_delivery' 
                            ? (isArabic ? "الدفع عند الاستلام" : "Cash on Delivery")
                            : order.payment_method === 'whatsapp'
                            ? (isArabic ? "واتساب" : "WhatsApp")
                            : (isArabic ? "دفع إلكتروني" : "Online Payment")
                          }
                        </Badge>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">{isArabic ? "تاريخ الطلب" : "Order Date"}</span>
                        <span>{new Date(order.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="flex flex-col sm:flex-row gap-4 justify-center print:hidden"
          >
            <Link to={`/track-order?order=${order.order_number}`}>
              <Button variant="outline" className="w-full sm:w-auto">
                <Truck className="w-4 h-4 mr-2" />
                {isArabic ? "تتبع الطلب" : "Track Order"}
              </Button>
            </Link>
            <Link to="/shop">
              <Button className="w-full sm:w-auto bg-primary hover:bg-primary/90">
                {isArabic ? "متابعة التسوق" : "Continue Shopping"}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </main>

      <div className="print:hidden">
        <Footer />
      </div>
    </div>
  );
};

export default ThankYou;
