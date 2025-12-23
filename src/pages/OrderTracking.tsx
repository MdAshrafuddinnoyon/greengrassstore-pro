import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { 
  Package, 
  Search, 
  Truck, 
  CheckCircle, 
  Clock, 
  MapPin,
  Phone,
  Mail,
  AlertCircle
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface OrderData {
  id: string;
  order_number: string;
  status: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  customer_address: string;
  items: any[];
  total: number;
  shipping: number;
  created_at: string;
  updated_at: string;
}

const statusSteps = [
  { key: "pending", label: "Order Placed", labelAr: "تم الطلب", icon: Clock },
  { key: "confirmed", label: "Confirmed", labelAr: "تم التأكيد", icon: CheckCircle },
  { key: "processing", label: "Processing", labelAr: "قيد المعالجة", icon: Package },
  { key: "shipped", label: "Shipped", labelAr: "تم الشحن", icon: Truck },
  { key: "delivered", label: "Delivered", labelAr: "تم التوصيل", icon: MapPin },
];

const OrderTracking = () => {
  const { language } = useLanguage();
  const isArabic = language === "ar";
  const [orderNumber, setOrderNumber] = useState("");
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [order, setOrder] = useState<OrderData | null>(null);
  const [notFound, setNotFound] = useState(false);

  const handleTrackOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderNumber.trim()) {
      toast.error(isArabic ? "يرجى إدخال رقم الطلب" : "Please enter order number");
      return;
    }

    setIsLoading(true);
    setNotFound(false);
    setOrder(null);

    try {
      let query = supabase
        .from('orders')
        .select('*')
        .eq('order_number', orderNumber.trim().toUpperCase());

      if (email.trim()) {
        query = query.eq('customer_email', email.trim().toLowerCase());
      }

      const { data, error } = await query.single();

      if (error || !data) {
        setNotFound(true);
        toast.error(isArabic ? "لم يتم العثور على الطلب" : "Order not found");
      } else {
        setOrder(data as OrderData);
      }
    } catch (error) {
      console.error('Error tracking order:', error);
      toast.error(isArabic ? "حدث خطأ" : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIndex = (status: string) => {
    const index = statusSteps.findIndex(s => s.key === status);
    return index >= 0 ? index : 0;
  };

  const currentStatusIndex = order ? getStatusIndex(order.status) : -1;

  return (
    <div className="min-h-screen flex flex-col bg-gray-50" dir={isArabic ? "rtl" : "ltr"}>
      <Header />
      
      <main className="flex-1 py-12 pb-24 lg:pb-12">
        <div className="container mx-auto px-4 max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-10"
          >
            <div className="w-16 h-16 bg-[#2d5a3d]/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Truck className="w-8 h-8 text-[#2d5a3d]" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {isArabic ? "تتبع طلبك" : "Track Your Order"}
            </h1>
            <p className="text-gray-600">
              {isArabic 
                ? "أدخل رقم الطلب للاطلاع على حالة الشحن"
                : "Enter your order number to check shipment status"
              }
            </p>
          </motion.div>

          {/* Search Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="text-lg">
                  {isArabic ? "بحث عن طلب" : "Find Your Order"}
                </CardTitle>
                <CardDescription>
                  {isArabic 
                    ? "أدخل رقم الطلب والبريد الإلكتروني للتحقق"
                    : "Enter order number and email for verification"
                  }
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleTrackOrder} className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-1.5 block">
                        {isArabic ? "رقم الطلب" : "Order Number"} *
                      </label>
                      <Input
                        value={orderNumber}
                        onChange={(e) => setOrderNumber(e.target.value.toUpperCase())}
                        placeholder="ORD-XXXXXX"
                        className="uppercase"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-1.5 block">
                        {isArabic ? "البريد الإلكتروني" : "Email"} ({isArabic ? "اختياري" : "Optional"})
                      </label>
                      <Input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="your@email.com"
                      />
                    </div>
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full sm:w-auto bg-[#2d5a3d] hover:bg-[#234830]"
                    disabled={isLoading}
                  >
                    <Search className="w-4 h-4 mr-2" />
                    {isLoading 
                      ? (isArabic ? "جارٍ البحث..." : "Searching...") 
                      : (isArabic ? "تتبع الطلب" : "Track Order")
                    }
                  </Button>
                </form>
              </CardContent>
            </Card>
          </motion.div>

          {/* Not Found Message */}
          {notFound && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="border-amber-200 bg-amber-50">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <AlertCircle className="w-6 h-6 text-amber-600 flex-shrink-0" />
                    <div>
                      <h3 className="font-semibold text-amber-800 mb-1">
                        {isArabic ? "لم يتم العثور على الطلب" : "Order Not Found"}
                      </h3>
                      <p className="text-sm text-amber-700">
                        {isArabic 
                          ? "تأكد من رقم الطلب والبريد الإلكتروني وحاول مرة أخرى"
                          : "Please verify your order number and email, then try again"
                        }
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Order Details */}
          {order && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Order Status */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">
                        {isArabic ? "حالة الطلب" : "Order Status"}
                      </CardTitle>
                      <CardDescription>
                        {isArabic ? "رقم الطلب:" : "Order #:"} {order.order_number}
                      </CardDescription>
                    </div>
                    <Badge className={
                      order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                      order.status === 'shipped' ? 'bg-blue-100 text-blue-800' :
                      order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                      'bg-amber-100 text-amber-800'
                    }>
                      {isArabic 
                        ? statusSteps.find(s => s.key === order.status)?.labelAr || order.status
                        : statusSteps.find(s => s.key === order.status)?.label || order.status
                      }
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Progress Steps */}
                  <div className="relative">
                    <div className="flex justify-between items-center">
                      {statusSteps.map((step, index) => {
                        const Icon = step.icon;
                        const isCompleted = index <= currentStatusIndex;
                        const isCurrent = index === currentStatusIndex;
                        
                        return (
                          <div key={step.key} className="flex flex-col items-center relative z-10">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                              isCompleted 
                                ? 'bg-[#2d5a3d] text-white' 
                                : 'bg-gray-200 text-gray-400'
                            } ${isCurrent ? 'ring-4 ring-[#2d5a3d]/20' : ''}`}>
                              <Icon className="w-5 h-5" />
                            </div>
                            <span className={`text-xs mt-2 text-center ${
                              isCompleted ? 'text-[#2d5a3d] font-medium' : 'text-gray-400'
                            }`}>
                              {isArabic ? step.labelAr : step.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                    {/* Progress Line */}
                    <div className="absolute top-5 left-0 right-0 h-0.5 bg-gray-200 -z-0">
                      <div 
                        className="h-full bg-[#2d5a3d] transition-all duration-500"
                        style={{ width: `${(currentStatusIndex / (statusSteps.length - 1)) * 100}%` }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Order Info */}
              <div className="grid md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">
                      {isArabic ? "معلومات الشحن" : "Shipping Information"}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <span>{order.customer_address || (isArabic ? "غير متوفر" : "Not provided")}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <span>{order.customer_phone || (isArabic ? "غير متوفر" : "Not provided")}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <span>{order.customer_email}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">
                      {isArabic ? "ملخص الطلب" : "Order Summary"}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">{isArabic ? "المنتجات" : "Items"}</span>
                      <span>{Array.isArray(order.items) ? order.items.length : 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">{isArabic ? "الشحن" : "Shipping"}</span>
                      <span>{order.shipping === 0 ? (isArabic ? "مجاني" : "Free") : `AED ${order.shipping}`}</span>
                    </div>
                    <hr />
                    <div className="flex justify-between font-semibold">
                      <span>{isArabic ? "الإجمالي" : "Total"}</span>
                      <span className="text-[#2d5a3d]">AED {order.total}</span>
                    </div>
                    <p className="text-xs text-gray-400">
                      {isArabic ? "تاريخ الطلب:" : "Order Date:"} {new Date(order.created_at).toLocaleDateString()}
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Order Items */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    {isArabic ? "المنتجات المطلوبة" : "Order Items"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="divide-y">
                    {Array.isArray(order.items) && order.items.map((item: any, index: number) => (
                      <div key={index} className="py-3 flex items-center gap-4">
                        <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                          <Package className="w-6 h-6 text-gray-400" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-sm">{item.name || item.title || `Item ${index + 1}`}</p>
                          <p className="text-xs text-gray-500">
                            {isArabic ? "الكمية:" : "Qty:"} {item.quantity || 1}
                          </p>
                        </div>
                        <span className="font-medium text-sm">
                          AED {item.price || item.total || 0}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default OrderTracking;
