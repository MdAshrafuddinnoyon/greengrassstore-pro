-- Drop existing RESTRICTIVE policies
DROP POLICY IF EXISTS "Authenticated users can create their own requirements" ON public.custom_requirements;
DROP POLICY IF EXISTS "Authenticated users can update their own requirements" ON public.custom_requirements;
DROP POLICY IF EXISTS "Authenticated users can view their own requirements" ON public.custom_requirements;

-- Create PERMISSIVE policies (default) explicitly for authenticated users only
-- This ensures anonymous users cannot access the table at all

CREATE POLICY "Only authenticated users can view their own requirements" 
ON public.custom_requirements 
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Only authenticated users can insert their own requirements" 
ON public.custom_requirements 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Only authenticated users can update their own requirements" 
ON public.custom_requirements 
FOR UPDATE 
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Only authenticated users can delete their own requirements" 
ON public.custom_requirements 
FOR DELETE 
TO authenticated
USING (auth.uid() = user_id);