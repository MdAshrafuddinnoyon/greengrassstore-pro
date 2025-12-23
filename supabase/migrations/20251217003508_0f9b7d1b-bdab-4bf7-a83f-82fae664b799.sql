-- Allow authenticated users to create orders with their user_id
CREATE POLICY "Users can create their own orders"
ON public.orders
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Allow guest checkout (anonymous users can create orders without user_id)
CREATE POLICY "Guest users can create orders"
ON public.orders
FOR INSERT
TO anon
WITH CHECK (user_id IS NULL);

-- Allow authenticated users to update their own orders (for status tracking etc)
CREATE POLICY "Users can update their own orders"
ON public.orders
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);