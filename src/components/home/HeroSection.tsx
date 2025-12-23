import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import heroBg from "@/assets/hero-bg.jpg";

interface HeroSlide {
  id: string;
  title: string;
  titleAr: string;
  subtitle: string;
  subtitleAr: string;
  description: string;
  descriptionAr: string;
  buttonText: string;
  buttonTextAr: string;
  buttonLink: string;
  backgroundImage: string;
  order: number;
}

interface HeroSliderSettings {
  enabled: boolean;
  autoPlay: boolean;
  autoPlayInterval: number;
  slides: HeroSlide[];
}

interface HeroBannerSettings {
  enabled: boolean;
  title: string;
  titleAr: string;
  subtitle: string;
  subtitleAr: string;
  description: string;
  descriptionAr: string;
  buttonText: string;
  buttonTextAr: string;
  buttonLink: string;
  secondaryButtonText?: string;
  secondaryButtonTextAr?: string;
  secondaryButtonLink?: string;
  backgroundImage: string;
}

export const HeroSection = () => {
  const { language } = useLanguage();
  const isArabic = language === "ar";
  const [sliderSettings, setSliderSettings] = useState<HeroSliderSettings | null>(null);
  const [bannerSettings, setBannerSettings] = useState<HeroBannerSettings | null>(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        // Fetch both slider and banner settings
        const [sliderData, bannerData] = await Promise.all([
          supabase
            .from('site_settings')
            .select('*')
            .eq('setting_key', 'hero_slider')
            .maybeSingle(),
          supabase
            .from('site_settings')
            .select('*')
            .eq('setting_key', 'hero_section')
            .maybeSingle()
        ]);

        if (sliderData.data?.setting_value) {
          setSliderSettings(sliderData.data.setting_value as unknown as HeroSliderSettings);
        } else {
          // Use default slider settings if no data
          setSliderSettings({
            enabled: true,
            autoPlay: true,
            autoPlayInterval: 5000,
            slides: [{
              id: '1',
              title: 'Bring Nature',
              titleAr: 'أحضر الطبيعة',
              subtitle: 'Into Your Home',
              subtitleAr: 'إلى منزلك',
              description: 'Discover our premium collection of plants, pots, and home décor designed for UAE homes.',
              descriptionAr: 'اكتشف مجموعتنا المميزة من النباتات والأواني وديكور المنزل المصممة لمنازل الإمارات.',
              buttonText: 'Shop Now',
              buttonTextAr: 'تسوق الآن',
              buttonLink: '/shop',
              backgroundImage: '',
              order: 1
            }]
          });
        }

        if (bannerData.data?.setting_value) {
          setBannerSettings(bannerData.data.setting_value as unknown as HeroBannerSettings);
        }
      } catch (error) {
        console.error('Error fetching hero settings:', error);
        // Set default on error
        setSliderSettings({
          enabled: true,
          autoPlay: true,
          autoPlayInterval: 5000,
          slides: [{
            id: '1',
            title: 'Bring Nature',
            titleAr: 'أحضر الطبيعة',
            subtitle: 'Into Your Home',
            subtitleAr: 'إلى منزلك',
            description: 'Discover our premium collection of plants, pots, and home décor.',
            descriptionAr: 'اكتشف مجموعتنا المميزة من النباتات والأواني.',
            buttonText: 'Shop Now',
            buttonTextAr: 'تسوق الآن',
            buttonLink: '/shop',
            backgroundImage: '',
            order: 1
          }]
        });
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();

    // Subscribe to real-time changes for both settings
    const channel = supabase
      .channel('hero-settings-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'site_settings',
        filter: 'setting_key=eq.hero_slider'
      }, (payload) => {
        if (payload.new && (payload.new as any).setting_value) {
          setSliderSettings((payload.new as any).setting_value as HeroSliderSettings);
        }
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'site_settings',
        filter: 'setting_key=eq.hero_section'
      }, (payload) => {
        if (payload.new && (payload.new as any).setting_value) {
          setBannerSettings((payload.new as any).setting_value as HeroBannerSettings);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Auto-play functionality for slider
  useEffect(() => {
    if (!sliderSettings?.enabled || !sliderSettings?.autoPlay || !sliderSettings?.slides || sliderSettings.slides.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % sliderSettings.slides.length);
    }, sliderSettings.autoPlayInterval || 5000);

    return () => clearInterval(interval);
  }, [sliderSettings?.enabled, sliderSettings?.autoPlay, sliderSettings?.autoPlayInterval, sliderSettings?.slides?.length]);

  const goToSlide = useCallback((index: number) => {
    setCurrentSlide(index);
  }, []);

  const nextSlide = useCallback(() => {
    if (!sliderSettings?.slides) return;
    setCurrentSlide((prev) => (prev + 1) % sliderSettings.slides.length);
  }, [sliderSettings?.slides]);

  const prevSlide = useCallback(() => {
    if (!sliderSettings?.slides) return;
    setCurrentSlide((prev) => (prev - 1 + sliderSettings.slides.length) % sliderSettings.slides.length);
  }, [sliderSettings?.slides]);

  if (loading) {
    return (
      <section className="relative min-h-[70vh] md:min-h-[85vh] flex items-center overflow-hidden bg-muted animate-pulse" />
    );
  }

  // Determine which mode to use: Slider takes priority, then Banner, then hide
  const useSlider = sliderSettings?.enabled && sliderSettings?.slides && sliderSettings.slides.length > 0;
  const useBanner = !useSlider && bannerSettings?.enabled;

  // If neither is enabled, return null
  if (!useSlider && !useBanner) {
    return null;
  }

  // Slider Mode
  if (useSlider) {
    const slide = sliderSettings!.slides[currentSlide];
    const title = isArabic ? slide.titleAr : slide.title;
    const subtitle = isArabic ? slide.subtitleAr : slide.subtitle;
    const description = isArabic ? slide.descriptionAr : slide.description;
    const buttonText = isArabic ? slide.buttonTextAr : slide.buttonText;
    const backgroundImage = slide.backgroundImage || heroBg;

    return (
      <section className="relative min-h-[60vh] md:min-h-[85vh] flex items-center overflow-hidden">
        {/* Background Image with Animation */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0 z-0"
          >
            <img
              src={backgroundImage}
              alt="Premium plants collection"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-transparent" />
          </motion.div>
        </AnimatePresence>

        {/* Navigation Arrows */}
        {sliderSettings!.slides.length > 1 && (
          <>
            <button
              onClick={prevSlide}
              className="absolute left-2 md:left-4 z-20 p-2 bg-white/20 backdrop-blur-sm rounded-full hover:bg-white/40 transition-colors"
              aria-label="Previous slide"
            >
              <ChevronLeft className="w-5 h-5 md:w-6 md:h-6 text-white" />
            </button>
            <button
              onClick={nextSlide}
              className="absolute right-2 md:right-4 z-20 p-2 bg-white/20 backdrop-blur-sm rounded-full hover:bg-white/40 transition-colors"
              aria-label="Next slide"
            >
              <ChevronRight className="w-5 h-5 md:w-6 md:h-6 text-white" />
            </button>
          </>
        )}

        {/* Content */}
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-2xl">
            <motion.span
              key={`brand-${currentSlide}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-block text-white/80 text-xs md:text-base uppercase tracking-[0.3em] mb-2 md:mb-4 font-medium"
            >
              Green Grass Store
            </motion.span>

            <AnimatePresence mode="wait">
              <motion.div
                key={currentSlide}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5 }}
              >
                <h1 className="font-display text-2xl md:text-5xl lg:text-7xl text-white font-light leading-[1.1] mb-3 md:mb-6">
                  {title}
                  <br />
                  <span className="text-[#c9a87c]">{subtitle}</span>
                </h1>

                <p className="text-white/80 text-sm md:text-xl mb-4 md:mb-8 max-w-lg font-light">
                  {description}
                </p>

                <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
                  <Button
                    asChild
                    size="lg"
                    className="bg-white hover:bg-white/90 text-gray-900 px-6 md:px-8 py-3 md:py-6 text-sm md:text-base font-medium rounded-lg"
                  >
                    <Link to={slide.buttonLink} className="flex items-center gap-2">
                      {buttonText}
                      <ArrowRight className="w-4 h-4 md:w-5 md:h-5" />
                    </Link>
                  </Button>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Slide Indicators */}
        {sliderSettings!.slides.length > 1 && (
          <div className="absolute bottom-4 md:bottom-8 left-1/2 -translate-x-1/2 z-20 flex gap-2">
            {sliderSettings!.slides.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`w-2 h-2 md:w-3 md:h-3 rounded-full transition-all ${
                  index === currentSlide 
                    ? 'bg-white w-6 md:w-8' 
                    : 'bg-white/50 hover:bg-white/70'
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        )}
      </section>
    );
  }

  // Banner Mode (Static hero from HomepageSectionsManager)
  if (useBanner && bannerSettings) {
    const title = isArabic ? bannerSettings.titleAr : bannerSettings.title;
    const subtitle = isArabic ? bannerSettings.subtitleAr : bannerSettings.subtitle;
    const description = isArabic ? bannerSettings.descriptionAr : bannerSettings.description;
    const buttonText = isArabic ? bannerSettings.buttonTextAr : bannerSettings.buttonText;
    const secondaryButtonText = isArabic ? bannerSettings.secondaryButtonTextAr : bannerSettings.secondaryButtonText;
    const backgroundImage = bannerSettings.backgroundImage || heroBg;

    return (
      <section className="relative min-h-[60vh] md:min-h-[85vh] flex items-center overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <img
            src={backgroundImage}
            alt="Premium plants collection"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-transparent" />
        </div>

        {/* Content */}
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-2xl">
            <motion.span
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-block text-white/80 text-xs md:text-base uppercase tracking-[0.3em] mb-2 md:mb-4 font-medium"
            >
              Green Grass Store
            </motion.span>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h1 className="font-display text-2xl md:text-5xl lg:text-7xl text-white font-light leading-[1.1] mb-3 md:mb-6">
                {title}
                <br />
                <span className="text-[#c9a87c]">{subtitle}</span>
              </h1>

              <p className="text-white/80 text-sm md:text-xl mb-4 md:mb-8 max-w-lg font-light">
                {description}
              </p>

              <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
                <Button
                  asChild
                  size="lg"
                  className="bg-white hover:bg-white/90 text-gray-900 px-6 md:px-8 py-3 md:py-6 text-sm md:text-base font-medium rounded-lg"
                >
                  <Link to={bannerSettings.buttonLink} className="flex items-center gap-2">
                    {buttonText}
                    <ArrowRight className="w-4 h-4 md:w-5 md:h-5" />
                  </Link>
                </Button>
                {secondaryButtonText && bannerSettings.secondaryButtonLink && (
                  <Button
                    asChild
                    variant="outline"
                    size="lg"
                    className="border-white text-white hover:bg-white/10 px-6 md:px-8 py-3 md:py-6 text-sm md:text-base font-medium rounded-lg"
                  >
                    <Link to={bannerSettings.secondaryButtonLink} className="flex items-center gap-2">
                      {secondaryButtonText}
                    </Link>
                  </Button>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    );
  }

  return null;
};