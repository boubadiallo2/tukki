-- 1. Autoriser les Super Admins à supprimer des compagnies
DROP POLICY IF EXISTS "Super admins can delete companies" ON public.companies;
CREATE POLICY "Super admins can delete companies" 
ON public.companies FOR DELETE 
TO authenticated 
USING ( public.is_super_admin() );

-- 2. Nettoyer la table en supprimant les compagnies brouillons (celles sans compte associé)
DELETE FROM public.companies 
WHERE id NOT IN (
    SELECT company_id 
    FROM public.profiles 
    WHERE company_id IS NOT NULL
);
