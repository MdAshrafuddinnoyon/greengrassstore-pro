-- Create VIP Tiers table
CREATE TABLE public.vip_tiers (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  name_ar text,
  min_spend numeric NOT NULL DEFAULT 0,
  max_spend numeric,
  discount_percent numeric NOT NULL DEFAULT 0,
  color_gradient text DEFAULT 'from-green-400 to-green-600',
  icon text DEFAULT 'crown',
  benefits jsonb DEFAULT '[]'::jsonb,
  benefits_ar jsonb DEFAULT '[]'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  display_order integer NOT NULL DEFAULT 0,
  is_best_value boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create VIP Members table to track user VIP status
CREATE TABLE public.vip_members (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tier_id uuid REFERENCES public.vip_tiers(id) ON DELETE SET NULL,
  total_spend numeric NOT NULL DEFAULT 0,
  points_earned integer NOT NULL DEFAULT 0,
  points_redeemed integer NOT NULL DEFAULT 0,
  joined_at timestamp with time zone NOT NULL DEFAULT now(),
  tier_updated_at timestamp with time zone,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Create VIP Settings table for program configuration
CREATE TABLE public.vip_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  program_name text NOT NULL DEFAULT 'Green Grass VIP Program',
  program_name_ar text DEFAULT 'برنامج جرين جراس VIP',
  program_description text,
  program_description_ar text,
  hero_title text DEFAULT 'Green Grass VIP Program',
  hero_title_ar text DEFAULT 'برنامج جرين جراس VIP',
  hero_subtitle text,
  hero_subtitle_ar text,
  is_enabled boolean NOT NULL DEFAULT true,
  points_per_aed numeric DEFAULT 1,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.vip_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vip_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vip_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for vip_tiers
CREATE POLICY "Anyone can view active VIP tiers" 
ON public.vip_tiers 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Admins can manage VIP tiers" 
ON public.vip_tiers 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for vip_members
CREATE POLICY "Users can view their own VIP membership" 
ON public.vip_members 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own VIP membership" 
ON public.vip_members 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all VIP members" 
ON public.vip_members 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for vip_settings
CREATE POLICY "Anyone can view VIP settings" 
ON public.vip_settings 
FOR SELECT 
USING (true);

CREATE POLICY "Admins can manage VIP settings" 
ON public.vip_settings 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Insert default VIP tiers
INSERT INTO public.vip_tiers (name, name_ar, min_spend, max_spend, discount_percent, color_gradient, benefits, benefits_ar, display_order, is_best_value) VALUES
('Green', 'أخضر', 0, 999, 5, 'from-green-400 to-green-600', '["5% off all purchases", "Birthday reward", "Early access to sales"]'::jsonb, '["خصم 5% على جميع المشتريات", "مكافأة عيد الميلاد", "وصول مبكر للتخفيضات"]'::jsonb, 1, false),
('Gold', 'ذهبي', 1000, 4999, 10, 'from-yellow-400 to-amber-500', '["10% off all purchases", "Free delivery", "Exclusive previews", "Priority support"]'::jsonb, '["خصم 10% على جميع المشتريات", "توصيل مجاني", "معاينات حصرية", "دعم أولوية"]'::jsonb, 2, false),
('Platinum', 'بلاتيني', 5000, NULL, 15, 'from-gray-300 to-gray-500', '["15% off all purchases", "Free express delivery", "VIP events access", "Personal plant consultant", "Exclusive gifts"]'::jsonb, '["خصم 15% على جميع المشتريات", "توصيل سريع مجاني", "الوصول إلى فعاليات VIP", "مستشار نباتات شخصي", "هدايا حصرية"]'::jsonb, 3, true);

-- Insert default VIP settings
INSERT INTO public.vip_settings (program_name, program_name_ar, program_description, program_description_ar, hero_title, hero_title_ar, hero_subtitle, hero_subtitle_ar) VALUES
('Green Grass VIP Program', 'برنامج جرين جراس VIP', 'Join our exclusive VIP program and enjoy premium benefits, special discounts, and personalized service.', 'انضم إلى برنامج VIP الحصري واستمتع بمزايا متميزة وخصومات خاصة وخدمة شخصية.', 'Green Grass VIP Program', 'برنامج جرين جراس VIP', 'Join our exclusive VIP program and enjoy premium benefits, special discounts, and personalized service.', 'انضم إلى برنامج VIP الحصري واستمتع بمزايا متميزة وخصومات خاصة وخدمة شخصية.');

-- Create updated_at trigger for all tables
CREATE TRIGGER update_vip_tiers_updated_at
BEFORE UPDATE ON public.vip_tiers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_vip_members_updated_at
BEFORE UPDATE ON public.vip_members
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_vip_settings_updated_at
BEFORE UPDATE ON public.vip_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();