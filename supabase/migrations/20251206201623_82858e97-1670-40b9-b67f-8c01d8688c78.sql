-- Create categories table for dynamic category management
CREATE TABLE public.categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  name_ar TEXT,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  description_ar TEXT,
  image TEXT,
  parent_id UUID REFERENCES public.categories(id),
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Public can view active categories
CREATE POLICY "Anyone can view active categories" 
ON public.categories 
FOR SELECT 
USING (is_active = true);

-- Admins can manage categories
CREATE POLICY "Admins can manage categories" 
ON public.categories 
FOR ALL 
USING (has_role(auth.uid(), 'admin'));

-- Insert default categories
INSERT INTO public.categories (name, name_ar, slug, display_order) VALUES
('Plants', 'نباتات', 'plants', 1),
('Flowers', 'زهور', 'flowers', 2),
('Pots', 'أواني', 'pots', 3),
('Greenery', 'خضرة', 'greenery', 4),
('Hanging', 'معلقات', 'hanging', 5),
('Gifts', 'هدايا', 'gifts', 6),
('Sale', 'تخفيضات', 'sale', 7);

-- Add trigger for updated_at
CREATE TRIGGER update_categories_updated_at
BEFORE UPDATE ON public.categories
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();