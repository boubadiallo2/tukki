DROP POLICY IF EXISTS "Super admins can view all profiles" ON public.profiles;

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'super_admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE POLICY "Super admins can view all profiles" 
ON public.profiles FOR SELECT 
TO authenticated 
USING ( public.is_super_admin() );
