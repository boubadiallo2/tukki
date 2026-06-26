-- Script to fix infinite recursion in RLS policies on the profiles table

-- 1. Create a secure function to get the current user's role
CREATE OR REPLACE FUNCTION public.get_auth_role()
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

-- 2. Create a secure function to get the current user's company_id
CREATE OR REPLACE FUNCTION public.get_auth_company_id()
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT company_id FROM public.profiles WHERE id = auth.uid();
$$;

-- 3. Drop the problematic recursive policies on profiles
DROP POLICY IF EXISTS "Super admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Company admins can view their team profiles" ON public.profiles;

-- 4. Recreate them using the secure functions
CREATE POLICY "Super admins can view all profiles" 
ON public.profiles FOR SELECT 
TO authenticated 
USING ( public.get_auth_role() = 'super_admin' );

CREATE POLICY "Company admins can view their team profiles" 
ON public.profiles FOR SELECT 
TO authenticated 
USING (
  company_id = public.get_auth_company_id()
);
