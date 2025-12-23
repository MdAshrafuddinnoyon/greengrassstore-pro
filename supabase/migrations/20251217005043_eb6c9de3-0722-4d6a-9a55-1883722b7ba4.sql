-- Drop existing admin-only policy
DROP POLICY IF EXISTS "Admins can manage products" ON public.products;

-- Create policy for admin role to manage products (full CRUD)
CREATE POLICY "Admins can manage products"
ON public.products
FOR ALL
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role)
);

-- Create policy for store_manager role to manage products (full CRUD)
CREATE POLICY "Store managers can manage products"
ON public.products
FOR ALL
TO authenticated
USING (
  has_role(auth.uid(), 'store_manager'::app_role)
)
WITH CHECK (
  has_role(auth.uid(), 'store_manager'::app_role)
);