-- Create discount_coupons table
CREATE TABLE public.discount_coupons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  description TEXT,
  discount_type TEXT NOT NULL DEFAULT 'percentage' CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value NUMERIC NOT NULL DEFAULT 0,
  min_order_amount NUMERIC DEFAULT 0,
  max_uses INTEGER DEFAULT NULL,
  used_count INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  starts_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.discount_coupons ENABLE ROW LEVEL SECURITY;

-- Admins can manage coupons
CREATE POLICY "Admins can manage coupons"
ON public.discount_coupons
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Anyone can view active coupons (for validation)
CREATE POLICY "Anyone can view active coupons"
ON public.discount_coupons
FOR SELECT
USING (is_active = true AND (expires_at IS NULL OR expires_at >= now()));

-- Create trigger for updated_at
CREATE TRIGGER update_discount_coupons_updated_at
BEFORE UPDATE ON public.discount_coupons
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();