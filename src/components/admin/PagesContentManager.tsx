import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { 
  Loader2, Save, Plus, Trash2, HelpCircle, RotateCcw, 
  Shield, Scale, Building2, Phone, FolderOpen, ChevronDown,
  MapPin, Mail, Clock, Link, Instagram, Facebook, MessageCircle, ShoppingBag
} from "lucide-react";
import { ProductDetailSettingsManager } from "./ProductDetailSettingsManager";

interface FAQItem {
  id: string;
  question: string;
  questionAr: string;
  answer: string;
  answerAr: string;
  category: string;
  order: number;
}

interface FAQCategory {
  id: string;
  name: string;
  nameAr: string;
  icon: string;
  order: number;
}

interface PolicySection {
  id: string;
  title: string;
  titleAr: string;
  content: string;
  contentAr: string;
  icon: string;
  bullets?: string[];
  bulletsAr?: string[];
  order: number;
}

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

interface AboutPageContent {
  heroTitle: string;
  heroTitleAr: string;
  heroSubtitle: string;
  heroSubtitleAr: string;
  storyTitle: string;
  storyTitleAr: string;
  storyContent: string;
  storyContentAr: string;
  yearsInBusiness: string;
  values: Array<{
    id: string;
    title: string;
    titleAr: string;
    description: string;
    descriptionAr: string;
    icon: string;
  }>;
  stats: Array<{
    id: string;
    value: string;
    label: string;
    labelAr: string;
  }>;
}

const iconOptions = [
  { value: 'truck', label: 'Truck (Shipping)' },
  { value: 'refresh', label: 'Refresh (Returns)' },
  { value: 'credit-card', label: 'Credit Card (Payment)' },
  { value: 'package', label: 'Package' },
  { value: 'check-circle', label: 'Check Circle' },
  { value: 'file-text', label: 'File Text' },
  { value: 'shield', label: 'Shield' },
  { value: 'lock', label: 'Lock' },
  { value: 'user', label: 'User' },
  { value: 'info', label: 'Info' },
  { value: 'alert-triangle', label: 'Alert' },
  { value: 'help-circle', label: 'Help' },
];

