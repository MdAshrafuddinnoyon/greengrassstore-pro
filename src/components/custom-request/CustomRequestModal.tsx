import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, Loader2, FileText, DollarSign, Clock, MessageSquare, User, Mail, Phone } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";

interface CustomRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  user?: { id: string; email: string } | null;
}

const requirementTypes = [
  { id: "custom_plant", label: "Custom Plant Arrangement", labelAr: "ترتيب نباتات مخصص" },
  { id: "bulk_order", label: "Bulk Order", labelAr: "طلب بالجملة" },
  { id: "corporate_gift", label: "Corporate Gifting", labelAr: "هدايا الشركات" },
  { id: "event_decoration", label: "Event Decoration", labelAr: "تزيين المناسبات" },
  { id: "landscaping", label: "Landscaping Service", labelAr: "خدمة تنسيق الحدائق" },
  { id: "other", label: "Other", labelAr: "أخرى" },
];

const budgetRanges = [
  { id: "below_500", label: "Below AED 500", labelAr: "أقل من 500 درهم" },
  { id: "500_1000", label: "AED 500 - 1,000", labelAr: "500 - 1,000 درهم" },
  { id: "1000_5000", label: "AED 1,000 - 5,000", labelAr: "1,000 - 5,000 درهم" },
  { id: "5000_plus", label: "AED 5,000+", labelAr: "أكثر من 5,000 درهم" },
  { id: "flexible", label: "Flexible", labelAr: "مرن" },
];

const timelineOptions = [
  { id: "urgent", label: "Urgent (1-3 days)", labelAr: "عاجل (1-3 أيام)" },
  { id: "week", label: "Within a week", labelAr: "خلال أسبوع" },
  { id: "two_weeks", label: "1-2 weeks", labelAr: "1-2 أسابيع" },
  { id: "month", label: "Within a month", labelAr: "خلال شهر" },
  { id: "flexible", label: "Flexible", labelAr: "مرن" },
];

const WHATSAPP_URL = "https://wa.me/+971547751901";

