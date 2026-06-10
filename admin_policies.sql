-- 1. Politique pour permettre au Super Admin de créer des compagnies
DROP POLICY IF EXISTS "Super admins can insert companies" ON public.companies;
CREATE POLICY "Super admins can insert companies" 
ON public.companies FOR INSERT 
TO authenticated 
WITH CHECK ( public.is_super_admin() );

-- 2. Politique pour permettre au Super Admin de mettre à jour les compagnies (ex: modifier rating, etc.)
DROP POLICY IF EXISTS "Super admins can update companies" ON public.companies;
CREATE POLICY "Super admins can update companies" 
ON public.companies FOR UPDATE 
TO authenticated 
USING ( public.is_super_admin() );

-- 3. Politique pour permettre au Super Admin de mettre à jour les profils (ex: associer company_id)
DROP POLICY IF EXISTS "Super admins can update profiles" ON public.profiles;
CREATE POLICY "Super admins can update profiles" 
ON public.profiles FOR UPDATE 
TO authenticated 
USING ( public.is_super_admin() );
