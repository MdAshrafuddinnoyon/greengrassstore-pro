import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Wrench, Clock, Mail, Phone, RefreshCw, Leaf, Settings, Sparkles } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

interface MaintenanceSettings {
  title: string;
  titleAr: string;
  message: string;
  messageAr: string;
  email: string;
  phone: string;
  estimatedTime: string;
  estimatedTimeAr: string;
  showProgress: boolean;
  progressPercent: number;
}

const defaultSettings: MaintenanceSettings = {
  title: "Site Under Maintenance",
  titleAr: "الموقع تحت الصيانة",
  message: "We're working on improving our website to bring you a better experience. We'll be back soon!",
  messageAr: "نحن نعمل على تحسين موقعنا لتقديم تجربة أفضل لك. سنعود قريبًا!",
  email: "support@greengrassstore.com",
  phone: "+971 54 775 1901",
  estimatedTime: "Back Soon",
  estimatedTimeAr: "العودة قريبًا",
  showProgress: true,
  progressPercent: 65
};

const Maintenance = () => {
  const { language } = useLanguage();
  const isArabic = language === "ar";
  const [settings, setSettings] = useState<MaintenanceSettings>(defaultSettings);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data } = await supabase
        .from('site_settings')
        .select('setting_value')
        .eq('setting_key', 'maintenance_page')
        .single();
      
      if (data?.setting_value) {
        setSettings({ ...defaultSettings, ...(data.setting_value as unknown as Partial<MaintenanceSettings>) });
      }
    } catch (error) {
      console.log('Using default maintenance settings');
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  };

  // Floating animation variants
  const floatingIcons = [
    { Icon: Leaf, delay: 0, x: "10%", y: "20%" },
    { Icon: Settings, delay: 0.5, x: "85%", y: "15%" },
    { Icon: Sparkles, delay: 1, x: "15%", y: "70%" },
    { Icon: Leaf, delay: 1.5, x: "80%", y: "75%" },
  ];

  return (
    <div 
      className="min-h-screen bg-gradient-to-br from-[#1a3625] via-[#2d5a3d] to-[#1a3625] flex items-center justify-center px-4 relative overflow-hidden"
      dir={isArabic ? "rtl" : "ltr"}
    >
      {/* Animated Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.1),transparent_40%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(255,255,255,0.1),transparent_40%)]" />
      </div>

      {/* Floating Icons */}
      {floatingIcons.map(({ Icon, delay, x, y }, idx) => (
        <motion.div
          key={idx}
          className="absolute text-white/10"
          style={{ left: x, top: y }}
          animate={{ 
            y: [0, -15, 0],
            rotate: [0, 5, -5, 0],
          }}
          transition={{ 
            duration: 4,
            repeat: Infinity,
            delay,
            ease: "easeInOut"
          }}
        >
          <Icon className="w-12 h-12 md:w-16 md:h-16" />
        </motion.div>
      ))}

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center max-w-lg relative z-10"
      >
        {/* Animated Icon */}
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 100 }}
          className="relative mx-auto mb-8"
        >
          <div className="w-28 h-28 bg-white/10 backdrop-blur-sm rounded-3xl flex items-center justify-center mx-auto shadow-2xl border border-white/20">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            >
              <Wrench className="w-14 h-14 text-white" />
            </motion.div>
          </div>
          <motion.div
            className="absolute -bottom-2 -right-2 w-12 h-12 bg-amber-500 rounded-xl flex items-center justify-center"
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Settings className="w-6 h-6 text-white" />
          </motion.div>
        </motion.div>

        {/* Title */}
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-3xl md:text-5xl font-bold text-white mb-4 leading-tight"
        >
          {isArabic ? settings.titleAr : settings.title}
        </motion.h1>
        
        {/* Message */}
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-white/80 text-base md:text-lg mb-8 leading-relaxed"
        >
          {isArabic ? settings.messageAr : settings.message}
        </motion.p>

        {/* Progress Bar */}
        {settings.showProgress && (
          <motion.div
            initial={{ opacity: 0, scaleX: 0 }}
            animate={{ opacity: 1, scaleX: 1 }}
            transition={{ delay: 0.5 }}
            className="mb-8"
          >
            <div className="flex justify-between text-sm text-white/60 mb-2">
              <span>{isArabic ? "تقدم الصيانة" : "Maintenance Progress"}</span>
              <span>{settings.progressPercent}%</span>
            </div>
            <div className="h-3 bg-white/10 rounded-full overflow-hidden backdrop-blur-sm">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${settings.progressPercent}%` }}
                transition={{ delay: 0.7, duration: 1.5, ease: "easeOut" }}
                className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full relative"
              >
                <motion.div
                  className="absolute inset-0 bg-white/30"
                  animate={{ x: ["-100%", "200%"] }}
                  transition={{ duration: 2, repeat: Infinity, delay: 1 }}
                />
              </motion.div>
            </div>
          </motion.div>
        )}

        {/* Contact Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 md:gap-6 text-white/70 mb-8"
        >
          <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full">
            <Clock className="w-4 h-4" />
            <span className="text-sm">{isArabic ? settings.estimatedTimeAr : settings.estimatedTime}</span>
          </div>
          {settings.email && (
            <a 
              href={`mailto:${settings.email}`}
              className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full hover:bg-white/20 transition-colors"
            >
              <Mail className="w-4 h-4" />
              <span className="text-sm">{settings.email}</span>
            </a>
          )}
          {settings.phone && (
            <a 
              href={`tel:${settings.phone.replace(/\s/g, '')}`}
              className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full hover:bg-white/20 transition-colors"
            >
              <Phone className="w-4 h-4" />
              <span className="text-sm">{settings.phone}</span>
            </a>
          )}
        </motion.div>

        {/* Refresh Button */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          <Button
            onClick={handleRefresh}
            variant="outline"
            className="bg-white/10 border-white/20 text-white hover:bg-white/20 gap-2 rounded-full px-6"
            disabled={refreshing}
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            {isArabic ? "تحديث الصفحة" : "Refresh Page"}
          </Button>
        </motion.div>

        {/* Loading Dots */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
          className="mt-10"
        >
          <div className="flex items-center justify-center gap-2">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-3 h-3 bg-white/40 rounded-full"
                animate={{ scale: [1, 1.3, 1], opacity: [0.4, 1, 0.4] }}
                transition={{ 
                  duration: 1.2,
                  repeat: Infinity,
                  delay: i * 0.2
                }}
              />
            ))}
          </div>
        </motion.div>

        {/* Footer */}
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="mt-10 text-white/40 text-sm"
        >
          Green Grass Store © {new Date().getFullYear()}
        </motion.p>
      </motion.div>
    </div>
  );
};

export default Maintenance;
