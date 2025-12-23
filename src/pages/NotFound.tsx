import { useLocation, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Home, Search, ArrowLeft, Leaf, ShoppingBag, Phone, Mail, MapPin } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const NotFound = () => {
  const location = useLocation();
  const { t, language } = useLanguage();
  const isArabic = language === "ar";
  const [searchQuery, setSearchQuery] = useState("");
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

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/shop?search=${encodeURIComponent(searchQuery)}`;
    }
  };

  // Floating elements animation
  const floatingElements = Array.from({ length: 8 }, (_, i) => i);

  const popularLinks = [
    { title: isArabic ? "النباتات" : "Plants", href: "/shop?category=plants", icon: "🌿" },
    { title: isArabic ? "الأواني" : "Pots", href: "/shop?category=pots", icon: "🪴" },
    { title: isArabic ? "الزهور" : "Flowers", href: "/shop?category=flowers", icon: "💐" },
    { title: isArabic ? "الهدايا" : "Gifts", href: "/shop?category=gifts", icon: "🎁" },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col" dir={isArabic ? "rtl" : "ltr"}>
      <Header />
      <main className="flex-1 flex items-center justify-center relative overflow-hidden py-12 md:py-20">
        {/* Animated Background */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/10" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(45,90,61,0.08),transparent_70%)]" />
        </div>
        
        {/* Floating Elements */}
        {floatingElements.map((i) => (
          <motion.div
            key={i}
            className="absolute text-primary/10"
            style={{
              left: `${10 + (i * 12)}%`,
              top: `${15 + (i % 3) * 25}%`,
            }}
            animate={{ 
              y: [0, -20, 0],
              rotate: [0, 10, -10, 0],
              scale: [1, 1.1, 1]
            }}
            transition={{ 
              duration: 4 + i,
              repeat: Infinity,
              delay: i * 0.5,
              ease: "easeInOut"
            }}
          >
            <Leaf className="w-8 h-8 md:w-12 md:h-12" />
          </motion.div>
        ))}

        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center max-w-3xl mx-auto">
            {/* Animated 404 */}
            <motion.div
              style={{
                transform: `translate(${mousePosition.x}px, ${mousePosition.y}px)`,
              }}
              className="relative mb-6 md:mb-8"
            >
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 100, damping: 10 }}
                className="relative"
              >
                <h1 className="text-[100px] sm:text-[150px] md:text-[200px] font-black bg-gradient-to-br from-primary/20 to-primary/5 bg-clip-text text-transparent leading-none select-none">
                  404
                </h1>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.3, type: "spring" }}
                  className="absolute inset-0 flex items-center justify-center"
                >
                  <div className="w-20 h-20 md:w-28 md:h-28 bg-gradient-to-br from-primary to-primary/80 rounded-full flex items-center justify-center shadow-2xl shadow-primary/30">
                    <Leaf className="w-10 h-10 md:w-14 md:h-14 text-white" />
                  </div>
                </motion.div>
              </motion.div>
            </motion.div>

            {/* Text Content */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="space-y-4"
            >
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-display font-bold text-foreground">
                {isArabic ? "عذراً، الصفحة غير موجودة" : "Oops! Page Not Found"}
              </h2>
              <p className="text-muted-foreground text-sm md:text-base max-w-md mx-auto">
                {isArabic 
                  ? "يبدو أن الصفحة التي تبحث عنها قد انتقلت أو لم تعد موجودة. لا تقلق، دعنا نساعدك!"
                  : "The page you're looking for seems to have wandered off. Don't worry, let's help you find your way!"
                }
              </p>
            </motion.div>

            {/* Search Box */}
            <motion.form
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              onSubmit={handleSearch}
              className="mt-8 max-w-md mx-auto"
            >
              <div className="relative flex gap-2">
                <Input
                  type="text"
                  placeholder={isArabic ? "ابحث عن المنتجات..." : "Search for products..."}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-12 pl-4 pr-4 rounded-full border-2 border-muted focus:border-primary"
                />
                <Button type="submit" className="h-12 px-6 rounded-full">
                  <Search className="w-4 h-4" />
                </Button>
              </div>
            </motion.form>

            {/* Quick Links */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="mt-8"
            >
              <p className="text-sm text-muted-foreground mb-4">
                {isArabic ? "أو تصفح الفئات الشائعة:" : "Or browse popular categories:"}
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                {popularLinks.map((link, idx) => (
                  <Link
                    key={idx}
                    to={link.href}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-muted/50 hover:bg-primary hover:text-primary-foreground rounded-full text-sm font-medium transition-all hover:scale-105"
                  >
                    <span>{link.icon}</span>
                    {link.title}
                  </Link>
                ))}
              </div>
            </motion.div>

            {/* Action Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="mt-10 flex flex-col sm:flex-row gap-4 justify-center"
            >
              <Link to="/">
                <Button size="lg" className="gap-2 rounded-full px-8">
                  <Home className="w-4 h-4" />
                  {isArabic ? "الصفحة الرئيسية" : "Go Home"}
                </Button>
              </Link>
              <Link to="/shop">
                <Button variant="outline" size="lg" className="gap-2 rounded-full px-8">
                  <ShoppingBag className="w-4 h-4" />
                  {isArabic ? "تسوق الآن" : "Browse Shop"}
                </Button>
              </Link>
            </motion.div>

            {/* Go Back */}
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.9 }}
              onClick={() => window.history.back()}
              className="mt-8 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              {isArabic ? "العودة للخلف" : "Go back to previous page"}
            </motion.button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default NotFound;
