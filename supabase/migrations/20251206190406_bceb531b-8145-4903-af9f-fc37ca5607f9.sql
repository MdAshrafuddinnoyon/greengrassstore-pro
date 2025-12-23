-- Create newsletter subscribers table
CREATE TABLE public.newsletter_subscribers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  subscribed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_active BOOLEAN NOT NULL DEFAULT true,
  source TEXT DEFAULT 'website'
);

-- Enable RLS
ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Anyone can subscribe" 
ON public.newsletter_subscribers 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Admins can manage subscribers" 
ON public.newsletter_subscribers 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add indexes
CREATE INDEX idx_subscribers_email ON public.newsletter_subscribers(email);
CREATE INDEX idx_subscribers_active ON public.newsletter_subscribers(is_active);