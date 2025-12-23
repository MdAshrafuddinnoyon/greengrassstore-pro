import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, Sparkles, X, ChevronRight } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface FloatingRequestButtonProps {
  onClick: () => void;
}

export const FloatingRequestButton = ({ onClick }: FloatingRequestButtonProps) => {
  const { language } = useLanguage();
  const isArabic = language === "ar";
  const [isHovered, setIsHovered] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="fixed bottom-20 sm:bottom-24 md:bottom-8 left-3 sm:left-4 md:left-8 z-40">
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.8 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="absolute bottom-full left-0 mb-3 w-72"
          >
            <div className="bg-card border border-border rounded-2xl shadow-2xl overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-r from-primary to-primary/80 p-4 text-primary-foreground">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5" />
                    <span className="font-semibold">
                      {isArabic ? "طلب مخصص" : "Custom Request"}
                    </span>
                  </div>
                  <button
                    onClick={() => setIsExpanded(false)}
                    className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              </div>
              
              {/* Content */}
              <div className="p-4">
                <p className="text-sm text-muted-foreground mb-4">
                  {isArabic 
                    ? "هل لديك طلب خاص؟ أخبرنا باحتياجاتك وسنساعدك!"
                    : "Have a special request? Tell us your needs and we'll help you!"}
                </p>
                
                <div className="space-y-2">
                  {[
                    { icon: "🌿", text: isArabic ? "نباتات مخصصة" : "Custom Plants" },
                    { icon: "🎁", text: isArabic ? "هدايا الشركات" : "Corporate Gifts" },
                    { icon: "🏡", text: isArabic ? "تنسيق الحدائق" : "Landscaping" },
                  ].map((item, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center gap-2 text-sm text-foreground"
                    >
                      <span>{item.icon}</span>
                      <span>{item.text}</span>
                    </motion.div>
                  ))}
                </div>
                
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setIsExpanded(false);
                    onClick();
                  }}
                  className="w-full mt-4 py-3 bg-primary text-primary-foreground rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors"
                >
                  {isArabic ? "ابدأ الآن" : "Get Started"}
                  <ChevronRight className="w-4 h-4" />
                </motion.button>
              </div>
            </div>
            
            {/* Arrow */}
            <div className="absolute -bottom-2 left-6 w-4 h-4 bg-card border-r border-b border-border rotate-45" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Button */}
      <motion.button
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={() => setIsExpanded(!isExpanded)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="relative group"
      >
        {/* Pulse ring */}
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.5, 0, 0.5],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute inset-0 rounded-full bg-primary"
        />
        
        {/* Button body */}
        <motion.div
          animate={{
            width: isHovered ? "auto" : "48px",
          }}
          transition={{ type: "spring", damping: 20, stiffness: 300 }}
          className="relative flex items-center gap-2 h-12 sm:h-14 px-3 sm:px-4 bg-gradient-to-r from-primary via-primary to-primary/80 text-primary-foreground rounded-full shadow-lg overflow-hidden"
          style={{
            boxShadow: "0 10px 40px -10px hsl(var(--primary) / 0.5)",
          }}
        >
          {/* Icon */}
          <motion.div
            animate={{ rotate: isExpanded ? 45 : 0 }}
            transition={{ type: "spring", damping: 20 }}
            className="flex-shrink-0"
          >
            {isExpanded ? (
              <X className="w-5 h-5 sm:w-6 sm:h-6" />
            ) : (
              <FileText className="w-5 h-5 sm:w-6 sm:h-6" />
            )}
          </motion.div>
          
          {/* Text */}
          <AnimatePresence>
            {isHovered && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "auto" }}
                exit={{ opacity: 0, width: 0 }}
                className="font-medium whitespace-nowrap pr-1"
              >
                {isArabic ? "طلب مخصص" : "Custom Request"}
              </motion.span>
            )}
          </AnimatePresence>
        </motion.div>
        
        {/* Shine effect */}
        <motion.div
          animate={{
            x: ["-100%", "200%"],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "linear",
            repeatDelay: 2,
          }}
          className="absolute inset-0 w-1/2 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12 rounded-full pointer-events-none"
        />
      </motion.button>
      
      {/* Tooltip for mobile */}
      <AnimatePresence>
        {!isExpanded && !isHovered && (
          <motion.div
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            className="absolute left-full ml-3 top-1/2 -translate-y-1/2 hidden md:block"
          >
            <div className="bg-foreground text-background text-xs font-medium px-3 py-1.5 rounded-lg whitespace-nowrap">
              {isArabic ? "طلب مخصص" : "Custom Request"}
              <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-foreground" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