export const CustomRequestModal = ({ isOpen, onClose, user }: CustomRequestModalProps) => {
  const { language } = useLanguage();
  const isArabic = language === "ar";
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: user?.email || "",
    phone: "",
    requirementType: "",
    title: "",
    description: "",
    budget: "",
    timeline: "",
  });

  const getRequirementLabel = (id: string) => {
    const type = requirementTypes.find(t => t.id === id);
    return type ? (isArabic ? type.labelAr : type.label) : id;
  };

  const getBudgetLabel = (id: string) => {
    const budget = budgetRanges.find(b => b.id === id);
    return budget ? (isArabic ? budget.labelAr : budget.label) : id;
  };

  const getTimelineLabel = (id: string) => {
    const timeline = timelineOptions.find(t => t.id === id);
    return timeline ? (isArabic ? timeline.labelAr : timeline.label) : id;
  };

  const handleWhatsAppSubmit = () => {
    if (!formData.name || !formData.requirementType || !formData.title || !formData.description) {
      toast.error(isArabic ? "يرجى ملء جميع الحقول المطلوبة" : "Please fill all required fields");
      return;
    }

    const message = `🌿 *Custom Request - Green Grass Store*

👤 *Name:* ${formData.name}
📧 *Email:* ${formData.email}
📞 *Phone:* ${formData.phone || "Not provided"}

📋 *Request Type:* ${getRequirementLabel(formData.requirementType)}
📝 *Title:* ${formData.title}

📄 *Description:*
${formData.description}

💰 *Budget:* ${formData.budget ? getBudgetLabel(formData.budget) : "Not specified"}
⏰ *Timeline:* ${formData.timeline ? getTimelineLabel(formData.timeline) : "Not specified"}

---
Please process my custom request. Thank you!`;

    const encodedMessage = encodeURIComponent(message);
    window.open(`${WHATSAPP_URL}?text=${encodedMessage}`, '_blank', 'noopener,noreferrer');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error(isArabic ? "يرجى تسجيل الدخول أولاً" : "Please login first");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from("custom_requirements").insert({
        user_id: user.id,
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        requirement_type: formData.requirementType,
        title: formData.title,
        description: formData.description,
        budget: formData.budget,
        timeline: formData.timeline,
      });

      if (error) throw error;

      toast.success(
        isArabic
          ? "تم إرسال طلبك بنجاح! سيتواصل معك فريق المبيعات قريباً"
          : "Your request has been submitted! Our sales team will contact you soon"
      );
      onClose();
      setFormData({
        name: "",
        email: user?.email || "",
        phone: "",
        requirementType: "",
        title: "",
        description: "",
        budget: "",
        timeline: "",
      });
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
            onClick={onClose}
          />
          
          {/* Modal Container */}
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 50 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 50 }}
              transition={{ 
                type: "spring", 
                damping: 25, 
                stiffness: 300,
                duration: 0.4 
              }}
              className="w-full max-w-2xl max-h-[90vh] sm:max-h-[85vh] bg-card rounded-2xl shadow-2xl overflow-hidden flex flex-col pointer-events-auto"
            >
              {/* Header - Fixed */}
              <div className="bg-gradient-to-r from-primary to-primary/80 p-4 sm:p-6 text-primary-foreground flex-shrink-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/20 rounded-xl flex items-center justify-center">
                      <FileText className="w-5 h-5 sm:w-6 sm:h-6" />
                    </div>
                    <div>
                      <h2 className="text-lg sm:text-xl font-bold">
                        {isArabic ? "طلب مخصص" : "Custom Request"}
                      </h2>
                      <p className="text-xs sm:text-sm text-white/80">
                        {isArabic ? "أخبرنا باحتياجاتك الخاصة" : "Tell us your specific needs"}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={onClose}
                    className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Form - Scrollable */}
              <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
                <div className="p-4 sm:p-6 space-y-4 sm:space-y-5">
                  {/* Contact Info */}
                  <div className="grid sm:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <label className="flex items-center gap-2 text-xs sm:text-sm font-medium text-foreground mb-1.5 sm:mb-2">
                        <User className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground" />
                        {isArabic ? "الاسم" : "Full Name"} *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-muted border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                        placeholder={isArabic ? "أدخل اسمك" : "Enter your name"}
                      />
                    </div>
                    <div>
                      <label className="flex items-center gap-2 text-xs sm:text-sm font-medium text-foreground mb-1.5 sm:mb-2">
                        <Mail className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground" />
                        {isArabic ? "البريد الإلكتروني" : "Email"} *
                      </label>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-muted border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                        placeholder={isArabic ? "أدخل بريدك الإلكتروني" : "Enter your email"}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="flex items-center gap-2 text-xs sm:text-sm font-medium text-foreground mb-1.5 sm:mb-2">
                      <Phone className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground" />
                      {isArabic ? "رقم الهاتف" : "Phone Number"}
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-muted border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                      placeholder={isArabic ? "+971 XX XXX XXXX" : "+971 XX XXX XXXX"}
                    />
                  </div>

                  {/* Requirement Type */}
                  <div>
                    <label className="flex items-center gap-2 text-xs sm:text-sm font-medium text-foreground mb-1.5 sm:mb-2">
                      <MessageSquare className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground" />
                      {isArabic ? "نوع الطلب" : "Requirement Type"} *
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 sm:gap-2">
                      {requirementTypes.map((type) => (
                        <button
                          key={type.id}
                          type="button"
                          onClick={() => setFormData({ ...formData, requirementType: type.id })}
                          className={`px-2 sm:px-3 py-2 text-[10px] sm:text-xs font-medium rounded-lg border transition-all ${
                            formData.requirementType === type.id
                              ? "bg-primary text-primary-foreground border-primary"
                              : "bg-muted border-border text-muted-foreground hover:border-primary/50"
                          }`}
                        >
                          {isArabic ? type.labelAr : type.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Title */}
                  <div>
                    <label className="text-xs sm:text-sm font-medium text-foreground mb-1.5 sm:mb-2 block">
                      {isArabic ? "عنوان الطلب" : "Request Title"} *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-muted border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                      placeholder={isArabic ? "عنوان قصير لطلبك" : "Brief title for your request"}
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label className="text-xs sm:text-sm font-medium text-foreground mb-1.5 sm:mb-2 block">
                      {isArabic ? "وصف التفاصيل" : "Detailed Description"} *
                    </label>
                    <textarea
                      required
                      rows={3}
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-muted border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all resize-none"
                      placeholder={isArabic ? "صف متطلباتك بالتفصيل..." : "Describe your requirements in detail..."}
                    />
                  </div>

                  {/* Budget & Timeline */}
                  <div className="grid sm:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <label className="flex items-center gap-2 text-xs sm:text-sm font-medium text-foreground mb-1.5 sm:mb-2">
                        <DollarSign className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground" />
                        {isArabic ? "الميزانية" : "Budget Range"}
                      </label>
                      <select
                        value={formData.budget}
                        onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                        className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-muted border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                      >
                        <option value="">{isArabic ? "اختر الميزانية" : "Select budget"}</option>
                        {budgetRanges.map((range) => (
                          <option key={range.id} value={range.id}>
                            {isArabic ? range.labelAr : range.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="flex items-center gap-2 text-xs sm:text-sm font-medium text-foreground mb-1.5 sm:mb-2">
                        <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground" />
                        {isArabic ? "الجدول الزمني" : "Timeline"}
                      </label>
                      <select
                        value={formData.timeline}
                        onChange={(e) => setFormData({ ...formData, timeline: e.target.value })}
                        className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-muted border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                      >
                        <option value="">{isArabic ? "اختر الجدول الزمني" : "Select timeline"}</option>
                        {timelineOptions.map((option) => (
                          <option key={option.id} value={option.id}>
                            {isArabic ? option.labelAr : option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Footer - Fixed at bottom */}
                <div className="sticky bottom-0 bg-card border-t border-border p-4 sm:p-6 space-y-3">
                  {/* Action Buttons */}
                  <div className="grid grid-cols-2 gap-3">
                    {/* Submit to Database Button */}
                    <button
                      type="submit"
                      disabled={loading || !formData.requirementType}
                      className="py-3 sm:py-4 bg-primary text-primary-foreground rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm"
                    >
                      {loading ? (
                        <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                      ) : (
                        <>
                          <Send className="w-4 h-4 sm:w-5 sm:h-5" />
                          {isArabic ? "إرسال" : "Submit"}
                        </>
                      )}
                    </button>

                    {/* WhatsApp Button */}
                    <button
                      type="button"
                      onClick={handleWhatsAppSubmit}
                      disabled={!formData.name || !formData.requirementType || !formData.title || !formData.description}
                      className="py-3 sm:py-4 bg-[#25D366] text-white rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-[#20BD5A] transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 sm:w-5 sm:h-5">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                      </svg>
                      {isArabic ? "واتساب" : "WhatsApp"}
                    </button>
                  </div>

                  <p className="text-[10px] sm:text-xs text-muted-foreground text-center">
                    {isArabic
                      ? "سيتواصل معك فريق المبيعات خلال 24 ساعة"
                      : "Our sales team will contact you within 24 hours"}
                  </p>
                </div>
              </form>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};