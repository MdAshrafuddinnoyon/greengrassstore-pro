import { useState, useEffect } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { HeroSection } from "@/components/home/HeroSection";
import { CategoriesGrid } from "@/components/home/CategoriesGrid";
import { FeaturedCategorySection } from "@/components/home/FeaturedCategorySection";
import { LocalProductGrid } from "@/components/products/LocalProductGrid";
import { PromoSection } from "@/components/home/PromoSection";
import { BlogSection } from "@/components/home/BlogSection";
import { InstagramSection } from "@/components/home/InstagramSection";
import { FAQSection } from "@/components/home/FAQSection";
import { GiftSection } from "@/components/home/GiftSection";
import { supabase } from "@/integrations/supabase/client";

interface CollectionSectionSettings {
  enabled: boolean;
  title: string;
  titleAr: string;
  subtitle: string;
  subtitleAr: string;
  productsLimit: number;
  showFeaturedOnly: boolean;
}

const Index = () => {
  const [collectionSettings, setCollectionSettings] = useState<CollectionSectionSettings>({
    enabled: true,
    title: "Our Collection",
    titleAr: "مجموعتنا",
    subtitle: "Discover our curated selection of premium plants and home décor",
    subtitleAr: "اكتشف مجموعتنا المختارة من النباتات الفاخرة وديكور المنزل",
    productsLimit: 8,
    showFeaturedOnly: false
  });

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const { data } = await supabase
          .from('site_settings')
          .select('setting_value')
          .eq('setting_key', 'collection_section')
          .single();
        
        if (data?.setting_value) {
          setCollectionSettings(data.setting_value as unknown as CollectionSectionSettings);
        }
      } catch (error) {
        console.error('Failed to load collection settings:', error);
      }
    };
    loadSettings();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pb-16 md:pb-0">
        {/* Hero Section */}
        <HeroSection />

        {/* Icon Categories - Simple browsing */}
        <CategoriesGrid />

        {/* Featured Categories with Banner + Product Slider */}
        <FeaturedCategorySection />

        {/* Local Products - All Products (Dynamic from Admin) */}
        {collectionSettings.enabled && (
          <section className="py-12 md:py-20 bg-background">
            <LocalProductGrid
              title={collectionSettings.title}
              titleAr={collectionSettings.titleAr}
              subtitle={collectionSettings.subtitle}
              subtitleAr={collectionSettings.subtitleAr}
              featured={collectionSettings.showFeaturedOnly || undefined}
              limit={collectionSettings.productsLimit}
            />
          </section>
        )}

        {/* Gift Section */}
        <GiftSection />

        {/* Sale Banner */}
        <PromoSection />

        {/* Blog Section */}
        <BlogSection />

        {/* FAQ Section */}
        <FAQSection />

        {/* Instagram Feed */}
        <InstagramSection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
