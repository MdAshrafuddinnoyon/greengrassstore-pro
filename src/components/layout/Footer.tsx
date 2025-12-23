import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { useSiteSettings } from "@/contexts/SiteSettingsContext";
import { Instagram, Facebook, Truck, RefreshCw, CreditCard, MapPin, Send, Percent } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import logo192 from "@/assets/logo-192.png";

interface FooterFeature {
  id: string;
  icon: string;
  title: string;
  titleAr: string;
  description: string;
  descriptionAr: string;
  enabled: boolean;
}

const getFeatureIcon = (iconName: string) => {
  switch (iconName) {
    case 'truck': return Truck;
    case 'rotate': return RefreshCw;
    case 'credit-card': return CreditCard;
    case 'map-pin': return MapPin;
    case 'percent': return Percent;
    default: return Truck;
  }
};

const getFeatureIconColor = (iconName: string) => {
  switch (iconName) {
    case 'truck': return 'text-amber-500';
    case 'rotate': return 'text-blue-400';
    case 'credit-card': return 'text-yellow-400';
    case 'map-pin': return 'text-pink-400';
    case 'percent': return 'text-green-400';
    default: return 'text-amber-500';
  }
};

interface PaymentBannerSettings {
  enabled: boolean;
  title: string;
  titleAr: string;
  images: string[];
  imageHeight: number;
}

