import { X } from "lucide-react";
import { useState, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";

interface AnnouncementSettings {
  enabled: boolean;
  text: string;
  textAr: string;
  backgroundColor: string;
  textColor: string;
}

export const AnnouncementBar = () => {
  // Start with null to distinguish between "not yet loaded" and "loaded but disabled"
  const [settings, setSettings] = useState<AnnouncementSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDismissed, setIsDismissed] = useState(false);
  const { language, t } = useLanguage();
  const isArabic = language === "ar";

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from('site_settings')
          .select('setting_value')
          .eq('setting_key', 'announcement_bar')
          .maybeSingle();

        if (error) {
          console.error('Error fetching announcement:', error);
          setIsLoading(false);
          return;
        }

        if (data?.setting_value) {
          const announcementSettings = data.setting_value as unknown as AnnouncementSettings;
          setSettings(announcementSettings);
        } else {
          // No settings found, set to disabled
          setSettings({ enabled: false, text: '', textAr: '', backgroundColor: '', textColor: '' });
        }
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();
  }, []);

  // Don't render anything while loading - prevents flash of content
  if (isLoading) return null;
  
  // Don't render if no settings, not enabled, or user dismissed
  if (!settings || !settings.enabled || isDismissed) return null;

  const displayText = isArabic ? (settings.textAr || settings.text) : settings.text;

  return (
    <div 
      className="text-xs py-2 relative"
      style={{ 
        backgroundColor: settings.backgroundColor || 'hsl(var(--primary))',
        color: settings.textColor || 'hsl(var(--primary-foreground))'
      }}
    >
      <div className="container mx-auto px-4 text-center">
        <span>{displayText || t("announcement.freeDelivery")}</span>
      </div>
      <button
        onClick={() => setIsDismissed(true)}
        className="absolute right-4 top-1/2 -translate-y-1/2 hover:opacity-70 transition-opacity"
        aria-label="Close"
      >
        <X className="w-3 h-3" />
      </button>
    </div>
  );
};