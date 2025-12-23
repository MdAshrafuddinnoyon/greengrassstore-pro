# Custom Requirements Table Setup Guide

## Problem
The `custom_requirements` table doesn't exist in your Supabase database, which is why Custom Requests are not showing in the Admin Dashboard.

## Solution
Run the following SQL in your Supabase Dashboard:

1. Go to your Supabase Dashboard
2. Navigate to **SQL Editor**
3. Create a new query and paste the following SQL:

```sql
-- Create custom_requirements table
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

-- Enable RLS
ALTER TABLE public.custom_requirements ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own requests
CREATE POLICY "Users can view their own custom requirements"
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
CREATE POLICY "Users can update their own custom requirements"
  ON public.custom_requirements
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy: Admins can view all requests
CREATE POLICY "Admins can view all custom requirements"
  ON public.custom_requirements
  FOR SELECT
  TO authenticated
  USING (
    (SELECT raw_user_meta_data->>'role' FROM auth.users WHERE id = auth.uid()) IN ('admin', 'moderator', 'store_manager')
  );

-- Policy: Admins can update all requests
CREATE POLICY "Admins can update all custom requirements"
  ON public.custom_requirements
  FOR UPDATE
  TO authenticated
  USING (
    (SELECT raw_user_meta_data->>'role' FROM auth.users WHERE id = auth.uid()) IN ('admin', 'moderator')
  );

-- Policy: Admins can delete requests
CREATE POLICY "Admins can delete custom requirements"
  ON public.custom_requirements
  FOR DELETE
  TO authenticated
  USING (
    (SELECT raw_user_meta_data->>'role' FROM auth.users WHERE id = auth.uid()) = 'admin'
  );

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_custom_requirements_user_id ON public.custom_requirements(user_id);
CREATE INDEX IF NOT EXISTS idx_custom_requirements_status ON public.custom_requirements(status);

-- Enable realtime
ALTER TABLE public.custom_requirements REPLICA IDENTITY FULL;
```

4. Click **Run** to execute the SQL

## After Running
- Refresh the Admin Dashboard
- Custom Requests should now work correctly
- Users can submit custom requests
- Admins can view and manage all requests

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
```
