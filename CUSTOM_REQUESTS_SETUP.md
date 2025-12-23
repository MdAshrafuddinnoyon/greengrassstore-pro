# Custom Requirements Table Setup Guide

## Problem
The `custom_requirements` table doesn't exist in your Supabase database, which is why Custom Requests are not showing in the Admin Dashboard.

## Solution
Run the following SQL in your Supabase Dashboard:

1. Go to your Supabase Dashboard
2. Navigate to **SQL Editor**
3. Create a new query and paste the following SQL:

```sql
-- ============================================
-- STEP 1: Create the table
-- ============================================
CREATE TABLE IF NOT EXISTS public.custom_requirements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  requirement_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  budget TEXT,
  timeline TEXT,
  status TEXT DEFAULT 'pending',
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- STEP 2: Enable RLS
-- ============================================
ALTER TABLE public.custom_requirements ENABLE ROW LEVEL SECURITY;

-- ============================================
-- STEP 3: Create security definer function for role checking
-- ============================================
CREATE OR REPLACE FUNCTION public.has_admin_role(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('admin', 'moderator', 'store_manager')
  )
$$;

-- ============================================
-- STEP 4: Create RLS policies
-- ============================================

-- Policy: Users can view their own requests
CREATE POLICY "Users can view own custom requirements"
  ON public.custom_requirements
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own requests
CREATE POLICY "Users can insert custom requirements"
  ON public.custom_requirements
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own requests
CREATE POLICY "Users can update own custom requirements"
  ON public.custom_requirements
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy: Admins can view all requests
CREATE POLICY "Admins can view all custom requirements"
  ON public.custom_requirements
  FOR SELECT
  TO authenticated
  USING (public.has_admin_role(auth.uid()));

-- Policy: Admins can update all requests
CREATE POLICY "Admins can update all custom requirements"
  ON public.custom_requirements
  FOR UPDATE
  TO authenticated
  USING (public.has_admin_role(auth.uid()));

-- Policy: Admins can delete requests
CREATE POLICY "Admins can delete custom requirements"
  ON public.custom_requirements
  FOR DELETE
  TO authenticated
  USING (public.has_admin_role(auth.uid()));

-- ============================================
-- STEP 5: Create indexes for performance
-- ============================================
CREATE INDEX IF NOT EXISTS idx_custom_requirements_user_id ON public.custom_requirements(user_id);
CREATE INDEX IF NOT EXISTS idx_custom_requirements_status ON public.custom_requirements(status);
CREATE INDEX IF NOT EXISTS idx_custom_requirements_type ON public.custom_requirements(requirement_type);

-- ============================================
-- STEP 6: Enable realtime
-- ============================================
ALTER TABLE public.custom_requirements REPLICA IDENTITY FULL;
```

4. Click **Run** to execute the SQL

## Requirement Types
The system uses these `requirement_type` values:
- `custom_plant` - Custom plant arrangements
- `bulk_order` - Bulk/wholesale orders  
- `event_decoration` - Event decoration requests
- `refund` - Refund requests
- `return` - Return requests
- `return_request` - Return requests (alternative)

## After Running
- Refresh the Admin Dashboard
- Go to **Custom Requests** in the sidebar
- The **All Requests** tab shows all custom requests
- The **Refund/Return Requests** tab filters only return/refund type requests

## Testing
To test, create a sample request:
```sql
INSERT INTO public.custom_requirements (user_id, name, email, requirement_type, title, description, status)
VALUES (
  (SELECT id FROM auth.users LIMIT 1),
  'Test Customer',
  'test@example.com',
  'custom_plant',
  'Test Request',
  'This is a test custom request',
  'pending'
);

-- Create a return request for testing
INSERT INTO public.custom_requirements (user_id, name, email, requirement_type, title, description, status)
VALUES (
  (SELECT id FROM auth.users LIMIT 1),
  'Return Customer',
  'return@example.com',
  'return',
  'Product Return Request',
  'I want to return my recent purchase',
  'pending'
);
```
