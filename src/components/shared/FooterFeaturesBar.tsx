import { useState, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Truck, RefreshCw, CreditCard, MapPin, Percent } from "lucide-react";

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

interface FooterFeaturesBarProps {
  variant?: 'light' | 'dark';
  className?: string;
}

export const FooterFeaturesBar = ({ variant = 'light', className = '' }: FooterFeaturesBarProps) => {
  const { language } = useLanguage();
  const isArabic = language === "ar";
  const [footerFeatures, setFooterFeatures] = useState<FooterFeature[]>([]);

  useEffect(() => {
    const fetchFooterFeatures = async () => {
      try {
        const { data } = await supabase
          .from('site_settings')
          .select('setting_value')
          .eq('setting_key', 'footer_features')
          .single();

        if (data?.setting_value) {
          setFooterFeatures(data.setting_value as unknown as FooterFeature[]);
        }
      } catch (error) {
        console.error('Error fetching footer features:', error);
      }
    };

    fetchFooterFeatures();

    // Real-time subscription
    const channel = supabase
      .channel('footer-features-bar-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'site_settings', filter: "setting_key=eq.footer_features" },
        () => {
          fetchFooterFeatures();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const bgClass = variant === 'dark' 
    ? 'bg-[#3d3d35] border-white/10' 
    : 'bg-gray-50 border-gray-200';
  
  const textClass = variant === 'dark' 
    ? 'text-white' 
    : 'text-gray-900';
  
  const descClass = variant === 'dark' 
    ? 'text-gray-400' 
    : 'text-gray-500';

  const enabledFeatures = footerFeatures.filter(f => f.enabled);

  if (enabledFeatures.length === 0) {
    // Fallback static features
    return (
      <div className={`border-y ${bgClass} ${className}`}>
        <div className="container mx-auto px-4 py-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="flex items-start gap-3">
              <Truck className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className={`font-semibold text-sm ${textClass}`}>
                  {isArabic ? "توصيل مجاني" : "Free Delivery"}
                </h4>
                <p className={`text-xs mt-0.5 ${descClass}`}>
                  {isArabic ? "للطلبات فوق 200 درهم" : "On Orders Over 200 AED"}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <RefreshCw className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className={`font-semibold text-sm ${textClass}`}>
                  {isArabic ? "إرجاع سهل" : "Hassle-Free Returns"}
                </h4>
                <p className={`text-xs mt-0.5 ${descClass}`}>
                  {isArabic ? "خلال 7 أيام من التسليم" : "Within 7 days of delivery."}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CreditCard className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className={`font-semibold text-sm ${textClass}`}>
                  {isArabic ? "أقساط سهلة" : "Easy Installments"}
                </h4>
                <p className={`text-xs mt-0.5 ${descClass}`}>
                  {isArabic ? "ادفع لاحقاً مع تابي" : "Pay Later with tabby."}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-pink-400 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className={`font-semibold text-sm ${textClass}`}>
                  {isArabic ? "زورنا في المتجر" : "Visit Us In-Store"}
                </h4>
                <p className={`text-xs mt-0.5 ${descClass}`}>
                  {isArabic ? "في أبوظبي ودبي" : "In Abu Dhabi and Dubai."}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`border-y ${bgClass} ${className}`}>
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {enabledFeatures.map((feature) => {
            const IconComponent = getFeatureIcon(feature.icon);
            const iconColor = getFeatureIconColor(feature.icon);
            return (
              <div key={feature.id} className="flex items-start gap-3">
                <IconComponent className={`w-5 h-5 ${iconColor} flex-shrink-0 mt-0.5`} />
                <div>
                  <h4 className={`font-semibold text-sm ${textClass}`}>
                    {isArabic ? feature.titleAr : feature.title}
                  </h4>
                  <p className={`text-xs mt-0.5 ${descClass}`}>
                    {isArabic ? feature.descriptionAr : feature.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
