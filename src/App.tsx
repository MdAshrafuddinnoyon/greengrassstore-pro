import { useEffect, useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { SiteSettingsProvider, useSiteSettings } from "@/contexts/SiteSettingsContext";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { ScrollToTop } from "@/components/ScrollToTop";
import { FloatingActionMenu } from "@/components/FloatingActionMenu";
import { LocalCompareDrawer } from "@/components/compare/LocalCompareDrawer";
import { MessengerButton } from "@/components/chat/MessengerButton";
import { AISalesAgent } from "@/components/chat/AISalesAgent";
import Index from "./pages/Index";
import Admin from "./pages/Admin";
import ProductDetail from "./pages/ProductDetail";
import Shop from "./pages/Shop";
import Blog from "./pages/Blog";
import BlogDetail from "./pages/BlogDetail";
import About from "./pages/About";
import Contact from "./pages/Contact";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import ReturnPolicy from "./pages/ReturnPolicy";
import VIPProgram from "./pages/VIPProgram";
import Auth from "./pages/Auth";
import Account from "./pages/Account";
import FAQ from "./pages/FAQ";
import Checkout from "./pages/Checkout";
import OrderTracking from "./pages/OrderTracking";
import ThankYou from "./pages/ThankYou";
import NotFound from "./pages/NotFound";
import Maintenance from "./pages/Maintenance";
import Install from "./pages/Install";

const queryClient = new QueryClient();

// Component to apply theme colors dynamically
const ThemeApplier = () => {
  const { themeColors, typography, branding } = useSiteSettings();

  useEffect(() => {
    if (!themeColors) return;
    
    const root = document.documentElement;
    
    const hexToHSL = (hex: string) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      if (!result) return null;
      let r = parseInt(result[1], 16) / 255;
      let g = parseInt(result[2], 16) / 255;
      let b = parseInt(result[3], 16) / 255;
      const max = Math.max(r, g, b), min = Math.min(r, g, b);
      let h = 0, s = 0;
      const l = (max + min) / 2;
      if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
          case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
          case g: h = ((b - r) / d + 2) / 6; break;
          case b: h = ((r - g) / d + 4) / 6; break;
        }
      }
      return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
    };

    // Apply theme colors
    if (themeColors.primaryColor) {
      const hsl = hexToHSL(themeColors.primaryColor);
      if (hsl) root.style.setProperty('--primary', hsl);
    }
    if (themeColors.primaryForeground) {
      const hsl = hexToHSL(themeColors.primaryForeground);
      if (hsl) root.style.setProperty('--primary-foreground', hsl);
    }
    if (themeColors.secondaryColor) {
      const hsl = hexToHSL(themeColors.secondaryColor);
      if (hsl) root.style.setProperty('--secondary', hsl);
    }
    if (themeColors.accentColor) {
      const hsl = hexToHSL(themeColors.accentColor);
      if (hsl) root.style.setProperty('--accent', hsl);
    }
    if (themeColors.backgroundColor) {
      const hsl = hexToHSL(themeColors.backgroundColor);
      if (hsl) root.style.setProperty('--background', hsl);
    }
    if (themeColors.foregroundColor) {
      const hsl = hexToHSL(themeColors.foregroundColor);
      if (hsl) root.style.setProperty('--foreground', hsl);
    }
  }, [themeColors]);

  // Apply favicon dynamically
  useEffect(() => {
    if (branding?.faviconUrl) {
      const link = document.querySelector("link[rel*='icon']") as HTMLLinkElement;
      if (link) {
        link.href = branding.faviconUrl;
      }
    }
  }, [branding?.faviconUrl]);

  return null;
};

// Wrapper component to handle maintenance mode
const MaintenanceWrapper = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const { securitySettings } = useSiteSettings();
  
  // Check if maintenance mode is enabled
  const isMaintenanceMode = securitySettings?.maintenanceMode === true;
  
  // Allow access to admin route even in maintenance mode
  const isAdminRoute = location.pathname.startsWith('/admin');
  
  if (isMaintenanceMode && !isAdminRoute) {
    return <Maintenance />;
  }
  
  return <>{children}</>;
};

const AppContent = () => {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <ThemeApplier />
      <MaintenanceWrapper>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/shop" element={<Shop />} />
          <Route path="/product/:handle" element={<ProductDetail />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/blog/:id" element={<BlogDetail />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/terms" element={<TermsOfService />} />
          <Route path="/terms-of-service" element={<TermsOfService />} />
          <Route path="/returns" element={<ReturnPolicy />} />
          <Route path="/vip" element={<VIPProgram />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/track-order" element={<OrderTracking />} />
          <Route path="/thank-you" element={<ThankYou />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/account" element={<Account />} />
          <Route path="/maintenance" element={<Maintenance />} />
          <Route path="/install" element={<Install />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </MaintenanceWrapper>
      <FloatingActionMenu />
      <LocalCompareDrawer />
      <MessengerButton />
      <AISalesAgent />
      <MobileBottomNav />
    </BrowserRouter>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <LanguageProvider>
      <SiteSettingsProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <AppContent />
        </TooltipProvider>
      </SiteSettingsProvider>
    </LanguageProvider>
  </QueryClientProvider>
);

export default App;
