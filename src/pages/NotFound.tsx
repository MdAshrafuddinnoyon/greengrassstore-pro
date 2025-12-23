import { useLocation, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Home, Search, ArrowLeft, Leaf } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

const NotFound = () => {
  const location = useLocation();
  const { t } = useLanguage();
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({
        x: (e.clientX - window.innerWidth / 2) / 50,
        y: (e.clientY - window.innerHeight / 2) / 50,
      });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  // Floating leaves animation
  const leaves = Array.from({ length: 6 }, (_, i) => i);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1 flex items-center justify-center relative overflow-hidden pb-16 md:pb-0">
        {/* Animated Background Gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/10" />
        
        {/* Floating Leaves */}
        {leaves.map((i) => (
          <motion.div
            key={i}
            className="absolute text-primary/20"
            initial={{ 
              x: Math.random() * window.innerWidth, 
              y: -50,
              rotate: 0 
            }}
            animate={{ 
              y: window.innerHeight + 50,
              rotate: 360,
              x: Math.random() * window.innerWidth
            }}
            transition={{ 
              duration: 10 + Math.random() * 10,
              repeat: Infinity,
              delay: i * 2,
              ease: "linear"
            }}
          >
            <Leaf className="w-8 h-8 md:w-12 md:h-12" />
          </motion.div>
        ))}

        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center max-w-2xl mx-auto">
            {/* Animated 404 Number */}
            <motion.div
              style={{
                transform: `translate(${mousePosition.x}px, ${mousePosition.y}px)`,
              }}
              className="relative mb-8"
            >
              <motion.h1
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ 
                  type: "spring", 
                  stiffness: 100, 
                  damping: 10,
                  delay: 0.2 
                }}
                className="text-[120px] md:text-[200px] font-bold text-primary/10 leading-none select-none"
              >
                404
              </motion.h1>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.5, type: "spring" }}
                className="absolute inset-0 flex items-center justify-center"
              >
                <div className="w-20 h-20 md:w-32 md:h-32 bg-primary/10 rounded-full flex items-center justify-center">
                  <Leaf className="w-10 h-10 md:w-16 md:h-16 text-primary" />
                </div>
              </motion.div>
            </motion.div>

            {/* Text Content */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <h2 className="text-2xl md:text-4xl font-display font-semibold text-foreground mb-4">
                {t("404.title")}
              </h2>
              <p className="text-muted-foreground mb-8 text-sm md:text-base max-w-md mx-auto">
                {t("404.description")}
              </p>
            </motion.div>

            {/* Action Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              <Link
                to="/"
                className="inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-full font-medium hover:bg-primary/90 transition-colors"
              >
                <Home className="w-4 h-4" />
                {t("404.goHome")}
              </Link>
              <Link
                to="/shop"
                className="inline-flex items-center justify-center gap-2 bg-muted text-foreground px-6 py-3 rounded-full font-medium hover:bg-muted/80 transition-colors"
              >
                <Search className="w-4 h-4" />
                {t("404.browseProducts")}
              </Link>
            </motion.div>

            {/* Go Back Button */}
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              onClick={() => window.history.back()}
              className="mt-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              {t("404.goBack")}
            </motion.button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default NotFound;
