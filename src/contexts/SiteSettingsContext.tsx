import { useState, useEffect, createContext, useContext, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

// Types for all site settings
export interface AnnouncementBarSettings {
  enabled: boolean;
  backgroundColor: string;
  textColor: string;
  autoRotate: boolean;
  rotationSpeed: number;
  announcements: {
    id: string;
    text: string;
    textAr: string;
    link: string;
    isActive: boolean;
    order: number;
  }[];
}

export interface HeroSettings {
  enabled: boolean;
  title: string;
  titleAr: string;
  subtitle: string;
  subtitleAr: string;
  description: string;
  descriptionAr: string;
  buttonText: string;
  buttonTextAr: string;
  buttonLink: string;
  secondaryButtonText: string;
  secondaryButtonTextAr: string;
  secondaryButtonLink: string;
  backgroundImage: string;
}

export interface GiftSectionSettings {
  enabled: boolean;
  title: string;
  titleAr: string;
  subtitle: string;
  subtitleAr: string;
  buttonText: string;
  buttonTextAr: string;
  buttonLink: string;
  productsLimit: number;
  items: {
    id: string;
    name: string;
    nameAr: string;
    price: number;
    image: string;
    href: string;
  }[];
}

export interface PromoSectionSettings {
  enabled: boolean;
  title: string;
  titleAr: string;
  subtitle: string;
  subtitleAr: string;
  discountText: string;
  discountTextAr: string;
  buttonText: string;
  buttonTextAr: string;
  buttonLink: string;
  secondaryButtonText: string;
  secondaryButtonTextAr: string;
  secondaryButtonLink: string;
  backgroundImage: string;
  backgroundColor: string;
}

export interface FeaturedCategorySectionSettings {
  enabled: boolean;
  title: string;
  titleAr: string;
  categoriesLimit: number;
  productsPerCategory: number;
  showBadges: boolean;
  selectedCategories: string[];
  images?: { [categoryId: string]: string };
}

export interface CollectionSectionSettings {
  enabled: boolean;
  title: string;
  titleAr: string;
  subtitle: string;
  subtitleAr: string;
  productsLimit: number;
  showFeaturedOnly: boolean;
}

export interface FooterLink {
  id: string;
  label: string;
  labelAr: string;
  href: string;
  order: number;
}

export interface FooterSection {
  id: string;
  title: string;
  titleAr: string;
  links: FooterLink[];
  order: number;
}

export interface FooterSettings {
  description: string;
  descriptionAr: string;
  websiteUrl: string;
  copyrightText: string;
  copyrightTextAr: string;
  logoUrl: string;
  logoSize: number;
  sections: FooterSection[];
  socialLinks: {
    instagram: string;
    facebook: string;
    whatsapp: string;
    twitter: string;
    youtube: string;
    tiktok: string;
    linkedin: string;
    snapchat: string;
    pinterest: string;
    telegram: string;
  };
  paymentMethods: {
    enabled: boolean;
    images: string[];
  };
  developerCredit: {
    enabled: boolean;
    name: string;
    url: string;
  };
}

export interface BrandingSettings {
  logoUrl: string;
  faviconUrl: string;
  siteName: string;
  siteNameAr: string;
  tagline: string;
  taglineAr: string;
  logoSizeDesktop: number;
  logoSizeMobile: number;
  logoSizeTablet: number;
  logoAlignment: 'left' | 'center' | 'right';
  // Domain/Site URL display
  showDomainText: boolean;
  domainText: string;
  // Payment Banner & Security (added for dynamic branding)
  showPaymentBanner?: boolean;
  paymentBannerImage?: string;
  paymentBannerLink?: string;
  securePaymentText?: string;
  securePaymentTextAr?: string;
  showSecurePayment?: boolean;
  easyReturnText?: string;
  easyReturnTextAr?: string;
  showEasyReturn?: boolean;
}

export interface ThemeColors {
  primaryColor: string;
  primaryForeground: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  foregroundColor: string;
  headerBackground: string;
  footerBackground: string;
}

export interface TypographySettings {
  headingFont: string;
  bodyFont: string;
  headingFontAr: string;
  bodyFontAr: string;
}

export interface WhatsAppSettings {
  phone: string;
  enabled: boolean;
  welcomeMessage: string;
}

export interface SalesAgentSettings {
  enabled: boolean;
  name: string;
  responses: Record<string, string>;
}

export interface StoreInfo {
  name: string;
  email: string;
  phone: string;
  address: string;
}

export interface ShippingSettings {
  freeShippingEnabled: boolean;
  freeShippingThreshold: number;
  freeShippingMinItems?: number;
  shippingCost: number;
  shippingLabel: string;
  shippingLabelAr: string;
  showProgressBar?: boolean;
}

export interface FooterFeature {
  id: string;
  icon: string;
  title: string;
  titleAr: string;
  description: string;
  descriptionAr: string;
  enabled: boolean;
}

export interface SecuritySettings {
  recaptchaEnabled: boolean;
  adminUrlPath: string;
  maintenanceMode: boolean;
}

// Mega Menu Types
export interface SubCategory {
  id: string;
  name: string;
  nameAr: string;
  href: string;
  icon: string;
  order: number;
}

export interface MegaMenuCategory {
  id: string;
  name: string;
  nameAr: string;
  href: string;
  icon: string;
  image: string;
  isSale: boolean;
  isActive: boolean;
  order: number;
  featuredTitle: string;
  featuredTitleAr: string;
  featuredSubtitle: string;
  featuredSubtitleAr: string;
  featuredHref: string;
  subcategories: SubCategory[];
}

// Page Content Types
export interface FAQItem {
  id: string;
  question: string;
  questionAr: string;
  answer: string;
  answerAr: string;
  category: string;
  order: number;
}

export interface PolicySection {
  id: string;
  title: string;
  titleAr: string;
  content: string;
  contentAr: string;
  icon: string;
  order: number;
}

export interface AboutPageContent {
  heroTitle: string;
  heroTitleAr: string;
  heroSubtitle: string;
  heroSubtitleAr: string;
  storyTitle: string;
  storyTitleAr: string;
  storyContent: string;
  storyContentAr: string;
  yearsInBusiness: string;
}

export interface ContactPageContent {
  heroTitle: string;
  heroTitleAr: string;
  heroSubtitle: string;
  heroSubtitleAr: string;
  address: string;
  addressAr: string;
  phone: string;
  email: string;
  workingHours: string;
  workingHoursAr: string;
  mapEmbedUrl: string;
}

interface SiteSettingsContextType {
  announcementBar: AnnouncementBarSettings;
  hero: HeroSettings;
  giftSection: GiftSectionSettings;
  promoSection: PromoSectionSettings;
  featuredCategorySection: FeaturedCategorySectionSettings;
  collectionSection: CollectionSectionSettings;
  footer: FooterSettings;
  branding: BrandingSettings;
  themeColors: ThemeColors;
  typography: TypographySettings;
  whatsapp: WhatsAppSettings;
  salesAgent: SalesAgentSettings;
  storeInfo: StoreInfo;
  shippingSettings: ShippingSettings;
  footerFeatures: FooterFeature[];
  securitySettings: SecuritySettings;
  megaMenuCategories: MegaMenuCategory[];
  faqItems: FAQItem[];
  returnPolicySections: PolicySection[];
  privacySections: PolicySection[];
  termsSections: PolicySection[];
  aboutContent: AboutPageContent;
  contactContent: ContactPageContent;
  loading: boolean;
  refetch: () => Promise<void>;
}

const defaultSecuritySettings: SecuritySettings = {
  recaptchaEnabled: false,
  adminUrlPath: 'admin',
  maintenanceMode: false
};

// Default values
const defaultAnnouncementBar: AnnouncementBarSettings = {
  enabled: true,
  backgroundColor: "#2d5a3d",
  textColor: "#ffffff",
  autoRotate: true,
  rotationSpeed: 5000,
  announcements: [
    { id: '1', text: 'Shop Now, Pay Later With Tabby', textAr: 'تسوق الآن وادفع لاحقاً مع تابي', link: '', isActive: true, order: 1 },
    { id: '2', text: 'Free Delivery on Orders Above AED 200', textAr: 'توصيل مجاني للطلبات فوق 200 درهم', link: '', isActive: true, order: 2 },
  ]
};

const defaultHero: HeroSettings = {
  enabled: true,
  title: "Bring Nature",
  titleAr: "أحضر الطبيعة",
  subtitle: "Into Your Home",
  subtitleAr: "إلى منزلك",
  description: "Discover our premium collection of plants, pots, and home décor designed for UAE homes.",
  descriptionAr: "اكتشف مجموعتنا المميزة من النباتات والأواني وديكور المنزل المصممة لمنازل الإمارات.",
  buttonText: "Shop Now",
  buttonTextAr: "تسوق الآن",
  buttonLink: "/shop",
  secondaryButtonText: "View Sale",
  secondaryButtonTextAr: "عرض التخفيضات",
  secondaryButtonLink: "/shop?collection=sale",
  backgroundImage: ""
};

const defaultGiftSection: GiftSectionSettings = {
  enabled: true,
  title: "Gift Garden",
  titleAr: "حديقة الهدايا",
  subtitle: "Thoughtfully curated gift sets for plant lovers",
  subtitleAr: "مجموعات هدايا منسقة بعناية لمحبي النباتات",
  buttonText: "View All Gifts",
  buttonTextAr: "عرض جميع الهدايا",
  buttonLink: "/shop?category=gifts",
  productsLimit: 6,
  items: []
};

const defaultPromoSection: PromoSectionSettings = {
  enabled: true,
  title: "Special Sale",
  titleAr: "عرض خاص",
  subtitle: "Up to 40% off on selected plants, pots, and accessories. Don't miss out on these amazing deals!",
  subtitleAr: "خصم يصل إلى 40% على النباتات والأواني والإكسسوارات المختارة. لا تفوت هذه العروض المذهلة!",
  discountText: "Limited Time Offer",
  discountTextAr: "عرض لفترة محدودة",
  buttonText: "Shop Sale",
  buttonTextAr: "تسوق التخفيضات",
  buttonLink: "/shop?category=sale",
  secondaryButtonText: "View All Products",
  secondaryButtonTextAr: "عرض جميع المنتجات",
  secondaryButtonLink: "/shop",
  backgroundImage: "",
  backgroundColor: "#2d5a3d"
};

const defaultFeaturedCategorySection: FeaturedCategorySectionSettings = {
  enabled: true,
  title: "Featured Categories",
  titleAr: "الفئات المميزة",
  categoriesLimit: 4,
  productsPerCategory: 6,
  showBadges: true,
  selectedCategories: []
};

const defaultCollectionSection: CollectionSectionSettings = {
  enabled: true,
  title: "Our Collection",
  titleAr: "مجموعتنا",
  subtitle: "Discover our curated selection of premium plants and home décor",
  subtitleAr: "اكتشف مجموعتنا المختارة من النباتات الفاخرة وديكور المنزل",
  productsLimit: 8,
  showFeaturedOnly: false
};

const defaultFooter: FooterSettings = {
  description: "We craft timeless pieces that blend elegance and functionality, elevating every space into a masterpiece.",
  descriptionAr: "نصنع قطعًا خالدة تمزج بين الأناقة والوظائف، ترتقي بكل مساحة إلى تحفة فنية.",
  websiteUrl: "www.greengrassstore.com",
  copyrightText: "© 2025 Green Grass Store. All rights reserved.",
  copyrightTextAr: "© 2025 متجر جرين جراس. جميع الحقوق محفوظة.",
  logoUrl: "",
  logoSize: 64,
  sections: [
    {
      id: "1",
      title: "Plants & Flowers",
      titleAr: "النباتات والزهور",
      order: 1,
      links: [
        { id: "1-1", label: "Plants", labelAr: "النباتات", href: "/shop?category=plants", order: 1 },
        { id: "1-2", label: "Flowers", labelAr: "الزهور", href: "/shop?category=flowers", order: 2 },
        { id: "1-3", label: "Pots", labelAr: "الأواني", href: "/shop?category=pots", order: 3 },
        { id: "1-4", label: "Greenery", labelAr: "الخضرة", href: "/shop?category=greenery", order: 4 },
      ]
    },
    {
      id: "2",
      title: "Pots",
      titleAr: "الأواني",
      order: 2,
      links: [
        { id: "2-1", label: "Hanging", labelAr: "معلقات", href: "/shop?category=hanging", order: 1 },
        { id: "2-2", label: "Gifts", labelAr: "هدايا", href: "/shop?category=gifts", order: 2 },
        { id: "2-3", label: "Sale", labelAr: "تخفيضات", href: "/shop?category=sale", order: 3 },
      ]
    },
    {
      id: "3",
      title: "Help",
      titleAr: "المساعدة",
      order: 3,
      links: [
        { id: "3-1", label: "Contact us", labelAr: "اتصل بنا", href: "/contact", order: 1 },
        { id: "3-2", label: "FAQ", labelAr: "الأسئلة الشائعة", href: "/faq", order: 2 },
        { id: "3-3", label: "Track Order", labelAr: "تتبع الطلب", href: "/track-order", order: 3 },
        { id: "3-4", label: "Return Policy", labelAr: "سياسة الإرجاع", href: "/returns", order: 4 },
      ]
    },
    {
      id: "4",
      title: "About",
      titleAr: "عن المتجر",
      order: 4,
      links: [
        { id: "4-1", label: "About Us", labelAr: "من نحن", href: "/about", order: 1 },
        { id: "4-2", label: "Shop", labelAr: "المتجر", href: "/shop", order: 2 },
        { id: "4-3", label: "Blog", labelAr: "المدونة", href: "/blog", order: 3 },
      ]
    }
  ],
  socialLinks: {
    instagram: "https://www.instagram.com/greengrass_decor",
    facebook: "https://www.facebook.com/greengrassstore",
    whatsapp: "+971547751901",
    twitter: "",
    youtube: "",
    tiktok: "",
    linkedin: "",
    snapchat: "",
    pinterest: "",
    telegram: ""
  },
  paymentMethods: {
    enabled: true,
    images: []
  },
  developerCredit: {
    enabled: true,
    name: "Web Search BD",
    url: "https://www.websearchbd.com"
  }
};

const defaultBranding: BrandingSettings = {
  logoUrl: "",
  faviconUrl: "",
  siteName: "Green Grass",
  siteNameAr: "جرين جراس",
  tagline: "Plants & Pots Store",
  taglineAr: "متجر النباتات والأواني",
  logoSizeDesktop: 120,
  logoSizeMobile: 80,
  logoSizeTablet: 100,
  logoAlignment: "left",
  showDomainText: true,
  domainText: "www.greengrassstore.com"
};

const defaultThemeColors: ThemeColors = {
  primaryColor: "#2d5a3d",
  primaryForeground: "#ffffff",
  secondaryColor: "#f5f3ef",
  accentColor: "#e8e4dd",
  backgroundColor: "#fefefe",
  foregroundColor: "#1f1f1f",
  headerBackground: "#ffffff",
  footerBackground: "#3d3d35"
};

const defaultTypography: TypographySettings = {
  headingFont: "Cormorant Garamond",
  bodyFont: "Inter",
  headingFontAr: "Cairo",
  bodyFontAr: "Cairo"
};

const defaultWhatsApp: WhatsAppSettings = {
  phone: "+971547751901",
  enabled: true,
  welcomeMessage: "Hello! Welcome to Green Grass Store. How can we help you today?"
};

const defaultSalesAgent: SalesAgentSettings = {
  enabled: true,
  name: "Sales Assistant",
  responses: {}
};

const defaultStoreInfo: StoreInfo = {
  name: "Green Grass Store",
  email: "info@greengrassstore.com",
  phone: "+971547751901",
  address: "Dubai, UAE"
};

const defaultShippingSettings: ShippingSettings = {
  freeShippingEnabled: true,
  freeShippingThreshold: 200,
  shippingCost: 25,
  shippingLabel: "Shipping",
  shippingLabelAr: "الشحن"
};

const defaultFooterFeatures: FooterFeature[] = [
  { id: '1', icon: 'truck', title: 'Free Delivery', titleAr: 'توصيل مجاني', description: 'Free Delivery On Orders Over 300 AED', descriptionAr: 'توصيل مجاني للطلبات فوق 300 درهم', enabled: true },
  { id: '2', icon: 'rotate', title: 'Hassle-Free Returns', titleAr: 'إرجاع سهل', description: 'Within 7 days of delivery.', descriptionAr: 'خلال 7 أيام من التسليم', enabled: true },
  { id: '3', icon: 'credit-card', title: 'Easy Installments', titleAr: 'أقساط سهلة', description: 'Pay Later with tabby.', descriptionAr: 'ادفع لاحقاً مع تابي', enabled: true },
  { id: '4', icon: 'map-pin', title: 'Visit Us In-Store', titleAr: 'زورنا في المتجر', description: 'In Abu Dhabi and Dubai.', descriptionAr: 'في أبوظبي ودبي', enabled: true },
];

const defaultMegaMenuCategories: MegaMenuCategory[] = [
  {
    id: '1',
    name: 'Plants',
    nameAr: 'نباتات',
    href: '/shop?category=plants',
    icon: 'leaf',
    image: '',
    isSale: false,
    isActive: true,
    order: 1,
    featuredTitle: 'New Arrivals',
    featuredTitleAr: 'وصل حديثاً',
    featuredSubtitle: 'Fresh plants collection',
    featuredSubtitleAr: 'مجموعة نباتات طازجة',
    featuredHref: '/shop?category=plants&sort=newest',
    subcategories: [
      { id: '1-1', name: 'Mixed Plant', nameAr: 'نباتات مختلطة', href: '/shop?category=mixed-plant', icon: 'leaf', order: 1 },
      { id: '1-2', name: 'Palm Tree', nameAr: 'شجرة النخيل', href: '/shop?category=palm-tree', icon: 'tree-deciduous', order: 2 },
      { id: '1-3', name: 'Ficus Tree', nameAr: 'شجرة الفيكس', href: '/shop?category=ficus-tree', icon: 'tree-deciduous', order: 3 },
      { id: '1-4', name: 'Paradise Plant', nameAr: 'نبات الجنة', href: '/shop?category=paradise-plant', icon: 'leaf', order: 4 },
      { id: '1-5', name: 'Bamboo Tree', nameAr: 'شجرة البامبو', href: '/shop?category=bamboo-tree', icon: 'tree-deciduous', order: 5 },
      { id: '1-6', name: 'Olive Tree', nameAr: 'شجرة الزيتون', href: '/shop?category=olive-tree', icon: 'tree-deciduous', order: 6 },
    ]
  },
  {
    id: '2',
    name: 'Flowers',
    nameAr: 'زهور',
    href: '/shop?category=flowers',
    icon: 'flower',
    image: '',
    isSale: false,
    isActive: true,
    order: 2,
    featuredTitle: 'Seasonal Blooms',
    featuredTitleAr: 'أزهار موسمية',
    featuredSubtitle: 'Beautiful flower arrangements',
    featuredSubtitleAr: 'ترتيبات زهور جميلة',
    featuredHref: '/shop?category=flowers',
    subcategories: [
      { id: '2-1', name: 'Flower', nameAr: 'زهرة', href: '/shop?category=flower', icon: 'flower', order: 1 },
    ]
  },
  {
    id: '3',
    name: 'Pots',
    nameAr: 'أواني',
    href: '/shop?category=pots',
    icon: 'package',
    image: '',
    isSale: false,
    isActive: true,
    order: 3,
    featuredTitle: 'Designer Pots',
    featuredTitleAr: 'أواني مصممة',
    featuredSubtitle: 'Premium collection',
    featuredSubtitleAr: 'مجموعة فاخرة',
    featuredHref: '/shop?category=pots',
    subcategories: [
      { id: '3-1', name: 'Fiber Pot', nameAr: 'أواني فايبر', href: '/shop?category=fiber-pot', icon: 'package', order: 1 },
      { id: '3-2', name: 'Plastic Pot', nameAr: 'أواني بلاستيك', href: '/shop?category=plastic-pot', icon: 'package', order: 2 },
      { id: '3-3', name: 'Ceramic Pot', nameAr: 'أواني سيراميك', href: '/shop?category=ceramic-pot', icon: 'package', order: 3 },
    ]
  },
  {
    id: '4',
    name: 'Greenery',
    nameAr: 'خضرة',
    href: '/shop?category=greenery',
    icon: 'shrub',
    image: '',
    isSale: false,
    isActive: true,
    order: 4,
    featuredTitle: 'Green Walls',
    featuredTitleAr: 'جدران خضراء',
    featuredSubtitle: 'Transform your space',
    featuredSubtitleAr: 'حول مساحتك',
    featuredHref: '/shop?category=green-wall',
    subcategories: [
      { id: '4-1', name: 'Green Wall', nameAr: 'جدار أخضر', href: '/shop?category=green-wall', icon: 'shrub', order: 1 },
      { id: '4-2', name: 'Greenery Bunch', nameAr: 'حزمة الخضرة', href: '/shop?category=greenery-bunch', icon: 'shrub', order: 2 },
      { id: '4-3', name: 'Moss', nameAr: 'طحلب', href: '/shop?category=moss', icon: 'shrub', order: 3 },
    ]
  },
  {
    id: '5',
    name: 'Hanging',
    nameAr: 'معلقات',
    href: '/shop?category=hanging',
    icon: 'fence',
    image: '',
    isSale: false,
    isActive: true,
    order: 5,
    featuredTitle: 'Hanging Plants',
    featuredTitleAr: 'نباتات معلقة',
    featuredSubtitle: 'Beautiful hanging decor',
    featuredSubtitleAr: 'ديكور معلق جميل',
    featuredHref: '/shop?category=hanging',
    subcategories: []
  },
  {
    id: '6',
    name: 'Gifts',
    nameAr: 'هدايا',
    href: '/shop?category=gifts',
    icon: 'gift',
    image: '',
    isSale: false,
    isActive: true,
    order: 6,
    featuredTitle: 'Gift Sets',
    featuredTitleAr: 'مجموعات هدايا',
    featuredSubtitle: 'Perfect for any occasion',
    featuredSubtitleAr: 'مثالية لأي مناسبة',
    featuredHref: '/shop?category=gifts',
    subcategories: []
  },
  {
    id: '7',
    name: 'Sale',
    nameAr: 'تخفيضات',
    href: '/shop?category=sale',
    icon: 'tag',
    image: '',
    isSale: true,
    isActive: true,
    order: 7,
    featuredTitle: '',
    featuredTitleAr: '',
    featuredSubtitle: '',
    featuredSubtitleAr: '',
    featuredHref: '',
    subcategories: []
  }
];

const defaultFaqItems: FAQItem[] = [
  { id: '1', question: 'What areas do you deliver to?', questionAr: 'ما هي مناطق التوصيل؟', answer: 'We deliver across all UAE.', answerAr: 'نقوم بالتوصيل إلى جميع أنحاء الإمارات.', category: 'shipping', order: 1 },
];

const defaultPolicySections: PolicySection[] = [
  { id: '1', title: 'Eligible for Return', titleAr: 'المؤهل للإرجاع', content: 'Items in original condition...', contentAr: 'العناصر في حالتها الأصلية...', icon: 'check-circle', order: 1 },
];

const defaultAboutContent: AboutPageContent = {
  heroTitle: 'About Green Grass',
  heroTitleAr: 'عن جرين جراس',
  heroSubtitle: 'Bringing nature into every home across the UAE',
  heroSubtitleAr: 'نجلب الطبيعة إلى كل منزل في الإمارات',
  storyTitle: 'A Passion for Plants & Beautiful Spaces',
  storyTitleAr: 'شغف بالنباتات والمساحات الجميلة',
  storyContent: 'Founded in Dubai in 2018...',
  storyContentAr: 'تأسست في دبي عام 2018...',
  yearsInBusiness: '6+'
};

const defaultContactContent: ContactPageContent = {
  heroTitle: "We'd Love to Hear From You",
  heroTitleAr: 'يسعدنا سماعك',
  heroSubtitle: 'Have questions about our products?',
  heroSubtitleAr: 'هل لديك أسئلة حول منتجاتنا؟',
  address: 'Al Quoz Industrial Area 3, Dubai, UAE',
  addressAr: 'منطقة القوز الصناعية 3، دبي، الإمارات',
  phone: '+971 54 775 1901',
  email: 'info@greengrassstore.com',
  workingHours: 'Sat-Thu: 9AM-9PM, Fri: 2PM-9PM',
  workingHoursAr: 'السبت-الخميس: 9ص-9م، الجمعة: 2م-9م',
  mapEmbedUrl: ''
};

const SiteSettingsContext = createContext<SiteSettingsContextType>({
  announcementBar: defaultAnnouncementBar,
  hero: defaultHero,
  giftSection: defaultGiftSection,
  promoSection: defaultPromoSection,
  featuredCategorySection: defaultFeaturedCategorySection,
  collectionSection: defaultCollectionSection,
  footer: defaultFooter,
  branding: defaultBranding,
  themeColors: defaultThemeColors,
  typography: defaultTypography,
  whatsapp: defaultWhatsApp,
  salesAgent: defaultSalesAgent,
  storeInfo: defaultStoreInfo,
  shippingSettings: defaultShippingSettings,
  footerFeatures: defaultFooterFeatures,
  securitySettings: defaultSecuritySettings,
  megaMenuCategories: defaultMegaMenuCategories,
  faqItems: defaultFaqItems,
  returnPolicySections: defaultPolicySections,
  privacySections: defaultPolicySections,
  termsSections: defaultPolicySections,
  aboutContent: defaultAboutContent,
  contactContent: defaultContactContent,
  loading: true,
  refetch: async () => {}
});

export const useSiteSettings = () => useContext(SiteSettingsContext);

export const SiteSettingsProvider = ({ children }: { children: ReactNode }) => {
  const [loading, setLoading] = useState(true);
  const [announcementBar, setAnnouncementBar] = useState(defaultAnnouncementBar);
  const [hero, setHero] = useState(defaultHero);
  const [giftSection, setGiftSection] = useState(defaultGiftSection);
  const [promoSection, setPromoSection] = useState(defaultPromoSection);
  const [featuredCategorySection, setFeaturedCategorySection] = useState(defaultFeaturedCategorySection);
  const [collectionSection, setCollectionSection] = useState(defaultCollectionSection);
  const [footer, setFooter] = useState(defaultFooter);
  const [branding, setBranding] = useState(defaultBranding);
  const [themeColors, setThemeColors] = useState(defaultThemeColors);
  const [typography, setTypography] = useState(defaultTypography);
  const [whatsapp, setWhatsapp] = useState(defaultWhatsApp);
  const [salesAgent, setSalesAgent] = useState(defaultSalesAgent);
  const [storeInfo, setStoreInfo] = useState(defaultStoreInfo);
  const [shippingSettings, setShippingSettings] = useState(defaultShippingSettings);
  const [securitySettings, setSecuritySettings] = useState(defaultSecuritySettings);
  const [megaMenuCategories, setMegaMenuCategories] = useState(defaultMegaMenuCategories);
  const [faqItems, setFaqItems] = useState(defaultFaqItems);
  const [returnPolicySections, setReturnPolicySections] = useState(defaultPolicySections);
  const [privacySections, setPrivacySections] = useState(defaultPolicySections);
  const [termsSections, setTermsSections] = useState(defaultPolicySections);
  const [aboutContent, setAboutContent] = useState(defaultAboutContent);
  const [contactContent, setContactContent] = useState(defaultContactContent);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('site_settings')
        .select('*');

      if (error) throw error;

      data?.forEach((setting) => {
        const value = setting.setting_value as Record<string, unknown>;
        switch (setting.setting_key) {
          case 'announcement_bar':
            setAnnouncementBar(value as unknown as AnnouncementBarSettings);
            break;
          case 'hero_section':
            setHero(value as unknown as HeroSettings);
            break;
          case 'gift_section':
            setGiftSection(value as unknown as GiftSectionSettings);
            break;
          case 'promo_section':
            setPromoSection(value as unknown as PromoSectionSettings);
            break;
          case 'featured_category_section':
            setFeaturedCategorySection(value as unknown as FeaturedCategorySectionSettings);
            break;
          case 'collection_section':
            setCollectionSection(value as unknown as CollectionSectionSettings);
            break;
          case 'footer_content':
          case 'footer_menu':
            setFooter(value as unknown as FooterSettings);
            break;
          case 'branding':
            setBranding(value as unknown as BrandingSettings);
            break;
          case 'theme_colors':
            setThemeColors(value as unknown as ThemeColors);
            break;
          case 'typography':
            setTypography(value as unknown as TypographySettings);
            break;
          case 'whatsapp':
            setWhatsapp(value as unknown as WhatsAppSettings);
            break;
          case 'sales_agent':
            setSalesAgent(value as unknown as SalesAgentSettings);
            break;
          case 'store_info':
            setStoreInfo(value as unknown as StoreInfo);
            break;
          case 'shipping_settings':
            setShippingSettings(value as unknown as ShippingSettings);
            break;
          case 'mega_menu_categories':
            setMegaMenuCategories(value as unknown as MegaMenuCategory[]);
            break;
          case 'faq_items':
            setFaqItems(value as unknown as FAQItem[]);
            break;
          case 'return_policy_sections':
            setReturnPolicySections(value as unknown as PolicySection[]);
            break;
          case 'privacy_sections':
            setPrivacySections(value as unknown as PolicySection[]);
            break;
          case 'terms_sections':
            setTermsSections(value as unknown as PolicySection[]);
            break;
          case 'about_content':
            setAboutContent(value as unknown as AboutPageContent);
            break;
          case 'contact_content':
            setContactContent(value as unknown as ContactPageContent);
            break;
          case 'security_settings':
            setSecuritySettings(value as unknown as SecuritySettings);
            break;
        }
      });
    } catch (error) {
      console.error('Error fetching site settings:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
    
    // Subscribe to real-time changes
    const channel = supabase
      .channel('site_settings_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'site_settings'
        },
        () => {
          // Refetch all settings when any setting changes
          fetchSettings();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <SiteSettingsContext.Provider
      value={{
        announcementBar,
        hero,
        giftSection,
        promoSection,
        featuredCategorySection,
        collectionSection,
        footer,
        branding,
        themeColors,
        typography,
        whatsapp,
        salesAgent,
        storeInfo,
        shippingSettings,
        footerFeatures: defaultFooterFeatures,
        securitySettings,
        megaMenuCategories,
        faqItems,
        returnPolicySections,
        privacySections,
        termsSections,
        aboutContent,
        contactContent,
        loading,
        refetch: fetchSettings
      }}
    >
      {children}
    </SiteSettingsContext.Provider>
  );
};