export const PagesContentManager = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("faq");

  // FAQ State
  const [faqCategories, setFaqCategories] = useState<FAQCategory[]>([
    { id: '1', name: 'Shipping & Delivery', nameAr: 'الشحن والتوصيل', icon: 'truck', order: 1 },
    { id: '2', name: 'Returns & Exchange', nameAr: 'الإرجاع والاستبدال', icon: 'refresh', order: 2 },
    { id: '3', name: 'Payment', nameAr: 'الدفع', icon: 'credit-card', order: 3 },
    { id: '4', name: 'Products', nameAr: 'المنتجات', icon: 'package', order: 4 },
  ]);

  const [faqItems, setFaqItems] = useState<FAQItem[]>([
    { 
      id: '1', 
      question: 'What areas do you deliver to?', 
      questionAr: 'ما هي مناطق التوصيل؟',
      answer: 'We deliver across all UAE including Dubai, Abu Dhabi, Sharjah, Ajman, Ras Al Khaimah, Fujairah, and Um Al Quwain.',
      answerAr: 'نقوم بالتوصيل إلى جميع أنحاء الإمارات بما في ذلك دبي وأبوظبي والشارقة وعجمان ورأس الخيمة والفجيرة وأم القيوين.',
      category: '1',
      order: 1 
    },
  ]);

  // Return Policy State
  const [returnPolicySections, setReturnPolicySections] = useState<PolicySection[]>([
    {
      id: '1',
      title: 'Eligible for Return',
      titleAr: 'المؤهل للإرجاع',
      content: 'Items in original, unused condition with all tags attached. Products must be returned within 14 days of delivery.',
      contentAr: 'العناصر في حالتها الأصلية وغير المستخدمة مع جميع العلامات المرفقة. يجب إرجاع المنتجات خلال 14 يومًا من التسليم.',
      icon: 'check-circle',
      bullets: ['Original packaging required', 'Must include receipt', 'No damage or wear'],
      bulletsAr: ['العبوة الأصلية مطلوبة', 'يجب تضمين الإيصال', 'لا ضرر أو تآكل'],
      order: 1
    },
    {
      id: '2',
      title: 'Non-Returnable Items',
      titleAr: 'العناصر غير القابلة للإرجاع',
      content: 'Certain items cannot be returned for hygiene and safety reasons.',
      contentAr: 'لا يمكن إرجاع بعض العناصر لأسباب تتعلق بالنظافة والسلامة.',
      icon: 'alert-triangle',
      bullets: ['Live plants after 48 hours', 'Customized items', 'Sale items marked as final'],
      bulletsAr: ['النباتات الحية بعد 48 ساعة', 'العناصر المخصصة', 'عناصر التخفيضات المحددة كنهائية'],
      order: 2
    },
  ]);

  // Privacy Policy State
  const [privacySections, setPrivacySections] = useState<PolicySection[]>([
    {
      id: '1',
      title: 'Information We Collect',
      titleAr: 'المعلومات التي نجمعها',
      content: 'We collect information you provide directly to us, such as when you create an account, make a purchase, or contact us for support.',
      contentAr: 'نجمع المعلومات التي تقدمها لنا مباشرة، مثل عند إنشاء حساب أو إجراء عملية شراء أو الاتصال بنا للحصول على الدعم.',
      icon: 'file-text',
      bullets: ['Personal identification', 'Contact information', 'Payment details', 'Order history'],
      bulletsAr: ['التعريف الشخصي', 'معلومات الاتصال', 'تفاصيل الدفع', 'سجل الطلبات'],
      order: 1
    },
    {
      id: '2',
      title: 'How We Use Your Information',
      titleAr: 'كيف نستخدم معلوماتك',
      content: 'We use the information we collect to provide, maintain, and improve our services.',
      contentAr: 'نستخدم المعلومات التي نجمعها لتقديم وصيانة وتحسين خدماتنا.',
      icon: 'user',
      bullets: ['Process transactions', 'Send order updates', 'Improve customer experience', 'Marketing communications'],
      bulletsAr: ['معالجة المعاملات', 'إرسال تحديثات الطلب', 'تحسين تجربة العملاء', 'اتصالات التسويق'],
      order: 2
    },
    {
      id: '3',
      title: 'Data Protection',
      titleAr: 'حماية البيانات',
      content: 'We implement appropriate security measures to protect your personal information.',
      contentAr: 'نقوم بتنفيذ تدابير أمنية مناسبة لحماية معلوماتك الشخصية.',
      icon: 'shield',
      bullets: ['SSL encryption', 'Secure payment processing', 'Regular security audits'],
      bulletsAr: ['تشفير SSL', 'معالجة دفع آمنة', 'تدقيقات أمنية منتظمة'],
      order: 3
    },
  ]);

  // Terms of Service State
  const [termsSections, setTermsSections] = useState<PolicySection[]>([
    {
      id: '1',
      title: 'Acceptance of Terms',
      titleAr: 'قبول الشروط',
      content: 'By accessing and using Green Grass Store website and services, you agree to be bound by these Terms of Service.',
      contentAr: 'من خلال الوصول واستخدام موقع وخدمات جرين جراس، فإنك توافق على الالتزام بشروط الخدمة هذه.',
      icon: 'file-text',
      order: 1
    },
    {
      id: '2',
      title: 'Products & Services',
      titleAr: 'المنتجات والخدمات',
      content: 'All products are subject to availability. We reserve the right to modify or discontinue products without notice.',
      contentAr: 'جميع المنتجات تخضع للتوفر. نحتفظ بالحق في تعديل أو إيقاف المنتجات دون إشعار.',
      icon: 'package',
      order: 2
    },
    {
      id: '3',
      title: 'Limitation of Liability',
      titleAr: 'تحديد المسؤولية',
      content: 'Green Grass Store shall not be liable for any indirect, incidental, special, or consequential damages.',
      contentAr: 'لن يكون متجر جرين جراس مسؤولاً عن أي أضرار غير مباشرة أو عرضية أو خاصة أو تبعية.',
      icon: 'shield',
      order: 3
    },
  ]);

  // About Page State
  const [aboutContent, setAboutContent] = useState<AboutPageContent>({
    heroTitle: 'About Green Grass',
    heroTitleAr: 'عن جرين جراس',
    heroSubtitle: 'Bringing nature into every home across the UAE since 2018',
    heroSubtitleAr: 'نجلب الطبيعة إلى كل منزل في الإمارات منذ 2018',
    storyTitle: 'A Passion for Plants & Beautiful Spaces',
    storyTitleAr: 'شغف بالنباتات والمساحات الجميلة',
    storyContent: 'Founded in Dubai in 2018, Green Grass Store began with a simple mission: to make beautiful, high-quality plants and home decor accessible to everyone in the UAE.',
    storyContentAr: 'تأسست في دبي عام 2018، بدأ متجر جرين جراس بمهمة بسيطة: جعل النباتات الجميلة وديكور المنزل عالي الجودة في متناول الجميع في الإمارات.',
    yearsInBusiness: '6+',
    values: [
      { id: '1', title: 'Sustainability', titleAr: 'الاستدامة', description: 'Eco-friendly practices in everything we do', descriptionAr: 'ممارسات صديقة للبيئة في كل ما نقوم به', icon: 'leaf' },
      { id: '2', title: 'Quality', titleAr: 'الجودة', description: 'Only the finest products for our customers', descriptionAr: 'أجود المنتجات فقط لعملائنا', icon: 'heart' },
    ],
    stats: [
      { id: '1', value: '10K+', label: 'Happy Customers', labelAr: 'عملاء سعداء' },
      { id: '2', value: '500+', label: 'Products', labelAr: 'منتج' },
      { id: '3', value: '50+', label: 'Team Members', labelAr: 'أعضاء الفريق' },
    ]
  });

  // Contact Page State
  const [contactContent, setContactContent] = useState<ContactPageContent>({
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
  });

  const fetchContent = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('site_settings')
        .select('*');

      if (error) throw error;

      data?.forEach((setting) => {
        const value = setting.setting_value as Record<string, unknown>;
        switch (setting.setting_key) {
          case 'faq_categories':
            if (Array.isArray(value)) setFaqCategories(value as unknown as FAQCategory[]);
            break;
          case 'faq_items':
            if (Array.isArray(value)) setFaqItems(value as unknown as FAQItem[]);
            break;
          case 'return_policy_sections':
            if (Array.isArray(value)) setReturnPolicySections(value as unknown as PolicySection[]);
            break;
          case 'privacy_sections':
            if (Array.isArray(value)) setPrivacySections(value as unknown as PolicySection[]);
            break;
          case 'terms_sections':
            if (Array.isArray(value)) setTermsSections(value as unknown as PolicySection[]);
            break;
          case 'about_content':
            if (value && typeof value === 'object') setAboutContent(value as unknown as AboutPageContent);
            break;
          case 'contact_content':
            if (value && typeof value === 'object') setContactContent(value as unknown as ContactPageContent);
            break;
        }
      });
    } catch (error) {
      console.error('Error fetching content:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContent();
  }, []);

  const saveContent = async (key: string, value: object) => {
    setSaving(true);
    try {
      const { data: existing } = await supabase
        .from('site_settings')
        .select('id')
        .eq('setting_key', key)
        .single();

      if (existing) {
        const { error } = await supabase
          .from('site_settings')
          .update({ setting_value: JSON.parse(JSON.stringify(value)) })
          .eq('setting_key', key);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('site_settings')
          .insert({ setting_key: key, setting_value: JSON.parse(JSON.stringify(value)) });
        if (error) throw error;
      }
      
      toast.success('Content saved successfully');
    } catch (error) {
      console.error('Error saving content:', error);
      toast.error('Failed to save content');
    } finally {
      setSaving(false);
    }
  };

  // FAQ Category Helpers
  const addFaqCategory = () => {
    const newCategory: FAQCategory = {
      id: Date.now().toString(),
      name: 'New Category',
      nameAr: 'فئة جديدة',
      icon: 'help-circle',
      order: faqCategories.length + 1
    };
    setFaqCategories([...faqCategories, newCategory]);
  };

  const removeFaqCategory = (id: string) => {
    setFaqCategories(faqCategories.filter(cat => cat.id !== id));
    // Also remove FAQ items in this category
    setFaqItems(faqItems.filter(item => item.category !== id));
  };

  const updateFaqCategory = (id: string, field: keyof FAQCategory, value: string | number) => {
    setFaqCategories(faqCategories.map(cat => 
      cat.id === id ? { ...cat, [field]: value } : cat
    ));
  };

  // FAQ Item Helpers
  const addFaqItem = (categoryId: string) => {
    const newItem: FAQItem = {
      id: Date.now().toString(),
      question: 'New Question',
      questionAr: 'سؤال جديد',
      answer: 'Answer here...',
      answerAr: 'الإجابة هنا...',
      category: categoryId,
      order: faqItems.filter(i => i.category === categoryId).length + 1
    };
    setFaqItems([...faqItems, newItem]);
  };

  const removeFaqItem = (id: string) => {
    setFaqItems(faqItems.filter(item => item.id !== id));
  };

  const updateFaqItem = (id: string, field: keyof FAQItem, value: string | number) => {
    setFaqItems(faqItems.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  // Policy Section Helpers
  const addPolicySection = (setter: React.Dispatch<React.SetStateAction<PolicySection[]>>, current: PolicySection[]) => {
    const newSection: PolicySection = {
      id: Date.now().toString(),
      title: 'New Section',
      titleAr: 'قسم جديد',
      content: 'Content here...',
      contentAr: 'المحتوى هنا...',
      icon: 'file-text',
      bullets: [],
      bulletsAr: [],
      order: current.length + 1
    };
    setter([...current, newSection]);
  };

  const removePolicySection = (setter: React.Dispatch<React.SetStateAction<PolicySection[]>>, current: PolicySection[], id: string) => {
    setter(current.filter(item => item.id !== id));
  };

  const updatePolicySection = (
    setter: React.Dispatch<React.SetStateAction<PolicySection[]>>, 
    current: PolicySection[], 
    id: string, 
    field: keyof PolicySection, 
    value: string | number | string[]
  ) => {
    setter(current.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  // Contact Features Helpers
  const addContactFeature = () => {
    setContactContent(prev => ({
      ...prev,
      features: [...prev.features, 'New feature'],
      featuresAr: [...prev.featuresAr, 'ميزة جديدة']
    }));
  };

  const removeContactFeature = (index: number) => {
    setContactContent(prev => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index),
      featuresAr: prev.featuresAr.filter((_, i) => i !== index)
    }));
  };

  const updateContactFeature = (index: number, value: string, isArabic: boolean) => {
    setContactContent(prev => {
      const key = isArabic ? 'featuresAr' : 'features';
      const newFeatures = [...prev[key]];
      newFeatures[index] = value;
      return { ...prev, [key]: newFeatures };
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="flex flex-wrap gap-1 h-auto p-1 bg-muted/50">
          <TabsTrigger value="faq" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <HelpCircle className="w-4 h-4" />
            <span className="hidden sm:inline">FAQ</span>
          </TabsTrigger>
          <TabsTrigger value="return" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <RotateCcw className="w-4 h-4" />
            <span className="hidden sm:inline">Return Policy</span>
          </TabsTrigger>
          <TabsTrigger value="privacy" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Shield className="w-4 h-4" />
            <span className="hidden sm:inline">Privacy</span>
          </TabsTrigger>
          <TabsTrigger value="terms" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Scale className="w-4 h-4" />
            <span className="hidden sm:inline">Terms</span>
          </TabsTrigger>
          <TabsTrigger value="about" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Building2 className="w-4 h-4" />
            <span className="hidden sm:inline">About</span>
          </TabsTrigger>
          <TabsTrigger value="contact" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Phone className="w-4 h-4" />
            <span className="hidden sm:inline">Contact</span>
          </TabsTrigger>
          <TabsTrigger value="product-detail" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <ShoppingBag className="w-4 h-4" />
            <span className="hidden sm:inline">Product Detail</span>
          </TabsTrigger>
        </TabsList>

        {/* FAQ Tab */}
        <TabsContent value="faq">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-primary" />
                FAQ Management
              </CardTitle>
              <CardDescription>
                Manage FAQ categories and questions. Each category contains related questions.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* FAQ Categories */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-lg">Categories</h4>
                  <Button variant="outline" size="sm" onClick={addFaqCategory}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Category
                  </Button>
                </div>

                <Accordion type="multiple" className="space-y-4">
                  {faqCategories.map((category) => (
                    <AccordionItem key={category.id} value={category.id} className="border rounded-lg px-4">
                      <AccordionTrigger className="hover:no-underline py-4">
                        <div className="flex items-center gap-3 flex-1">
                          <FolderOpen className="w-5 h-5 text-primary" />
                          <span className="font-medium">{category.name}</span>
                          <span className="text-muted-foreground text-sm">
                            ({faqItems.filter(i => i.category === category.id).length} questions)
                          </span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="pb-4 space-y-4">
                        {/* Category Settings */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted/30 rounded-lg">
                          <div className="space-y-2">
                            <Label>Category Name (EN)</Label>
                            <Input
                              value={category.name}
                              onChange={(e) => updateFaqCategory(category.id, 'name', e.target.value)}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Category Name (AR)</Label>
                            <Input
                              value={category.nameAr}
                              onChange={(e) => updateFaqCategory(category.id, 'nameAr', e.target.value)}
                              dir="rtl"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Icon</Label>
                            <Select 
                              value={category.icon} 
                              onValueChange={(v) => updateFaqCategory(category.id, 'icon', v)}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {iconOptions.map(opt => (
                                  <SelectItem key={opt.value} value={opt.value}>
                                    {opt.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        {/* FAQ Items in this Category */}
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <h5 className="font-medium">Questions in this category</h5>
                            <Button variant="ghost" size="sm" onClick={() => addFaqItem(category.id)}>
                              <Plus className="w-4 h-4 mr-1" />
                              Add Question
                            </Button>
                          </div>

                          {faqItems.filter(item => item.category === category.id).map((item, idx) => (
                            <div key={item.id} className="border rounded-lg p-4 space-y-3 bg-background">
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-muted-foreground">Q{idx + 1}</span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeFaqItem(item.id)}
                                  className="text-destructive hover:text-destructive"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <Label>Question (EN)</Label>
                                  <Input
                                    value={item.question}
                                    onChange={(e) => updateFaqItem(item.id, 'question', e.target.value)}
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label>Question (AR)</Label>
                                  <Input
                                    value={item.questionAr}
                                    onChange={(e) => updateFaqItem(item.id, 'questionAr', e.target.value)}
                                    dir="rtl"
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label>Answer (EN)</Label>
                                  <Textarea
                                    value={item.answer}
                                    onChange={(e) => updateFaqItem(item.id, 'answer', e.target.value)}
                                    rows={3}
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label>Answer (AR)</Label>
                                  <Textarea
                                    value={item.answerAr}
                                    onChange={(e) => updateFaqItem(item.id, 'answerAr', e.target.value)}
                                    rows={3}
                                    dir="rtl"
                                  />
                                </div>
                              </div>
                            </div>
                          ))}

                          {faqItems.filter(item => item.category === category.id).length === 0 && (
                            <p className="text-muted-foreground text-center py-4">
                              No questions in this category yet
                            </p>
                          )}
                        </div>

                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => removeFaqCategory(category.id)}
                          className="w-full"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete Category
                        </Button>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>

              <Button 
                onClick={() => {
                  saveContent('faq_items', faqItems);
                  saveContent('faq_categories', faqCategories);
                }}
                disabled={saving}
                className="w-full"
              >
                {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                Save All FAQ Changes
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Return Policy Tab */}
        <TabsContent value="return">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <RotateCcw className="w-5 h-5 text-primary" />
                Return Policy Page
              </CardTitle>
              <CardDescription>
                Manage return policy sections with bullet points
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {returnPolicySections.map((section, index) => (
                <div key={section.id} className="border rounded-lg p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Section #{index + 1}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removePolicySection(setReturnPolicySections, returnPolicySections, section.id)}
                      className="text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Title (EN)</Label>
                      <Input
                        value={section.title}
                        onChange={(e) => updatePolicySection(setReturnPolicySections, returnPolicySections, section.id, 'title', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Title (AR)</Label>
                      <Input
                        value={section.titleAr}
                        onChange={(e) => updatePolicySection(setReturnPolicySections, returnPolicySections, section.id, 'titleAr', e.target.value)}
                        dir="rtl"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Content (EN)</Label>
                      <Textarea
                        value={section.content}
                        onChange={(e) => updatePolicySection(setReturnPolicySections, returnPolicySections, section.id, 'content', e.target.value)}
                        rows={3}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Content (AR)</Label>
                      <Textarea
                        value={section.contentAr}
                        onChange={(e) => updatePolicySection(setReturnPolicySections, returnPolicySections, section.id, 'contentAr', e.target.value)}
                        rows={3}
                        dir="rtl"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Bullet Points (EN) - One per line</Label>
                      <Textarea
                        value={section.bullets?.join('\n') || ''}
                        onChange={(e) => updatePolicySection(setReturnPolicySections, returnPolicySections, section.id, 'bullets', e.target.value.split('\n').filter(b => b.trim()))}
                        rows={3}
                        placeholder="Point 1&#10;Point 2&#10;Point 3"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Bullet Points (AR) - One per line</Label>
                      <Textarea
                        value={section.bulletsAr?.join('\n') || ''}
                        onChange={(e) => updatePolicySection(setReturnPolicySections, returnPolicySections, section.id, 'bulletsAr', e.target.value.split('\n').filter(b => b.trim()))}
                        rows={3}
                        dir="rtl"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Icon</Label>
                      <Select 
                        value={section.icon} 
                        onValueChange={(v) => updatePolicySection(setReturnPolicySections, returnPolicySections, section.id, 'icon', v)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {iconOptions.map(opt => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              ))}
              <Button variant="outline" onClick={() => addPolicySection(setReturnPolicySections, returnPolicySections)} className="w-full">
                <Plus className="w-4 h-4 mr-2" />
                Add Section
              </Button>

              <Button 
                onClick={() => saveContent('return_policy_sections', returnPolicySections)}
                disabled={saving}
                className="w-full"
              >
                {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                Save Return Policy
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Privacy Policy Tab */}
        <TabsContent value="privacy">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                Privacy Policy Page
              </CardTitle>
              <CardDescription>
                Manage privacy policy sections with bullet points
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {privacySections.map((section, index) => (
                <div key={section.id} className="border rounded-lg p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Section #{index + 1}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removePolicySection(setPrivacySections, privacySections, section.id)}
                      className="text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Title (EN)</Label>
                      <Input
                        value={section.title}
                        onChange={(e) => updatePolicySection(setPrivacySections, privacySections, section.id, 'title', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Title (AR)</Label>
                      <Input
                        value={section.titleAr}
                        onChange={(e) => updatePolicySection(setPrivacySections, privacySections, section.id, 'titleAr', e.target.value)}
                        dir="rtl"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Content (EN)</Label>
                      <Textarea
                        value={section.content}
                        onChange={(e) => updatePolicySection(setPrivacySections, privacySections, section.id, 'content', e.target.value)}
                        rows={3}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Content (AR)</Label>
                      <Textarea
                        value={section.contentAr}
                        onChange={(e) => updatePolicySection(setPrivacySections, privacySections, section.id, 'contentAr', e.target.value)}
                        rows={3}
                        dir="rtl"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Bullet Points (EN) - One per line</Label>
                      <Textarea
                        value={section.bullets?.join('\n') || ''}
                        onChange={(e) => updatePolicySection(setPrivacySections, privacySections, section.id, 'bullets', e.target.value.split('\n').filter(b => b.trim()))}
                        rows={3}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Bullet Points (AR) - One per line</Label>
                      <Textarea
                        value={section.bulletsAr?.join('\n') || ''}
                        onChange={(e) => updatePolicySection(setPrivacySections, privacySections, section.id, 'bulletsAr', e.target.value.split('\n').filter(b => b.trim()))}
                        rows={3}
                        dir="rtl"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Icon</Label>
                      <Select 
                        value={section.icon} 
                        onValueChange={(v) => updatePolicySection(setPrivacySections, privacySections, section.id, 'icon', v)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {iconOptions.map(opt => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              ))}
              <Button variant="outline" onClick={() => addPolicySection(setPrivacySections, privacySections)} className="w-full">
                <Plus className="w-4 h-4 mr-2" />
                Add Section
              </Button>

              <Button 
                onClick={() => saveContent('privacy_sections', privacySections)}
                disabled={saving}
                className="w-full"
              >
                {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                Save Privacy Policy
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Terms of Service Tab */}
        <TabsContent value="terms">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Scale className="w-5 h-5 text-primary" />
                Terms of Service Page
              </CardTitle>
              <CardDescription>
                Manage terms of service sections
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {termsSections.map((section, index) => (
                <div key={section.id} className="border rounded-lg p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Section #{index + 1}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removePolicySection(setTermsSections, termsSections, section.id)}
                      className="text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Title (EN)</Label>
                      <Input
                        value={section.title}
                        onChange={(e) => updatePolicySection(setTermsSections, termsSections, section.id, 'title', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Title (AR)</Label>
                      <Input
                        value={section.titleAr}
                        onChange={(e) => updatePolicySection(setTermsSections, termsSections, section.id, 'titleAr', e.target.value)}
                        dir="rtl"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Content (EN)</Label>
                      <Textarea
                        value={section.content}
                        onChange={(e) => updatePolicySection(setTermsSections, termsSections, section.id, 'content', e.target.value)}
                        rows={4}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Content (AR)</Label>
                      <Textarea
                        value={section.contentAr}
                        onChange={(e) => updatePolicySection(setTermsSections, termsSections, section.id, 'contentAr', e.target.value)}
                        rows={4}
                        dir="rtl"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Icon</Label>
                      <Select 
                        value={section.icon} 
                        onValueChange={(v) => updatePolicySection(setTermsSections, termsSections, section.id, 'icon', v)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {iconOptions.map(opt => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              ))}
              <Button variant="outline" onClick={() => addPolicySection(setTermsSections, termsSections)} className="w-full">
                <Plus className="w-4 h-4 mr-2" />
                Add Section
              </Button>

              <Button 
                onClick={() => saveContent('terms_sections', termsSections)}
                disabled={saving}
                className="w-full"
              >
                {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                Save Terms of Service
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* About Tab */}
        <TabsContent value="about">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-primary" />
                About Page
              </CardTitle>
              <CardDescription>
                Manage about page content and company information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Hero Section */}
              <div className="space-y-4">
                <h4 className="font-semibold">Hero Section</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Hero Title (EN)</Label>
                    <Input
                      value={aboutContent.heroTitle}
                      onChange={(e) => setAboutContent(prev => ({ ...prev, heroTitle: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Hero Title (AR)</Label>
                    <Input
                      value={aboutContent.heroTitleAr}
                      onChange={(e) => setAboutContent(prev => ({ ...prev, heroTitleAr: e.target.value }))}
                      dir="rtl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Hero Subtitle (EN)</Label>
                    <Textarea
                      value={aboutContent.heroSubtitle}
                      onChange={(e) => setAboutContent(prev => ({ ...prev, heroSubtitle: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Hero Subtitle (AR)</Label>
                    <Textarea
                      value={aboutContent.heroSubtitleAr}
                      onChange={(e) => setAboutContent(prev => ({ ...prev, heroSubtitleAr: e.target.value }))}
                      dir="rtl"
                    />
                  </div>
                </div>
              </div>

              {/* Our Story */}
              <div className="space-y-4">
                <h4 className="font-semibold">Our Story</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Story Title (EN)</Label>
                    <Input
                      value={aboutContent.storyTitle}
                      onChange={(e) => setAboutContent(prev => ({ ...prev, storyTitle: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Story Title (AR)</Label>
                    <Input
                      value={aboutContent.storyTitleAr}
                      onChange={(e) => setAboutContent(prev => ({ ...prev, storyTitleAr: e.target.value }))}
                      dir="rtl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Story Content (EN)</Label>
                    <Textarea
                      value={aboutContent.storyContent}
                      onChange={(e) => setAboutContent(prev => ({ ...prev, storyContent: e.target.value }))}
                      rows={6}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Story Content (AR)</Label>
                    <Textarea
                      value={aboutContent.storyContentAr}
                      onChange={(e) => setAboutContent(prev => ({ ...prev, storyContentAr: e.target.value }))}
                      rows={6}
                      dir="rtl"
                    />
                  </div>
                </div>
                <div className="space-y-2 max-w-xs">
                  <Label>Years in Business</Label>
                  <Input
                    value={aboutContent.yearsInBusiness}
                    onChange={(e) => setAboutContent(prev => ({ ...prev, yearsInBusiness: e.target.value }))}
                    placeholder="6+"
                  />
                </div>
              </div>

              <Button 
                onClick={() => saveContent('about_content', aboutContent)}
                disabled={saving}
                className="w-full"
              >
                {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                Save About Page
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Contact Tab */}
        <TabsContent value="contact">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Phone className="w-5 h-5 text-primary" />
                Contact Page
              </CardTitle>
              <CardDescription>
                Manage all contact page content including address, phone, social media, and features
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Hero Section */}
              <div className="space-y-4">
                <h4 className="font-semibold flex items-center gap-2">
                  <Building2 className="w-4 h-4" />
                  Hero Section
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Hero Title (EN)</Label>
                    <Input
                      value={contactContent.heroTitle}
                      onChange={(e) => setContactContent(prev => ({ ...prev, heroTitle: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Hero Title (AR)</Label>
                    <Input
                      value={contactContent.heroTitleAr}
                      onChange={(e) => setContactContent(prev => ({ ...prev, heroTitleAr: e.target.value }))}
                      dir="rtl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Hero Subtitle (EN)</Label>
                    <Textarea
                      value={contactContent.heroSubtitle}
                      onChange={(e) => setContactContent(prev => ({ ...prev, heroSubtitle: e.target.value }))}
                      rows={2}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Hero Subtitle (AR)</Label>
                    <Textarea
                      value={contactContent.heroSubtitleAr}
                      onChange={(e) => setContactContent(prev => ({ ...prev, heroSubtitleAr: e.target.value }))}
                      rows={2}
                      dir="rtl"
                    />
                  </div>
                </div>
              </div>

              {/* Address & Contact */}
              <div className="space-y-4">
                <h4 className="font-semibold flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Address & Contact Information
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Address Line 1 (EN)</Label>
                    <Input
                      value={contactContent.address}
                      onChange={(e) => setContactContent(prev => ({ ...prev, address: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Address Line 1 (AR)</Label>
                    <Input
                      value={contactContent.addressAr}
                      onChange={(e) => setContactContent(prev => ({ ...prev, addressAr: e.target.value }))}
                      dir="rtl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Address Line 2 (EN)</Label>
                    <Input
                      value={contactContent.addressLine2}
                      onChange={(e) => setContactContent(prev => ({ ...prev, addressLine2: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Address Line 2 (AR)</Label>
                    <Input
                      value={contactContent.addressLine2Ar}
                      onChange={(e) => setContactContent(prev => ({ ...prev, addressLine2Ar: e.target.value }))}
                      dir="rtl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      Phone Number
                    </Label>
                    <Input
                      value={contactContent.phone}
                      onChange={(e) => setContactContent(prev => ({ ...prev, phone: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      Email Address
                    </Label>
                    <Input
                      value={contactContent.email}
                      onChange={(e) => setContactContent(prev => ({ ...prev, email: e.target.value }))}
                    />
                  </div>
                </div>
              </div>

              {/* Working Hours */}
              <div className="space-y-4">
                <h4 className="font-semibold flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Working Hours
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Regular Hours (EN)</Label>
                    <Input
                      value={contactContent.workingHours}
                      onChange={(e) => setContactContent(prev => ({ ...prev, workingHours: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Regular Hours (AR)</Label>
                    <Input
                      value={contactContent.workingHoursAr}
                      onChange={(e) => setContactContent(prev => ({ ...prev, workingHoursAr: e.target.value }))}
                      dir="rtl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Friday Hours (EN)</Label>
                    <Input
                      value={contactContent.fridayHours}
                      onChange={(e) => setContactContent(prev => ({ ...prev, fridayHours: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Friday Hours (AR)</Label>
                    <Input
                      value={contactContent.fridayHoursAr}
                      onChange={(e) => setContactContent(prev => ({ ...prev, fridayHoursAr: e.target.value }))}
                      dir="rtl"
                    />
                  </div>
                </div>
              </div>

              {/* Social Media */}
              <div className="space-y-4">
                <h4 className="font-semibold flex items-center gap-2">
                  <Link className="w-4 h-4" />
                  Social Media & Links
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <MessageCircle className="w-4 h-4" />
                      WhatsApp Number
                    </Label>
                    <Input
                      value={contactContent.whatsappNumber}
                      onChange={(e) => setContactContent(prev => ({ ...prev, whatsappNumber: e.target.value }))}
                      placeholder="+971547751901"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Instagram className="w-4 h-4" />
                      Instagram URL
                    </Label>
                    <Input
                      value={contactContent.instagramUrl}
                      onChange={(e) => setContactContent(prev => ({ ...prev, instagramUrl: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Instagram Handle</Label>
                    <Input
                      value={contactContent.instagramHandle}
                      onChange={(e) => setContactContent(prev => ({ ...prev, instagramHandle: e.target.value }))}
                      placeholder="@greengrass_decor"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Facebook className="w-4 h-4" />
                      Facebook URL
                    </Label>
                    <Input
                      value={contactContent.facebookUrl}
                      onChange={(e) => setContactContent(prev => ({ ...prev, facebookUrl: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Facebook Page Name</Label>
                    <Input
                      value={contactContent.facebookName}
                      onChange={(e) => setContactContent(prev => ({ ...prev, facebookName: e.target.value }))}
                    />
                  </div>
                </div>
              </div>

              {/* Map */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Google Maps Embed URL
                </Label>
                <Textarea
                  value={contactContent.mapEmbedUrl}
                  onChange={(e) => setContactContent(prev => ({ ...prev, mapEmbedUrl: e.target.value }))}
                  rows={3}
                  placeholder="https://www.google.com/maps/embed?..."
                />
              </div>

              {/* Features */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold">Features List</h4>
                  <Button variant="outline" size="sm" onClick={addContactFeature}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Feature
                  </Button>
                </div>
                {contactContent.features.map((feature, index) => (
                  <div key={index} className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded-lg">
                    <div className="space-y-2">
                      <Label>Feature (EN)</Label>
                      <div className="flex gap-2">
                        <Input
                          value={feature}
                          onChange={(e) => updateContactFeature(index, e.target.value, false)}
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeContactFeature(index)}
                          className="text-destructive shrink-0"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Feature (AR)</Label>
                      <Input
                        value={contactContent.featuresAr[index] || ''}
                        onChange={(e) => updateContactFeature(index, e.target.value, true)}
                        dir="rtl"
                      />
                    </div>
                  </div>
                ))}
              </div>

              <Button 
                onClick={() => saveContent('contact_content', contactContent)}
                disabled={saving}
                className="w-full"
              >
                {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                Save Contact Page
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Product Detail Tab */}
        <TabsContent value="product-detail">
          <ProductDetailSettingsManager />
        </TabsContent>
      </Tabs>
    </div>
  );
};
