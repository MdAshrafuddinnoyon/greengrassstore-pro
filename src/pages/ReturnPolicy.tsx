import { useState, useEffect } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { motion } from "framer-motion";
import { RotateCcw, Package, Clock, CheckCircle, XCircle, CreditCard, Truck, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";

interface PolicySection {
  id: string;
  title: string;
  titleAr: string;
  content: string;
  contentAr: string;
  icon: string;
  order: number;
}

const defaultSections: PolicySection[] = [
  { id: '1', title: 'Eligible for Return', titleAr: 'المؤهل للإرجاع', content: 'Items in original, unused condition with original packaging. Items returned within 7 days of delivery. Items with tags and labels attached. Damaged or defective items (photo proof required). Wrong item delivered.', contentAr: 'العناصر في حالتها الأصلية وغير المستخدمة مع التغليف الأصلي. العناصر التي يتم إرجاعها خلال 7 أيام من التسليم.', icon: 'check-circle', order: 1 },
  { id: '2', title: 'Not Eligible for Return', titleAr: 'غير مؤهل للإرجاع', content: 'Live plants showing signs of customer damage. Items without original packaging. Items returned after 7 days. Customized or personalized items. Sale items marked as Final Sale.', contentAr: 'النباتات الحية التي تظهر عليها علامات تلف من العميل. العناصر بدون التغليف الأصلي.', icon: 'x-circle', order: 2 },
  { id: '3', title: 'Refund Information', titleAr: 'معلومات الاسترداد', content: 'Credit/Debit Card: Refunded to original card. Cash on Delivery: Bank transfer or store credit. Refund approval: 1-2 business days. Bank processing: 5-7 business days.', contentAr: 'بطاقة الائتمان/الخصم: يتم استردادها إلى البطاقة الأصلية. الدفع عند الاستلام: تحويل بنكي أو رصيد متجر.', icon: 'credit-card', order: 3 },
  { id: '4', title: 'Return Shipping', titleAr: 'شحن الإرجاع', content: 'Defective/Wrong Item: Free return shipping – we will arrange pickup. Change of Mind: Customer bears return shipping costs (AED 25-50). Store Drop-off: No shipping cost – bring items to our Dubai or Abu Dhabi store.', contentAr: 'عنصر معيب/خاطئ: شحن إرجاع مجاني - سنقوم بترتيب الاستلام.', icon: 'truck', order: 4 },
];

const ReturnPolicy = () => {
  const { language } = useLanguage();
  const isArabic = language === "ar";
  const [loading, setLoading] = useState(true);
  const [sections, setSections] = useState<PolicySection[]>(defaultSections);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data, error } = await supabase
          .from('site_settings')
          .select('setting_value')
          .eq('setting_key', 'return_policy_sections')
          .single();

        if (data && !error) {
          const items = data.setting_value as unknown as PolicySection[];
          if (Array.isArray(items) && items.length > 0) {
            setSections(items.sort((a, b) => a.order - b.order));
          }
        }
      } catch (error) {
        console.error('Error fetching return policy:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const getIcon = (iconName: string) => {
    const icons: Record<string, React.ReactNode> = {
      'check-circle': <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-green-600 flex-shrink-0" />,
      'x-circle': <XCircle className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-red-600 flex-shrink-0" />,
      'credit-card': <CreditCard className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-[#2d5a3d] flex-shrink-0" />,
      'truck': <Truck className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-[#2d5a3d] flex-shrink-0" />,
    };
    return icons[iconName] || <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-[#2d5a3d] flex-shrink-0" />;
  };

  return (
    <div className="min-h-screen flex flex-col bg-white" dir={isArabic ? "rtl" : "ltr"}>
      <Header />
      
      <main className="flex-1">
        {/* Hero Section */}
        <div className="bg-gradient-to-br from-[#2d5a3d] to-[#1a3d28] text-white py-10 sm:py-14 md:py-20">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-3xl mx-auto text-center"
            >
              <RotateCcw className="w-10 h-10 sm:w-12 md:w-16 sm:h-12 md:h-16 mx-auto mb-3 sm:mb-4 md:mb-6 text-white/80" />
              <h1 className="text-xl sm:text-2xl md:text-4xl lg:text-5xl font-serif font-bold mb-2 sm:mb-3 md:mb-4 px-2">
                {isArabic ? "سياسة الإرجاع والاسترداد" : "Return & Refund Policy"}
              </h1>
              <p className="text-xs sm:text-sm md:text-base lg:text-lg text-white/80 px-4 max-w-xl mx-auto">
                {isArabic 
                  ? "نريدك أن تكون راضيًا تمامًا عن مشترياتك."
                  : "We want you to be completely satisfied with your purchase."
                }
              </p>
            </motion.div>
          </div>
        </div>

        {/* Quick Info Cards */}
        <section className="py-6 sm:py-8 md:py-12 -mt-4 sm:-mt-6 md:-mt-8">
          <div className="container mx-auto px-3 sm:px-4">
            <div className="grid grid-cols-3 gap-2 sm:gap-4 md:gap-6 max-w-4xl mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-lg sm:rounded-xl md:rounded-2xl shadow-md sm:shadow-lg p-3 sm:p-4 md:p-6 text-center"
              >
                <Clock className="w-6 h-6 sm:w-8 md:w-10 sm:h-8 md:h-10 mx-auto mb-1 sm:mb-2 md:mb-3 text-[#2d5a3d]" />
                <h3 className="font-bold text-gray-900 text-xs sm:text-sm md:text-base">{isArabic ? "7 أيام" : "7 Days"}</h3>
                <p className="text-gray-600 text-[10px] sm:text-xs md:text-sm">{isArabic ? "فترة الإرجاع" : "Return Window"}</p>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white rounded-lg sm:rounded-xl md:rounded-2xl shadow-md sm:shadow-lg p-3 sm:p-4 md:p-6 text-center"
              >
                <Package className="w-6 h-6 sm:w-8 md:w-10 sm:h-8 md:h-10 mx-auto mb-1 sm:mb-2 md:mb-3 text-[#2d5a3d]" />
                <h3 className="font-bold text-gray-900 text-xs sm:text-sm md:text-base">{isArabic ? "التغليف الأصلي" : "Original"}</h3>
                <p className="text-gray-600 text-[10px] sm:text-xs md:text-sm">{isArabic ? "مطلوب" : "Packaging"}</p>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white rounded-lg sm:rounded-xl md:rounded-2xl shadow-md sm:shadow-lg p-3 sm:p-4 md:p-6 text-center"
              >
                <CreditCard className="w-6 h-6 sm:w-8 md:w-10 sm:h-8 md:h-10 mx-auto mb-1 sm:mb-2 md:mb-3 text-[#2d5a3d]" />
                <h3 className="font-bold text-gray-900 text-xs sm:text-sm md:text-base">{isArabic ? "5-7 أيام" : "5-7 Days"}</h3>
                <p className="text-gray-600 text-[10px] sm:text-xs md:text-sm">{isArabic ? "الاسترداد" : "Refund"}</p>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Content */}
        <div className="container mx-auto px-3 sm:px-4 py-6 sm:py-8 md:py-12">
          <div className="max-w-4xl mx-auto">
            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="grid gap-6 sm:gap-8 md:gap-10">
                {/* Dynamic Sections */}
                {sections.map((section) => (
                  <motion.section
                    key={section.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="space-y-3 sm:space-y-4"
                  >
                    <h2 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-gray-900 flex items-center gap-2 sm:gap-3">
                      {getIcon(section.icon)}
                      <span>{isArabic ? section.titleAr : section.title}</span>
                    </h2>
                    <div className="bg-gray-50 rounded-lg sm:rounded-xl md:rounded-2xl p-3 sm:p-5 md:p-8">
                      <p className="text-xs sm:text-sm md:text-base text-gray-700 whitespace-pre-line leading-relaxed">
                        {isArabic ? section.contentAr : section.content}
                      </p>
                    </div>
                  </motion.section>
                ))}

                {/* Contact for Returns */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="bg-[#2d5a3d] text-white rounded-lg sm:rounded-xl md:rounded-2xl p-4 sm:p-6 md:p-8 text-center"
                >
                  <h3 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold mb-2 sm:mb-3 md:mb-4">
                    {isArabic ? "تحتاج لإرجاع منتج؟" : "Need to Return an Item?"}
                  </h3>
                  <p className="text-xs sm:text-sm md:text-base text-white/80 mb-3 sm:mb-4 md:mb-6">
                    {isArabic 
                      ? "تواصل مع فريق خدمة العملاء لبدء عملية الإرجاع."
                      : "Contact our customer service team to initiate your return."
                    }
                  </p>
                  <div className="flex flex-col gap-2 sm:gap-3 md:gap-4 justify-center max-w-md mx-auto">
                    <a
                      href="mailto:returns@greengrassstore.com"
                      className="px-3 sm:px-4 md:px-6 py-2 sm:py-2.5 md:py-3 bg-white text-[#2d5a3d] font-semibold rounded-lg hover:bg-gray-100 transition-colors text-xs sm:text-sm md:text-base truncate"
                    >
                      returns@greengrassstore.com
                    </a>
                    <a
                      href="https://wa.me/971547751901"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 sm:px-4 md:px-6 py-2 sm:py-2.5 md:py-3 bg-[#25D366] text-white font-semibold rounded-lg hover:bg-[#20BD5A] transition-colors text-xs sm:text-sm md:text-base"
                    >
                      WhatsApp: +971 54 775 1901
                    </a>
                  </div>
                </motion.div>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ReturnPolicy;