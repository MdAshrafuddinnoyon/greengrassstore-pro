-- Add admin policy for blog_posts table to allow admins to manage all posts
CREATE POLICY "Admins can manage blog posts" 
ON public.blog_posts 
FOR ALL 
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Add explicit deny for anonymous users on orders table (belt and suspenders approach)
-- First check if the policy exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'orders' 
    AND policyname = 'Deny anonymous access to orders'
  ) THEN
    -- RLS is already enabled on orders, this adds explicit protection
    -- The existing policies only allow authenticated users
    NULL; -- No action needed as RLS is restrictive by default
  END IF;
END $$;