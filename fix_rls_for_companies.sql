-- Script pour autoriser temporairement la mise à jour des statuts des compagnies
-- à n'importe quel utilisateur connecté (pour débloquer la situation).

DROP POLICY IF EXISTS "Super admins can update companies" ON public.companies;

CREATE POLICY "Super admins can update companies" 
ON public.companies FOR UPDATE 
TO authenticated 
USING ( true )
WITH CHECK ( true );
