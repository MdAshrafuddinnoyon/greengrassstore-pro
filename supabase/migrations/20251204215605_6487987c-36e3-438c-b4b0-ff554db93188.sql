-- Create custom_requirements table for users to submit custom requests
CREATE TABLE public.custom_requirements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  requirement_type TEXT NOT NULL DEFAULT 'custom',
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  budget TEXT,
  timeline TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.custom_requirements ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own requirements"
ON public.custom_requirements
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own requirements"
ON public.custom_requirements
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_custom_requirements_updated_at
BEFORE UPDATE ON public.custom_requirements
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();