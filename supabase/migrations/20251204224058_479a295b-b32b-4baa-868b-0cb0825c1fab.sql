-- Drop existing policies
DROP POLICY IF EXISTS "Users can create their own requirements" ON public.custom_requirements;
DROP POLICY IF EXISTS "Users can view their own requirements" ON public.custom_requirements;

-- Create new policies explicitly for authenticated users only
CREATE POLICY "Authenticated users can create their own requirements" 
ON public.custom_requirements 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Authenticated users can view their own requirements" 
ON public.custom_requirements 
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

-- Add policy for users to update their own requirements
CREATE POLICY "Authenticated users can update their own requirements" 
ON public.custom_requirements 
FOR UPDATE 
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);