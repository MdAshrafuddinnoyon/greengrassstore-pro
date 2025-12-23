import { Link, useLocation, useNavigate } from "react-router-dom";
import { Home, Search, ShoppingBag, User, Grid3X3 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCartStore } from "@/stores/cartStore";
import { useLanguage } from "@/contexts/LanguageContext";
import { motion } from "framer-motion";

export const MobileBottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useLanguage();
  const items = useCartStore((state) => state.items);
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  // Hide on admin pages
  const isAdminRoute = location.pathname.startsWith('/admin');
  if (isAdminRoute) return null;

  const navItems = [
    { icon: Home, label: t("common.home"), href: "/" },
    { icon: Grid3X3, label: t("common.categories"), href: "/shop", isCategories: true },
    { icon: Search, label: t("common.search"), href: "/shop", isSearch: true },
    { icon: ShoppingBag, label: t("common.cart"), href: "/checkout", isCart: true },
    { icon: User, label: t("common.account"), href: "/account" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 lg:hidden bg-background border-t border-border shadow-[0_-4px_20px_rgba(0,0,0,0.08)] safe-area-bottom">
      <div className="flex items-center justify-around h-16">
        {navItems.map((item, index) => {
          const isActive = location.pathname === item.href || 
            (item.href === "/shop" && location.pathname === "/shop");
          
          const handleClick = (e: React.MouseEvent) => {
            if (item.isSearch) {
              e.preventDefault();
              navigate("/shop?focus=search");
            } else if (item.isCategories) {
              e.preventDefault();
              navigate("/shop?focus=filters");
            }
          };
          
          return (
            <Link
              key={`${item.href}-${index}`}
              to={item.href}
              onClick={handleClick}
              className={cn(
                "flex flex-col items-center justify-center flex-1 h-full relative transition-colors",
                isActive ? "text-primary" : "text-muted-foreground"
              )}
            >
              <div className="relative">
                <item.icon className={cn(
                  "w-5 h-5 transition-transform",
                  isActive && "scale-110"
                )} />
                {item.isCart && totalItems > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1.5 -right-1.5 bg-destructive text-destructive-foreground text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center"
                  >
                    {totalItems}
                  </motion.span>
                )}
              </div>
              <span className={cn(
                "text-[10px] mt-1 font-medium",
                isActive && "font-semibold"
              )}>
                {item.label}
              </span>
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-primary rounded-full"
                />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
