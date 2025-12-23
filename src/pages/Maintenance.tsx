import { motion } from "framer-motion";
import { Wrench, Clock, Mail } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const Maintenance = () => {
  const { language } = useLanguage();
  const isArabic = language === "ar";

  return (
    <div 
      className="min-h-screen bg-gradient-to-br from-[#2d5a3d] to-[#1a3625] flex items-center justify-center px-4"
      dir={isArabic ? "rtl" : "ltr"}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center max-w-lg"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring" }}
          className="w-24 h-24 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-8"
        >
          <Wrench className="w-12 h-12 text-white" />
        </motion.div>

        <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
          {isArabic ? "الموقع تحت الصيانة" : "Site Under Maintenance"}
        </h1>
        
        <p className="text-white/80 text-lg mb-8">
          {isArabic 
            ? "نحن نعمل على تحسين موقعنا لتقديم تجربة أفضل لك. سنعود قريبًا!"
            : "We're working on improving our website to bring you a better experience. We'll be back soon!"
          }
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-6 text-white/70">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            <span>{isArabic ? "العودة قريبًا" : "Back Soon"}</span>
          </div>
          <div className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            <span>support@greengrassstore.com</span>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-12"
        >
          <div className="flex items-center justify-center gap-2">
            <div className="w-3 h-3 bg-white/50 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-3 h-3 bg-white/50 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-3 h-3 bg-white/50 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        </motion.div>

        <p className="mt-8 text-white/50 text-sm">
          Green Grass Store © {new Date().getFullYear()}
        </p>
      </motion.div>
    </div>
  );
};

export default Maintenance;
