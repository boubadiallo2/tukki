-- Politique permettant aux administrateurs de compagnie de voir les profils de leur équipe
DROP POLICY IF EXISTS "Company admins can view their team profiles" ON public.profiles;

CREATE POLICY "Company admins can view their team profiles" 
ON public.profiles FOR SELECT 
TO authenticated 
USING (
  company_id = (
    SELECT company_id 
    FROM public.profiles 
    WHERE id = auth.uid() 
    AND role = 'company'
  )
);
