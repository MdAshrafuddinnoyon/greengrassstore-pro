import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { Loader2 } from "lucide-react";

interface FAQItem {
  id: string;
  question: string;
  questionAr: string;
  answer: string;
  answerAr: string;
  category: string;
  order: number;
}

const defaultFaqs: FAQItem[] = [
  {
    id: "1",
    question: "Do you deliver across UAE?",
    questionAr: "هل تقومون بالتوصيل إلى جميع أنحاء الإمارات؟",
    answer: "Yes, we deliver to all Emirates including Dubai, Abu Dhabi, Sharjah, Ajman, Fujairah, Ras Al Khaimah, and Umm Al Quwain. Free delivery on orders over 200 AED.",
    answerAr: "نعم، نقوم بالتوصيل إلى جميع الإمارات بما في ذلك دبي وأبوظبي والشارقة وعجمان والفجيرة ورأس الخيمة وأم القيوين. التوصيل مجاني للطلبات التي تزيد عن 200 درهم.",
    category: "1",
    order: 1
  },
  {
    id: "2",
    question: "How do I care for indoor plants?",
    questionAr: "كيف أعتني بالنباتات الداخلية؟",
    answer: "Most indoor plants need indirect sunlight, watering once a week, and occasional fertilizing. Each plant comes with specific care instructions.",
    answerAr: "معظم النباتات الداخلية تحتاج إلى ضوء غير مباشر والري مرة واحدة في الأسبوع والتسميد من حين لآخر. كل نبتة تأتي مع تعليمات عناية خاصة.",
    category: "1",
    order: 2
  },
  {
    id: "3",
    question: "Can I return or exchange products?",
    questionAr: "هل يمكنني إرجاع أو استبدال المنتجات؟",
    answer: "Yes, we offer a 7-day return policy for undamaged items. Plants can be exchanged if they arrive damaged.",
    answerAr: "نعم، نقدم سياسة إرجاع لمدة 7 أيام للمنتجات غير التالفة. يمكن استبدال النباتات إذا وصلت تالفة.",
    category: "1",
    order: 3
  },
  {
    id: "4",
    question: "Do you offer custom plant arrangements?",
    questionAr: "هل تقدمون ترتيبات نباتات مخصصة؟",
    answer: "Absolutely! We specialize in custom plant arrangements for homes, offices, and events.",
    answerAr: "بالتأكيد! نحن متخصصون في ترتيبات النباتات المخصصة للمنازل والمكاتب والفعاليات.",
    category: "1",
    order: 4
  },
  {
    id: "5",
    question: "What payment methods do you accept?",
    questionAr: "ما هي طرق الدفع التي تقبلونها؟",
    answer: "We accept all major credit/debit cards through our secure checkout, as well as Cash on Delivery (COD).",
    answerAr: "نقبل جميع بطاقات الائتمان/الخصم الرئيسية من خلال عملية الدفع الآمنة لدينا، وكذلك الدفع عند الاستلام.",
    category: "1",
    order: 5
  }
];

export const FAQSection = () => {
  const { language } = useLanguage();
  const isArabic = language === "ar";
  const [faqs, setFaqs] = useState<FAQItem[]>(defaultFaqs);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFaqs = async () => {
      try {
        const { data, error } = await supabase
          .from('site_settings')
          .select('setting_value')
          .eq('setting_key', 'faq_items')
          .single();

        if (data && !error) {
          const items = data.setting_value as unknown as FAQItem[];
          if (Array.isArray(items) && items.length > 0) {
            setFaqs(items.slice(0, 6)); // Show max 6 items on homepage
          }
        }
      } catch (error) {
        console.error('Error fetching FAQs:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFaqs();
  }, []);

  return (
    <section className="py-16 md:py-20 bg-[#f8f8f5]" dir={isArabic ? "rtl" : "ltr"}>
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <span className="text-sm uppercase tracking-widest text-muted-foreground mb-2 block">
            {isArabic ? "هل لديك أسئلة؟" : "Got Questions?"}
          </span>
          <h2 className="font-display text-3xl md:text-4xl font-normal text-foreground">
            {isArabic ? "الأسئلة الشائعة" : "Frequently Asked Questions"}
          </h2>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto"
        >
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <Accordion type="single" collapsible className="space-y-4">
              {faqs.map((faq, index) => (
                <AccordionItem
                  key={faq.id}
                  value={`item-${index}`}
                  className="bg-white rounded-lg px-6 border-none shadow-sm"
                >
                  <AccordionTrigger className="text-left text-base font-medium hover:no-underline py-5">
                    {isArabic ? faq.questionAr : faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground pb-5">
                    {isArabic ? faq.answerAr : faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </motion.div>
      </div>
    </section>
  );
};