export const Footer = () => {
  const { t, language } = useLanguage();
  const { footer, branding, themeColors } = useSiteSettings();
  const isArabic = language === "ar";
  const [email, setEmail] = useState("");
  const [footerFeatures, setFooterFeatures] = useState<FooterFeature[]>([]);
  const [paymentBanner, setPaymentBanner] = useState<PaymentBannerSettings | null>(null);

  // Fetch footer features and payment banner from database
  useEffect(() => {
    const fetchFooterSettings = async () => {
      try {
        // Fetch footer features
        const { data: featuresData } = await supabase
          .from('site_settings')
          .select('setting_value')
          .eq('setting_key', 'footer_features')
          .single();

        if (featuresData?.setting_value) {
          setFooterFeatures(featuresData.setting_value as unknown as FooterFeature[]);
        }

        // Fetch footer menu settings (includes payment banner)
        const { data: menuData } = await supabase
          .from('site_settings')
          .select('setting_value')
          .eq('setting_key', 'footer_menu')
          .single();

        if (menuData?.setting_value) {
          const menuSettings = menuData.setting_value as any;
          if (menuSettings.paymentBanner) {
            setPaymentBanner(menuSettings.paymentBanner);
          }
        }
      } catch (error) {
        console.error('Error fetching footer settings:', error);
      }
    };

    fetchFooterSettings();

    // Real-time subscription
    const channel = supabase
      .channel('footer-settings-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'site_settings' },
        (payload) => {
          const key = (payload.new as any)?.setting_key;
          if (key === 'footer_features' || key === 'footer_menu') {
            fetchFooterSettings();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get footer logo - prioritize footer.logoUrl, then branding.logoUrl, then default
  const footerLogo = footer.logoUrl || branding.logoUrl || logo192;

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    
    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('newsletter_subscribers')
        .insert({ email, source: 'footer' });

      if (error) {
        if (error.code === '23505') {
          toast.info("You're already subscribed!");
        } else {
          throw error;
        }
      } else {
        toast.success(t("footer.subscribed"));
      }
      setEmail("");
    } catch (error) {
      console.error('Newsletter subscription error:', error);
      toast.error("Failed to subscribe. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <footer 
      className="text-white"
      style={{ backgroundColor: themeColors?.footerBackground || '#3d3d35' }}
    >
      {/* Newsletter Section */}
      <div className="border-b border-white/10">
        <div className="container mx-auto px-4 py-10">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div>
              <h3 className="text-lg font-bold tracking-wide mb-2">{t("footer.beFirst")}</h3>
              <p className="text-gray-400 text-sm max-w-md">
                {t("footer.newsletterDesc")}
              </p>
            </div>
            <form onSubmit={handleNewsletterSubmit} className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
              <div className="relative">
                <input
                  type="email"
                  placeholder={t("footer.emailPlaceholder")}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full sm:w-72 px-4 py-3 bg-transparent border border-gray-600 rounded-none text-white placeholder:text-gray-500 focus:outline-none focus:border-white transition-colors"
                  required
                />
                <Send className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              </div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-3 bg-white text-[#3d3d35] font-semibold text-sm hover:bg-gray-100 transition-colors disabled:opacity-50"
              >
                {isSubmitting ? "..." : t("footer.submit")}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Features Bar - Dynamic from Admin Settings */}
      <div className="border-b border-white/10">
        <div className="container mx-auto px-4 py-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {footerFeatures.length > 0 ? (
              footerFeatures.filter(f => f.enabled).map((feature) => {
                const IconComponent = getFeatureIcon(feature.icon);
                const iconColor = getFeatureIconColor(feature.icon);
                return (
                  <div key={feature.id} className="flex items-start gap-3">
                    <IconComponent className={`w-5 h-5 ${iconColor} flex-shrink-0 mt-0.5`} />
                    <div>
                      <h4 className="font-semibold text-sm">
                        {isArabic ? feature.titleAr : feature.title}
                      </h4>
                      <p className="text-gray-400 text-xs mt-0.5">
                        {isArabic ? feature.descriptionAr : feature.description}
                      </p>
                    </div>
                  </div>
                );
              })
            ) : (
              // Fallback static features
              <>
                <div className="flex items-start gap-3">
                  <Truck className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-sm">{t("footer.freeDelivery")}</h4>
                    <p className="text-gray-400 text-xs mt-0.5">{t("footer.freeDeliveryDesc")}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <RefreshCw className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-sm">{t("footer.hassleFree")}</h4>
                    <p className="text-gray-400 text-xs mt-0.5">{t("footer.hassleFreeDesc")}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CreditCard className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-sm">{t("footer.easyInstallments")}</h4>
                    <p className="text-gray-400 text-xs mt-0.5">{t("footer.easyInstallmentsDesc")}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-pink-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-sm">{t("footer.visitStore")}</h4>
                    <p className="text-gray-400 text-xs mt-0.5">{t("footer.visitStoreDesc")}</p>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Main Footer Content */}
      <div className="container mx-auto px-4 py-8 md:py-12">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-6 md:gap-8">
          {/* Logo & Description */}
          <div className="col-span-2">
            <div className="mb-4 md:mb-6">
              {/* Footer Logo - uses footer.logoUrl from FooterMenuManager with dynamic size */}
              <img 
                key={footerLogo}
                src={footerLogo}
                alt={branding.siteName || "Green Grass"} 
                className="w-auto object-contain mix-blend-lighten"
                style={{ height: `${footer.logoSize || 64}px` }}
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = logo192;
                }}
              />
            </div>
            <p className="text-gray-400 text-xs md:text-sm leading-relaxed max-w-xs">
              {isArabic ? footer.descriptionAr : footer.description}
            </p>
            {/* Social Links - Extended */}
            <div className="flex items-center gap-2 md:gap-3 mt-4 md:mt-6 flex-wrap">
              {footer.socialLinks?.instagram && (
                <a href={footer.socialLinks.instagram} target="_blank" rel="noopener noreferrer" className="p-2 bg-white/10 rounded-full text-gray-400 hover:text-white hover:bg-white/20 transition-colors">
                  <Instagram className="w-4 h-4 md:w-5 md:h-5" />
                </a>
              )}
              {footer.socialLinks?.facebook && (
                <a href={footer.socialLinks.facebook} target="_blank" rel="noopener noreferrer" className="p-2 bg-white/10 rounded-full text-gray-400 hover:text-white hover:bg-white/20 transition-colors">
                  <Facebook className="w-4 h-4 md:w-5 md:h-5" />
                </a>
              )}
              {footer.socialLinks?.whatsapp && (
                <a href={`https://wa.me/${footer.socialLinks.whatsapp.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer" className="p-2 bg-white/10 rounded-full text-gray-400 hover:text-white hover:bg-white/20 transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 md:w-5 md:h-5">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                  </svg>
                </a>
              )}
              {footer.socialLinks?.twitter && (
                <a href={footer.socialLinks.twitter} target="_blank" rel="noopener noreferrer" className="p-2 bg-white/10 rounded-full text-gray-400 hover:text-white hover:bg-white/20 transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 md:w-5 md:h-5">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                </a>
              )}
              {footer.socialLinks?.youtube && (
                <a href={footer.socialLinks.youtube} target="_blank" rel="noopener noreferrer" className="p-2 bg-white/10 rounded-full text-gray-400 hover:text-white hover:bg-white/20 transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 md:w-5 md:h-5">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                  </svg>
                </a>
              )}
              {footer.socialLinks?.tiktok && (
                <a href={footer.socialLinks.tiktok} target="_blank" rel="noopener noreferrer" className="p-2 bg-white/10 rounded-full text-gray-400 hover:text-white hover:bg-white/20 transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 md:w-5 md:h-5">
                    <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
                  </svg>
                </a>
              )}
              {footer.socialLinks?.telegram && (
                <a href={footer.socialLinks.telegram} target="_blank" rel="noopener noreferrer" className="p-2 bg-white/10 rounded-full text-gray-400 hover:text-white hover:bg-white/20 transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 md:w-5 md:h-5">
                    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                  </svg>
                </a>
              )}
              {footer.socialLinks?.linkedin && (
                <a href={footer.socialLinks.linkedin} target="_blank" rel="noopener noreferrer" className="p-2 bg-white/10 rounded-full text-gray-400 hover:text-white hover:bg-white/20 transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 md:w-5 md:h-5">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                </a>
              )}
            </div>

            {/* Payment Methods Banner - Dynamic from FooterMenuManager */}
            {paymentBanner?.enabled && paymentBanner?.images?.length > 0 && (
              <div className="mt-4 pt-4 border-t border-white/10">
                <p className="text-xs text-gray-500 mb-2">
                  {isArabic ? paymentBanner.titleAr : paymentBanner.title || "Payment Methods"}
                </p>
                <div className="flex items-center gap-2 flex-wrap">
                  {paymentBanner.images.map((img, i) => (
                    <img 
                      key={i} 
                      src={img} 
                      alt="Payment method" 
                      style={{ height: `${paymentBanner.imageHeight || 24}px` }}
                      className="object-contain"
                    />
                  ))}
                </div>
              </div>
            )}
            
            {/* Fallback to context payment methods if no database settings */}
            {!paymentBanner?.enabled && footer.paymentMethods?.enabled && footer.paymentMethods?.images?.length > 0 && (
              <div className="mt-4 pt-4 border-t border-white/10">
                <p className="text-xs text-gray-500 mb-2">Payment Methods</p>
                <div className="flex items-center gap-2 flex-wrap">
                  {footer.paymentMethods.images.map((img, i) => (
                    <img key={i} src={img} alt="Payment method" className="h-6 object-contain" />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Dynamic Footer Sections from FooterMenuManager */}
          {footer.sections && footer.sections.length > 0 ? (
            footer.sections
              .sort((a, b) => a.order - b.order)
              .map((section) => (
                <div key={section.id}>
                  <h4 className="font-bold text-sm mb-4">
                    {isArabic ? section.titleAr : section.title}
                  </h4>
                  <ul className="space-y-2.5 text-sm text-gray-400">
                    {section.links
                      .sort((a, b) => a.order - b.order)
                      .map((link) => (
                        <li key={link.id}>
                          <Link to={link.href} className="hover:text-white transition-colors">
                            {isArabic ? link.labelAr : link.label}
                          </Link>
                        </li>
                      ))}
                  </ul>
                </div>
              ))
          ) : (
            // Fallback static sections if no dynamic sections exist
            <>
              <div>
                <h4 className="font-bold text-sm mb-4">{t("footer.plantsFlowers")}</h4>
                <ul className="space-y-2.5 text-sm text-gray-400">
                  <li><Link to="/shop?category=plants" className="hover:text-white transition-colors">{isArabic ? "النباتات" : "Plants"}</Link></li>
                  <li><Link to="/shop?category=flowers" className="hover:text-white transition-colors">{isArabic ? "الزهور" : "Flowers"}</Link></li>
                  <li><Link to="/shop?category=pots" className="hover:text-white transition-colors">{isArabic ? "الأواني" : "Pots"}</Link></li>
                  <li><Link to="/shop?category=greenery" className="hover:text-white transition-colors">{isArabic ? "الخضرة" : "Greenery"}</Link></li>
                </ul>
              </div>

              <div>
                <h4 className="font-bold text-sm mb-4">{t("footer.pots")}</h4>
                <ul className="space-y-2.5 text-sm text-gray-400">
                  <li><Link to="/shop?category=hanging" className="hover:text-white transition-colors">{isArabic ? "معلقات" : "Hanging"}</Link></li>
                  <li><Link to="/shop?category=gifts" className="hover:text-white transition-colors">{isArabic ? "هدايا" : "Gifts"}</Link></li>
                  <li><Link to="/shop?category=sale" className="hover:text-white transition-colors">{isArabic ? "تخفيضات" : "Sale"}</Link></li>
                </ul>
              </div>

              <div>
                <h4 className="font-bold text-sm mb-4">{t("footer.help")}</h4>
                <ul className="space-y-2.5 text-sm text-gray-400">
                  <li><Link to="/contact" className="hover:text-white transition-colors">{t("footer.contactUs")}</Link></li>
                  <li><Link to="/faq" className="hover:text-white transition-colors">{isArabic ? "الأسئلة الشائعة" : "FAQ"}</Link></li>
                  <li><Link to="/track-order" className="hover:text-white transition-colors">{isArabic ? "تتبع الطلب" : "Track Order"}</Link></li>
                  <li><Link to="/returns" className="hover:text-white transition-colors">{t("footer.returnPolicy")}</Link></li>
                  <li><Link to="/privacy-policy" className="hover:text-white transition-colors">{isArabic ? "سياسة الخصوصية" : "Privacy Policy"}</Link></li>
                  <li><Link to="/terms-of-service" className="hover:text-white transition-colors">{isArabic ? "الشروط والأحكام" : "Terms of Service"}</Link></li>
                </ul>
              </div>

              <div>
                <h4 className="font-bold text-sm mb-4">{t("footer.aboutLink")}</h4>
                <ul className="space-y-2.5 text-sm text-gray-400">
                  <li><Link to="/about" className="hover:text-white transition-colors">{t("footer.about")}</Link></li>
                  <li><Link to="/shop" className="hover:text-white transition-colors">{t("footer.shop")}</Link></li>
                  <li><Link to="/blog" className="hover:text-white transition-colors">{t("blog.title")}</Link></li>
                </ul>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-white/10">
        <div className="container mx-auto px-4 py-4 sm:py-5">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
            <p className="text-[10px] sm:text-xs text-gray-500 text-center sm:text-left">
              {isArabic ? footer.copyrightTextAr : footer.copyrightText || t("footer.copyright")}
            </p>
            <span className="text-[10px] sm:text-xs text-gray-500">{footer.websiteUrl || "www.greengrassstore.com"}</span>
          </div>
          {/* Developer Credit - PERMANENT - Cannot be changed */}
          <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-white/10 text-center">
            <p className="text-[10px] sm:text-xs text-gray-500">
              Developed by{" "}
              <a
                href="https://www.websearchbd.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-amber-500 hover:text-amber-400 font-medium transition-colors"
              >
                Web Search BD
              </a>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};