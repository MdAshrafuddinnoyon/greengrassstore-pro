-- Create product_variants table for variable products (size, color, etc.)
CREATE TABLE public.product_variants (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    sku TEXT,
    price NUMERIC NOT NULL DEFAULT 0,
    compare_at_price NUMERIC,
    stock_quantity INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    option1_name TEXT,
    option1_value TEXT,
    option2_name TEXT,
    option2_value TEXT,
    option3_name TEXT,
    option3_value TEXT,
    image_url TEXT,
    weight NUMERIC,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;

-- RLS policies for product_variants
CREATE POLICY "Anyone can view active variants"
ON public.product_variants
FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins can manage variants"
ON public.product_variants
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add product type column to products table (simple or variable)
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS product_type TEXT NOT NULL DEFAULT 'simple';

-- Add product options columns for variable products
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS option1_name TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS option1_values TEXT[];
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS option2_name TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS option2_values TEXT[];
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS option3_name TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS option3_values TEXT[];

-- Create trigger for updated_at
CREATE TRIGGER update_product_variants_updated_at
BEFORE UPDATE ON public.product_variants
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();