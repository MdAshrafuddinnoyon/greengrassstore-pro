-- Create popup_notifications table for promotional popups
CREATE TABLE public.popup_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  title_ar TEXT,
  description TEXT,
  description_ar TEXT,
  image_url TEXT,
  button_text TEXT,
  button_text_ar TEXT,
  button_link TEXT,
  is_active BOOLEAN NOT NULL DEFAULT false,
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  display_frequency TEXT DEFAULT 'once_per_session', -- 'once_per_session', 'every_visit', 'once_per_day'
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.popup_notifications ENABLE ROW LEVEL SECURITY;

-- Anyone can view active popups
CREATE POLICY "Anyone can view active popups" 
ON public.popup_notifications 
FOR SELECT 
USING (is_active = true AND (start_date IS NULL OR start_date <= now()) AND (end_date IS NULL OR end_date >= now()));

-- Admins can manage popups
CREATE POLICY "Admins can manage popups" 
ON public.popup_notifications 
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Update trigger
CREATE TRIGGER update_popup_notifications_updated_at
BEFORE UPDATE ON public.popup_notifications
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();