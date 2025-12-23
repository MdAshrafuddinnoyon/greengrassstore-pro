import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Instagram } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import gardenFlowers from "@/assets/garden-flowers.jpg";
import plantPot from "@/assets/plant-pot.jpg";
import hangingPlants from "@/assets/hanging-plants.jpg";
import ikebana from "@/assets/ikebana.jpg";
import ficusPlant from "@/assets/ficus-plant.jpg";
import bluePot from "@/assets/blue-pot.jpg";

const defaultImages = [
  gardenFlowers,
  plantPot,
  hangingPlants,
  ikebana,
  ficusPlant,
  bluePot,
];

interface InstagramSettings {
  enabled: boolean;
  username: string;
  profileUrl: string;
  title: string;
  images: string[];
}

export const InstagramSection = () => {
  const [settings, setSettings] = useState<InstagramSettings>({
    enabled: true,
    username: "@greengrassstore",
    profileUrl: "https://instagram.com/greengrassstore",
    title: "GREEN GRASS",
    images: []
  });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data, error } = await supabase
          .from('site_settings')
          .select('setting_value')
          .eq('setting_key', 'instagram_section')
          .single();
        
        if (data && !error) {
          const value = data.setting_value as Record<string, unknown>;
          setSettings({
            enabled: (value.enabled as boolean) ?? true,
            username: (value.username as string) || "@greengrassstore",
            profileUrl: (value.profileUrl as string) || "https://instagram.com/greengrassstore",
            title: (value.title as string) || "GREEN GRASS",
            images: (value.images as string[]) || []
          });
        }
      } catch (error) {
        console.error('Error fetching instagram settings:', error);
      }
    };
    
    fetchSettings();
  }, []);

  if (!settings.enabled) return null;

  // Use custom images if available, otherwise use defaults
  const displayImages = settings.images.length > 0 ? settings.images : defaultImages;

  return (
    <section className="py-12 md:py-16 bg-[#f8f8f5]">
      <div className="container mx-auto px-4 mb-8 text-center">
        <a
          href={settings.profileUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-sm uppercase tracking-widest font-medium text-gray-700 hover:text-green-700 transition-colors"
        >
          <Instagram className="w-5 h-5" />
          {settings.username}
        </a>
        <h2 className="font-display text-2xl md:text-3xl font-normal text-gray-900 mt-2">
          {settings.title}
        </h2>
      </div>
      
      <div className="grid grid-cols-3 md:grid-cols-6 gap-1">
        {displayImages.slice(0, 6).map((image, index) => (
          <motion.a
            key={index}
            href={settings.profileUrl}
            target="_blank"
            rel="noopener noreferrer"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: index * 0.05 }}
            viewport={{ once: true }}
            className="relative aspect-square overflow-hidden group"
          >
            <img
              src={image}
              alt={`Instagram post ${index + 1}`}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              onError={(e) => {
                // Fallback to default image if custom image fails to load
                if (defaultImages[index]) {
                  (e.target as HTMLImageElement).src = defaultImages[index];
                }
              }}
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center">
              <Instagram className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>
          </motion.a>
        ))}
      </div>
    </section>
  );
};