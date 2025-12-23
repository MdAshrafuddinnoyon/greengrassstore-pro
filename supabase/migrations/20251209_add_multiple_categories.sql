/*
  # Add Multiple Categories Support
  
  1. New Tables
    - `product_categories` - Junction table linking products to multiple categories
  
  2. Changes
    - Add support for products to belong to multiple categories
    - Keep existing single category/subcategory fields for backward compatibility
*/

-- Create product_categories junction table for multiple categories
CREATE TABLE IF NOT EXISTS public.product_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  subcategory TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(product_id, category, subcategory)
);

-- Enable RLS on product_categories
ALTER TABLE public.product_categories ENABLE ROW LEVEL SECURITY;

-- Public can view categories for active products
CREATE POLICY "Anyone can view product categories" 
ON public.product_categories 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.products 
    WHERE products.id = product_categories.product_id 
    AND products.is_active = true
  )
);

-- Admins can manage product categories
CREATE POLICY "Admins can manage product categories" 
ON public.product_categories 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create indexes for better performance
CREATE INDEX idx_product_categories_product_id ON public.product_categories(product_id);
CREATE INDEX idx_product_categories_category ON public.product_categories(category);
CREATE INDEX idx_product_categories_display_order ON public.product_categories(display_order);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_categories TO authenticated;
GRANT SELECT ON public.product_categories TO anon;
