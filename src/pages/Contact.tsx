import { useState, useEffect } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { motion } from "framer-motion";
import { MapPin, Phone, Mail, Clock, Send, MessageCircle, Instagram, Facebook, Sparkles, CheckCircle2, Loader2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";

interface ContactPageContent {
  heroTitle: string;
  heroTitleAr: string;
  heroSubtitle: string;
  heroSubtitleAr: string;
  address: string;
  addressAr: string;
  addressLine2: string;
  addressLine2Ar: string;
  phone: string;
  email: string;
  workingHours: string;
  workingHoursAr: string;
  fridayHours: string;
  fridayHoursAr: string;
  mapEmbedUrl: string;
  whatsappNumber: string;
  instagramUrl: string;
  instagramHandle: string;
  facebookUrl: string;
  facebookName: string;
  features: string[];
  featuresAr: string[];
}

const defaultContent: ContactPageContent = {
  heroTitle: "We'd Love to Hear From You",
  heroTitleAr: 'يسعدنا سماعك',
  heroSubtitle: 'Have questions about our plants, pots, or services? Our team is here to help you create your perfect green space.',
  heroSubtitleAr: 'هل لديك أسئلة حول نباتاتنا أو الأواني أو الخدمات؟ فريقنا هنا لمساعدتك في إنشاء مساحتك الخضراء المثالية.',
  address: 'Al Quoz Industrial Area 3',
  addressAr: 'منطقة القوز الصناعية 3',
  addressLine2: 'Dubai, UAE',
  addressLine2Ar: 'دبي، الإمارات',
  phone: '+971 54 775 1901',
  email: 'info@greengrassstore.com',
  workingHours: 'Sat-Thu: 9AM-9PM',
  workingHoursAr: 'السبت-الخميس: 9ص-9م',
  fridayHours: 'Fri: 2PM-9PM',
  fridayHoursAr: 'الجمعة: 2م-9م',
  mapEmbedUrl: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3609.7395738558244!2d55.26!3d25.20!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMjXCsDEyJzAwLjAiTiA1NcKwMTUnMzYuMCJF!5e0!3m2!1sen!2sae!4v1234567890',
  whatsappNumber: '+971547751901',
  instagramUrl: 'https://www.instagram.com/greengrass_decor',
  instagramHandle: '@greengrass_decor',
  facebookUrl: 'https://www.facebook.com/greengrassstore',
  facebookName: 'Green Grass Store',
  features: ['Free consultation for bulk orders', 'Same day delivery in Dubai', 'Expert plant care advice', 'Corporate gifting solutions'],
  featuresAr: ['استشارة مجانية للطلبات بالجملة', 'توصيل في نفس اليوم في دبي', 'نصائح خبراء العناية بالنباتات', 'حلول هدايا الشركات']
};

const Contact = () => {
  const { language } = useLanguage();
  const isArabic = language === 'ar';
  const [content, setContent] = useState<ContactPageContent>(defaultContent);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const { data, error } = await supabase
          .from('site_settings')
          .select('setting_value')
          .eq('setting_key', 'contact_content')
          .single();

        if (error) throw error;
        if (data?.setting_value) {
          setContent({ ...defaultContent, ...data.setting_value as unknown as ContactPageContent });
        }
      } catch (error) {
        console.error('Error fetching contact content:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchContent();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    await new Promise((resolve) => setTimeout(resolve, 1500));
    
    toast.success("Message sent successfully!", {
      description: "We'll get back to you within 24 hours.",
    });
    
    setFormData({ name: "", email: "", phone: "", subject: "", message: "" });
    setIsSubmitting(false);
  };

  const contactInfo = [
    {
      icon: MapPin,
      title: isArabic ? "الموقع" : "Location",
      details: isArabic 
        ? [`${content.addressAr}`, content.addressLine2Ar]
        : [`${content.address}`, content.addressLine2],
      color: "bg-emerald-500",
    },
    {
      icon: Phone,
      title: isArabic ? "الهاتف" : "Phone",
      details: [content.phone],
      color: "bg-blue-500",
      href: `tel:${content.phone.replace(/\s/g, '')}`,
    },
    {
      icon: Mail,
      title: isArabic ? "البريد" : "Email",
      details: [content.email],
      color: "bg-purple-500",
      href: `mailto:${content.email}`,
    },
    {
      icon: Clock,
      title: isArabic ? "الساعات" : "Hours",
      details: [
        isArabic ? content.workingHoursAr : content.workingHours, 
        isArabic ? content.fridayHoursAr : content.fridayHours
      ],
      color: "bg-orange-500",
    },
  ];

  const quickActions = [
    {
      icon: MessageCircle,
      title: "WhatsApp",
      subtitle: isArabic ? "تواصل الآن" : "Chat now",
      href: `https://wa.me/${content.whatsappNumber.replace(/[^0-9]/g, '')}`,
      color: "bg-[#25D366]",
    },
    {
      icon: Phone,
      title: isArabic ? "اتصل" : "Call",
      subtitle: content.phone,
      href: `tel:${content.phone.replace(/\s/g, '')}`,
      color: "bg-primary",
    },
    {
      icon: Instagram,
      title: "Instagram",
      subtitle: content.instagramHandle,
      href: content.instagramUrl,
      color: "bg-gradient-to-r from-purple-500 to-pink-500",
    },
    {
      icon: Facebook,
      title: "Facebook",
      subtitle: content.facebookName,
      href: content.facebookUrl,
      color: "bg-[#1877F2]",
    },
  ];

  const features = isArabic ? content.featuresAr : content.features;

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background" dir={isArabic ? 'rtl' : 'ltr'}>
      <Header />
      
      <main className="flex-1 pb-20 lg:pb-0">
        {/* Hero Section - Modern Gradient */}
        <section className="relative overflow-hidden bg-gradient-to-br from-primary via-primary/90 to-primary/80">
          {/* Background Elements */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
          </div>
          
          <div className="relative container mx-auto px-4 py-16 md:py-24">
            <div className="max-w-4xl mx-auto text-center">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4"
              >
                <span className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full text-white/90 text-sm font-medium">
                  <Sparkles className="w-4 h-4" />
                  {isArabic ? "تواصل معنا" : "Get in Touch"}
                </span>
              </motion.div>
              
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-serif font-bold text-white mb-6"
              >
                {isArabic ? content.heroTitleAr : content.heroTitle}
              </motion.h1>
              
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-lg text-white/80 max-w-2xl mx-auto mb-10"
              >
                {isArabic ? content.heroSubtitleAr : content.heroSubtitle}
              </motion.p>

              {/* Features Grid - Responsive */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3"
              >
                {features.map((feature, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 px-4 py-3 bg-white/10 backdrop-blur-sm rounded-xl text-white/90"
                  >
                    <CheckCircle2 className="w-4 h-4 text-green-300 flex-shrink-0" />
                    <span className="text-sm">{feature}</span>
                  </div>
                ))}
              </motion.div>
            </div>
          </div>
        </section>

        {/* Quick Connect - Responsive Grid */}
        <section className="py-8 bg-muted/50 border-b border-border">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4">
              {quickActions.map((action, idx) => (
                <motion.a
                  key={action.title}
                  href={action.href}
                  target={action.href.startsWith("http") ? "_blank" : undefined}
                  rel={action.href.startsWith("http") ? "noopener noreferrer" : undefined}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  viewport={{ once: true }}
                  className={`flex items-center gap-3 p-4 ${action.color} text-white rounded-2xl transition-all shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]`}
                >
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                    <action.icon className="w-5 h-5" />
                  </div>
                  <div className={`min-w-0 flex-1 ${isArabic ? "text-right" : "text-left"}`}>
                    <p className="font-bold text-sm">{action.title}</p>
                    <p className="text-xs text-white/80 truncate">{action.subtitle}</p>
                  </div>
                </motion.a>
              ))}
            </div>
          </div>
        </section>

        {/* Contact Info Cards - Responsive Grid */}
        <section className="py-8 md:py-12 bg-background">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
              {contactInfo.map((info, idx) => (
                <motion.div
                  key={info.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  viewport={{ once: true }}
                  className="group"
                >
                  {info.href ? (
                    <a
                      href={info.href}
                      className="flex flex-col items-center text-center p-4 md:p-6 bg-card rounded-2xl border border-border hover:border-primary/30 hover:shadow-lg transition-all h-full"
                    >
                      <div className={`w-12 h-12 md:w-14 md:h-14 ${info.color} rounded-xl md:rounded-2xl flex items-center justify-center mb-3 md:mb-4 group-hover:scale-110 transition-transform`}>
                        <info.icon className="w-5 h-5 md:w-6 md:h-6 text-white" />
                      </div>
                      <h3 className="font-bold text-foreground text-sm md:text-base mb-1 md:mb-2">{info.title}</h3>
                      <div className="space-y-0.5">
                        {info.details.map((detail, i) => (
                          <p key={i} className="text-muted-foreground text-xs md:text-sm leading-tight break-words">{detail}</p>
                        ))}
                      </div>
                    </a>
                  ) : (
                    <div className="flex flex-col items-center text-center p-4 md:p-6 bg-card rounded-2xl border border-border h-full">
                      <div className={`w-12 h-12 md:w-14 md:h-14 ${info.color} rounded-xl md:rounded-2xl flex items-center justify-center mb-3 md:mb-4`}>
                        <info.icon className="w-5 h-5 md:w-6 md:h-6 text-white" />
                      </div>
                      <h3 className="font-bold text-foreground text-sm md:text-base mb-1 md:mb-2">{info.title}</h3>
                      <div className="space-y-0.5">
                        {info.details.map((detail, i) => (
                          <p key={i} className="text-muted-foreground text-xs md:text-sm leading-tight">{detail}</p>
                        ))}
                      </div>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Form & Map Section */}
        <section className="py-12 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="grid lg:grid-cols-2 gap-8">
              {/* Contact Form */}
              <motion.div
                initial={{ opacity: 0, x: isArabic ? 30 : -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
              >
                <div className="bg-card rounded-3xl shadow-xl p-6 md:p-8 border border-border h-full">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                      <Send className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-foreground">
                        {isArabic ? "أرسل رسالة" : "Send Message"}
                      </h2>
                      <p className="text-muted-foreground text-sm">
                        {isArabic ? "سنرد عليك خلال 24 ساعة" : "We'll respond within 24 hours"}
                      </p>
                    </div>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-foreground">
                          {isArabic ? "الاسم" : "Name"} <span className="text-destructive">*</span>
                        </label>
                        <Input
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          placeholder={isArabic ? "محمد أحمد" : "John Doe"}
                          required
                          className="h-12 rounded-xl"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-foreground">
                          {isArabic ? "البريد" : "Email"} <span className="text-destructive">*</span>
                        </label>
                        <Input
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          placeholder="john@example.com"
                          required
                          className="h-12 rounded-xl"
                        />
                      </div>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-foreground">
                          {isArabic ? "الهاتف" : "Phone"}
                        </label>
                        <Input
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          placeholder="+971 50 123 4567"
                          className="h-12 rounded-xl"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-foreground">
                          {isArabic ? "الموضوع" : "Subject"} <span className="text-destructive">*</span>
                        </label>
                        <Input
                          value={formData.subject}
                          onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                          placeholder={isArabic ? "كيف يمكننا مساعدتك؟" : "How can we help?"}
                          required
                          className="h-12 rounded-xl"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-foreground">
                        {isArabic ? "الرسالة" : "Message"} <span className="text-destructive">*</span>
                      </label>
                      <Textarea
                        value={formData.message}
                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                        placeholder={isArabic ? "اكتب رسالتك هنا..." : "Write your message here..."}
                        required
                        rows={5}
                        className="rounded-xl resize-none"
                      />
                    </div>

                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full h-14 rounded-xl text-base font-semibold"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin mr-2" />
                          {isArabic ? "جاري الإرسال..." : "Sending..."}
                        </>
                      ) : (
                        <>
                          <Send className="w-5 h-5 mr-2" />
                          {isArabic ? "إرسال الرسالة" : "Send Message"}
                        </>
                      )}
                    </Button>
                  </form>
                </div>
              </motion.div>

              {/* Map */}
              <motion.div
                initial={{ opacity: 0, x: isArabic ? -30 : 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
              >
                <div className="bg-card rounded-3xl shadow-xl overflow-hidden border border-border h-full min-h-[400px] lg:min-h-full">
                  <div className="p-3 md:p-4 border-b border-border flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 md:gap-3 min-w-0 flex-1">
                      <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <MapPin className="w-4 h-4 md:w-5 md:h-5 text-primary" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-bold text-foreground text-sm md:text-base">
                          {isArabic ? "موقعنا" : "Our Location"}
                        </h3>
                        <p className="text-muted-foreground text-xs md:text-sm truncate">
                          {isArabic ? content.addressAr : content.address}
                        </p>
                      </div>
                    </div>
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(content.address + ', ' + content.addressLine2)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 md:gap-2 px-3 md:px-4 py-2 bg-primary text-primary-foreground rounded-lg md:rounded-xl text-xs md:text-sm font-medium hover:bg-primary/90 transition-colors flex-shrink-0"
                    >
                      <ExternalLink className="w-3.5 h-3.5 md:w-4 md:h-4" />
                      {isArabic ? "فتح" : "Open"}
                    </a>
                  </div>
                  <iframe
                    src={content.mapEmbedUrl}
                    width="100%"
                    height="100%"
                    style={{ border: 0, minHeight: '350px' }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    title="Store Location"
                  />
                </div>
              </motion.div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Contact;
